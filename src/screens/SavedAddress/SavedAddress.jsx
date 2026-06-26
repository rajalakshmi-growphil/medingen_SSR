import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  selectAddress,
} from "../../api/Api";
import "./style.css";
import Cookies from "js-cookie";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";

import { Helmet } from "react-helmet";

// API Endpoint for geoapify
const GEOAPIFY_API_KEY = "b7ac31a270df4a0c8a896740e2e96493";

export const SavedAddress = ({ chooseAddress }) => {
  // Accept chooseAddress as a prop
  const [addresses, setAddresses] = useState([]);
  const [currentLocation, setCurrentLocation] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      fetchSuggestions(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchAddresses = async () => {
    try {
      const fetchedAddresses = await listAddresses(navigate);
      setAddresses(fetchedAddresses || []);
    } catch (error) {
      console.error("Error fetching addresses", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to load addresses.",
        icon: "error",
        confirmButtonText: "Try again",
      });
    }
  };

  const handleVoiceClick = () => {
    Swal.fire({
      icon: "info",
      text: "Voice search feature currently not available.",
      showConfirmButton: true,
    });
  };

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await response.json();
      setSearchResults(data.features);
    } catch (error) {
      console.error("Error fetching suggestions", error);
    }
  };

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Round coords to 4 decimals (~10m accuracy, avoids pin jitter)
          const latitude = parseFloat(position.coords.latitude.toFixed(4));
          const longitude = parseFloat(position.coords.longitude.toFixed(4));

          console.log("Latitude:", latitude);
          console.log("Longitude:", longitude);

          try {
            const locationResponse = await fetch(
              `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=66d4782bb3d09960167594uts506c6d`
            );
            const locationData = await locationResponse.json();

            const city =
              locationData.address.city ||
              locationData.address.town ||
              locationData.address.village ||
              locationData.address.county ||
              locationData.address.state_district ||
              "Unknown City";

            const area =
              locationData.address.suburb ||
              locationData.address.neighbourhood ||
              locationData.address.locality ||
              locationData.address.ward ||
              locationData.address.road ||
              "Unknown Area";

            const postalCode =
              locationData.address.postcode ||
              locationData.address.postcode_ext ||
              locationData.address.neighbourhood_code ||
              locationData.address.suburb_code ||
              "Unknown Pincode";

            setCurrentLocation({
              pincode: postalCode,
              address1: `${area}, ${city}`,
              state: locationData.address.state || "Unknown State",
            });
          } catch (err) {
            console.error("Error fetching reverse geocode:", err);
          }
        },
        (error) => {
          console.error("Error obtaining location", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };


  const handleAddAddress = () => {
    navigate("/addressnew", { state: { ...currentLocation } });
  };

  const handleEditAddress = (address) => {
    navigate("/addressnew", { state: { ...address, editing: true } });
  };

  const handleDeleteAddress = async (id) => {
    // Confirm before deleting
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this address?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!confirmDelete.isConfirmed) {
      return;
    }

    try {
      const customerId = Cookies.get("customer_id");
      await deleteAddress(id, customerId, navigate);
      fetchAddresses(); // Refresh the list after deletion
      Swal.fire({
        title: "Success!",
        text: "Address deleted successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Error deleting address", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to delete address.",
        icon: "error",
        confirmButtonText: "Try again",
      });
    }
  };

  const handleSelectAddress = async (id) => {
    try {
      await selectAddress(id, navigate);
      Cookies.set("selectedAddress", id);
      Swal.fire({
        title: "Success!",
        text: "Default address updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => navigate("/"));
    } catch (error) {
      console.error("Error selecting address", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to select address.",
        icon: "error",
        confirmButtonText: "Try again",
      });
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleChooseAddress = (addressId) => {
    if (chooseAddress && typeof chooseAddress === "function") {
      chooseAddress(addressId);
    }
  };

  return (
    <>
      <Helmet>
        <title>Saved Addresses | Medingen - Quality Generic Medicines</title>
        <meta
          name="description"
          content="Manage your saved delivery addresses at Medingen. Ensure fast and accurate delivery of your generic medicines to Home, Office, or any other location."
        />
        <link rel="canonical" href="https://medingen.in/" />
      </Helmet>

      <div className="address-saved">
        <Header title={chooseAddress ? "Select Address" : "Address"} />
        <img src="/medingen-watermark-short.png" className="watermark" alt="watermark" />

        <div className="address-saved-container">
          {/* Header Row */}
          <div className="address-header-row">
            <div className="address-page-title"></div>
            <div className="add-address-btn" onClick={handleAddAddress}>
              Add Address +
            </div>
          </div>

          {/* Current Location Section */}
          <div className="current-location-card" onClick={getCurrentLocation}>
            <div className="current-location-header">
              <img className="location-icon" alt="Location" src="/location-bold.svg" />
              <span>Use Current Location</span>
            </div>

            <p className="location-text">
              {!currentLocation?.address1 && "Tap to detect location"}
              {currentLocation?.address1 &&
                `${currentLocation.address1} ${currentLocation.pincode ? currentLocation.pincode : ""}`}
            </p>

            {currentLocation?.address1 && (
              <div className="action-btn btn-select"
                style={{ width: 'fit-content', marginTop: '10px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/addressnew", {
                    state: {
                      ...currentLocation,
                      type: "home",
                      fromCurrentLocation: true,
                    },
                  })
                }}
              >
                Confirm Location
              </div>
            )}
          </div>

          {/* Saved Addresses List */}
          <div className="saved-address-list">
            {addresses.length === 0 ? (
              <div className="no-address-info">No Saved Addresses Found</div>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className="address-card">
                  <div className="address-card-header">
                    <img
                      style={{ width: '18px', height: '18px', marginRight: '8px' }}
                      alt="Type"
                      src={address.type === "home" ? "/location-bold.svg" : "/location-bold.svg"} // Using generic location icon for now or can switch based on type
                    />
                    <span className="address-type-label">{address.type}</span>
                  </div>

                  <p className="address-details" style={{ fontWeight: '600', marginBottom: '4px', color: '#333' }}>
                    {address.name}
                  </p>
                  <p className="address-details">{address.address1}</p>
                  <p className="address-details">
                    {address.state} - {address.pincode}
                  </p>
                  <p className="address-details" style={{ marginTop: '4px', color: '#666' }}>
                    Phone: {address.phone_number}
                  </p>

                  <div className="address-actions">
                    {chooseAddress ? (
                      <div className="action-btn btn-select" onClick={() => handleChooseAddress(address.id)}>
                        Select address
                      </div>
                    ) : (
                      <>
                        <div className="action-btn btn-select" onClick={() => handleSelectAddress(address.id)}>
                          Select address
                        </div>
                        <div className="action-btn btn-outline" onClick={() => handleEditAddress(address)}>
                          Edit
                        </div>
                        {/* <div className="delete-link" onClick={() => handleDeleteAddress(address.id)}>
                          Delete
                        </div> */}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        <div className="landing-page">
          </div>
      </div>
      <Navigation />
    </>
  );
};
