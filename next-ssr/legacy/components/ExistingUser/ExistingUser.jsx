"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleLoginsendOTP } from "@/lib/api";
import Splash3 from "../Splash3/Splash3";
import "./style.css";
import { FiArrowRight } from "react-icons/fi";
import Swal from "sweetalert2";

export const ExistingUser = () => {
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

  const handlePasswordLogin = () => {
    router.push("/enterpassword");
  };

  const handleGetOtp = async () => {
    try {
      Swal.showLoading();
      await handleLoginsendOTP(phoneNumber);
      Swal.close();
      router.push("/login3");
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Failed to send OTP", "error");
    }
  };

  const handleSkip = () => {
    router.push("/");
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
                <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchPriority="high" />
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

export default ExistingUser;
