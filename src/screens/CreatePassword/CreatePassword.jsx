import React, { useEffect, useState } from "react";
import "./style.css";
import { useNavigate, useLocation } from 'react-router-dom';
import { createPassword, handleGoogleSignup } from "../../api/Api";
import Swal from 'sweetalert2';
import Splash3 from "../Splash3/Splash3";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
const clientId =
  "539611186698-asu4rak5figolg3eradijpp043s5di2e.apps.googleusercontent.com";

export const CreatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(["", "", "", ""]);

  useEffect(() => {
    if (location.state && location.state.phoneNumber) {
      setPhoneNumber(location.state.phoneNumber);
      setOtp(location.state.otp);

    }
  }, [location.state.phoneNumber]);

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };

  const handleSavePasswordClick = () => {
    if (password.length < 6 || confirmPassword.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Passwords must be at least 6 characters long!',
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Passwords do not match!',
      });
      return;
    }

    createPassword(phoneNumber, password, otp, navigate, location.state.customer_id, location.state.jwt_token)
  };

  const onSuccess = async (response) => {
      await handleGoogleSignup(phoneNumber, response.credential, otp, navigate, location.state.customer_id, location.state.jwt_token);
    };
  
    const onFailure = () => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Google login failed!',
      });
    } 
     
  return (
    <>
    
    <div className="create-password-container">
            <div className="login-wrapper">
        <div className="login-splash">
          <Splash3 embedded={true} />
        </div>
        <div className="login-box">

      <div className="password-overlay">
        <div className="header">
          <div className="title">Create a New Password</div>
          <p className="subtitle">Please enter your new password and confirm it to proceed</p>
          <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchpriority="high"/>
        </div>
        <div className="password-section">
          <div className="password-label">
            <div className="password-label-text">Enter Password</div>
          </div>
          <div className="password-input-wrapper">
            <input
              type="password"
              className="password-input"
              placeholder="*************"
              value={password}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="password-label">
            <div className="password-label-text">Re-enter Password</div>
          </div>
          <div className="password-input-wrapper">
            <input
              type="password"
              className="password-input"
              placeholder="*************"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="continue-section">
              <img
                className="separator"
                alt="Separator"
                src="/vector-179.svg"
                fetchpriority="high"
              />

              <div className="or-text">or use Google Auth</div>
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
                  src="/frame-633086-insta.svg"
                  fetchpriority="high"
                />
              </div> */}
              </div>
            </div>
      </div>
      <div className="save-password-button-wrapper">
        <div className="save-password-button" onClick={handleSavePasswordClick}>
          <div className="save-password-button-text">Save Password</div>
          <img className="save-password-button-icon" alt="Save Icon" src="/vector-3.svg" fetchpriority="high" />
        </div>
      </div>
    </div>
    </div>
    </div>
    </>
    
  );
};
