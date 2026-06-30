"use client";

import React, { useEffect, useState } from "react";
import "./style.css";
import { useRouter } from "next/navigation";
import { createPassword, handleGoogleSignup } from "@/lib/api";
import Swal from 'sweetalert2';
import Splash3 from "../Splash3/Splash3";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";

const clientId = "539611186698-asu4rak5figolg3eradijpp043s5di2e.apps.googleusercontent.com";

export const CreatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [jwtToken, setJwtToken] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedData = sessionStorage.getItem("create_password_data");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setPhoneNumber(parsed.phoneNumber || "");
        setOtp(parsed.otp || "");
        setCustomerId(parsed.customer_id || "");
        setJwtToken(parsed.jwt_token || "");
      }
    }
  }, []);

  const handlePasswordChange = (event: any) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event: any) => {
    setConfirmPassword(event.target.value);
  };

  const handleSavePasswordClick = async () => {
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

    try {
      Swal.showLoading();
      const response = await createPassword(phoneNumber, password, otp, jwtToken, customerId);
      Swal.close();
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Password created successfully!',
      }).then(() => {
        if (response.customer_name === null) {
          router.replace("/create-profile");
        } else {
          if (typeof window !== "undefined") {
            Cookies.set("customer_name", response.customer_name);
            window.dispatchEvent(new Event("profileUpdated"));
            window.dispatchEvent(new Event("cartUpdated"));
          }
          router.replace("/profile");
        }
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        title: 'Something went wrong!',
        text: 'Failed to create password',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  };

  const onSuccess = async (response: any) => {
    try {
      Swal.showLoading();
      const resData = await handleGoogleSignup(phoneNumber, response.credential, otp, jwtToken, customerId);
      Swal.close();
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Login created successfully!',
      }).then(() => {
        if (resData.customer_name === null) {
          router.replace("/create-profile");
        } else {
          if (typeof window !== "undefined") {
            Cookies.set("customer_name", resData.customer_name);
            window.dispatchEvent(new Event("profileUpdated"));
            window.dispatchEvent(new Event("cartUpdated"));
          }
          router.replace("/profile");
        }
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Google login failed!',
      });
    }
  };

  const onFailure = () => {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Google login failed!',
    });
  };

  return (
    <>
      <div className="create-password-container">
        <div className="login-wrapper">
          <div className="login-splash">
            <Splash3 embedded={true} avoidRedirect={true} />
          </div>
          <div className="login-box">
            <div className="password-overlay">
              <div className="header">
                <div className="title">Create a New Password</div>
                <p className="subtitle">Please enter your new password and confirm it to proceed</p>
                <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchPriority="high" />
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
                  fetchPriority="high"
                />

                <div className="or-text">or use Google Auth</div>
                <GoogleOAuthProvider clientId={clientId}>
                  <GoogleLogin onSuccess={onSuccess} onError={onFailure} />
                </GoogleOAuthProvider>
              </div>
            </div>
            <div className="save-password-button-wrapper">
              <div className="save-password-button" onClick={handleSavePasswordClick}>
                <div className="save-password-button-text">Save Password</div>
                <img className="save-password-button-icon" alt="Save Icon" src="/vector-3.svg" fetchPriority="high" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePassword;
