import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";

import { getMainCategories, getAllCategories } from "../../api/Api";
import { FiSearch, FiX, FiChevronRight } from "react-icons/fi";
import "./AllCategories.css";

const nameToSlug = (name) =>
  name
    ? name
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
    : "";

const BADGE_COLORS = [
  { bg: "#f3f0ff", text: "#6d28d9" },
  { bg: "#ecfdf5", text: "#065f46" },
  { bg: "#fff7ed", text: "#9a3412" },
  { bg: "#fdf2f8", text: "#9d174d" },
  { bg: "#eff6ff", text: "#1e40af" },
  { bg: "#f0fdf4", text: "#166534" },
  { bg: "#fffbeb", text: "#92400e" },
  { bg: "#fef2f2", text: "#991b1b" },
  { bg: "#f0f9ff", text: "#0c4a6e" },
  { bg: "#faf5ff", text: "#581c87" },
  { bg: "#ecfeff", text: "#164e63" },
  { bg: "#fff1f2", text: "#881337" },
];

export const AllCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fullCategoryList, setFullCategoryList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mainCats, allCats] = await Promise.all([
          getMainCategories(),
          getAllCategories(),
        ]);
        setCategories(mainCats || []);
        setFullCategoryList(allCats || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryImage = (catName) => {
    if (!catName) return null;
    const normalizedName = catName.trim().toLowerCase();
    const match = fullCategoryList.find(
      (cat) =>
        (cat.category_name || "").trim().toLowerCase() === normalizedName ||
        (cat.display_name || "").trim().toLowerCase() === normalizedName
    );
    if (match) {
      if (match.category_image_url && match.category_image_url.trim() !== "")
        return `https://d1dh0rr5xj2p49.cloudfront.net/categories/${match.category_image_url.trim()}`;
      if (match.category_outline_url && match.category_outline_url.trim() !== "")
        return `https://d1dh0rr5xj2p49.cloudfront.net/categories/${match.category_outline_url.trim()}`;
    }
    return null;
  };

  const filteredCategories = categories.filter((cat) =>
    (cat.name || cat.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="allcat-page">
      <Header title="All Categories" />

      <div className="allcat-container">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="allcat-hero">
          <div className="allcat-hero-text">
            <h1 className="allcat-hero-title">Browse All Categories</h1>
            <p className="allcat-hero-sub">
              Find medicines and healthcare products by health condition or product type
            </p>
          </div>

          <div className="allcat-search-wrap">
            <FiSearch className="allcat-search-icon" />
            <input
              className="allcat-search-input"
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="allcat-search-clear" onClick={() => setSearchTerm("")}>
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Count bar ─────────────────────────────────────────── */}
        {!loading && (
          <div className="allcat-count-bar">
            <span className="allcat-count-pill">
              {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
              {searchTerm && ` for "${searchTerm}"`}
            </span>
          </div>
        )}

        {/* ── Grid ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="allcat-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="allcat-card allcat-card-skeleton">
                <div className="allcat-skeleton-img allcat-shimmer" />
                <div className="allcat-skeleton-body">
                  <div className="allcat-skeleton-line allcat-shimmer" style={{ width: "70%" }} />
                  <div className="allcat-skeleton-line allcat-shimmer" style={{ width: "40%", marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="allcat-grid">
            {filteredCategories.map((cat, idx) => {
              const title = cat.name || cat.title || "";
              const imgSrc = getCategoryImage(title);
              const subCount = (cat.sub_categories || cat.subcategories || cat.items || []).length;
              const badge = BADGE_COLORS[idx % BADGE_COLORS.length];
              const initial = title.charAt(0).toUpperCase();

              return (
                <div
                  key={idx}
                  className="allcat-card"
                  onClick={() => navigate(`/categories/${nameToSlug(title)}`)}
                >
                  <div className="allcat-card-img-wrap">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={title}
                        className="allcat-card-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="allcat-card-fallback"
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        display: imgSrc ? "none" : "flex",
                      }}
                    >
                      {initial}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="allcat-card-body">
                    <h3 className="allcat-card-title">{title}</h3>
                    {subCount > 0 && (
                      <span className="allcat-card-badge" style={{ background: badge.bg, color: badge.text }}>
                        {subCount} sub-categories
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="allcat-card-arrow">
                    <FiChevronRight size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="allcat-empty">
            <img src="/image-22.png" alt="No results" className="allcat-empty-img" />
            <h3 className="allcat-empty-title">No categories found</h3>
            <p className="allcat-empty-sub">No results for "{searchTerm}"</p>
            <button className="allcat-empty-btn" onClick={() => setSearchTerm("")}>
              View all categories
            </button>
          </div>
        )}
      </div>

      <Navigation />
      <div className="landing-page">
        </div>
    </div>
  );
};