import React, { useEffect, useState } from "react";
import { getAllBlogs } from "../../api/Api";
import "./latestBlogs.css";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

const LatestBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                // Fetch latest blogs. 
                const allBlogs = await getAllBlogs(false);
                if (allBlogs && Array.isArray(allBlogs)) {
                    // Fetch more blogs to ensure scrolling works well (e.g. 8)
                    setBlogs(allBlogs.slice(0, 8));
                }
            } catch (error) {
                console.error("Error fetching latest blogs:", error);
            }
        };

        fetchBlogs();
    }, []);

    const handleReadMore = (blogUrl) => {
        navigate(`/blogs/${blogUrl}`);
    };

    if (blogs.length === 0) {
        return null;
    }

    return (
        <section className="latest-blogs-section">
            <div className="latest-blogs-header">
                <h2 className="latest-blogs-title">Our Latest News & Blogs</h2>
                {/* Custom Navigation Buttons Container */}
                <div className="latest-blogs-nav">
                    <button className="swiper-button-prev-blogs">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button className="swiper-button-next-blogs">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="latest-blogs-carousel">
                <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={24}
                    slidesPerView={1}
                    grabCursor={true}
                    simulateTouch={true}
                    observer={true}
                    observeParents={true}
                    loop={blogs.length > 4}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }}
                    navigation={{
                        prevEl: '.swiper-button-prev-blogs',
                        nextEl: '.swiper-button-next-blogs',
                        disabledClass: 'swiper-button-disabled',
                    }}
                    breakpoints={{
                        640: {
                            slidesPerView: 2,
                            spaceBetween: 20,
                        },
                        1024: {
                            slidesPerView: 3,
                            spaceBetween: 24,
                        },
                        1280: {
                            slidesPerView: 4,
                            spaceBetween: 24,
                        },
                    }}
                    className="blogs-swiper"
                >
                    {blogs.map((blog, idx) => (
                        <SwiperSlide key={`blog-${blog.id}-${idx}`}>
                            <div className="latest-blog-card">
                                <div className="latest-blog-image-wrapper">
                                    <img
                                        src={`https://d1dh0rr5xj2p49.cloudfront.net/blogs/images/${blog.blog_image_url}`}
                                        alt={blog.blog_name}
                                        className="latest-blog-image"
                                    />
                                    <div className="latest-blog-badge">Doctor</div>
                                </div>
                                <div className="latest-blog-content">
                                    <div className="latest-blog-meta">
                                        <span className="latest-blog-date">
                                            {new Date(blog.blog_created_date).toLocaleDateString('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="latest-blog-heading">{blog.blog_name}</h3>
                                    <p className="latest-blog-excerpt">
                                        {blog.blog_short_description || "Read more to find out about this topic."}
                                    </p>
                                    <button
                                        className="latest-blog-read-more"
                                        onClick={() => handleReadMore(blog.blog_url)}
                                    >
                                        Read More
                                    </button>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section >
    );
};

export default LatestBlogs;
