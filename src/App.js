import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import Swal from "sweetalert2";
import "./App.css";
import { CSSTransition, TransitionGroup } from "react-transition-group";

// Import all components
import { Splash1 } from "./screens/Splash1/Splash1";
import { Dashboard, FaqSchema } from "./screens/Dashboard/Dashboard";
import { SavedAddress } from "./screens/SavedAddress/SavedAddress";
import { AddressNew } from "./screens/AddressNew/AddressNew";
import { UploadPrescription } from "./screens/UploadPrescription/UploadPrescription";
import { SelectPrescription } from "./screens/SelectPrescription/SelectPrescription";
import { OrderPlacedSuccess } from "./screens/OrderPlacedSuccess/OrderPlacedSuccess";
import { OrderConfirmed } from "./screens/OrderConfirmed/OrderConfirmed";
import { Splash3 } from "./screens/Splash3/Splash3";
import { Login1 } from "./screens/Login1/Login1";
import { Login2 } from "./screens/Login2/Login2";
import { Login3 } from "./screens/Login3/Login3";
import { EnterPassword } from "./screens/EnterPassword/EnterPassword";
import { ExistingUser } from "./screens/ExistingUser/ExistingUser";
import { ChangePassword } from "./screens/ChangePassword/ChangePassword";
import { PersonalInfo } from "./screens/PersonalInfo/PersonalInfo";
import { CreateProfile } from "./screens/CreateProfile/CreateProfile";
import { Createsuccess } from "./screens/CreateSuccess/CreateSuccess";
import { SearchBox } from "./screens/SearchBox/SearchBox";
import { SearchResults } from "./screens/SearchResults/SearchResults";
import SearchViewMedicine from "./screens/SearchViewMedicine/SearchViewMedicine";
import { CompareView } from "./screens/CompareView/CompareView";
import { Offers } from "./screens/Offers/Offers";
import { OffersView } from "./screens/OffersView/OffersView";
import { Rewards } from "./screens/Rewards/Rewards";
import { RewardsView } from "./screens/RewardsView/RewardsView";
import { RewardsViewMIG } from "./screens/RewardsViewMig/RewardsViewMIG";
import { PharmacistVerification } from "./screens/PharmacistVerification/PharmacistVerification";
import { OrderProgress } from "./screens/OrderProgressConfirmation/OrderProgressConfirmation";
import { OrderPayment } from "./screens/OrderPayment/OrderPayment";
import { PaymentPage } from "./screens/PaymentPage/PaymentPage";
import { Orders } from "./screens/Orders/Orders";
import OrderTrack from './screens/OrdersTrack/OrdersTrack';
import OrderDetails from './screens/OrderDetails/OrderDetails';
import Invoice from './screens/OrderDetails/Invoice';
import { Notifications } from "./screens/Notifications/Notifications";
import { ProfileView } from "./screens/ProfileView/ProfileView";
import { CreatePassword } from "./screens/CreatePassword/CreatePassword";
import { CapturePrescription } from "./screens/CapturePrescription/CapturePrescription";
import { HelpCenter, LandingPage, Footer } from "./screens/LandingPage/LandingPage";
import GenericMedicineOnline from "./screens/GenericMedicineOnline/GenericMedicineOnline";

import { Blogs } from "./screens/Blogs/Blogs";
import { Blog } from "./screens/Blog/Blog";
import { PolicyPages } from "./screens/PolicyPages/PolicyPages";
import { SaltPage } from "./screens/SaltPage/SaltPage";
import { Reminder } from "./screens/Reminder/Reminder";
import Redirects from "./Redirects";
import { Category } from "./screens/Category/Category";
import { AllCategories } from "./screens/Category/AllCategories";
import { CategoryPage } from "./screens/Category/CategoryPage";
import { useCart } from "./api/stateContext";
import { getOrders } from "./api/Api";
import Cookies from "js-cookie";
import axios from "axios";

import { PwaManager, requestNotificationPermission, fetchAndNotifyLatest } from "./pushClient";

const AdminRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      window.location.href =
        "http://medingen-portal-new.s3-website.ap-south-1.amazonaws.com/sign-in";
    }
  }, [location]);

  return null;
};

const RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const newUrl = Redirects.getNewUrl(location.pathname);
    if (newUrl) {
      window.location.href = newUrl;
    }
  }, [location, navigate]);

  return null;
};




export const fetchAndNotifyLatestLocal = async ({
  page = 1,
  onlyUnread = false,
} = {}) => {
  return fetchAndNotifyLatest({ page, onlyUnread });
};


const ProductRedirect = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/product", {
      replace: true,
      state: { product: { product_id: productId } },
    });
  }, [productId, navigate]);

  return null;
};

export const RequestDataDeletion = () => {
  // ... (unchanged)
};

const InvoiceWrapper = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrders(1, id);
        if (data && data.orders) {
          const rawOrder = data.orders.find(o => String(o.cart_id) === String(id));
          if (rawOrder) {
            const getNumericPrice = (priceStr) => {
              if (priceStr === null || priceStr === undefined) return 0.0;
              if (typeof priceStr === "number") return priceStr;
              const strPrice = String(priceStr);
              const match = strPrice.match(/([\d,.]+)\s*$/);
              return match && match[1] ? parseFloat(match[1].replace(/,/g, "")) || 0.0 : 0.0;
            };

            const rawProducts = rawOrder.products || rawOrder.cart || [];
            const productMap = new Map();
            rawProducts.forEach((item) => {
              const pid = item.id || item.product_id;
              const unitPrice = getNumericPrice(item.discountedPrice || item.originalPrice || "0");
              const qty = Number(item.quantity || 1);
              if (productMap.has(pid)) {
                const existing = productMap.get(pid);
                existing.quantity += qty;
                existing.total_price += unitPrice * qty;
              } else {
                productMap.set(pid, {
                  name: item.name,
                  salt: item.salt || "N/A",
                  quantity: qty,
                  price_per_unit: unitPrice,
                  total_price: unitPrice * qty,
                });
              }
            });

            const products = Array.from(productMap.values());
            const addr = rawOrder.deliveryAddress || {};
            const apiSummary = rawOrder.orderSummary || {};
            
            const shippingCharge = Number(apiSummary.total_shipping_charge || apiSummary.shipping_charge || rawOrder.shipping_charge || 0);
            const codCharge = Number(apiSummary.cod_charge || 0);
            const mrpTotal = getNumericPrice(apiSummary.totalMRP) || products.reduce((s, i) => s + i.total_price, 0);
            const sellingPrice = getNumericPrice(apiSummary.total_selling_price) || products.reduce((s, i) => s + i.total_price, 0);
            const totalAmount = Number(apiSummary.totalAmount || (sellingPrice + shippingCharge + codCharge));
            const savings = getNumericPrice(apiSummary.totalSavings) || (mrpTotal - sellingPrice);

            setOrder({
              order_id: rawOrder.cart_id,
              custom_order_id: rawOrder.order_id || ("#MIG-" + rawOrder.cart_id),
              items: products,
              address: {
                name: addr.fullName || addr.name || "User",
                line1: addr.addressLine1 || "",
                line2: addr.addressLine2 || "",
                state: addr.state || "",
                pincode: addr.pincode || "",
                phone: addr.phone_number || addr.phoneNumber || addr.phone || ""
              },
              orderSummary: {
                totalAmount: totalAmount,
                totalMRP: mrpTotal,
                totalSavings: savings,
                total_selling_price: sellingPrice,
                total_shipping_charge: shippingCharge,
                total_cod_charge: codCharge,
              },
              payment_done_date: rawOrder.payment_done_date || rawOrder.cart_created_date,
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div style={{padding: '100px', textAlign: 'center', fontSize: '20px', fontFamily: 'Outfit, sans-serif'}}>Generating Invoice...</div>;
  if (!order) return <div style={{padding: '100px', textAlign: 'center', fontSize: '20px', fontFamily: 'Outfit, sans-serif'}}>Invoice not found.</div>;

  return <Invoice order={order} />;
};

const App = () => {
  return (
    <Router>
      <AdminRedirect />
      <RedirectHandler />
      <PwaManager />
      <Routes>
        <Route path="*" element={<PageWrapper />} />
      </Routes>
    </Router>
  );
};

const EmptyComponent = () => null;

const FeatureComingSoon = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/about") return;

    Swal.fire({
      title: "Coming Soon!",
      text: "This feature is currently under development.",
      icon: "info",
      confirmButtonText: "Go to Home",
    }).then(() => navigate("/"));
  }, [location.pathname]);

  return null;
};

const PageWrapper = () => {
  const location = useLocation();
  const [landing, setLanding] = useState(false);

  const [showSplash1, setShowSplash1] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const idleTimerRef = useRef(null);
  const hasShownRef = useRef(false);

  const { itemCount } = useCart();
  const navigate = useNavigate();

  // Safety timeout to ensure splash screen eventually hides
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
      setShowSplash1(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = Cookies.get("jwt_token");

    if (token && Notification.permission !== "granted") {
      requestNotificationPermission();
    }
  }, []);


  useEffect(() => {
    let intervalId;
    const startPolling = async () => {
      if (document.hidden) return;
      await fetchAndNotifyLatest({ showInApp: true, onlyUnread: true });
    };
    startPolling();
    intervalId = setInterval(startPolling, 2 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);




  useEffect(() => {
    const beforeInstallPromptHandler = (e) => {
      e.preventDefault();
    };

    const appInstalledHandler = () => {
      setIsAppInstalled(true);
      requestNotificationPermission();
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    window.addEventListener("appinstalled", appInstalledHandler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
      setShowSplash1(false);
      setInitialLoad(false);
      setLanding(false);
      requestNotificationPermission();
    } else {
      const landingRoutes = [
        "/about",
        "/delete-account",
        "/privacy-policy",
        "/grievance",
        "/terms-and-conditions",
        "/return-policy"
      ];
      
      const isLandingPage = landingRoutes.includes(location.pathname);
      
      if (isLandingPage) {
        setLanding(true);
        if (location.pathname === "/about") {
          setShowSplash1(false);
          setInitialLoad(false);
        }
      } else {
        setLanding(false);
        setShowSplash1(false);
        setInitialLoad(false);
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallPromptHandler
      );
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, [isAppInstalled, location.pathname]);

  let deferredPrompt;
  useEffect(() => {
    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);

      const today = new Date().toDateString();
      const lastShownDate = localStorage.getItem('supportPopupShownDate');

      if (hasShownRef.current || lastShownDate === today) return;

      idleTimerRef.current = setTimeout(() => {
        hasShownRef.current = true;
        localStorage.setItem('supportPopupShownDate', today);

        Swal.fire({
          title: '<span style="position:absolute; left:-9999px;"></span>',
          html: `
    <button id="support-close-btn" aria-label="Close popup" style="
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      font-size: 28px;
      color: #888;
      cursor: pointer;
      z-index: 10;
      line-height: 1;
    ">&times;</button>
    <div style="text-align: center;">
      <img src="/assist.png" alt="Support Assistant Illustration" style="width: 100px; margin-bottom: 10px;" />
      <h2 style="margin: 10px 0;">Get instant support</h2>
      <p>
        Looking for a specific medicine? Not sure how to order? Just want a quick suggestion?
        <br/><br/>We'll guide you right away!
      </p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button id="call-button" style="
          background-color: #5D399B;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 600;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        " aria-label="Call Us">
          <img src="/call-white.svg" alt="" aria-hidden="true" style="width: 20px" fetchpriority="high"/>
          Call Us
        </button>
        <button id="whatsapp-button" style="
          background-color: white;
          color: black;
          border: 1px solid #ccc;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        " aria-label="WhatsApp Support">
          <img src="/whatsapp-call.svg" alt="" aria-hidden="true" style="width: 20px" fetchpriority="high" />
          WhatsApp
        </button>
      </div>
    </div>
  `,
          showConfirmButton: false,

          footer: '<a href="mailto:admin@medingen.in">Or email us</a>',

          didOpen: () => {
            const dialog = document.querySelector('.swal2-popup');
            if (dialog) {
              dialog.setAttribute('aria-label', 'Get Instant Support');
            }
            document.getElementById("call-button")?.addEventListener("click", () => {
              window.location.href = "tel:+917090123709";
            });

            document.getElementById("whatsapp-button")?.addEventListener("click", () => {
              window.open("https://wa.me/917090123709", "_blank");
            });

            document.getElementById("support-close-btn")?.addEventListener("click", () => {
              Swal.close();
            });
          }
        });

      }, 6000);
    };

    const events = ["mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimerRef.current);
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, []);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  const showInstall = () => {
    if (!isAppInstalled) {
      Swal.fire({
        html: `
              <div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center;">
                <div style="flex: 1; min-width: 250px; text-align: center; margin: 10px;">
                  <h3>For Android</h3>
                  <p>Click the three dots in the top right corner and select "Add to Home screen".</p>
                  <img src="/pwa-install.png" alt="Install PWA on Android" style="width: 80%; max-width: 200px; margin-top: 10px;" />
                </div>
                <div style="flex: 1; min-width: 250px; text-align: center; margin: 10px;">
                  <h3>For iOS</h3>
                  <p>Tap the "Share" button and then "Add to Home Screen".</p>
                  <img src="/pwa-ios-install.png" alt="Install PWA on iOS" style="width: 80%; max-width: 200px; margin-top: 10px;" />
                </div>
              </div>
            `,
        icon: "info",
        showCancelButton: false,
        showConfirmButton: true,
      });
    }
  };

  // requestNotificationPermission();

  return (
    <TransitionGroup>
      <CSSTransition key={location.pathname} classNames="fade" timeout={300}>
        {landing ? (
          <div className="LandingPage">
            <Routes location={location}>
              {!isAppInstalled ? (
                <>
                  <Route path="/about" element={<LandingPage showInstall={showInstall} />} />

                  <Route path="/" element={<Dashboard />} />

                  <Route path="*" element={<Splash1 />} />
                  <Route path="*" element={<FeatureComingSoon />} />

                </>
              ) : (
                <Route path="/" element={<Dashboard />} />
              )}
            </Routes>
            <Footer />
          </div>
        ) : (
          <div className="App">
            {initialLoad && showSplash1 ? (
              <Splash1 />
            ) : (
              <>
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/help-center" element={<HelpCenter />} />
                  <Route
                    path="/policies-privacy-policy"
                    element={<PolicyPages policy={"privacy_policy"} />}
                  />
                  <Route
                    path="/policies-terms-and-conditions"
                    element={<PolicyPages policy={"terms_and_conditions"} />}
                  />
                  <Route
                    path="/policies-grievance-redressal-policy"
                    element={
                      <PolicyPages policy={"grievance_redressal_policy"} />
                    }
                  />
                  <Route path="/policies-return-policy"
                    element={<PolicyPages policy={"return_policy"} />}
                  />
                  <Route path="/generic-medicine-online" element={<GenericMedicineOnline />} />
                  <Route path="/splash" element={<Splash3 />} />
                  <Route path="/savedaddress" element={<SavedAddress />} />
                  <Route path="/searchbox" element={<SearchBox />} />
                  <Route path="/search-results" element={<SearchResults />} />
                  <Route path="/reminder" element={<Reminder />} />
                  <Route path="/product" element={<SearchBox />} />
                  <Route path="/product/*" element={<SearchViewMedicine />} />
                  <Route
                    path="/productid/:productId"
                    element={<ProductRedirect />}
                  />
                  <Route path="/salt/*" element={<SaltPage />} />
                  <Route path="/compare" element={<CompareView />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/notification" element={<Notifications />} />
                  <Route path="/profile" element={<ProfileView />} />
                  <Route path="/personal-info" element={<PersonalInfo />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/login" element={<Login1 />} />
                  <Route path="/login2" element={<Login2 />} />
                  <Route path="/login3" element={<Login3 />} />
                  <Route path="/create-profile" element={<CreateProfile />} />
                  <Route path="/enterpassword" element={<EnterPassword />} />
                  <Route path="/existing" element={<ExistingUser />} />
                  <Route path="/createpassword" element={<CreatePassword />} />
                  <Route path="/addressnew" element={<AddressNew />} />
                  <Route
                    path="/upload-prescription"
                    element={<UploadPrescription />}
                  />
                  <Route path="/view-offer" element={<OffersView />} />
                  <Route path="/categories" element={<AllCategories />} />
                  <Route path="/categories/:mainCategory" element={<CategoryPage />} />
                  <Route path="/categories/:mainCategory/:subCategory" element={<CategoryPage />} />
                  <Route path="/category" element={<CategoryPage />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route
                    path="/select-prescription"
                    element={<SelectPrescription />}
                  />
                  <Route path="/cart/pharmacist-verification/payment/place-order" element={<OrderPlacedSuccess />} />
                  <Route path="/blogs" element={<Blogs />} />

                  <Route path="/blogs/:blogUrl" element={<Blog />} />

                  <Route
                    path="/capture-prescription"
                    element={<CapturePrescription />}
                  />
                  <Route path="/cart" element={<OrderProgress />} />
                  <Route path="/order-progress" element={<OrderProgress />} />
                  <Route path="/cart/pharmacist-verification" element={<PharmacistVerification />} />
                  <Route path="/cart/pharmacist-verification/payment" element={<PaymentPage />} />
                  <Route path="/order-payment" element={<OrderPayment />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/order/*" element={<OrderTrack />} />
                  <Route path="/order-details/:id" element={<OrderDetails />} />
                  <Route path="/invoice/:id" element={<InvoiceWrapper />} />

                  <Route
                    path="/product_name/:name"
                    element={<EmptyComponent />}
                  />
                  <Route path="/salt_name/:name" element={<EmptyComponent />} />

                  <Route path="*" element={<FeatureComingSoon />} />
                </Routes>
                {window.location.pathname !== "/cart" &&
                  window.location.pathname !== "/addressnew" &&
                  window.location.pathname !== "/place-order" &&
                  window.location.pathname !== "/savedaddress" &&
                  window.location.pathname !== "/upload-prescription" &&
                  window.location.pathname !== "/select-prescription" &&
                  window.location.pathname !== "/order-progress" &&
                  window.location.pathname !== "/order-payment" &&
                  window.location.pathname !== "/cart/payment" && (
                    <>
                      {itemCount > 0 && (
                        <div className="floating-cart-left" onClick={() => navigate("/cart")}>
                          <p>{itemCount} {itemCount === 1 ? "item" : "items"} added</p>
                        </div>
                      )}

                    </>
                  )}
                {!["/splash", "/login", "/login2", "/login3", "/enterpassword", "/create-profile", "/createpassword", "/existing"].includes(location.pathname) && !location.pathname.startsWith("/invoice") && <Footer />}
              </>
            )}
          </div>
        )}
      </CSSTransition>
    </TransitionGroup>
  );
};

export default App;