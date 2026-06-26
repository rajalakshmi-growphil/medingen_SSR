import React, { useEffect, useState, useRef } from "react";
import "./style.css";
import { FaHeart, FaCommentDots, FaUserAlt } from "react-icons/fa"; // Importing FaHeart for
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { getAllBlogCategories, getAllBlogs } from "../../api/Api";
import Swal from "sweetalert2";

const CategoryBlogs = ({ slidesPerView, category_id = null, popular = false, category_name = "" }) => {
  const [blogs, setBlogs] = useState([]);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogs = await getAllBlogs(popular, category_id); // Pass category_id and set popular=false
        setBlogs([
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
        ]);
      } catch (error) {
        console.error("Error fetching category blogs:", error);
      }
    };

    fetchBlogs();
  }, [category_id]); // Re-fetch blogs when category_id changes

  const handleRedirect = (url) => {
    window.open(url, "_blank");
  };

  return (
    <>
      <div className="blog-dashboard-item">
        <p className="text-wrapper-head-2">
          {category_id ? "Blogs" + (category_name ? " - " + category_name : "") : "Popular Blogs"}
        </p>
        <div className="pagination-controls">
          <button onClick={() => swiperRef.current?.slidePrev()} disabled={!swiperRef.current}>
            <img src="/vector-arrow.svg" alt="Previous" style={{ transform: "scaleX(-1)" }} fetchpriority="high" />
          </button>
          <button onClick={() => swiperRef.current?.slideNext()} disabled={!swiperRef.current}>
            <img src="/vector-arrow.svg" alt="Next" fetchpriority="high" />
          </button>
        </div>
      </div>

      <div className="blog-dashboard-item">
        <Swiper onSwiper={(swiper) => (swiperRef.current = swiper)} spaceBetween={20} slidesPerView={slidesPerView}>
          {blogs.map((blog, index) => (
            <SwiperSlide key={index}>
              <div className="popular-blog-item">
                <div onClick={() => handleRedirect("/blogs/" + blog.blog_url)}>
                  <img
                    className="popular-blog-image"
                    alt={blog.blog_name}
                    src={`https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${blog.blog_image_url}`}
                  />
                  <div className="popular-blog-text">{blog.blog_name}</div>
                  <div className="popular-blog-meta">
                    <div className="popular-blog-date">
                      {new Date(blog.blog_created_date).toLocaleDateString()}
                    </div>
                    <div className="popular-blog-likes-comments">
                      <span className="likes-count">
                        <FaHeart style={{ marginRight: "5px", color: "#FF4081" }} />
                        {blog.likes_count}
                      </span>
                      <span className="comments-count">
                        <FaCommentDots style={{ marginRight: "5px" }} />
                        {blog.comments_count} 
                      </span>
                    </div>
                    
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export const RecommendedBlogs = ({ slidesPerView }) => {
  const [recommendedBlogs, setRecommendedBlogs] = useState([]);
  const recommendedSwiperRef = useRef(null);

  useEffect(() => {
    const fetchRecommendedBlogs = async () => {
      try {
        const blogs = await getAllBlogs();
        setRecommendedBlogs([
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
          ...blogs,
        ]);
      } catch (error) {
        console.error("Error fetching recommended blogs:", error);
      }
    };

    fetchRecommendedBlogs();
  }, []);

  const handleRedirect = (url) => {
    window.open(url, "_blank");
  };

  return (
    <>
      <div className="blog-dashboard-item">
        <p className="text-wrapper-head-2">Recommended Blogs</p>
        <div className="pagination-controls">
          <button onClick={() => recommendedSwiperRef.current?.slidePrev()} disabled={!recommendedSwiperRef.current}>
            <img src="/vector-arrow.svg" alt="Previous" style={{ transform: "scaleX(-1)" }} fetchpriority="high" />
          </button>
          <button onClick={() => recommendedSwiperRef.current?.slideNext()} disabled={!recommendedSwiperRef.current}>
            <img src="/vector-arrow.svg" alt="Next" fetchpriority="high" />
          </button>
        </div>
      </div>

      <div className="blog-dashboard-item">
        <Swiper onSwiper={(swiper) => (recommendedSwiperRef.current = swiper)} spaceBetween={20} slidesPerView={slidesPerView}>
          {recommendedBlogs.map((blog, index) => (
            <SwiperSlide key={index}>
              <div className="popular-blog-item">
                <div onClick={() => handleRedirect("/blogs/" + blog.blog_url)}>
                  <img
                    className="popular-blog-image"
                    alt={blog.blog_name}
                    src={`https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${blog.blog_image_url}`}
                  />
                  <div className="popular-blog-text">{blog.blog_name}</div>
                  <div className="popular-blog-meta">
                    <div className="popular-blog-date">
                      {new Date(blog.blog_created_date).toLocaleDateString()}
                    </div>
                    <div className="popular-blog-likes-comments">
                      <span className="likes-count">
                        <FaHeart style={{ marginRight: "5px", color: "#FF4081" }} />
                        {blog.likes_count}
                      </span>
                      <span className="comments-count">
                        <FaCommentDots style={{ marginRight: "5px" }} />
                        {blog.comments_count} Comments
                      </span>
                    </div>
                    
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export const Blogs = () => {
  const [blogCategories, setBlogCategories] = useState([]);
  const [slidesPerView, setSlidesPerView] = useState("auto");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null); // For animation control

  const updateSlidesPerView = () => {
    if (window.innerWidth < 700) {
      setSlidesPerView(1);
    } else {
      setSlidesPerView("auto");
    }
  };

  useEffect(() => {
    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);

    return () => {
      window.removeEventListener("resize", updateSlidesPerView);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        Swal.showLoading();
        const categories = await getAllBlogCategories();
        setBlogCategories(categories);
        Swal.close();
      } catch (error) {
        console.error("Error fetching categories:", error);
        Swal.close();
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId, categoryName) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setExpandedCategory(categoryId); // Trigger the expansion animation
  };

  return (
    <>
      <div className="blogs">
        <Header title={"Blogs"} />
        <div className="blog-container">
          <div className="blog-dashboard-item">
            <p className="text-wrapper-head">Explore categories</p>
          </div>
          <div className="blog-dashboard-item-cat">
            <div className="category-grid">
              {blogCategories.map((category, index) => (
                <div
                  key={index}
                  className={`category-item ${expandedCategory === category.id ? "expanded" : ""}`}
                  onClick={() => handleCategoryClick(category.id, category.category_display_name)}
                >
                  <img
                    className="category-image"
                    alt={category.category_display_name}
                    id={category.id}
                    src={`https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${category.category_image_url}`}
                  />
                  <div className="text-wrapper-10">{category.category_display_name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditionally render CategoryBlogs based on selected category */}
          {selectedCategoryId && (
            <CategoryBlogs category_id={selectedCategoryId} category_name={selectedCategoryName} popular={true} slidesPerView={slidesPerView} />
          )}

          <CategoryBlogs popular={true} slidesPerView={slidesPerView} />
          <RecommendedBlogs slidesPerView={slidesPerView} />
        </div>

        <div className="margin-72"></div>

        <div className="landing-page">
          </div>
      </div>
      <Navigation />
    </>
  );
};
