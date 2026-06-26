import React, { useState, useEffect } from "react";
import HeadActions from "../../components/HeadActions/HeadActions";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getDefaultAddress, getUser } from "../../api/Api";

import { searchProducts, searchSalt, getMainCategories } from "../../api/Api";
import Swal from 'sweetalert2';
import { InlineSearch } from "../../components/InlineSearch/InlineSearch";

export const DashboardHeader = ({ userData, variant, searchText, setSearchText, showDropdown, setShowDropdown, scrollContainerRef, maxWidth }) => {
  const [user, setUser] = useState({
    name: "",
    location: "",
  });
  const [showMiniSearch, setShowMiniSearch] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'categories' or 'insights' or null
  const navigate = useNavigate();
  const location = useLocation();

  const [topCategories, setTopCategories] = useState([]);
const nameToSlug = (name) =>
  name ? name.toLowerCase().replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") : "";
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getMainCategories();
        // Check if data is an array
        if (Array.isArray(data)) {
          const formattedCategories = data.map(cat => ({
            label: cat.name,
            value: `/categories/${nameToSlug(cat.name)}`
          }));
          setTopCategories(formattedCategories);
        } else if (data && data.categories && Array.isArray(data.categories)) {
          // Handle if response is { categories: [...] }
          const formattedCategories = data.categories.map(cat => ({
            label: cat.name,
            value: `/categories/${nameToSlug(cat.name)}`
          }));
          setTopCategories(formattedCategories);
        }

      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const knowUsLinks = [
    { label: "About Medingen", type: "internal", value: "/about" },
    { label: "How to buy Medicines", type: "scroll", value: "how-it-works" },
    { label: "Terms & Condition", type: "internal", value: "/policies-terms-and-conditions" },
    { label: "Privacy Policy", type: "internal", value: "/policies-privacy-policy" },
    { label: "Contact Us", type: "internal", value: "/help-center" },
  ];

  const healthResources = [
    { label: "All Blogs", value: "/blogs" },
    { label: "All Categories", value: "/categories" },
  ];

  const handleLinkClick = (type, value) => {
    if (type === "internal") {
      navigate(value);
    } else if (type === "scroll") {
      window.location.href = `/about#${value}`;
    }
    setActiveSubmenu(null);
  };

  function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
  }

  const handleScrollToSection = (section) => {
    window.location.href = "/about#" + section;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = getUser();

        if (data.isLoggedIn) {
          const userData = { ...data };

          if (userData.selectedAddress) {
            try {
              const response = await getDefaultAddress();

              if (response && response.default_address) {
                const { address1, state } = response.default_address;
                setUser({
                  name: userData.firstName || userData.name,
                  location: `${address1}, ${state}`,
                });
                return;
              } else {
                setUser({
                  name: userData.firstName || userData.name,
                  location: "",
                });
              }
            } catch (error) {
              console.error("Error fetching default address", error);
              setUser({
                name: userData.firstName || userData.name,
                location: "",
              });
            }
          } else {
            setUser({
              name: userData.firstName || userData.name,
              location: userData.defaultAddress || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      }

      // ✅ Only try geolocation if no saved location is available
      if (!user.location) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;

              try {
                const locationResponse = await fetch(
                  `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=66d4782bb3d09960167594uts506c6d`
                );
                const locationData = await locationResponse.json();

                const city =
                  locationData.address.city ||
                  locationData.address.town ||
                  locationData.address.village ||
                  locationData.address.county ||
                  locationData.address.state_district ||
                  "Unknown City";

                const area =
                  locationData.address.suburb ||
                  locationData.address.neighbourhood ||
                  locationData.address.locality ||
                  locationData.address.ward ||
                  locationData.address.road ||
                  "Unknown Area";

                const postalCode =
                  locationData.address.postcode ||
                  "Unknown Pincode";

                setUser((prevState) => ({
                  ...prevState,
                  location: `${area}, ${city}, ${postalCode}`,
                }));
              } catch (geoError) {
                console.error("Error fetching geocoded location:", geoError);
                setUser((prevState) => ({
                  ...prevState,
                  location: "Turn on location to get better results",
                }));
              }
            },
            (error) => {
              // ✅ No popup → just fallback silently
              setUser((prevState) => ({
                ...prevState,
                location: "Location not available",
              }));
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        } else {
          setUser((prevState) => ({
            ...prevState,
            location: "Geolocation not supported",
          }));
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollEl = scrollContainerRef?.current;
      const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

      if (scrollTop > 200) {
        setShowMiniSearch(true);
      } else {
        setShowMiniSearch(false);
      }
    };

    const scrollEl = scrollContainerRef?.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    // Also keep capture-phase fallback for safety
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [scrollContainerRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setActiveSubmenu(null);
      }
    };

    if (activeSubmenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeSubmenu]);

  const toggleSubmenu = (menu) => {
    setActiveSubmenu(activeSubmenu === menu ? null : menu);
  };


  const isDesktop = useMediaQuery("(min-width: 800px)");

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;

    let transcript = "";

    recognition.onstart = () => {
      Swal.fire({
        title: "Listening...",
        html: `
        <div>
          <span id="voice-typed"></span>
          <br/>
          <button id="stop-listening-btn" style="margin-top:10px;padding:6px 12px;border:none;background:#d33;color:#fff;border-radius:4px;cursor:pointer;">
            Stop Listening
          </button>
        </div>
      `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          document.getElementById('voice-typed').innerText = "";

          document.getElementById('stop-listening-btn').addEventListener('click', () => {
            recognition.stop();
            Swal.close();
          });
        }
      });
    };

    recognition.onresult = (event) => {
      transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(" ");

      const voiceElem = document.getElementById('voice-typed');
      if (voiceElem) {
        voiceElem.innerText = transcript;
      }

      if (event.results[event.results.length - 1].isFinal) {
        Swal.close();
        navigate("/searchbox", { state: { voiceSearch: transcript.trim() } });
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);
    };

    recognition.onend = () => {
      Swal.close();
    };

    recognition.start();
  };

  const renderNavLinks = () => (
    <div className="header-menu-list">
      <Link to="/" className="menu-item">Home</Link>
      <div
        className="menu-item dropdown"
        onMouseEnter={() => setActiveSubmenu('categories')}
        onMouseLeave={() => setActiveSubmenu(null)}
        onClick={(e) => {
          e.stopPropagation();
          toggleSubmenu('categories');
        }}
      >
        <span>Health Categories</span>
        <img src="/downarrow.svg" alt="" className="menu-arrow" />
        {activeSubmenu === 'categories' && (
          <div className="mega-menu categories-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mega-menu-content">
              <div className="mega-menu-column">
                <h3 className="mega-menu-title">Top Categories</h3>
                <ul className="mega-menu-list">
                  {topCategories.map((cat, idx) => (
                    <li key={idx} onClick={() => handleLinkClick("internal", cat.value)}>
                      {cat.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      <Link to="/offers" className="menu-item">Offers & Discounts</Link>
      <div
        className="menu-item dropdown"
        onMouseEnter={() => setActiveSubmenu('insights')}
        onMouseLeave={() => setActiveSubmenu(null)}
        onClick={(e) => {
          e.stopPropagation();
          toggleSubmenu('insights');
        }}
      >
        <span>Health Insights</span>
        <img src="/downarrow.svg" alt="" className="menu-arrow" />
        {activeSubmenu === 'insights' && (
          <div className="mega-menu insights-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mega-menu-content">
              <div className="mega-menu-column">
                <h3 className="mega-menu-title">Know Us</h3>
                <ul className="mega-menu-list">
                  {knowUsLinks.map((link, idx) => (
                    <li key={idx} onClick={() => handleLinkClick(link.type, link.value)}>
                      {link.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mega-menu-column">
                <h3 className="mega-menu-title">Health Resources</h3>
                <ul className="mega-menu-list">
                  {healthResources.map((link, idx) => (
                    <li key={idx} onClick={() => handleLinkClick("internal", link.value)}>
                      {link.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const isHomePage = location.pathname === '/';
  const showSearchInHeader = (!isHomePage || showMiniSearch);
  const isSolidHeader = !isHomePage || showMiniSearch;

  return (
    <>
      <div className={`dashboard-container dash-header ${isSolidHeader ? "scrolled" : ""}`} 
           style={{ background: isSolidHeader ? "#ffffff" : "transparent" }}>
        {isDesktop &&
          <>
            <div className="dashboard-item dashboard-item-main" style={{ background: "transparent" }}>
              <div className="header-main-desktop">
                {/* Top Bar */}
                <div className="header-top-bar">
                  <div className="header-content-inner" style={maxWidth ? { maxWidth: maxWidth } : {}}>
                    <div className="header-left-section">
                      <Link to="/" className="logo-link">
                        <img className="finalmiglogo-new" alt="Medingen" src="/migfulllogo.svg" />
                        <span className="logo-text-brand">Medingen</span>
                      </Link>
                      <div className="logo-divider"></div>
                      <div className="header-location-mini">
                        <img className="location-mini-icon" alt="Location" src="/NavigationArrow.svg" fetchpriority="high" />
                        <span className="location-mini-text">
                          {user.location?.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    {variant !== "checkout" && (
                      <div className="header-center-section">
                        <div className={`header-dynamic-center ${showSearchInHeader ? 'show-search' : 'show-nav'}`}>
                          <div className="header-nav-wrapper">
                            {renderNavLinks()}
                          </div>
                          <div className="header-search-wrapper">
                            <InlineSearch 
                              variant="header" 
                              searchText={searchText} 
                              setSearchText={setSearchText} 
                              showDropdown={showDropdown}
                              setShowDropdown={setShowDropdown}
                              scrollContainerRef={scrollContainerRef}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="header-right-section" style={{ marginLeft: variant === "checkout" ? "auto" : "0" }}>
                      <HeadActions />
                    </div>
                  </div>
                </div>

                {/* Bottom Bar - revealed on scroll or on non-home pages when top search is active */}
                {variant !== "checkout" && (
                  <div className={`header-bottom-bar ${showSearchInHeader ? 'revealed' : 'hidden-nav'}`}>
                    <div className="header-content-inner" style={maxWidth ? { maxWidth: maxWidth } : {}}>
                      <div className="bottom-nav-reveal">
                        {renderNavLinks()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        }

            {/* <p className="greeting-para">Search Medicine/ General Product</p> */}

            {/* <div className="dashboard-item">
              <Link to="/searchbox" className="overlap-wrapper-header">
                <div className="overlap-4-header">
                  <img className="search-header" alt="Search" src="/search.svg" fetchpriority="high" />
                  <p className="p-header">What are you looking for..</p>
                </div>
              </Link>
            </div> */}

        {!isDesktop && (
          <div className="dashboard-item dashboard-item-main">
            <div className="mobile-header-main" style={{ minHeight: 64, width: "100%", padding: "8px 16px", borderBottom: "1px solid #f2f2f2" }}>
              <div className="mobile-header-left">
                <Link to={"/"} className="mobile-logo-container" style={{ minWidth: "auto" }}>
                  <img
                    className="mobile-logo"
                    alt="Medingen"
                    src="/migfulllogo.svg"
                    style={{ width: 75 }}
                  />
                </Link>
              </div>
              <div className="mobile-header-right">
                <HeadActions variant={variant} />
              </div>
            </div>


            {location.pathname !== '/' && (
              <div className="dashboard-item">
                {/* <Link to="/searchbox" className="overlap-wrapper-header"> */}
                {/* <div className="overlap-4-header">
                    <>
                      <img className="search-header" alt="Search" src="/search.svg" fetchpriority="high" />
                      <p className="p-header">What are you looking for..</p>
                    </>
                    <img className="micro-header" alt="Microphone" src="/microphone.svg" fetchpriority="high" onClick={startListening} style={{ cursor: "pointer" }} />
                  </div> */}
                {/* </Link> */}
              </div>
            )}

            {/* <div className="dashboard-item dash-name">
              <div className="hey-skanda">
                <span className="span-header">
                  {"Hey "}
                </span>
                <span className="text-wrapper-4-header">
                  {user?.name ? user.name.substring(0, 12) : "Guest"}!
                </span>
              </div>
            </div>

            <div className="address-one">
              <div className="address-one-main-container">
                <Link
                  to="/savedaddress"
                  className="rectangle-8-saved-address clickable"
                />
                <div className="address-search-para clickable">
                  <img className="location-small" alt="Location" src="/location.svg" fetchpriority="high" />
                  <div className="text-wrapper-dash-header">
                    {user.location}
                  </div>
                </div>
                <Link
                  to="/savedaddress"
                  className="text-wrapper-2-header clickable"
                >
                  Change
                </Link>
              </div>
            </div> */}

            {/* <div className="address-actions-group">
              <div className="address-actions">
                <div className="frame-3-address clickable">
                  <div className="text-wrapper-dash-header-md">
                    {user.location}
                  </div>
                </div>
                <Link
                  to="/savedaddress"
                  className="text-wrapper-2-header clickable"
                >
                  Change
                </Link>
              </div>
            </div> */}

          </div>
        )}

      </div >
    </>
  );
};