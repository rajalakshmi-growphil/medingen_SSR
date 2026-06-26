"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaStar, FaChevronLeft, FaChevronRight, FaCommentAlt, FaThumbsUp, FaShareAlt } from "react-icons/fa";
import "./style.css";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53, 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface TestimonialsProps {
  title?: string;
  initialTestimonials?: any;
}

const Testimonials: React.FC<TestimonialsProps> = ({ title = "Hear from Medingen Customers", initialTestimonials }) => {
  const [googleRating, setGoogleRating] = useState(() => {
    return initialTestimonials?.averageRating ? Number(initialTestimonials.averageRating).toFixed(1) : "4.9";
  });
  const [googleReviewCount, setGoogleReviewCount] = useState(() => {
    return initialTestimonials?.totalReviewCount ? initialTestimonials.totalReviewCount.toLocaleString() : "12,482";
  });
  const [googleReviews, setGoogleReviews] = useState<any[]>(() => {
    return initialTestimonials?.reviews 
      ? [...initialTestimonials.reviews].sort((a: any, b: any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()) 
      : [];
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoRef = useRef<any>(null);

  useEffect(() => {
    if (googleReviews.length < 2) return;
    autoRef.current = setInterval(() => {
      setCurrentSlide((i) => (i + 1) % googleReviews.length);
    }, 5000);
    return () => clearInterval(autoRef.current);
  }, [googleReviews.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % googleReviews.length);
    if (autoRef.current) clearInterval(autoRef.current);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + googleReviews.length) % googleReviews.length);
    if (autoRef.current) clearInterval(autoRef.current);
  };

  const currentReview = googleReviews[currentSlide];

  const reviewerName = currentReview?.reviewer?.displayName || "Google User";
  const reviewerPhoto = currentReview?.reviewer?.profilePhotoUrl;

  const renderStars = (rating: any) => {
    return [...Array(5)].map((_, i) => (
      <FaStar key={i} className={i < Math.floor(rating) ? "star-icon-filled" : "star-icon-empty"} />
    ));
  };

  const formatDate = (dateString: any) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <section className="testimonials-section-new">
      <div className="testimonials-grid">
        {/* Left Section: Summary Card */}
        <div className="testimonials-summary">
          <h2 className="testimonials-main-title">{title}</h2>
          <div className="google-rating-card">
            <div className="rating-card-glow"></div>
            <div className="rating-info-row">
              <div className="google-logo-box">
                <GoogleIcon className="google-icon" />
              </div>
              <div className="rating-value-box">
                <span className="rating-number">{googleRating}</span>
                <div className="stars-row">
                  {renderStars(googleRating)}
                </div>
                <span className="trust-score-label">OVERALL TRUST SCORE</span>
              </div>
              <div className="review-count-box">
                <span className="count-number">{googleReviewCount}</span>
                <span className="verified-label">VERIFIED REVIEWS</span>
              </div>
            </div>
            <button className="write-review-btn" onClick={() => window.open("https://search.google.com/local/writereview?placeid=ChIJ73ps481hUjoR8TGoCm4jvAc", "_blank")}>
              <FaCommentAlt className="comment-icon" />
              Write a Review
            </button>
          </div>
        </div>

        {/* Right Section: Testimonial Stories */}
        <div className="testimonials-stories">
          <div className="stories-header">
            <h2 className="stories-title">Patient Stories</h2>
            <div className="slider-controls">
              <button className="slider-arrow" onClick={prevSlide} aria-label="Previous story">
                <FaChevronLeft />
              </button>
              <button className="slider-arrow" onClick={nextSlide} aria-label="Next story">
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="story-card-wrapper">
             {googleReviews.length > 0 ? (
               <div className="story-card">
                 <div className="reviewer-info">
                   <div className="reviewer-avatar">
                     {reviewerPhoto ? (
                       <img src={reviewerPhoto} alt={reviewerName} />
                     ) : (
                       <div className="avatar-initials">{getInitials(reviewerName)}</div>
                     )}
                     <div className="google-badge-small">
                        <GoogleIcon />
                     </div>
                   </div>
                   <div className="reviewer-details">
                     <h3 className="reviewer-name">{reviewerName}</h3>
                     <div className="review-meta">
                       <div className="review-stars">
                         {renderStars(currentReview.starRating)}
                       </div>
                       <span className="review-date">{formatDate(currentReview.createTime)}</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="review-comment">
                   <p>"{currentReview.comment}"</p>
                 </div>

                 <div className="story-card-footer">
                   <div className="helpful-tag">
                     <FaThumbsUp />
                     Helpful (42)
                   </div>
                   <button className="share-btn">
                     <FaShareAlt />
                   </button>
                 </div>
               </div>
             ) : (
               <div className="story-card-skeleton">
                 <div className="skeleton-line" style={{ width: '60%' }}></div>
                 <div className="skeleton-line" style={{ width: '100%' }}></div>
                 <div className="skeleton-line" style={{ width: '80%' }}></div>
               </div>
             )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

