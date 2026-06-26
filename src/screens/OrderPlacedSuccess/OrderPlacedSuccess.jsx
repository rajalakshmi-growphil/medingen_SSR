import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { placePrescription, getCartDataForID } from "../../api/Api";
import {
  MdCheckCircle,
  MdLocationOn,
  MdHome,
  MdCheck,
  MdInventory2,
  MdLocalShipping,
  MdAccessTime,
  MdCreditCard,
  MdQrCodeScanner,
  MdPayments
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import { BsPatchCheckFill } from "react-icons/bs";

import "./style.css";
import Header from "../Dashboard/Header";

import Navigation from "../Dashboard/Navigation";
import { Helmet } from "react-helmet";

export const OrderPlacedSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [backendCartData, setBackendCartData] = useState(null);

  const {
    cart_id,
    prescription_id,
    total_amount,
    coupon_savings,
    payment_method,
    deliveryAddress
  } = location.state || {};

  useEffect(() => {
    window.dispatchEvent(new Event('clearCart'));
    const fetchPrescription = async () => {
      try {
        const response = await placePrescription(prescription_id);
        if (response.status === 200) {
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to place prescription:", error);
      }
    };

    const loadBackendData = async () => {
      if (cart_id) {
        try {
          const res = await getCartDataForID(cart_id);
          if (res.status === 200) {
            setBackendCartData(res.data);
            
            // Redirect if cart is still in progress (not placed)
            if (res.data?.cartStatus === 'active') {
                navigate("/cart");
            }
            
            // Redirect if cart status is pending_confirm (needs verification first)
            if (res.data?.cartStatus === 'pending_confirm') {
                navigate("/cart/pharmacist-verification", { state: location.state });
            }
          }
        } catch (e) {
          console.error("Error loading cart data:", e);
        } finally {
          setIsLoaded(true);
        }
      }
    };

    if (cart_id) {
        loadBackendData();
    }
    
    if (location.state?.prescription_id) {
      fetchPrescription();
    } else if (location.state?.cart_id) {
      // already loading via loadBackendData
    } else {
      navigate("/");
    }
  }, [location.state, navigate, cart_id, prescription_id]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleWhatsApp = () => {
    const displayPaymentMethod = backendCartData?.paymentmode || payment_method;
    const isCOD = displayPaymentMethod === "cod";
    const methodLabel = isCOD ? "Cash on Delivery" : (displayPaymentMethod?.includes('scanner') ? "UPI Scan & Pay" : "Online Payment");
    const message = `Hello, I've placed an order (${methodLabel}). Order ID: #MIG-${backendCartData?.cart_id || cart_id}. Total Amount: ₹${backendCartData?.orderSummary?.totalAmount || total_amount}. Please confirm my order.`;
    window.open(`https://wa.me/917090123709?text=${encodeURIComponent(message)}`, "_blank");
  };

  const getEstDelivery = () => {
    const displayAddress = backendCartData?.deliveryAddress || deliveryAddress;
    const pin = String(displayAddress?.pincode || "");
    const city = (displayAddress?.city || "").toLowerCase();
    
    if (pin.startsWith('6')) return "Tomorrow by 10 PM";
    if (pin.startsWith('5') || city === 'bangalore') return "in 1–2 days";
    if (pin.startsWith('1')) return "in 2–3 days";
    if (city === 'pune' || city === 'kolkata') return "in 3–4 days";
    if (city === 'hyderabad' || city === 'mumbai') return "in 2–3 days";
    if (['2', '3', '4', '7', '8'].includes(pin[0])) return "in 4–5 days";
    
    return "in 4–6 days"; 
  };

  const getPaymentMethodInfo = () => {
    const displayPaymentMethod = backendCartData?.paymentmode || payment_method;
    const displayAmount = backendCartData?.orderSummary?.totalAmount || total_amount;
    const isVerifiedScanner = displayPaymentMethod?.includes('scanner') && backendCartData?.cartStatus === 'payment';

    switch (displayPaymentMethod) {
      case 'cod':
        return {
          title: "Payment Method: Cash on Delivery",
          subtitle: <>Please keep <span className="ops-bold-amount">₹{displayAmount?.toFixed?.(2) || displayAmount}</span> ready at the time of delivery.</>,
          icon: <MdPayments size={18} color="#7c3aed" />,
          badge: "💵"
        };
      case 'upi_scanner':
      case 'scanner':
        if (isVerifiedScanner) {
          return {
            title: "Payment Method: UPI Scan & Pay",
            subtitle: <>Payment of <span className="ops-bold-amount">₹{displayAmount?.toFixed?.(2) || displayAmount}</span> <span className="ops-bold-amount" style={{ color: '#16a34a' }}>Successfully Verified</span> by Medingen team. Your order is confirmed!</>,
            icon: <BsPatchCheckFill size={18} color="#16a34a" />,
            badge: "✅",
            isVerified: true
          };
        }
        return {
          title: "Payment Method: UPI Scan & Pay",
          subtitle: <>Kindly wait for payment <span className="ops-bold-amount">verification</span> of <span className="ops-bold-amount">₹{displayAmount?.toFixed?.(2) || displayAmount}</span> by the Medingen team. We'll confirm after you share screenshot on WhatsApp.</>,
          icon: <MdQrCodeScanner size={18} color="#7c3aed" />,
          badge: "🕒"
        };
      case 'online':
      default:
        return {
          title: "Payment Method: Online Payment",
          subtitle: <>Payment of <span className="ops-bold-amount">₹{displayAmount?.toFixed?.(2) || displayAmount}</span> <span className="ops-bold-amount" style={{ color: '#16a34a' }}>Successful</span>. Thank you for your order!</>,
          icon: <MdCreditCard size={18} color="#7c3aed" />,
          badge: "💳"
        };
    }
  };

  if (!isLoaded) return null;

  const { title, subtitle, icon, badge, isVerified: isVerifiedScanner } = getPaymentMethodInfo();
  
  const displayPaymentMethod = backendCartData?.paymentmode || payment_method;
  const displayAddress = backendCartData?.deliveryAddress || deliveryAddress;
  const displayAmount = backendCartData?.orderSummary?.totalAmount || total_amount;

  const estDelivery = getEstDelivery();
  const isPendingVerification = displayPaymentMethod?.includes('scanner') && !isVerifiedScanner;

  const formatOrderTime = (dateStr) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`;
    } else {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return `${date.toLocaleDateString('en-IN', options)}, ${timeStr}`;
    }
  };

  const orderTimeLabel = formatOrderTime(backendCartData?.pending_confirm_at);

  return (
    <div className="ops-master-wrapper">
      <Helmet>
        <title>{isPendingVerification ? "Payment Verification Pending | Medingen" : "Order Placed Successfully | Medingen"}</title>

      </Helmet>
      
      <Header title="Order Placed" maxWidth={650} breadcrumbPadding="0 16px" />

      <main className="ops-page">
        <div className="ops-container">

          {/* Success Header */}
          <div className="ops-success-header ops-animate">
            <div className="ops-success-icon-ring">
              <div className="ops-success-icon-inner">
                {isPendingVerification ? (
                  <MdAccessTime size={40} />
                ) : (
                  <MdCheckCircle size={40} />
                )}
              </div>
            </div>
            <h1 className="ops-title">
              {isPendingVerification ? "Payment Verification Pending" : "Order Placed Successfully!"}
            </h1>

            <p className="ops-order-id">Order ID: #MIG-{backendCartData?.cart_id || cart_id || prescription_id}</p>
          </div>

          {/* Payment Method Card */}
          {(displayAmount || displayPaymentMethod) && (
            <div className="ops-card ops-payment-card ops-animate ops-delay-1">
              <div className="ops-card-row">
                <div className="ops-card-icon-wrap">
                  {icon}
                </div>
                <div className="ops-card-text">
                  <strong>{title}</strong>
                  <p>{subtitle}</p>
                </div>
              </div>
              <div className="ops-payment-status-icon">
                  <MdPayments size={40} />
              </div>
            </div>
          )}

          {/* Order Status Timeline */}
          <div className="ops-card ops-animate ops-delay-2">
            <div className="ops-status-header">
              <span className="ops-status-title">Order Status</span>
              <span className="ops-est-delivery">
                <MdAccessTime size={14} /> Estimated Delivery: {estDelivery}
              </span>
            </div>

            <div className="ops-timeline">
              <div className="ops-timeline-line"></div>
              
              <div className="ops-timeline-item active">
                <div className="ops-timeline-dot active"><MdCheck size={14} color="#fff" /></div>
                <div className="ops-timeline-content">
                  <strong>Order Placed</strong>
                  <span className="ops-timeline-time">{orderTimeLabel}</span>
                </div>
              </div>

              <div className="ops-timeline-item active">
                <div className="ops-timeline-dot active"><MdCheck size={14} color="#fff" /></div>
                <div className="ops-timeline-content">
                  <strong>Pharmacist Review</strong>
                  <span className="ops-timeline-time">Reviewed Successfully</span>
                </div>
              </div>

              <div className="ops-timeline-item active">
                <div className="ops-timeline-dot current">
                    <div className="ops-dot-inner"></div>
                </div>
                <div className="ops-timeline-content">
                  {isPendingVerification ? (

                    <strong>Awaiting Payment Verification</strong>
                  ) : (
                    <strong>Order Confirmed</strong>
                  )}
                  <span className="ops-timeline-time">Processing at warehouse</span>
                </div>
              </div>

              <div className="ops-timeline-item pending">
                <div className="ops-timeline-dot pending"><MdInventory2 size={12} color="#94a3b8" /></div>
                <div className="ops-timeline-content">
                  <strong>Packed</strong>
                  <span className="ops-timeline-time">Pending</span>
                </div>
              </div>

              <div className="ops-timeline-item pending">
                <div className="ops-timeline-dot pending"><MdLocalShipping size={12} color="#94a3b8" /></div>
                <div className="ops-timeline-content">
                  <strong>Shipped</strong>
                  <span className="ops-timeline-time">Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address & Actions */}
          <div className="ops-bottom-grid ops-animate ops-delay-3">
            {/* Delivery Address */}
            <div className="ops-card ops-address-card">
                <div className="ops-address-header">
                    <MdLocationOn size={22} />
                    <strong>Delivery Address</strong>
                </div>
                {displayAddress ? (
                    <div className="ops-address-details">
                        <p className="ops-address-name">{displayAddress.name || "Customer"}</p>
                        <p className="ops-address-line">
                            {displayAddress.addressLine1}
                            {displayAddress.addressLine2 ? <>, {displayAddress.addressLine2}</> : ""}
                            <br />
                            {displayAddress.state} - {displayAddress.pincode}
                        </p>
                        {displayAddress.phone_number && (
                            <span className="ops-address-phone">
                                Mobile: +91 {displayAddress.phone_number?.replace(/(\d{5})(\d{5})/, '$1 $2')}
                            </span>
                        )}
                    </div>
                 ) : (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>No address details available.</p>
                )}
            </div>

            {/* Sidebar Actions */}
            <div className="ops-actions-col">
                <div className="ops-badge-verified">
                    <BsPatchCheckFill size={16} />
                    Verified by Pharmacists
                </div>
                
                <button className="ops-btn ops-btn-whatsapp" onClick={handleWhatsApp}>
                    <FaWhatsapp size={20} />
                    Chat on WhatsApp
                </button>
                
                <button className="ops-btn ops-btn-home" onClick={handleGoHome}>
                    <MdHome size={20} />
                    Back to Home
                </button>
            </div>
          </div>

        </div>

        {/* Footer outside the scrolling container for full-width layout */}
        <div className="ops-footer-wrapper">
          </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default OrderPlacedSuccess;
