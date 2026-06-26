import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import "./style.css";
import {
  getUser,
  getCategories,
  getBanner,
  getAllCategories,
  getMainCategories,
  searchProducts,
  addToCart,
} from "../../api/Api";
import Navigation from "./Navigation";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../api/stateContext";
import { useSwipeable } from "react-swipeable";

import { DashboardHeader } from "./DashboardHeader";
import { CategoryFilter, categoryData } from "../Category/CategoryFilter";
import ProductSection from "./ProductSection";
import { InlineSearch } from "../../components/InlineSearch/InlineSearch";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/free-mode";

import { Navigation as nav, Autoplay } from "swiper/modules";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Testimonials from "../LandingPage/Testimonials";
import SubstitutionBanner from "./SubstitutionBanner";
import WhyMedingen from "./WhyMedingen";
import GetStarted from "./GetStarted";
import FeaturedBrands from "./FeaturedBrands";
import LatestBlogs from "./LatestBlogs";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Footer } from "../LandingPage/LandingPage";

// ─── URL helper ──────────────────────────────────────────────────────────────
const nameToSlug = (name) =>
  name
    ? name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
    .replace(/\s+/g, "-")
    : "";

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
// ─────────────────────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "Are generic medicines on Medingen as effective as branded ones?",
    answer:
      "Yes. All generic medicines available on Medingen meet the same quality, safety and efficacy standards as branded medicines. They have the same active ingredients and dosage but cost significantly less.",
  },
  {
    question: "How can I compare medicine prices on Medingen?",
    answer:
      "You can easily compare prices by searching for a medicine on our platform. We display both branded and generic options with their respective prices, allowing you to see the significant savings Medingen offers.",
  },
  {
    question: "Can I upload my prescription on Medingen safely?",
    answer:
      "Yes, Medingen uses advanced security protocols to ensure your health information and prescriptions are kept completely confidential and safe.",
  },
  {
    question: "Does Medingen offer free delivery?",
    answer:
      "Yes, Medingen offers free delivery on orders above ₹1000. For orders below this amount, a standard delivery fee applies.",
  },
  {
    question: "Does Medingen deliver medicines all over India?",
    answer:
      "Yes, Medingen provides delivery for generic medicines across all major cities and towns in India.",
  },
  {
    question: "Can I buy medicines on Medingen without a prescription?",
    answer:
      "For some general healthcare products, a prescription is not required. However, for most therapeutic generic medicines, a valid doctor's prescription is necessary to ensure your safety.",
  },
];

export const FaqSchema = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
  );
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleFAQ = (index) => setOpenIndex((prev) => (prev === index ? null : index));

  return (
    <div className="faq-container">
      <FaqSchema />
      <h2 className="faq-title">FAQ's</h2>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <button
              onClick={() => toggleFAQ(index)}
              className={`faq-question ${openIndex === index ? "active" : ""}`}
            >
              <h3 className="faq-question-text">{faq.question}</h3>
              <span className="faq-toggle">{openIndex === index ? "−" : "+"}</span>
            </button>
            {openIndex === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="faq-answer"
              >
                <p>{faq.answer}</p>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const HowToOrderPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalKey, setModalKey] = useState(null);
  const togglePanel = () => setIsOpen((prev) => !prev);
  const openModal = (key) => setModalKey(key);
  const closeModal = () => setModalKey(null);

  const panelItems = [
    { img: "how_to_prescription.png", label: "Using prescription", key: "prescription" },
    { img: "how_to_whatsapp.png", label: "Using WhatsApp", key: "whatsapp" },
    { img: "how_to_call.png", label: "Using Call", key: "call" },
    { img: "how_to_online.png", label: "Online", key: "online" },
  ];

  const modalData = {
    online: {
      icon: "how_to_box_online.png", text: "Online",
      steps: ["Search your medicine", "Add to cart", "Place order", "Free doctor consultation", "Delivery at your doorstep"],
      button: { label: "Search", link: "/searchbox" },
    },
    call: {
      icon: "how_to_box_call.png", text: "Order on Call",
      steps: ["Call our support team", "Get estimation & approval order", "Free doctor consultation", "Delivery at door step"],
      button: { label: "Call us", link: "tel:+917090123709" },
    },
    prescription: {
      icon: "how_to_box_presc.png", text: "Upload prescription",
      steps: ["Upload prescription", "Place order", "Estimation & Approval on call", "Free doctor consultation", "Delivery at doorstep"],
      button: { label: "Upload", link: "/upload-prescription" },
    },
    whatsapp: {
      icon: "how_to_box_whatsapp.png", text: "Order on Whatsapp",
      steps: ["Chat with support team", "Get estimation & approval on order", "Free doctor consultation", "Delivery at doorstep"],
      button: { label: "Message us", link: "https://wa.me/+917090123709" },
    },
  };

  const modal = modalKey ? modalData[modalKey] : null;

  return (
    <div className="floater-icon-2">
      {isOpen && (
        <div className="floating-panel">
          <div className="icon-grid">
            {panelItems.map((item, index) => (
              <div key={index} className="icon-item" onClick={() => openModal(item.key)}>
                <img src={item.img} alt={item.label} className="item-icon" />
                <div className="item-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="how-to-order-button" onClick={togglePanel}>
        <img src={isOpen ? "how_to_close.png" : "how_to.png"} alt="Toggle icon" className="button-icon" />
        <div className="label">{isOpen ? "Collapse" : "How to order"}</div>
      </div>
      {modal && (
        <div className="how-to-order-container">
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-button" onClick={closeModal}>×</button>
              <div className="modal-header">
                <img src={modal.icon} alt={modal.text} className="modal-icon" />
                <div className="modal-title">{modal.text}</div>
              </div>
              <div className="modal-steps">
                {modal.steps.map((step, idx) => (
                  <div key={idx} className="step">
                    <div className="step-circle">{idx + 1}</div>
                    <div className="step-line" />
                    <div className="step-text">{step}</div>
                  </div>
                ))}
              </div>
              <a href={modal.button.link} className="modal-action-btn">{modal.button.label}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Dashboard = () => {
  const [slides, setSlides] = useState([]);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [allCategories, setAllCategories] = useState([]);
  const [fullCategoryList, setFullCategoryList] = useState([]);
  const [activeMainCategory, setActiveMainCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [alternateProducts, setAlternateProducts] = useState({});
  const [selectedFilterCategory, setSelectedFilterCategory] = useState(null);
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState(null);
  const [dynamicCategoryData, setDynamicCategoryData] = useState([]);
  const [mainCategoriesLoading, setMainCategoriesLoading] = useState(true);
  const [subCatPage, setSubCatPage] = useState(0);

  const subCategories = [
    { name: "Diabetes Care", image: "/rectangle-253.png" },
    { name: "Health Care", image: "/image-16.png" },
    { name: "Skin Care", image: "/image-10.png" },
    { name: "Digestive Care", image: "/image-12.png" },
    { name: "Minerals Supplements", image: "/medicine-details.png" },
    { name: "Kidney Care", image: "/rectangle-253-1.png" },
    { name: "Personal Care", image: "https://medingen-store-new.s3.ap-south-1.amazonaws.com/main_categories/personal+care+products_2.png" },
    { name: "Healthcare Devices", image: "/iphone-16.svg" },
    { name: "Pain Relief", image: "/reminder_icon.png" },
    { name: "Eye Care", image: "/rectangle-264.png" },
    { name: "Protein Supplements", image: "/image-1.png" },
    { name: "Bone And Joint", image: "/image-9.png" },
    { name: "Vitamins And Supplements", image: "/medicine-details.png" },
    { name: "Type 2 Diabetes", image: "/rectangle-253-2.png" },
    { name: "Vitamin A To Z", image: "/rectangle-253-3.png" },
    { name: "Insulin Injection", image: "/rectangle-253.png" },
    { name: "Sexual Wellness", image: "/image-20.png" },
  ];

  // const { itemCount } = useCart();
  const [user, setUser] = useState({ name: "", location: "" });

  const [videoSlides] = useState([
    { videourl: "https://www.youtube.com/embed/vqXrfzWgDkE", videoId: "vqXrfzWgDkE" },
    { videourl: "https://www.youtube.com/embed/wA-b9dK-JYU", videoId: "wA-b9dK-JYU" },
    { videourl: "https://www.youtube.com/embed/VDqsHl3lBlA", videoId: "VDqsHl3lBlA" },
    { videourl: "https://www.youtube.com/embed/sRmjDrTht6Q", videoId: "sRmjDrTht6Q" },
    { videourl: "https://www.youtube.com/embed/_NJTKDHJw7Y", videoId: "_NJTKDHJw7Y" },
    { videourl: "https://www.youtube.com/embed/BjZt63Ce7Zw", videoId: "BjZt63Ce7Zw" },
  ]);

  const [categories, setCategories] = useState([]);
  const { itemCount, dispatch, refreshCartCount } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sharedSearchText, setSharedSearchText] = useState("");
  const [sharedShowDropdown, setSharedShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dashboardScrollRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    refreshCartCount();
  }, []);

  useEffect(() => {
    const scrollEl = dashboardScrollRef.current;
    if (!scrollEl) return;

    const handleGlobalScroll = () => {
      const scrollPos = scrollEl.scrollTop;
      setIsScrolled(scrollPos > 150);
      if (sharedShowDropdown) {
        setSharedShowDropdown(false);
      }
    };
    scrollEl.addEventListener("scroll", handleGlobalScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleGlobalScroll);
  }, [sharedShowDropdown]);

  const handleScrollToSection = (section) => {
    window.location.href = "/about#" + section;
  };

  const swiperRef = useRef(null);
  const vSwiperRef = useRef(null);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    if (swiperRef.current) swiperRef.current.slideTo(index);
  };

  const [currentVIndex, setCurrentVIndex] = useState(0);

  const handleDotVClick = (index) => {
    setCurrentVIndex(index);
    if (vSwiperRef.current) vSwiperRef.current.slideTo(index);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catData = await getCategories();
        setCategories(catData);

        const allCatData = await getAllCategories();
        setFullCategoryList(allCatData);

        const requestedNames = ["Diabetes Care", "OTC", "Face wash", "sachet", "Gel", "foot care"];
        const keywordMap = {
          "Diabetes Care": ["diabetes care"],
          "OTC": ["otc", "over the counter"],
          "Face wash": ["face wash", "cleanser"],
          "sachet": ["sachet"],
          "Gel": ["gel", "topical gel"],
          "foot care": ["foot care"],
        };

        const finalCategories = requestedNames
          .map((reqName) => {
            const words = keywordMap[reqName] || [reqName.toLowerCase()];
            const match = allCatData.find((cat) => {
              const displayName = (cat.display_name || "").toLowerCase();
              const categoryName = (cat.category_name || "").toLowerCase();
              return words.some((word) => displayName.includes(word) || categoryName.includes(word));
            });
            if (match) {
              let imageUrl = "/medicine-details.png";
              if (match.category_image_url && typeof match.category_image_url === "string" && match.category_image_url.trim() !== "") {
                imageUrl = `https://d1dh0rr5xj2p49.cloudfront.net/categories/${match.category_image_url.trim()}`;
              }
              return { name: reqName, id: match.category_id, image: imageUrl, category_name: match.category_name };
            }
            return null;
          })
          .filter((cat) => cat !== null);

        setAllCategories(finalCategories);
        if (finalCategories.length > 0) setActiveCategory(finalCategories[0].id);

        const bannerData = await getBanner("home_banner");
        setSlides([...bannerData]);
        setLoadingBanner(false);

        try {
          setMainCategoriesLoading(true);
          const hierarchy = await getMainCategories();
          if (hierarchy && hierarchy.length > 0) {
            const formattedData = hierarchy.map((cat) => {
              const rawSubCats = cat.sub_categories || cat.subcategories || cat.children || cat.items || [];
              const subCatsArray = Array.isArray(rawSubCats) ? rawSubCats : [];
              return {
                title: cat.name || cat.category_name || cat.title,
                items: subCatsArray
                  .map((s) => {
                    if (typeof s === "string") return { name: s, image: null };
                    return {
                      name: s.name || s.category_name || s.title || "",
                      image: s.image || s.category_image_url || null
                    };
                  })
                  .filter((s) => s.name !== ""),
              };
            });
            const priorityOrder = [
              "Personal Care",
              "Health Conditions",
              "Vitamins & Supplements",
              "Diabetes Care",
              "Chronic Care",
            ];

            const sortedData = formattedData.sort((a, b) => {
              const indexA = priorityOrder.indexOf(a.title);
              const indexB = priorityOrder.indexOf(b.title);

              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;

              return a.title.localeCompare(b.title);
            });

            setDynamicCategoryData(sortedData);
            setSelectedCategoryGroup(sortedData[0].title);
          }
        } catch (err) {
          console.error("Error fetching hierarchy:", err);
        } finally {
          setMainCategoriesLoading(false);
        }
      } catch (error) {
        console.error("Error fetching categories", error);
        Swal.fire({ icon: "error", title: "Oops...", text: "Failed to load categories!" });
      }
    };
    fetchCategories();
  }, []);

  const handleAddToCart = async (product) => {
    const userData = getUser();
    if (!userData.isLoggedIn) { navigate("/login"); return; }

    const { value: quantity } = await Swal.fire({
      title: "Enter Quantity",
      html: `
        <div style="display: flex; align-items: center; justify-content: center;">
          <button id="decrease" style="width:24px;height:24px;border:none;background-color:#1E1E1E;color:#fff;border-radius:4px;cursor:pointer;">-</button>
          <input id="quantity" type="text" value="1" readonly style="text-align:center;width:50px;font-size:18px;margin:0 10px;background:none;border:none;">
          <button id="increase" style="width:24px;height:24px;border:none;background-color:#1E1E1E;color:#fff;border-radius:4px;cursor:pointer;">+</button>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Add to Cart",
      cancelButtonText: "Cancel",
      icon: "question",
      didOpen: () => {
        const quantityInput = document.getElementById("quantity");
        let qty = parseInt(quantityInput.value);
        document.getElementById("increase").addEventListener("click", () => { qty += 1; quantityInput.value = qty; });
        document.getElementById("decrease").addEventListener("click", () => { if (qty > 1) { qty -= 1; quantityInput.value = qty; } });
      },
      preConfirm: () => document.getElementById("quantity").value,
    });

    if (quantity && quantity > 0) {
      try {
        const result = await addToCart(product.product_id, null, quantity, navigate);
        let cartItems = result.cart_items.split(";").filter((item) => item !== "");
        dispatch({ type: "UPDATE_COUNT", payload: cartItems.length });
      } catch (error) {
        console.error("Error adding product to cart:", error);
        Swal.fire({ title: "Error", text: "There was an error adding the product to your cart.", icon: "error", confirmButtonText: "OK" });
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!activeCategory || allCategories.length === 0) return;
      const selectedCat = allCategories.find((c) => c.id === activeCategory);
      if (!selectedCat) return;
      setLoadingProducts(true);
      try {
        const results = await searchProducts(selectedCat.category_name || selectedCat.name, 1, { query: "rc=0" });
        setProducts(results.results || []);
        setAlternateProducts({});
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [activeCategory, allCategories]);

  // ── CHANGED: navigate to slug-based URLs ────────────────────────────────
  const handleFilterSelect = (categoryName) => {
    // If we receive an object with name property
    const name = typeof categoryName === 'object' ? categoryName.name : categoryName;

    const parentCat = dynamicCategoryData.find((cat) =>
      cat.items.some((sub) => (sub.name || sub).toLowerCase() === name.toLowerCase())
    );
    if (parentCat) {
      // Sub-category → /categories/chronic-care/cardiac-care
      navigate(`/categories/${nameToSlug(parentCat.title)}/${nameToSlug(name)}`);
    } else {
      // Main category → /categories/chronic-care
      navigate(`/categories/${nameToSlug(name)}`);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── CHANGED: removed old ?name= query param sync ─────────────────────────
  useEffect(() => {
    if (dynamicCategoryData.length > 0 && !selectedCategoryGroup) {
      setSelectedCategoryGroup(dynamicCategoryData[0].title);
    }
  }, [dynamicCategoryData]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleGroupSelect = (groupTitle) => {
    setSelectedCategoryGroup(groupTitle);
    setSelectedFilterCategory(null);
  };

  const getSubcategoryImage = (subCatName) => {
    const normalizedName = (subCatName || "").trim().toLowerCase();
    if (normalizedName === "personal care") {
      return "https://medingen-store-new.s3.ap-south-1.amazonaws.com/main_categories/personal+care+products_2.png";
    }

    if (!fullCategoryList || fullCategoryList.length === 0) return "/medicine-details.png";
    const match = fullCategoryList.find((cat) => (cat.category_name || "").trim().toLowerCase() === normalizedName);
    if (match) {
      if (match.category_image_url && match.category_image_url.trim() !== "")
        return `https://d1dh0rr5xj2p49.cloudfront.net/categories/${match.category_image_url.trim()}`;
      if (match.category_outline_url && match.category_outline_url.trim() !== "")
        return `https://d1dh0rr5xj2p49.cloudfront.net/categories/${match.category_outline_url.trim()}`;
    }
    return "/medicine-details.png";
  };

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (!selectedFilterCategory) { setProducts([]); return; }
      setLoadingProducts(true);
      try {
        const results = await searchProducts(selectedFilterCategory, 1, { query: "rc=0" });
        setProducts(results.results || []);
      } catch (error) {
        console.error("Error fetching filtered products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchFilteredProducts();
  }, [selectedFilterCategory]);

  useEffect(() => {
    const fetchAlternates = async () => {
      if (products.length === 0) return;
      for (const product of products) {
        const salt = product.salt_name;
        const category = product.selected_category;
        if (salt && category && !alternateProducts[salt]) {
          try {
            const results = await searchProducts("", 1, { query: `salt_name = '${salt}' AND categories = '${category}' AND rc=1` });
            if (results.results && results.results.length > 0)
              setAlternateProducts((prev) => ({ ...prev, [salt]: results.results }));
          } catch (error) {
            console.error(`Error fetching alternate for ${salt}:`, error);
          }
        }
      }
    };
    fetchAlternates();
  }, [products]);

  const sortSuggestions = (suggestions) => {
    const saltMap = new Map();
    for (const item of suggestions) {
      const salt = item.salt_name;
      if (!saltMap.has(salt)) saltMap.set(salt, []);
      saltMap.get(salt).push(item);
    }
    return Array.from(saltMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([salt, products]) => ({ salt, products }));
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      handleDotClick((currentIndex + 1) % slides.length);
      handleDotVClick((currentVIndex + 1) % videoSlides.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [currentIndex, slides.length, currentVIndex, videoSlides.length]);


  const swipeVHandlers = useSwipeable({
    onSwipedLeft: () => handleDotVClick((currentVIndex + 1) % videoSlides.length),
    onSwipedRight: () => handleDotVClick((currentVIndex - 1 + videoSlides.length) % videoSlides.length),
  });

  const [slidesPerView, setSlidesPerView] = useState("auto");
  const updateSlidesPerView = () => {
    setSlidesPerView(window.innerWidth < 800 ? 1 : window.innerWidth / 500);
  };
  useEffect(() => {
    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleBannerClick = () => navigate("/offers");

  return (
    <>
      <Helmet>
        <meta title="Buy Generic Medicines Online | Trusted Store - Medingen" />
        <meta name="description" content="Medingen offers affordable generic medicines and fast doorstep delivery across India. Shop online for trusted and quality healthcare products." />
        <link rel="canonical" href="https://medingen.in/" />
      </Helmet>

      <div className="dashboard" ref={dashboardScrollRef}>
        <div className="sticky-header-container">
          <DashboardHeader 
            searchText={sharedSearchText} 
            setSearchText={setSharedSearchText} 
            showDropdown={sharedShowDropdown && (location.pathname !== '/' || isScrolled)}
            setShowDropdown={setSharedShowDropdown}
            scrollContainerRef={dashboardScrollRef}
          />
        </div>

        <div className="dashboard-container">
          <div className="hero-section">
            <div className="hero-content">
              <h1>Medingen - Buy Generic Medicines Online</h1>
              <p className="hero-subtext">High-quality generics at the best prices. Upload your prescription and get fast delivery across India.</p>

              <div className="dashboard-search-container">
                <InlineSearch 
                  searchText={sharedSearchText} 
                  setSearchText={setSharedSearchText} 
                  showDropdown={sharedShowDropdown && location.pathname === '/' && !isScrolled}
                  setShowDropdown={setSharedShowDropdown}
                  scrollContainerRef={dashboardScrollRef}
                />
              </div>

              <div className="trust-badges">
                <div className="badge">
                  <img src="/CheckCircle.svg" alt="Verified" className="badge-icon-svg" />
                  <span className="badge-text">Verified pharmacies</span>
                </div>
                <div className="badge">
                  <img src="/CheckCircle.svg" alt="Approved" className="badge-icon-svg" />
                  <span className="badge-text">Government-approved medicines</span>
                </div>
                <div className="badge">
                  <img src="/CheckCircle.svg" alt="Safe" className="badge-icon-svg" />
                  <span className="badge-text">Safe & fast delivery</span>
                </div>
              </div>

              <div className="order-via-divider">
                <span className="divider-line"></span>
                <span className="divider-text">Place Your Order Via</span>
                <span className="divider-line"></span>
              </div>

              <div className="action-buttons-container">
                <div className="action-btn-box call-box" onClick={() => window.open("tel:+917090123709")}>
                  <div className="btn-content">
                    <span className="btn-label">Order Medicine On Call</span>
                    <span className="btn-value">70901 23709</span>
                  </div>
                  <div className="btn-icon"><img src="/Call.svg" alt="Call" /></div>
                </div>
                <Link to="/upload-prescription" className="action-btn-box presc-box">
                  <div className="btn-content">
                    <span className="btn-label">Order with prescription</span>
                    <span className="btn-value">Upload Now</span>
                  </div>
                  <div className="btn-icon"><img src="/Upload.svg" alt="Upload" /></div>
                </Link>
              </div>
            </div>
          </div>

          <div className="dashboard-item banner-carousel-container">
            <div className="group-3">
              {loadingBanner ? (
                <div className="banner-skeleton-wrapper">
                  <div className="banner-skeleton-slide banner-skeleton-anim"></div>
                  <div className="banner-skeleton-slide banner-skeleton-anim hide-on-mobile"></div>
                  <div className="banner-skeleton-slide banner-skeleton-anim hide-on-mobile hide-on-tablet"></div>
                </div>
              ) : (
                <Swiper
                  spaceBetween={16}
                  centeredSlides={false}
                  slidesPerView={3}
                  loop={true}
                  grabCursor={true}
                  simulateTouch={true}
                  observer={true}
                  observeParents={true}
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  navigation={true}
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
                  modules={[nav, Autoplay]}
                  className="banner-swiper"
                  breakpoints={{
                    320: { slidesPerView: 1, spaceBetween: 10 },
                    768: { slidesPerView: 2, spaceBetween: 15 },
                    1024: { slidesPerView: 3, spaceBetween: 16 },
                  }}
                >
                  {slides.map((slide, index) => (
                    <SwiperSlide key={`banner-${index}`}>
                      <div className="overlap-group-wrapper">
                        {slide.banner ? (
                          <img
                            className="banner"
                            src={`https://d1dh0rr5xj2p49.cloudfront.net/banner/${slide.banner}`}
                            alt="Banner"
                            onClick={() => handleBannerClick(slide.tnc)}
                            style={{ borderRadius: "12px", cursor: "pointer" }}
                          />
                        ) : (
                          <div className="overlap-slider" style={{ borderRadius: "12px", overflow: "hidden" }}>
                            <img className="image" alt="Slide Image" src={slide.image} />
                            <div className="frame-10">
                              <p className="text-wrapper-8">{slide.header}</p>
                              <p className="text-wrapper-9">{slide.subHeader}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </SwiperSlide>
                  ))}
                  <div className="carousel-right-shadow"></div>
                </Swiper>
              )}
            </div>
          </div>

          <div className="sbc-section">
            <div className="sbc-header">
              <h2 className="sbc-title">Shop by categories</h2>
              <span className="sbc-view-all" onClick={() => navigate("/categories")}>
                View all
              </span>
            </div>

            {mainCategoriesLoading ? (
              <div className="sbc-skeleton-wrap">
                <div className="sbc-skeleton-sidebar">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="sbc-skeleton-circle banner-skeleton-anim"></div>
                  ))}
                </div>
                <div className="sbc-skeleton-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="sbc-skeleton-card banner-skeleton-anim"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sbc-layout">
                {/* ── Left sidebar: main categories ── */}
                <div className="sbc-sidebar">
                  {dynamicCategoryData.map((cat, idx) => {
                    const isActive = activeMainCategory
                      ? activeMainCategory === cat.title
                      : idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`sbc-sidebar-item ${isActive ? "active" : ""}`}
                        onClick={() => { setActiveMainCategory(cat.title); setSubCatPage(0); }}
                      >
                        <div className="sbc-sidebar-icon">
                          <img
                            src={getSubcategoryImage(cat.title)}
                            alt={cat.title}
                            onError={(e) => (e.target.src = "/medicine-details.png")}
                          />
                        </div>
                        <span className="sbc-sidebar-label">{cat.title}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="sbc-grid-wrapper">
                  {(() => {
                    const activeCat = activeMainCategory
                      ? dynamicCategoryData.find((c) => c.title === activeMainCategory)
                      : dynamicCategoryData[0];
                    if (!activeCat) return null;
                    const allItems = activeCat.items;
                    const pageSize = 6;
                    const totalPages = Math.ceil(allItems.length / pageSize);
                    const visibleItems = allItems.slice(subCatPage * pageSize, (subCatPage + 1) * pageSize);
                    const discounts = ["Up to 50% off", "Up to 40% off", "Up to 35% off", "Up to 25% off", "Up to 30% off", "Up to 45% off"];
                    return (
                      <>
                        {totalPages > 1 && subCatPage > 0 && (
                          <button
                            className="sbc-grid-arrow"
                            onClick={() => setSubCatPage((p) => p - 1)}
                          >
                            <FiChevronLeft size={22} />
                          </button>
                        )}
                        <div className="sbc-grid">
                          {visibleItems.map((sub, idx) => {
                            const subName = typeof sub === "object" ? sub.name : sub;
                            const globalIdx = subCatPage * pageSize + idx;
                            return (
                              <div
                                key={globalIdx}
                                className="sbc-card"
                                onClick={() => handleFilterSelect(subName)}
                              >
                                <div className="sbc-card-text">
                                  <span className="sbc-card-name">{toTitleCase(subName)}</span>
                                  <span className="sbc-card-offer">{discounts[globalIdx % discounts.length]}</span>
                                </div>
                                <div className="sbc-card-img">
                                  <img
                                    src={getSubcategoryImage(subName)}
                                    alt={subName}
                                    onError={(e) => (e.target.src = "/medicine-details.png")}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 1 && subCatPage < totalPages - 1 && (
                          <button
                            className="sbc-grid-arrow"
                            onClick={() => setSubCatPage((p) => p + 1)}
                          >
                            <FiChevronRight size={22} />
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>


          <ProductSection title="Top Selling Medicine" categoryKey="topSellingMedicines" />
          <ProductSection title="Deals For The Day" categoryKey="dealsForTheDay" />
          <SubstitutionBanner />
          <ProductSection title="Frequently Searched Medicine" categoryKey="frequentlySearchedMedicine" />
          <Testimonials title="Hear from Medingen Customers" />
          <ProductSection title="Popular Medicine" categoryKey="popularMedicine" />

          <div className="dashboard-item">
            <LatestBlogs />
            <FeaturedBrands />
            <FAQSection />
          </div>

          <WhyMedingen />
          <GetStarted />
          <HowToOrderPanel />
          <div className="margin-72"></div>
        </div>

        <div className="landing-page">
          <Footer handleScrollToSection={handleScrollToSection} />
        </div>
      </div>

      <Navigation />
    </>
  );
};