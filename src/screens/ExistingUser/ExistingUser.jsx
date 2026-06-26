import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { handleLoginsendOTP } from "../../api/Api";
import Splash3 from "../Splash3/Splash3";
import "./style.css";
import { FiArrowRight } from "react-icons/fi";
import { Helmet } from "react-helmet";
// Use shared style with Login3

export const ExistingUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber;

  const handlePasswordLogin = () => {
    navigate("/enterpassword", { state: { phoneNumber } });
  };

  const handleGetOtp = async () => {
    await handleLoginsendOTP(phoneNumber, navigate);
  };

  const handleSkip = () => {
    navigate("/");
  };

  return (
<>

    <div className="login2">
      <div className="login-wrapper">
        <div className="login-splash">
          <Splash3 embedded={true} avoidRedirect={true} />
        </div>

        <div className="login-box">
          <div className="existing-user-container">
            <div className="text-header">
              <div className="title">Account Found!</div>
              <p className="subtitle">
                We found your account. Log in using your password or receive an OTP to proceed.
              </p>
              <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchpriority="high" />
            </div>

            <div className="existing-user-buttons">
              <button className="existing-user-password-btn" onClick={handlePasswordLogin}>
                Login with Password <FiArrowRight className="arrow-icon" />
              </button>

              <div className="or-divider">
                <span>OR</span>
              </div>

              <button className="existing-user-otp-btn" onClick={handleGetOtp}>
                Get OTP via SMS
              </button>
            </div>

            <div className="bottom-skip-wrapper" onClick={handleSkip}>
               <span className="bottom-skip-text">Skip and continue as guest</span>
            </div>
          </div>
        </div>

      </div>
    </div>

</>
  );
};
