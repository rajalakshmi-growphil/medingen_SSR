"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./style.css";
import { DashboardHeader } from "./DashboardHeader";
import Breadcrumbs from "../components/Breadcrumbs/Breadcrumbs";
import { FiArrowLeft } from "react-icons/fi";

interface HeaderProps {
  title?: string;
  maxWidth?: number | string;
  breadcrumbPadding?: string;
  variant?: string;
  showMobileBack?: boolean;
  rightAction?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  maxWidth = 1300, 
  breadcrumbPadding = "0 24px", 
  variant, 
  showMobileBack, 
  rightAction 
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [headerTitle, setHeaderTitle] = useState("Profile");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 700);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 700);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const routeTitles: Record<string, string> = {
      "/": "Home",
      "/profile": "Profile",
      "/notification": "Notifications",
      "/addressnew": "Address",
      "/savedaddress": "Address",
      "/view-offer": "Offer Details",
      "/product": "View",
      "/compare": "Compare",
      "/offers": "Offers",
      "/upload-prescription": "Prescriptions",
      "/select-prescription": "Prescriptions",
      "/capture-prescription": "Prescriptions",
      "/cart": "Order Progress",
      "/cart/pharmacist-verification": "Pharmacist Verification",
      "/cart/pharmacist-verification/payment": "Payment",
      "/personal-info": "Personal Information",
      "/change-password": "Change Password",
    };

    setHeaderTitle(
      title ? title : (routeTitles[pathname] || "")
    );
  }, [pathname, title]);

  return (
    <>
      <style>{`
        .sticky-header-container {
          position: sticky !important;
          top: 0 !important;
          z-index: 10000 !important;
          width: 100% !important;
        }
        @media (max-width: 1024px) {
          .sticky-header-container {
            position: sticky !important;
            top: 0 !important;
          }
        }
        .mobile-back-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          min-height: 56px;
          box-sizing: border-box;
          width: 100%;
        }
        .mobile-back-left {
          display: flex;
          align-items: center;
        }
        .mobile-back-btn {
          background: none;
          border: none;
          padding: 8px 12px 8px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #1e293b;
        }
        .mobile-back-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        .mobile-back-right {
          display: flex;
          align-items: center;
        }
      `}</style>
      <div className="sticky-header-container">
        <DashboardHeader variant={variant} maxWidth={maxWidth} />
        {isMobile && showMobileBack && (
          <div className="mobile-back-header">
            <div className="mobile-back-left">
              <button className="mobile-back-btn" onClick={() => router.back()}>
                <FiArrowLeft size={22} />
              </button>
              <span className="mobile-back-title">{headerTitle}</span>
            </div>
            {rightAction && (
              <div className="mobile-back-right">
                {rightAction}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="breadcrumb-wrapper" style={{ 
        padding: isMobile ? "12px 16px 8px" : "16px 0 8px", 
        background: "transparent",
        width: "100%",
        display: "block",
        clear: "both",
      }}>
        <div style={{ 
          maxWidth: isMobile ? "100%" : maxWidth, 
          margin: isMobile ? "0" : "0 auto", 
          padding: isMobile ? "0" : breadcrumbPadding,
          textAlign: "left"
        }}>
          <Breadcrumbs />
        </div>
      </div>
    </>
  );
};

export default Header;
