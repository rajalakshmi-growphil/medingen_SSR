import React from 'react';
import "./style.css";  




const TextBox = ({ label, type = 'text', pretext, placeholder }) => {
    return (
      <div className="text-box-container">
        {label && (
          <div className="text-box-label">
            <span>{label}</span>
          </div>
        )}
        <div className="text-box-wrapper">
          {pretext && (
            <span className="text-box-pretext">
              {pretext}
            </span>
          )}
          <input
            className="text-box-input"
            type={type}
            placeholder={placeholder}
          />
        </div>
      </div>
    );
  };
  
  export default TextBox;
  