"use client";

import React, { useState, useEffect } from "react";
import "./style.css";
import Header from "../../Dashboard/Header";
import { addToCart, getUser, listPrescriptions, requestProduct } from "@/lib/api";
import Swal from "sweetalert2";
import { useRouter, usePathname } from "next/navigation";
import withReactContent from "sweetalert2-react-content";

import Navigation from "../../Dashboard/Navigation";

const MySwal = withReactContent(Swal);

export const SelectPrescription = ({ choosePrescription }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [locationState, setLocationState] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("router_state");
      if (saved) setLocationState(JSON.parse(saved));
    }
  }, []);

  const location = { pathname, state: locationState };
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [showProceedButton, setShowProceedButton] = useState(false);
  const navigate = (path: string) => router.push(path);

  const handlePrescriptionClick = (id) => {
    setSelectedPrescriptionId(id);
  };

  const handleImageClick = (imageUrl) => {
    MySwal.fire({
      html: (
        <div style={{ position: "relative" }}>
          <img
            src={imageUrl}
            alt={imageUrl}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "100dvh",
              objectFit: "contain",
            }}
          />
        </div>
      ),
      showConfirmButton: true, // hide the default confirm button
      confirmButtonText: "Close",
      background: "white", // darker background for full screen feel
      customClass: {
        popup: "swal2-no-padding",
      },
      width: "100%",
      padding: "0",
    });
  };

  useEffect(() => {
    // check login or else redirect to search medicine page
    const user = getUser();
    if (!user.customer_id) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      Swal.showLoading();
      const data = await listPrescriptions();
      if (data.length === 0) {
        Swal.fire({
          title: "Upload your first prescription",
          text: "Upload your prescription, no need to carry it anywhere!",
          icon: "info",
          confirmButtonText: "OK",
        }).then(() => {
          // Navigate back to the previous page
          navigate(-1);
        });
        setShowProceedButton(false);
      } else {
        setPrescriptions(data);
        setShowProceedButton(true);
        Swal.close();
      }
    };

    fetchData();
  }, []);

  const handleProceed = async () => {
    if (!selectedPrescriptionId) {
      Swal.fire({
        title: "Select a Prescription",
        text: "Please select a prescription to proceed.",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    if (choosePrescription) {
      choosePrescription(selectedPrescriptionId);
      return;
    }

    const result = await Swal.fire({
      title: "Place order",
      text: "Do you want to place an order with this prescription?",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    try {
      const customerId = getUser();

      // Determine if it's from request-product
      const isRequestProduct = location.state?.from === "request-product" && location.state?.product_id;
      let requestResponse;

      if (isRequestProduct) {
        // Always add product + prescription to ProductRequest first
        requestResponse = await requestProduct(
          location.state.product_id,
          customerId.customer_id,
          selectedPrescriptionId,
          "Update"
        );

        if (!requestResponse) throw new Error("Product request failed");
      }

      if (result.isConfirmed) {
        if (isRequestProduct) {
          await addToCart(location.state.product_id, selectedPrescriptionId, 1, navigate);
        } else {
          await addToCart(null, selectedPrescriptionId, 0, navigate);
        }

        navigate("/place-order", {
          state: {
            isUpload: true,
            prescription_id: selectedPrescriptionId,
          },
        });
      } else {
        // ✅ User clicked "No" → add to cart, then go to cart page
        if (isRequestProduct) {
          await addToCart(location.state.product_id, selectedPrescriptionId, 1, navigate);
        } else {
          await addToCart(null, selectedPrescriptionId, 0, navigate);
        }
        Swal.fire({
          icon: "success",
          title: "Prescription & Product Request added",
          text: "Your prescription is linked and product is added to the cart.",
          confirmButtonText: "Okay",
        }).then(() => {
          navigate("/cart");
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    }
  };


  return (
    <>


      <div className="select-prescription">
        <Header
          title={
            choosePrescription ? "Choose Prescription" : "Select Prescription"
          }
        />
        <div className="text-wrapper">Available Records</div>
        <div className="text-head">
          <span> Select from the prescriptions you have uploaded below or  </span>
          <Link to="/capture-prescription" className="text-link">
            Capture Prescription
          </Link></div>
        {/* Flex container for prescriptions */}
        <div className="prescription-grid">
          {prescriptions.map((prescription) => (
            <div
              className={"grid-item"}
              key={prescription.prescription_id}
              onClick={() =>
                handlePrescriptionClick(prescription.prescription_id)
              }
            >
              <div className="frame-5">
                <img
                  className="rectangle-2"
                  alt={prescription.prescription_image_url}
                  src={
                    "https://d1dh0rr5xj2p49.cloudfront.net/prescription/" +
                    prescription.prescription_image_url
                  }
                  onClick={() =>
                    handleImageClick(
                      "https://d1dh0rr5xj2p49.cloudfront.net/prescription/" +
                      prescription.prescription_image_url
                    )
                  }
                />
                <div className="frame-6">
                  <input
                    type="radio"
                    name="prescription"
                    className="vector-wrapper vector"
                    checked={
                      selectedPrescriptionId === prescription.prescription_id
                    }
                    readOnly
                  />
                  <br />
                  <p className="last-purchased-may">
                    <span className="span">
                      {prescription.prescription_name}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showProceedButton && (
          <div className="button-wrapper">
            <div className="frame" onClick={handleProceed}>
              <div className="div">
                <div className="text-wrapper-2">Place order</div>
                <img className="img" alt="Frame" src="/frame-30168601.svg" fetchpriority="high" />
              </div>
            </div>
          </div>
        )}
        <div className="margin-72" />
        <div className="landing-page">
          </div>
      </div>
      <Navigation />


    </>
  );
};
