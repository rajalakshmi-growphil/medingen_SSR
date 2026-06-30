"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { checkCustomer, getUser, handleGoogleLogin, sendOTP } from "@/lib/api";
import "./style.css";
import { useCart } from "@/app/providers";
import Splash3 from "../Splash3/Splash3";

const clientId = "539611186698-asu4rak5figolg3eradijpp043s5di2e.apps.googleusercontent.com";

export const Login1 = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();
  const { dispatch } = useCart();

  useEffect(() => {
    dispatch({ type: "UPDATE_COUNT", payload: 0 });
    const user = getUser();
    if (user.customer_id) {
      router.push("/");
    }
  }, [dispatch, router]);

  const handleSkip = () => {
    router.push("/");
  };

  const onSuccess = async (response) => {
    const res = await handleGoogleLogin(response.credential);
    if (res && res.success) {
      router.push("/");
    } else {
      Swal.fire("Error", "Google Authentication Failed", "error");
    }
  };

  const onFailure = () => {
    console.log("Login Failed");
  };

  const handleContinue = async () => {
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
      try {
        Swal.showLoading();
        const res = await checkCustomer(phoneNumber);
        Swal.close();
        
        if (typeof window !== "undefined") {
          sessionStorage.setItem("login_phone_number", phoneNumber);
        }
        
        if (res.exists) {
          router.push("/existing");
        } else {
          await sendOTP(phoneNumber);
          router.push("/login2");
        }
      } catch (error) {
        Swal.close();
        Swal.fire({
          title: 'Error!',
          text: 'Something went wrong.',
          icon: 'error',
          confirmButtonText: 'Try again',
        });
      }
    }
  };

  return (
    <>
      <div className="login1">
        <div className="login-wrapper">
          <div className="login-splash">
            <Splash3 embedded={true} avoidRedirect={true} />
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
                <img className="ellipse" alt="Ellipse" src="/ellipse-159.svg" fetchPriority="high" />
              </div>

              <div className="input-section">
                <div className="phone-label">Phone number</div>
                <div className="input-wrapper">
                  <span>+91 - </span>
                  <input
                    className="phone-input"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter Phone Number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // allow only digits
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
                  <img className="button-icon" alt="Arrow" src="/vector-3.svg" fetchPriority="high" />
                </button>
              </div>

              <div className="continue-section">
                <img
                  className="separator"
                  alt="Separator"
                  src="/vector-179.svg"
                  fetchPriority="high"
                />

                <div className="or-text">Existing users can sign in with Google</div>
                <GoogleOAuthProvider clientId={clientId}>
                  <GoogleLogin onSuccess={onSuccess} onError={onFailure} />
                </GoogleOAuthProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
