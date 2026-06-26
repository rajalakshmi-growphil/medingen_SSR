import React from 'react';
import './WhyMedingen.css';

const WhyMedingen: React.FC = () => {
    return (
        <div className="why-medingen-section">
            <div className="why-medingen">
                <h2 className="section-title-1">Why Medingen?</h2>
                <div className="section-subtitle">
                    Why More People are Switching to Medingen for Their Medicine Needs
                </div>

                <div className="why-grid">
                    <div className="why-card">
                        <div className="why-icon-wrapper">
                            <img src="/Salt-Based1.svg" alt="Medicine Finder" className="why-icon" />
                        </div>
                        <h3 className="why-card-title">Salt-Based Medicine Finder</h3>
                    </div>

                    <div className="why-card">
                        <div className="why-icon-wrapper">
                            <img src="/Comparison.svg" alt="Price Comparison" className="why-icon" />
                        </div>
                        <h3 className="why-card-title">Real Price Comparison</h3>
                    </div>

                    <div className="why-card">
                        <div className="why-icon-wrapper">
                            <img src="/Cost-Saving.svg" alt="Cost Saving" className="why-icon" />
                        </div>
                        <h3 className="why-card-title">Up to 80% Cost Saving</h3>
                    </div>

                    <div className="why-card">
                        <div className="why-icon-wrapper">
                            <img src="/Free-Delivery.svg" alt="Free Delivery" className="why-icon" />
                        </div>
                        <h3 className="why-card-title">Free Delivery Over ₹499</h3>
                    </div>

                    <div className="why-card">
                        <div className="why-icon-wrapper">
                            <img src="/Prescription.svg" alt="Prescription" className="why-icon" />
                        </div>
                        <h3 className="why-card-title">Prescription Upload Support</h3>
                    </div>

                    <div className="why-card">
                        <div className="why-icon-wrapper">
                            <img src="/Alternatives.svg" alt="Alternatives" className="why-icon" />
                        </div>
                        <h3 className="why-card-title">Generic Alternatives Shown</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhyMedingen;
