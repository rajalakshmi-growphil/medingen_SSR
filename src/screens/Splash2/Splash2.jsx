import React from "react";
import "./style.css";
import { Helmet } from "react-helmet";

export const Splash2 = () => {
  return (
<>
 
    <div className="splash-container">
      <div className="skip-container">
        <div className="skip-text">Skip</div>
        <img className="next-icon" alt="Next" src="/ooui-next-ltr.svg" fetchpriority="high" />
      </div>

       <div className="image-overlay">
        <div className="circle-group">
          <div className="circle-overlay">
            <div className="dark-circle-inner" />
          </div>
        </div>
        <div className="bottom-rectangle" />
        <img className="main-image" alt="Main visual" src="/image-10.png" />
        <div className="small-ellipse first-ellipse" />
        <div className="small-ellipse second-ellipse" />
        <div className="small-ellipse third-ellipse" />
        <img className="small-icon" alt="Small icon" src="/ellipse-4.png" />
      </div>
      <div className="text-container">
        <div className="title-text">Add your Medicine</div>
        <p className="description-text">
          Welcome to Medigen App, to get started, let's add your daily medicine
        </p>
      </div>
      <div className="next-button-wrapper">
        <div className="next-button">
          <div className="next-text">Next</div>
          <img className="next-arrow" alt="Arrow" src="/frame-3016860.svg" fetchpriority="high" />
        </div>
      </div>
    </div>
    </>
  );
};
