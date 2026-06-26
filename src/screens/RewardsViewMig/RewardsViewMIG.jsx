import React from "react";
import "./style.css";
import { Helmet } from "react-helmet";

export const RewardsViewMIG = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
<>
  
    <div className="mig-migbox">
      <div className="mig-group">
        <div className="mig-overlap">
          <img
            className="mig-img"
            alt="Close button"
            src="/group-3016898.png"
            onClick={onClose}
          />

          <div className="top-box">
            <div className="mig-group-3">
              <div className="mig-overlap-group">
                <div className="mig-text-wrapper-11">MIG</div>
              </div>
            </div>
            <div className="mig-content-wrapper">
              <div className="mig-text-wrapper">{transaction.description}</div>
              <div className="mig-date-time">
                <div className="mig-text-wrapper-2">{transaction.date}</div>
                <div className="mig-text-wrapper-3">{transaction.time}</div>
              </div>
            </div>
          </div>

          <div className="mig-div-wrapper">
            <div className="mig-frame-6">
              <div className="mig-frame-7">
                <img className="mig-image" alt="Image" src="/image2.svg" fetchpriority="high" />
                <div className="mig-text-wrapper-9">Coins</div>
              </div>
              <div className="mig-text-wrapper-10">{transaction.reward}</div>
            </div>
          </div>

          <div className="mig-frame-8">
            <div className="mig-frame-9">
              <div className="mig-text-wrapper-12">Transaction Amount</div>
              <div className="mig-text-wrapper-9">MIG Coins percentage</div>
              <div className="mig-text-wrapper-9">MIG Coins credited</div>
            </div>
            <div className="mig-frame-10">
              <div className="mig-text-wrapper-12">{transaction.amount}</div>
              <div className="mig-text-wrapper-9">{transaction.percentage}</div>
              <div className="mig-text-wrapper-9">{transaction.reward}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
