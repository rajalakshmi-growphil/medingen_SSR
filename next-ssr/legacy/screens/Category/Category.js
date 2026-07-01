import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css";

import Navigation from "../Dashboard/Navigation";
import { getAllCategories, searchProducts, getMainCategories, getProductsByCategory } from "../../api/Api";

import { CategoryFilter } from "./CategoryFilter";
import Header from "../Dashboard/Header";

// ─── URL helpers ─────────────────────────────────────────────────────────────
const slugToName = (slug) =>
  slug
    ? slug.replace(/-\d+$/, "").split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : null;

const nameToSlug = (name, id = null) => {
  const base = name
    ? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    : "";
  return id ? `${base}-${id}` : base;
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
      return `/cloudfront-cdn/categories/${match.category_image_url}`;
    }
    return "/medicine-details.png";
  };

  const displayedSubCategories = activeMainCat?.items || [];

  return (
    <div className="responsive-layout-container">
    </div>
  );
};

export const Category = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── NEW: read slug params ────────────────────────────────────────────────
  const { mainCategory, subCategory } = useParams();
  const categoryFromUrl = slugToName(mainCategory);
  const subCategoryFromUrl = slugToName(subCategory);
  // ─────────────────────────────────────────────────────────────────────────

  const scrollRef = useRef(null);
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

  useEffect(() => {
    const fetchCategories = async () => {
      Swal.fire({
        title: "Loading...",
        text: "Fetching categories, please wait",
        allowOutsideClick: false,
        didOpen: () => {},
      });

      try {
        const categoryData = await getAllCategories();

        const sortedCategories = categoryData.sort((a, b) => {
          if (a.show_on_home > 0 && b.show_on_home > 0) {
            return a.show_on_home - b.show_on_home;
          } else if (a.show_on_home > 0) {
            return -1;
          } else if (b.show_on_home > 0) {
            return 1;
          } else {
            return 0;
          }
        });

        setCategories(sortedCategories);

let matchedCategory = null;
if (mainCategory) {
  matchedCategory = sortedCategories.find(
    (cat) => nameToSlug(cat.display_name) === mainCategory
  );

  if (!matchedCategory) {
    matchedCategory = sortedCategories.find(
      (cat) => nameToSlug(cat.category_name) === mainCategory
    );
  }

  if (!matchedCategory) {
    matchedCategory = {
      category_name: slugToName(mainCategory),
      display_name: slugToName(mainCategory),
      id: "custom_sub_cat"
    };
  }
}

        if (!matchedCategory) {
          matchedCategory = sortedCategories.find((cat) => cat.display_name === "Tablet") || sortedCategories[0];
        }

        setSelectedCategory(matchedCategory);
        Swal.close();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch categories",
        });
      }
    };

    fetchCategories();

    const fetchMainCategories = async () => {
      setMainCategoriesLoading(true);
      try {
        const hierarchy = await getMainCategories();
        if (hierarchy && hierarchy.length > 0) {
          const formattedData = hierarchy.map(cat => {
            const rawSubCats = cat.sub_categories || cat.subcategories || cat.children || cat.items || [];
            const subCatsArray = Array.isArray(rawSubCats) ? rawSubCats : [];

            return {
              title: cat.name || cat.category_name || cat.title,
              items: subCatsArray.map(s => {
                if (typeof s === 'string') return s;
                return s.name || s.category_name || s.title || "";
              }).filter(s => s !== "")
            };
          });
          setDynamicCategoryData(formattedData);
        }
      } catch (err) {
        console.error("Error fetching hierarchy:", err);
      } finally {
        setMainCategoriesLoading(false);
      }
    };

    fetchMainCategories();
  }, [categoryFromUrl]);

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
      setSelectedCategory(categories[0]);
      return;
    }

    const matchedCategory = categories.find(c => c.display_name.toLowerCase() === itemName.toLowerCase());

    if (matchedCategory) {
      navigate(`/categories/${nameToSlug(itemName)}`);
    } else {
      // Check if it's a sub-category
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
          console.log("Alternate Products", results, "salt_name", salt_name);
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

  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedCategory) {
        Swal.showLoading();
        setLoading(true);
        setError("");

        try {
          const results = await getProductsByCategory({
            categoryName: selectedCategory.category_name,
            page: currentPage
          });

          setFilteredSuggestions(results.results);
          setTotalPages(results.total_pages);
          Swal.close();
        } catch (error) {
          setError("Failed to fetch products. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProducts();
  }, [selectedCategory, currentPage]);

  const handleCart = (product_url) => {
    navigate("/product/" + product_url);
  };

  return (
    <>
      <div className="category-container">
        <Header title={selectedCategory?.display_name || categoryFromUrl || "All Categories"} />

        <div className="category-layout">
          <div className="category-sidebar">
            <div className="desktop-only">
              <CategoryFilter
                onSelectCategory={handleFilterSelect}
                dynamicData={dynamicCategoryData}
                loading={mainCategoriesLoading}
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
                  <div className="filter-coming-soon-features">
                    <span className="filter-feature-badge">✨ Smarter Search</span>
                    <span className="filter-feature-badge">⚡ Instant Results</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mobile-category-layout mobile-only">
            <ResponsiveCategoryView
              categories={dynamicCategoryData?.length > 0 ? dynamicCategoryData : (categories || [])}
              allCategories={categories || []}
              onSelectSubCategory={handleFilterSelect}
              filteredSuggestions={filteredSuggestions}
              onAddToCart={handleCart}
            />
          </div>

          <div className="category-main-content desktop-only">
            <div className="tab-divider" />
            <div className="tab-content">
              {(!filteredSuggestions || filteredSuggestions.length === 0) && !loading ? (
                <div className="no-products-msg">
                  <img src="/image-22.png" alt="No product" />
                  <p>No products found for this category.</p>
                </div>
              ) : (
                <div className="product-grid">
                  {(filteredSuggestions || []).map((product) => (
                    <div key={product.product_id} className="product-card-new">
                      <div className="card-img-bg">
                        <img
                          src={`/cloudfront-cdn/products/${product.first_image_url}`}
                          alt={product.product_name}
                        />
                      </div>

                      <div className="card-info">
                        <div className="card-title">{product.product_name}</div>
                        <div className="card-brand">
                          {product.manufacturer_name || product.selected_category || "Medingen"}
                        </div>

                        <div className="price-container">
                          <div className="card-price-row">
                            <span className="price-mrp-label">MRP</span>
                            <span className="price-mrp-val">₹{parseInt(product.product_pricing_old)}</span>
                            {product.product_pricing_new && product.product_pricing_new < product.product_pricing_old && (
                              <span className="price-discount">
                                {parseInt(((product.product_pricing_old - product.product_pricing_new) / product.product_pricing_old) * 100)}% Off
                              </span>
                            )}
                          </div>

                          <div className="price-bottom-row">
                            <span className="price-final">
                              ₹{parseInt(product.product_pricing_new || product.product_pricing_old)}
                            </span>
                            <button
                              className="btn-black-cart"
                              onClick={() => handleCart(product.product_name_url)}
                            >
                              <img src="/cart-white.svg" alt="" />
                              {product.rc === 0 ? "Request" : "Add"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pagination-container">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <Navigation />
        <div className="landing-page">
          </div>
      </div>
    </>
  );
};