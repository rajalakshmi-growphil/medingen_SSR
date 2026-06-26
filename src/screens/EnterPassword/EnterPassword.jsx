import React, { useEffect, useState } from "react";
import "./style.css";
import { useLocation, useNavigate } from "react-router-dom";
import { handleSignIn, handleSignInPassword, sendOTP } from "../../api/Api";
import Splash3 from "../Splash3/Splash3";
import { Helmet } from "react-helmet";

export const EnterPassword = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    // Access the phoneNumber from the state
    if (location.state && location.state.phoneNumber) {
      setPhoneNumber(location.state.phoneNumber);
    }
  }, [location]);

  const handleSkip = () => {
    navigate("/");
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleLoginClick = () => {
    // Example validation logic; replace with actual authentication logic
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
    } else {
      handleSignInPassword(phoneNumber, password, navigate);
    }
  };

  const handleForgotPasswordClick = () => {
    sendOTP(phoneNumber, navigate);
    navigate("/login2", { replace: true, state: { phoneNumber: phoneNumber } });
  };

  const handleCreateAccountClick = () => {
    // Handle create account logic
    console.log("Create New Account clicked");
  };

  return (
    <>
      
      <div className="password-container">
        <div className="login-wrapper">
          <div className="login-splash">
            <Splash3 embedded={true} />
          </div>
          <div className="login-box">
            <div className="password-overlay">
              <div className="skip-wrapper">
                <button className="skip-button" onClick={handleSkip}>
                  Skip
                </button>
              </div>
              <div className="header">
                <div className="title">Enter your Password</div>
                <p className="subtitle">
                  Please enter your password to proceed further
                </p>
                <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchpriority="high" />
              </div>
              <div className="password-section">
                <div className="password-label">
                  <div className="password-label-text">Password</div>
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    className="password-input"
                    placeholder="*************"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleLoginClick();
                      }
                    }}
                  />
                  <img
                    className="toggle-visibility-icon"
                    alt="Toggle Visibility"
                    src="/eye.svg" fetchpriority="high"
                    onClick={togglePasswordVisibility}
                  />
                </div>
                {error && <p className="error-message">{error}</p>}
                <div
                  className="forgot-password-link"
                  onClick={handleForgotPasswordClick}
                >
                  <div className="forgot-password-text">Forgot Password?</div>
                </div>
              </div>
            </div>
            <div className="login-button-wrapper">
              <div className="login-button" onClick={handleLoginClick}>
                <div className="login-button-text">Log in</div>
                <img
                  className="login-button-icon"
                  alt="Login Icon"
                  src="/vector-3.svg" fetchpriority="high"
                />
              </div>
            </div>

            {/* <div className="create-account-section">
        <div className="create-account-button" onClick={handleCreateAccountClick}>
          <div className="create-account-text">Create New Account</div>
        </div>
      </div> */}
          </div>
        </div>
      </div>
    </>
  );
};
