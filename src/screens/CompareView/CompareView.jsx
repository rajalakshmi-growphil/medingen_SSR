import React, { useState, useEffect } from "react";
import "./style.css";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  search_altProducts,
  getUser,
  addToCart,
  requestProduct,
  getAveragePrice,
} from "../../api/Api"; // Assuming you have an API function for fetching products
import { useCart, useCompare } from "../../api/stateContext";
import Swal from "sweetalert2";


export const CompareView = ({ embedded = false, state }) => {
  const location = useLocation();
  const product = state ? state : location.state;
  const [currentMedicineInfo, setCurrentMedicineInfo] = useState({});
  const [compareToAlternateInfo, setCompareToAlternateInfo] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { dispatch, refreshCartCount } = useCart();
  const { compareProducts } = useCompare(); // Get compare products from context
  const { dispatchCompare } = useCompare(); // Get compare products from context

  const handleBack = () => {
    navigate(-1);
  };

  const handleRequest = async (selectedProduct) => {
    const user = getUser();
    const isLoggedIn = user.isLoggedIn;
    if (isLoggedIn) {
      try {
        await requestProduct(selectedProduct.product_id, navigate);
        Swal.fire({
          title: "Request Sent",
          text: "Your request has been sent successfully. We will notify you once the product is available.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error requesting product:", error);
      }
    } else {
      navigate("/login");
    }
  };

  const handleCart = async (selectedProduct) => {
    // check user login
    const user = getUser();
    const isLoggedIn = user.isLoggedIn;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!user.name) {
      navigate("/create-profile");
      return;
    }

    // Prompt the user to enter the quantity
    const { value: quantity } = await Swal.fire({
      title: "Enter Quantity",
      input: "number",
      inputAttributes: {
        min: 1,
        step: 1,
      },
      inputValue: 1, // Default value
      showCancelButton: true,
      confirmButtonText: "Add to Cart",
      cancelButtonText: "Cancel",
      icon: "question",
    });

    // Check if the user entered a valid quantity and did not cancel
    if (quantity && quantity > 0) {
      try {
        Swal.showLoading(); // Show loading spinner
        // Call the addToCart API with the entered quantity
        const result = await addToCart(
          selectedProduct.product_id,
          quantity,
          navigate
        );
        
        // Refresh the global cart state
        await refreshCartCount();

        // Show success alert after the API call
        Swal.fire({
          title: "Product Added",
          text: "Product has been added to your cart.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error adding product to cart:", error);
        // Handle any errors during the API call
        Swal.fire({
          title: "Error",
          text: "There was an error adding the product to your cart.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } else {
      // Show a warning if the input was canceled or invalid
      Swal.fire({
        title: "Invalid Quantity",
        text: "Please enter a valid quantity.",
        icon: "warning",
        confirmButtonText: "OK",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      console.log("innnnnn ", product);
      if (product.averagePrice === undefined) {
        const response = await getAveragePrice(product.composition).then(
          (response) => {
            setCurrentMedicineInfo({
              ...product,
              averagePrice:
                Math.round(parseFloat(response.averagePrice) * 100) / 100,
            });
            return response;
          }
        );
      } else {
        setCurrentMedicineInfo(product);
      }

      console.log("contextVars", product, currentMedicineInfo);
      const tcompareProductsAlternate = compareProducts.map((p) => {
        return {
          product: p,
          compare: true,
          composition: p.composition,
          first_image_url: p.imageSrc.replace(
            "https://d1dh0rr5xj2p49.cloudfront.net/products/",
            ""
          ),
          product_id: p.product_id,
          product_name: p.name,
          product_pricing_new: p.averagePrice,
          product_pricing_old: p.mrp,
          salt_name: p.genericName,
          manufacturer: p.manufacturer || "Unknown Manufacturer",
          discountPercent: Math.round(
            (100 *
              (parseFloat(p.averagePrice) - parseFloat(product.averagePrice))) /
              parseFloat(p.averagePrice),
            2
          ),
          product_available: p.product_available,
        };
      });

      setCompareToAlternateInfo(tcompareProductsAlternate);
    };
    init();
  }, [location.state]);

// ================= FETCH FUNCTION =================
const fetchAlternateProducts = async (page = 1) => {
  // 🚨 Prevent API call if composition not ready
  if (!currentMedicineInfo?.composition) return;

  Swal.showLoading();

  try {
    const result = await search_altProducts(page, {
      composition: currentMedicineInfo.composition,
      exclude_product_id: currentMedicineInfo.product_id,
      rc: 1,
      show_hidden: false,
    });

    if (!result?.results) return;

    const filteredResults = result.results
      // Remove current product (extra safety)
      .filter(
        (p) => p.product_id !== currentMedicineInfo.product_id
      )
      // Remove already compared products
      .filter(
        (p) =>
          !compareProducts.some(
            (c) => c.product_id === p.product_id
          )
      );

    const mappedResults = filteredResults.map((alternate) => {
      const currentPrice = parseFloat(
        currentMedicineInfo.averagePrice || currentMedicineInfo.ourPrice || 0
      );
      const altPrice = parseFloat(
        alternate.product_pricing_new || 0
      );

      const discountPercent =
        currentPrice > 0
          ? Math.round(((currentPrice - altPrice) / currentPrice) * 100)
          : 0;

      // Extract image URL from JSON string
      let first_image_url = "";
      try {
        if (alternate.images) {
          const parsedImages = JSON.parse(alternate.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            first_image_url = parsedImages[0].img;
          }
        }
      } catch (err) {
        console.error("Error parsing alternate images:", err);
      }

      return {
        ...alternate,
        first_image_url,
        manufacturer:
          alternate.manufacturer || "Unknown Manufacturer",
        discountPercent,
      };
    });

    setCompareToAlternateInfo((prev) =>
      page === 1 ? mappedResults : [...prev, ...mappedResults]
    );

    setTotalPages(result.total_pages || 1);
  } catch (error) {
    console.error("Failed to fetch alternate products", error);
  } finally {
    Swal.close();
  }
};

// Reset list when composition changes
useEffect(() => {
  if (currentMedicineInfo?.composition) {
    setCompareToAlternateInfo([]);
    setCurrentPage(1);
  }
}, [currentMedicineInfo.composition]);


// Fetch data when page or composition changes
useEffect(() => {
  if (currentMedicineInfo?.composition) {
    console.log("calling fetchAlternateProducts", currentPage);
    fetchAlternateProducts(currentPage);
  }
}, [currentPage, currentMedicineInfo.composition]);

  const removeFromCompare = (alternate, index) => {
    dispatchCompare({
      type: "REMOVE_FROM_COMPARE",
      payload: alternate, // Remove the product from the comparison list
    });
    // remove index from compareToAlternateInfo array
    const newCompareToAlternateInfo = [...compareToAlternateInfo];
    newCompareToAlternateInfo.splice(index, 1);
    setCompareToAlternateInfo(newCompareToAlternateInfo);
  };

  const handleAddMedicine = () => {
    navigate("/searchbox");
  };

  const handleViewMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <>
    
      <div className={`compare-view${embedded ? " compare-view-embedded" : ""}`}>
        {!embedded && <Header />}
        {!embedded && (
          <div className="screen-view-item">
            <p className="p">
              Compare prices of medicines with identical compositions to make an
              informed decision.
            </p>
          </div>
        )}

        <div className="overlap">
          <div className="frame">
            <div className="comp-item">
              <div className="frame-2">
                <div className="frame-3">
                  <Link to={`/product/${currentMedicineInfo.product_name_url}`}>
                    <img
                      className="rectangle"
                      alt={currentMedicineInfo.name}
                      src={`${currentMedicineInfo.imageSrc}`}
                    />
                  </Link>
                  <div className="frame-wrapper-comp">
                    <div className="div-wrapper">
                      <div className="frame-4">
                        <div className="frame-5">
                          <div className="text-wrapper">
                            Rs. {currentMedicineInfo.ourPrice}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="frame-6">
                  <div className="text-wrapper-3">
                    {currentMedicineInfo.name}
                  </div>
                  {/* <div className="text-wrapper-4">
                    By {currentMedicineInfo.manufacturer}
                  </div> */}
                </div>
                <div className="frame-7">
                  <div className="frame-8">
                    <div className="text-wrapper-5">Generic Name:</div>
                    <div className="text-wrapper-6">
                      {currentMedicineInfo.genericName}
                    </div>
                  </div>
                  <div className="frame-8">
                    <div className="text-wrapper-5">Composition:</div>
                    <div className="text-wrapper-6">
                      {currentMedicineInfo.composition}
                    </div>
                  </div>
                  <div className="frame-9">
                    <div className="text-wrapper-5">MRP:</div>
                    <div className="text-wrapper-7">
                      Rs {currentMedicineInfo.mrp}
                    </div>
                  </div>
                </div>

                <div className="price-web-view">
                  <div className="text-wrapper-2">Our Price</div>
                  <div className="text-wrapper">
                    Rs. {currentMedicineInfo.ourPrice}
                  </div>
                </div>
              </div>
            </div>

            {compareToAlternateInfo.map((alternate, index) => {
              return (
                <React.Fragment key={index}>
                  {
                    <div className="comp-item">
                      <div className="frame-2">
                        <div className="frame-3">
                          <Link to={`/product/${alternate.product_name_url}`}>
                            <img
                              className="rectangle"
                              alt={alternate.name}
                              src={`https://d1dh0rr5xj2p49.cloudfront.net/products/${alternate.first_image_url}`}
                            />
                          </Link>
                          <div className="frame-wrapper-comp">
                            <div className="div-wrapper">
                              <div className="frame-4">
                                <div className="frame-5">
                                  <div className="text-wrapper">
                                    Rs. {alternate.product_pricing_new}
                                  </div>
                                </div>
                                <div className="frame-5">
                                  <div className="text-wrapper-2">
                                    {alternate.discountPercent} %
                                    {alternate.discountPercent < 0 ? "↑" : "↓"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="frame-6">
                          <Link to={`/product/${alternate.product_name_url}`}>
                            <div className="text-wrapper-3">
                              {alternate.product_name}
                            </div>
                            {/* <div className="text-wrapper-4">
                          By {alternate.manufacturer}
                        </div> */}
                          </Link>
                        </div>
                        <div className="frame-7">
                          <div className="frame-8">
                            <div className="text-wrapper-5">Generic Name:</div>
                            <div className="text-wrapper-6">
                              {alternate.salt_name}
                            </div>
                          </div>
                          <div className="frame-8">
                            <div className="text-wrapper-5">Composition:</div>
                            <div className="text-wrapper-6">
                              {alternate.composition}
                            </div>
                          </div>
                        </div>
                        <div className="price-web-view">
                          <div className="text-wrapper-2">
                            Our Price: &nbsp;&nbsp;
                            <>
                              {alternate.discountPercent} %
                              {alternate.discountPercent < 0 ? "↑" : "↓"}
                            </>
                          </div>
                          <div className="text-wrapper">
                            Rs. {alternate.product_pricing_new}
                          </div>
                        </div>
                        {alternate.product_available > 0 && (
                          <div
                            className="frame-10"
                            onClick={() => {
                              handleCart(alternate);
                            }}
                          >
                            <div className="text-wrapper-8">+ Add to cart</div>
                          </div>
                        )}
                        {alternate.product_available == 0 &&
                          alternate.product_request && (
                            <div
                              className="frame-10"
                              onClick={() => {
                                handleRequest(alternate);
                              }}
                            >
                              <div className="text-wrapper-8">
                                Request Product
                              </div>
                            </div>
                          )}
                        {alternate.compare && (
                          <div
                            className="frame-10"
                            onClick={() => {
                              removeFromCompare(alternate.product, index);
                            }}
                          >
                            <div className="text-wrapper-8">
                              + Remove from compare
                            </div>
                          </div>
                        )}
                      </div>
                      {/* {index % 2 === 0 &&
                        index < compareToAlternateInfo.length - 1 && (
                          <img
                            className="vector"
                            alt="Vector"
                            src="/vector-217.svg"
                            fetchpriority="high"
                          />
                        )} */}
                    </div>
                  }
                </React.Fragment>
              );
            })}
            {/* <div className="comp-item">
              <div className="frame-11" onClick={handleAddMedicine}>
                <img className="group" alt="Group" src="/group-3016903.png" />
                <div className="text-wrapper-9">Add medicine</div>
              </div>
            </div> */}
          </div>
          {currentPage < totalPages && (
            <div className="view-more-wrapper">
              <button className="view-more-button" onClick={handleViewMore}>
                View More
              </button>
            </div>
          )}
          {!embedded && (
            <div className="compare-box">
              <div className="price-info">
                {currentMedicineInfo.averagePrice >
                  currentMedicineInfo.ourPrice && (
                  <div className="price-info-text">
                    <div>Average price</div>
                    <div className="orange">
                      {" "}
                      Rs. {currentMedicineInfo.averagePrice}
                    </div>
                  </div>
                )}
                {currentMedicineInfo.product_available > 0 && (
                  <div className="price-info-text">
                    <div>Our price </div>
                    <div
                      className="red"
                      style={{
                        width:
                          60 /
                            (currentMedicineInfo.averagePrice /
                              currentMedicineInfo.ourPrice) +
                          "%",
                      }}
                    >
                      Rs. {currentMedicineInfo.ourPrice}
                    </div>
                  </div>
                )}
              </div>
              <div className="button-container">
                {currentMedicineInfo.product_available > 0 && (
                  <div
                    className="frame-10"
                    onClick={() => {
                      handleCart(currentMedicineInfo);
                    }}
                  >
                    <div className="text-wrapper-8">+ Add to cart</div>
                  </div>
                )}
                <div className="frame-10" onClick={handleBack}>
                  <div className="text-wrapper-8">Back</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="margin-72"></div>

        {!embedded && (
          <div className="landing-page">
            </div>
        )}
      </div>
      {!embedded && <Navigation />}
    </>
  );
};