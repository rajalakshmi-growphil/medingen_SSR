"use client";

import React, { useEffect, useState } from "react";
import "./style.css";
import { useRouter } from "next/navigation";
import { handleSignInPassword, sendOTP } from "@/lib/api";
import Splash3 from "../Splash3/Splash3";
import Swal from "sweetalert2";

export const EnterPassword = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = sessionStorage.getItem("login_phone_number");
      if (savedPhone) {
        setPhoneNumber(savedPhone);
      }
    }
  }, []);

  const handleSkip = () => {
    router.push("/");
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  const handlePasswordChange = (event: any) => {
    setPassword(event.target.value);
  };

  const handleLoginClick = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    try {
      Swal.showLoading();
      await handleSignInPassword(phoneNumber, password);
      Swal.close();
      router.push("/");
    } catch (err: any) {
      Swal.close();
      Swal.fire({
        title: 'Error!',
        text: 'Invalid password. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  };

  const handleForgotPasswordClick = async () => {
    try {
      Swal.showLoading();
      await sendOTP(phoneNumber);
      Swal.close();
      router.replace("/login2");
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Failed to send reset OTP", "error");
    }
  };

  return (
    <>
      <div className="password-container">
        <div className="login-wrapper">
          <div className="login-splash">
            <Splash3 embedded={true} avoidRedirect={true} />
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
                <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchPriority="high" />
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
                    src="/eye.svg"
                    fetchPriority="high"
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
                  src="/vector-3.svg"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnterPassword;
