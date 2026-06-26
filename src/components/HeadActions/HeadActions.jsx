import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./style.css";
import { useCart, useProfile } from "../../api/stateContext";
import { getUser, getDefaultAddress } from "../../api/Api";
import Cookies from 'js-cookie';

const HeadActions = ({ variant }) => {
  const isCheckout = variant === "checkout";
  const { itemCount } = useCart();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const locationRoute = useLocation();
  const userData = getUser();

  const [location, setLocation] = useState("Chennai");
  const [hideRoutes, setHideRoutes] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  // Use profile from context
  const profileData = {
    profilePicture: profile?.profilePicture || profile?.profile_picture || "",
    name: profile?.name || profile?.customer_name || "",
    phone: profile?.phone || profile?.phone_number || "",
    email: profile?.email || "",
  };

  const handleSignOut = () => {
    Cookies.remove('jwt_token');
    Cookies.remove('customer_name');
    Cookies.remove('email');
    Cookies.remove('customer_id');
    Cookies.remove('location');
  }

  const handleLogout = () => {
    handleSignOut();
    navigate("/login");
  };

  const profileRef = useRef(null);

  /* ---------------- HIDE ROUTES ---------------- */
  useEffect(() => {
    const includeRoutes = ["/", "/product"];
    setHideRoutes(includeRoutes.includes(locationRoute.pathname));
  }, [locationRoute.pathname]);

  /* ---------------- OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- LOCATION ---------------- */
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        if (userData?.isLoggedIn) {
          const res = await getDefaultAddress();
          if (res?.default_address) {
            const { city, state } = res.default_address;
            setLocation(city || state || "Chennai");
            return;
          }
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              const geoRes = await fetch(
                `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=66d4782bb3d09960167594uts506c6d`
              );
              const geo = await geoRes.json();
              setLocation(
                geo.address.city ||
                geo.address.town ||
                geo.address.village ||
                "Your location"
              );
            },
            () => setLocation("Your location")
          );
        }
      } catch {
        setLocation("Your location");
      }
    };

    fetchLocation();
  }, []);

  const startListening = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Your browser does not support speech recognition.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;

  let transcript = "";

  recognition.onresult = (event) => {
    transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ");

    if (event.results[event.results.length - 1].isFinal) {
      recognition.stop();
      navigate("/searchbox", {
        state: { voiceSearch: transcript.trim() },
      });
    }
  };

  recognition.start();
};

  return (
    <div className={`header-actions header-search-layout ${isCheckout ? "checkout-mode" : ""}`}>
      <>
        {/* Search Icon - Mobile Only or Checkout */}
        {(isCheckout || locationRoute.pathname !== "/") && (
          <Link to="/searchbox" className={`action-icon-wrapper clickable ${!isCheckout ? "hide-on-desktop" : ""}`}>
            <img className="action-icon" alt="Search" src="/search.svg" />
          </Link>
        )}

        {/* WhatsApp Icon */}
        <div onClick={() => window.open("https://wa.me/917090123709", "_blank")} className="action-icon-wrapper clickable">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="#25D366" xmlns="http://www.w3.org/2000/svg" className="action-icon">
            <path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.65.87 5.1 2.34 7.07L4 29l7.1-2.29A11.93 11.93 0 0016.02 27C22.63 27 28 21.63 28 15.02 28 8.4 22.63 3 16.02 3zm0 21.9c-2.2 0-4.24-.65-5.95-1.78l-.43-.27-4.2 1.35 1.37-4.1-.28-.44a9.9 9.9 0 01-1.6-5.38c0-5.46 4.44-9.9 9.9-9.9 5.45 0 9.9 4.44 9.9 9.9 0 5.46-4.45 9.9-9.9 9.9zm5.43-7.46c-.3-.15-1.76-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.47.13-.62.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.52s1.07 2.92 1.22 3.12c.15.2 2.1 3.2 5.1 4.5.7.3 1.25.48 1.68.62.7.22 1.35.19 1.86.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.57-.35z" />
          </svg>
        </div>

        {/* Notif - hide in checkout */}
        {!isCheckout && userData?.customer_id && (
          <div onClick={() => navigate("/notification")} className="action-icon-wrapper clickable">
            <img className="action-icon" alt="Notification" src="/notificationbell.svg" />
          </div>
        )}

        {/* Cart Icon */}
        <Link to="/cart" className="action-icon-wrapper clickable">
          <div className="badge">{itemCount}</div>
          <img className="action-icon" alt="Cart" src="/carticon.svg" />
        </Link>

        {/* Offers Icon */}
        <Link to="/offers" className={`action-icon-wrapper clickable ${!isCheckout ? "hide-on-desktop" : ""}`}>
          <img className="action-icon" alt="Offers" src="/new_offer.svg" />
        </Link>
      </>

      {!isCheckout && userData?.customer_id ? (
        <div className="profile-menu-wrapper" ref={profileRef}>
          <div
            className="action-icon-wrapper clickable profile-with-arrow"
            onClick={() => setOpenProfile((v) => !v)}
          >
            <img
              src={
                profileData.profilePicture
                  ? (profileData.profilePicture.startsWith("https") || profileData.profilePicture.startsWith("data:image"))
                    ? profileData.profilePicture
                    : `https://d1dh0rr5xj2p49.cloudfront.net/profilepic/${profileData.profilePicture}`
                  : "/profile.svg"
              }
              alt={profileData.name || "Profile"}
              className={
                profileData.profilePicture
                  ? "header-profile-avatar"
                  : "action-icon"
              }
              onError={(e) => (e.target.src = "/profile.svg")}
            />

            <img
              src="/downarrow.svg"
              alt="Expand"
              className={`profile-down-arrow ${openProfile ? "rotate" : ""}`}
            />
          </div>

          {openProfile && (
            <div className="profile-dropdown">
              <div className="profile-top">
                <div className="profile-name">
                  {profileData.name || "User"}
                </div>
                <div className="profile-phone">
                  {profileData.phone ? `+91 ${profileData.phone}` : ""}
                </div>

                <Link to="/profile" className="profile-edit">
                  Edit profile
                </Link>
              </div>

              <div className="profile-item">
                <Link to="/orders">My Orders</Link>
              </div>
              <div className="profile-item">
                <Link to="/savedaddress">My Address</Link>
              </div>
              <div className="profile-item">
                <Link to="/upload-prescription">Prescriptions</Link>
              </div>
              <div className="profile-item">
                <a
                  href="https://wa.me/917090123709"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Need Help?
                </a>
              </div>


              <div onClick={handleLogout} className="profile-logout">Logout</div>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="login-button">
          <div className="login-text">Login</div>
          <img className="vector login-arrow" alt="Arrow" src="/downarrow.svg" />
        </Link>
      )}
    </div>
  );
};

export default HeadActions;
