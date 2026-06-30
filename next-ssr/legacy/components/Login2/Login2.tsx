"use client";

import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import { useRouter } from "next/navigation";
import { handleSignIn, sendOTP } from "@/lib/api";
import Splash3 from "../Splash3/Splash3";
import Swal from "sweetalert2";

export const Login2 = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const timerRef = useRef<any>(null);
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

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [resendCount]);

  const startTimer = () => {
    if (resendCount < 3) {
      setResendTimer(30);
      timerRef.current = setInterval(() => {
        setResendTimer((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  const handleResendOtp = async () => {
    if (resendCount < 3) {
      setResendCount(resendCount + 1);
      try {
        await sendOTP(phoneNumber);
      } catch (err) {
        Swal.fire("Error", "Failed to send OTP", "error");
      }
    }
    if (resendCount === 2) {
      setMaxAttemptsReached(true);
    }
  };

  const handleChange = (e: any, index: number) => {
    const value = e.target.value;

    if (/^\d$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (index < otp.length - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (e: any, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        if (index > 0) {
          const prevInput = document.getElementById(`otp-${index - 1}`);
          if (prevInput) prevInput.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleFocus = (index: number) => {
    const newOtp = [...otp];
    newOtp[index] = "";
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    if (otp.some(digit => digit === "")) {
      Swal.fire("Warning", "Please enter the complete 4-digit OTP", "warning");
      return;
    }

    try {
      Swal.showLoading();
      const response = await handleSignIn(phoneNumber, otp);
      Swal.close();
      
      if (typeof window !== "undefined") {
        sessionStorage.setItem("create_password_data", JSON.stringify({
          phoneNumber,
          otp: otp.join(""),
          jwt_token: response.token,
          customer_id: response.customer_id
        }));
      }
      
      router.replace("/createpassword");
    } catch (error: any) {
      Swal.close();
      Swal.fire({
        title: "Error!",
        text: "Invalid OTP. Please try again.",
        icon: "error",
        confirmButtonText: "Try again"
      });
    }
  };

  return (
    <>
      <div className="login2">
        <div className="login-wrapper">
          <div className="login-splash">
            <Splash3 embedded={true} avoidRedirect={true} />
          </div>
          <div className="login-box">
            <div className="header">
              <div className="skip-button" onClick={handleSkip}>
                Skip
              </div>
            </div>

            <div className="text-header">
              <div className="title">
                Enter OTP <br />
                to proceed
              </div>
              <p className="subtitle">
                Enter the confirmation code sent to your registered mobile number
              </p>
              <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchPriority="high" />
            </div>

            <div className="otp-input-container">
              <div className="otp-label">One Time Password</div>
              <div className="otp-wrapper">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    className="otp-input no-arrows"
                    type="number"
                    value={digit}
                    maxLength={1}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onClick={() => handleFocus(index)}
                    placeholder="0"
                  />
                ))}
              </div>
            </div>

            {!maxAttemptsReached ? (
              <p className="resend-info">
                {resendTimer > 0 ? (
                  <>
                    Resend OTP in 00:
                    {resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                  </>
                ) : (
                  <button className="resend-button" onClick={handleResendOtp}>
                    Resend OTP
                  </button>
                )}
              </p>
            ) : (
              <p className="max-attempts-message">Maximum OTP attempts reached</p>
            )}

            <div className="verify-button-container">
              <div
                className="verify-button"
                onClick={handleVerify}
              >
                <span>Verify OTP</span>
                <img className="vector" alt="Vector" src="/vector-3.svg" fetchPriority="high" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login2;
