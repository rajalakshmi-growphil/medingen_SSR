import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import { useLocation, useNavigate } from "react-router-dom";
import { handleSignIn, sendOTP } from "../../api/Api";
import Splash3 from "../Splash3/Splash3";
import { Helmet } from "react-helmet";

export const Login2 = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const timerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const handleSkip = () => {
    navigate("/");
  };

  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (location.state && location.state.phoneNumber) {
      setPhoneNumber(location.state.phoneNumber);
    }
  }, [location]);

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

  const handleResendOtp = () => {
    if (resendCount < 3) {
      setResendCount(resendCount + 1);
      sendOTP(phoneNumber, navigate);
    }
    if (resendCount === 2) {
      setMaxAttemptsReached(true);
    }
  };

  const handleChange = (e, index) => {
    const value = e.target.value;

    if (/^\d$/.test(value)) {
      let newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (index < otp.length - 1) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        if (index > 0) {
          document.getElementById(`otp-${index - 1}`).focus();
          let newOtp = [...otp];
          newOtp[index - 1] = ""; // Clear the previous input
          setOtp(newOtp);
        }
      } else {
        let newOtp = [...otp];
        newOtp[index] = ""; // Clear the current input
        setOtp(newOtp);
      }
    }
  };

  const handleFocus = (index) => {
    let newOtp = [...otp];
    newOtp[index] = ""; // Clear the current input field
    setOtp(newOtp);
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
              <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchpriority="high" />
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
                    maxLength="1"
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
                onClick={() => {
                  handleSignIn(phoneNumber, otp, navigate);
                }}
              >
                <span>Verify OTP</span>
                <img className="vector" alt="Vector" src="/vector-3.svg" fetchpriority="high" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
