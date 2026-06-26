import React from "react";
import "./blogContent.css";

const BlogSkeleton = () => {
  return (
    <div className="blog-skeleton-container">
      <div className="skeleton skeleton-image"></div>

      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-line"></div>
      <div className="skeleton skeleton-line"></div>
      <div className="skeleton skeleton-line short"></div>

      <div className="skeleton skeleton-sidebar"></div>
    </div>
  );
};

export default BlogSkeleton;
