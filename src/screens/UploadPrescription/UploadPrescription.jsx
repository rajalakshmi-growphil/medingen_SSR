import { React, useEffect, useState } from "react";
import "./style.css";
import Header from "../Dashboard/Header";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navigation from "../Dashboard/Navigation";
import { CapturePrescription } from "../CapturePrescription/CapturePrescription";
import { SelectPrescription } from "../SelectPrescription/SelectPrescription";
import { getUser } from "../../api/Api";

import { Helmet } from "react-helmet";

export const UploadPrescription = ({ choosePrescription }) => {
  const [methodSelected, setMethodSelected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // check login or else redirect to search medicine page
    const user = getUser();
    if (!user.customer_id) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state && location.state.autoOpenSelect) {
      setMethodSelected("select-prescription");
    }
  }, [location.state]);

  const handleUploadButtonClick = () => {
    navigate("/capture-prescription", { state: { isUpload: true } });
  };

  const handleOptionClick = (componentName) => {
    setMethodSelected(componentName);
  };

  return (
    <>
   <Helmet>
     <meta title="Buy Generic Medicines Online | Trusted Store - Medingen" />
 
  <meta
    name="description"
    content="Medingen offers affordable generic medicines and fast doorstep delivery across India. Shop online for trusted and quality healthcare products."
  />
  <link rel="canonical" href="https://medingen.in/" />
</Helmet>
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
