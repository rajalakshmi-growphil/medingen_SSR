import React, { useState, useEffect, useRef } from "react";
import "./InlineSearch.css";
import { searchVector } from "../../api/Api";
import { useNavigate } from "react-router-dom";

export const InlineSearch = ({ 
    placeholderText = "Search medicine, medical products", 
    className = "", 
    variant = "hero",
    searchText: externalSearchText,
    setSearchText: externalSetSearchText,
    showDropdown: externalShowDropdown,
    setShowDropdown: externalSetShowDropdown,
    scrollContainerRef
}) => {
    const [localSearchText, setLocalSearchText] = useState("");
    const searchText = externalSearchText !== undefined ? externalSearchText : localSearchText;
    const setSearchText = externalSetSearchText || setLocalSearchText;

    const [localShowDropdown, setLocalShowDropdown] = useState(false);
    const showDropdown = externalShowDropdown !== undefined ? externalShowDropdown : localShowDropdown;
    const setShowDropdown = externalSetShowDropdown || setLocalShowDropdown;

    const [filteredSalts, setFilteredSalts] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const navigate = useNavigate();
    const searchContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        const handleScroll = () => {
            if (showDropdown) {
                setShowDropdown(false);
            }
        };

        // Listen on the actual scroll container, not window
        const scrollEl = scrollContainerRef?.current || window;

        document.addEventListener("mousedown", handleClickOutside);
        scrollEl.addEventListener("scroll", handleScroll, { passive: true });
        // Also listen on window as fallback
        if (scrollEl !== window) {
            window.addEventListener("scroll", handleScroll, { passive: true });
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            scrollEl.removeEventListener("scroll", handleScroll);
            if (scrollEl !== window) {
                window.removeEventListener("scroll", handleScroll);
            }
        };
    }, [showDropdown, setShowDropdown, scrollContainerRef]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (searchText.length > 1) {
                setLoading(true);
                setError("");

                try {
                    const results = await searchVector(searchText);
                    if (Array.isArray(results)) {
                        const q = searchText.toLowerCase().trim();
                        const isTextMatch = (product) => {
                            const name = (product.product_name || "").toLowerCase();
                            const salt = (product.salt_name || "").toLowerCase();
                            const composition = (product.composition || "").toLowerCase();

                            if (name.includes(q) || salt.includes(q) || composition.includes(q)) {
                                return true;
                            }

                            const queryWords = q.split(/\s+/).filter(Boolean);
                            if (queryWords.length > 0 && queryWords.every(word => name.includes(word) || salt.includes(word) || composition.includes(word))) {
                                return true;
                            }

                            const matchLen = Math.min(q.length, 3);
                            if (matchLen >= 2) {
                                const prefix = q.substring(0, matchLen);
                                const nameWords = name.split(/\s+/).filter(Boolean);
                                const saltWords = salt.split(/\s+/).filter(Boolean);
                                if (nameWords.some(w => w.startsWith(prefix)) || saltWords.some(w => w.startsWith(prefix))) {
                                    return true;
                                }
                            }
                            return false;
                        };

                        const textMatches = results.filter(isTextMatch);
                        const filteredResults = textMatches.length > 0 ? textMatches : results;

                        const seenSalts = new Set();
                        const uniqueSalts = [];
                        filteredResults.forEach((item) => {
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

                        // Sort uniqueSalts so that lightweight/single salts matching the query come first
                        const sortedUniqueSalts = [...uniqueSalts].map((salt, index) => {
                            const comp = salt.composition.toLowerCase();
                            let matchScore = 0;
                            if (comp.startsWith(q)) {
                                matchScore = 3;
                            } else if (comp.includes(q)) {
                                matchScore = 2;
                            } else {
                                const words = q.split(/\s+/).filter(Boolean);
                                if (words.length > 0 && words.every(word => comp.includes(word))) {
                                    matchScore = 1;
                                }
                            }
                            const isSingle = !/[+/]|,|\band\b|\b&\b/i.test(salt.composition);
                            return {
                                salt,
                                matchScore,
                                isSingle,
                                length: salt.composition.length,
                                index
                            };
                        }).sort((a, b) => {
                            if (b.matchScore !== a.matchScore) {
                                return b.matchScore - a.matchScore;
                            }
                            if (b.isSingle !== a.isSingle) {
                                return (b.isSingle ? 1 : 0) - (a.isSingle ? 1 : 0);
                            }
                            if (a.length !== b.length) {
                                return a.length - b.length;
                            }
                            return a.index - b.index;
                        }).map(item => item.salt);

                        setFilteredSalts(sortedUniqueSalts);

                        const validProducts = filteredResults.filter(p => p.product_pricing_new !== null);
                        setFilteredSuggestions(validProducts);
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
                setShowDropdown(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(debounceTimer);

    }, [searchText]);

    const handleChange = (event) => {
        setSearchText(event.target.value);
        setCurrentPage(1);
        if (event.target.value.length > 1) {
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    };

    const handleNextPage = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        setShowDropdown(false);
        navigate(`/product/${suggestion.product_name_url}`, { state: { product: suggestion }, replace: false });
    };

    const gotoSaltPage = (salt) => {
        setShowDropdown(false);
        navigate("/salt/" + salt);
    };

    return (
        <div className={`inline-search-container variant-${variant} ${className}`} ref={searchContainerRef}>
            <div className="inline-search-bar" onClick={() => { if (searchText.length > 1) setShowDropdown(true); }}>
                <input
                    type="text"
                    placeholder={placeholderText}
                    className="inline-search-input"
                    value={searchText}
                    onChange={handleChange}
                />
                <div className="inline-search-button">
                    <img src="/search.svg" alt="Search" />
                </div>
            </div>

            {showDropdown && searchText.length > 1 && (
                <div className="inline-search-dropdown">
                    <div className="inline-search-dropdown-content">
                        {loading ? (
                            <div className="inline-loader">Loading...</div>
                        ) : error ? (
                            <div className="inline-error">{error}</div>
                        ) : (
                            <>
                                {filteredSuggestions.length === 0 && filteredSalts.length === 0 && (
                                    <div className="inline-no-product">
                                        <h3 className="inline-no-product-text">
                                            Your Product Not Found <span>Request Us</span>
                                        </h3>
                                        <div
                                            onClick={() => {
                                                const message = `Hello! I couldn't find the product "${searchText}" on your website. Can you please help me?`;
                                                const encodedMessage = encodeURIComponent(message);
                                                window.open(`https://wa.me/+917090123709?text=${encodedMessage}`, "_blank");
                                            }}
                                            className="inline-whatsapp-btn"
                                        >
                                            <img className="inline-whatsapp-icon" alt="WhatsApp" src="/whatsapp.png" />
                                            <span>Request</span>
                                        </div>
                                    </div>
                                )}

                                {filteredSuggestions.length > 0 && (
                                    <div className="inline-suggestions-title">Suggestions for "{searchText}"</div>
                                )}

                                {(filteredSalts.length > 0 || filteredSuggestions.length > 0) && (
                                    <div className="inline-search-split-container">
                                        <div className="inline-search-col inline-salts-col">
                                            <div className="inline-column-header">Salts</div>
                                            {filteredSalts.length > 0 ? (
                                                filteredSalts.map((salt, index) => (
                                                    <div key={`salt-${salt.salt_id || index}`} className="inline-salt-suggestion" onMouseDown={() => gotoSaltPage(salt.composition)}>
                                                        <div className="inline-product-name">{salt.composition}</div>
                                                        <div className="inline-product-salt">in salt</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="inline-no-results-placeholder">No matching salts found</div>
                                            )}
                                        </div>
                                        <div className="inline-search-col inline-products-col">
                                            <div className="inline-column-header">Products</div>
                                            {filteredSuggestions.length > 0 ? (
                                                filteredSuggestions.map((suggestion, index) => (
                                                    <div key={`prod-${suggestion.product_id || index}`} className="inline-suggestion" onMouseDown={() => handleSelectSuggestion(suggestion)}>
                                                        <div className="inline-product-name">{suggestion.product_name}</div>
                                                        <div className="inline-product-pricing">
                                                            <div className="inline-price">₹ {suggestion.product_pricing_new || 0}</div>
                                                            <div className="inline-icon">
                                                                <img className="inline-medicine-icon" alt="category" src={suggestion.category_outline_url ? "https://d1dh0rr5xj2p49.cloudfront.net/categories/" + suggestion.category_outline_url : "/medicine-icon.svg"} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="inline-no-results-placeholder">No matching products found</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {totalPages > 1 && (
                                    <div className="inline-pagination">
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
            )}
        </div>
    );
};
