import PropTypes from "prop-types";
import React from "react";
import "./iphone-pro.css";
import screenIphonePro from "./screen-iphone-12-pro.svg";
import { Helmet } from "react-helmet";

export const IphonePro = ({
  color,
  degree,
  clay,
  borderClayOnly,
  className,
  overlapGroupClassName,
  screenIphoneProClassName,
}) => {
  return (
<>

    <div className={`iphone-pro ${className}`}>
      <div className={`overlap-group ${overlapGroupClassName}`}>
        <img
          className={`screen-iphone-pro ${screenIphoneProClassName}`}
          alt="Screen iphone pro"
          src={screenIphonePro}
        />
      </div>
    </div>
    </>
  );
};

IphonePro.propTypes = {
  color: PropTypes.oneOf(["silver"]),
  degree: PropTypes.oneOf(["sixteen"]),
  clay: PropTypes.bool,
  borderClayOnly: PropTypes.bool,
  screenIphonePro: PropTypes.string,
};
