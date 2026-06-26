import React, { useState, useEffect } from "react";
import "./style.css";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";
import { getUser, API_ENDPOINT, updatePassword } from "../../api/Api";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import md5 from "crypto-js/md5";
import axios from "axios";
import Swal from "sweetalert2";
import { FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";
import { useProfile } from "../../api/stateContext";

export const ChangePassword = () => {
  const navigate = useNavigate();
  const { profile, loading, refreshProfile } = useProfile();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user.isLoggedIn) {
      navigate("/login");
      return;
    }

    if (profile) {
      setUserPhone(profile.phone || "");
    } else if (!loading) {
      refreshProfile();
    }
  }, [profile, loading, refreshProfile, navigate]);

  // Validation conditions
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const allRequirementsMet = hasMinLength && hasNumber && hasSpecialChar;
  const passwordsMatch = newPassword === confirmPassword;

  const handleUpdatePassword = async () => {
    if (!userPhone) {
      Swal.fire("Error", "Profile details are loading. Please try again in a moment.", "error");
      return;
    }
    if (!oldPassword) {
      Swal.fire("Error", "Please enter your current password.", "error");
      return;
    }
    if (!allRequirementsMet) {
      Swal.fire("Error", "Please meet all password requirements.", "error");
      return;
    }
    if (!passwordsMatch) {
      Swal.fire("Error", "New Password and Confirm New Password do not match.", "error");
      return;
    }

    try {
      Swal.fire({
        title: "Updating Password...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // 1. Verify current password
      const oldPasswordHash = md5(oldPassword).toString();
      const loginResponse = await axios.post(`${API_ENDPOINT}login_password`, {
        phone_number: userPhone,
        password: oldPasswordHash,
      });

      if (loginResponse.status === 200) {
        // 2. Update to new password
        const newPasswordHash = md5(newPassword).toString();
        const updateResponse = await updatePassword(newPasswordHash);

        if (updateResponse.status === 200) {
          Swal.close();
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Password updated successfully!",
            confirmButtonText: "OK",
          }).then(() => {
            navigate("/profile");
          });
        } else {
          throw new Error("Failed to update password.");
        }
      }
    } catch (error) {
      Swal.close();
      console.error(error);
      const errorMsg =
        error.response && error.response.status === 401
          ? "Incorrect current password. Please try again."
          : "Failed to update password. Please try again.";
      Swal.fire("Error", errorMsg, "error");
    }
  };

  return (
    <>
      <div className="change-password-view">
        <Header showMobileBack={true} title="Change Password" />

        <div className="change-password-content">
          <div className="cp-form-card">
            {/* Current Password Field */}
            <div className="cp-field-group">
              <label className="cp-field-label">Current Password</label>
              <div className="cp-input-wrapper">
                <input
                  type={showOld ? "text" : "password"}
                  className="cp-field-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="cp-visibility-toggle"
                  onClick={() => setShowOld(!showOld)}
                >
                  {showOld ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="cp-field-group">
              <label className="cp-field-label">New Password</label>
              <div className="cp-input-wrapper">
                <input
                  type={showNew ? "text" : "password"}
                  className="cp-field-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="cp-visibility-toggle"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="cp-requirements-checklist">
              <div className={`cp-requirement-item ${hasMinLength ? "met" : ""}`}>
                <div className="cp-check-indicator">
                  {hasMinLength ? <FiCheck size={12} /> : null}
                </div>
                <span>At least 8 characters</span>
              </div>
              <div className={`cp-requirement-item ${hasNumber ? "met" : ""}`}>
                <div className="cp-check-indicator">
                  {hasNumber ? <FiCheck size={12} /> : null}
                </div>
                <span>At least one number</span>
              </div>
              <div className={`cp-requirement-item ${hasSpecialChar ? "met" : ""}`}>
                <div className="cp-check-indicator">
                  {hasSpecialChar ? <FiCheck size={12} /> : null}
                </div>
                <span>One special character (@, #, $, etc.)</span>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div className="cp-field-group">
              <label className="cp-field-label">Confirm New Password</label>
              <div className="cp-input-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="cp-field-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="cp-visibility-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Update Password Button */}
          <div className="cp-button-container">
            <button
              className="cp-update-button"
              onClick={handleUpdatePassword}
            >
              Update Password
            </button>
          </div>
        </div>

        <div className="margin-72"></div>
        <Navigation />
      </div>
    </>
  );
};
