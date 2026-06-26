import React, { useMemo } from "react";
import "./featuredBrands.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";

const FeaturedBrands = () => {
    const clientLogos = useMemo(
        () =>
            Array.from(
                { length: 15 },
                (_, i) =>
                    `https://d1dh0rr5xj2p49.cloudfront.net/brands/${i + 1}.png`
            ),
        []
    );

    return (
        <section className="featured-brands-section">
            <div className="featured-brands-container">
                <h2 className="featured-brands-title">Featured Brands</h2>

                <Swiper
                    modules={[Autoplay]}
                    spaceBetween={30}
                    slidesPerView={3}
                    grabCursor={true}
                    simulateTouch={true}
                    observer={true}
                    observeParents={true}
                    loop={true}
                    speed={1000}
                    autoplay={{
                        delay: 2000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }}
                    breakpoints={{
                        640: {
                            slidesPerView: 4,
                            spaceBetween: 40,
                        },
                        768: {
                            slidesPerView: 5,
                            spaceBetween: 50,
                        },
                        1024: {
                            slidesPerView: 6,
                            spaceBetween: 60,
                        },
                    }}
                    className="featured-brands-swiper"
                >
                    {clientLogos.map((logo, index) => (
                        <SwiperSlide key={index} className="brand-slide">
                            <img src={logo} alt={`Brand ${index + 1}`} className="brand-logo" />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
};

export default FeaturedBrands;
