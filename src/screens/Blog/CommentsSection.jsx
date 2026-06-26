import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import Swal from "sweetalert2";
import { FiTrash2 } from "react-icons/fi";

/* -------------------- Utilities -------------------- */
const normalizeComments = (raw = [], currentUserId = null) => {
  const byId = {};
  const roots = [];

  raw.forEach((c) => {
    const authorId = c.user_id ?? c.customer_id ?? c.author_id ?? null;
    const id = c.id ?? c.comment_id ?? String(Math.random());
    byId[id] = {
      id,
      user_name: c.customer_name || c.name || "User",
      user_avatar: c.profile_picture || c.avatar_url || "",
      created_at: c.created_at || c.date || new Date().toISOString(),
      text: c.comment_text || c.text || "",
      user_id: authorId,
      is_owner:
        !!(c.is_owner || c.mine || c.isMine) ||
        (currentUserId != null && authorId != null && String(authorId) === String(currentUserId)),
    };
  });

  const arr = Object.values(byId);
  arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return arr;
};

/* -------------------- Helper: Time Ago -------------------- */
const timeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

/* -------------------- SmartTextarea -------------------- */
const SmartTextarea = React.forwardRef(
  ({ className = "", style, value, onChange, placeholder, rows = 3, autoFocus = false, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`smart-textarea ${className}`}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          direction: "ltr",
          unicodeBidi: "plaintext",
          textAlign: "left",
          writingMode: "horizontal-tb",
          ...style,
        }}
        {...rest}
      />
    );
  }
);
SmartTextarea.displayName = "SmartTextarea";

/* -------------------- Comments Section -------------------- */
const CommentsSection = ({
  slug,
  getBlog,
  postComment,
  deleteComment,
  checkLogin,
  currentUserId: currentUserIdProp = null,
  onCountChange,
}) => {
  const [comments, setComments] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(currentUserIdProp);
  const [count, setCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");

  const pendingLoadRef = useRef(false);

  useEffect(() => {
    if (typeof onCountChange === "function") onCountChange(count);
  }, [count, onCountChange]);

  const notifyCount = (n) => setCount(n);

  const ensureLogin = async (purpose) => {
    const token = checkLogin?.();
    if (token) return token;

    const res = await Swal.fire({
      icon: "info",
      title: "Please sign in",
      text: `Log in to ${purpose}.`,
      confirmButtonText: "Go to Login",
      showCancelButton: true,
    });
    if (res.isConfirmed) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
    }
    return null;
  };

  /* ---------- Load comments ---------- */
  const loadComments = useCallback(async () => {
    if (!slug) return;
    try {
      pendingLoadRef.current = true;
      const token = checkLogin?.();
      const resp = await getBlog(slug, token);
      const blogItem = Array.isArray(resp) ? resp[0] : resp?.data?.[0] || resp;

      const apiCurrentUserId =
        blogItem?.current_user_id ?? resp?.current_user_id ?? currentUserIdProp;

      const raw = blogItem?.comments || blogItem?.blog_comments || resp?.comments || [];
      setCurrentUserId(apiCurrentUserId);

      const tree = normalizeComments(raw, apiCurrentUserId);
      setComments(tree);
      notifyCount(Array.isArray(raw) ? raw.length : Number(blogItem?.total_comments) || 0);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      pendingLoadRef.current = false;
    }
  }, [slug, getBlog, checkLogin, currentUserIdProp]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  /* ---------- Add comment ---------- */
  const handleAdd = useCallback(
    async (text) => {
      if (!text || !text.trim()) return;
      const token = await ensureLogin("comment");
      if (!token) return;
      try {
        setSubmitting(true);
        await postComment(slug, text.trim(), null, token);
        await loadComments();
        setNewComment("");
        Swal.fire({
          icon: "success",
          title: "Comment posted",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Could not post",
          text: e?.response?.data?.error || "Try again.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [slug, postComment, loadComments]
  );

  /* ---------- Delete ---------- */
  const handleDelete = useCallback(
    async (id) => {
      const token = await ensureLogin("delete your comment");
      if (!token) return;
      const res = await Swal.fire({
        title: "Delete this comment?",
        text: "This cannot be undone.",
        icon: "warning",
        showCancelButton: true,
      });
      if (!res.isConfirmed) return;
      try {
        await deleteComment(slug, id, token);
        await loadComments();
        Swal.fire({
          icon: "success",
          title: "Deleted",
          timer: 800,
          showConfirmButton: false,
        });
      } catch (e) {
        Swal.fire({ icon: "error", title: "Delete failed" });
      }
    },
    [deleteComment, slug, loadComments]
  );

  /* ---------- Comment node ---------- */
  const CommentNode = memo(function CommentNode({ node }) {
    return (
      <div className="comment-item">
        <div className="comment-body-wrapper">

          <div className="comment-header">
            <img
              src={node.user_avatar || "/default-avatar.svg"}
              alt={node.user_name}
              className="comment-avatar"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.svg";
              }}
            />
            <div className="comment-meta">
              <strong className="comment-author">{node.user_name}</strong>
              <span className="comment-date">{timeAgo(node.created_at)}</span>
            </div>
          </div>

          <div className="comment-body">{node.text}</div>
          {node.is_owner && (
            <button
              type="button"
              className="comment-delete-btn"
              title="Delete"
              onClick={() => handleDelete(node.id)}
            >
              <FiTrash2 />
            </button>
          )}
        </div>

      </div>
    );
  });

  /* ---------- Render ---------- */
  return (
    <div className="comments-section">
      <h2 className="comments-title">Comments {count ? `(${count})` : ""}</h2>

      <div className="comment-form">
        <SmartTextarea
          className="needs-unmirror"
          placeholder="Write a comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
        />
        <button
          className="btn btn-primary"
          onClick={() => handleAdd(newComment)}
          disabled={submitting || !newComment.trim()}
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </div>

      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="no-comments">Be the first to comment</p>
        ) : (
          comments.map((n) => <CommentNode key={n.id} node={n} />)
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
