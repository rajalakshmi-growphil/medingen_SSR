"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation as nav, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Swal from "sweetalert2";
import { useCart } from "../../app/providers";
import {
    getUser,
    addToCart,
    updateCartData,
    requestProduct
} from "@/lib/api";
import "./style.css";

const ProductSkeleton = () => (
    <div className="product-card-skeleton banner-skeleton-anim">
        <div className="skeleton-image"></div>
        <div className="skeleton-info">
            <div className="skeleton-line title"></div>
            <div className="skeleton-line mfr"></div>
            <div className="skeleton-line price"></div>
        </div>
    </div>
);

const ProductSection = ({ title, categoryKey, initialProducts }: { title: string; categoryKey: string; initialProducts?: any[] }) => {
    const [products, setProducts] = useState(() => {
        const list = initialProducts || [];
        return list.map((item: any) => ({
            product_id: item.product_id,
            productName: item.label || item.productName || "",
            product_name_url: item.product_name_url,
            productPriceNew: parseFloat(item.product_pricing_new || item.productPriceNew || 0),
            productPriceOld: parseFloat(item.product_pricing_old || item.productPriceOld || 0),
            manufacturer: item.manufacturer || "",
            inStock: item.inStock === true || item.inStock === 1 || item.inStock === "1" || String(item.inStock) === "true",
            rc: item.rc === undefined ? 1 : Number(item.rc),
            images: item.first_image_url
                ? [{ img: item.first_image_url }]
                : item.images || []
        }));
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { cartItems, refreshCartCount, cartId } = useCart();

    // Unique class names for navigation to avoid conflicts between multiple instances
    const prevClass = `nav-prev-${categoryKey}`;
    const nextClass = `nav-next-${categoryKey}`;

    const handleAddToCart = async (product: any) => {
        const userData = getUser();
        if (!userData.isLoggedIn) {
            router.push("/login");
            return;
        }

        try {
            // Directly add quantity 1 to bypass the popup
            await addToCart(product.product_id, null, 1);
            await refreshCartCount();
        } catch (error) {
            console.error("Error adding product to cart:", error);
            Swal.fire({
                title: "Oops!",
                text: "Could not add to cart. Please try again.",
                icon: "error",
                confirmButtonText: "OK",
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'modern-popup-confirm'
                }
            });
        }
    };

    const updateInlineQuantity = async (productId: any, delta: number) => {
        try {
            const quantitiesMap: Record<string, number> = {};
            
            // Build current quantities map from cartItems
            cartItems.forEach((item: any) => {
                const itemId = String(item.id || item.product_id || item.medicine_id || "");
                if (itemId) {
                    quantitiesMap[itemId] = parseInt(item.quantity || item.qty || 0);
                }
            });

            // Update the specific product's quantity
            const targetId = String(productId);
            const currentQty = quantitiesMap[targetId] || 0;
            const nextQty = Math.max(0, currentQty + delta);
            
            quantitiesMap[targetId] = nextQty;

            // Sync with backend using the same method as OrderProgressConfirmation
            await updateCartData(quantitiesMap, cartId);
            await refreshCartCount();
        } catch (error: any) {
            if (error.message === "STALE_CART") {
                try {
                    await addToCart(productId, null, delta);
                    await refreshCartCount();
                    return;
                } catch (retryErr) {
                    console.error("Retry failed:", retryErr);
                }
            }
            console.error("Error updating quantity:", error);
        }
    };

    const handleNotifyMe = async (product: any, e: any) => {
        e.stopPropagation();
        const userData = getUser();
        if (!userData.isLoggedIn) {
            router.push("/login");
            return;
        }

        try {
            const res = await requestProduct(product.product_id, userData.customer_id || "", null, "Insert", "PENDING");
            if (res) {
                Swal.fire({
                    icon: "success",
                    title: "Request Sent",
                    text: "We'll notify you when available.",
                    confirmButtonText: "OK",
                    customClass: { confirmButton: 'modern-popup-confirm' }
                });
            }
        } catch (error) {
            console.error("Error requesting product:", error);
        }
    };

    if (!loading && products.length === 0) return null;

    return (
        <div className="dashboard-item top-selling-section">
            <div className="top-selling-header">
                <h2 className="top-selling-title">{title}</h2>
                <div className="top-selling-nav-buttons">
                    <button className={`top-selling-prev-btn ${prevClass}`} aria-label="Previous">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button className={`top-selling-next-btn ${nextClass}`} aria-label="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="product-skeleton-container">
                    {Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
            ) : (
                <Swiper
                    slidesPerView={1.2}
                    spaceBetween={12}
                    loop={products.length > 5}
                    grabCursor={true}
                    simulateTouch={true}
                    observer={true}
                    observeParents={true}
                    navigation={{
                        prevEl: `.${prevClass}`,
                        nextEl: `.${nextClass}`,
                        disabledClass: 'swiper-button-disabled',
                    }}
                    modules={[nav, Autoplay]}
                    breakpoints={{
                        0: {
                            slidesPerView: 2,
                            spaceBetween: 10,
                        },
                        480: {
                            slidesPerView: 2.3,
                            spaceBetween: 12,
                        },
                        640: {
                            slidesPerView: 3,
                            spaceBetween: 14,
                        },
                        800: {
                            slidesPerView: 4,
                            spaceBetween: 16,
                        },
                        1024: {
                            slidesPerView: 5,
                            spaceBetween: 20,
                        },
                        1280: {
                            slidesPerView: 6,
                            spaceBetween: 24,
                        },
                    }}
                    className="top-selling-swiper"
                >
                    {products.map((product, idx) => {
                        const mrp = Number(product.productPriceOld || 0);
                        const ourPrice = Number(product.productPriceNew || 0);
                        const hasDiscount = mrp > ourPrice && mrp > 0;
                        const discountPercent = hasDiscount ? Math.round(((mrp - ourPrice) / mrp) * 100) : 0;

                        const imageUrl = product.images?.length
                            ? `https://d1dh0rr5xj2p49.cloudfront.net/products/${product.images[0].img}`
                            : "/medicine-details.png";

                        // Extremely robust matching logic to ensure quantity picker shows correctly
                        const cartItem = cartItems?.find((item: any) => {
                          const cartPid = String(item.product_id || item.medicine_id || item.id || "");
                          const currentPid = String(product.product_id || "");
                          
                          const cartName = (item.productName || item.product_name || item.name || "").toLowerCase().trim();
                          const currentName = (product.productName || "").toLowerCase().trim();

                          return (cartPid !== "" && cartPid === currentPid) || 
                                 (cartName !== "" && cartName === currentName);
                        });
                        const quantityInCart = cartItem ? parseInt(cartItem.quantity || cartItem.qty || 0) : 0;

                        return (
                            <SwiperSlide key={`${product.product_id}-${idx}`} className="top-selling-slide">
                                <div className="top-selling-product-card">
                                    <div
                                        className="top-selling-card-image-container"
                                        onClick={() => router.push("/product/" + product.product_name_url)}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={product.productName}
                                            loading="lazy"
                                            onError={(e: any) => { e.target.src = "/medicine-details.png"; }}
                                        />
                                        {product.inStock === false ? (
                                            <div className="card-out-of-stock-badge">SOLD OUT</div>
                                        ) : (
                                            hasDiscount && <div className="card-off-badge">{discountPercent}% OFF</div>
                                        )}
                                    </div>
                                    <div className="top-selling-product-info">
                                        <div
                                            className="top-selling-prod-name"
                                            onClick={() => router.push("/product/" + product.product_name_url)}
                                            title={product.productName}
                                        >
                                            {product.productName}
                                        </div>
                                        <div className="top-selling-prod-mfr">By {product.manufacturer}</div>
 
                                        <div className="top-selling-details-footer">
                                            <div className="top-selling-price-block">
                                                <div className="top-selling-our-price-row">
                                                    <span className="ts-main-price">₹{ourPrice.toFixed(0)}</span>
                                                    {hasDiscount && <span className="ts-strikethrough">₹{mrp.toFixed(0)}</span>}
                                                </div>
                                            </div>
 
                                            {product.rc === 0 ? (
                                                <button
                                                    className="top-selling-add-cart-action request-btn"
                                                    onClick={() => router.push("/product/" + product.product_name_url)}
                                                >
                                                    View
                                                </button>
                                            ) : product.inStock === false ? (
                                                <button
                                                    className="top-selling-add-cart-action request-btn"
                                                    onClick={(e) => handleNotifyMe(product, e)}
                                                >
                                                    Notify me
                                                </button>
                                            ) : quantityInCart > 0 ? (
                                                <div className="inline-qty-picker pill-style">
                                                <button 
                                                  className="inline-qty-btn minus"
                                                  onClick={() => updateInlineQuantity(product.product_id, -1)}
                                                >
                                                    {quantityInCart === 1 ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    ) : "-"}
                                                </button>
                                                <span className="inline-qty-value">{quantityInCart}</span>
                                                <button 
                                                  className="inline-qty-btn plus"
                                                  onClick={() => updateInlineQuantity(product.product_id, 1)}
                                                >
                                                    +
                                                </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="top-selling-add-cart-action"
                                                    onClick={() => handleAddToCart(product)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                                    </svg>
                                                    <span>Add</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            )}
        </div>
    );
};

export default ProductSection;
