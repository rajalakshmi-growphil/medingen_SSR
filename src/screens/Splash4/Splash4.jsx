import React from "react";
import "./style.css";
import { Helmet } from "react-helmet";

export const Splash4 = () => {
  return (
<>
 
    <div className="splash4">
      <div className="frame">
        <div className="text-wrapper">Mark as Taken</div>
        <p className="div">Once you receive the reminder, It’s our time to take care of you</p>
      </div>
      <div className="frame-wrapper">
        <div className="frame-2">
          <div className="text-wrapper-2">Get Started</div>
          <img className="img" alt="Frame" src="/frame-3016860.svg" fetchpriority="high"/>
        </div>
      </div>
      <div className="overlap">
        <div className="group">
          <div className="overlap-group">
            <div className="rectangle" />
            <div className="rectangle-2" />
          </div>
        </div>
        <div className="rectangle-3" />
        <img className="image" alt="Image" src="/image-16.png" />
        <div className="ellipse" />
        <div className="ellipse-2" />
        <div className="ellipse-3" />
        <div className="ellipse-4" />
      </div>
    </div>
    </>
  );
};
