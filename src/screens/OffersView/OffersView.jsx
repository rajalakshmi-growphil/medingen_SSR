import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./style.css";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";

import { Helmet } from "react-helmet";

export const OffersView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const offer = location.state?.offer;

  if (!offer) {
    return <div>Offer not found</div>;
  }

  const handleGetStartedClick = () => {
    navigate('/searchbox');
  };

  // 🔽 Convert description text to list items (if it's multiline T&C)
  const renderDescription = () => {
    const lines = offer.description
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '')); // ⬅️ remove existing numbering

    if (lines.length >= 3) {
      return (
        <>
          <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Terms & Conditions:</p>
          <ol style={{ paddingLeft: "1.5rem" }}>
            {lines.map((item, index) => (
              <li key={index} style={{ marginBottom: "0.4rem", lineHeight: "1.6" }}>
                {item}
              </li>
            ))}
          </ol>
        </>
      );
    }

    return <p dangerouslySetInnerHTML={{ __html: offer.description }} />;
  };


  return (
    <>
      <div className="offers-view">
        <div className="content">
          <Header />
          <div className="content-center">
            <img
              className="rectangle"
              alt="Offer"
              src={`https://d1dh0rr5xj2p49.cloudfront.net/banner/${offer.image}`}
            />
            <div className="frame">
              <div className="div" >
                <p className="text-wrapper">{offer.title}</p>
                <div className="buy-all-your">
                  {renderDescription()}
                </div>
              </div>

            </div>
            <div className="frame-wrapper">
              <div className="frame-5" onClick={handleGetStartedClick}>
                <div className="text-wrapper-4">Get Started</div>
                <img
                  className="frame-6"
                  alt="Arrow"
                  src="/frame-3016860.svg"
                  fetchpriority="high"
                />
              </div>
            </div>
          </div>
          <div className="landing-page">
            </div>
        </div>
        <Navigation />
      </div>
    </>
  );
};
