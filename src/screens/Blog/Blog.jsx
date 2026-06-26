import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./blog.css";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";

import {
  checkLogin,
  fetchBlogHtml,
  getBlog,
  postComment,
  toggleLike,
  editComment,
  deleteComment,
} from "../../api/Api";
import Swal from "sweetalert2";
import { RecommendedBlogs } from "../Blogs/Blogs";
import { FiShare2, FiEdit2, FiTrash2 } from "react-icons/fi";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import BlogSkeleton from "./BlogSkeleton";
import BlogContentIframe from "./BlogContentIframe";
import CommentsSection from "./CommentsSection";

const pick = (el, attrs) => {
  const out = {};
  attrs.forEach((a) => {
    const v = el.getAttribute(a);
    if (v != null) out[a] = v;
  });
  return out;
};

const dedupeMeta = (arr) => {
  const seen = new Set();
  return arr.filter((m) => {
    const key =
      (m.name || m.property || m.itemprop || m["http-equiv"] || "x") +
      "|" +
      (m.content || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseSeoFromHead = (headHtml) => {
  if (!headHtml) return { title: "", metas: [], links: [], jsonLd: [] };

  const doc = new DOMParser().parseFromString(
    `<!doctype html><html><head>${headHtml}</head><body></body></html>`,
    "text/html"
  );

  const head = doc.head;
  const title = head.querySelector("title")?.textContent?.trim() || "";

  const metas = Array.from(head.querySelectorAll("meta"))
    .map((m) =>
      pick(m, ["name", "property", "itemprop", "http-equiv", "content"])
    )
    .filter((m) => m.content);

  const links = Array.from(head.querySelectorAll("link"))
    .map((l) => pick(l, ["rel", "href", "as", "type", "hreflang", "sizes"]))
    .filter((l) => l.rel && l.href);

  const jsonLd = Array.from(
    head.querySelectorAll('script[type="application/ld+json"]')
  )
    .map((s) => s.textContent?.trim())
    .filter(Boolean);

  return {
    title,
    metas: dedupeMeta(metas),
    links,
    jsonLd,
  };
};

const LS_KEY = "likedBlogs";
const readLikedFromLS = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
};
const writeLikedToLS = (arr) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch { }
};
const setLSLike = (slug, value) => {
  const arr = readLikedFromLS();
  const i = arr.indexOf(slug);
  if (value && i === -1) {
    arr.push(slug);
    writeLikedToLS(arr);
  } else if (!value && i !== -1) {
    arr.splice(i, 1);
    writeLikedToLS(arr);
  }
};
const getLSLike = (slug) => readLikedFromLS().includes(slug);

const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
};
const getUserIdFromToken = (token) => {
  const p = decodeJwt(token) || {};
  return (
    p.user_id ||
    p.sub ||
    p.id ||
    p.customer_id ||
    p.uid ||
    null
  );
};

const normalizeComments = (raw = [], currentUserId = null) => {
  const byId = {};
  const roots = [];

  raw.forEach((c) => {
    const authorId = c.user_id ?? c.customer_id ?? c.author_id ?? null;
    const item = {
      id: c.id ?? c.comment_id ?? String(Math.random()),
      user_name: c.customer_name || c.name || "User",
      user_avatar: c.profile_picture || c.avatar_url || "",
      created_at: c.created_at || c.date || new Date().toISOString(),
      text: c.comment_text || c.text || "",
      parent_comment_id:
        c.parent_comment_id !== undefined
          ? c.parent_comment_id
          : c.parent_id ?? null,
      user_id: authorId,
      is_owner:
        !!(c.is_owner || c.mine || c.isMine) ||
        (currentUserId != null && authorId != null && String(authorId) === String(currentUserId)),
      children: [],
    };
    byId[item.id] = item;
  });

  Object.values(byId).forEach((item) => {
    const pid = item.parent_comment_id;
    if (pid && byId[pid]) {
      byId[pid].children.push(item);
    } else {
      roots.push(item);
    }
  });

  const sortTree = (arr) => {
    arr.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    arr.forEach((n) => n.children && sortTree(n.children));
  };
  sortTree(roots);
  return roots;
};


const hasMirroredAncestor = (el) => {
  try {
    let node = el;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      const t = cs.transform || cs.webkitTransform;
      if (t && t !== "none") {
        if (typeof DOMMatrixReadOnly !== "undefined") {
          const m = new DOMMatrixReadOnly(t);
          // m.a < 0 => mirrored along X
          if (m.a < 0) return true;
        } else if (/matrix\(([^)]+)\)/.test(t)) {
          const a = parseFloat(t.split("(")[1].split(",")[0]);
          if (!Number.isNaN(a) && a < 0) return true;
        }
      }
      node = node.parentElement;
    }
  } catch { }
  return false;
};

const SmartTextarea = React.forwardRef(
  (
    {
      className = "", style, value, onChange, placeholder, rows = 3, autoFocus = false, onKeyDown, counterMirror = false, ...rest
    },
    refFromParent
  ) => {
    const innerRef = React.useRef(null);
    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof refFromParent === "function") refFromParent(node);
      else if (refFromParent && typeof refFromParent === "object")
        refFromParent.current = node;
    };

    const [needsMirrorFix, setNeedsMirrorFix] = React.useState(false);

    React.useLayoutEffect(() => {
      if (!innerRef.current) return;
      setNeedsMirrorFix(hasMirroredAncestor(innerRef.current));
    }, [innerRef.current]);

    const appliedStyle = {
      direction: "ltr",
      unicodeBidi: "plaintext",
      textAlign: "left",
      writingMode: "horizontal-tb",
      transform: counterMirror && needsMirrorFix ? "scaleX(-1)" : undefined,
      ...style,
    };

    return (
      <textarea
        ref={combinedRef}
        className={`ltr-input ${needsMirrorFix ? "fix-mirror" : ""} ${className}`}
        dir="ltr"
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        style={appliedStyle}
        {...rest}
      />
    );
  }
);
SmartTextarea.displayName = "SmartTextarea";

export const Blog = () => {
  const { blogUrl } = useParams();

  const [blogData, setBlogData] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [summary, setSummary] = useState([]);
  const [slidesPerView, setSlidesPerView] = useState("auto");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [extractedContent, setExtractedContent] = useState([]);

  const [headHtml, setHeadHtml] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  const [seoFromHtml, setSeoFromHtml] = useState({
    title: "",
    metas: [],
    links: [],
    jsonLd: [],
  });

  const [comments, setComments] = useState([]);
  const [flatCount, setFlatCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editDrafts, setEditDrafts] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);

  const updateSlidesPerView = () => {
    if (window.innerWidth < 700) setSlidesPerView(1);
    else setSlidesPerView("auto");
  };

  useEffect(() => {
    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  useEffect(() => {
    if (blogUrl) fetchBlog(blogUrl);
  }, [blogUrl]);

  const handleEdit = useCallback((commentId, value) => {
    setEditDrafts((d) => ({ ...d, [commentId]: value }));
  }, []);

  const handleReply = useCallback((parentId, value) => {
    setReplyDrafts((d) => ({ ...d, [parentId]: value }));
  }, []);


  const fetchBlog = async (slug) => {
    try {
      setLoading(true);

      const token = checkLogin();
      let userIdFromToken = null;
      if (token) {
        userIdFromToken = getUserIdFromToken(token);
        if (userIdFromToken) setCurrentUserId(userIdFromToken);
      }

      const response = await getBlog(slug, token);
      const blogItem = Array.isArray(response)
        ? response[0]
        : response?.data?.[0] || response;

      if (!blogItem || !blogItem.blog_description_url) {
        throw new Error("Blog not found or missing blog_description_url");
      }

      const apiCurrentUserId =
        blogItem?.current_user_id ??
        response?.current_user_id ??
        null;
      if (apiCurrentUserId != null) setCurrentUserId(apiCurrentUserId);

      const html = await fetchBlogHtml(blogItem.blog_description_url);

      const doc = new DOMParser().parseFromString(html, "text/html");
      const headInner = doc.head?.innerHTML || "";
      const bodyInner = doc.body?.innerHTML || html;

      // Assign IDs to headings for ToC
      doc.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
        const t = (h.textContent || "").trim();
        const id = h.id || t.replace(/\s+/g, "-").toLowerCase();
        h.id = id;
      });

      const parsedSeo = parseSeoFromHead(headInner);

      setHeadHtml(headInner);
      setBodyHtml(bodyInner);
      setSeoFromHtml(parsedSeo);

      setBlogData({ ...blogItem, blog_description: bodyInner });

      // likes
      const initialLikes =
        Number(blogItem?.blog_likes_count) ||
        Number(blogItem?.likes_count) ||
        0;
      setLikesCount(initialLikes);

      const apiIsLiked =
        typeof blogItem?.is_liked === "boolean" ? blogItem.is_liked : null;
      if (apiIsLiked !== null) {
        setLiked(apiIsLiked);
        setLSLike(slug, apiIsLiked);
      } else {
        setLiked(getLSLike(slug));
      }

      // comments
      const rawComments =
        blogItem?.comments ||
        blogItem?.blog_comments ||
        response?.comments ||
        [];

      const who = apiCurrentUserId ?? userIdFromToken ?? null;
      setComments(normalizeComments(rawComments, who));
      setFlatCount(
        Array.isArray(rawComments) ? rawComments.length : Number(blogItem?.total_comments) || 0
      );

      generateSummary(bodyInner);
      const extracted = extractContent(bodyInner);
      setExtractedContent(extracted);
    } catch (error) {
      console.error("❌ Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractContent = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
    const result = [];
    elements.forEach((el) => {
      result.push({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim(),
      });
    });
    return result;
  };

  const generateSummary = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (!headings.length) return;

    const summaryData = [];
    const stack = [];

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.substring(1), 10);
      const text = (heading.textContent || "").trim();
      const id = heading.id || text.replace(/\s+/g, "-").toLowerCase();
      heading.id = id;
      const item = { text, id, children: [] };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      if (!stack.length) summaryData.push(item);
      else stack[stack.length - 1].node.children.push(item);

      stack.push({ level, node: item });
    });

    setSummary(summaryData);
  };

  const blogLink = useMemo(
    () => `https://medingen.in/blogs/${blogData?.blog_url || ""}`,
    [blogData?.blog_url]
  );

  const baseHref = useMemo(() => {
    const url = blogData?.blog_description_url;
    if (!url) return "/";
    return url.replace(/\/[^/]*$/, "/");
  }, [blogData?.blog_description_url]);

  const iframeId = useMemo(
    () => `blog-iframe-${blogData?.blog_url || "default"}`,
    [blogData?.blog_url]
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogData?.meta_title || seoFromHtml.title,
          text: "Check out this article from Medingen!",
          url: blogLink,
        });
      } catch (err) {
        console.error("Share canceled or failed:", err);
      }
    } else {
      navigator.clipboard.writeText(blogLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onToggleLike = async () => {
    if (!blogData?.blog_url || liking) return;

    const token = checkLogin();
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Please sign in",
        text: "Log in to like this article.",
        confirmButtonText: "Go to Login",
        showCancelButton: true,
      }).then((r) => {
        if (r.isConfirmed) {
          window.location.href =
            "/login?next=" + encodeURIComponent(window.location.pathname);
        }
      });
      return;
    }

    setLiking(true);

    const prevLiked = liked;
    const prevCount = likesCount;

    // optimistic UI
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setLSLike(blogData.blog_url, !prevLiked);

    try {
      const res = await toggleLike(blogData.blog_url, token);
      if (typeof res?.likes_count === "number") setLikesCount(res.likes_count);
      if (typeof res?.liked === "boolean") {
        setLiked(res.liked);
        setLSLike(blogData.blog_url, res.liked);
      }
    } catch (e) {
      // rollback
      setLiked(prevLiked);
      setLikesCount(prevCount);
      setLSLike(blogData.blog_url, prevLiked);
      Swal.fire({ icon: "error", title: "Could not like", text: e?.message || "Please try again later." });
    } finally {
      setLiking(false);
    }
  };

  // Refresh only the comments + count from getBlog (no spinner flicker)
  const refreshComments = async () => {
    try {
      const token = checkLogin();
      const resp = await getBlog(blogData.blog_url, token);

      const blogItem = Array.isArray(resp) ? resp[0] : resp?.data?.[0] || resp;

      // prefer ID provided by API, else keep current
      const apiCurrentUserId =
        blogItem?.current_user_id ??
        resp?.current_user_id ??
        currentUserId;

      const rawComments =
        blogItem?.comments ||
        blogItem?.blog_comments ||
        resp?.comments ||
        [];

      setComments(normalizeComments(rawComments, apiCurrentUserId));
      setFlatCount(
        Array.isArray(rawComments)
          ? rawComments.length
          : Number(blogItem?.total_comments) || 0
      );
    } catch (err) {
      console.error("Failed to refresh comments:", err);
    }
  };

  const handleSubmitComment = async () => {
    const token = checkLogin();
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Please sign in",
        text: "Log in to comment.",
        confirmButtonText: "Go to Login",
        showCancelButton: true,
      }).then((r) => {
        if (r.isConfirmed) {
          window.location.href =
            "/login?next=" + encodeURIComponent(window.location.pathname);
        }
      });
      return;
    }
    const text = (newComment || "").trim();
    if (!text) return;

    try {
      setSubmitting(true);
      const created = await postComment(blogData.blog_url, text, null, token);

      // optimistic add
      const fresh = {
        id: created?.id || created?.comment_id || `tmp-${Date.now()}`,
        user_name: created?.user_name || "You",
        user_avatar: created?.user_avatar || "",
        created_at: created?.created_at || new Date().toISOString(),
        text: created?.comment_text || text,
        parent_comment_id: null,
        user_id: currentUserId,
        is_owner: true,
        children: [],
      };
      setComments((prev) => [...prev, fresh]);
      setFlatCount((n) => n + 1);
      setNewComment("");

      await refreshComments();

      Swal.fire({
        icon: "success",
        title: "Comment posted",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Error posting comment:", e);
      Swal.fire({
        icon: "error",
        title: "Could not post",
        text: e?.response?.data?.error || "Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    const token = checkLogin();
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Please sign in",
        text: "Log in to reply.",
        confirmButtonText: "Go to Login",
        showCancelButton: true,
      }).then((r) => {
        if (r.isConfirmed) {
          window.location.href =
            "/login?next=" + encodeURIComponent(window.location.pathname);
        }
      });
      return;
    }
    const text = (replyDrafts[parentId] || "").trim();
    if (!text) return;

    try {
      setSubmitting(true);
      const created = await postComment(blogData.blog_url, text, parentId, token);

      // optimistic add under parent
      const fresh = {
        id: created?.id || created?.comment_id || `tmp-${Date.now()}`,
        user_name: created?.user_name || "You",
        user_avatar: created?.user_avatar || "",
        created_at: created?.created_at || new Date().toISOString(),
        text: created?.comment_text || text,
        parent_comment_id: parentId,
        user_id: currentUserId,
        is_owner: true,
        children: [],
      };

      const addReply = (list) =>
        list.map((node) => {
          if (node.id === parentId) {
            return { ...node, children: [...node.children, fresh] };
          }
          if (node.children?.length) return { ...node, children: addReply(node.children) };
          return node;
        });

      setComments((prev) => addReply(prev));
      setFlatCount((n) => n + 1);
      setReplyingTo(null);
      setReplyDrafts((d) => {
        const { [parentId]: _, ...rest } = d;
        return rest;
      });

      await refreshComments();

      Swal.fire({
        icon: "success",
        title: "Reply posted",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Error posting reply:", e);
      Swal.fire({
        icon: "error",
        title: "Could not post",
        text: e?.response?.data?.error || "Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------- Edit / Delete handlers --------------------- */
  const startEdit = (node) => {
    setEditingId(node.id);
    setEditDrafts((d) => ({ ...d, [node.id]: node.text }));
  };

  const cancelEdit = (commentId) => {
    setEditingId(null);
    setEditDrafts((d) => {
      const { [commentId]: _, ...rest } = d;
      return rest;
    });
  };

  const saveEdit = async (commentId) => {
    const token = checkLogin();
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Please sign in",
        text: "Log in to edit your comment.",
        confirmButtonText: "Go to Login",
        showCancelButton: true,
      });
      return;
    }
    const text = (editDrafts[commentId] || "").trim();
    if (!text) return;

    try {
      setSubmitting(true);
      await editComment(blogData.blog_url, commentId, text, token);

      // optimistic update
      const updateText = (list) =>
        list.map((n) => {
          if (n.id === commentId) return { ...n, text };
          if (n.children?.length) return { ...n, children: updateText(n.children) };
          return n;
        });
      setComments((prev) => updateText(prev));

      setEditingId(null);
      setEditDrafts((d) => {
        const { [commentId]: _, ...rest } = d;
        return rest;
      });

      await refreshComments();

      Swal.fire({
        icon: "success",
        title: "Comment updated",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Edit failed:", e);
      Swal.fire({
        icon: "error",
        title: "Could not update",
        text: e?.error || "Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (commentId) => {
    const token = checkLogin();
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Please sign in",
        text: "Log in to delete your comment.",
        confirmButtonText: "Go to Login",
        showCancelButton: true,
      });
      return;
    }

    const res = await Swal.fire({
      title: "Delete this comment?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!res.isConfirmed) return;

    try {
      setDeletingId(commentId);
      await deleteComment(blogData.blog_url, commentId, token);

      const removeById = (list) =>
        list
          .filter((n) => n.id !== commentId)
          .map((n) =>
            n.children?.length
              ? { ...n, children: removeById(n.children) }
              : n
          );

      setComments((prev) => removeById(prev));
      setFlatCount((n) => Math.max(0, n - 1));

      await refreshComments();

      Swal.fire({
        icon: "success",
        title: "Comment deleted",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Delete failed:", e);
      Swal.fire({
        icon: "error",
        title: "Could not delete",
        text: e?.error || "Please try again later.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  /* --------------------- Comment Node --------------------- */
  const CommentNode = ({ node, depth = 0 }) => {
    const isEditing = editingId === node.id;

    return (
      <div className="comment-item" style={{ marginLeft: depth * 16 }}>
        <div className="comment-header">
          <img
            src={node.user_avatar || "/default-avatar.png"}
            alt={node.user_name}
            className="comment-avatar"
            loading="lazy"
          />
          <div className="comment-meta">
            <strong className="comment-author">{node.user_name}</strong>
            <span className="comment-date">
              {new Date(node.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {!isEditing ? (
          <div className="comment-body">{node.text}</div>
        ) : (
          <div className="comment-edit-form" onClick={(e) => e.stopPropagation()}>
            <SmartTextarea
              className="needs-unmirror"
              rows={3}
              value={editDrafts[node.id] || ""}
              onChange={(e) => handleEdit(node.id, e.target.value)}
              counterMirror={false}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  saveEdit(node.id);
                }
              }}
              placeholder="Update your comment"
            />
            <div className="comment-edit-actions">
              <button
                className="btn btn-primary"
                disabled={submitting || !(editDrafts[node.id] || "").trim()}
                onClick={() => saveEdit(node.id)}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
              <button className="btn btn-secondary" onClick={() => cancelEdit(node.id)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="comment-actions">
          <button
            type="button"
            className="comment-reply-btn"
            onClick={() => {
              setReplyingTo((id) => (id === node.id ? null : node.id));
            }}
          >
            {replyingTo === node.id ? "Cancel" : "Reply"}
          </button>

          {node.is_owner && !isEditing && (
            <>
              <button
                type="button"
                className="comment-edit-btn"
                title="Edit"
                onClick={() => startEdit(node)}
              >
                <FiEdit2 />
              </button>
              <button
                type="button"
                className="comment-delete-btn"
                title="Delete"
                disabled={deletingId === node.id}
                onClick={() => confirmDelete(node.id)}
              >
                <FiTrash2 />
              </button>
            </>
          )}
        </div>

        {replyingTo === node.id && !isEditing && (
          <div className="comment-reply-form" onClick={(e) => e.stopPropagation()}>
            <SmartTextarea
              autoFocus
              placeholder="Write a reply"
              value={replyDrafts[node.id] || ""}
              onChange={(e) => handleReply(node.id, e.target.value)}
              rows={3}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  handleSubmitReply(node.id);
                }
              }}
            />
            <button
              className="btn btn-primary"
              disabled={submitting || !(replyDrafts[node.id] || "").trim()}
              onClick={() => handleSubmitReply(node.id)}
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
          </div>
        )}

        {node.children?.length > 0 && (
          <div className="comment-children">
            {node.children.map((child) => (
              <CommentNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  /** ------------- Helmet SEO (HTML head > DB > fallback) ---------- */
  const finalTitle =
    seoFromHtml.title || blogData?.meta_title || blogData?.blog_name || "Blog";

  let finalMetas = [...seoFromHtml.metas];
  const ensureMeta = (predicate, metaObj) => {
    if (!finalMetas.some(predicate)) finalMetas.push(metaObj);
  };

  // Basic metas
  ensureMeta((m) => m.name === "description", {
    name: "description",
    content: blogData?.meta_description || "",
  });
  ensureMeta((m) => m.name === "keywords", {
    name: "keywords",
    content: blogData?.meta_keywords || "",
  });
  ensureMeta((m) => m.property === "og:title", {
    property: "og:title",
    content: blogData?.meta_title || finalTitle,
  });
  ensureMeta((m) => m.property === "og:description", {
    property: "og:description",
    content: blogData?.meta_description || "",
  });
  ensureMeta((m) => m.property === "og:url", {
    property: "og:url",
    content: blogLink,
  });
  ensureMeta((m) => m.name === "twitter:card", {
    name: "twitter:card",
    content: "summary_large_image",
  });

  const ogImage = blogData?.blog_image_url
    ? `https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${blogData.blog_image_url}`
    : "";

  ensureMeta((m) => m.property === "og:image", {
    property: "og:image",
    content: ogImage,
  });
  ensureMeta((m) => m.name === "twitter:image", {
    name: "twitter:image",
    content: ogImage,
  });
  ensureMeta((m) => m.name === "twitter:title", {
    name: "twitter:title",
    content: blogData?.meta_title || finalTitle,
  });
  ensureMeta((m) => m.name === "twitter:description", {
    name: "twitter:description",
    content: blogData?.meta_description || "",
  });

  let finalLinks = [...seoFromHtml.links];
  if (!finalLinks.some((l) => l.rel === "canonical"))
    finalLinks.push({ rel: "canonical", href: blogLink });

  const jsonLd = seoFromHtml.jsonLd;

  return (
    <>
      {!loading && blogData && (
        <Helmet>
          <title>
            {blogData?.meta_title || blogData?.blog_name || "Medingen Blog"}
          </title>

          <meta name="description" content={blogData?.meta_description || ""} />
          <meta name="keywords" content={blogData?.meta_keywords || ""} />
          <meta name="author" content={blogData?.meta_author || ""} />
          <meta name="author:title" content={blogData?.meta_author_title || ""} />
          <meta name="author:profile" content={blogData?.meta_author_profile_url || ""} />

          {/* OG and Twitter tags */}
          <meta property="og:title" content={blogData?.meta_title || ""} />
          <meta property="og:description" content={blogData?.meta_description || ""} />
          <meta property="og:url" content={blogLink} />
          <meta
            property="og:image"
            content={`https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${blogData?.blog_image_url}`}
          />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={blogData?.meta_title || ""} />
          <meta name="twitter:description" content={blogData?.meta_description || ""} />
          <meta
            name="twitter:image"
            content={`https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${blogData?.blog_image_url}`}
          />

          <link rel="canonical" href={blogLink} />
          {jsonLd.map((block, i) => (
            <script key={i} type="application/ld+json">
              {block}
            </script>
          ))}
        </Helmet>
      )}

      <div className="blogpage" aria-busy={loading}>
        <Header title={blogData?.title || "Blog"} />

        <div className="blog-full-container">
          <div className="blog-dashboard-item">
            {loading ? (
              <div className="skeleton skel-title rect" />
            ) : (
              <h1 className="text-wrapper-head-2">{blogData?.blog_name}</h1>
            )}
          </div>

          <div className="blog-dashboard-item">
            {loading ? (
              <div className="skeleton-stack">
                <div className="skeleton skel-meta thin" />
                <div className="skeleton skel-meta thin" style={{ width: "60%" }} />
              </div>
            ) : (
              <p className="meta-line">
                <strong>By </strong>
                <a
                  href={blogData?.meta_author_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {blogData?.meta_author || "Medingen Health Care"}
                </a>
                <span> · </span>
                <a
                  href={blogData?.publisher_url || "https://medingen.in"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Medingen
                </a>
                , <strong>Published On - </strong>
                {new Date(blogData?.blog_created_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
                , <strong>Updated on - </strong>
                {new Date(
                  blogData?.blog_updated_date || blogData?.blog_created_date
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}

                <button
                  type="button"
                  onClick={onToggleLike}
                  aria-label={liked ? "Unlike" : "Like"}
                  className={`like-btn ${liked ? "liked" : ""}`}
                  disabled={liking}
                  title={liked ? "You like this" : "Like"}
                >
                  {liked ? <AiFillHeart className="like-icon" /> : <AiOutlineHeart className="like-icon" />}
                  <span className="like-count">{likesCount}</span>
                </button>

                <button onClick={handleShare} title={copied ? "Link Copied!" : "Share"} className="share-btn">
                  {copied ? "✔️" : <FiShare2 />}
                </button>
              </p>
            )}
          </div>

          {loading ? (
            <BlogSkeleton />
          ) : (
            <>
              {blogData?.blog_image_url && (
                <div className="blog-image-container" role="img-wrapper">
                  <img
                    src={`https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${blogData.blog_image_url}`}
                    alt={blogData?.title || "Blog image"}
                    className="blog-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              <div className="dashboard-item">
                <div className="blog-container">
                  <div className="blog-content">
                    <BlogContentIframe
                      headHtml={headHtml}
                      bodyHtml={bodyHtml}
                      baseHref={baseHref}
                      iframeId={iframeId}
                    />
                    <div style={{ display: "none" }} aria-hidden="true">
                      {extractedContent.map((el, i) => {
                        const Tag = el.tag;
                        return <Tag key={i}>{el.text}</Tag>;
                      })}
                    </div>

                    <CommentsSection
                      slug={blogData?.blog_url}
                      getBlog={getBlog}
                      postComment={postComment}
                      editComment={editComment}
                      deleteComment={deleteComment}
                      checkLogin={checkLogin}
                      currentUserId={currentUserId}            // optional; you already derive/set this
                      onCountChange={(n) => setFlatCount(n)}   // optional; keeps your count if you use it elsewhere
                    />

                  </div>

                  <div className="blog-navigation sticky-toc">
                    <div className="summary-wrapper">
                      <div className="summary-title" onClick={() => setIsOpen(!isOpen)}>
                        <p className="text-wrapper-head">In this page</p>
                        {isOpen ? <IoChevronUp className="arrow-icon" /> : <IoChevronDown className="arrow-icon" />}
                      </div>

                      {isOpen && (
                        <ul className="summary-list">
                          {summary.map((h1) => (
                            <li key={h1.id}>
                              <a href={`#${h1.id}`}>{h1.text}</a>
                              {h1.children.length > 0 && (
                                <ul>
                                  {h1.children.map((h2) => (
                                    <li key={h2.id}>
                                      <a href={`#${h2.id}`}>{h2.text}</a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <img
                      src={`https://d1dh0rr5xj2p49.cloudfront.net/banner/above500.jpg`}
                      alt="Medingen"
                      onClick={() => (window.location.href = "/")}
                      className="download-the-app"
                    />
                    <img
                      src={`https://d1dh0rr5xj2p49.cloudfront.net/banner/above1000_2.jpg`}
                      alt="Medingen"
                      onClick={() => (window.location.href = "/")}
                      className="download-the-app"
                    />

                    <div className="download-the-app">
                      <img src="/migfulllogo.png" alt="MigMig" className="miglogo" />
                      <p>Download medingen app for better experience</p>
                      <button className="continue-button" onClick={() => (window.location.href = "/")}>
                        Click here
                        <img className="button-icon" alt="Arrow" src="/vector-3.svg" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="blog-feed">
          <RecommendedBlogs slidesPerView={slidesPerView} />
        </div>

        <div className="margin-72"></div>

        <div className="landing-page">
          </div>

        <Navigation />
      </div>
    </>
  );
};

export default Blog;