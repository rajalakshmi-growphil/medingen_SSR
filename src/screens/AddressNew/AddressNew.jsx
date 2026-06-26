import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Swal from "sweetalert2"; // Ensure Swal is imported for consistent use with API feedback
import {
  addAddress,
  updateAddress,
  deleteAddress,
  selectAddress,
} from "../../api/Api"; // Import API functions from the correct path
import "./style.css";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";


export const AddressNew = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract address data from location state
  const addressData = location.state || {};
  const {
    id,
    type,
    name,
    address1,
    pincode,
    state: initialState,
    editing,
    phone_number,
  } = addressData;

  // State for form fields
  const [formType, setFormType] = useState(type || "");
  const [formName, setFormName] = useState(name || "");
  const [formAddress1, setFormAddress1] = useState(address1 || "");
  const [formPincode, setFormPincode] = useState(pincode || "");
  const [formState, setFormState] = useState(initialState || "");
  const [formPhoneNumber, setFormPhoneNumber] = useState(phone_number || "");

  const [formDoorNo, setFormDoorNo] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formCity, setFormCity] = useState("");
  const [errors, setErrors] = useState({});
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [postOffices, setPostOffices] = useState([]);
  const [formLocality, setFormLocality] = useState("");

  useEffect(() => {
    if (formAddress1) {
      const parts = formAddress1
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (parts.length >= 4) {
        setFormDoorNo(parts[0] || "");
        const city = parts.pop();
        const locality = parts.pop();
        setFormCity(city || "");
        setFormLocality(locality || "");
        setFormStreet(parts.slice(1).join(", ") || "");
      } else if (parts.length === 3) {
        // Handle legacy: DoorNo, Street, City
        setFormDoorNo(parts[0] || "");
        setFormStreet(parts[1] || "");
        setFormCity(parts[2] || "");
        setFormLocality("");
      } else {
        // Fallback for unexpected formats
        setFormDoorNo(parts[0] || "");
        setFormStreet(parts.slice(1).join(", ") || "");
      }
    }
  }, [formAddress1]);

  // Handle state change
  const handleStateChange = (event) => {
    setFormState(event.target.value);
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!formName) {
      newErrors.formName = true;
      isValid = false;
    }

    if (!formDoorNo) {
      newErrors.formDoorNo = true;
      isValid = false;
    }

    if (!formStreet) {
      newErrors.formStreet = true;
      isValid = false;
    }

    if (!formCity) {
      newErrors.formCity = true;
      isValid = false;
    }

    if (postOffices.length > 0 && !formLocality) {
      newErrors.formLocality = true;
      isValid = false;
    }

    if (!formPincode || formPincode.length !== 6) {
      newErrors.formPincode = true;
      isValid = false;
    }

    if (!formState) {
      newErrors.formState = true;
      isValid = false;
    }

    if (!formType) {
      newErrors.formType = true;
      isValid = false;
    }

    if (!formPhoneNumber || formPhoneNumber.length !== 10) {
      newErrors.formPhoneNumber = true;
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill in all mandatory fields correctly (highlighted in red).",
        icon: "info",
        confirmButtonText: "OK",
      });
    }

    return isValid;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Trim trailing commas and spaces from user inputs to prevent double commas
    const cleanDoorNo = formDoorNo.replace(/,\s*$/, "").trim();
    const cleanStreet = formStreet.replace(/,\s*$/, "").trim();

    // Construct address by joining non-empty parts with a single comma and space
    const constructedAddress1 = [
      cleanDoorNo,
      cleanStreet,
      formLocality,
      formCity,
    ]
      .filter((p) => p && p.trim().length > 0)
      .join(", ");

    const updatedAddress = {
      id,
      type: formType,
      name: formName,
      address1: constructedAddress1,
      pincode: formPincode,
      state: formState,
      phone_number: formPhoneNumber,
    };

    try {
      if (editing) {
        await updateAddress(id, updatedAddress, navigate);
      } else {
        await addAddress(updatedAddress, navigate);
      }

      navigate("/savedaddress");
    } catch (error) {
      await Swal.fire({
        title: "Error",
        text: "Something went wrong. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // Handle delete address
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the address permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const customerId = Cookies.get("customer_id");
      await deleteAddress(id, customerId, navigate);
      navigate("/savedaddress");
    }
  };

  // Handle select address
  const handleSelect = async () => {
    await selectAddress(id, navigate);
  };
  const fetchCityState = async () => {
    if (formPincode.length !== 6) return;

    setIsFetchingPincode(true);
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${formPincode}`
      );
      const data = await res.json();

      if (
        data[0]?.Status === "Success" &&
        data[0]?.PostOffice?.length
      ) {
        const offices = data[0].PostOffice;
        setPostOffices(offices);

        const firstPO = offices[0];
        setFormCity(firstPO.District);
        setFormState(firstPO.State);

        // If only 1 post office, auto-select it
        if (offices.length === 1) {
          setFormLocality(firstPO.Name);
          setErrors((prev) => ({ ...prev, formLocality: false }));
        } else {
          // If editing and previously selected locality is in the new list, keep it
          const currentLoc = offices.find(po => po.Name === formLocality);
          if (!currentLoc) {
            setFormLocality(""); // Clear if not matching or multiple available
          }
        }

        // Clear errors for auto-filled/validated fields
        setErrors((prev) => ({
          ...prev,
          formCity: false,
          formState: false,
          formPincode: false,
        }));
      } else {
        setPostOffices([]);
        setFormLocality("");
      }
    } catch (err) {
      console.error("Pincode lookup failed");
      setPostOffices([]);
    } finally {
      setIsFetchingPincode(false);
    }
  };

  useEffect(() => {
    fetchCityState();
  }, [formPincode]);

  return (
    <>
      <div className="address-new">

        <Header title={editing ? "Edit Address" : "New Address"} />
        <img src="/medingen-watermark-short.png" className="watermark" alt="watermark" />

        <div className="address-content">

          <div className="address-form-card">

            <div className="nickname-section">
              <span className="section-label">Type <span style={{ color: 'red' }}>*</span></span>
              <div className={`radio-group ${errors.formType ? "error-border" : ""}`}>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="addressType"
                    value="home"
                    checked={formType === "home"}
                    onChange={() => {
                      setFormType("home");
                      setErrors((prev) => ({ ...prev, formType: false }));
                    }}
                    className="radio-input"
                  />
                  <div className="radio-button-custom">Home</div>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="addressType"
                    value="office"
                    checked={formType === "office"}
                    onChange={() => {
                      setFormType("office");
                      setErrors((prev) => ({ ...prev, formType: false }));
                    }}
                    className="radio-input"
                  />
                  <div className="radio-button-custom">Office</div>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="addressType"
                    value="other"
                    checked={formType === "other"}
                    onChange={() => {
                      setFormType("other");
                      setErrors((prev) => ({ ...prev, formType: false }));
                    }}
                    className="radio-input"
                  />
                  <div className="radio-button-custom">Other</div>
                </label>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="name">
                Full Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="name"
                placeholder="Full Name (e.g., Rahul Sharma, John Doe)"
                className={`input-field ${errors.formName ? "has-error" : ""}`}
                value={formName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setFormName(val);
                  setErrors((prev) => ({ ...prev, formName: false }));
                }}
              />
            </div>

            <div className="form-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label" htmlFor="doorNo">
                  Flat / House / Door No <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  id="doorNo"
                  placeholder="Door No (e.g., 402, 12-A)"
                  className={`input-field ${errors.formDoorNo ? "has-error" : ""}`}
                  value={formDoorNo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/,,+/g, ",");
                    setFormDoorNo(val);
                    setErrors((prev) => ({ ...prev, formDoorNo: false }));
                  }}
                />
              </div>
              <div className="input-group" style={{ flex: 2 }}>
                <label className="input-label" htmlFor="street">
                  Street / Area <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  id="street"
                  placeholder="Street / Area (e.g., Park Avenue, Anna Nagar)"
                  className={`input-field ${errors.formStreet ? "has-error" : ""}`}
                  value={formStreet}
                  onChange={(e) => {
                    const val = e.target.value.replace(/,,+/g, ",");
                    setFormStreet(val);
                    setErrors((prev) => ({ ...prev, formStreet: false }));
                  }}
                />
              </div>
            </div>

            {postOffices.length > 0 && (
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label" htmlFor="locality">
                    Locality / Town <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    id="locality"
                    className={`input-field select-input ${errors.formLocality ? "has-error" : ""}`}
                    value={formLocality}
                    onChange={(e) => {
                      setFormLocality(e.target.value);
                      setErrors((prev) => ({ ...prev, formLocality: false }));
                    }}
                  >
                    <option value="">-- Select Locality --</option>
                    {postOffices.map((po, index) => (
                      <option key={index} value={po.Name}>
                        {po.Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="pincode">
                  Pincode <span style={{ color: 'red' }}>*</span>
                </label>
                <div className="pincode-input-wrapper">
                  <input
                    type="text"
                    id="pincode"
                    placeholder="Pincode (e.g., 600001, 110001)"
                    className={`input-field ${errors.formPincode ? "has-error" : ""}`}
                    value={formPincode}
                    maxLength={6}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormPincode(val);
                      setErrors((prev) => ({ ...prev, formPincode: false }));
                    }}
                  />
                  {isFetchingPincode && (
                    <div className="pincode-loader">
                      <div className="spinner"></div>
                    </div>
                  )}
                  {!isFetchingPincode && formPincode.length === 6 && (
                    <div className="pincode-status">
                      <span
                        className="reload-icon"
                        title="Re-fetch city/state"
                        onClick={fetchCityState}
                        style={{ cursor: 'pointer' }}
                      ></span>
                    </div>
                  )}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="city">
                  City <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  placeholder="e.g. Bangalore"
                  className={`input-field ${errors.formCity ? "has-error" : ""}`}
                  value={formCity}
                  readOnly
                />
              </div>

            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="state">
                  State <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  placeholder="e.g. Karnataka"
                  className={`input-field ${errors.formState ? "has-error" : ""}`}
                  value={formState}
                  readOnly
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="phone_number">
                  Phone Number <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  placeholder="Phone Number (e.g., 9876543210, 8123456789)"
                  className={`input-field ${errors.formPhoneNumber ? "has-error" : ""}`}
                  value={formPhoneNumber}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFormPhoneNumber(val);
                    setErrors((prev) => ({ ...prev, formPhoneNumber: false }));
                  }}
                />
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={handleSave} className="action-button save-button">
                {editing ? "Save Changes" : "Save Address"}
              </button>

              {editing && (
                <div className="secondary-actions">
                  <button
                    onClick={handleDelete}
                    className="action-button delete-button"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleSelect}
                    className="action-button select-button"
                  >
                    Set Default
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="margin-bottom"></div>
        </div>
        <div className="landing-page">
          </div>
      </div>
      <Navigation />
    </>
  );
};
