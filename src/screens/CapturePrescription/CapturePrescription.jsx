import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import "./style.css";
import Header from "../Dashboard/Header";
import { uploadFile, updatePrescription, addToCart, getUser, requestProduct } from "../../api/Api";

import Navigation from "../Dashboard/Navigation";

export const CapturePrescription = ({
  choosePrescription,
  isUpload = false,
}) => {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for file input
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploadE, setIsUpload] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // Default to front camera
  const [isCameraActive, setIsCameraActive] = useState(true); // Control camera state

  const location = useLocation();
  const { product_id } = location.state || {}
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's state passed from the Link
    if (isUpload) {
      setIsUpload(true);
      handleUploadButtonClick();
    }
  }, [isUpload]);

  const handleUploadComplete = () => {
    navigate("/upload-prescription");
  };

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    triggerNameAlert(imageSrc,location.state?.from);
  };

  const triggerNameAlert = (imageSrc, from = null) => {
    Swal.fire({
      title: "",
      input: "text",
      inputLabel: "Prescription Name",
      inputPlaceholder: "Enter a name",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Processing...",
        text: "Please wait while we upload your image.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const prescriptionName = result.value;

        // Convert base64 image to Blob
        const blob = await fetch(imageSrc).then((res) => res.blob());

        // Upload file
        const fileName = await uploadFile(blob, "prescription");
        if (!fileName) throw new Error("File upload failed");

        // Save prescription
        const updateResult = await updatePrescription(
          fileName,
          prescriptionName,
          new Date().toISOString().split("T")[0],
          product_id   // ✅ fallback logic
        );

        if (!updateResult) throw new Error("Failed to save prescription");

        const prescriptionId = updateResult.prescription_id;

        // ✅ If a prescription selector function is passed → use it
        if (choosePrescription) {
          choosePrescription(prescriptionId);
          Swal.close();
          return;
        }

        // ✅ If this came from request-product
        if (from === "request-product" && product_id) {
          const customerId = getUser();

          // First request the product
          const requestResponse = await requestProduct(
            product_id,              // ✅ always product.product_id
            customerId.customer_id,
            prescriptionId
          );
          if (!requestResponse?.request_id) throw new Error("Product request failed");

          // Then add product + prescription to cart
          const cartResponse = await addToCart(product_id, prescriptionId, 1, navigate);
          if (!cartResponse?.cart_items) throw new Error("Failed to add product to cart");

          Swal.fire({
            icon: "success",
            title: "Prescription & Product Request added",
            text: "Your prescription is linked and product is added to the cart.",
            confirmButtonText: "Okay",
          }).then(() => {
            navigate("/cart");
          });

          return; // stop here
        }

        // ✅ Otherwise normal flow (not request-product)
        Swal.fire({
          title: "Prescription uploaded successfully",
          text: "Your prescription has been saved.",
          icon: "success",
          confirmButtonText: "Okay",
        }).then(() => {
          navigate("/upload-prescription", { state: { autoOpenSelect: true } });
        });
      } catch (error) {
        console.error(error);
        Swal.fire("Error", error.message, "error");
      }
    });
  };




  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(URL.createObjectURL(selectedFile));
      triggerNameAlertForFile(selectedFile, product_id, location.state?.from);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };


  const triggerNameAlertForFile = (file, product, from) => {
    Swal.fire({
      title: "",
      input: "text",
      inputLabel: "Prescription Name",
      inputPlaceholder: "Enter the name",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Processing...",
        text: "Please wait while we upload your prescription.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const prescriptionName = result.value;
        const fileName = await uploadFile(file, "prescription");

        if (!fileName) throw new Error("File upload failed");

        const customerId = getUser();
        const updateResult = await updatePrescription(
          fileName,
          prescriptionName,
          new Date().toISOString().split("T")[0]
        );

        if (!updateResult) throw new Error("Failed to save prescription");

        const prescriptionId = updateResult.prescription_id;

        // 🔹 If we came from request-product → also add product request + cart
        if (from === "request-product" && product) {
          const requestResponse = await requestProduct(
            product_id,
            customerId.customer_id,
            prescriptionId
          );
          if (!requestResponse?.request_id) throw new Error("Product request failed");

          const cartResponse = await addToCart(product_id, prescriptionId, 1, navigate);
          if (!cartResponse?.cart_items) throw new Error("Failed to add to cart");

          Swal.fire({
            icon: "success",
            title: "Prescription & Product Request added",
            text: "Your prescription is linked and product is added to the cart.",
            confirmButtonText: "Okay",
          }).then(() => {
            navigate("/cart"); // go to cart page or keep user on prescription page
          });
        } else {
          // 🔹 Normal prescription upload flow
          Swal.fire({
            title: "Prescription uploaded successfully",
            text: "Your prescription has been saved.",
            icon: "success",
            confirmButtonText: "Okay",
          }).then(() => {
            navigate("/upload-prescription", { state: { autoOpenSelect: true } });
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", error.message, "error");
      }
    });
  };


  const handleback = () => {
    navigate(-1, { replace: true });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
        setIsCameraActive(false); // Unmount the webcam component
      } else {
        startCamera();
        setIsCameraActive(true); // Remount the webcam component

      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.video) {
      const stream = webcamRef.current.video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const startCamera = () => {
    // You don't need to manually start it again, React-Webcam will handle it when the component is mounted.
  };

  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  return (
    <>

      <div className="capture-prescription">
        <Header
          title={
            choosePrescription ? "Choose Prescription" : "Capture Prescription"
          }
        />
        <div className="cam">
          {!isUploadE && (
            isCameraActive && (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                height="100%"
                videoConstraints={{ facingMode }}
              />
            )
          )}
        </div>
        <div className="controls">
          <div className="line-system-upload-wrapper">
            <img
              className="img"
              alt="Line system upload"
              src="/switch-camera.png"
              onClick={switchCamera}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          {!isUploadE && (
            <div className="capture-button" onClick={captureImage}>
              <div className="ellipse" />
              <div className="ellipse-2" />
            </div>
          )}
          <div className="line-system-close-wrapper" onClick={handleback}>
            <img
              className="img"
              alt="Line system close"
              src="/line-system-close-circle.svg"
              fetchpriority="high"
            />
          </div>
        </div>
        <div className="landing-page">
          </div>
      </div>
    </>
  );
};
