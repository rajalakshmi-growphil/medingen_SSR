"use client";

import React from "react";
import "./SubstitutionBanner.css";
import { useRouter } from "next/navigation";

const SubstitutionBanner: React.FC = () => {
  const router = useRouter();

  return (
    <div className="substitution-banner-section">
      <div className="substitution-banner-container">
        {/* LEFT */}
        <div className="sb-left-content">
          <h2 className="sb-title">Substitutes Are The Smarter Choice</h2>

          <div className="sb-features">
            <div className="sb-feature-item">
              <div className="sb-icon-wrapper">
                <img src="/rectangle-253-2.svg" alt="Safe" />
              </div>
              <div className="sb-feature-text">
                <span className="sb-feature-label">Safe</span>
                <span className="sb-feature-desc">
                  FDA And GMP Certified Medicines
                </span>
              </div>
            </div>

            <div className="sb-feature-item">
              <div className="sb-icon-wrapper">
                <img src="/rectangle-253-1.svg" alt="Same" />
              </div>
              <div className="sb-feature-text">
                <span className="sb-feature-label">Same</span>
                <span className="sb-feature-desc">
                  Exact Same Salt Composition
                </span>
              </div>
            </div>

            <div className="sb-feature-item">
              <div className="sb-icon-wrapper">
                <img src="/rectangle-253.svg" alt="Savings" />
              </div>
              <div className="sb-feature-text">
                <span className="sb-feature-label">Savings</span>
                <span className="sb-feature-desc">
                  Up To 70% To 80% Off
                </span>
              </div>
            </div>
          </div>

          <div className="sb-actions">
            <button 
              className="sb-know-more-btn"
              onClick={() => router.push("/generic-medicine-online")}
            >
              Know More
            </button>
            <button className="sb-example-btn">Example</button>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="sb-right-card">
          <div className="sb-card-content">
            <div className="sb-save-text">
              <div className="save-line-1">
                <span className="save-word">Save</span>
                <span className="upto-word">UPTO</span>
              </div>
              <div className="save-percent">70%</div>
              <div className="sb-sub-text">
                With Substitutes Medicines
              </div>
            </div>
          </div>

          <div className="sb-doctor-image">
            <img src="/dsc-6054-1.svg" alt="ceo" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionBanner;
