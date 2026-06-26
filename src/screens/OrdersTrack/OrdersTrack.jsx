import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiAlertCircle, FiExternalLink, FiPhone, FiMessageCircle } from "react-icons/fi";
import { FaWhatsapp, FaUser } from "react-icons/fa";
import "./style.css";
import Navigation from "../Dashboard/Navigation";
import Header from "../Dashboard/Header";
import { getOrderTracking } from "../../api/Api";
import Timeline from "./Timeline";

const getNumericPrice = (priceStr) => {
  if (priceStr === null || priceStr === undefined) return 0.0;
  if (typeof priceStr === "number") return priceStr;
  const strPrice = String(priceStr);
  const match = strPrice.match(/([\d,.]+)\s*$/);
  return match && match[1] ? parseFloat(match[1].replace(/,/g, "")) || 0.0 : 0.0;
};

const normalizeEventToStep = (evt = "") => {
  const k = (evt || "").trim().toLowerCase();
  if (k.includes("rto") || k.includes("return")) return "Return";
  if (k.includes("delivered")) return "Delivered";
  if (k.includes("reached at destination") || k.includes("at destination")) return "At Destination";
  if (k.includes("out for delivery")) return "Out for delivery";
  if (k.includes("shipped") || k.includes("in transit") || k.includes("transit") || k.includes("forwarded")) return "Shipped";
  if (k.includes("accepted") || k.includes("booked")) return "Order Confirmed";
  if (k.includes("picked up")) return "Picked Up";
  if (k.includes("packed")) return "Packed";
  if (k.includes("prescription verified")) return "Prescription Verified";
  return "Order Placed";
};

const OrderTrack = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [trackingId, setTrackingId] = useState(null);
  const [trackHeader, setTrackHeader] = useState({});
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [liveTimeline, setLiveTimeline] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    const buildOrder = (data) => {
      const products = (data.products || data.cart || []).map((item) => {
        const unitPrice = getNumericPrice(item.discountedPrice || item.originalPrice || "0");
        const qty = item.quantity || 1;
        return {
          name: item.name,
          salt: item.salt || "N/A",
          image_url: item?.image
            ? "https://d1dh0rr5xj2p49.cloudfront.net/products/" + item.image
            : "/box-1.png",
          quantity: qty,
          price_per_unit: unitPrice,
          total_price: unitPrice * qty,
        };
      });

      let address = "N/A";
      let fullName = "User";
      if (data.deliveryAddress) {
        const addr = data.deliveryAddress;
        fullName = addr.fullName || addr.name || "User";
        address = `${addr.addressLine1 || ""}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}${addr.state ? ", " + addr.state : ""}${addr.pincode ? " - " + addr.pincode : ""}`;
      }

      const apiSummary = data.orderSummary || {};
      const calculatedTotal = products.reduce((sum, item) => sum + item.total_price, 0);
      const shippingCharge = Number(apiSummary.shipping_charge || data.shipping_charge || 0);
      const totalAmount = Number(apiSummary.totalAmount || (calculatedTotal + shippingCharge));

      let trackingId = data.order_tracking_id || data.tracking_id || "N/A";
      let courierPartner = data.courier_partner || "N/A";
      let expectedDelivery = data.expected_delivery || "TBD";

      if (data.courier_tracking && data.courier_tracking.length > 0) {
        const ct = data.courier_tracking[0];
        if (ct.tracking_id) trackingId = ct.tracking_id;
        if (ct.courier_type) courierPartner = ct.courier_type;
        if (ct.estimated_delivery && ct.estimated_delivery !== "0000-00-00 00:00:00") {
           expectedDelivery = new Date(ct.estimated_delivery).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" });
        }
      }

      return {
        order_id: data.cart_id || data.id,
        custom_order_id: data.order_id || ("#MIG-" + (data.cart_id || data.id)),
        tracking_id: trackingId,
        items: products,
        customer_name: fullName,
        delivery_address: address,
        total_amount: totalAmount.toFixed(2),
        created_date: data.payment_done_date || data.created_date || data.cart_created_date,
        raw_status: (data.status || data.cartStatus || "").toLowerCase(),
        courier_partner: courierPartner,
        expected_delivery: expectedDelivery,
      };
    };

    if (location.state && location.state.orders) {
      const rawOrder = Array.isArray(location.state.orders)
        ? location.state.orders.find((o) => String(o.cart_id) === String(id)) || location.state.orders[0]
        : location.state.orders;
      
      const builtOrder = buildOrder(rawOrder);
      setTrackingId(builtOrder.tracking_id);
      setOrder(builtOrder);
    }
  }, [location.state, id]);

  useEffect(() => {
    if (!trackingId || trackingId === "N/A") return;
    const fetchTracking = async () => {
      try {
        setLoadingTracking(true);
        const data = await getOrderTracking(trackingId);
        setTrackHeader(data?.trackHeader || {});
        setTrackingEvents(Array.isArray(data?.tracking) ? data.tracking : []);
      } catch (err) {
        console.error("Error fetching tracking data:", err);
      } finally {
        setLoadingTracking(false);
      }
    };
    fetchTracking();
  }, [trackingId]);

  useEffect(() => {
    if (!order) return;
    const merged = [];
    if (order.created_date) {
      merged.push({ status: "Order Placed", timestamp: new Date(order.created_date).getTime() });
    }
    
    const statusMap = {
      "confirm": ["Order Confirmed"],
      "payment": ["Order Confirmed"],
      "packed": ["Order Confirmed", "Packed"],
      "dispatched": ["Order Confirmed", "Packed", "Shipped"],
      "out_for_delivery": ["Order Confirmed", "Packed", "Shipped", "Out for Delivery"],
      "delivered": ["Order Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"]
    };
    
    let inferredSteps = statusMap[order.raw_status] || [];
    
    if (order.tracking_id && order.tracking_id !== "N/A") {
      if (!inferredSteps.includes("Shipped")) {
        inferredSteps = ["Order Confirmed", "Packed", "Shipped"];
      }
    }

    inferredSteps.forEach(step => {
      merged.push({ status: step, timestamp: order.created_date ? new Date(order.created_date).getTime() + 1000 : new Date().getTime() }); 
    });
    
    (trackingEvents || []).forEach((e) => {
      const rawText = e?.event_description || e?.status_external || "";
      const step = normalizeEventToStep(rawText);
      const ts = e?.timestamp ? new Date(e.timestamp).getTime() : new Date().getTime();
      
      const existingIdx = merged.findIndex(m => m.status === step);
      if (existingIdx !== -1) {
         merged[existingIdx].timestamp = ts;
      } else {
         merged.push({ status: step, timestamp: ts });
      }
    });

    setLiveTimeline(merged);
  }, [order, trackingEvents]);

  if (!order) return <div className="loading">Order not found</div>;

  return (
    <div className="orders-track-page">
      <Header title="Track Order" maxWidth={1200} showMobileBack={true} />
      <header className="track-header">
        <div className="track-container track-header-inner">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft size={20} />
          </button>
          <h1>Track Order</h1>
        </div>
      </header>

      <div className="track-banner">
        <div className="track-container track-banner-inner">
          <FiAlertCircle size={18} />
          <span>Orders are typically delivered within 2-3 business days.</span>
        </div>
      </div>

      <div className="track-container track-content-grid">
        <div className="track-main-column">
          <section className="status-overview-card">
            <div className="overview-header">
              <div className="order-id-block">
                <h2>Order {order.custom_order_id}</h2>
                <span className="status-pill in-transit">IN TRANSIT</span>
              </div>
              <div className="placed-info">
                <div className="info-item">
                  <span className="info-label">PLACED ON</span>
                  <span className="info-val">{new Date(order.created_date).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">TOTAL AMOUNT</span>
                  <span className="info-val">₹{order.total_amount}</span>
                </div>
              </div>
            </div>

            <Timeline liveTimeline={liveTimeline} loadingTracking={loadingTracking} />
          </section>

          <section className="track-items-section">
            <div className="section-header">
              <h2>Order Items ({order.items.length})</h2>
              {order.items.length > 2 && (
                <button 
                  className="view-full-details" 
                  onClick={() => setShowAllItems(!showAllItems)}
                >
                  {showAllItems ? "Hide Full Details" : "View Full Details"}
                </button>
              )}
            </div>
            <div className="items-list">
              {(showAllItems ? order.items : order.items.slice(0, 2)).map((item, idx) => (
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
              <span className="total-val">₹{order.total_amount}</span>
            </div>
          </section>
        </div>

        <div className="track-sidebar">
          <aside className="shipping-address-card">
            <div className="sidebar-section-header">
              <span className="header-label">SHIPPING ADDRESS</span>
            </div>
            <div className="address-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <div className="customer-name" style={{ display: 'block' }}>{order.customer_name}</div>
              <div className="address-text" style={{ display: 'block', margin: 0 }}>{order.delivery_address}</div>
            </div>
            
            <div className="delivery-estimates">
              <div className="estimate-row">
                <span className="est-label">Expected Delivery</span>
                <span className="est-val purple">{order.expected_delivery}</span>
              </div>
              <div className="estimate-row">
                <span className="est-label">Courier Partner</span>
                <span className="est-val">{order.courier_partner}</span>
              </div>
              <div className="estimate-row">
                <span className="est-label">Tracking ID</span>
                <span className="est-val tracking-pill">{order.tracking_id}</span>
              </div>
            </div>

            <button 
              className="view-live-tracking-btn"
              onClick={() => {
                const liveUrl = trackHeader?.track_url || trackHeader?.tracking_url || trackHeader?.url || trackHeader?.link;
                if (liveUrl) {
                  window.open(liveUrl, "_blank");
                } else if (order.tracking_id && order.tracking_id !== "N/A") {
                  const courier = (order.courier_partner || "").toLowerCase().trim();
                  const tracking = order.tracking_id;
                  let link = "";
                  
                  if (courier.includes("dtdc")) {
                    link = `https://www.dtdc.com/track-your-shipment/?awb=${tracking}`;
                  } else if (courier.includes("delhivery")) {
                    link = `https://www.delhivery.com/track-v2/package/${tracking}`;
                  } else if (courier.includes("st") || courier.includes("stcourier")) {
                    link = `https://stcourier.com/track/shipment/${tracking}`;
                  } else if (courier.includes("post") || courier.includes("indian")) {
                    link = "https://www.indiapost.gov.in/";
                  } else {
                    link = `https://www.delhivery.com/track-v2/package/${tracking}`;
                  }
                  
                  window.open(link, "_blank");
                } else {
                  alert("Live tracking is not available for this order yet.");
                }
              }}
            >
              <FiExternalLink size={16} />
              <span>View Live Tracking</span>
            </button>
          </aside>

          <aside className="assistance-card">
            <h3>
              <FiMessageCircle size={18} />
              <span>Need Assistance?</span>
            </h3>
            <div className="assistance-options">
              <button className="assistance-btn whatsapp" onClick={() => window.open("https://wa.me/917090123709", "_blank")}>
                <div className="btn-left">
                  <FaWhatsapp size={18} />
                  <span>WhatsApp Support</span>
                </div>
                <FiArrowLeft className="rotate-180" />
              </button>
              <button className="assistance-btn call" onClick={() => window.location.href = "tel:7090123709"}>
                <div className="btn-left">
                  <FiPhone size={18} />
                  <span>Call Support</span>
                </div>
                <FiArrowLeft className="rotate-180" />
              </button>
              <button className="assistance-btn pharmacist" onClick={() => window.location.href = "tel:7090123709"}>
                <div className="btn-left">
                  <FaUser size={18} />
                  <span>Talk to Pharmacist</span>
                </div>
                <FiArrowLeft className="rotate-180" />
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="bottom-spacing"></div>
      <Navigation />
    </div>
  );
};

export default OrderTrack;