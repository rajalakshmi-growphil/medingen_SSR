import React from "react";
import { FiCheck, FiPackage, FiTruck, FiMapPin, FiHome, FiFileText, FiThumbsUp } from "react-icons/fi";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return { date: "--", time: "--" };
  const dateObj = new Date(timestamp);
  if (isNaN(dateObj.getTime())) return { date: "--", time: "--" };
  const day = dateObj.getDate().toString().padStart(2, "0");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const strTime = hours.toString().padStart(2, "0") + ":" + minutes + " " + ampm;
  
  return { date: `${day} ${month}, ${year}`, time: strTime };
};

const STEPS = [
  { label: "Order Placed", icon: <FiCheck /> },
  { label: "Order Confirmed", icon: <FiThumbsUp /> },
  { label: "Prescription Verified", icon: <FiFileText /> },
  { label: "Packed", icon: <FiPackage /> },
  { label: "Shipped", icon: <FiTruck /> },
  { label: "Out for Delivery", icon: <FiMapPin /> },
  { label: "Delivered", icon: <FiHome /> },
];

const Timeline = ({ liveTimeline, loadingTracking }) => {
  // Map liveTimeline statuses to our STEPS
  const getStepStatus = (stepLabel) => {
    const liveStep = liveTimeline.find(s => s.status.toLowerCase().includes(stepLabel.toLowerCase()));
    if (liveStep && liveStep.timestamp) {
      return { completed: true, ...formatTimestamp(liveStep.timestamp) };
    }
    return { completed: false };
  };

  // For visual demo if liveTimeline is empty/short
  const lastCompletedIndex = STEPS.reduce((last, step, idx) => {
    const status = getStepStatus(step.label);
    return status.completed ? idx : last;
  }, 0);

  return (
    <div className="horizontal-stepper">
      {STEPS.map((step, index) => {
        const status = getStepStatus(step.label);
        const isCurrent = index === lastCompletedIndex + 1 && index < STEPS.length;
        const isCompleted = index <= lastCompletedIndex;
        
        return (
          <div key={index} className={`stepper-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="step-connector">
              {index < STEPS.length - 1 && <div className="connector-line"></div>}
            </div>
            <div className="step-content">
              <div className="step-icon-wrapper">
                <div className="step-icon">
                  {isCompleted ? <FiCheck /> : step.icon}
                </div>
              </div>
              <div className="step-info">
                <span className="step-label">{step.label}</span>
                {status.completed && (
                  <span className="step-time-detail">{status.date} {status.time}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
