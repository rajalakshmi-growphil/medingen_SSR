"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./style.css";
import Header from "../../Dashboard/Header";
import Navigation from "../../Dashboard/Navigation";
import { MdCheckCircle } from "react-icons/md";

export const OffersView = () => {
  const router = useRouter();
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("viewing_offer");
      if (saved) {
        setOffer(JSON.parse(saved));
      }
    }
  }, []);

  if (!offer) {
    return <div style={{ textAlign: "center", padding: "100px", fontFamily: "Outfit, sans-serif" }}>Loading Offer...</div>;
  }

  const handleGetStartedClick = () => {
    router.push('/searchbox');
  };

  const renderDescription = () => {
    const lines = (offer.description || "")
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => line.replace(/^\d+\.\s*/, ''));

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
                  fetchPriority="high"
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

export default OffersView;
