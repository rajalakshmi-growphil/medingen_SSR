"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "../../Dashboard/Header";
import Navigation from "../../Dashboard/Navigation";

const useNavigate = () => {
  const router = useRouter();
  return (path: string, opts?: any) => {
    if (opts && opts.state) {
      sessionStorage.setItem("router_state", JSON.stringify(opts.state));
    }
    if (opts && opts.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
};

const useLocation = () => {
  const pathname = usePathname();
  const [state, setState] = useState<any>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("router_state");
      if (saved) setState(JSON.parse(saved));
    }
  }, []);
  return { pathname, state };
};

import {
  MdCheckCircle,
  MdMedicalServices,
  MdPayment,
  MdRefresh,
  MdArrowBack
} from "react-icons/md";
import { FiPhone, FiMessageCircle, FiEdit2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { reActivateCart, getCartDataForID, getCartData, updateDeliveryCharge } from "@/lib/api";
import "./PharmacistVerification.css";

export const PharmacistVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartState, setCartState] = useState<any>({});

  useEffect(() => {
    if (location.state) {
      setCartState(location.state);
    }
  }, [location.state]);

  const { cartId, orderSummary, pendingConfirmAt, offerTitle, couponApplied, prescriptionDetails, deliveryAddress, pharmacist_name, cartStatus } = cartState;
  const pharmacistName = pharmacist_name || "Dr. Lakshmi MBBS, MD";

  const [timeLeft, setTimeLeft] = useState(600);
  const [dataLoaded, setDataLoaded] = useState(!!cartId);

  const orderPlacedTimeFormatted = useMemo(() => {
    const timeToDisplay = pendingConfirmAt || new Date().toISOString();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timeToDisplay));
  }, [pendingConfirmAt]);

  const isWorkingHours = useMemo(() => {
    const timeToCheck = pendingConfirmAt ? new Date(pendingConfirmAt) : new Date();
    const currentHour = timeToCheck.getHours();
    return currentHour >= 10 && currentHour < 17;
  }, [pendingConfirmAt]);

  useEffect(() => {
    if (pendingConfirmAt) {
      const orderTime = new Date(pendingConfirmAt);
      const endTime = new Date(orderTime.getTime() + 10 * 60000);
      const now = new Date();
      const diffSeconds = Math.floor((endTime - now) / 1000);
      setTimeLeft(diffSeconds > 0 ? diffSeconds : 0);
    }
  }, [pendingConfirmAt]);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (!cartId) return;
    if (isManual) Swal.showLoading();
    try {
      const res = await getCartDataForID(cartId);
      if (isManual) Swal.close();
      if (res.status === 200) {
        const data = res.data;

        // Auto-sync delivery charge if needed
        if (data.deliveryAddress && data.deliveryAddress.pincode && ["pending_confirm", "confirm"].includes(data.cartStatus)) {
          const pin = String(data.deliveryAddress.pincode).trim();
          const firstDigit = pin.charAt(0);
          let expectedCharge = 50;
          if (["5", "6"].includes(firstDigit)) { expectedCharge = 50; }
          else if (["1", "2", "3", "4", "7", "8"].includes(firstDigit)) { expectedCharge = 60; }

          const totalSellingPrice = parseFloat(data.orderSummary.total_selling_price?.replace(/[^0-9.]/g, "") || 0);
          const freeDeliveryApplied = 
            data.offerTitle?.toLowerCase().includes("free delivery") || 
            data.offerTitle?.toLowerCase().includes("free deivery") || 
            totalSellingPrice >= 500;
          if (freeDeliveryApplied) { expectedCharge = 0; }

          const currentCharge = parseFloat(data.orderSummary.total_shipping_charge) || 0;

          if (currentCharge !== expectedCharge) {
            await updateDeliveryCharge(data.cart_id, expectedCharge);
            return fetchStatus(isManual);
          }
        }

        // Update state with fresh data from polling
        setCartState(prev => ({
          ...prev,
          orderSummary: data.orderSummary,
          pendingConfirmAt: data.pending_confirm_at,
          offerTitle: data.offerTitle,
          couponApplied: data.coupon_applied,
          prescriptionDetails: data.prescriptionDetails,
          deliveryAddress: data.deliveryAddress,
          pharmacist_name: data.pharmacist_name
        }));

        if (data.cartStatus === "confirm") {
          navigate("/cart/pharmacist-verification/payment", {
            state: {
              cartData: data
            }
          });
        } else if (data.cartStatus !== "pending_confirm") {
          navigate("/cart");
        } else if (isManual) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Verification still in progress',
            showConfirmButton: false,
            timer: 2000
          });
        }
      }
    } catch (error) {
      if (isManual) Swal.close();
      console.error("Error checking cart status:", error);
    }
  }, [cartId, navigate]);

  // Initial data fetch if missing
  useEffect(() => {
    const loadInitialData = async () => {
      if (!cartId) {
        try {
          const res = await getCartData();
          if (res.status === 200) {
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            if (data && data.cartStatus === 'pending_confirm') {
              setCartState({
                cartId: data.cart_id,
                orderSummary: data.orderSummary,
                pendingConfirmAt: data.pending_confirm_at,
                offerTitle: data.offerTitle,
                couponApplied: data.coupon_applied,
                prescriptionDetails: data.prescriptionDetails,
                deliveryAddress: data.deliveryAddress,
                pharmacist_name: data.pharmacist_name,
                cartStatus: data.cartStatus
              });
              setDataLoaded(true);
            } else if (data && data.cartStatus === 'confirm') {
              navigate("/cart/pharmacist-verification/payment", { state: { cartData: data } });
            } else {
              navigate("/cart");
            }
          }
        } catch (error) {
          console.error("Error fetching initial cart data:", error);
          navigate("/cart");
        }
      }
    };
    loadInitialData();
  }, [cartId, navigate]);

  useEffect(() => {
    if (timeLeft <= 0 || !isWorkingHours) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isWorkingHours]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasPrescription = useMemo(() => {
    return prescriptionDetails && Object.keys(prescriptionDetails).length > 0;
  }, [prescriptionDetails]);

  const prescriptionDateFormatted = useMemo(() => {
    if (!prescriptionDetails?.prescription_date) return "";
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(prescriptionDetails.prescription_date));
    } catch (e) {
      return prescriptionDetails.prescription_date.split(" 00:")[0];
    }
  }, [prescriptionDetails]);

  const progressSteps = useMemo(() => {
    const steps = [
      { id: 'placed', label: "Order Placed", time: orderPlacedTimeFormatted, status: "completed" }
    ];

    if (hasPrescription) {
      steps.push({
        id: 'uploaded',
        label: "Prescription Uploaded",
        time: prescriptionDateFormatted,
        status: "completed"
      });
    }

    steps.push(
      { id: 'review', label: "Pharmacist Review", time: "In Progress", status: "current" },
      { id: 'payment', label: "Payment", time: "Pending", status: "pending" }
    );

    return steps;
  }, [orderPlacedTimeFormatted, hasPrescription]);

  const standardDeliveryFee = useMemo(() => {
    const pin = deliveryAddress?.pincode?.toString() || "";
    const firstChar = pin.charAt(0);
    if (['6', '5'].includes(firstChar)) return 50;
    if (['1', '2', '3', '4', '8', '7'].includes(firstChar)) return 60;
    return 50;
  }, [deliveryAddress]);
  
  const totalAmt = useMemo(() => {
    const val = orderSummary?.total_selling_price;
    if (val) {
      const match = String(val).match(/[\d,]+\.?\d*/g);
      if (match) return parseFloat(match[match.length - 1].replace(/,/g, ""));
    }
    // Fallback: Total - Shipping - COD
    const total = parseFloat(orderSummary?.totalAmount || 0);
    const shipping = parseFloat(orderSummary?.total_shipping_charge || 0);
    const cod = parseFloat(orderSummary?.cod_charge || 0);
    return Math.max(0, total - shipping - cod);
  }, [orderSummary?.total_selling_price, orderSummary?.totalAmount, orderSummary?.total_shipping_charge, orderSummary?.cod_charge]);

  const isOfferActive = useMemo(() => {
    return totalAmt >= 1000 || offerTitle?.toLowerCase().includes("1000") || offerTitle?.toLowerCase().includes("free deivery");
  }, [totalAmt, offerTitle]);

  const calculatedTotalAmount = useMemo(() => {
    let shipping = parseFloat(orderSummary?.total_shipping_charge || 0);
    const cod = parseFloat(orderSummary?.cod_charge?.toString().replace(/[^0-9.]/g, "") || 0);
    
    let extraDiscount = 0;
    if (isOfferActive) {
      extraDiscount = totalAmt * 0.05;
      shipping = 0;
    }
    
    return totalAmt - extraDiscount + shipping + cod;
  }, [isOfferActive, totalAmt, orderSummary?.total_shipping_charge, orderSummary?.cod_charge]);

  const handleEditCart = async () => {
    const result = await Swal.fire({
      title: 'Modify Cart?',
      text: 'Do you want to change your cart items? This will reset the verification process.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, modify',
      cancelButtonText: 'No, stay here'
    });

    if (result.isConfirmed) {
      try {
        await reActivateCart(cartId);
        navigate("/cart");
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to update cart status. Please try again.',
          icon: 'error',
          confirmButtonText: 'Okay',
        });
      }
    }
  };

  return (
    <>
      <div className="verification-page">
        <Header />
        <header className="verification-header-premium">
          <div className="header-content">
            <h1>Pharmacist Verification</h1>
            <button className="header-edit-cart-link" onClick={handleEditCart} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MdArrowBack size={18} /> <span>Edit Your Cart</span>
            </button>
          </div>
        </header>

        {/* Mobile-Only Layout */}
        <div className="mobile-verification-view">
          <div className="mv-header-section">
            <h1>Verification Progress</h1>
            <div className="mv-status-badge">
              <span className="dot pulse"></span>
              Live Verification
            </div>
          </div>
          {/* 1. Pro Tip */}
          <div className="mv-pro-tip">
            <h5>Pro Tip</h5>
            <p>You can safely close this window. You will receive a confirmation via WhatsApp or call from:
              <span style={{ fontWeight: "800" }}> 7090123709 </span> or
              <span style={{ fontWeight: "800" }}> 9884281366 </span>.
            </p>
          </div>

          {/* 2. Timer Section */}
          <div className="mv-timer-section">
            <div className="circular-timer-mobile">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" className="timer-bg" />
                <circle
                  cx="100" cy="100" r="90"
                  className="timer-progress"
                  style={{
                    strokeDasharray: "565",
                    strokeDashoffset: isWorkingHours ? 565 * (1 - timeLeft / 600) : 565
                  }}
                />
              </svg>
              <div className="timer-content-inner">
                {!isWorkingHours ? (
                  <span className="label">OFFLINE</span>
                ) : timeLeft <= 0 ? (
                  <span className="time">WAIT</span>
                ) : (
                  <>
                    <span className="time">{formatTime(timeLeft)}</span>
                    <span className="label">MINUTES LEFT</span>
                  </>
                )}
              </div>
            </div>
            <div className="mv-completion-hint">Estimated Completion</div>
          </div>

          {/* 3. Pharmacist Card */}
          <div className="mv-pharmacist-card">
            <div className="mv-pharm-avatar">
              <img src="/Pharmacist_Support.svg" alt="" onError={(e) => e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"} />
              <div className="online-indicator"></div>
            </div>
            <div className="mv-pharm-info">
              <h4>{pharmacistName}</h4>
              <p>Currently verifying your clinical details</p>
            </div>
          </div>

          {/* 4. Timeline Card */}
          <div className="mv-timeline-card">
            {progressSteps.map((step, idx) => (
              <div key={idx} className="mv-timeline-item">
                <div className="mv-dot-container">
                  <div className={`mv-dot ${step.status}`}>
                    {step.status === "completed" && <MdCheckCircle size={16} />}
                  </div>
                  {idx < progressSteps.length - 1 && (
                    <div className={`mv-line ${step.status === "completed" ? "active" : ""}`}></div>
                  )}
                </div>
                <div className="mv-step-info">
                  <h4 style={{ color: step.status === "pending" ? "#9ca3af" : "#111827" }}>{step.label}</h4>
                  <p>{step.label === "Pharmacist Review" && step.status === "current" ? `${pharmacistName.split(' ')[0]} ${pharmacistName.split(' ')[1]} is reviewing your details` : step.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 5. Mobile Order Summary */}
          <div className="mv-summary-card">
            <h3>Order Summary</h3>
            {(() => {
              const formatVal = (val) => {
                if (!val && val !== 0) return "₹0.00";
                if (typeof val === 'string' && val.includes("Rs.")) return val.replace("Rs.", "₹").trim();
                const num = parseFloat(val.toString().replace(/[^0-9.]/g, "")) || 0;
                return `₹${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              };
              const formatDiscountVal = (val) => {
                if (!val && val !== 0) return "-₹0.00";
                if (typeof val === 'string' && val.includes("Rs.")) return val.replace("Rs.", "-₹").trim();
                const num = parseFloat(val.toString().replace(/[^0-9.]/g, "")) || 0;
                return `-₹${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              };

              // ✅ Use total_selling_price directly for Order Total
              const orderTotalStr = (() => {
                const val = orderSummary?.total_selling_price;
                if (!val && val !== 0) return "₹0.00";
                if (typeof val === 'string' && val.includes("Rs.")) return val.replace("Rs.", "₹").trim();
                const num = parseFloat(val.toString().replace(/[^0-9.]/g, "")) || 0;
                return `₹${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              })();

              return (
                <>
                  <div className="mv-summary-row">
                    <span className="label">MRP Total</span>
                    <span className="value">{formatVal(orderSummary?.totalMRP)}</span>
                  </div>

                  {parseFloat(orderSummary?.totalSavings?.toString().replace(/[^0-9.]/g, "") || 0) > 0 && (
                    <div className="mv-summary-row">
                      <span className="label">Product Discount</span>
                      <span className="value discount">{formatDiscountVal(orderSummary.totalSavings)}</span>
                    </div>
                  )}

                  {parseFloat(orderSummary?.couponDiscount?.toString().replace(/[^0-9.]/g, "") || 0) > 0 && (
                    <div className="mv-summary-row">
                      <span className="label">Coupon Discount</span>
                      <span className="value discount">{formatDiscountVal(orderSummary.couponDiscount)}</span>
                    </div>
                  )}

                  {/* ✅ Order Total using total_selling_price */}
                  <div className="mv-summary-row mv-order-total-row">
                    <span className="label" style={{ fontWeight: 700 }}>Order Total</span>
                    <span className="value" style={{ fontWeight: 700 }}>{orderTotalStr}</span>
                  </div>

                  {isOfferActive && (
                    <div className="mv-summary-row">
                      <span className="label">Offer Discount (5%)</span>
                      <span className="value discount">-₹{(totalAmt * 0.05).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="mv-summary-row">
                    <span className="label">Delivery Fee</span>
                    <span className="value">
                      {(parseFloat(orderSummary?.total_shipping_charge) === 0 || isOfferActive) ? (
                        <>
                          <span style={{ textDecoration: "line-through", color: "#9ca3af", marginRight: 8 }}>
                            ₹{standardDeliveryFee.toFixed(2)}
                          </span>
                          <span style={{ color: "#7c3aed" }}>FREE</span>
                        </>
                      ) : (
                        <span>₹{parseFloat(orderSummary?.total_shipping_charge || 0).toFixed(2)}</span>
                      )}
                    </span>
                  </div>

                  {parseFloat(orderSummary?.cod_charge?.toString().replace(/[^0-9.]/g, "") || 0) > 0 && (
                    <div className="mv-summary-row">
                      <span className="label">Cash on Delivery Fee</span>
                      <span className="value" style={{ color: "#7c3aed" }}>{formatVal(orderSummary.cod_charge)}</span>
                    </div>
                  )}

                  <div className="mv-total-row">
                    <span className="label">Total Amount</span>
                    <span className="value">{formatVal(calculatedTotalAmount)}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* 6. Action Buttons stack */}
          <div className="mv-actions-stack">
            <button className="mv-btn-primary" onClick={() => fetchStatus(true)}>
              <MdRefresh size={20} /> Refresh Status
            </button>
            <button className="mv-btn-outline" onClick={handleEditCart}>
              <FiEdit2 size={18} /> Edit Your Cart
            </button>
            <div className="mv-social-grid">
              <button className="mv-social-btn" onClick={() => window.open("https://wa.me/917090123709", "_blank")}>
                <FiMessageCircle size={18} color="#10b981" /> WhatsApp
              </button>
              <button className="mv-social-btn" onClick={() => window.open("tel:+917090123709")}>
                <FiPhone size={18} color="#7c3aed" /> Support
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="verification-container desktop-only">
          {/* Left Column: Order Progress & Context */}
          <aside className="left-column">
            <div className="card glass-card progress-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 20 }}>Order Progress</h3>
              <div className="progress-list">
                {progressSteps.map((step, idx) => (
                  <div key={idx} className={`progress-item ${step.status}`}>
                    <div className="step-icon-wrapper">
                      {step.status === "completed" ? (
                        <div className="step-icon-inner completed">
                          <MdCheckCircle size={18} />
                        </div>
                      ) : step.status === "current" ? (
                        <div className="step-icon-inner current">
                          <MdMedicalServices size={16} />
                        </div>
                      ) : (
                        <div className="step-icon-inner pending">
                          <MdPayment size={16} />
                        </div>
                      )}
                      {idx < progressSteps.length - 1 && <div className="step-line"></div>}
                    </div>
                    <div className="step-content">
                      <span className="step-label">{step.label}</span>
                      <span className="step-time">{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="why-verification-box">
              <h5>Why verification is needed ?</h5>
              <p>Our licensed pharmacists verify your prescription to ensure safe dosage, correct medicine, and avoid harmful drug interactions.</p>
              <div className="bg-circles"></div>
            </div>
          </aside>

          {/* Center Column: Timer & Verification Process */}
          <main className="center-column">
            <div className="verification-main-card">
              <div className="verification-header-center">
                <h2>Estimated Completion</h2>
                <p>Live verification processing</p>
              </div>

              <div className="timer-container-large">
                <div className="timer-circle-wrapper">
                  <svg className="timer-svg" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" className="timer-bg-path" />
                    <circle
                      cx="100" cy="100" r="90"
                      className="timer-progress-path"
                      style={{
                        strokeDashoffset: isWorkingHours ? 565 * (1 - timeLeft / 600) : 565
                      }}
                    />
                  </svg>
                  <div className="timer-center-text">
                    {!isWorkingHours ? (
                      <div className="offline-notice">
                        <span className="offline-title">Tomorrow Morning 10 AM</span>
                        <span className="offline-tag">OFFLINE HOURS</span>
                      </div>
                    ) : timeLeft <= 0 ? (
                      <div className="callback-notice">
                        <span className="time-val">Wait</span>
                        <span className="time-label">CALLING YOU...</span>
                      </div>
                    ) : (
                      <>
                        <span className="time-val">{formatTime(timeLeft)}</span>
                        <span className="time-label">MINUTES LEFT</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pharmacist-status-pill">
                <div className="avatar-wrapper">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Avery" alt="Pharmacist" />
                  <span className="status-dot"></span>
                </div>
                <div className="pharm-details">
                  <h4>{pharmacistName}</h4>
                  <p>Currently verifying your clinical details <span className="online-dot"></span></p>
                </div>
              </div>

              <button className="status-refresh-btn" onClick={() => fetchStatus(true)}>
                <MdRefresh size={20} /> Refresh Status
              </button>
            </div>
          </main>

          {/* Right Column: Pro Tip & Summary & Support */}
          <aside className="right-column">
            <div className="pro-tip-box" style={{ background: "#f5f3ff" }}>
              <h5 style={{ color: "#7c3aed", fontSize: "14px", fontWeight: "800", marginBottom: "8px" }}>Pro Tip</h5>
              <p style={{ color: "#7c3aed", fontSize: "12px", opacity: 0.8, lineHeight: "1.5" }}>
                You can safely close this window. You will receive a confirmation via WhatsApp or call from:
                <span style={{ fontWeight: "800" }}> 7090123709 </span> or
                <span style={{ fontWeight: "800" }}> 9884281366 </span>.
              </p>
            </div>

            <div className="card order-summary-card">
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: "20px" }}>Order Summary</h3>

              <div className="summary-list">
                {(() => {
                  const formatVal = (val, color) => {
                    if (!val && val !== 0) return null;
                    let displayString = "";
                    if (typeof val === 'string' && val.includes("Rs.")) {
                      displayString = val.replace("Rs.", "₹").trim();
                    } else {
                      const num = parseFloat(val.toString().replace(/[^0-9.]/g, "")) || 0;
                      displayString = `₹${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                    return <span className="value" style={color ? { color } : {}}>{displayString}</span>;
                  };

                  const formatDiscountVal = (val) => {
                    if (!val && val !== 0) return null;
                    let displayString = "";
                    if (typeof val === 'string' && val.includes("Rs.")) {
                      displayString = val.replace("Rs.", "-₹").trim();
                    } else {
                      const num = parseFloat(val.toString().replace(/[^0-9.]/g, "")) || 0;
                      displayString = `-₹${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                    return <span className="value" style={{ color: "#7c3aed" }}>{displayString}</span>;
                  };

                  // ✅ Use total_selling_price directly for Order Total
                  const orderTotalStr = (() => {
                    const val = orderSummary?.total_selling_price;
                    if (!val && val !== 0) return "₹0.00";
                    if (typeof val === 'string' && val.includes("Rs.")) return val.replace("Rs.", "₹").trim();
                    const num = parseFloat(val.toString().replace(/[^0-9.]/g, "")) || 0;
                    return `₹${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  })();

                  return (
                    <>
                      {/* MRP Total */}
                      <div className="summary-line">
                        <span className="label">MRP Total</span>
                        {formatVal(orderSummary?.totalMRP)}
                      </div>

                      {/* Product Discount */}
                      {orderSummary?.totalSavings && parseFloat(orderSummary.totalSavings.toString().replace(/[^0-9.]/g, "")) > 0 ? (
                        <div className="summary-line">
                          <span className="label">Product Discount</span>
                          {formatDiscountVal(orderSummary.totalSavings)}
                        </div>
                      ) : null}

                      {/* Coupon Discount */}
                      {orderSummary?.couponDiscount && parseFloat(orderSummary.couponDiscount.toString().replace(/[^0-9.]/g, "")) > 0 ? (
                        <div className="summary-line">
                          <span className="label">Coupon Discount</span>
                          {formatDiscountVal(orderSummary.couponDiscount)}
                        </div>
                      ) : null}

                      {/* ✅ Order Total using total_selling_price */}
                      <div className="summary-line">
                        <span className="label" style={{ fontWeight: 700 }}>Order Total</span>
                        <span className="value" style={{ fontWeight: 700 }}>{orderTotalStr}</span>
                      </div>

                      {isOfferActive && (
                        <div className="summary-line">
                          <span className="label">Offer Discount (5%)</span>
                          <span className="value" style={{ color: "#7c3aed" }}>-₹{(totalAmt * 0.05).toFixed(2)}</span>
                        </div>
                      )}

                      {/* Delivery Fee */}
                      <div className="summary-line">
                        <span className="label">Delivery Fee</span>
                        <div className="value">
                          {(parseFloat(orderSummary?.total_shipping_charge) === 0 || isOfferActive) ? (
                            <>
                              <span className="strike">₹{standardDeliveryFee.toFixed(2)}</span>
                              <span className="free" style={{ color: "#7c3aed", marginLeft: "8px" }}>FREE</span>
                            </>
                          ) : (
                            <span>₹{parseFloat(orderSummary?.total_shipping_charge || 0).toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      {/* COD Fee */}
                      {orderSummary?.cod_charge && parseFloat(orderSummary.cod_charge.toString().replace(/[^0-9.]/g, "")) > 0 ? (
                        <div className="summary-line">
                          <span className="label">Cash on Delivery Fee</span>
                          {formatVal(orderSummary.cod_charge, "#7c3aed")}
                        </div>
                      ) : null}

                      <div className="summary-divider-dashed" style={{ borderTop: "1px solid #f1f5f9", margin: "16px 0" }}></div>

                      <div className="summary-line">
                        <span className="label" style={{ fontSize: "16px", fontWeight: "800", color: "#111827" }}>Total Amount</span>
                        <span className="value" style={{ fontSize: "18px", fontWeight: "800", color: "#111827" }}>
                          {formatVal(calculatedTotalAmount)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="support-actions">
              <button className="btn-support whatsapp-btn" onClick={() => window.open("https://wa.me/917090123709", "_blank")}>
                <FiMessageCircle size={20} /> Chat on WhatsApp
              </button>
              <button className="btn-support call-btn" onClick={() => window.open("tel:+917090123709")}>
                <FiPhone size={18} /> Call Support
              </button>
            </div>
          </aside>
        </div>

        </div>
      <Navigation />
    </>
  );
};