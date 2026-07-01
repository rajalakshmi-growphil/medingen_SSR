import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation as nav, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Swal from "sweetalert2";
import { useCart } from "../../api/stateContext";
import {
    getUser,
    getFooterProducts,
    getProductDetails,
    addToCart,
} from "../../api/Api";
import "./style.css";

const TopSellingMedicine = () => {
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [loadingTopSelling, setLoadingTopSelling] = useState(true);
    const navigate = useNavigate();
    const { dispatch, refreshCartCount } = useCart();

    useEffect(() => {
        const fetchTopSelling = async () => {
            try {
                const data = await getFooterProducts();
                if (data.topSellingMedicines) {
                    const topList = data.topSellingMedicines.slice(0, 10);
                    const productDetails = await Promise.all(
                        topList.map(async (item) => {
                            const productNameUrl = item.value.replace("/product/", "");
                            try {
                                const details = await getProductDetails(0, productNameUrl);
                                return details;
                            } catch (e) {
                                console.error("Error fetching details for", productNameUrl, e);
                                return null;
                            }
                        })
                    );
                    setTopSellingProducts(productDetails.filter(p => p !== null));
                }
            } catch (error) {
                console.error("Failed to fetch top selling products:", error);
            } finally {
                setLoadingTopSelling(false);
            }
        };
        fetchTopSelling();
    }, []);

    const handleAddToCart = async (product) => {
        const userData = getUser();
        if (!userData.isLoggedIn) {
            navigate("/login");
            return;
        }

        const { value: quantity } = await Swal.fire({
            title: "Enter Quantity",
            html: `
        <div style="display: flex; align-items: center; justify-content: center;">
          <button id="ts-decrease" style="width: 24px; height: 24px; border: none; background-color: #1E1E1E; color: #fff; border-radius: 4px; cursor: pointer;">-</button>
          <input id="ts-quantity" type="text" value="1" readonly style="text-align: center; width: 50px; font-size: 18px; margin: 0 10px; background: none; border: none;">
          <button id="ts-increase" style="width: 24px; height: 24px; border: none; background-color: #1E1E1E; color: #fff; border-radius: 4px; cursor: pointer;">+</button>
        </div>
      `,
            showCancelButton: true,
            confirmButtonText: "Add",
            cancelButtonText: "Cancel",
            icon: "question",
            didOpen: () => {
                const quantityInput = document.getElementById("ts-quantity");
                let quantity = parseInt(quantityInput.value);

                const increaseBtn = document.getElementById("ts-increase");
                const decreaseBtn = document.getElementById("ts-decrease");

                if (increaseBtn) {
                    increaseBtn.addEventListener("click", () => {
                        quantity += 1;
                        quantityInput.value = quantity;
                    });
                }

                if (decreaseBtn) {
                    decreaseBtn.addEventListener("click", () => {
                        if (quantity > 1) {
                            quantity -= 1;
                            quantityInput.value = quantity;
                        }
                    });
                }
            },
            preConfirm: () => {
                return document.getElementById("ts-quantity").value;
            },
        });

        if (quantity && quantity > 0) {
            try {
                const result = await addToCart(product.product_id, null, quantity, navigate);
                await refreshCartCount();
            } catch (error) {
                console.error("Error adding product to cart:", error);
                Swal.fire({
                    title: "Error",
                    text: "There was an error adding the product to your cart.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            }
        }
    };

    return (
        <div className="dashboard-item top-selling-section">
            <div className="top-selling-header">
                <h2 className="top-selling-title">Top Selling Medicine</h2>
                <div className="top-selling-nav-buttons">
                    <button className="top-selling-prev-btn top-selling-prev" aria-label="Previous">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button className="top-selling-next-btn top-selling-next" aria-label="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {!loadingTopSelling && topSellingProducts.length > 0 ? (
                <Swiper
                    slidesPerView={1}
                    spaceBetween={12}
                    loop={topSellingProducts.length > 5}
                    simulateTouch={true}
                    grabCursor={true}
                    observer={true}
                    observeParents={true}
                    navigation={{
                        prevEl: ".top-selling-prev",
                        nextEl: ".top-selling-next",
                    }}
                    modules={[nav, Autoplay]}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                    }}
                    breakpoints={{
                        480: {
                            slidesPerView: 2,
                            spaceBetween: 12,
                        },
                        640: {
                            slidesPerView: 3,
                            spaceBetween: 14,
                        },
                        768: {
                            slidesPerView: 3,
                            spaceBetween: 16,
                        },
                        1024: {
                            slidesPerView: 4,
                            spaceBetween: 18,
                        },
                        1280: {
                            slidesPerView: 5,
                            spaceBetween: 20,
                        },
                    }}
                    className="top-selling-swiper"
                >
                    {topSellingProducts.map((product, idx) => {
                        const mrp = parseFloat(product.productPriceOld || 0);
                        const ourPrice = parseFloat(product.productPriceNew || 0);
                        const hasDiscount = mrp > ourPrice && mrp > 0;
                        const discountPercent = hasDiscount ? Math.round(((mrp - ourPrice) / mrp) * 100) : 0;

                        const imageUrl = product.images && product.images.length > 0
                            ? `/cloudfront-cdn/products/${product.images[0].img}`
                            : "/medicine-details.png";

                        return (
                            <SwiperSlide key={`${product.product_id}-${idx}`} className="top-selling-slide">
                                <div className="top-selling-product-card">
                                    <div
                                        className="top-selling-card-image-container"
                                        onClick={() => navigate("/product/" + product.product_name_url)}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={product.productName}
                                            onError={(e) => { e.target.src = "/medicine-details.png"; }}
                                        />
                                    </div>
                                    <div className="top-selling-product-info">
                                        <div
                                            className="top-selling-prod-name"
                                            onClick={() => navigate("/product/" + product.product_name_url)}
                                        >
                                            {product.productName}
                                        </div>
                                        <div className="top-selling-prod-mfr">By {product.manufacturer}</div>

                                        <div className="top-selling-details-footer">
                                            <div className="top-selling-price-block">
                                                <div className="top-selling-mrp-row">
                                                    <span className="ts-label">MRP</span>
                                                    <span className="ts-strikethrough">₹{mrp.toFixed(0)}</span>
                                                    {hasDiscount && <span className="ts-discount">{discountPercent}% Off</span>}
                                                </div>
                                                <div className="top-selling-our-price-row">
                                                    <span className="ts-label">Our Price</span>
                                                    <span className="ts-main-price">₹{ourPrice.toFixed(0)}</span>
                                                </div>
                                            </div>
                                            <button className="top-selling-add-cart-action" onClick={() => handleAddToCart(product)}>
                                                <img src="/carticon.svg" alt="Add" />
                                                <span>Add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            ) : (
                <div className="top-selling-loading">
                    {loadingTopSelling ? "Loading Top Selling Products..." : "No top selling products found."}
                </div>
            )}
        </div>
    );
};

export default TopSellingMedicine;
