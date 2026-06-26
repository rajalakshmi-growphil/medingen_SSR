"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import "./style.css";

import Navigation from "../Dashboard/Navigation";
import { getAllCategories, getProductsByCategory, addToCart, getUser, getCartData, requestProduct, getMainCategories } from "@/lib/api";
import { useCart } from "@/app/providers";
import { CategoryPageFilter } from "./CategoryPageFilter";

import Header from "../Dashboard/Header";
import { FiChevronDown, FiCheck, FiSearch, FiX, FiFilter, FiTrash2, FiPlus, FiMinus, FiArrowUp } from "react-icons/fi";
import { useMemo } from "react";

// ─── URL helpers ────────────────────────────────────────────────────────────
// "personal-care-125"  →  "Personal Care"   (strips trailing numeric id)
const slugToName = (slug) =>
  slug
    ? slug
      .replace(/-\d+$/, "")
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    : null;

const nameToSlug = (name, id = null) => {
  const base = name
    ? name
      .toLowerCase()
      .replace(/&/g, "and")                 
      .replace(/[^a-z0-9\s-]/g, "")      
      .trim()
      .replace(/\s+/g, "-")                  
    : "";
  return id ? `${base}-${id}` : base;
};

const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
// ─────────────────────────────────────────────────────────────────────────────

const ResponsiveCategoryView = ({ categories, allCategories, onSelectSubCategory, filteredSuggestions, onAddToCart }) => {
  const [activeMainCat, setActiveMainCat] = useState(categories[0]);

  useEffect(() => {
    if (categories?.length > 0 && !activeMainCat) {
      setActiveMainCat(categories[0]);
    }
  }, [categories]);

  const handleMainCatClick = (cat) => {
    setActiveMainCat(cat);
    onSelectSubCategory(cat.title || cat.category_name);
  };

  const getSubCatImage = (subCatName) => {
    const match = allCategories.find(c =>
      (c.display_name?.toLowerCase() === subCatName.toLowerCase()) ||
      (c.category_name?.toLowerCase() === subCatName.toLowerCase())
    );
    if (match && match.category_image_url) {
      return `https://d1dh0rr5xj2p49.cloudfront.net/categories/${match.category_image_url}`;
    }
    return "/medicine-details.png";
  };

  const displayedSubCategories = activeMainCat?.items || [];

  return (
    <div className="responsive-layout-container">
      <div className="categories-scroll-wrapper">
        <div className="main-categories-grid">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.category_name}
              className={`main-cat-tab ${activeMainCat?.id === cat.id ? "active" : ""}`}
              onClick={() => handleMainCatClick(cat)}
            >
              <span>{cat.display_name || cat.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sub-categories-section">
        <div className="sub-categories-grid">
          {displayedSubCategories.map((sub, idx) => (
            <div
              key={idx}
              className="sub-cat-card"
              onClick={() => onSelectSubCategory(sub)}
            >
              <div className="sub-cat-img-wrapper">
                <img src={getSubCatImage(sub)} alt={sub} onError={(e) => e.target.src = "/medicine-details.png"} />
              </div>
              <span>{toTitleCase(sub)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MobileProductCard = ({ product, onAddToCart, onUpdateQuantity, navigate, cartItems = [] }) => {
  const oldPrice = parseFloat(product.product_pricing_old) || 0;
  const newPrice = parseFloat(product.product_pricing_new || product.product_pricing_old) || 0;
  const savings = oldPrice > newPrice && oldPrice > 0
    ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
    : 0;

  const cartItem = cartItems.find(item =>
    String(item.product_id || item.id) === String(product.product_id)
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="mobile-card" onClick={() => navigate(`/product/${product.product_name_url}`)}>
      {savings > 0 && <div className="mobile-card-badge">{savings}% SAVINGS</div>}
      <div className="mobile-card-img-wrap">
        <img
          src={`https://d1dh0rr5xj2p49.cloudfront.net/products/${product.first_image_url}`}
          alt={product.product_name}
          onError={(e) => { e.target.onerror = null; e.target.src = "/medicine-details.png" }}
        />
      </div>
      <div className="mobile-card-content">
        <div className="mobile-card-title">{product.product_name}</div>
        <div className="mobile-card-composition">{product.composition || product.salt_name}</div>
        <div className="mobile-card-meta">{product.pack_size}</div>

        <div className="mobile-price-grid">
          <div className="mobile-price-col">
            <span className="m-label">Selling price</span>
            <span className="m-price-new">₹{parseInt(product.product_pricing_new || product.product_pricing_old)}</span>
          </div>
          <div className="mobile-price-col text-right">
            <span className="m-label">MRP</span>
            <span className="m-price-old">₹{parseInt(product.product_pricing_old)}</span>
          </div>
        </div>

        {quantity > 0 ? (
          <div className="qty-stepper-mobile" onClick={(e) => e.stopPropagation()}>
            <button className="stepper-btn-delete" onClick={() => onUpdateQuantity(product, quantity - 1)}>
              {quantity === 1 ? <FiTrash2 /> : <FiMinus />}
            </button>
            <span className="stepper-qty">{quantity}</span>
            <button className="stepper-btn-add" onClick={() => onUpdateQuantity(product, quantity + 1)}>
              <FiPlus />
            </button>
          </div>
        ) : (
          <button
            className={product.rc === 0 ? "btn-view-request" : "btn-purple-cart"}
            onClick={(e) => {
              e.stopPropagation();
              if (product.rc === 0) {
                navigate(`/product/${product.product_name_url}`);
              } else {
                onAddToCart(product);
              }
            }}
          >
            {product.rc === 0 ? null : <img src="/cart-white.svg" alt="" />}
            {product.rc === 0 ? "View" : "Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-image" />
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-subtitle" />
    <div className="skeleton-price-row">
      <div className="skeleton skeleton-price-box" />
      <div className="skeleton skeleton-price-box" />
    </div>
    <div className="skeleton skeleton-button" />
  </div>
);

export const CategoryPage = () => {
  const router = useRouter();
  const navigate = (path, options) => {
    if (options && options.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };

  // ── NEW: read slug params from the URL path ──────────────────────────────
  const { mainCategory, subCategory } = useParams();
  const categoryFromUrl = slugToName(mainCategory);   // e.g. "personal-care" → "Personal Care"
  const subCategoryFromUrl = slugToName(subCategory); // e.g. "skin-care-125" → "Skin Care"
  // ─────────────────────────────────────────────────────────────────────────

  const scrollRef = useRef(null);
  const sortRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alternate, setAlternate] = useState({});
  const [dynamicCategoryData, setDynamicCategoryData] = useState([]);
  const [mainCategoriesLoading, setMainCategoriesLoading] = useState(true);

  // Advanced Filters and Sorting
  const [sortBy, setSortBy] = useState("price_low_high");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    // ── NEW: initialise sub-category from the URL slug ───────────────────
    subCategories: subCategoryFromUrl ? [subCategoryFromUrl] : [],
    // ─────────────────────────────────────────────────────────────────────
    dosageForm: [],
    saltComposition: ""
  });
  const [totalResults, setTotalResults] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showGoToTop, setShowGoToTop] = useState(false);
  const { cartItems, dispatch } = useCart();

  useEffect(() => {
    setIsMobile(window.innerWidth <= 1024);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll event listener for go-to-top button
  useEffect(() => {
    const handleScroll = (e) => {
      const scrollPosition = e.target ? e.target.scrollTop : window.scrollY;
      if (scrollPosition > 300) {
        setShowGoToTop(true);
      } else {
        setShowGoToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    const scrollContainer = document.querySelector('.responsive-layout-container');
    if (scrollContainer) scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollContainer) scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const scrollContainer = document.querySelector('.responsive-layout-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const sortOptions = [
    { label: "New Arrivals", value: "new_arrivals" },
    { label: "Price: Low to High", value: "price_low_high" },
    { label: "Price: High to Low", value: "price_high_low" },
    { label: "Discount: Low to High", value: "discount_low_high" },
    { label: "Discount: High to Low", value: "discount_high_low" }
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [categoryData, hierarchyRes] = await Promise.all([
          getAllCategories(),
          getMainCategories(),
        ]);

        console.log("Hierarchy API Response:", hierarchyRes);
        const hierarchy = hierarchyRes?.categories || hierarchyRes?.main_categories || (Array.isArray(hierarchyRes) ? hierarchyRes : []);
        console.log("Extracted Hierarchy Array:", hierarchy);

        // 1. Process Hierarchy (Main Categories)
        let rawHierarchyArray = [];
        if (Array.isArray(hierarchyRes)) {
          rawHierarchyArray = hierarchyRes;
        } else if (hierarchyRes) {
          rawHierarchyArray = hierarchyRes.main_categories || hierarchyRes.categories || hierarchyRes.data || [];
        }

        console.log("Extracted Hierarchy Array:", rawHierarchyArray);

        const formattedHierarchy = rawHierarchyArray.map((cat) => {
          const rawSubCats = cat.sub_categories || cat.subcategories || cat.children || cat.items || [];
          const subCatsArray = Array.isArray(rawSubCats) ? rawSubCats : [];
          return {
            title: cat.name || cat.category_name || cat.title,
            category_name: cat.category_name || cat.name || cat.title,
            display_name: cat.name || cat.title || cat.category_name,
            id: cat.id || cat.main_category_id,
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

        const sortedHierarchy = formattedHierarchy.sort((a, b) => {
          const indexA = priorityOrder.indexOf(a.title);
          const indexB = priorityOrder.indexOf(b.title);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;

          return a.title.localeCompare(b.title);
        });

        setDynamicCategoryData(sortedHierarchy);

        // 2. Process Sub-categories (for the layout/sidebar)
        const sortedCategories = (categoryData || []).sort((a, b) => {
          if (a.show_on_home > 0 && b.show_on_home > 0) return a.show_on_home - b.show_on_home;
          return a.show_on_home > 0 ? -1 : b.show_on_home > 0 ? 1 : 0;
        });
        setCategories(sortedCategories);

        // 3. Find Match from URL
        let matchedCategory = null;
        if (mainCategory) {
          // A) Try to find in Main Categories hierarchy first (since its the mainCategory slug)
          matchedCategory = formattedHierarchy.find(
            (cat) => nameToSlug(cat.display_name) === mainCategory || nameToSlug(cat.category_name) === mainCategory
          );

          // B) Fallback to Sub-categories
          if (!matchedCategory) {
            matchedCategory = sortedCategories.find(
              (cat) => nameToSlug(cat.display_name) === mainCategory || nameToSlug(cat.category_name) === mainCategory
            );
          }

          // C) Ultimate fallback: reconstruct from slug
          if (!matchedCategory) {
            matchedCategory = {
              category_name: slugToName(mainCategory),
              display_name: slugToName(mainCategory),
              id: "custom_fallback",
            };
          }
        }

        if (!matchedCategory) {
          matchedCategory = sortedCategories.find((cat) => cat.display_name === "Tablet") || sortedCategories[0];
        }

        setSelectedCategory(matchedCategory);

        // 4. Syne Canonical Sub-category (Fix case-mismatch / typo)
        if (subCategory && matchedCategory) {
          const canonicalSub = matchedCategory.items?.find(
            item => nameToSlug(typeof item === 'object' ? item.name : item) === subCategory
          );
          if (canonicalSub) {
            const name = typeof canonicalSub === 'object' ? canonicalSub.name : canonicalSub;
            setAdvancedFilters(prev => ({ ...prev, subCategories: [name] }));
          } else {
            setAdvancedFilters(prev => ({ ...prev, subCategories: [slugToName(subCategory)] }));
          }
        } else if (!subCategory) {
          setAdvancedFilters(prev => ({ ...prev, subCategories: [] }));
        }

        setMainCategoriesLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setMainCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [mainCategory, subCategory]);

  // ── REMOVED REDUNDANT SYNC ──

  const scrollTabs = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 180 * 3;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // ── NEW: navigate using slug-based URLs ──────────────────────────────────
  const handleFilterSelect = (itemName) => {
    if (!itemName) {
      navigate("/categories/tablet");
      return;
    }

    const isMainCat = dynamicCategoryData.some(cat =>
      cat.title?.toLowerCase() === itemName.toLowerCase()
    );

    if (isMainCat) {
      navigate(`/categories/${nameToSlug(itemName)}`);
    } else {
      const parentCat = dynamicCategoryData.find(cat =>
        cat.items.some(sub => sub.toLowerCase() === itemName.toLowerCase())
      );

      if (parentCat) {
        navigate(`/categories/${nameToSlug(parentCat.title)}/${nameToSlug(itemName)}`);
      } else {
        navigate(`/categories/${nameToSlug(itemName)}`);
      }
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const sortSuggestions = (suggestions) => {
    const saltMap = new Map();

    for (const item of suggestions) {
      const salt = item.salt_name;
      if (!saltMap.has(salt)) {
        saltMap.set(salt, []);
      }
      saltMap.get(salt).push(item);
    }

    const sortedSalts = Array.from(saltMap.entries()).sort((a, b) => {
      const aHasProduct = a[1].some((p) => p.product_available === 1);
      const bHasProduct = b[1].some((p) => p.product_available === 1);

      if (aHasProduct && !bHasProduct) return -1;
      if (!aHasProduct && bHasProduct) return 1;
      return a[0].localeCompare(b[0]);
    });

    return sortedSalts.map(([salt, products]) => ({
      salt,
      products,
    }));
  };

  useEffect(() => {
    const handleAlternate = async (salt_name, category) => {
      try {
        searchProducts("", 1, {
          query: "salt_name = '" + salt_name + "' AND categories = '" + category + "' AND rc=1",
        }).then((results) => {
          if (results.results.length > 0) {
            setAlternate((prev) => ({
              ...prev,
              [salt_name]: results.results,
            }));
          } else {
            setFilteredSuggestions((prev) =>
              prev.filter((item) => item.salt_name !== salt_name)
            );
            setAlternate((prev) => ({
              ...prev,
              [salt_name]: null,
            }));
          }
        });
      } catch (error) {
        setError("Failed to fetch products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    for (const item of (filteredSuggestions || [])) {
      const salt = item.salt_name;
      const category = item.selected_category;
      if (!alternate[salt]) {
        handleAlternate(salt, category);
      }
    }
  }, [filteredSuggestions]);

  // Click outside to close sort dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortRef]);

  // Prevent background scroll when loading
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [loading]);

  const dosageOptions = useMemo(() => {
    if (!filteredSuggestions) return [];
    const types = filteredSuggestions
      .map(p => p.consume_type?.toUpperCase())
      .filter(t => t && t.trim() !== "");
    return [...new Set(types)];
  }, [filteredSuggestions]);

  useEffect(() => {
    const fetchProducts = async () => {
      console.log("Checking if we should hit the API:", selectedCategory, advancedFilters);
      if (selectedCategory) {
        setLoading(true);
        setError("");

        try {
          // Use Main Category name as base
          const mainCatName = selectedCategory.category_name || selectedCategory.title || "";
          // Use exact Canonical Sub-category names from our state
          const selectedSubs = advancedFilters.subCategories || [];

          console.log("Hitting API with:", { mainCatName, selectedSubs });

          const results = await getProductsByCategory({
            categoryName: mainCatName,
            page: currentPage,
            sortBy: sortBy,
            perPage: 8,
            composition: advancedFilters.saltComposition,
            subCategories: selectedSubs,
            consumeType: advancedFilters.dosageForm.length > 0
              ? advancedFilters.dosageForm[0]
              : null
          });

          console.log("API Result:", results);
          if (isMobile && currentPage > 1) {
            setFilteredSuggestions(prev => [...prev, ...results.results]);
          } else {
            setFilteredSuggestions(results.results);
          }
          setTotalPages(results.total_pages);
          setTotalResults(results.total_results || 0);
        } catch (error) {
          console.error("API Call Failed:", error);
          setError("Failed to fetch products. Please try again.");
        } finally {
          setLoading(false);
        }
      } else {
        console.log("selectedCategory is null - API NOT hit.");
      }
    };

    fetchProducts();
  }, [selectedCategory, currentPage, sortBy, advancedFilters]);

  // ── NEW: handleFilterChange updates the URL with slug paths ─────────────
  const handleFilterChange = (newFilters) => {
    setAdvancedFilters(newFilters);
    setCurrentPage(1);

    if (newFilters.subCategories.length > 0) {
      const subSlug = nameToSlug(newFilters.subCategories[0]);
      const mainSlug = nameToSlug(categoryFromUrl);
      navigate(`/categories/${mainSlug}/${subSlug}`, { replace: true });
    } else {
      navigate(`/categories/${nameToSlug(categoryFromUrl)}`, { replace: true });
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || "Popularity";

  const getActiveFilterCount = () => {
    let count = 0;
    if (Array.isArray(advancedFilters.subCategories)) {
      count += advancedFilters.subCategories.filter(Boolean).length;
    }
    if (Array.isArray(advancedFilters.dosageForm)) {
      count += advancedFilters.dosageForm.filter(Boolean).length;
    }
    if (advancedFilters.saltComposition) {
      count += 1;
    }
    return count;
  };

  const updateQuantity = async (product, newQuantity) => {
    const userData = getUser();
    if (!userData.isLoggedIn) {
      navigate("/login");
      return;
    }

    const currentItem = cartItems.find(item => item.id == product.product_id);
    const currentQty = currentItem ? currentItem.quantity : 0;
    const change = newQuantity - currentQty;

    if (change === 0) return;

    try {
      Swal.showLoading();
      await addToCart(product.product_id, null, change, navigate);
      Swal.close();
    } catch (error) {
      console.error("Error updating cart:", error);
      Swal.close();
      Swal.fire({
        title: "Error",
        text: "There was an error updating your cart.",
        icon: "error",
        confirmButtonColor: "#8B5CF6",
      });
    }
  };

  const handleCart = async (product) => {
    const userData = getUser();
    if (!userData.isLoggedIn) {
      navigate("/login");
      return;
    }

    if (product.rc === 0) {
      try {
        Swal.showLoading();
        const response = await requestProduct(product.product_id, userData.customer_id, null, "Insert", "PENDING");
        if (response) {
          Swal.fire({
            icon: "success",
            title: "Request Sent",
            text: "Your request has been sent successfully. We will notify you once the product is available.",
            confirmButtonText: "OK",
            confirmButtonColor: "#8B5CF6",
          });
        } else {
          Swal.fire("Error", "Failed to send product request.", "error");
        }
      } catch (error) {
        console.error("Error sending request:", error);
        Swal.fire("Error", "Something went wrong while sending request.", "error");
      }
      return;
    }

    try {
      await addToCart(product.product_id, null, 1, navigate);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      Swal.fire({
        title: "Error",
        text: "There was an error adding the product to your cart.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#8B5CF6",
      });
    }
  };

  return (
    <>
      <div className="category-container" onScroll={(e) => {
        if (e.target.scrollTop > 300) {
          setShowGoToTop(true);
        } else {
          setShowGoToTop(false);
        }
      }}>
        <Header title={selectedCategory?.display_name || categoryFromUrl || "All Categories"} />

        {isMobile ? (
          <div className="mobile-premium-layout">
            {/* Purple Banner */}
            <div className="mobile-top-banner">
              <div className="banner-item">
                <img src="/SAMESALT.svg" alt="" /> SAME SALT
              </div>
              <div className="banner-item">
                <img src="/SAMECOMPOSITION.svg" alt="" /> SAME COMPOSITION
              </div>
              <div className="banner-item">
                <img src="/SAMEQUALITY.svg" alt="" /> SAME QUALITY
              </div>
            </div>

            {/* Category Chips */}
            <div className="mobile-category-chips">
              {dynamicCategoryData.map((cat, idx) => (
                <button
                  key={idx}
                  className={`chip ${categoryFromUrl === cat.title ? 'active' : ''}`}
                  onClick={() => handleFilterSelect(cat.title)}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="mobile-controls-row">
              <button className="mobile-filter-btn" onClick={() => setShowMobileFilters(true)}>
                Filter
                {getActiveFilterCount() > 0 && (
                  <span className="filter-count-badge">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>

              <button className="mobile-sort-btn" onClick={() => setShowMobileSort(true)}>
                Sort By: <span>{currentSortLabel}</span> <FiChevronDown />
              </button>
            </div>

            <div className="mobile-results-info">
              Showing {totalResults} products
            </div>

            <div className="mobile-product-grid">
              {loading && currentPage === 1 ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))
              ) : (
                filteredSuggestions.map((product) => (
                  <MobileProductCard
                    key={product.product_id}
                    product={product}
                    onAddToCart={handleCart}
                    onUpdateQuantity={updateQuantity}
                    navigate={navigate}
                    cartItems={cartItems}
                  />
                ))
              )}
            </div>

            <div className="mobile-bottom-actions">
              <button
                className="mobile-load-more"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= totalPages || loading}
                style={{ opacity: loading || currentPage >= totalPages ? 0.5 : 1 }}
              >
                {loading ? "LOADING..." : (currentPage >= totalPages ? "NO MORE ITEMS" : <>LOAD MORE <FiChevronDown /></>)}
              </button>
              <div style={{ height: 'calc(140px + env(safe-area-inset-bottom))', width: '100%' }} />
            </div>

            {/* Modals */}
            {showMobileSort && (
              <div className="mobile-modal-overlay" onClick={() => setShowMobileSort(false)}>
                <div className="mobile-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <span className="modal-title">Sort By</span>
                    <button className="close-modal-btn" onClick={() => setShowMobileSort(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="sort-list">
                      {sortOptions.map(option => (
                        <div
                          key={option.value}
                          className={`sort-item ${sortBy === option.value ? 'active' : ''}`}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowMobileSort(false);
                            setCurrentPage(1);
                          }}
                        >
                          {option.label}
                          {sortBy === option.value && (
                            <div className="check-icon-circle"><FiCheck /></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showMobileFilters && (
              <div className="mobile-modal-overlay" onClick={() => setShowMobileFilters(false)}>
                <div className="mobile-side-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <span className="modal-title">Filters</span>
                    <button className="close-modal-btn" onClick={() => setShowMobileFilters(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <CategoryPageFilter
                      onSelectCategory={handleFilterSelect}
                      onFilterChange={handleFilterChange}
                      dynamicData={dynamicCategoryData}
                      loading={mainCategoriesLoading}
                      initialFilters={{
                        ...advancedFilters,
                        dosageOptions,
                        mainCategory: selectedCategory?.display_name || categoryFromUrl  // ← pass display name, not slug
                      }}
                      hideHeader={true}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn-secondary-outline"
                      onClick={() => {
                        handleFilterChange({
                          subCategories: [],
                          dosageForm: [],
                          saltComposition: ""
                        });
                        setShowMobileFilters(false);
                      }}
                    >
                      CLEAR ALL
                    </button>
                    <button
                      className="btn-primary-purple"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      APPLY FILTERS
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="category-layout">
            {/* Desktop Sidebar */}
            <div className="category-sidebar">
              <div className="desktop-only">
                <CategoryPageFilter
                  onSelectCategory={handleFilterSelect}
                  onFilterChange={handleFilterChange}
                  dynamicData={dynamicCategoryData}
                  loading={mainCategoriesLoading}
                  initialFilters={{
                    ...advancedFilters,
                    dosageOptions,
                    mainCategory // pass slug
                  }}
                />
              </div>
              <div className="mobile-only mobile-filter-placeholder">
                <div className="premium-coming-soon-filter">
                  <div className="filter-coming-soon-content">
                    <div className="filter-icon-container">
                      <div className="filter-glow-effect"></div>
                      <img src="/filter-icon-premium.png" alt="Coming Soon" className="filter-floating-icon" onError={(e) => { e.target.onerror = null; e.target.src = "/migfulllogo.svg" }} />
                    </div>
                    <h2 className="filter-coming-soon-title">Filters Refresh!</h2>
                    <p className="filter-coming-soon-subtitle">We're building an advanced filter experience just for you.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="category-main-content desktop-only">
              {/* Top Banner */}
              <div className="category-banner">
                <div className="banner-content">
                  <div className="banner-item">
                    <img src="/SAMESALT.svg" alt="" className="banner-svg-icon" /> SAME SALT
                  </div>
                  <div className="banner-dot"></div>
                  <div className="banner-item">
                    <img src="/SAMECOMPOSITION.svg" alt="" className="banner-svg-icon" /> SAME COMPOSITION
                  </div>
                  <div className="banner-dot"></div>
                  <div className="banner-item">
                    <img src="/SAMEQUALITY.svg" alt="" className="banner-svg-icon" /> SAME QUALITY
                  </div>
                </div>
              </div>

              {/* Controls Area */}
              <div className="category-controls">
                <div className="results-count">
                  Showing {(currentPage - 1) * 8 + 1}-{Math.min(currentPage * 8, totalResults)} of {totalResults} products
                </div>
                <div className="sort-container">
                  <span className="sort-label">SORT BY:</span>
                  <div className="sort-select-wrapper" ref={sortRef}>
                    <button className="sort-select-btn" onClick={() => setShowSortDropdown(!showSortDropdown)}>
                      {currentSortLabel} <FiChevronDown />
                    </button>
                    {showSortDropdown && (
                      <div className="sort-dropdown">
                        {sortOptions.map(option => (
                          <div
                            key={option.value}
                            className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                              setCurrentPage(1);
                            }}
                          >
                            {option.label}
                            {sortBy === option.value && <FiCheck />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="tab-content">
                {(!filteredSuggestions || filteredSuggestions.length === 0) && !loading ? (
                  <div className="no-products-msg">
                    <img src="/image-22.png" alt="No product" />
                    <p>No products found for this category.</p>
                  </div>
                ) : (
                  <div className="product-grid">
                    {loading && currentPage === 1 ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <ProductSkeleton key={index} />
                      ))
                    ) : (
                      (filteredSuggestions || []).map((product) => {
                        const cartItem = cartItems.find(item =>
                          String(item.product_id || item.id) === String(product.product_id)
                        );
                        const quantity = cartItem ? cartItem.quantity : 0;
                        return (
                          <div
                            key={product.product_id}
                            className="product-card-new"
                            onClick={() => navigate(`/product/${product.product_name_url}`)}
                          >
                            {/* Savings Badge */}
                            {(() => {
                              const oldPrice = parseFloat(product.product_pricing_old) || 0;
                              const newPrice = parseFloat(product.product_pricing_new || product.product_pricing_old) || 0;
                              if (oldPrice > newPrice && newPrice > 0) {
                                const savingsPct = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
                                return (
                                  <div className="card-badge save-badge">
                                    {savingsPct}% SAVINGS
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Image Area */}
                            <div className="card-img-bg">
                              <img
                                src={`https://d1dh0rr5xj2p49.cloudfront.net/products/${product.first_image_url}`}
                                alt={product.product_name}
                                onError={(e) => { e.target.onerror = null; e.target.src = "/medicine-details.png" }}
                              />
                            </div>

                            {/* Content */}
                            <div className="card-info">
                              <div className="card-content-top">
                                <div className="card-title" title={product.product_name}>{product.product_name}</div>
                                <div className="card-composition" title={product.composition || product.salt_name}>
                                  {product.composition || product.salt_name}
                                </div>
                                <div className="card-meta">
                                  {product.pack_size}
                                </div>
                              </div>

                              <div className="card-content-bottom">
                                <div className="price-container">
                                  <div className="card-price-grid">
                                    <div className="price-col">
                                      <span className="price-label">Selling price</span>
                                      <span className="price-val-new">₹{parseInt(product.product_pricing_new || product.product_pricing_old)}</span>
                                    </div>
                                    <div className="price-col text-right">
                                      <span className="price-label">MRP</span>
                                      <span className="price-val-old">₹{parseInt(product.product_pricing_old)}</span>
                                    </div>
                                  </div>

                                  {quantity > 0 ? (
                                    <div className="qty-stepper" onClick={(e) => e.stopPropagation()}>
                                      <button className="stepper-btn-delete" onClick={() => updateQuantity(product, quantity - 1)}>
                                        {quantity === 1 ? <FiTrash2 /> : <FiMinus />}
                                      </button>
                                      <span className="stepper-qty">{quantity}</span>
                                      <button className="stepper-btn-add" onClick={() => updateQuantity(product, quantity + 1)}>
                                        <FiPlus />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      className={product.rc === 0 ? "btn-view-request" : "btn-purple-cart"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (product.rc === 0) {
                                          navigate(`/product/${product.product_name_url}`);
                                        } else {
                                          handleCart(product);
                                        }
                                      }}
                                    >
                                      {product.rc === 0 ? null : <img src="/cart-white.svg" alt="" />}
                                      {product.rc === 0 ? "View" : "Add to Cart"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!isMobile && (
                <div className="pagination-container" style={{ marginTop: '40px' }}>
                  <div className="pagination-wrapper" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff' }}
                    >
                      &lt;
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => (
                      <button
                        key={i + 1}
                        className={`pagination-number ${currentPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setCurrentPage(i + 1)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          background: currentPage === i + 1 ? '#8B5CF6' : '#fff',
                          color: currentPage === i + 1 ? '#fff' : '#333',
                          fontWeight: '700'
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {totalPages > 5 && <span style={{ padding: '8px' }}>...</span>}
                    {totalPages > 5 && (
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #e0e0e0', background: currentPage === totalPages ? '#8B5CF6' : '#fff', color: currentPage === totalPages ? '#fff' : '#333', fontWeight: '700' }}
                      >
                        {totalPages}
                      </button>
                    )}

                    <button
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff' }}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Navigation />
        <div className="landing-page">
          </div>
        {/* Go to Top Button */}
        <button
          className={`go-to-top-btn ${showGoToTop ? 'show' : ''}`}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            const scrollContainer = document.querySelector('.category-container');
            if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Go to top"
        >
          <FiArrowUp />
        </button>
      </div>
    </>
  );
};