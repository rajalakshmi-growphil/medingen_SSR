import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import { searchVector } from "../../api/Api";
import Navigation from "../Dashboard/Navigation";
import { Link, useLocation, useNavigate } from "react-router-dom";


export const SearchBox = () => {
  const [searchText, setSearchText] = useState("");
  const [filteredSalts, setFilteredSalts] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const searchInputRef = useRef(null); // Create a ref for the input element
  const location = useLocation();

  useEffect(() => {
    if (location.state?.voiceSearch) {
      setSearchText(location.state.voiceSearch);
    }
    searchInputRef.current?.focus();
  }, [location.state]);


  useEffect(() => {
    if (location.state?.category) {
      setSearchText(location.state.category + ":");
    }
    // Focus on the search text box when the component loads
    searchInputRef.current.focus();
  }, []);


  useEffect(() => {
    // Trigger API call if the searchText length is greater than 2
    const fetchProducts = async () => {
      if (searchText.length > 1) {
        setLoading(true);
        setError("");

        try {
          const results = await searchVector(searchText);
          if (Array.isArray(results)) {
            const seenSalts = new Set();
            const uniqueSalts = [];
            results.forEach((item) => {
              if (item.salt_name) {
                const cleanSalt = item.salt_name.trim();
                if (cleanSalt && !seenSalts.has(cleanSalt.toUpperCase())) {
                  seenSalts.add(cleanSalt.toUpperCase());
                  uniqueSalts.push({
                    salt_id: item.product_id,
                    composition: cleanSalt
                  });
                }
              }
            });
            setFilteredSalts(uniqueSalts.slice(0, 5));

            const validProducts = results.filter(p => p.product_pricing_new !== null);
            setFilteredSuggestions(validProducts.slice(0, 10));
            setTotalPages(1);
          } else {
            setFilteredSuggestions([]);
            setFilteredSalts([]);
            setTotalPages(1);
          }
        } catch (error) {
          setError("Failed to fetch products. Please try again.");
        } finally {
          setLoading(false);
        }
      } else {
        setFilteredSuggestions([]);
        setFilteredSalts([]);
      }
    };

    fetchProducts();
  }, [searchText]);

  const handleChange = (event) => {
    setSearchText(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    // Navigate directly to SearchViewMedicine
    navigate(`/product/${suggestion.product_name_url}`, { state: { product: suggestion }, replace: false });
  };

  const gotoSaltPage = (salt) => {
    // Handle the selection of a suggestion
    navigate("/salt/" + salt);
  }

  return (
    <div className="search-box">
      <div className="overlap">
        <div className="frame">
          <div className="overlap-group">
            <div className="group"></div>
            <div className="frame-2">
              <Link to="/">
                <img className="line-arrow-chevron" alt="Line arrow chevron" src="/line-arrow-chevron-left.svg" fetchpriority="high" />
              </Link>
              <div className="text-wrapper">Search</div>
            </div>
          </div>
        </div>
        <div className="div-wrapper">
          <div className="frame-wrapper">
            <div className="frame-3">
              <div className="frame-4">
                <div className="frame-5">
                  <input
                    type="text"
                    placeholder="Type a medicine name ..."
                    className="text-wrapper-2"
                    name="search_text"
                    value={searchText}
                    id="search_text"
                    onChange={handleChange}
                    ref={searchInputRef} // Attach the ref to the input element
                  />
                </div>
              </div>
            </div>
          </div>
          {/* <img className="img-2" alt="Fluent mic" src="/fluent-mic-20-regular.svg" fetchpriority="high" /> */}
        </div>
      </div>
      {(searchText.length > 1 ?
        (<>
          <div className="overlap-3" >
            <div className="frame-8">
              {loading ? (
                <div className="loader">Loading...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : (
                <>
                  {filteredSuggestions.length === 0 && searchText.length > 1 ? (
                    <div className="no-product-found-container">
                      <h3 className="no-product-text">
                        Your Product Not Found <span>Request Us</span>
                      </h3>
                      <div
                        onClick={() => {
                          const message = `Hello! I couldn’t find the product "${searchText}" on your website. Can you please help me?`;
                          const encodedMessage = encodeURIComponent(message);
                          window.open(`https://wa.me/+917090123709?text=${encodedMessage}`, "_blank");
                        }}
                        rel="noopener noreferrer"
                        className="whatsapp-request-btn"
                      >
                        <img
                          className="whatsapp-icon"
                          alt="WhatsApp"
                          src="/whatsapp.png"
                        />
                        <span>Request</span>
                      </div>
                    </div>
                  ) : null}


                  {filteredSuggestions.length > 0 && (
                    <div className="text-wrapper-5">Suggestions for "{searchText}"</div>
                  )}
                  {filteredSalts.length > 0 && (
                    filteredSalts.map((salt) => (
                      <div key={salt.salt_id} className="salt-suggestion" onClick={() => { gotoSaltPage(salt.composition) }} >
                        <div className="product-name">{salt.composition}</div>
                        <div className="product-salt">
                          in salt
                        </div>
                      </div>
                    ))
                  )}
                  {filteredSuggestions.map((suggestion) => (
                    <div key={suggestion.product_id} className="suggestion" onClick={() => { handleSelectSuggestion(suggestion) }} >
                      <div className="product-name">{suggestion.product_name}</div>
                      <div className="product-pricing">
                        <div className="price">₹ {suggestion.product_pricing_new}</div>
                        <div className="icon">
                          <img className="medicine-icon" alt="Line arrow chevron" src={suggestion.category_outline_url ? "https://d1dh0rr5xj2p49.cloudfront.net/categories/" + suggestion.category_outline_url : "/medicine-icon.svg"} fetchPriority="high" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button onClick={handlePreviousPage} disabled={currentPage === 1}>
                        Previous
                      </button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>)
        : null)
      }
      <Navigation />
    </div>
  );
};
