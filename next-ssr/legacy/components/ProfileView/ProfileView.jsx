"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./style.css";
import Navigation from "../../Dashboard/Navigation";
import Header from "../../Dashboard/Header";
import {
  getUser,
  handleSignOut,
  updateProfileData,
  uploadFile,
  sendOTP,
  getOrders,
  getRewardsSummary,
  handleGoogleLogin,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { 
  FiUser, 
  FiPackage, 
  FiMapPin, 
  FiFileText, 
  FiDatabase, 
  FiLogOut, 
  FiEdit2, 
  FiMail, 
  FiPhone, 
  FiLock, 
  FiShield, 
  FiChevronRight,
  FiCamera,
  FiShoppingBag,
  FiStar,
  FiChevronDown
} from "react-icons/fi";
import { LuCoins, LuBadgeCheck } from "react-icons/lu";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useCart, useProfile } from "@/app/providers";

const clientId = "539611186698-asu4rak5figolg3eradijpp043s5di2e.apps.googleusercontent.com";

export const ProfileView = () => {
  const { profile, loading, refreshProfile, dispatchProfile } = useProfile();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: "",
    dob: "",
    gender: "",
    blood_group: ""
  });

  const [isMobile, setIsMobile] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [availableCoins, setAvailableCoins] = useState(0);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchProfileMetrics = async () => {
      try {
        const ordersRes = await getOrders(1, "", 1);
        if (ordersRes) {
          const count = ordersRes.total_count || ordersRes.total_pages || 0;
          setTotalOrders(count);
        }
        
        const rewardsRes = await getRewardsSummary();
        if (rewardsRes && rewardsRes.available !== undefined) {
          setAvailableCoins(Math.round(parseFloat(rewardsRes.available)));
        }
      } catch (err) {
        console.error("Failed to fetch profile metrics", err);
      }
    };

    if (profile) {
      fetchProfileMetrics();
    }
  }, [profile]);

  const forceLogout = () => {
    Cookies.remove("jwt");
    Cookies.remove("customer_name");
    Cookies.remove("token");
    handleSignOut();
    router.push("/login");
  };

  const onGoogleSuccess = async (response) => {
    const res = await handleGoogleLogin(response.credential);
    if (res && res.success) {
      refreshProfile();
      router.push("/");
    } else {
      Swal.fire("Error", "Google Authentication Failed", "error");
    }
  };

  const onGoogleFailure = () => {
    Swal.fire("Error", "Google Authentication Failed", "error");
  };

  useEffect(() => {
    const user = getUser();

    if (!user.isLoggedIn) {
      forceLogout();
      return;
    }

    if (!Cookies.get("customer_name")) {
      router.push("/create-profile");
      return;
    }

    if (!profile && !loading) {
      refreshProfile();
      return;
    }

    if (loading) {
      Swal.fire({
        title: "Loading...",
        text: "Fetching profile data, please wait...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      Swal.close();
    }
  }, [loading, profile, refreshProfile]);

  const changepass = () => {
    if (profile && profile.phone) {
      sendOTP(profile.phone);
      router.push("/login2");
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDOB = (dob) => {
    const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dobRegex.test(dob)) {
      return false;
    }

    const [day, month, year] = dob.split("-").map(Number);
    const date = new Date(`${year}-${month}-${day}`);

    const isValidDate =
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day;

    if (!isValidDate) {
      return false;
    }

    const today = new Date();
    const age = today.getFullYear() - year;

    if (date > today || age > 120 || age < 0) {
      return false;
    }

    return true;
  };

  const validateCustomerName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
  };

  const handleSaveAll = async () => {
    try {
      if (!validateCustomerName(editData.customer_name)) {
        Swal.fire("Error", "Invalid name format", "error");
        return;
      }
      if (editData.dob && !validateDOB(editData.dob)) {
        Swal.fire("Error", "Invalid date of birth format (DD-MM-YYYY)", "error");
        return;
      }

      Swal.fire({
        title: "Updating...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await updateProfileData(editData);
      
      if (editData.customer_name) {
        Cookies.set("customer_name", editData.customer_name);
      }
      
      refreshProfile();
      setIsEditing(false);
      Swal.close();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDOBChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) value = `${value.slice(0, 2)}-${value.slice(2)}`;
    if (value.length >= 5) value = `${value.slice(0, 5)}-${value.slice(5, 9)}`;
    if (value.length > 10) value = value.slice(0, 10);
    setEditData({ ...editData, dob: value });
  };

  const handleLogout = () => {
    handleSignOut();
    router.push("/login");
  };

  const handleProfilePictureChange = () => {
    Swal.fire({
      title: '<h4 style="font-size: 20px;">Update your profile picture</h4>',
      html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <label for="file-upload" class="custom-file-upload" style="cursor: pointer; margin-bottom: 10px; width: 85%">
          <img src="/choosefile.svg" fetchpriority="high" alt="Upload Icon" style="width: 100%"/>
        </label>
        <input id="file-upload" type="file" accept="image/*" style="display: none;"/>
      <div style="display: flex; align-items: center; margin: 20px 0; width: 100%;">
        <hr style="flex-grow: 1; height: 1px; background-color: #ccc; border: none;"/>
        <span style="margin: 0 10px; font-size: 16px; font-weight: bold;">OR</span>
        <hr style="flex-grow: 1; height: 1px; background-color: #ccc; border: none;"/>
      </div>
      <img src="/takephoto.svg" fetchpriority="high" alt="Camera Icon" id="take-photo" style="width: 50%; cursor: pointer;"/>
      </div>
    `,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      focusConfirm: false,
      didOpen: () => {
        const fileInput = document.getElementById("file-upload");
        if (fileInput) {
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
            } else {
              Swal.showValidationMessage("No file selected");
            }
          });
        }

        const takePhotoButton = document.getElementById("take-photo");
        if (takePhotoButton) {
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
                  },
                  willClose: () => {
                    if (video.srcObject) {
                      video.srcObject.getTracks().forEach((track) => track.stop());
                    }
                  },
                });
              })
              .catch(() => {
                Swal.fire("Error", "Unable to access the camera.", "error");
              });
          });
        }
      },
    });
  };

  if (isMobile) {
    return (
      <>
        <div className="profile-view mobile">
          <Header showMobileBack={true} title="Profile" />
          
          {profile ? (
            <div className="mobile-profile-container">
              {/* Profile Card */}
              <div className="mobile-profile-card">
                <div className="mobile-avatar-section">
                  <img
                    className="mobile-avatar-img"
                    alt={profile.name}
                    src={
                      (profile.profilePicture && (profile.profilePicture.startsWith("https") || profile.profilePicture.startsWith("data:image")))
                        ? profile.profilePicture
                        : `https://d1dh0rr5xj2p49.cloudfront.net/profilepic/${profile.profilePicture || "default.png"}`
                    }
                    onClick={handleProfilePictureChange}
                    onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
                  />
                  <div className="mobile-avatar-edit-badge" onClick={handleProfilePictureChange}>
                    <FiCamera size={12} />
                  </div>
                </div>
                <div className="mobile-user-info">
                  <h2 className="mobile-user-name">{profile.name}</h2>
                  <p className="mobile-user-phone">{profile.phone}</p>
                  <Link href="/personal-info" className="mobile-update-email-link">
                    Update email ID <FiChevronRight size={14} style={{ marginLeft: 2 }} />
                  </Link>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="mobile-metrics-grid">
                <div className="mobile-metric-card">
                  <div className="mobile-metric-icon-box orders">
                    <FiShoppingBag size={20} />
                  </div>
                  <span className="mobile-metric-label">Total Orders</span>
                  <span className="mobile-metric-value">{totalOrders}</span>
                </div>
                <div className="mobile-metric-card">
                  <div className="mobile-metric-icon-box coins">
                    <FiDatabase size={20} />
                  </div>
                  <span className="mobile-metric-label">Mig Coins</span>
                  <span className="mobile-metric-value">{availableCoins}</span>
                </div>
                <div className="mobile-metric-card">
                  <div className="mobile-metric-icon-box member">
                    <FiStar size={20} />
                  </div>
                  <span className="mobile-metric-label">Member</span>
                  <span className="mobile-metric-value">Gold</span>
                </div>
              </div>

              {/* Menu List */}
              <div className="mobile-profile-menu">
                <Link href="/personal-info" className="mobile-menu-item">
                  <div className="mobile-menu-left">
                    <div className="mobile-menu-icon-wrapper">
                      <FiUser size={18} />
                    </div>
                    <span>Personal Information</span>
                  </div>
                  <FiChevronRight className="mobile-menu-chevron" size={16} />
                </Link>
                <Link href="/change-password" className="mobile-menu-item">
                  <div className="mobile-menu-left">
                    <div className="mobile-menu-icon-wrapper">
                      <FiLock size={18} />
                    </div>
                    <span>Change Password</span>
                  </div>
                  <FiChevronRight className="mobile-menu-chevron" size={16} />
                </Link>
                <Link href="/orders" className="mobile-menu-item">
                  <div className="mobile-menu-left">
                    <div className="mobile-menu-icon-wrapper">
                      <FiPackage size={18} />
                    </div>
                    <span>My Orders</span>
                  </div>
                  <FiChevronRight className="mobile-menu-chevron" size={16} />
                </Link>
                <Link href="/savedaddress" className="mobile-menu-item">
                  <div className="mobile-menu-left">
                    <div className="mobile-menu-icon-wrapper">
                      <FiMapPin size={18} />
                    </div>
                    <span>Manage Address</span>
                  </div>
                  <FiChevronRight className="mobile-menu-chevron" size={16} />
                </Link>
                <Link href="/upload-prescription" className="mobile-menu-item">
                  <div className="mobile-menu-left">
                    <div className="mobile-menu-icon-wrapper">
                      <FiFileText size={18} />
                    </div>
                    <span>Saved Prescription</span>
                  </div>
                  <FiChevronRight className="mobile-menu-chevron" size={16} />
                </Link>
                <Link href="/rewards" className="mobile-menu-item">
                  <div className="mobile-menu-left">
                    <div className="mobile-menu-icon-wrapper">
                      <FiDatabase size={18} />
                    </div>
                    <span>Mig Coins</span>
                  </div>
                  <FiChevronRight className="mobile-menu-chevron" size={16} />
                </Link>
              </div>

              {/* Footer T&C and Version */}
              <div className="mobile-profile-footer">
                <Link href="/policies-terms-and-conditions" className="mobile-footer-tc">
                  Terms & Conditions
                </Link>
                <span className="mobile-footer-version">v 8.9.1</span>
              </div>

              {/* Logout Button */}
              <button className="mobile-logout-button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading profile...</div>
          )}
          
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <div className={`profile-view`}>
        <Header />

        {profile ? (
          <div className="profile-main-layout">
            {/* Sidebar */}
            <aside className="profile-sidebar">
              <nav className="sidebar-nav">
                <button 
                  className={`sidebar-item ${activeTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('personal')}
                >
                  <FiUser className="sidebar-icon" />
                  Personal Information
                </button>
                <Link href="/orders" className="sidebar-item">
                  <FiPackage className="sidebar-icon" />
                  My Orders
                </Link>
                <Link href="/savedaddress" className="sidebar-item">
                  <FiMapPin className="sidebar-icon" />
                  Manage Addresses
                </Link>
                <Link href="/upload-prescription" className="sidebar-item">
                  <FiFileText className="sidebar-icon" />
                  Saved Prescriptions
                </Link>
                <button className="sidebar-item">
                  <FiDatabase className="sidebar-icon" />
                  Health Coins
                </button>
                
                <button className="sidebar-item logout" onClick={handleLogout}>
                  <FiLogOut className="sidebar-icon" />
                  Logout
                </button>
              </nav>
            </aside>

            {/* Main Content Area */}
            <main className="profile-content-area">
              
              {/* Header Card */}
              <div className="profile-header-card">
                <div className="user-profile-info">
                  <div className="user-avatar-wrapper">
                    <img
                      className="user-avatar-img"
                      alt={profile.name}
                      src={
                        (profile.profilePicture && (profile.profilePicture.startsWith("https") || profile.profilePicture.startsWith("data:image")))
                          ? profile.profilePicture
                          : `https://d1dh0rr5xj2p49.cloudfront.net/profilepic/${profile.profilePicture || "default.png"}`
                      }
                      onClick={handleProfilePictureChange}
                      onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
                    />
                    <div className="avatar-edit-badge" onClick={handleProfilePictureChange}>
                      <FiCamera />
                    </div>
                  </div>
                  <div className="user-text-details">
                    <h1 className="user-name-title">{profile.name}</h1>
                    <div className="user-contact-row">
                      <div className="contact-item">
                        <FiMail className="contact-icon" />
                        {profile.email}
                      </div>
                      <div className="contact-item">
                        <FiPhone className="contact-icon" />
                        {profile.phone}
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  className="edit-profile-btn"
                  onClick={() => {
                    setIsEditing(true);
                    setEditData({
                      customer_name: profile.name,
                      dob: profile.dob,
                      gender: profile.gender || "Male",
                      blood_group: profile.blood_group || "AB+"
                    });
                  }}
                >
                  <FiEdit2 />
                  Edit Profile
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="profile-metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon-box orders">
                    <FiShoppingBag />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Total Orders</span>
                    <span className="metric-value">{totalOrders}</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon-box coins">
                    <LuCoins />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">MIG Coins Balance</span>
                    <span className="metric-value">{availableCoins}<span className="metric-unit">Coins</span></span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon-box member">
                    <FiStar />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Member Status</span>
                    <span className="metric-value" style={{color: '#8359ff'}}>Gold Member</span>
                  </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <section className="info-card">
                <div className="info-header">
                  <h2 className="info-title">Personal Information</h2>
                  {isEditing ? (
                    <span className="edit-fields-link cancel" onClick={() => setIsEditing(false)}>Cancel</span>
                  ) : (
                    <span className="edit-fields-link" onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        customer_name: profile.name,
                        dob: profile.dob,
                        gender: profile.gender || "Male",
                        blood_group: profile.blood_group || "AB+"
                      });
                    }}>Edit Fields</span>
                  )}
                </div>
                <div className="info-grid">
                  <div className="info-field">
                    <label className="field-label">Full Name</label>
                    {isEditing ? (
                      <input 
                        className="field-input" 
                        value={editData.customer_name} 
                        onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })}
                        placeholder="Enter your name"
                      />
                    ) : (
                      <div className="field-input-mock">
                        {profile.name}
                      </div>
                    )}
                  </div>
                  <div className="info-field">
                    <label className="field-label">Date of Birth</label>
                    {isEditing ? (
                      <input 
                        className="field-input" 
                        value={editData.dob} 
                        onChange={handleDOBChange}
                        placeholder="DD-MM-YYYY"
                      />
                    ) : (
                      <div className="field-input-mock">
                        {profile.dob}
                      </div>
                    )}
                  </div>
                  <div className="info-field">
                    <label className="field-label">Gender</label>
                    {isEditing ? (
                      <select 
                        className="field-select" 
                        value={editData.gender} 
                        onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="field-input-mock">
                        {profile.gender || "Male"}
                        <FiChevronDown className="dropdown-arrow" />
                      </div>
                    )}
                  </div>
                  <div className="info-field">
                    <label className="field-label">Blood Group</label>
                    {isEditing ? (
                      <select 
                        className="field-select" 
                        value={editData.blood_group} 
                        onChange={(e) => setEditData({ ...editData, blood_group: e.target.value })}
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
                    ) : (
                      <div className="field-input-mock">
                        {profile.blood_group || "AB+"}
                        <FiChevronDown className="dropdown-arrow" />
                      </div>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="save-changes-container">
                    <button className="save-changes-btn" onClick={handleSaveAll}>Save Changes</button>
                  </div>
                )}
              </section>

              {/* Account Security Card */}
              <section className="info-card">
                <div className="info-header">
                  <h2 className="info-title">Account Security</h2>
                </div>
                <div className="security-list">
                  <div className="security-item">
                    <div className="security-icon-box">
                      <FiLock size={20} />
                    </div>
                    <div className="security-text">
                      <span className="security-name">Password</span>
                      <span className="security-desc">Last changed 3 months ago</span>
                    </div>
                    <button className="change-pwd-btn" onClick={changepass}>Change Password</button>
                  </div>

                  <div className="security-item">
                    <div className="security-icon-box">
                      <FiShield size={20} />
                    </div>
                    <div className="security-text">
                      <span className="security-name">Google Authentication</span>
                      <span className="security-desc">
                        {profile.google_id ? "Your Google account is connected" : "Link your Google account for easier access"}
                      </span>
                    </div>
                    {profile.google_id ? (
                      <span className="status-badge connected">Connected</span>
                    ) : (
                      <div className="google-auth-btn-wrapper">
                        <GoogleOAuthProvider clientId={clientId}>
                          <GoogleLogin 
                            onSuccess={onGoogleSuccess} 
                            onError={onGoogleFailure}
                            useOneTap
                            theme="outline"
                            shape="pill"
                            size="medium"
                            text="continue_with"
                          />
                        </GoogleOAuthProvider>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Mobile Only Links for PWA */}
              <div className="mobile-only-links">
                <Link href="/savedaddress" className="mobile-link-item">
                  <FiMapPin className="link-icon" />
                  Manage Addresses
                </Link>
                <Link href="/upload-prescription" className="mobile-link-item">
                  <FiFileText className="link-icon" />
                  Saved Prescriptions
                </Link>
                <button className="mobile-link-item logout" onClick={handleLogout}>
                  <FiLogOut className="link-icon" />
                  Logout
                </button>
              </div>
            </main>
          </div>
        ) : (<></>)}

        <div className="landing-page">
          </div>
      </div>
      <Navigation />
    </>
  );
};
