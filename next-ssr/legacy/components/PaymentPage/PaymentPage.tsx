"use client";

import React, { useState, useEffect, useRef } from "react";
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

import { AddressSelectionModal } from "../OrderProgressConfirmation/OrderProgressConfirmation";
import {
  MdCheckCircle,
  MdLock,
  MdCreditCard,
  MdAccountBalance,
  MdAssignmentInd,
  MdWarning,
  MdClose,
  MdQrCodeScanner,
  MdPayments,
  MdEdit,
  MdDeleteOutline,
  MdAdd,
  MdLocationOn
} from "react-icons/md";
import { FiShield, FiRefreshCw, FiSmartphone, FiCopy, FiCheck, FiPhone, FiHeadphones, FiMoreVertical, FiEdit2, FiPlus, FiMessageCircle } from "react-icons/fi";
import { BsPatchCheckFill, BsCheck2Circle } from "react-icons/bs";
import { IoSparkles, IoLocationSharp, IoCall } from "react-icons/io5";
import Swal from "sweetalert2";
import { 
  create_order, 
  check_payment, 
  getCartDataForID, 
  updateCODCharge, 
  cancelOrder,
  listAddresses,
  addAddress,
  updateAddress,
  updateDeliveryAddress,
  updateCartPayment,
  updateDeliveryCharge,
  checkDTDCAvailability
} from "@/lib/api";
import "./PaymentPage.css";


const PAYMENT_METHODS = [
  {
    id: "upi",
    name: "UPI",
    desc: "Pay instantly using any UPI App",
    icon: <FiSmartphone size={18} />,
    badge: "RECOMMENDED",
    showApps: true,
  },
  {
    id: "upi_scanner",
    name: "Scan & Pay",
    desc: "Scan QR or use UPI ID to pay instantly via any UPI app.",
    icon: <MdQrCodeScanner size={20} />,
    badge: "NEW",
    showApps: false,
    showQR: true,
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    desc: "Pay when your medicine arrives",
    icon: <MdPayments size={20} />,
    badge: null,
    showApps: false,
    codNote: true,
    codAmount: 60,
    deliveryNote: "Note: COD orders may take 1-2 extra days for delivery."
  },
];

export const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartData, setCartData] = useState<any>({});
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showMoreUPI, setShowMoreUPI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state && location.state.cartData) {
      setCartData(location.state.cartData);
      setLoading(false);
    }
  }, [location.state]);
  const [upiCopied, setUpiCopied] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSyncingCOD, setIsSyncingCOD] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dtdcAvailable, setDtdcAvailable] = useState(true);
  const payButtonRef = useRef(null);
  const termsRef = useRef(null);
  const scannerRef = useRef(null);

  const UPI_ID = "medingenhealthcare@tmb";
  const UPI_NAME = "Medingen Healthcare Private Limited";

  const handleCopyUPI = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2000);
    });
  };

  const getUPIDeepLink = (app) => {
    // Standard UPI specs: pa=ID, pn=Name, tr=TxId (opt), am=Amount, cu=Currency, tn=Note
    const params = `pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Medingen Order ' + cart_id)}`;
    switch (app) {
      case 'gpay': return `tez://upi/pay?${params}`;
      case 'phonepe': return `phonepe://pay?${params}`;
      case 'paytm': return `paytmmp://pay?${params}`;
      case 'bhim': return `upi://pay?${params}`;
      default: return `upi://pay?${params}`;
    }
  };

  const {
    cart = [],
    cart_id,
    orderSummary = {},
    deliveryAddress = {},
    cod_charge,
  } = cartData || {};

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchCartData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useEffect(() => {
    const syncCharges = async () => {
      const cartId = cartData?.cart_id;
      if (!cartId) return;

      const currentCod = parseFloat(orderSummary.cod_charge || 0);
      const isCodValid = selectedMethod === 'cod' && dtdcAvailable;
      const expectedCod = isCodValid ? 60 : 0;

      
      // Shipping Charge Logic (Referencing OrderProgressConfirmation)
      let expectedShipping = 50;
      if (deliveryAddress && deliveryAddress.pincode) {
        const pinString = String(deliveryAddress.pincode).trim();
        const firstDigit = pinString.charAt(0);
        
        if (["5", "6"].includes(firstDigit)) { expectedShipping = 50; }
        else if (["1", "2", "3", "4", "7", "8"].includes(firstDigit)) { expectedShipping = 60; }
        
        const totalSellingPrice = parseFloat(orderSummary.total_selling_price?.toString().replace(/[^0-9.]/g, "") || 0);
        const freeDeliveryApplied = 
          (cartData.offerTitle || "").toLowerCase().includes("free delivery") || 
          (cartData.offerTitle || "").toLowerCase().includes("free deivery") || 
          totalSellingPrice >= 500;
        
        if (freeDeliveryApplied) { expectedShipping = 0; }
      }
      const currentShipping = parseFloat(orderSummary.total_shipping_charge || 0);

      if (currentCod === expectedCod && currentShipping === expectedShipping) return;

      try {
        setIsSyncingCOD(true);
        if (currentCod !== expectedCod) {
          await updateCODCharge(cartId, expectedCod);
        }
        if (currentShipping !== expectedShipping) {
          await updateDeliveryCharge(cartId, expectedShipping);
        }
        
        const res = await getCartDataForID(cartId);
        if (res.status === 200) {
          setCartData(res.data);
        }
      } catch (error) {
        console.error("Error syncing charges:", error);
      } finally {
        setIsSyncingCOD(false);
      }
    };
    syncCharges();
  }, [selectedMethod, cartData?.cart_id, orderSummary.cod_charge, orderSummary.total_shipping_charge, deliveryAddress?.pincode, deliveryAddress?.id, cartData.offerTitle, orderSummary.total_selling_price, dtdcAvailable]);

  useEffect(() => {
    setTermsAccepted(false);

    const checkDTDC = async () => {
      const pin = deliveryAddress?.pincode;
      if (pin && String(pin).length === 6) {
        try {
          const res = await checkDTDCAvailability(pin);
          const available = res && res.dtdc_available !== false; // Default to true if res is null or dtdc_available is true
          setDtdcAvailable(available);
          
          if (!available && selectedMethod === 'cod') {
            setSelectedMethod('upi');
          }
        } catch (error) {
          console.error("Error checking DTDC availability:", error);
          setDtdcAvailable(true); // Fail-safe to true
        }
      }
    };
    checkDTDC();
  }, [deliveryAddress?.pincode, deliveryAddress?.id]);

  const fetchCartData = React.useCallback(async () => {
    const cartId = cartData?.cart_id || location.state?.cartData?.cart_id || location.state?.cartId;
    if (!cartId) {
      if (!cartData) navigate("/cart");
      return;
    }

    try {
      const res = await getCartDataForID(cartId);
      if (res.status === 200) {
        const data = res.data;
        const status = (data.cartStatus || data.cart_status || "").toLowerCase();
        
        if (status !== "confirm") {
          navigate("/cart");
          return;
        }
        
        setCartData(data);
      }
    } catch (error) {
      console.error("Error fetching cart data:", error);
    } finally {
      if (loading) setLoading(false);
    }
  }, [cartData?.cart_id, location.state, navigate, loading]);

  useEffect(() => {
    fetchCartData();
    const interval = setInterval(fetchCartData, 5000);
    return () => clearInterval(interval);
  }, [fetchCartData]);

  if (loading || !cartData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f7ff' }}>
        <FiRefreshCw className="pp-spin" size={32} color="#7c3aed" />
      </div>
    );
  }

  const totalMRP = orderSummary.totalMRP || "₹0.00";
  const totalSavings = orderSummary.totalSavings || "₹0.00";
  const shippingCharge = parseFloat(orderSummary.total_shipping_charge) || 0;
  
  // Dynamic Calculation to enforce UI state immediately
  const isCodValid = selectedMethod === 'cod' && dtdcAvailable;
  const backendCod = parseFloat(orderSummary.cod_charge) || 0;
  const codCharge = isCodValid ? 60 : 0;
  
  const backendTotalAmount = parseFloat(orderSummary.totalAmount) || 0;
  
  // Robustly extract the base amount for the 5% offer discount
  const totalAmt = (() => {
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
  })();

  const isOfferActive = totalAmt >= 1000 || (cartData.offerTitle || "").toLowerCase().includes("1000") || (cartData.offerTitle || "").toLowerCase().includes("free deivery");
  const extraOfferDiscount = isOfferActive ? totalAmt * 0.05 : 0;

  // Use totalAmt (selling price) as the base to calculate the final amount when offer is active
  // This avoids double-discounting if the backend already partially applied it to totalAmount
  const totalAmount = isOfferActive 
    ? (totalAmt - extraOfferDiscount + codCharge)
    : (backendTotalAmount - backendCod + codCharge);

  const couponSavings = parseFloat(orderSummary.coupon_savings) || 0;

  const loadRazorpay = (order_id, amount_due) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key: "rzp_live_gD2p7TIiAYtioQ",
        amount: amount_due,
        currency: "INR",
        name: "Medingen",
        description: "Medingen Order ID: " + cart_id,
        image: "https://medingen.in/migfulllogo.png",
        order_id: order_id,
        handler: async (response) => {
          const razorpay_order_id = response.razorpay_order_id;
          const razorpay_payment_id = response.razorpay_payment_id;
          const resp = await check_payment(cart_id, razorpay_order_id, razorpay_payment_id);
          if (resp) {
            await updateCartPayment(cart_id, 'online', 'payment');
            Swal.fire({
              title: "Payment Successful!",
              text: "Your payment is complete! Receipt will be sent to your email.",
              icon: "success",
              confirmButtonText: "Continue",
              confirmButtonColor: "#7c3aed",
            }).then(() => {
              navigate("/cart/pharmacist-verification/payment/place-order", {
                state: { 
                  total_amount: totalAmount, 
                  cart_id, 
                  coupon_savings: couponSavings,
                  payment_method: "online",
                  deliveryAddress
                },
              });
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: "Failed to verify payment. Please contact support.",
              icon: "error",
              confirmButtonText: "Go to Cart",
              confirmButtonColor: "#7c3aed",
            }).then(() => navigate("/cart"));
          }
        },
        prefill: {
          name: deliveryAddress.name || "",
          contact: deliveryAddress.phone_number || "",
        },
        theme: { color: "#7c3aed" },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      setPaying(false);
    };
    document.body.appendChild(script);
  };

  const handlePayNow = async () => {
    if (!termsAccepted) {
      Swal.fire({
        title: "Terms Required",
        text: "Please accept the Terms of Service before proceeding.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    setPaying(true);

    // ✅ Handlers for COD and Scanner (Don't need create_order)
    if (selectedMethod === "upi_scanner") {
      try {
        Swal.fire({
          title: "Processing...",
          text: "Updating your payment method",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        await updateCartPayment(cart_id, 'scanner', null);
        Swal.close();

        const message = `Hello, I've placed an order and paid via UPI Scanner. Order ID: ${cart_id}. Total Amount: ₹${totalAmount.toFixed(2)}`;
        const whatsappUrl = `https://wa.me/917090123709?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, "_blank");
        Swal.fire({
          title: "Submit on WhatsApp",
          text: "Kindly wait for payment verification by the Medingen team. Please share your payment screenshot on WhatsApp to confirm your order.",
          icon: "info",
          confirmButtonText: "Done",
          confirmButtonColor: "#7c3aed",
        }).then(() => {
          navigate("/cart/pharmacist-verification/payment/place-order", {
            state: { 
              total_amount: totalAmount, 
              cart_id, 
              coupon_savings: couponSavings,
              payment_method: "upi_scanner",
              deliveryAddress
            },
          });
        });
      } catch (e) {
        console.error("Scanner update failed", e);
        Swal.fire("Error", "Failed to update payment method. Please try again.", "error");
      } finally {
        setPaying(false);
      }
      return;
    }

    if (selectedMethod === "cod") {
      if (!dtdcAvailable) {
        Swal.fire("Not Available", "Cash on Delivery is not available for your selected pincode. Please choose an online payment method.", "error");
        return;
      }

      try {
        Swal.fire({
          title: "Processing...",
          text: "Placing your COD order",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        await updateCartPayment(cart_id, 'COD', 'payment');
        Swal.close();

        navigate("/cart/pharmacist-verification/payment/place-order", {
          state: { 
            total_amount: totalAmount, 
            cart_id, 
            coupon_savings: couponSavings,
            payment_method: "cod",
            deliveryAddress,
          },
        });
      } catch (e) {
        console.error("COD update failed", e);
        Swal.fire("Error", "Failed to place COD order. Please try again.", "error");
      } finally {
        setPaying(false);
      }
      return;
    }

    // ✅ Handler for Razorpay / Online Payments (Needs create_order)
    try {
      Swal.fire({
        title: "Processing...",
        text: "Creating your payment order",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await create_order(cart_id, totalAmount, couponSavings);
      if (!response) {
        Swal.fire({
          title: "Error!",
          text: "Failed to create order. Please try again.",
          icon: "error",
          confirmButtonText: "Go to Cart",
          confirmButtonColor: "#7c3aed",
        }).then(() => navigate("/cart"));
        setPaying(false);
        return;
      }
      Swal.close();
      loadRazorpay(response.data.id, response.data.amount_due);
    } catch (error) {
      console.error("Payment error:", error);
      Swal.fire({
        title: "Error!",
        text: "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#7c3aed",
      });
      setPaying(false);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const qrSize = 600;
    const padding = 60;
    const footerHeight = 180;
    const headerHeight = 160;
    
    canvas.width = qrSize + (padding * 2);
    canvas.height = qrSize + headerHeight + footerHeight;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Gradient Header
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, headerHeight);
    gradient.addColorStop(0, "#7c3aed");
    gradient.addColorStop(1, "#9333ea");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, headerHeight);

    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = "/android-chrome-192x192.png";
    
    const upiData = `upi://pay?pa=${UPI_ID}&pn=Medingen&am=${totalAmount.toFixed(2)}&cu=INR`;
    
    const qrImage = new Image();
    qrImage.crossOrigin = "anonymous";
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=H&data=${encodeURIComponent(upiData)}`;

    qrImage.onload = () => {
      // Draw QR
      ctx.drawImage(qrImage, padding, headerHeight + 20, qrSize, qrSize);
      
      // Header Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Medingen Healthcare", canvas.width / 2, 75);
      ctx.font = "500 24px 'Inter', sans-serif";
      ctx.fillText("Premium Medicine Delivery", canvas.width / 2, 115);

      // Footer Info
      ctx.fillStyle = "#f8f7ff";
      ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);
      
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 34px 'Inter', sans-serif";
      ctx.fillText(`Amount: ₹${totalAmount.toFixed(2)}`, canvas.width / 2, canvas.height - 110);
      
      ctx.fillStyle = "#64748b";
      ctx.font = "600 26px 'Inter', sans-serif";
      ctx.fillText(`UPI ID: ${UPI_ID}`, canvas.width / 2, canvas.height - 50);

      // Logo in Center of QR
      const iconSize = 90;
      const logoX = (canvas.width / 2) - (iconSize / 2);
      const logoY = (headerHeight + 20 + (qrSize / 2)) - (iconSize / 2);
      
      // White border for center logo
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(logoX - 8, logoY - 8, iconSize + 16, iconSize + 16, 16);
      ctx.fill();
      
      ctx.drawImage(logo, logoX, logoY, iconSize, iconSize);

      // Download
      const link = document.createElement('a');
      link.download = `Medingen_Payment_QR_${cart_id}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    };
  };

  const handleCancelOrder = async () => {
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: "Are you sure you want to cancel this order and return to cart?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No, keep it'
    });

    if (result.isConfirmed) {
      try {
        await cancelOrder(cart_id);
        navigate("/cart");
      } catch (error) {
        console.error("Error cancelling order:", error);
        Swal.fire('Error', 'Failed to cancel order. Please try again.', 'error');
      }
    }
  };

  return (
    <>
      <div className="payment-page">
        <Header title="Payment" maxWidth={1000} breadcrumbPadding="0 20px" />

        {/* ─── Success Banner ─── */}
        <div className="pp-success-banner pp-animate">
          <div className="pp-banner-inner">
            <div className="pp-success-icon">
              <MdCheckCircle size={24} color="#fff" />
            </div>
            <div className="pp-success-text">
              <h2>Prescription Verified &amp; Order Confirmed!</h2>
              <p>Your items are reserved. Please complete the payment to finalize the delivery.</p>
            </div>
          </div>
        </div>

        <div className="pp-container">

          {/* ─── LEFT COLUMN ─── */}
          <div>
            <h2 className="pp-section-title pp-animate pp-animate-delay-1">
              Select Payment Method
            </h2>

            {PAYMENT_METHODS.map((method, idx) => {
              const isCodDisabled = method.id === 'cod' && !dtdcAvailable;
              
              return (
                <div
                  key={method.id}
                  className={`pp-method-card pp-animate pp-animate-delay-${idx + 1} ${selectedMethod === method.id ? "selected" : ""} ${isCodDisabled ? "pp-cod-unavailable" : ""}`}
                  onClick={() => {
                    if (isCodDisabled) return;
                    setSelectedMethod(method.id);
                    if (selectedMethod !== method.id) {
                      setTermsAccepted(false);
                    }
                    // Scroll logic based on method
                    setTimeout(() => {
                      if (method.id === 'upi_scanner') {
                        scannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      } else {
                        payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }}
                >
                <div className="pp-method-header">
                  {!isCodDisabled ? (
                    <div className="pp-radio-outer">
                      <div className="pp-radio-inner" />
                    </div>
                  ) : (
                    <div className="pp-unavailable-indicator">
                      <MdWarning size={18} color="#ef4444" />
                    </div>
                  )}
                  <div className="pp-method-info">
                    <div className="pp-method-name">
                      {method.name}
                      {method.badge && <span className="pp-badge">{method.badge}</span>}
                    </div>
                    <div className="pp-method-desc">{method.desc}</div>
                    
                    {method.id === 'cod' && !dtdcAvailable && (
                      <div className="pp-availability-status unavailable" style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#ef4444'
                      }}>
                        <MdWarning size={12} /> Online Payment Required for {deliveryAddress?.pincode}
                      </div>
                    )}

                    {method.codAmount && (
                      <div className="pp-cod-label" style={{ color: selectedMethod === method.id ? "#ef4444" : "#7c3aed" }}>COD Fee: ₹{method.codAmount.toFixed(2)} applicable</div>
                    )}
                    {method.deliveryNote && (
                      <div className="pp-cod-label" style={{ marginTop: "2px" }}>{method.deliveryNote}</div>
                    )}
                  </div>
                  <div className="pp-method-icon">{method.icon}</div>
                </div>

                {isCodDisabled && (
                  <div className="pp-cod-contact-section">
                    <p className="pp-cod-contact-note">COD is limited for this pincode. Order via WhatsApp/Call</p>
                    <div className="pp-contact-actions">
                       <button className="pp-contact-btn whatsapp" onClick={(e) => {
                         e.stopPropagation();
                         const msg = `Hello, I want to place a COD order for Pincode: ${deliveryAddress?.pincode}. Order ID: ${cart_id}`;
                         window.open(`https://wa.me/917090123709?text=${encodeURIComponent(msg)}`, '_blank');
                       }}>
                         <FiMessageCircle /> WhatsApp
                       </button>
                       <button className="pp-contact-btn call" onClick={(e) => {
                         e.stopPropagation();
                         window.location.href = 'tel:+917090123709';
                       }}>
                         <IoCall /> Call
                       </button>
                    </div>
                  </div>
                )}

                {method.showApps && selectedMethod === method.id && (
                  <div className="pp-upi-apps">
                    <div className="pp-upi-app" title="Google Pay" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod('upi');
                      setTimeout(() => {
                        payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}>
                      <img
                        src="/gpay.png"
                        alt="GPay"
                      />
                    </div>
                    <div className="pp-upi-app" title="Paytm" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod('upi');
                      setTimeout(() => {
                        payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}>
                      <img
                        src="https://etimg.etb2bimg.com/photo/124571897.cms"
                        alt="Paytm"
                      />
                    </div>
                    <div className="pp-upi-app" title="PhonePe" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod('upi');
                      setTimeout(() => {
                        payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}>
                      <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTo4x8kSTmPUq4PFzl4HNT0gObFuEhivHOFYg&s"
                        alt="PhonePe"
                      />
                    </div>
                    
                    {!showMoreUPI ? (
                      <span className="pp-upi-others" onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreUPI(true);
                      }}>+ Others</span>
                    ) : (
                      <>
                        <div className="pp-upi-app" title="BHIM" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMethod('upi');
                          setTimeout(() => {
                            payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}>
                          <img
                            src="https://www.presentations.gov.in/wp-content/uploads/2020/06/BHIM_Preview.png"
                            alt="BHIM"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {method.showQR && selectedMethod === method.id && (
                  <div className="pp-qr-section" ref={scannerRef}>
                    <div className="pp-qr-title">
                      Scan QR Code to Pay<br/>Medingen Healthcare Private Limited
                    </div>
                    <div className="pp-qr-code-wrap">
                       {(() => {
                         const upiPayload = `upi://pay?pa=${UPI_ID}&pn=Medingen&am=${totalAmount.toFixed(2)}&cu=INR`;
                         return (
                           <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&data=${encodeURIComponent(upiPayload)}`} 
                             alt="UPI QR Scanner" 
                             className="pp-qr-img" 
                           />
                         );
                       })()}
                       <div className="pp-qr-center-logo">
                          <img src="/android-chrome-192x192.png" alt="M" />
                       </div>
                    </div>

                    {/* Copy UPI ID */}
                    <div className="pp-upi-id-row" onClick={handleCopyUPI}>
                      <span className="pp-upi-id-label">UPI ID:</span>
                      <strong className="pp-upi-id-value">{UPI_ID}</strong>
                      <span className={`pp-copy-btn ${upiCopied ? 'copied' : ''}`}>
                        {upiCopied ? <><FiCheck size={13} /> Copied!</> : <><FiCopy size={13} /> Copy</>}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="pp-upi-amount">
                      Amount: <strong>₹{totalAmount.toFixed(2)}</strong>
                    </div>

                    {/* Download Button */}
                    <button 
                      onClick={handleDownloadQR}
                      className="pp-download-qr-btn"
                    >
                      <FiSmartphone size={16} /> Download Payment Card
                    </button>

                    <div className="pp-upi-whatsapp-hint">
                      <FiMessageCircle size={16} /> After payment, click "Pay & Submit on WhatsApp" below!
                    </div>
                  </div>
                )}
              </div>
            );
          })}

            {/* ─── Delivery Address ─── */}
            <div
              className="pp-delivery-card pp-animate pp-animate-delay-5"
              id="pp-address-section"
              style={{
                border: !deliveryAddress || !deliveryAddress.name ? '2px dashed #ef4444' : undefined,
                background: !deliveryAddress || !deliveryAddress.name ? '#fffefe' : undefined,
                boxShadow: !deliveryAddress || !deliveryAddress.name ? '0 0 0 2px #ef4444' : undefined,
                transition: 'box-shadow 0.3s',
                marginBottom: 16,
                borderRadius: 10,
                padding: !deliveryAddress || !deliveryAddress.name ? '10px 10px 18px 10px' : undefined
              }}
            >
              {deliveryAddress && deliveryAddress.name ? (
                <div className="pp-delivery-content">
                  <div className="pp-delivery-header">
                    <span className="pp-delivery-name">
                      Deliver to: {deliveryAddress.name}, {deliveryAddress.pincode}
                    </span>
                    {deliveryAddress.type && (
                      <span className="pp-delivery-badge">{deliveryAddress.type.toUpperCase()}</span>
                    )}
                    <button className="pp-change-btn" onClick={() => setShowAddressModal(true)}>CHANGE</button>
                  </div>
                  <div className="pp-delivery-addr">
                    {deliveryAddress.addressLine1}
                    {deliveryAddress.addressLine2 ? `, ${deliveryAddress.addressLine2}` : ""}
                    {deliveryAddress.city ? `, ${deliveryAddress.city}` : ""}
                    {deliveryAddress.state ? `, ${deliveryAddress.state}` : ""}
                  </div>
                  {deliveryAddress.phone_number && (
                    <div className="pp-delivery-phone">
                      <FiPhone size={12} style={{ marginRight: '6px', opacity: 0.8 }} />
                      Mobile: +91 {deliveryAddress.phone_number?.replace(/(\d{5})(\d{5})/, "$1 $2")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="pp-delivery-content" style={{ textAlign: 'center', padding: '10px 0 0 0' }}>
                  <div style={{ color: '#ef4444', fontWeight: 800, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <IoLocationSharp size={16} style={{ verticalAlign: 'middle' }} />
                    <span>Select Delivery Address <span style={{ color: '#ef4444', fontSize: 15 }}>*</span></span>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 8 }}>
                    Required to proceed with payment
                  </div>
                  <button className="pp-change-btn" style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', minWidth: 0 }} onClick={() => setShowAddressModal(true)}>
                    Add Address
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="pp-sidebar">
            <div className="pp-order-summary-card pp-animate pp-animate-delay-2">
              <div className="pp-summary-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="pp-summary-title" style={{ margin: 0 }}>Order Summary</h3>
                <button 
                  onClick={handleManualRefresh}
                  className="pp-refresh-btn"
                  disabled={isRefreshing}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    opacity: isRefreshing ? 0.7 : 1
                  }}
                >
                  <FiRefreshCw size={14} className={isRefreshing ? 'pp-spin' : ''} />
                  <span>{isRefreshing ? 'REFRESHING...' : 'REFRESH'}</span>
                </button>
              </div>

              <div className="pp-summary-row">
                <span className="pp-summary-label">MRP Total</span>
                <span className="pp-summary-value">{totalMRP}</span>
              </div>

              <div className="pp-summary-row">
                <span className="pp-summary-label">Product Discount</span>
                <span className="pp-summary-value green">−{totalSavings}</span>
              </div>

              {isOfferActive && (
                <div className="pp-summary-row">
                  <span className="pp-summary-label">Offer Discount (5%)</span>
                  <span className="pp-summary-value green">−₹{extraOfferDiscount.toFixed(2)}</span>
                </div>
              )}

              {couponSavings > 0 && (
                <div className="pp-summary-row">
                  <span className="pp-summary-label">Coupon Discount</span>
                  <span className="pp-summary-value green">−₹{couponSavings.toFixed(2)}</span>
                </div>
              )}

              {/* Savings highlight */}
              {(parseFloat(totalSavings) > 0 || couponSavings > 0) && (
                <div className="pp-savings-highlight">
                  <IoSparkles size={14} color="#16a34a" />
                  <span>
                    You're saving ₹{(
                      parseFloat(String(totalSavings).replace(/[^\d.]/g, "")) + couponSavings
                    ).toFixed(2)} on this order!
                  </span>
                </div>
              )}

              <div className="pp-summary-row">
                <span className="pp-summary-label">Delivery Fee</span>
                <span className="pp-summary-value">
                  {(shippingCharge > 0 && !isOfferActive) ? (
                    `₹${shippingCharge.toFixed(2)}`
                  ) : (
                    <span className="green">FREE</span>
                  )}
                </span>
              </div>

              {codCharge > 0 && (
                <div className="pp-summary-row">
                  <span className="pp-summary-label">COD Fee</span>
                  <span className="pp-summary-value">₹{codCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="pp-summary-divider" />

              <div className="pp-total-row">
                <span className="pp-total-label">Total Amount</span>
                <span className="pp-total-value">₹{totalAmount.toFixed(2)}</span>
              </div>

              {/* ─── Terms ─── */}
              <div className="pp-terms-section" id="pp-terms-section" ref={termsRef}>
                <div className="pp-terms-check" onClick={() => setTermsAccepted(!termsAccepted)}>
                  <div className={`pp-terms-checkbox ${termsAccepted ? "checked" : ""}`}>
                    {termsAccepted && <MdCheckCircle size={13} color="#fff" />}
                  </div>
                  <div className="pp-terms-content">
                    <span className="pp-terms-text">
                      I agree to the{" "}
                      <a href="/policies-terms-and-conditions" onClick={e => e.stopPropagation()}>
                        Terms of Service
                      </a>{" "}
                      &amp; confirm my prescription.
                    </span>
                    <div className="pp-terms-note-v2">
                      <p>There is NO RETURN policy for Generic Medicines</p>
                      <p>Order once picked up by Courier cannot be cancelled</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Pay Button ─── */}
              <button
                className={`pp-pay-btn ${!termsAccepted ? "not-active" : ""}`}
                ref={payButtonRef}
                onClick={() => {
                  const isAddressMissing = !deliveryAddress || !deliveryAddress.name;
                  if (isAddressMissing) {
                    const el = document.getElementById('pp-address-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.style.boxShadow = '0 0 0 3px #ef4444';
                      setTimeout(() => { el.style.boxShadow = ''; }, 1500);
                    }
                    return;
                  }

                  if (!termsAccepted) {
                    if (termsRef.current) {
                      termsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      termsRef.current.style.transition = 'all 0.3s ease';
                      termsRef.current.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      termsRef.current.style.boxShadow = '0 0 0 3px #ef4444';
                      termsRef.current.style.borderRadius = '8px';
                      
                      setTimeout(() => {
                        termsRef.current.style.backgroundColor = '';
                        termsRef.current.style.boxShadow = '';
                      }, 1500);
                    }
                    return;
                  }

                  handlePayNow();
                }}
                disabled={paying || isSyncingCOD || !deliveryAddress || !deliveryAddress.name}
              >
                <MdLock size={17} />
                {paying 
                  ? "Processing..." 
                  : isSyncingCOD 
                    ? "Syncing Charges..." 
                    : selectedMethod === 'upi_scanner' 
                      ? `Pay ₹${totalAmount.toFixed(2)} & Submit on WhatsApp` 
                      : selectedMethod === 'cod'
                        ? `Place Order (COD) - ₹${totalAmount.toFixed(2)}`
                        : `Pay ₹${totalAmount.toFixed(2)} Securely`}
              </button>

              {/* ─── Cancel Order ─── */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: "24px", marginBottom: "8px" }}>
                <button 
                  onClick={handleCancelOrder}
                  style={{ background: "none", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease" }}
                  onMouseOver={(e) => e.target.style.color = "#ef4444"}
                  onMouseOut={(e) => e.target.style.color = "#64748b"}
                >
                  <MdClose size={18} />
                  Cancel Order
                </button>
              </div>

              {/* ─── Trust Badges ─── */}
              <div className="pp-trust-badges">
                <div className="pp-trust-badge" style={{ color: "#7c3aed", fontWeight: "700" }}>
                  <FiShield size={12} color="#7c3aed" />
                  <span style={{ textTransform: "uppercase" }}>Secure</span>
                </div>
                <div className="pp-trust-badge" style={{ color: "#7c3aed", fontWeight: "700" }}>
                  <BsPatchCheckFill size={12} color="#7c3aed" />
                  <span style={{ textTransform: "uppercase" }}>Genuine</span>
                </div>
                <div className="pp-trust-badge" style={{ color: "#7c3aed", fontWeight: "700" }}>
                  <MdAssignmentInd size={12} color="#7c3aed" />
                  <span style={{ textTransform: "uppercase" }}>Doctor Approved</span>
                </div>
              </div>
            </div>

            {/* ─── Pharmacist Support ─── */}
            <div className="pp-support-card">
              <div className="pp-support-icon">
                <FiHeadphones size={18} color="#7c3aed" />
              </div>
              <div className="pp-support-info">
                <h4>Pharmacist Support</h4>
                <p>Need help with payment?</p>
              </div>
              <a
                href="https://wa.me/917090123709?text=Hi%2C%20I%20need%20help%20with%20my%20payment."
                target="_blank"
                rel="noopener noreferrer"
                className="pp-support-link"
                onClick={(e) => e.stopPropagation()}
              >
                Chat Now
              </a>
            </div>
          </div>
        </div>

       
      </div>
        <AddressSelectionModal
          open={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          cartId={cart_id}
          onAddressSelected={async () => {
            setShowAddressModal(false);
            // Re-fetch cart data after address change
            try {
              const res = await getCartDataForID(cart_id);
              if (res.status === 200) setCartData(res.data);
            } catch (e) { console.error(e); }
          }}
        />
        <Navigation />
    </>
  );
};

export default PaymentPage;