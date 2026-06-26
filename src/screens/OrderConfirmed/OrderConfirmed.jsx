import React from "react";
import "./style.css";
import { Helmet } from "react-helmet";

export const OrderConfirmed = () => {
  return (
    <>
    
    <div className="order-confirmed">
      <div className="frame">
        <div className="group">
        </div>
      </div>
 
      <div className="frame-wrapper">
        <div className="div-wrapper">
          <div className="frame-4">
            <div className="frame-5">
              <div className="text-wrapper-2">Pay</div>
            </div>
            <img className="frame-3" alt="Frame" src="/frame-3016860.svg" fetchpriority="high" />
            </div>
        </div>
      </div>
      <div className="frame-6">
        <div className="text-wrapper-3">Order Confirmed!</div>
        <p className="p">Our Experts confirmation are done, please review your order and make payment</p>
      </div>
    </div>
    </>
  );
};
