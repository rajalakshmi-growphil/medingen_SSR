import React, { useState } from "react";
import Swal from "sweetalert2";
import "./style.css";
import { createProfile, handleSignOut } from "../../api/Api";
import { useNavigate } from "react-router-dom";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";


export const CreateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const navigate = useNavigate();
  // Validation for name
  const validateName = (name) => {
    console.log(name);
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name || !nameRegex.test(name)) {
      Swal.fire(
        "Error",
        "Please enter your name using only letters and spaces",
        "error"
      );
      return false;
    }
    return true;
  };

  // Validation for email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Swal.fire("Error", "Please enter a valid email address", "error");
      return false;
    }
    return true;
  };

  const validateDOB = (dob) => {
    console.log(dob);
    const dobRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dobRegex.test(dob)) {
      Swal.fire("Error", "Please enter a valid date of birth (DD-MM-YYYY)", "error");
      return false;
    }
  
    const [day, month, year] = dob.split("-").map(Number);
    const date = new Date(year, month - 1, day); // Correct way to create date
  
    const isValidDate =
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day;
  
    if (!isValidDate) {
      Swal.fire("Error", "Please enter a valid date", "error");
      return false;
    }
  
    const today = new Date();
    const age = today.getFullYear() - year;
  
    if (date > today || age > 120 || age < 0) {
      Swal.fire("Error", "Please enter a reasonable date of birth", "error");
      return false;
    }
  
    return true; // Return true if validation passes
  };
  

  // Validation for state selection
  const validateState = (selectedState) => {
    if (!selectedState) {
      Swal.fire("Error", "Please select your state", "error");
      return false;
    }
    return true;
  };

  // Main input validation function
  const validateInputs = (name, email, dob, selectedState) => {
    return (
      validateName(name) &&
      validateEmail(email) &&
      validateDOB(dob) &&
      validateState(selectedState)
    );
  };

  const handleSubmit = () => {
    if (validateInputs(name, email, dob, selectedState)) {
      createProfile(
        {
          customer_name: name,
          email,
          dob,
          billing_address: address,
          state: selectedState,
          profile_picture: "default",
        },
        navigate
      );
    }
  };

const handleSignOut = () => {
  Cookies.remove('jwt_token');
  Cookies.remove('customer_name');
  Cookies.remove('email');
  Cookies.remove('customer_id');
  Cookies.remove('location');
}

  const handleLogout = () => {
    handleSignOut();
    navigate("/login");
  };

  const formatDOB = (value) => {
    value = value.replace(/\D/g, "");

    if (value.length >= 2 && value.length <= 4) {
      value = `${value.slice(0, 2)}-${value.slice(2)}`;
    } else if (value.length > 4) {
      value = `${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 8)}`;
    }

    return value;
  };

  const handleDobChange = (e) => {
    const { value } = e.target;
    setDob(formatDOB(value));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && dob.endsWith("-")) {
      setDob(dob.slice(0, -1));
      e.preventDefault();
    }
  };

  return (
    <>
    
      <div className="profile-container">
              <Header />

        <div className="header-container">
          <img className="header-icon" alt="Ellipse" src="/ellipse-159.svg" fetchpriority="high" />
          <div className="header-title">Let’s create your profile</div>
          <p className="header-subtitle">
            Fill out the details to create your profile.
          </p>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email ID</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email ID"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="text"
              value={dob}
              onChange={handleDobChange}
              onKeyDown={handleKeyDown}
              className="form-input"
              placeholder="DD-MM-YYYY"
              maxLength={10}
            />
          </div>

          {/* <div className="form-group">
          <label className="form-label">Your Address</label>
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            className="form-input" 
            placeholder="Full address"
          />
        </div> */}

          <div className="form-group">
            <label className="form-label">Select State</label>
            <input
              type="text"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="form-input"
              placeholder="State"
            />
          </div>

          <div className="form-submit">
            <button className="submit-button" onClick={handleSubmit}>
              Complete Sign-up
              <img className="submit-icon" alt="Arrow" src="/vector-3.svg" fetchpriority="high"/>
            </button>
          </div>

          <div className="create-account-section">
            <div className="create-account-text" onClick={handleLogout}>
              Logout
            </div>
          </div>

          <div className="margin-72"></div>
        </div>
        <div className="landing-page">
          </div>
      </div>
    
     
      <Navigation />
    </>
  );
};
