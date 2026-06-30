"use client";

import { React, useEffect, useState } from "react";
import "./style.css";
import Header from "../../Dashboard/Header";
import { useRouter, usePathname } from "next/navigation";
import Navigation from "../../Dashboard/Navigation";
import { CapturePrescription } from "../CapturePrescription/CapturePrescription";
import { SelectPrescription } from "../SelectPrescription/SelectPrescription";
import { getUser } from "@/lib/api";

export const UploadPrescription = ({ choosePrescription }) => {
  const [methodSelected, setMethodSelected] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [locationState, setLocationState] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("router_state");
      if (saved) setLocationState(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user.customer_id) {
      router.push("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (locationState && locationState.autoOpenSelect) {
      setMethodSelected("select-prescription");
    }
  }, [locationState]);

  const handleUploadButtonClick = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("router_state", JSON.stringify({ isUpload: true }));
    }
    router.push("/capture-prescription");
  };

  const handleOptionClick = (componentName) => {
    setMethodSelected(componentName);
  };

  return (
    <>

      {methodSelected === "upload-prescription" ? (
        <CapturePrescription
          choosePrescription={choosePrescription}
          isUpload={true}
        />
      ) : methodSelected === "capture-prescription" ? (
        <CapturePrescription
          choosePrescription={choosePrescription}
          isUpload={false}
        />
      ) : methodSelected === "select-prescription" ? (
        <SelectPrescription
          choosePrescription={choosePrescription}
          isUpload={false}
        />
      ) : (
        <>
          <div className="upload-prescription">
            <Header
              title={
                choosePrescription
                  ? "Choose Prescription"
                  : "Upload Prescription"
              }
            />
            <div className="prescription-wrapper">
              <div className="prescription-desc">
                <p>
                  Make sure the prescription you upload contains the following
                  elements
                </p>
                <div className="details">
                  <div className="detail-item">
                    <div className="detail-icon-container">
                      <img src="/doctor-details.svg" fetchpriority="high" alt="Doctor" />
                    </div>
                    <div className="detail">Doctor's details</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon-container">
                      <img src="/date-presc.png" alt="Doctor" />
                    </div>
                    <div className="detail">Prescription</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon-container">
                    <img src="/patient-details.png" alt="Doctor" />
                    </div>
                    <div className="detail">Patient's details</div>
                    
                    </div>
                    <div className="detail-item">
                    <div className="detail-icon-container">
                    <img src="/medicine-details.png" alt="Doctor" />
                    </div>
                    <div className="detail">Medicine details</div>
                    
                    </div> <div className="detail-item">
                    <div className="detail-icon-container">
                    <img src="/max-file-size.png" alt="Doctor" />
                    </div>
                    <div className="detail">Maximum file size (10MB)</div>
                    
                    </div>
                </div>
              </div>
              <div className="prescription-section">
              <div className="upload-placeholder">
              {/* <div
                  onClick={() => handleOptionClick("upload-prescription")}
                  className="option"
                >
              <img src="/choosefile.svg" fetchpriority="high" alt="Upload Icon"/>
              </div> */}
              </div>

              <div className="upload-section">
              <div className="options-section">
                <div
                  onClick={() => handleOptionClick("capture-prescription")}
                  className="option"
                >
                  <div className="icon-container">
                    <img className="icon" alt="Camera" src="/camera-1.png" />
                  </div>
                  <div className="option-label">Take a picture</div>
                </div>
                <div
                  onClick={() => handleOptionClick("upload-prescription")}
                  className="option"
                >
                  <div className="icon-container">
                    <img className="icon" alt="Gallery" src="/gallery-1.png" />
                  </div>
                  <div className="option-label">Upload prescription</div>
                </div>
                <div
                  onClick={() => handleOptionClick("select-prescription")}
                  className="option"
                >
                  <div className="icon-container">
                    <img
                      className="icon"
                      alt="Prescription"
                      src="/prescription-1-1.png"
                    />
                  </div>
                  <div className="option-label">
                    Select from your Prescriptions
                  </div>
                </div>
              </div>
            </div>

              </div>
            </div>
            <div className="landing-page">
          </div>
          </div>
          <Navigation />
        </>
      )}
    </>
  );
};
