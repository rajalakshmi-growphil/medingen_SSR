"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import "./style.css";
import { searchVector } from "@/lib/api";
import Navigation from "../../Dashboard/Navigation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const SearchBoxComponent = () => {
  const [searchText, setSearchText] = useState("");
  const [filteredSalts, setFilteredSalts] = useState<any[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const voiceSearch = searchParams.get("voiceSearch");
    if (voiceSearch) {
      setSearchText(voiceSearch);
    }
    searchInputRef.current?.focus();
  }, [searchParams]);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSearchText(category + ":");
    }
    searchInputRef.current?.focus();
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (searchText.length > 1) {
        setLoading(true);
        setError("");

        try {
          const results = await searchVector(searchText);
          if (Array.isArray(results)) {
            const q = searchText.toLowerCase().trim();
            const isTextMatch = (product: any) => {
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
                if (nameWords.some((w: string) => w.startsWith(prefix)) || saltWords.some((w: string) => w.startsWith(prefix))) {
                  return true;
                }
              }
              return false;
            };

            const textMatches = results.filter(isTextMatch);
            const filteredResults = textMatches.length > 0 ? textMatches : results;

            const seenSalts = new Set<string>();
            const uniqueSalts: any[] = [];
            filteredResults.forEach((item: any) => {
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

            const validProducts = filteredResults.filter((p: any) => p.product_pricing_new !== null);
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
      }
    };

    fetchProducts();
  }, [searchText]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
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

  const handleSelectSuggestion = (suggestion: any) => {
    router.push(`/product/${suggestion.product_name_url}`);
  };

  const gotoSaltPage = (salt: string) => {
    router.push("/salt/" + salt);
  };

  return (
    <div className="search-box">
      <div className="overlap">
        <div className="frame">
          <div className="overlap-group">
            <div className="group"></div>
            <div className="frame-2">
              <Link href="/">
                <img className="line-arrow-chevron" alt="Line arrow chevron" src="/line-arrow-chevron-left.svg" fetchPriority="high" />
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
                    ref={searchInputRef}
                  />
                </div>
              </div>
            </div>
          </div>
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
                  {(filteredSalts.length > 0 || filteredSuggestions.length > 0) && (
                    <div className="search-split-container">
                      <div className="search-col salts-col">
                        <div className="column-header">Salts</div>
                        {filteredSalts.length > 0 ? (
                          filteredSalts.map((salt, idx) => (
                            <div key={`salt-${salt.salt_id || idx}`} className="salt-suggestion" onClick={() => { gotoSaltPage(salt.composition) }} >
                              <div className="product-name">{salt.composition}</div>
                              <div className="product-salt">
                                in salt
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-results-placeholder">No matching salts found</div>
                        )}
                      </div>
                      <div className="search-col products-col">
                        <div className="column-header">Products</div>
                        {filteredSuggestions.length > 0 ? (
                          filteredSuggestions.map((suggestion, idx) => (
                            <div key={`prod-${suggestion.product_id || idx}`} className="suggestion" onClick={() => { handleSelectSuggestion(suggestion) }} >
                              <div className="product-name">{suggestion.product_name}</div>
                              <div className="product-pricing">
                                <div className="price">₹ {suggestion.product_pricing_new}</div>
                                <div className="icon">
                                  <img className="medicine-icon" alt="Line arrow chevron" src={suggestion.category_outline_url ? "https://d1dh0rr5xj2p49.cloudfront.net/categories/" + suggestion.category_outline_url : "/medicine-icon.svg"} fetchPriority="high" />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-results-placeholder">No matching products found</div>
                        )}
                      </div>
                    </div>
                  )}
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

export const SearchBox = () => {
  return (
    <Suspense fallback={<div className="loader">Loading Search...</div>}>
      <SearchBoxComponent />
    </Suspense>
  );
};
