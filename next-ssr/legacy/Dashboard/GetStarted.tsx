"use client";

import React from 'react';
import './GetStarted.css';

const GetStarted: React.FC = () => {
    const handleAppStore = () => {
        console.log("App Store Clicked");
    };

    const handlePlayStore = () => {
        window.location.href = "https://play.google.com/store/apps/details?id=in.medingen.twa";
    };

    return (
        <div className="get-started-section">
            <div className="get-started-banner">
                <div className="get-started-content">
                    <h2 className="get-started-title">
                        Download the app now!
                    </h2>

                    <p className="get-started-subtext">
                        Enjoy high-quality medicines at affordable prices delivered right to your doorstep with Medingen!
                    </p>

                    <span className="get-started-highlight">
                        Medingen - Your trusted partner for generic medicines.
                    </span>

                    <div className="get-started-buttons">
                        <img
                            src="/app-store-badge.png"
                            alt="Download on App Store"
                            className="get-started-btn"
                            onClick={handleAppStore}
                        />
                        <img
                            src="/google-play-badge.png"
                            alt="Get it on Google Play"
                            className="get-started-btn"
                            onClick={handlePlayStore}
                        />
                    </div>
                </div>

                <div className="get-started-phones desktop-only" aria-hidden="true">
                    <img
                        src="/iphone-16.svg"
                        alt="iPhone 16 App Preview"
                        className="iphone-svg no-lazy"
                    />
                </div>
            </div>
        </div>
    );
};

export default GetStarted;
