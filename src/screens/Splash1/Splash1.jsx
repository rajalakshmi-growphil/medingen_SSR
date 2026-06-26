import React from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../api/Api";
import { Helmet } from "react-helmet";
export const Splash1 = () => {
  const navigate = useNavigate();
  const user = getUser();
  if (user.isLoggedIn) {
    navigate("/");
  }
  return (
    <>
     
    <div className="splash-screen">
      <div className="logo-container">
        <img src="/BlackMIG.svg" fetchpriority="high" alt="Logo" className="logo" />
      </div>
    </div>
    </>
  );
};

