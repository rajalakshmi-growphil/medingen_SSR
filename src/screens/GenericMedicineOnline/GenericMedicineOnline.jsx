import React, { useEffect, useState, useRef } from "react";
import "./GenericMedicineOnline.css";
import "../Dashboard/style.css";
import { DashboardHeader } from "../Dashboard/DashboardHeader";

import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { FiCheckCircle, FiShield, FiTrendingUp, FiInfo } from "react-icons/fi";
import { useLocation } from "react-router-dom";

const GenericMedicineOnline = () => {
  const [sharedSearchText, setSharedSearchText] = useState("");
  const [sharedShowDropdown, setSharedShowDropdown] = useState(false);
  const scrollContainerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="generic-page-wrapper" ref={scrollContainerRef}>
      <Helmet>
        <title>Generic Medicines Online | Quality, Affordable Healthcare - Medingen</title>
        <meta 
          name="description" 
          content="Buy affordable, FDA-approved generic medicines online at Medingen. Same salt composition, same effectiveness, up to 80% savings." 
        />
      </Helmet>

      <div className="sticky-header-container">
        <DashboardHeader 
          searchText={sharedSearchText} 
          setSearchText={setSharedSearchText} 
          showDropdown={sharedShowDropdown}
          setShowDropdown={setSharedShowDropdown}
          scrollContainerRef={scrollContainerRef}
        />
      </div>

      <main className="generic-main-content">
        {/* HERO SECTION */}
        <section className="generic-hero">
          <div className="generic-container">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="hero-text-content"
            >
              <h1 className="hero-title">Generic Medicines: <br /><span>The Smarter Way to Wellness</span></h1>
              <p className="hero-subtitle">
                High-quality healthcare shouldn't be a luxury. Discover why millions are switching to generics and saving up to 80% on their medical bills.
              </p>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-value">80%</span>
                  <span className="stat-label">Maximum Savings</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">100%</span>
                  <span className="stat-label">Same Effectiveness</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">FDA</span>
                  <span className="stat-label">Approved Standards</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="hero-overlay-gradient"></div>
        </section>

        {/* WHAT ARE GENERICS */}
        <section className="info-grid-section">
          <div className="generic-container">
            <div className="section-header text-center">
              <h2 className="section-title">What are Generic Medicines?</h2>
              <p className="section-desc">A generic medicine is a medication created to be the same as an already marketed brand-name drug in dosage form, safety, strength, route of administration, quality, performance characteristics, and intended use.</p>
            </div>

            <div className="comparison-card-group">
              <motion.div 
                whileHover={{ y: -10 }}
                className="comparison-card brand"
              >
                <div className="card-tag">Branded Medicine</div>
                <h3>Patent Protected</h3>
                <p>Manufacturers spend heavily on research, marketing, and advertising, which drives up the cost for the consumer.</p>
                <div className="price-tag high">$$$ High Cost</div>
              </motion.div>

              <div className="vs-divider">VS</div>

              <motion.div 
                whileHover={{ y: -10 }}
                className="comparison-card generic"
              >
                <div className="card-tag primary">Generic Medicine</div>
                <h3>Publicly Available</h3>
                <p>When patents expire, other companies can manufacture the same drug without the expensive initial overhead, passing savings to you.</p>
                <div className="price-tag low">$ Affordable</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE GENERICS */}
        <section className="benefits-section">
          <div className="generic-container">
            <h2 className="section-title text-center">Why Choose Generic Medicines?</h2>
            
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon-wrap">
                  <FiCheckCircle />
                </div>
                <h4>Same Active Ingredient</h4>
                <p>Generics use the exact same chemical composition as their branded counterparts, ensuring identical therapeutic effects.</p>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-wrap">
                  <FiShield />
                </div>
                <h4>Strict Quality Standards</h4>
                <p>All generic drugs must meet rigorous FDA and GMP standards for safety and quality control.</p>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-wrap">
                  <FiTrendingUp />
                </div>
                <h4>Significant Savings</h4>
                <p>By eliminating massive marketing budgets, generics cost 30% to 80% less than brand-name drugs.</p>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-wrap">
                  <FiInfo />
                </div>
                <h4>Government Recommended</h4>
                <p>Governments worldwide promote generics to make healthcare accessible and affordable for everyone.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MYTH BUSTERS */}
        <section className="myth-section">
          <div className="generic-container">
            <div className="myth-box">
              <h2 className="section-title text-white">Common Myths vs. Facts</h2>
              <div className="myth-facts-list">
                <div className="mf-item">
                  <div className="myth">Myth: Generics take longer to work.</div>
                  <div className="fact">Fact: Generics work in the exact same time as brand-name drugs.</div>
                </div>
                <div className="mf-item">
                  <div className="myth">Myth: They are "cheap" and low quality.</div>
                  <div className="fact">Fact: "Cheap" refers only to the price, not the quality. They are bio-equivalent.</div>
                </div>
                <div className="mf-item">
                  <div className="myth">Myth: My doctor only trusts brands.</div>
                  <div className="fact">Fact: Most doctors prescribe generics when available to ensure patients can afford treatment.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="generic-cta">
          <div className="generic-container text-center">
            <h2 className="cta-title">Ready to Save on Your Healthcare?</h2>
            <p className="cta-desc">Join thousands of smart shoppers who trust Medingen for high-quality generic medicines.</p>
            <div className="cta-buttons">
              <button 
                className="cta-primary-btn"
                onClick={() => window.location.href = "/searchbox"}
              >
                Search Medicines
              </button>
              <button 
                className="cta-secondary-btn"
                onClick={() => window.open("https://wa.me/917090123709")}
              >
                Talk to Pharmacist
              </button>
            </div>
          </div>
        </section>
      </main>

      </div>
  );
};

export default GenericMedicineOnline;
