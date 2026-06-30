import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./style.css";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";
import { useProfile } from "../../api/stateContext";
import { updateProfileData, getUser, uploadFile } from "../../api/Api";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FiLock, FiCamera } from "react-icons/fi";

export const PersonalInfo = () => {
  const { profile, loading, refreshProfile, dispatchProfile } = useProfile();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: "",
    email: "",
    dob: "",
    gender: "Male",
    blood_group: "AB+",
  });

  useEffect(() => {
    const user = getUser();
    if (!user.isLoggedIn) {
      navigate("/login");
      return;
    }
    if (profile) {
      setFormData({
        customer_name: profile.name || "",
        email: profile.email || "",
        dob: profile.dob || "",
        gender: profile.gender || "Male",
        blood_group: profile.blood_group || "AB+",
      });
    }
  }, [profile, navigate]);

  const validateCustomerName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDOB = (dob) => {
    if (!dob) return true;
    const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dobRegex.test(dob)) return false;

    const [day, month, year] = dob.split("-").map(Number);
    const date = new Date(`${year}-${month}-${day}`);
    const isValidDate =
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day;

    if (!isValidDate) return false;

    const today = new Date();
    const age = today.getFullYear() - year;
    if (date > today || age > 120 || age < 0) return false;

    return true;
  };

  const handleDOBChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) value = `${value.slice(0, 2)}-${value.slice(2)}`;
    if (value.length >= 5) value = `${value.slice(0, 5)}-${value.slice(5, 9)}`;
    if (value.length > 10) value = value.slice(0, 10);
    setFormData({ ...formData, dob: value });
  };

  const handleProfilePictureChange = () => {
    Swal.fire({
      title: '<h4 style="font-size: 20px;">Update your profile picture</h4>',
      html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <label for="file-upload-pi" class="custom-file-upload" style="cursor: pointer; margin-bottom: 10px; width: 85%">
          <img src="/choosefile.svg" fetchpriority="high" alt="Upload Icon" style="width: 100%"/>
        </label>
        <input id="file-upload-pi" type="file" accept="image/*" style="display: none;"/>
      <div style="display: flex; align-items: center; margin: 20px 0; width: 100%;">
        <hr style="flex-grow: 1; height: 1px; background-color: #ccc; border: none;"/>
        <span style="margin: 0 10px; font-size: 16px; font-weight: bold;">OR</span>
        <hr style="flex-grow: 1; height: 1px; background-color: #ccc; border: none;"/>
      </div>
      <img src="/takephoto.svg" fetchpriority="high" alt="Camera Icon" id="take-photo-pi" style="width: 50%; cursor: pointer;"/>
      </div>
    `,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      focusConfirm: false,
      didOpen: () => {
        const fileInput = document.getElementById("file-upload-pi");
        fileInput.addEventListener("change", () => {
          const file = fileInput.files[0];
          if (file) {
            Swal.showLoading();
            const reader = new FileReader();
            reader.onload = (e) => {
              dispatchProfile({
                type: "SET_PROFILE",
                payload: { ...profile, profilePicture: e.target.result }
              });
            };
            reader.readAsDataURL(file);
            uploadFile(file, "profilepic");
            Swal.close();
          }
        });

        const takePhotoButton = document.getElementById("take-photo-pi");
        takePhotoButton.addEventListener("click", () => {
          const constraints = { video: true };
          navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
              const video = document.createElement("video");
              video.style.width = "100%";
              video.srcObject = stream;
              video.play();

              const vdiv = document.createElement("div");
              vdiv.style.width = "100%";
              vdiv.style.display = "flex";
              vdiv.style.justifyContent = "center";
              vdiv.appendChild(video);

              Swal.fire({
                title: "Take a photo",
                html: vdiv,
                confirmButtonText: "Capture",
                showCancelButton: true,
                cancelButtonText: "Cancel",
                preConfirm: async () => {
                  Swal.showLoading();
                  const canvas = document.createElement("canvas");
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  canvas.getContext("2d").drawImage(video, 0, 0);
                  const imageData = canvas.toDataURL("image/png");
                  video.srcObject.getTracks().forEach((track) => track.stop());

                  function dataURLToBlob(dataUrl) {
                    const arr = dataUrl.split(",");
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while (n--) {
                      u8arr[n] = bstr.charCodeAt(n);
                    }
                    return new Blob([u8arr], { type: mime });
                  }

                  const blob = dataURLToBlob(imageData);
                  const file = new File([blob], "profilepic.png", {
                    type: "image/png",
                  });

                  dispatchProfile({
                    type: "SET_PROFILE",
                    payload: { ...profile, profilePicture: imageData }
                  });

                  await uploadFile(file, "profilepic");
                  Swal.close();
                },
                willClose: () => {
                  video.srcObject.getTracks().forEach((track) => track.stop());
                },
              });
            })
            .catch(() => {
              Swal.fire("Error", "Unable to access the camera.", "error");
            });
        });
      },
    });
  };

  const handleSaveChanges = async () => {
    try {
      if (!validateCustomerName(formData.customer_name)) {
        Swal.fire("Error", "Invalid name format. Only letters and spaces are allowed.", "error");
        return;
      }
      if (formData.email && !validateEmail(formData.email)) {
        Swal.fire("Error", "Invalid email format.", "error");
        return;
      }
      if (formData.dob && !validateDOB(formData.dob)) {
        Swal.fire("Error", "Invalid date of birth format (DD-MM-YYYY).", "error");
        return;
      }

      Swal.fire({
        title: "Saving Changes...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await updateProfileData(formData);
      
      if (formData.customer_name) {
        Cookies.set("customer_name", formData.customer_name);
      }
      
      refreshProfile();
      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Profile updated successfully!",
        confirmButtonText: "OK"
      }).then(() => {
        navigate("/profile");
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to update profile. Please try again.", "error");
    }
  };

  return (
    <>
      <div className="personal-info-view">
        <Header showMobileBack={true} title="Personal Information" />
        
        {profile ? (
          <div className="personal-info-container">
            {/* Avatar Section */}
            <div className="pi-avatar-container">
              <div className="pi-avatar-wrapper">
                <img
                  className="pi-avatar-img"
                  alt={profile.name}
                  src={
                    (profile.profilePicture && (profile.profilePicture.startsWith("https") || profile.profilePicture.startsWith("data:image")))
                      ? profile.profilePicture
                      : `https://d1dh0rr5xj2p49.cloudfront.net/profilepic/${profile.profilePicture || "default.png"}`
                  }
                  onClick={handleProfilePictureChange}
                  onError={(e) => { e.target.src = "/default-avatar.png"; }}
                />
                <div className="pi-avatar-edit-badge" onClick={handleProfilePictureChange}>
                  <FiCamera size={14} />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="pi-form-fields">
              <div className="pi-field-group">
                <label className="pi-field-label">Full Name</label>
                <input
                  type="text"
                  className="pi-field-input"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>

              <div className="pi-field-group">
                <label className="pi-field-label">Mobile Number</label>
                <div className="pi-input-wrapper-disabled">
                  <input
                    type="text"
                    className="pi-field-input disabled"
                    value={profile.phone || ""}
                    disabled
                  />
                  <FiLock className="pi-lock-icon" size={16} />
                </div>
              </div>

              <div className="pi-field-group">
                <label className="pi-field-label">Email Address</label>
                <input
                  type="email"
                  className="pi-field-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div className="pi-field-group">
                <label className="pi-field-label">Date of Birth</label>
                <input
                  type="text"
                  className="pi-field-input"
                  value={formData.dob}
                  onChange={handleDOBChange}
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div className="pi-field-group">
                <label className="pi-field-label">Gender</label>
                <select
                  className="pi-field-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pi-field-group">
                <label className="pi-field-label">Blood Group</label>
                <select
                  className="pi-field-select"
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Save Changes Button */}
            <div className="pi-button-container">
              <button className="pi-save-button" onClick={handleSaveChanges}>
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading personal details...</div>
        )}
        
        <div className="margin-72"></div>
        <Navigation />
      </div>
    </>
  );
};
