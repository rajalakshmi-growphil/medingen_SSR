import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { checkCustomer, getUser, handleGoogleLogin, sendOTP } from "../../api/Api";
import "./style.css";
import { useCart } from "../../api/stateContext";
import Splash3 from "../Splash3/Splash3";
import { Helmet } from "react-helmet";

const clientId =
  "539611186698-asu4rak5figolg3eradijpp043s5di2e.apps.googleusercontent.com";

export const Login1 = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useCart();

  useEffect(() => {
    dispatch({ type: "UPDATE_COUNT", payload: 0 });
    const user = getUser();
    if (user.customer_id) {
      navigate("/");
    }
  }, [dispatch]);

  const handleSkip = () => {
    navigate("/");
  };

  const handleCreateAccountClick = () => {
    navigate("/create-profile");
  };

  const onSuccess = async (response) => {
    await handleGoogleLogin(response.credential, navigate);
  };

  const onFailure = () => {
    console.log("Login Failed");
  };

  const handleGoogleSignIn = () => {
    Swal.fire({
      title: "Info",
      text: "Social media integration coming soon!",
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handleSocialMediaLogin = () => {
    Swal.fire({
      title: "Info",
      text: "Social media integration coming soon!",
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handleContinue = () => {
    const phoneRegex = /^[0-9]{10}$/; // exactly 10 digits only
    if (!phoneNumber) {
      Swal.fire({
        title: "Error!",
        text: "Please enter a phone number.",
        icon: "warning",
        confirmButtonText: "OK",
      });
    } else if (!phoneRegex.test(phoneNumber)) {
      Swal.fire({
        title: "Invalid!",
        text: "Phone number must be exactly 10 digits.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } else {
      checkCustomer(phoneNumber, navigate);
    }
  };

  return (
    <>
      <div className="login1">
        <div className="login-wrapper">
          <div className="login-splash">
            <Splash3 embedded={true} />
          </div>
          <div className="login-box">
            <div className="login-container">
              <div className="skip-wrapper">
                <button className="skip-button" onClick={handleSkip}>
                  Skip
                </button>
              </div>

              <div className="header">
                <div className="title">Enter your Mobile number</div>
                <p className="subtitle">We will send a confirmation code</p>
                <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchpriority="high" />
              </div>

              <div className="input-section">
                <div className="phone-label">Phone number</div>
                <div className="input-wrapper">
                  <span>+91 - </span>
                  <input
                    className="phone-input"
                    type="tel"
                    maxLength="10"
                    placeholder="Enter Phone Number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // allow only digits
                      // Allow only if the first digit is 6–9 or input is empty (for editing)
                      if (value === "" || /^[6-9]\d{0,9}$/.test(value)) {
                        setPhoneNumber(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleContinue();
                      }
                    }}
                  />

                </div>
              </div>

              <div className="button-wrapper">
                <button className="continue-button" onClick={handleContinue}>
                  Continue
                  <img className="button-icon" alt="Arrow" src="/vector-3.svg" fetchpriority="high" />
                </button>
              </div>

              <div className="continue-section">
                <img
                  className="separator"
                  alt="Separator"
                  src="/vector-179.svg" fetchpriority="high"
                />

                <div className="or-text">Existing users can sign in with Google</div>
                <GoogleOAuthProvider clientId={clientId}>
                  <GoogleLogin onSuccess={onSuccess} onError={onFailure} />
                </GoogleOAuthProvider>

                <div className="social-icons">
                  {/* <div className="icon-wrapper" onClick={handleSocialMediaLogin}>
                <img className="icon" alt="Facebook" src="/mask-group.png" />
              </div>
              <div className="icon-wrapper" onClick={handleSocialMediaLogin}>
                <img
                  className="icon"
                  alt="Instagram"
                  src="/frame-633086-insta.svg" fetchpriority="high"
                />
              </div> */}
                </div>
              </div>

              {/* <div className="create-account-section">
          <div className="create-account-text" onClick={handleCreateAccountClick}>Create New Account</div>
      </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
