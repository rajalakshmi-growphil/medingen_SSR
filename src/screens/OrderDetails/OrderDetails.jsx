import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiMessageCircle, FiPhone, FiInfo, FiCreditCard, FiMapPin, FiShield, FiFileText } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import "./style.css";
import Navigation from "../Dashboard/Navigation";
import Header from "../Dashboard/Header";
import html2pdf from "html2pdf.js";
import Invoice from "./Invoice";

const getNumericPrice = (priceStr) => {
  if (priceStr === null || priceStr === undefined) return 0.0;
  if (typeof priceStr === "number") return priceStr;
  const strPrice = String(priceStr);
  const match = strPrice.match(/([\d,.]+)\s*$/);
  return match && match[1] ? parseFloat(match[1].replace(/,/g, "")) || 0.0 : 0.0;
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const buildOrder = (data) => {
      const rawProducts = data.products || data.cart || [];
      const productMap = new Map();

      rawProducts.forEach((item) => {
        const id = item.id || item.product_id;
        const unitPrice = getNumericPrice(item.discountedPrice || item.originalPrice || "0");
        const qty = Number(item.quantity || 1);

        if (productMap.has(id)) {
          const existing = productMap.get(id);
          existing.quantity += qty;
          existing.total_price += unitPrice * qty;
        } else {
          productMap.set(id, {
            id: id,
            name: item.name,
            salt: item.salt || "N/A",
            pack: item.pack || "1 pack",
            image_url: item?.image
              ? "https://d1dh0rr5xj2p49.cloudfront.net/products/" + item.image
              : "/box-1.png",
            quantity: qty,
            price_per_unit: unitPrice,
            total_price: unitPrice * qty,
          });
        }
      });

      const products = Array.from(productMap.values());

      // Address
      let addressDetails = {
        name: "User",
        line1: "N/A",
        line2: "",
        state: "",
        pincode: "",
        phone: ""
      };
      
      if (data.deliveryAddress) {
        const addr = data.deliveryAddress;
        addressDetails = {
          name: addr.fullName || addr.name || "User",
          line1: addr.addressLine1 || "",
          line2: addr.addressLine2 || "",
          state: addr.state || "",
          pincode: addr.pincode || "",
          phone: addr.phone_number || addr.phoneNumber || addr.phone || ""
        };
      }

      // Summary
      const apiSummary = data.orderSummary || {};
      const calculatedTotal = products.reduce((sum, item) => sum + item.total_price, 0);
      const shippingCharge = Number(apiSummary.total_shipping_charge || apiSummary.shipping_charge || data.shipping_charge || 0);
      const codCharge = Number(apiSummary.cod_charge || 0);
      const mrpTotal = getNumericPrice(apiSummary.totalMRP) || calculatedTotal;
      const sellingPrice = getNumericPrice(apiSummary.total_selling_price) || calculatedTotal;
      const totalAmount = Number(apiSummary.totalAmount || (sellingPrice + shippingCharge + codCharge));
      const savings = getNumericPrice(apiSummary.totalSavings) || (mrpTotal - sellingPrice);

      const paymentMethod = data.paymentmode || (codCharge > 0 ? "Cash on Delivery" : (data.payment_id ? "Online Payment" : "Not Selected"));

      return {
        order_id: data.cart_id || data.id,
        custom_order_id: data.order_id || ("#MIG-" + (data.cart_id || data.id)),
        payment_method: paymentMethod,
        shipping_charge: shippingCharge,
        cod_charge: codCharge,
        items: products,
        address: addressDetails,
        orderSummary: {
          itemsCount: apiSummary.itemsCount || products.length,
          totalAmount: totalAmount.toFixed(2),
          totalMRP: mrpTotal.toFixed(2),
          totalPercentageSaved: apiSummary.totalPercentageSaved || "0%",
          totalSavings: savings.toFixed(2),
          total_selling_price: sellingPrice.toFixed(2),
          total_shipping_charge: shippingCharge.toFixed(2),
          total_cod_charge: codCharge.toFixed(2),
          productDiscount: savings.toFixed(2),
          couponDiscount: Number(data.coupon_savings || apiSummary.couponDiscount || 0).toFixed(2),
          offerTitle: data.offerTitle || "",
        },
        payment_done_date: data.payment_done_date || data.created_date || data.cart_created_date,
      };
    };

    if (location.state && location.state.orders) {
      const rawOrder = Array.isArray(location.state.orders)
        ? location.state.orders.find((o) => String(o.cart_id) === String(id)) || location.state.orders[0]
        : location.state.orders;

      setOrder(buildOrder(rawOrder));
      setLoading(false);
    } else {
      // If no state, we might need to fetch single order, but for now assuming it's passed
      setLoading(false);
    }
  }, [location.state, id]);

  const formattedDate = useMemo(() => {
    if (!order?.payment_done_date) return "N/A";
    const date = new Date(order.payment_done_date);
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-IN", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
  }, [order?.payment_done_date]);

  if (loading) return <div className="order-details-loading">Loading...</div>;
  if (!order) return <div className="order-details-error">Order not found</div>;

  const handleDownloadInvoice = () => {
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    const opt = {
      margin:       0,
      filename:     `Invoice_${order?.custom_order_id || id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    const html2pdfLib = html2pdf.default || html2pdf;
    if (typeof html2pdfLib === 'function') {
      html2pdfLib().set(opt).from(element).save();
    } else {
      console.error("html2pdf library could not be loaded", html2pdfLib);
    }
  };

  return (
    <div className="order-details-page">
      <Header 
        title="Order Details" 
        maxWidth={1200} 
        showMobileBack={true} 
        rightAction={
          <button className="download-invoice-btn" onClick={handleDownloadInvoice}>
            <FiDownload size={16} />
            <span>Download Invoice</span>
          </button>
        } 
      />
      <header className="order-details-header">
        <div className="header-inner">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <FiArrowLeft size={20} />
            </button>
            <h1>Order Details</h1>
          </div>
          <button className="download-invoice-btn" onClick={handleDownloadInvoice}>
            <FiDownload size={16} />
            <span>Download Invoice</span>
          </button>
        </div>
      </header>

      <div className="order-details-content">
        <div className="main-info-row">
          <div className="info-card">
            <span className="info-label">ORDER ID</span>
            <span className="info-value">{order.custom_order_id}</span>
          </div>
          <div className="info-card">
            <span className="info-label">DATE</span>
            <span className="info-value">{formattedDate}</span>
          </div>
          <div className="info-card">
            <span className="info-label">TOTAL AMOUNT</span>
            <span className="info-value">₹{order.orderSummary.totalAmount}</span>
          </div>
          <div className="info-card">
            <span className="info-label">PAYMENT METHOD</span>
            <div className="payment-method-value">
              <FiCreditCard size={18} color="#64748b" />
              <span>{order.payment_method}</span>
            </div>
          </div>
        </div>

        <div className="details-grid">
          <div className="details-left">
            <section className="order-items-section">
              <div className="section-header">
                <h2>Order Items ({order.items.length})</h2>
                {order.items.length > 4 && (
                  <button className="view-full-details" onClick={() => setShowAllItems(!showAllItems)}>
                    {showAllItems ? "Show Less" : "View Full Details"}
                  </button>
                )}
              </div>
              <div className="items-list">
                {(showAllItems ? order.items : order.items.slice(0, 4)).map((item, idx) => (
                  <div key={idx} className="order-item-card">
                    <div className="item-img-box">
                      <img src={item.image_url} alt={item.name} />
                    </div>
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                    </div>
                    <div className="item-qty">{item.quantity} Units</div>
                    <div className="item-unit-price">₹{item.price_per_unit.toFixed(2)}</div>
                    <div className="item-total-price">₹{item.total_price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="order-total-row">
                <span>Order Total</span>
                <span className="total-val">₹{Number(order.orderSummary.total_selling_price).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            </section>

            <section className="need-help-card">
              <div className="help-icon-box">
                <FiInfo size={24} color="#8B5CF6" />
              </div>
              <div className="help-text">
                <h3>Need Help with this Order?</h3>
                <p>Facing issues with delivery, damaged items, or have questions about dosage? Our pharmacists are online 24/7 to assist you.</p>
              </div>
              <button className="chat-pharmacist-btn">
                <FiMessageCircle size={18} />
                <span>Chat with Pharmacist</span>
              </button>
            </section>
          </div>

          <div className="details-right">
            <aside className="delivery-address-card">
              <div className="card-header">
                <FiMapPin size={20} color="#8B5CF6" />
                <h3>Delivery Address</h3>
              </div>
              <div className="address-content">
                <h3 className="user-name-header">{order.address.name}</h3>
                <p className="address-text">
                  {order.address.line1}, {order.address.line2}<br/>
                  {order.address.state} - {order.address.pincode}
                </p>
                <div className="contact-info">
                  <span className="contact-label">CONTACT NUMBER</span>
                  <span className="contact-value">+91 {order.address.phone}</span>
                </div>
              </div>
            </aside>

            <div className="safety-guarantee-badge">
              <div className="safety-header">
                <div className="safety-icon-box">
                  <FiShield size={20} color="#8B5CF6" />
                </div>
                <div className="safety-title">
                  <h4>Safety Guarantee</h4>
                  <span>100% Genuine Medicines</span>
                </div>
              </div>
              <p>Every order is checked by a registered pharmacist to ensure your safety and well-being.</p>
            </div>

            <section className="payment-summary-card">
              <h3>Payment Summary</h3>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>MRP Total</span>
                  <span>₹{order.orderSummary.totalMRP}</span>
                </div>
                <div className="summary-row discount">
                  <span>Product Discount</span>
                  <span>- ₹{order.orderSummary.productDiscount}</span>
                </div>
                <div className="summary-row discount">
                  <span>Coupon ({order.orderSummary.couponDiscount > 0 ? "Applied" : "None"})</span>
                  <span>- ₹{order.orderSummary.couponDiscount}</span>
                </div>
                {order.orderSummary.offerTitle && (
                  <div className="applied-offer-box">
                    <FiInfo size={14} color="#8B5CF6" />
                    <span>{order.orderSummary.offerTitle}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>₹{order.orderSummary.total_shipping_charge}</span>
                </div>
                {Number(order.orderSummary.total_cod_charge) > 0 && (
                  <div className="summary-row">
                    <span>COD Charge</span>
                    <span>₹{order.orderSummary.total_cod_charge}</span>
                  </div>
                )}
              </div>
              <div className="net-amount-row">
                <span>Net Amount</span>
                <span className="net-val">₹{order.orderSummary.totalAmount}</span>
              </div>
              <p className="tax-inclusive">Inclusive of all taxes \u0026 healthcare cess</p>
            </section>
          </div>
        </div>
      </div>
      
      <div className="bottom-spacing"></div>
      <Navigation />

      {/* Hidden Invoice for PDF Generation */}
      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <div ref={invoiceRef}>
          <Invoice order={order} disablePrint={true} forceDesktop={true} />
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
