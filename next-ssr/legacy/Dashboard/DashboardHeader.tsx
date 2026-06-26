"use client";

import React, { useState, useEffect, useRef } from "react";
import HeadActions from "../components/HeadActions/HeadActions";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getDefaultAddress, getUser } from "../../lib/api";
import Swal from 'sweetalert2';
import { InlineSearch } from "../components/InlineSearch/InlineSearch";

interface DashboardHeaderProps {
  userData?: any;
  variant?: string;
  searchText?: string;
  setSearchText?: (val: string) => void;
  showDropdown?: boolean;
  setShowDropdown?: (val: boolean) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  maxWidth?: number | string;
  mainCategories?: any;
}

const nameToSlug = (name: string) =>
  name ? name.toLowerCase().replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") : "";

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userData,
  variant,
  searchText,
  setSearchText,
  showDropdown,
  setShowDropdown,
  scrollContainerRef,
  maxWidth,
  mainCategories
}) => {
  const [user, setUser] = useState({
    name: "",
    location: "",
  });
  const [showMiniSearch, setShowMiniSearch] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null); // 'categories' or 'insights' or null
  const router = useRouter();
  const pathname = usePathname();

  const [topCategories, setTopCategories] = useState<any[]>([]);

  useEffect(() => {
    if (mainCategories) {
      const cats = Array.isArray(mainCategories) 
        ? mainCategories 
        : (mainCategories.categories || mainCategories.main_categories || []);
      const formattedCategories = cats.map((cat: any) => ({
        label: cat.name || cat.category_name || "",
        value: `/categories/${nameToSlug(cat.name || cat.category_name || "")}`
      })).filter((cat: any) => cat.label !== "");
      setTopCategories(formattedCategories);
    }
  }, [mainCategories]);

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

  const handleLinkClick = (type: string, value: string) => {
    if (type === "internal") {
      router.push(value);
    } else if (type === "scroll") {
      window.location.href = `/about#${value}`;
    }
    setActiveSubmenu(null);
  };

  // Safe client-side media query
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 800px)");
    setIsDesktop(media.matches);
    const listener = () => setIsDesktop(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const handleScrollToSection = (section: string) => {
    window.location.href = "/about#" + section;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uData = getUser();

        if (uData.isLoggedIn) {
          const userDataCopy = { ...uData } as any;

          if (userDataCopy.selectedAddress) {
            try {
              const response = await getDefaultAddress();

              if (response && response.default_address) {
                const { address1, state } = response.default_address;
                setUser({
                  name: userDataCopy.firstName || userDataCopy.name || "",
                  location: `${address1}, ${state}`,
                });
                return;
              } else {
                setUser({
                  name: userDataCopy.firstName || userDataCopy.name || "",
                  location: "",
                });
              }
            } catch (error) {
              console.error("Error fetching default address", error);
              setUser({
                name: userDataCopy.firstName || userDataCopy.name || "",
                location: "",
              });
            }
          } else {
            setUser({
              name: userDataCopy.firstName || userDataCopy.name || "",
              location: userDataCopy.location || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      }

      // Geolocation if no address is set
      if (!user.location && typeof window !== "undefined") {
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
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [scrollContainerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.dropdown')) {
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

  const toggleSubmenu = (menu: string) => {
    setActiveSubmenu(activeSubmenu === menu ? null : menu);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
          const typedEl = document.getElementById('voice-typed');
          if (typedEl) typedEl.innerText = "";

          document.getElementById('stop-listening-btn')?.addEventListener('click', () => {
            recognition.stop();
            Swal.close();
          });
        }
      });
    };

    recognition.onresult = (event: any) => {
      transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(" ");

      const voiceElem = document.getElementById('voice-typed');
      if (voiceElem) {
        voiceElem.innerText = transcript;
      }

      if (event.results[event.results.length - 1].isFinal) {
        Swal.close();
        router.push(`/searchbox?voiceSearch=${encodeURIComponent(transcript.trim())}`);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
    };

    recognition.onend = () => {
      Swal.close();
    };

    recognition.start();
  };

  const renderNavLinks = () => (
    <div className="header-menu-list">
      <Link href="/" className="menu-item">Home</Link>
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
      <Link href="/offers" className="menu-item">Offers & Discounts</Link>
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

  const isHomePage = pathname === '/';
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
                      <Link href="/" className="logo-link">
                        <img className="finalmiglogo-new" alt="Medingen" src="/migfulllogo.svg" />
                        <span className="logo-text-brand">Medingen</span>
                      </Link>
                      <div className="logo-divider"></div>
                      <div className="header-location-mini">
                        <img className="location-mini-icon" alt="Location" src="/NavigationArrow.svg" fetchPriority="high" />
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

                {/* Bottom Bar */}
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

        {!isDesktop && (
          <div className="dashboard-item dashboard-item-main">
            <div className="mobile-header-main" style={{ minHeight: 64, width: "100%", padding: "8px 16px", borderBottom: "1px solid #f2f2f2" }}>
              <div className="mobile-header-left">
                <Link href={"/"} className="mobile-logo-container" style={{ minWidth: "auto" }}>
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
          </div>
        )}
      </div>
    </>
  );
};