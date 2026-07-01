"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MdLocalShipping,
  MdLock,
  MdCompareArrows,
  MdShare,
  MdShoppingCart,
  MdEdit,
  MdLocalOffer,
  MdDriveFileRenameOutline,
  MdFactCheck,
  MdCalendarToday,
  MdCheckCircle,
  MdCancel,
  MdChevronLeft,
  MdChevronRight,
  MdAdd,
  MdRemove,
  MdDeleteOutline,
  MdFlag,
  MdClose,
  MdErrorOutline,
  MdScience,
  MdOutlineShield,
  MdLibraryBooks,
  MdLocalHospital,
  MdNoFood,
  MdDirectionsCar,
  MdPregnantWoman,
  MdChildCare,
  MdWarningAmber,
  MdInfo,
  MdNoDrinks,
  MdSmokeFree,
  MdElderlyWoman,
  MdLink,
  MdHistory,
  MdLayers,
  MdHighQuality,
  MdVerified
} from "react-icons/md";
import { BsPatchCheckFill } from "react-icons/bs";

import {
  FiChevronDown,
  FiArrowLeft,
  FiArrowRight,
  FiUsers,
  FiShield,
  FiTruck as FiTruckAlt,
} from "react-icons/fi";
import {
  FaUserCircle,
  FaWhatsapp,
  FaHeartbeat,
  FaSyringe,
  FaAllergies,
  FaWeight,
  FaRunning,
  FaTint,
  FaShieldAlt,
  FaEye,
  FaThermometerHalf,
} from "react-icons/fa";
import { GiMedicines, GiPill, GiStomach, GiHeartOrgan, GiBrain, GiKidneys, GiLiver, GiLungs, GiBrokenBone } from "react-icons/gi";
import { BiDrink, BiSun, BiMoon } from "react-icons/bi";
import { TbPill, TbAlertTriangle } from "react-icons/tb";
import { useLocation, useNavigate } from "react-router-dom";
const Helmet = () => null;
import DOMPurify from "dompurify";
import axios from "axios";
import Swal from "sweetalert2";
import Header from "../Dashboard/Header";
import { Footer } from "../LandingPage/LandingPage";

import { useCart } from "../../api/stateContext";
import Navigation from "../Dashboard/Navigation";
// import "../Dashboard/style.css";

import {
  getProductDetails,
  getCouponDetails,
  getAveragePrice,
  search_altProducts,
  addToCart,
  updateCartData,
  requestProduct,
  getUser,
  getFooterProducts,
  getAllBlogs,
  getOffers,
  getMainCategories,
} from "../../api/Api";


const getCdnImageUrl = (url) => {
  if (!url) return "/medicine-details.png";
  if (typeof url !== "string") return "/medicine-details.png";
  if (url.startsWith("http")) {
    return url.replace("https://d1dh0rr5xj2p49.cloudfront.net", "/cloudfront-cdn");
  }
  if (url.startsWith("/cloudfront-cdn")) {
    return url;
  }
  if (url.startsWith("/")) {
    return url;
  }
  return `/cloudfront-cdn/products/${url}`;
};

function parseDescriptionToTabs(html) {
  if (typeof window === "undefined" || !html) return {};
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const tabsData = {};
  const headings = doc.querySelectorAll("h1, h2");
  
  headings.forEach((section) => {
    const heading = section.querySelector("strong")?.textContent.trim() || section.textContent.trim();
    const content = [];
    let sib = section.nextElementSibling;
    while (sib && !["H1", "H2"].includes(sib.tagName)) { 
      content.push(sib.outerHTML); 
      sib = sib.nextElementSibling; 
    }
    if (heading) tabsData[heading] = content.join("");
  });
  
  if (Object.keys(tabsData).length === 0 && html.trim()) {
    tabsData["Description"] = html;
  }
  return tabsData;
}

function parseFAQs(html) {
  if (typeof window === "undefined" || !html) return [];
  const div = document.createElement("div");
  div.innerHTML = html;

  const faqs = [];
  const ps = Array.from(div.querySelectorAll("p"));

  for (let i = 0; i < ps.length; i++) {
    const strong = ps[i].querySelector("strong");

    if (strong && strong.innerText.trim().startsWith("Q.")) {
      const q = strong.innerText.trim().replace(/^Q\.\s*/, "");

      let a = "";
      let rest = strong.nextSibling;

      while (rest) {
        a += (rest.textContent || "").trim() + " ";
        rest = rest.nextSibling;
      }

      // ✅ FIXED HERE
      if (!a.trim() && ps[i + 1]) {
        a = ps[i + 1].innerText.trim();
        i++;
      }

      if (q) {
        faqs.push({
          question: q,
          answer: a.trim()
        });
      }
    }
  }

  return faqs;
}
function injectFaqSchema(htmlString) {
  if (typeof window === "undefined" || !htmlString) return;
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const paragraphs = Array.from(doc.querySelectorAll("p"));
  const faqList = [];
  for (let i = 0; i < paragraphs.length - 1; i++) {
    if (paragraphs[i].innerHTML.startsWith("<strong>Q.")) {
      faqList.push({ "@type": "Question", name: paragraphs[i].textContent.trim().replace(/^Q\.\s*/, ""), acceptedAnswer: { "@type": "Answer", text: paragraphs[i + 1].textContent.trim() } });
      i++;
    }
  }
  if (!faqList.length) return;
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try { if (JSON.parse(s.textContent || "{}")["@type"] === "FAQPage") s.remove(); } catch (_) { }
  });
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqList }, null, 2);
  document.head.appendChild(script);
}

/* ─── tiny sub-components ─────────────────────────────────────────────────── */

const formatPackaging = (str) => {
  if (!str) return "";
  const upper = str.toUpperCase().trim();
  
  if (upper.includes("ML")) {
    return str.replace(/(\d+)\s*ML/i, "$1 ML");
  }
  
  if (upper.endsWith("'S") || upper.endsWith("S")) {
    return str;
  }

  if (/^\d+$/.test(upper)) {
    return `${upper} Tablets`;
  }
  
  return str;
};


function Chevron({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .3s", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Stars({ n = 4.8 }) {
  return <span style={{ color: "#fbbf24", fontSize: 16, letterSpacing: -1 }}>{Array.from({ length: 5 }, (_, i) => i < Math.floor(n) ? "★" : "☆").join("")}</span>;
}

const ExpandableText = React.memo(function ExpandableText({ text, maxLen = 80, style = {} }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return null;

  const isLong = text.length > maxLen;

  return (
    <div
      style={{ ...style, cursor: isLong ? "pointer" : "default" }}
      onClick={(e) => {
        if (!isLong) return;
        e.preventDefault();
        e.stopPropagation();
        setExpanded((prev) => {
          const next = !prev;
          console.log(`[${new Date().toLocaleTimeString()}] Content ${next ? "Opened" : "Closed"}: "${text.slice(0, 30)}..."`);
          return next;
        });
      }}
    >
      {isLong && !expanded ? text.slice(0, maxLen) + "..." : text}
      {isLong && (
        <span
          style={{ color: "#7c3aed", fontWeight: 700, marginLeft: 4, fontSize: 11 }}
        >
          {expanded ? " show less" : " show more"}
        </span>
      )}
    </div>
  );
});

const PremiumAccordionItem = ({ title, icon, isOpen, onClick, children, isMobile }) => {
  const fs = (desktop, mobile) => isMobile ? mobile : desktop;
  return (
    <div style={{ 
      background: "#fff", 
      border: "1px solid #e5e7eb", 
      borderRadius: 12, 
      marginBottom: 12, 
      overflow: "hidden",
      boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
      transition: "all 0.3s ease"
    }} className="premium-accordion-item">
      <button
        onClick={onClick}
        style={{ 
          width: "100%", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: isMobile ? "16px 14px" : "18px 24px", 
          background: "none", 
          border: "none", 
          cursor: "default", 
          textAlign: "left" 
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {icon && (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flexShrink: 0 }}>
              {icon}
            </span>
          )}
          <span style={{ fontSize: fs(15, 14), fontWeight: 700, color: "#111827" }}>{title}</span>
        </span>
        <span style={{ color: "#9ca3af", transition: "transform .3s", transform: "rotate(180deg)", display: "flex" }}>
          <FiChevronDown size={isMobile ? 18 : 20} />
        </span>
      </button>
      <div style={{ 
        padding: isMobile ? "0 14px 16px" : "0 24px 24px", 
        borderTop: "1px solid #f3f4f6", 
        paddingTop: isMobile ? 14 : 20 
      }}>
        {children}
      </div>
    </div>
  );
};


const PremiumStructuredContent = ({ product, isMobile = false }) => {
  // Force all sections open at all times
  const [openSection, setOpenSection] = useState("all");

  const getSubstitutedContent = (text) => {
    if (!text) return "";
    let res = text.replace(/[\[\{]+\s*product_name\s*[\]\}]+/g, product.name || "");
    res = res.replace(/[\[\{]+\s*salt_name\s*[\]\}]+/g, product.genericName || "");
    return res;
  };

  const getDynamicIcon = (iconName, size = 18, color = "#7c3aed") => {
    switch (iconName?.toLowerCase()) {
      case "shield": return <FaShieldAlt size={size} color={color} />;
      case "energy": return <FaRunning size={size} color={color} />;
      case "vitality": return <FaHeartbeat size={size} color={color} />;
      case "active": return <FaRunning size={size} color={color} />;
      case "brain": return <GiBrain size={size} color={color} />;
      case "glow": return <BiSun size={size} color={color} />;
      case "creative": return <GiBrain size={size} color={color} />;
      case "calm": return <BiMoon size={size} color={color} />;
      case "weight": return <FaWeight size={size} color={color} />;
      case "dosage": return <TbPill size={size} color={color} />;
      case "timing": return <MdCalendarToday size={size} color={color} />;
      case "limit": return <MdWarningAmber size={size} color={color} />;
      case "consistency": return <MdCheckCircle size={size} color={color} />;
      case "food": return <MdNoFood size={size} color={color} />;
      case "water": return <FaTint size={size} color={color} />;
      case "morning": return <BiSun size={size} color={color} />;
      case "night": return <BiMoon size={size} color={color} />;
      case "empty": return <MdNoFood size={size} color={color} />;
      case "injection": return <FaSyringe size={size} color={color} />;
      case "swallow": return <TbPill size={size} color={color} />;
      case "chew": return <GiPill size={size} color={color} />;
      case "dissolve": return <GiPill size={size} color={color} />;
      case "apply": return <MdInfo size={size} color={color} />;
      case "eye": return <FaEye size={size} color={color} />;
      case "inhale": return <GiLungs size={size} color={color} />;
      case "frequency": return <MdCalendarToday size={size} color={color} />;
      case "duration": return <MdCalendarToday size={size} color={color} />;
      case "avoid": return <MdWarningAmber size={size} color={color} />;
      case "storage": return <MdInfo size={size} color={color} />;
      case "missed": return <MdWarningAmber size={size} color={color} />;
      case "overdose": return <TbAlertTriangle size={size} color={color} />;
      case "hospital": return <MdLocalHospital size={size} color={color} />;
      case "smoking": return <MdSmokeFree size={size} color={color} />;
      case "alcohol": return <MdNoDrinks size={size} color={color} />;
      case "driving": return <MdDirectionsCar size={size} color={color} />;
      case "pregnancy": return <MdPregnantWoman size={size} color={color} />;
      case "elderly": return <MdElderlyWoman size={size} color={color} />;
      case "children": return <MdChildCare size={size} color={color} />;
      case "sun": return <BiSun size={size} color={color} />;
      case "sleep": return <BiMoon size={size} color={color} />;
      case "heart": return <GiHeartOrgan size={size} color={color} />;
      case "kidney": return <GiKidneys size={size} color={color} />;
      case "liver": return <GiLiver size={size} color={color} />;
      case "lungs": return <GiLungs size={size} color={color} />;
      case "stomach": return <GiStomach size={size} color={color} />;
      case "bone": return <GiBrokenBone size={size} color={color} />;
      case "allergy": return <FaAllergies size={size} color={color} />;
      case "blood": return <FaTint size={size} color={color} />;
      case "exercise": return <FaRunning size={size} color={color} />;
      case "fever": return <FaThermometerHalf size={size} color={color} />;
      case "warning": return <TbAlertTriangle size={size} color={color} />;
      case "pill": return <TbPill size={size} color={color} />;
      case "medicine": return <GiMedicines size={size} color={color} />;
      case "drink": return <BiDrink size={size} color={color} />;
      case "info":
      default: return <MdInfo size={size} color={color} />;
    }
  };

  const toggleSection = (sectionName) => {
    // No-op to keep every section expanded permanently
    // setOpenSection(openSection === sectionName ? "" : sectionName);
  };

  const fs = (desktop, mobile) => isMobile ? mobile : desktop;



  return (
    <div className="premium-accordion" style={{ background: "transparent", padding: isMobile ? "0 4px" : 0 }}>
      <style>{`
        .ph-note p { display: inline; margin: 0; }
      `}</style>

      {product.productDescription && (
        <PremiumAccordionItem
          isMobile={isMobile}
          title="Product Description"
          icon={<img src="/ProductDescription.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "Product Description"}
          onClick={() => toggleSection("Product Description")}
        >
          <div
            style={{ fontSize: fs(13, 11.5), color: "#4b5563", lineHeight: 1.75, textAlign: "justify" }}
            dangerouslySetInnerHTML={{ __html: getSubstitutedContent(product.productDescription) }}
          />
          {product.pharmacistNote && (
            <div style={{ marginTop: isMobile ? 12 : 20, background: "#f0f6ff", borderLeft: "3px solid #3b82f6", padding: isMobile ? "10px 12px" : "14px 18px", borderRadius: "0 8px 8px 0" }}>
              <div style={{ fontSize: fs(13, 11.5), fontWeight: 700, color: "#1e3a8a", display: "inline-flex", alignItems: "center", gap: 5, marginRight: 6 }}>
                <img src="/PharmacistNote.svg" alt="" style={{ width: 16, height: 16 }} />
                Pharmacist Note:
              </div>
              <div
                className="ph-note"
                style={{ fontSize: fs(13, 11.5), color: "#1d4ed8", fontWeight: 600, display: "inline", textAlign: "justify" }}
                dangerouslySetInnerHTML={{ __html: getSubstitutedContent(product.pharmacistNote) }}
              />
            </div>
          )}
        </PremiumAccordionItem>
      )}

      {product.benefits && product.benefits.length > 0 && (
        <PremiumAccordionItem
          isMobile={isMobile}
          title="Uses & Benefits"
          icon={<img src="/UsesAndBenefits.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "Uses & Benefits"}
          onClick={() => toggleSection("Uses & Benefits")}
        >
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {product.benefits.map((item, i) => (
                <div key={i} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ background: "#f3e8ff", padding: 8, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
                    {getDynamicIcon(item.icon || "info", 14, "#7c3aed")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>{item.title}</div>
                    <div
                      style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.55, textAlign: "justify" }}
                      dangerouslySetInnerHTML={{ __html: getSubstitutedContent(item.description) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {product.benefits.map((item, i) => (
                <div key={i} style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ background: "#f3e8ff", width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getDynamicIcon(item.icon || "info", 18, "#7c3aed")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 5 }}>{item.title}</div>
                    <div
                      style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, textAlign: "justify" }}
                      dangerouslySetInnerHTML={{ __html: getSubstitutedContent(item.description) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumAccordionItem>
      )}

      {product.sideEffects && product.sideEffects.length > 0 && (
        <PremiumAccordionItem
          isMobile={isMobile}
          title="Side Effects"
          icon={<img src="/SideEffects.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "Side Effects"}
          onClick={() => toggleSection("Side Effects")}
        >
          <p style={{ fontSize: fs(13, 11), color: "#4b5563", marginBottom: isMobile ? 10 : 16, textAlign: "justify" }}>
            While generally safe and well-tolerated, high doses or sensitivity can cause some side effects.
          </p>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: isMobile ? 10 : 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "80px 1fr 80px" : "100px 1fr 100px", columnGap: isMobile ? "12px" : "20px", background: "#f9fafb", padding: isMobile ? "8px 10px" : "12px 16px", fontWeight: 700, fontSize: fs(12, 11), color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
              <div>Type</div><div>Symptoms</div><div>Severity</div>
            </div>
            {product.sideEffects.map((se, i) => {
              const typeOpt = product.se_type_options?.find(o => o.value === se.type) || { dot: "#f97316", label: se.type };
              const sevOpt = product.se_severity_options?.find(o => o.value === se.severity) || { dot: "#38bdf8", label: se.severity };
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "80px 1fr 80px" : "100px 1fr 100px", columnGap: isMobile ? "12px" : "20px", padding: isMobile ? "10px" : "16px", borderBottom: i === product.sideEffects.length - 1 ? "none" : "1px solid #e5e7eb", alignItems: "center" }}>
                  <div style={{ fontSize: fs(13, 11), fontWeight: 700, color: se.type?.toLowerCase() === "serious" ? "#ef4444" : se.type?.toLowerCase() === "common" ? "#64748b" : "#f97316", textTransform: "capitalize" }}>
                    {typeOpt.label || se.type}
                  </div>
                  <ExpandableText
                    text={se.effect}
                    maxLen={60}
                    style={{ fontSize: fs(13, 11), color: "#6b7280", lineHeight: 1.5, textAlign: "justify" }}
                  />
                  <div><span style={{ fontSize: fs(10, 9), fontWeight: 800, background: sevOpt.dot + "20", color: sevOpt.dot, padding: isMobile ? "3px 6px" : "4px 8px", borderRadius: 4, textTransform: "uppercase" }}>{sevOpt.label || se.severity}</span></div>
                </div>
              );
            })}
          </div>
        </PremiumAccordionItem>
      )}

{product.howToUse && product.howToUse.length > 0 && (
  <PremiumAccordionItem
    isMobile={isMobile}
    title="How to Use"
    icon={<img src="/References.svg" alt="" style={{ width: 18, height: 18 }} />}
    isOpen={openSection === "How to Use"}
    onClick={() => toggleSection("How to Use")}
  >
    {isMobile ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {product.howToUse.map((h, i) => (
          <div key={i} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ background: "#f3e8ff", padding: 8, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
              {getDynamicIcon(h.icon || "info", 14, "#7c3aed")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>{h.title}</div>
              <ExpandableText
                text={getSubstitutedContent(h.description)?.replace(/<[^>]*>/g, "")}
                maxLen={80}
                style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.55, textAlign: "justify" }}
              />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {product.howToUse.map((h, i) => (
          <div key={i} style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ background: "#f3e8ff", width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {getDynamicIcon(h.icon || "info", 18, "#7c3aed")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 5 }}>{h.title}</div>
              <ExpandableText
                text={getSubstitutedContent(h.description)?.replace(/<[^>]*>/g, "")}
                maxLen={80}
                style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, textAlign: "justify" }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </PremiumAccordionItem>
)}

      {product.howItWorks && (
        <PremiumAccordionItem isMobile={isMobile}
          title="How it Works"
          icon={<img src="/HowItWorks_676.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "How it Works"}
          onClick={() => toggleSection("How it Works")}
        >
          <div style={{ background: "#fcfaff", border: "1px solid #f3e8ff", borderRadius: isMobile ? 12 : 20, padding: isMobile ? "16px" : "24px 32px", position: "relative", overflow: "hidden" }}>
            <div
              style={{ position: "relative", zIndex: 1, fontSize: fs(13, 11.5), color: "#374151", lineHeight: 1.7, textAlign: "justify" }}
              dangerouslySetInnerHTML={{ __html: getSubstitutedContent(product.howItWorks) }}
            />
            <MdScience size={isMobile ? 60 : 90} color="#ede2fa" style={{ position: "absolute", bottom: isMobile ? -10 : -15, right: isMobile ? -10 : -15, zIndex: 0, transform: "rotate(15deg)", opacity: 0.5 }} />
          </div>
        </PremiumAccordionItem>
      )}

      {product.safetyAdvice && product.safetyAdvice.length > 0 && (
        <PremiumAccordionItem isMobile={isMobile}
          title="Safety Advice"
          icon={<img src="/SafetyAdvice.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "Safety Advice"}
          onClick={() => toggleSection("Safety Advice")}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 8 : 16 }}>
            {product.safetyAdvice.map((sa, i) => {
              const cardColors = [
                { bg: "#fdf2f8", iconColor: "#ec4899", titleColor: "#be185d" },
                { bg: "#eff6ff", iconColor: "#3b82f6", titleColor: "#1d4ed8" },
                { bg: "#f0fdf4", iconColor: "#22c55e", titleColor: "#15803d" },
                { bg: "#fefce8", iconColor: "#f59e0b", titleColor: "#b45309" },
                { bg: "#f0fdfa", iconColor: "#14b8a6", titleColor: "#0f766e" },
                { bg: "#f0f9ff", iconColor: "#0ea5e9", titleColor: "#0369a1" },
                { bg: "#fdf4ff", iconColor: "#a855f7", titleColor: "#7e22ce" },
                { bg: "#fff7ed", iconColor: "#f97316", titleColor: "#c2410c" },
              ];
              const c = cardColors[i % cardColors.length];
              return (
                <div key={i} style={{ background: c.bg, borderRadius: isMobile ? 10 : 12, padding: isMobile ? "10px 12px" : "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: isMobile ? 5 : 8 }}>
                    {getDynamicIcon(sa.icon, isMobile ? 15 : 18, c.iconColor)}
                    <span style={{ fontSize: fs(14, 14), fontWeight: 700, color: c.titleColor }}>{sa.title}</span>
                  </div>
                  <div
                    style={{ fontSize: fs(12, 11), color: "#4b5563", lineHeight: 1.6, textAlign: "justify" }}
                    dangerouslySetInnerHTML={{ __html: getSubstitutedContent(sa.description) }}
                  />
                </div>
              );
            })}
          </div>
        </PremiumAccordionItem>
      )}

      {product.drugInteractions && product.drugInteractions.length > 0 && (
        <PremiumAccordionItem isMobile={isMobile}
          title="Interactions with Drugs"
          icon={<img src="/InteractionsDrugs.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "Interactions with Drugs"}
          onClick={() => toggleSection("Interactions with Drugs")}
        >
          <div style={{ border: "1px solid #e5e7eb", borderRadius: isMobile ? 10 : 12, overflow: "hidden" }}>
            {product.drugInteractions.map((id, i) => {
              const sevOpt = product.di_severity_options?.find(o => o.value === id.severity) || { dot: "#eab308", label: id.severity };
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMobile ? "12px" : "24px", padding: isMobile ? "10px 12px" : "16px 20px", borderBottom: i === product.drugInteractions.length - 1 ? "none" : "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flex: 1 }}>
                    <div style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8, borderRadius: "50%", background: sevOpt.dot, flexShrink: 0 }}></div>
                    <div style={{ fontSize: fs(14, 11.5), fontWeight: 700, color: "#111827" }}>
                      {id.drug}
                    </div>
                  </div>

                  {!isMobile && (
                    <div style={{ fontSize: 12, color: "#6b7280", flex: 2, textAlign: "justify" }}>
                      {id.interaction}
                    </div>
                  )}

                  <div style={{ marginLeft: 32 }}>
                    <span style={{ fontSize: fs(10, 9), fontWeight: 800, background: sevOpt.dot + "20", color: sevOpt.dot, padding: isMobile ? "3px 7px" : "4px 10px", borderRadius: 12, textTransform: "uppercase" }}>
                      {sevOpt.label || id.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </PremiumAccordionItem>
      )}

      {product.faq && product.faq.length > 0 && (
        <PremiumAccordionItem isMobile={isMobile}
          title="Patient Concerns"
          icon={<img src="/PatientConcerns.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "Patient Concerns"}
          onClick={() => toggleSection("Patient Concerns")}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
            {product.faq.map((pc, i) => {
              const question = getSubstitutedContent(pc.question || pc.q);
              const answer = getSubstitutedContent(pc.answer || pc.a);

              return (
                <div key={i} style={{ background: "#f8f9fa", borderRadius: isMobile ? 12 : 16, padding: isMobile ? "14px 16px" : "18px 20px", borderLeft: "4px solid #7c3aed", border: "1px solid #f1f5f9", borderLeftWidth: 4, transition: "transform 0.2s ease" }}>
                  <div style={{ display: "flex", gap: isMobile ? 12 : 14, marginBottom: 8 }}>
                    <span style={{ background: "#f3e8ff", color: "#7c3aed", fontWeight: 800, minWidth: isMobile ? 24 : 26, height: isMobile ? 24 : 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 10 : 11, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h4 style={{ margin: 0, fontSize: fs(14, 13), fontWeight: 700, color: "#111827", flex: 1, lineHeight: 1.4 }}>{question}</h4>
                  </div>
                  <div style={{ fontSize: fs(13, 12), color: "#4b5563", lineHeight: 1.7, paddingLeft: isMobile ? 36 : 40, textAlign: "justify" }}>
                    {answer}
                  </div>
                </div>
              );
            })}
          </div>
        </PremiumAccordionItem>
      )}

      {product.references && (
        <PremiumAccordionItem isMobile={isMobile}
          title="References"
          icon={<img src="/References.svg" alt="" style={{ width: 18, height: 18 }} />}
          isOpen={openSection === "References"}
          onClick={() => toggleSection("References")}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: isMobile ? 4 : 6 }}>
            {product.references
              .split("\n")
              .filter((r) => r.trim())
              .map((r, i) => {
                const trimmed = String(r).trim();
                const isUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");
                return (
                  <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "2px 10px", borderRadius: 8, transition: "all 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      {!isUrl && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#9ca3af", flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: fs(12.5, 11), color: "#1f2937", fontWeight: isMobile && !isUrl ? 700 : 500, lineHeight: 1.5, textAlign: "justify" }}>
                        {trimmed}
                      </span>
                    </div>
                    {isUrl && (
                      <a href={trimmed} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, background: "#f3f4f6", color: "#7c3aed", transition: "all 0.2s ease" }}>
                        <MdLink size={16} />
                      </a>
                    )}
                  </li>
                );
              })}
          </ul>
        </PremiumAccordionItem>
      )}
    </div>
  );
};

const ComparisonSkeleton = ({ isMobile }) => (
  <div style={{ maxWidth: 1280, margin: isMobile ? "12px 0" : "16px auto", padding: isMobile ? "0 8px" : "0 24px", fontFamily: "'Outfit', sans-serif" }}>
    <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5 } 50% { opacity: 1 } }`}</style>
    <div style={{ background: "#e5e7eb30", height: isMobile ? 60 : 80, borderRadius: 16, marginBottom: 16, animation: "pulse 1.5s infinite" }}></div>
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: 20 }}>
      <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 20, height: 350, animation: "pulse 1.5s infinite" }}></div>
      <div style={{ background: "#fff", border: "2px solid #ddd6fe", borderRadius: 24, height: 350, animation: "pulse 1.5s infinite" }}></div>
    </div>
    <div style={{ background: "#e5e7eb30", height: 60, borderRadius: 12, marginTop: 16, animation: "pulse 1.5s infinite" }}></div>
  </div>
);

const SubstitutionComparison = ({ 
  searchedProduct, 
  recommendedProduct, 
  onAddToCart, 
  onBuyNow, 
  onShare, 
  onCompare, 
  onNotify,
  isMobile, 
  deliveryInfo, 
  googleRating, 
  googleReviewCount,
  qty,
  addedToCart,
  handleCompositionClick,
  onUpdateQty,
  editingPincode,
  setEditingPincode,
  pincodeInput,
  setPincodeInput,
  pincodeError,
  handleCheckPincode,
  onZoomImage,
  handleCategoryClick
}) => {
  if (!searchedProduct || !recommendedProduct) return null;
  
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const productImages = recommendedProduct.slides || [
    getCdnImageUrl(recommendedProduct.imageUrl)
  ];

  useEffect(() => {
    if (productImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % productImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [productImages.length]);

  const savings = (recommendedProduct.originalPrice - recommendedProduct.discountedPrice).toFixed(2);
  const savingsPct = Math.round(((recommendedProduct.originalPrice - recommendedProduct.discountedPrice) / recommendedProduct.originalPrice) * 100);
  const displayRating = recommendedProduct.rating || googleRating || 4.8;
  const displayReviewCount = recommendedProduct.reviewsCount || googleReviewCount || 1240;

  if (isMobile) {
    return (
      <div style={{ padding: "12px", background: "#fff", fontFamily: "'Outfit', sans-serif" }}>
        {/* 2. MATCH SALT BAR */}
        <div style={{ 
          background: "#f3f0ff", 
          borderRadius: "8px", 
          padding: "8px 12px", 
          display: "flex", 
          alignItems: "center", 
          gap: "10px", 
          marginBottom: "16px",
          border: "1px solid #7c3aed20"
        }}>
          <div style={{ 
            background: "#7c3aed", 
            color: "#fff", 
            fontSize: "9px", 
            fontWeight: "900", 
            padding: "2px 8px", 
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <MdCheckCircle size={10} /> MATCH
          </div>
          <span 
            onClick={() => handleCompositionClick(searchedProduct.composition)}
            style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "700", cursor: "pointer" }}
          >
            Composition: {searchedProduct.composition}
          </span>
        </div>

        {/* 3. PRODUCT CARDS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {/* YOU SEARCHED */}
          <div style={{ 
            border: "1px solid #f1f5f9", 
            borderRadius: "16px", 
            padding: "10px", 
            position: "relative",
            background: "#fff"
          }}>
            <div style={{ 
              position: "absolute", 
              top: "-8px", 
              left: "10px", 
              background: "#4b5563", 
              color: "#fff", 
              fontSize: "9px", 
              fontWeight: "800", 
              padding: "2px 10px", 
              borderRadius: "20px",
              zIndex: 2
            }}>YOU SEARCHED</div>
            <div style={{ 
              background: "#f8f9fb", 
              borderRadius: "12px", 
              height: "160px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "8px",
              marginBottom: "8px"
            }}>
              <img src={searchedProduct.imageSrc} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#111827", marginBottom: "4px", height: "30px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{searchedProduct.name}</div>
            <div style={{ 
              background: "#f5f3ff", 
              color: "#7c3aed", 
              fontSize: "8px", 
              fontWeight: "800", 
              padding: "2px 6px", 
              borderRadius: "4px", 
              width: "fit-content",
              marginBottom: "4px",
              textTransform: "uppercase"
            }}>{searchedProduct.composition?.split(",")[0]}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{searchedProduct.manufacturer}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "6px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "18px", fontWeight: "800", color: "#111827" }}>₹{searchedProduct.price}</span>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700", marginTop: "2px" }}>{formatPackaging(searchedProduct.packaging)}</div>
              </div>
              {searchedProduct.inStock === false && (searchedProduct.rc === 1 || searchedProduct.rc === true) && (
                <button onClick={(e) => onNotify?.(e, searchedProduct)} style={{ 
                  background: "transparent", 
                  color: "#7c3aed", 
                  border: "1px solid #7c3aed", 
                  borderRadius: "8px", 
                  padding: "4px 8px", 
                  fontSize: "10px", 
                  fontWeight: "800",
                  cursor: "pointer"
                }}>Notify me</button>
              )}
            </div>
          </div>

          {/* RECOMMENDED */}
          <div style={{ 
            border: "2px solid #7c3aed", 
            borderRadius: "16px", 
            padding: "10px", 
            position: "relative",
            background: "#f5f3ff",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.08)"
          }}>
            <div style={{ 
              position: "absolute", 
              top: "-8px", 
              left: "10px", 
              background: "#7c3aed", 
              color: "#fff", 
              fontSize: "9px", 
              fontWeight: "800", 
              padding: "2px 10px", 
              borderRadius: "20px",
              zIndex: 2
            }}>RECOMMENDED</div>
            <div style={{ 
              background: "#f8f9fb", 
              borderRadius: "12px", 
              height: "160px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "8px",
              marginBottom: "8px"
            }}>
              <img src={recommendedProduct.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#111827", marginBottom: "4px", height: "30px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{recommendedProduct.name}</div>
            <div style={{ 
              background: "#f5f3ff", 
              color: "#7c3aed", 
              fontSize: "8px", 
              fontWeight: "800", 
              padding: "2px 6px", 
              borderRadius: "4px", 
              width: "fit-content",
              marginBottom: "4px",
              textTransform: "uppercase"
            }}>{(recommendedProduct.composition || searchedProduct.composition)?.split(",")[0]}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{recommendedProduct.manufacturer || searchedProduct.manufacturer}</div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#111827" }}>₹{recommendedProduct.discountedPrice}</span>
                  {savingsPct > 0 && (
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>{savingsPct}% OFF</span>
                  )}
                </div>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700", marginTop: "2px" }}>{formatPackaging(recommendedProduct.packaging)}</div>
              </div>
              {addedToCart ? (
                <div style={{ background: "#7c3aed", color: "#fff", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", fontWeight: "800" }}>IN CART</div>
              ) : (
                <button onClick={() => onAddToCart(recommendedProduct.product_id)} style={{ 
                  background: "#7c3aed", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: "8px", 
                  padding: "4px 12px", 
                  fontSize: "11px", 
                  fontWeight: "800"
                }}>ADD</button>
              )}
            </div>
          </div>
        </div>

        {/* 4. TOTAL SAVINGS BAR */}
        <div style={{ 
          background: "#7c3aed", 
          borderRadius: "12px", 
          padding: "12px 16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          color: "#fff",
          marginBottom: "24px",
          boxShadow: "0 4px 15px rgba(124, 58, 237, 0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
             <MdLocalOffer size={18} />
             <span style={{ fontSize: "13px", fontWeight: "600" }}>Total Savings on this pack:</span>
          </div>
          <span style={{ fontSize: "16px", fontWeight: "800" }}>₹{savings}</span>
        </div>

        {/* 5. DETAILED PRODUCT SECTION */}
        <div style={{ background: "#fff", padding: "12px 0", fontFamily: "'Outfit', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
             {(recommendedProduct.selectedCategory || searchedProduct.selectedCategory) && (
               <span 
                 onClick={() => handleCategoryClick(recommendedProduct.selectedCategory || searchedProduct.selectedCategory)}
                 style={{ background: "#f5f3ff", color: "#7c3aed", padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", cursor: "pointer" }}
               >
                 {recommendedProduct.selectedCategory || searchedProduct.selectedCategory}
               </span>
             )}
             <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
               <button onClick={onCompare} style={{ border: "1px solid #ddd6fe", background: "#fff", color: "#7c3aed", padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" }}>
                 <MdCompareArrows size={14} /> Compare
               </button>
               <button onClick={onShare} style={{ border: "1px solid #ddd6fe", background: "#fff", color: "#7c3aed", padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" }}>
                 <MdShare size={14} /> Share
               </button>
             </div>
          </div>


          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", lineHeight: "1.2", marginBottom: "6px" }}>{recommendedProduct.name}</h1>
          {recommendedProduct.manufacturer && (
            <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>Brand: <span style={{ color: "#7c3aed", fontWeight: "700" }}>{recommendedProduct.manufacturer}</span></div>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
             {(recommendedProduct.composition || searchedProduct.composition)?.split(",").map((s, i) => (
                <span key={i} style={{ background: "#f5f3ff", color: "#7c3aed", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>{s.trim()}</span>
             ))}
             <span style={{ background: "#f5f3ff", color: "#7c3aed", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>{formatPackaging(recommendedProduct.packaging)}</span>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ fontSize: "34px", fontWeight: "800", color: "#7c3aed" }}>₹{recommendedProduct.discountedPrice}</span>
              <span style={{ fontSize: "18px", color: "#9ca3af", textDecoration: "line-through" }}>₹{recommendedProduct.originalPrice}</span>
              <span style={{ fontSize: "14px", color: "#16a34a", fontWeight: "800" }}>Save ₹{savings}</span>
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>Inclusive of all taxes</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
             <img src="/google.svg" alt="" style={{ width: "16px" }} />
             <Stars n={displayRating} />
             <span style={{ fontSize: "14px", fontWeight: "700" }}>{displayRating} ({displayReviewCount} Reviews)</span>
             <span style={{ borderLeft: "1.5px solid #e5e7eb", height: "14px", margin: "0 4px" }}></span>
             <span style={{ color: "#16a34a", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}><MdCheckCircle size={16} /> In Stock</span>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
             {addedToCart ? (
               <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "2px solid #7c3aed", borderRadius: "12px", padding: "12px 20px" }}>
                  <div onClick={() => onUpdateQty(recommendedProduct.product_id, qty - 1)} style={{ cursor: "pointer", color: "#7c3aed" }}>
                    {qty === 1 ? <MdDeleteOutline size={22} /> : <MdRemove size={22} />}
                  </div>
                  <span style={{ fontWeight: "800", fontSize: "18px", color: "#7c3aed" }}>{qty}</span>
                  <div onClick={() => onUpdateQty(recommendedProduct.product_id, qty + 1)} style={{ cursor: "pointer", color: "#7c3aed" }}><MdAdd size={22} /></div>
               </div>
             ) : (
               <button onClick={() => onAddToCart(recommendedProduct.product_id)} style={{ 
                 flex: 1, 
                 background: "#fff", 
                 color: "#7c3aed", 
                 border: "2px solid #7c3aed", 
                 borderRadius: "12px", 
                 padding: "16px", 
                 fontSize: "15px", 
                 fontWeight: "800",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 gap: "8px"
               }}>
                 <MdShoppingCart size={20} /> Add to Cart
               </button>
             )}
             <button onClick={() => onBuyNow(recommendedProduct)} style={{ 
               flex: 1, 
               background: "#7c3aed", 
               color: "#fff", 
               border: "none", 
               borderRadius: "12px", 
               padding: "16px", 
               fontSize: "15px", 
               fontWeight: "800",
               boxShadow: "0 6px 16px rgba(124, 58, 237, 0.2)"
             }}>
               Buy Now
             </button>
          </div>

          {/* Delivery */}
          <div style={{ 
            background: "#fff", 
            border: "1px solid #f1f5f9", 
            borderRadius: "14px", 
            padding: "14px 18px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "24px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <MdLocalShipping size={22} color="#7c3aed" />
               <div style={{ fontSize: "13px", color: "#374151" }}>Delivery by <span style={{ color: "#16a34a", fontWeight: "700" }}>{deliveryInfo?.days || "Tomorrow 10 PM"}</span></div>
            </div>
            <div onClick={() => setEditingPincode(true)} style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
               {deliveryInfo?.city || "Mumbai, 400079"} <MdEdit size={14} color="#7c3aed" />
            </div>
          </div>

          {/* Trust Badges */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "24px" }}>
            {[
              { icon: "/BsPatchCheckFill.svg", label: "WHO/GMP\nCertified" },
              { icon: "/BsTruck.svg", label: "Fast\nDelivery" },
              { icon: "/BsShieldCheck.svg", label: "Secure\nPayment" },
              { icon: "/BsClockHistory.svg", label: "7 Days\nReturn" },
            ].map((item, i) => (
              <div key={i} style={{ 
                background: "#f8f9fb", 
                borderRadius: "12px", 
                padding: "16px 4px", 
                textAlign: "center", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                gap: "10px" 
              }}>
                <img src={item.icon} alt="" style={{ 
                  width: "24px", 
                  height: "24px", 
                  filter: "invert(46%) sepia(87%) saturate(2135%) hue-rotate(235deg) brightness(101%) contrast(96%)" 
                }} />
                <div style={{ fontSize: "9px", fontWeight: "800", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.2px", lineHeight: "1.2", whiteSpace: "pre-line" }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Pharmacist Support */}
          <div style={{ 
            background: "#f0f7ff", 
            borderRadius: "16px", 
            padding: "16px 20px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <div style={{ background: "#fff", padding: "10px", borderRadius: "50%", boxShadow: "0 2px 6px rgba(59, 130, 246, 0.1)" }}>
                  <img src="/Pharmacist_Support.svg" alt="" style={{ width: "22px", height: "22px" }} />
               </div>
               <div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#1e40af" }}>Pharmacist Support</div>
                  <div style={{ fontSize: "12px", color: "#60a5fa" }}>Have questions? We're here.</div>
               </div>
            </div>
            <button style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Chat Now</button>
          </div>
        </div>
      </div>
    );
  }

  /* ───── DESKTOP VIEW (UNTOUCHED) ───── */
  return (
    <div style={{ maxWidth: 1280, margin: isMobile ? "12px 0" : "16px auto", padding: isMobile ? "0 8px" : "0 24px", fontFamily: "'Outfit', sans-serif" }}>
      
      {/* 1. TOP PURPLE BANNER */}
      <div style={{ 
        background: "linear-gradient(90deg, #8159f8 0%, #7c58f6 100%)", 
        borderRadius: 16, 
        padding: isMobile ? "18px 16px" : "20px 32px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 16,
        width: "100%",
        boxSizing: "border-box",
        boxShadow: "0 6px 16px rgba(124, 58, 237, 0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MdCheckCircle size={18} color="#fff" />
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>Composition:</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span 
            onClick={() => handleCompositionClick(searchedProduct.composition)}
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff", borderRadius: 16, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}
          >
            {searchedProduct.composition}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
             <MdCompareArrows size={18} color="#fff" />
             <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Same Composition</span>
           </div>
           {!isMobile && (
             <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
               <MdCheckCircle size={18} color="#fff" />
               <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Same Quality</span>
             </div>
           )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: 20, alignItems: "start" }}>
        
        {/* 2. YOU SEARCHED (LEFT CARD) */}
        <div>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>YOU SEARCHED</h2>
          <div className="sv-product-card" style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 20, padding: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div onClick={() => onZoomImage(searchedProduct.images || [{ url: searchedProduct.imageSrc }], 0)} style={{ background: "#f8f9fb", borderRadius: 12, height: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 14, marginBottom: 12, cursor: "zoom-in", position: "relative", overflow: "hidden" }}>
              {searchedProduct.inStock === false && (
                <div style={{ 
                  position: "absolute", 
                  top: 12, 
                  left: -26, 
                  background: "#ef4444", 
                  color: "#fff", 
                  padding: "4px 28px", 
                  fontSize: 10, 
                  fontWeight: 900, 
                  zIndex: 10, 
                  transform: "rotate(-45deg)", 
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                  letterSpacing: "0.5px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}>
                  SOLD OUT
                </div>
              )}
              <img src={searchedProduct.imageSrc} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: "scale(1.08)" }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 2px" }}>{searchedProduct.name}</h3>
            {searchedProduct.manufacturer && (
              <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, margin: "0 0 12px", textTransform: "uppercase" }}>{searchedProduct.manufacturer}</p>
            )}
            
            <div style={{ borderTop: "1.5px solid #f1f5f9", paddingTop: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Composition</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                <span 
                  onClick={() => handleCompositionClick(searchedProduct.composition)}
                  style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 16, padding: "3px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                >
                  {searchedProduct.composition}
                </span>
               
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>₹{searchedProduct.price}</div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, marginTop: 2 }}>{formatPackaging(searchedProduct.packaging)}</div>
              </div>
              {searchedProduct.inStock === false && (searchedProduct.rc === 1 || searchedProduct.rc === true) && (
                <button onClick={(e) => onNotify?.(e, searchedProduct)} style={{ 
                  background: "transparent", 
                  color: "#7c3aed", 
                  border: "1.5px solid #7c3aed", 
                  borderRadius: 10, 
                  padding: "8px 16px", 
                  fontSize: 13, 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  transition: "all .2s",
                  boxSizing: "border-box"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f5f3ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  Notify me
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. RECOMMENDED ALTERNATIVE (RIGHT LARGE CARD) */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5 }}>OUR RECOMMENDED ALTERNATIVE</h2>
            {!isMobile && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onCompare} style={{ background: "#fcfaff", border: "1.5px solid #7c3aed30", borderRadius: 16, padding: "4px 12px", fontSize: 11, color: "#7c3aed", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <MdCompareArrows size={14} /> Compare
                </button>
                <button onClick={onShare} style={{ background: "#fcfaff", border: "1.5px solid #7c3aed30", borderRadius: 16, padding: "4px 12px", fontSize: 11, color: "#7c3aed", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <MdShare size={14} /> Share
                </button>
              </div>
            )}
          </div>
          
          <div className="sv-product-card" style={{ 
            background: "#fff", 
            border: "2px solid #8159f8", 
            borderRadius: 24, 
            padding: isMobile ? "16px" : "24px 32px",
            boxShadow: "0 12px 30px rgba(124, 58, 237, 0.1)",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "240px 1fr",
            gap: isMobile ? 24 : 32
          }}>
            {/* Image Col */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div onClick={() => onZoomImage(productImages.map(url => ({ url })), currentImgIdx)} style={{ background: "#f8f9fb", borderRadius: 20, width: "100%", height: 220, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", marginBottom: 12, cursor: "zoom-in" }}>
                {savingsPct > 0 && (
                  <div style={{ position: "absolute", top: 12, left: 12, background: "#8b5cf6", color: "#fff", borderRadius: 16, padding: "4px 10px", fontSize: 10, fontWeight: 800, zIndex: 10 }}>SAVE {savingsPct}%</div>
                )}
                <img key={currentImgIdx} src={productImages[currentImgIdx]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: "scale(1.08)", animation: "fadeIn 0.5s ease" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {productImages.slice(0, 4).map((img, i) => (
                  <div key={i} onClick={() => setCurrentImgIdx(i)} style={{ width: 44, height: 44, borderRadius: 8, border: i === currentImgIdx ? "2px solid #8b5cf6" : "1px solid #f1f5f9", padding: 5, background: "#fff", cursor: "pointer", transition: "all 0.2s" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Info Col */}
            <div>
              {(recommendedProduct.selectedCategory || searchedProduct.selectedCategory) && (
                <div style={{ marginBottom: 8 }}>
                  <span 
                    onClick={() => handleCategoryClick(recommendedProduct.selectedCategory || searchedProduct.selectedCategory)}
                    style={{ background: "#f0edff", color: "#7c3aed", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}
                  >
                    {recommendedProduct.selectedCategory || searchedProduct.selectedCategory}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "0 0 8px" }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>{recommendedProduct.name}</h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Composition:</span>
                <span 
                  onClick={() => handleCompositionClick(recommendedProduct.composition)}
                  style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  {recommendedProduct.composition}
                </span>
                    <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginLeft: 4 }}>{formatPackaging(recommendedProduct.packaging)}</span>
              </div>
              {recommendedProduct.manufacturer && (
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Brand: <strong style={{ color: "#7c3aed" }}>{recommendedProduct.manufacturer}</strong></p>
              )}
              
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <img src="/google.svg" alt="" style={{ width: 16, height: 16 }} />
                <Stars n={displayRating} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>{displayRating} ({displayReviewCount} Reviews)</span>
                <span style={{ margin: "0 6px", color: "#e5e7eb" }}>|</span>
                <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <MdCheckCircle size={16} /> In Stock
                </span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#111827" }}>₹{recommendedProduct.discountedPrice}</span>
                  <span style={{ fontSize: 16, color: "#9ca3af", textDecoration: "line-through" }}>₹{recommendedProduct.originalPrice}</span>
                  <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 800 }}>Saving: ₹{savings}</span>
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginTop: 2 }}>Inclusive of all taxes</div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {addedToCart ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "2px solid #8159f8", borderRadius: 12, padding: "10px 16px", userSelect: "none" }}>
                      <div onClick={() => onUpdateQty(recommendedProduct.product_id, qty - 1)} style={{ cursor: "pointer", color: "#8159f8", display: "flex", alignItems: "center" }}>
                        {qty === 1 ? <MdDeleteOutline size={22} /> : <MdRemove size={22} />}
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 18, color: "#8159f8", minWidth: 24, textAlign: "center" }}>{qty}</span>
                      <div onClick={() => onUpdateQty(recommendedProduct.product_id, qty + 1)} style={{ cursor: "pointer", color: "#8159f8", display: "flex", alignItems: "center" }}><MdAdd size={22} /></div>
                    </div>
                ) : (
                    <button onClick={() => onAddToCart(recommendedProduct.product_id)} style={{ flex: 1, background: "#fff", color: "#7c3aed", border: "2px solid #7c3aed", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <MdShoppingCart size={18} /> Add to Cart
                    </button>
                )}
                <button onClick={() => onBuyNow(recommendedProduct)} style={{ flex: 1, background: "#8159f8", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 16px rgba(124, 58, 237, 0.25)" }}>
                  Buy Now
                </button>
              </div>

              {deliveryInfo ? (
                  <div style={{ background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <MdLocalShipping size={18} color="#7c3aed" />
                    <div style={{ flex: 1, fontSize: 13, color: "#374151" }}>Delivery by <strong style={{ color: "#16a34a" }}>{deliveryInfo?.days}</strong></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9ca3af" }}>
                      {editingPincode ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <input type="text" inputMode="numeric" maxLength={6} placeholder="Pincode" value={pincodeInput}
                                   onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setPincodeInput(val); if (val.length === 6) handleCheckPincode(val); }}
                                   style={{ width: 70, border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px", fontSize: 11, outline: "none" }} autoFocus />
                          </div>
                      ) : (
                          <span onClick={() => { setEditingPincode(true); setPincodeInput(""); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            {deliveryInfo?.city?.split(",")[0] || "Nearby"} <MdEdit size={14} color="#7c3aed" />
                          </span>
                      )}
                    </div>
                  </div>
              ) : (
                  <div style={{ background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
                    <MdLocalShipping size={20} color="#8159f8" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Know Your Delivery Date</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>Enter pincode to check delivery</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        {editingPincode ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input type="text" inputMode="numeric" maxLength={6} placeholder="Pincode" value={pincodeInput}
                                       onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setPincodeInput(val); if (val.length === 6) handleCheckPincode(val); }}
                                       style={{ width: 80, border: "1px solid #d1d5db", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }} autoFocus />
                                <button onClick={() => handleCheckPincode()} style={{ background: "#8159f8", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700 }}>Check</button>
                            </div>
                        ) : (
                            <button onClick={() => setEditingPincode(true)} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 16px", fontSize: 12, color: "#8159f8", fontWeight: 700, cursor: "pointer" }}>Check</button>
                        )}
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM FEATURE CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
        {[
          { icon: <img src="/BsPatchCheckFill.svg" style={{ width: 24, height: 24, filter: "invert(46%) sepia(87%) saturate(2135%) hue-rotate(235deg) brightness(101%) contrast(96%)" }} />, label: "WHO/GMP CERTIFIED", bg: "#f5f3ff" },
          { icon: <MdLocalShipping size={24} color="#8b5cf6" />, label: "FAST DELIVERY", bg: "#f5f3ff" },
          { icon: <MdOutlineShield size={24} color="#8b5cf6" />, label: "SAFE & SECURE PAYMENT", bg: "#f5f3ff" },
          { icon: <MdHistory size={24} color="#8b5cf6" />, label: "7 DAYS EASY RETURN", bg: "#f5f3ff" },
        ].map((item, i) => (
          <div key={i} style={{ 
            background: "#fff", 
            border: "2.5px solid #f1f5f9", 
            borderRadius: 16, 
            padding: "26px 10px", 
            textAlign: "center", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: 12,
            transition: "all 0.2s",
            cursor: "pointer"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#7c3aed50"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#f1f5f9"}>
            <div style={{ background: item.bg, width: 54, height: 54, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {item.icon}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default function SearchViewMedicine(props) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { state } = location;
  const { cartItems, refreshCartCount, cartId } = useCart();

  const rawSlug = decodeURIComponent(location.pathname.replace(/^\/(product|medicine)\//, ""));
  const suggestion = useMemo(() => state?.product || { productName: rawSlug }, [state?.product, rawSlug]);

  const [product, setProduct] = useState(props.product || null);
  const [medicineDetails, setMedDetails] = useState(props.product ? {
    drugComposition: props.product.composition || "",
    countryOfOrigin: "India",
    sellerInfo: props.product.marketed_by || "",
    mrp: props.product.productPriceOld || "0",
    unitsPerPack: props.product.packaging || "",
    prescriptionRequired: props.product.prescription_required || "",
    formulation: props.product.formulation || "",
    consumeType: props.product.consumeType || "",
    scheduleCategory: props.product.schedule_category || "",
  } : {});
  const [slides, setSlides] = useState(props.product?.images ? props.product.images.map((img) => ({ url: `/cloudfront-cdn/products/${img.img}` })) : []);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [altProducts, setAltProducts] = useState(props.alternates || []);
  const [coupons, setCoupons] = useState([]);
  const [tabs, setTabs] = useState({});
  const [activeTab, setActiveTab] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [isRequestable, setIsRequestable] = useState(false);
  const [qty, setQty] = useState(1);
  const [showQtyPicker, setShowQtyPicker] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAltLoading, setIsAltLoading] = useState(false);
  const [modalIdx, setModalIdx] = useState(null);
  const [modalSlides, setModalSlides] = useState([]);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, active: false });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    issueType: "", description: "", orderId: "", contactDetails: "", attachments: null
  });

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportFormData.issueType || !reportFormData.description) {
      Swal.fire({ icon: 'error', text: 'Please fill in all required fields.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      return;
    }
    setReportSubmitted(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportFormData({ issueType: "", description: "", orderId: "", contactDetails: "", attachments: null });
    }, 300);
  };

  const [loading, setLoading] = useState(!props.product);
  const [activeAccordion, setActiveAccordion] = useState("");
  const [googleRating, setGoogleRating] = useState(null);
  const [googleReviewCount, setGoogleReviewCount] = useState(null);
  const [googleReviews, setGoogleReviews] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFade, setReviewFade] = useState(true);
  const [offerIdx, setOfferIdx] = useState(0);
  const [editingPincode, setEditingPincode] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [locationCity, setLocationCity] = useState("");
  const altRef = useRef(null);
  const sectionRefs = useRef({});
  const lastLoadedProductRef = useRef(null);
  const autoRef = useRef(null);
  const freqScrollRef = useRef(null);
  const popScrollRef = useRef(null);
  const [freqMeds, setFreqMeds] = useState([]);
  const [popularMeds, setPopularMeds] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const data = await getMainCategories();
        // CategorPage.js extract logic
        const extracted = data?.categories || data?.main_categories || (Array.isArray(data) ? data : []);
        setHierarchy(extracted || []);
      } catch (err) { console.error("Error fetching hierarchy:", err); }
    };
    fetchHierarchy();
  }, []);

  const nameToSlug = (name) =>
    name
      ? name
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      : "";

  const handleCategoryClick = (catName) => {
    if (!catName) return;
    
    // Normalize target category name
    const normalizedTarget = catName.toLowerCase().trim();
    const subCatSlug = nameToSlug(catName);
    let mainCatSlug = "";

    // Search for sub-category in hierarchy to find parent main category
    for (const main of hierarchy) {
      const currentMainName = main.name || main.title || main.category_name || "";
      const subItems = main.sub_categories || main.subcategories || main.items || main.children || [];
      
      // Check if current category is the main category itself
      if (currentMainName.toLowerCase().trim() === normalizedTarget) {
        navigate(`/categories/${nameToSlug(currentMainName)}`);
        return;
      }

      // Check if current category is a sub-category of this main category
      const foundInSubs = subItems.some(sub => {
        const subName = typeof sub === "string" ? sub : (sub.name || sub.title || sub.category_name || "");
        return subName.toLowerCase().trim() === normalizedTarget;
      });

      if (foundInSubs) {
        mainCatSlug = nameToSlug(currentMainName);
        break;
      }
    }

    if (mainCatSlug) {
      // Navigate to /categories/<main category>/<sub category>
      navigate(`/categories/${mainCatSlug}/${subCatSlug}`);
    } else {
      // Fallback: search for top-level match or use as default
      navigate(`/categories/${subCatSlug}`);
    }
  };

  const handleCompositionClick = (comp) => {
    if (!comp) return;
    navigate(`/salt/${encodeURIComponent(comp)}`);
  };

  useEffect(() => {
    if (slides.length < 2) return;
    autoRef.current = setInterval(() => setCurrentSlide((i) => (i + 1) % slides.length), 3000);
    return () => clearInterval(autoRef.current);
  }, [slides.length]);

  const fetchReviews = async () => {
    try {
      const res = await fetch("https://featurable.com/api/v1/widgets/fb210dba-0301-4000-982d-6e8006ca39f3");
      const data = await res.json();
      if (data?.success) {
        setGoogleRating(Number(data.averageRating).toFixed(1));
        setGoogleReviewCount(data.totalReviewCount);
        const sorted = (data.reviews || []).sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
        setGoogleReviews(sorted);
      }
    } catch (err) { console.error("Featurable reviews error:", err); }
  };

  const [promotionalOffers, setPromotionalOffers] = useState([
    { title: "Buy 2 Get 1 FREE", subtitle: "On prescribed medicines only", code: "B2G1FREE", highlight: "Special" },
    { title: "FREE DELIVERY", subtitle: "On all orders above ₹500", code: "FREEDEL500", highlight: "Popular" },
    { title: "5% OFF + FREE DELIVERY", subtitle: "Extra savings on orders above ₹1000", code: "MIGSAVER", highlight: "Best Value" }
  ]);

  useEffect(() => {
    const fetchDynamicOffers = async () => {
      try {
        const data = await getOffers(1);
        if (data && data.offers && data.offers.length > 0) {
          const mappedOffers = data.offers.map((apiOffer, index) => {
            let highlight = "Offer";
            if (index === 0) highlight = "Special";
            if (index === 1) highlight = "Popular";
            if (index === 2) highlight = "Best Value";

            let code = "MEDINGEN";
            if (apiOffer.title.toLowerCase().includes("buy 2")) code = "B2G1FREE";
            if (apiOffer.title.toLowerCase().includes("500")) code = "FREEDEL500";
            if (apiOffer.title.toLowerCase().includes("1000")) code = "MIGSAVER";
            
            // Extract the first term condition as a subtitle if available
            const matchFirstTerm = apiOffer.description?.split("\\n").find(l => /^\\d+\\./.test(l.trim()));
            const subtitle = matchFirstTerm ? matchFirstTerm.replace(/^\\d+\\.\\s*/, "") : "Apply coupon at checkout to avail this offer.";

            return {
              title: apiOffer.title,
              subtitle: subtitle,
              code: code,
              highlight: highlight
            };
          });
          setPromotionalOffers(mappedOffers);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic offers:", err);
      }
    };
    fetchDynamicOffers();
  }, []);

  useEffect(() => {
    if (promotionalOffers.length === 0) return;
    const interval = setInterval(() => { setOfferIdx((prev) => (prev + 1) % promotionalOffers.length); }, 4000);
    return () => clearInterval(interval);
  }, [promotionalOffers.length]);

  useEffect(() => {
    if (googleReviews.length < 3) return;
    const interval = setInterval(() => {
      setReviewFade(false);
      setTimeout(() => { setReviewIndex((prev) => (prev + 1) % googleReviews.length); setReviewFade(true); }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, [googleReviews.length]);

  useEffect(() => { fetchReviews(); }, []);

  useEffect(() => {
    const fetchDiscoveryMeds = async () => {
      try {
        const data = await getFooterProducts();
        
        const normalize = (list) => (list || []).slice(0, 20).map(item => ({
            product_id: item.product_id,
            productName: item.label,
            product_name_url: item.product_name_url,
            productPriceNew: parseFloat(item.product_pricing_new || 0),
            productPriceOld: parseFloat(item.product_pricing_old || 0),
            manufacturer: item.manufacturer || "",
            inStock: item.inStock === true || item.inStock === 1 || item.inStock === "1",
            rc: item.rc === undefined ? 1 : Number(item.rc),
            images: item.first_image_url
                ? [{ img: item.first_image_url }]
                : []
        }));

        setFreqMeds(normalize(data.frequentlySearchedMedicine));
        setPopularMeds(normalize(data.popularMedicine));
      } catch (err) { console.error("Discovery meds fetch error:", err); }
    };
    fetchDiscoveryMeds();
  }, []);

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const all = await getAllBlogs(false);
        if (all && Array.isArray(all)) setBlogPosts(all.slice(0, 6));
      } catch (err) { console.error("Blog fetch error:", err); }
    };
    fetchBlogData();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = parseFloat(position.coords.latitude.toFixed(4));
        const longitude = parseFloat(position.coords.longitude.toFixed(4));
        try {
          const locationResponse = await fetch(`https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=66d4782bb3d09960167594uts506c6d`);
          const locationData = await locationResponse.json();
          const postalCode = locationData.address.postcode || locationData.address.postcode_ext || "";
          if (postalCode) {
            const suburb = locationData.address.suburb || "";
            const state_district = locationData.address.state_district || locationData.address.county || "";
            const city = suburb && state_district ? `${suburb}, ${state_district}` : suburb || state_district || "";
            const firstDigit = String(postalCode).trim().charAt(0);
            const days = firstDigit === "6" ? "1-2 days" : firstDigit === "5" ? "2 days" : "3-4 days";
            setLocationCity(city);
            setDeliveryInfo({ pincode: postalCode, city, days });
          }
        } catch (err) { console.error("Reverse geocode error:", err); }
      },
      (error) => { console.error("Error obtaining location:", error.message); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const fetchProduct = useCallback(async () => {
    if (props && props.product) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setIsAltLoading(false);
    try {
      const result = suggestion.product_id
        ? await getProductDetails(suggestion.product_id)
        : await getProductDetails(0, suggestion.productName);
      if (!result) return;

      const imgList = (result.images || []).map((img) => ({ url: `/cloudfront-cdn/products/${img.img}` }));
      setSlides(imgList);

      const p = {
        product_id: result.product_id,
        name: result.productName,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        meta_keywords: result.meta_keywords,
        manufacturer: result.manufacturer || "",
        genericName: result.composition || "",
        ourPrice: parseFloat(result.productPriceNew) || 0,
        mrp: parseFloat(result.productPriceOld) || 0,
        composition: result.composition || "",
        product_available: result.product_available,
        inStock: result.inStock === true || result.inStock === 1 || result.in_stock === 1 || result.in_stock === true,
        product_request: result.product_request,
        product_name_url: result.product_name_url,
        packaging: result.packaging || "",
        prescription_required: result.prescription_required || "",
        selectedCategory: result.selectedCategory || "",
        formulation: result.formulation || "",
        consumeType: result.consumeType || "",
        schedule_category: result.schedule_category || "",
        used_for: result.used_for || "",
        benefits: result.benefits || null,
        drugInteractions: result.drugInteractions || null,
        howItWorks: result.howItWorks || null,
        howToUse: result.howToUse || null,
        productDescription: result.productDescription || null,
        pharmacistNote: result.pharmacistNote || null,
        sideEffects: result.sideEffects || null,
        safetyAdvice: result.safetyAdvice || null,
        faq: result.faq || null,
        references: result.references || null,
        di_severity_options: result.di_severity_options || [],
        se_severity_options: result.se_severity_options || [],
        se_type_options: result.se_type_options || [],
        imageSrc: imgList[0]?.url || "/medicine-details.png",
        rc: result.rc === undefined ? 1 : Number(result.rc),
        recommended_products: result.recommended_products || []
      };
      setProduct(p);
      lastLoadedProductRef.current = p.product_id;
      setMedDetails({
        drugComposition: result.composition || "",
        countryOfOrigin: "India",
        sellerInfo: result.marketed_by || "",
        mrp: result.productPriceOld || "0",
        unitsPerPack: result.packaging || "",
        prescriptionRequired: result.prescription_required || "",
        formulation: result.formulation || "",
        consumeType: result.consumeType || "",
        scheduleCategory: result.schedule_category || "",
      });
      if (!p.product_available && p.product_request) setIsRequestable(true);
      // rc=1 out-of-stock → trigger alt search; rc=0 → recommended_products already in response
      // FIXED: if rc=0 and no recommended_products, also trigger alt search
      if ((p.rc === 1 && p.inStock === false && p.composition) || (p.rc === 0 && (!p.recommended_products || p.recommended_products.length === 0) && p.composition)) setIsAltLoading(true);
      else setIsAltLoading(false);

      if (result.productCoupon) {
        const codes = result.productCoupon.split(",");
        const data = await Promise.all(codes.map((c) => getCouponDetails(c).catch(() => null)));
        setCoupons(data.filter(Boolean));
      }

      const targetHtmlUrl = result.descriptionLegacyUrl || (result.productDescription?.endsWith('.html') ? result.productDescription : null);
      if (targetHtmlUrl) {
        try {
          const res = await axios.get(`/cloudfront-cdn/product_description/${targetHtmlUrl}`);
          const sanitized = DOMPurify.sanitize(res.data);
          const parsed = parseDescriptionToTabs(sanitized);
          if (parsed["Frequently Asked Questions"]) injectFaqSchema(parsed["Frequently Asked Questions"]);
          setTabs(parsed);
          setActiveTab(Object.keys(parsed)[0] || "");
        } catch (_) { }
      }
    } catch (err) { console.error("fetchProduct error:", err); }
    finally { setLoading(false); }
  }, [suggestion.product_id, suggestion.productName]);

  useEffect(() => {
    if (props && props.product) {
      // Bypassed fetchProduct due to server-side props
      return;
    }
    fetchProduct();
  }, [fetchProduct, props]);

  useEffect(() => {
    if (!product) return;
    if (lastLoadedProductRef.current === product.product_id) return;
    lastLoadedProductRef.current = product.product_id;
    const targetHtmlUrl = product.descriptionLegacyUrl || (product.productDescription?.endsWith('.html') ? product.productDescription : null);
    if (targetHtmlUrl) {
      const fetchLegacyHtml = async () => {
        try {
          const res = await axios.get(`/cloudfront-cdn/product_description/${targetHtmlUrl}`);
          const sanitized = DOMPurify.sanitize(res.data);
          const parsed = parseDescriptionToTabs(sanitized);
          if (parsed["Frequently Asked Questions"]) injectFaqSchema(parsed["Frequently Asked Questions"]);
          setTabs(parsed);
          setActiveTab(Object.keys(parsed)[0] || "");
        } catch (err) {
          console.error("Error loading legacy description HTML client-side:", err);
        }
      };
      fetchLegacyHtml();
    } else {
      setTabs({});
    }
  }, [product]);

  useEffect(() => {
    if (props && props.alternates && props.product) {
      // Bypassed alt products fetch due to server-side props
      return;
    }
    if (!product?.composition) return;
    (async () => {
      try {
        const [altRes, avgRes] = await Promise.all([
          search_altProducts(1, { composition: product.composition, exclude_product_id: product.product_id, rc: 1 }),
          getAveragePrice(product.composition),
        ]);
        const avg = parseFloat(avgRes?.averagePrice || 0);
        if (altRes?.results?.length) {
          setAltProducts(
            altRes.results
              .filter((x) => x.product_pricing_new)
              .map((x) => {
                let imgs = [];
                try {
                  const parsed = typeof x.images === "string" ? JSON.parse(x.images) : x.images;
                  if (Array.isArray(parsed)) {
                    imgs = parsed.map(i => i.img).map(u => getCdnImageUrl(u));
                  }
                } catch (e) { }

                if (!imgs.length && x.first_image_url) {
                  imgs = [getCdnImageUrl(x.first_image_url)];
                }

                return {
                  name: x.product_name,
                  manufacturer: x.manufacturer,
                  discountedPrice: x.product_pricing_new,
                  originalPrice: x.product_pricing_old,
                  discount: avg ? Math.max(0, Math.round(((avg - parseFloat(x.product_pricing_new)) / avg) * 100)) : 0,
                  imageUrl: imgs[0] || "",
                  slides: imgs,
                  product_name_url: x.product_name_url,
                   product_id: x.product_id,
                   composition: x.composition || "",
                   packaging: x.packaging || "",
                   inStock: x.inStock == 1 || x.inStock === true || x.in_stock == 1 || x.in_stock === true || x.product_available == 1 || x.product_available === true,
                   rc: x.rc === undefined ? 1 : Number(x.rc)
                 };
              })
              .sort((a, b) => a.discountedPrice - b.discountedPrice)
              .slice(0, 20)
          );
        }
      } catch (_) { }
      finally { setIsAltLoading(false); }
    })();
  }, [product?.composition]);

  useEffect(() => {
    if (!product?.product_id) return;
    const itemInCart = (cartItems || []).find((item) => String(item.product_id || item.id) === String(product.product_id));
    if (itemInCart) { setQty(Number(itemInCart.quantity)); setAddedToCart(true); }
    else { setAddedToCart(false); setQty(1); }
  }, [product?.product_id, cartItems]);

  useEffect(() => {
    if (Object.keys(tabs).length > 0) setActiveAccordion(Object.keys(tabs)[0]);
  }, [tabs]);

  const handleAddToCart = async () => {
    const user = getUser();
    if (!user?.isLoggedIn) { navigate("/login"); return; }
    if (!user.name) { navigate("/create-profile"); return; }
    try {
      setQty(1); setAddedToCart(true);
      await addToCart(product.product_id, null, 1, navigate);
      await refreshCartCount();
    } catch (_) {
      setAddedToCart(false);
      Swal.fire({ title: "Error", text: "Could not add to cart.", icon: "error", confirmButtonText: "OK" });
    }
  };

  const handleBuyNow = async () => {
    const user = getUser();
    if (!user?.isLoggedIn) { navigate("/login"); return; }
    if (!user.name) { navigate("/create-profile"); return; }
    if (!addedToCart) {
      try {
        setQty(1); setAddedToCart(true);
        await addToCart(product.product_id, null, 1, navigate);
        await refreshCartCount();
      } catch (_) {
        setAddedToCart(false);
        Swal.fire({ title: "Error", text: "Could not add to cart.", icon: "error", confirmButtonText: "OK" });
        return;
      }
    }
    navigate("/cart");
  };

  const handleAnyQtyUpdate = async (productId, newQty) => {
    const itemInCart = (cartItems || []).find((item) => String(item.product_id || item.id) === String(productId));
    const currentQty = itemInCart ? Number(itemInCart.quantity) : 0;
    const delta = newQty - currentQty;
    if (delta === 0) return;

    try { 
      if (cartId) {
        const quantities = {};
        (cartItems || []).forEach(it => { quantities[String(it.product_id || it.id)] = Number(it.quantity); });
        quantities[String(productId)] = newQty;
        await updateCartData(quantities, cartId);
      } else {
        await addToCart(productId, null, delta, navigate); 
      }
      await refreshCartCount();
    }
    catch (err) { 
      if (err.message === "STALE_CART") {
        try {
          await addToCart(productId, null, delta, navigate);
          await refreshCartCount();
          return;
        } catch (retryErr) {
          console.error("Retry failed:", retryErr);
        }
      }
      console.error("Update failed:", err);
      Swal.fire({ title: "Error", text: "Could not update quantity.", icon: "error", confirmButtonText: "OK" }); 
    }
  };

  const updateQty = (newQty) => handleAnyQtyUpdate(product.product_id, newQty);

  const handleRequest = async () => {
    const user = getUser();
    if (!user?.isLoggedIn) { navigate("/login"); return; }
    const restricted = ["alprazolam", "clonazepam", "lorazepam", "sildenafil", "tadalafil", "escitalopram", "clonazepam + escitalopram oxalate"].includes((product.genericName || "").toLowerCase());
    if (restricted) {
      const { isConfirmed } = await Swal.fire({ title: "Upload Prescription?", text: "This product requires a prescription.", icon: "question", showCancelButton: true, confirmButtonText: "Yes, Upload", cancelButtonText: "No" });
      if (isConfirmed) navigate("/upload-prescription", { state: { from: "request-product", product_id: product.product_id } });
    } else {
      const res = await requestProduct(product.product_id, user.customer_id, null, "Insert", "PENDING");
      if (res) Swal.fire({ icon: "success", title: "Request Sent", text: "We'll notify you when available.", confirmButtonText: "OK" });
    }
  };

  const handleNotifyAlt = async (e, prod) => {
    e.stopPropagation();
    const user = getUser();
    if (!user?.isLoggedIn) { navigate("/login"); return; }
    const restricted = ["alprazolam", "clonazepam", "lorazepam", "sildenafil", "tadalafil", "escitalopram", "clonazepam + escitalopram oxalate"].includes((prod.genericName || "").toLowerCase());
    if (restricted) {
      const { isConfirmed } = await Swal.fire({ title: "Upload Prescription?", text: "This product requires a prescription.", icon: "question", showCancelButton: true, confirmButtonText: "Yes, Upload", cancelButtonText: "No" });
      if (isConfirmed) navigate("/upload-prescription", { state: { from: "request-product", product_id: prod.product_id } });
    } else {
      const res = await requestProduct(prod.product_id, user.customer_id, null, "Insert", "PENDING");
      if (res) Swal.fire({ icon: "success", title: "Request Sent", text: "We'll notify you when available.", confirmButtonText: "OK" });
    }
  };

  const handleShare = async () => {
    const url = `https://medingen.in/product/${product.product_name_url}`;
    try { if (navigator.share) await navigator.share({ title: product.name, url }); else navigator.clipboard.writeText(url); } catch (_) { }
  };

  const handleCompare = () => navigate("/compare", { state: product });
  const handleViewAlt = (alt) => navigate(`/product/${alt.product_name_url}`);
  const scrollAlts = (d) => altRef.current?.scrollBy({ left: d * 200, behavior: "smooth" });

  const getDeliveryDays = (pincode) => {
    const firstDigit = String(pincode).trim().charAt(0);
    if (firstDigit === "6") return "1-2 days";
    if (firstDigit === "5") return "2 days";
    return "3-4 days";
  };

  const handleCheckPincode = async (pinToCheck = null) => {
    const val = (typeof pinToCheck === "string" ? pinToCheck : pincodeInput) || "";
    const cleaned = String(val).trim();
    if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) { setPincodeError("Please enter a valid 6-digit pincode."); return; }
    setPincodeError("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
      const data = await res.json();
      if (!data?.[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) { setPincodeError("Invalid pincode. Please try again."); return; }
      const po = data[0].PostOffice[0];
      const city = `${po.Name}, ${po.District || po.Block || ""}`;
      const days = getDeliveryDays(cleaned);
      setDeliveryInfo({ pincode: cleaned, city, days });
      setEditingPincode(false);
    } catch (_) { setPincodeError("Could not verify pincode. Please try again."); }
  };

  const handleScrollToSection = (section) => { window.location.href = "/about#" + section; };

  const faqs = tabs["Frequently Asked Questions"] ? parseFAQs(tabs["Frequently Asked Questions"]) : [];
  const contentTabs = Object.keys(tabs).filter((t) => t !== "Frequently Asked Questions");
  const savings = product ? Math.max(0, product.mrp - product.ourPrice).toFixed(2) : 0;
  const savingsPct = product?.mrp ? Math.round(((product.mrp - product.ourPrice) / product.mrp) * 100) : 0;

  const recommendedAlt = (() => {
    if (!product) return null;
    let rec = null;
    if (product.rc === 0 && product.recommended_products?.length > 0) {
      const rp = product.recommended_products[0];
      let imgs = [];
      try {
        const parsed = typeof rp.images === "string" ? JSON.parse(rp.images) : rp.images;
        if (Array.isArray(parsed)) imgs = parsed.map(i => i.img).map(u => getCdnImageUrl(u));
      } catch (e) {}
      rec = {
        name: rp.product_name,
        manufacturer: rp.manufacturer || "",
        discountedPrice: parseFloat(rp.product_pricing_new || 0),
        originalPrice: parseFloat(rp.product_pricing_old || 0),
        discount: 0,
        imageUrl: imgs[0] || "",
        slides: imgs,
        product_name_url: rp.product_name_url,
         product_id: rp.product_id,
         composition: rp.composition || "",
         packaging: rp.packaging || "",
         inStock: rp.inStock === 1 || rp.inStock === true || rp.in_stock === 1,
         rc: rp.rc === undefined ? 1 : Number(rp.rc),
         selectedCategory: rp.selected_category || ""
       };
    } else if ((product.rc === 0 && (!product.recommended_products || product.recommended_products.length === 0)) || (product.rc === 1 && product.inStock === false)) {
      rec = altProducts.find(a => a.inStock) || null;
    }
    
    if (rec && String(rec.product_id) === String(product.product_id)) return null;
    return rec;
  })();

  if ((loading || isAltLoading) && !product) return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#f8f9fa", minHeight: "100vh", width: "100%" }}>
      <div style={{ height: 72, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 20px" }}>
        <div style={{ width: 120, height: 24, background: "#e5e7eb", borderRadius: 4, animation: "pulse 1.5s infinite ease-in-out" }} />
      </div>
      <div style={{ width: "100%", maxWidth: 1200, margin: "24px auto", padding: "0 20px", boxSizing: "border-box" }}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5 } 50% { opacity: 1 } } .skel-grid { display: grid; gap: 32px; grid-template-columns: 1fr; width: 100%; box-sizing: border-box; } @media (min-width: 768px) { .skel-grid { grid-template-columns: 400px 1fr; } }`}</style>
        <div className="skel-grid">
          <div style={{ background: "#fff", borderRadius: 24, height: isMobile ? 300 : 450, animation: "pulse 1.5s infinite ease-in-out", border: "1px solid #e5e7eb", width: "100%", boxSizing: "border-box" }}></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", boxSizing: "border-box" }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: isMobile ? 16 : 24, border: "1px solid #e5e7eb" }}>
              <div style={{ width: "80%", height: isMobile ? 24 : 32, background: "#e5e7eb", borderRadius: 8, marginBottom: 16, animation: "pulse 1.5s infinite ease-in-out" }}></div>
              <div style={{ width: "40%", height: 16, background: "#e5e7eb", borderRadius: 6, marginBottom: 24, animation: "pulse 1.5s infinite ease-in-out" }}></div>
              <div style={{ width: "20%", height: 32, background: "#e5e7eb", borderRadius: 16, animation: "pulse 1.5s infinite ease-in-out" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <span style={{ color: "#ef4444", fontWeight: 600 }}>Product not found.</span>
    </div>
  );

  const renderBottomSections = () => (
    <>
      <div style={{ height: "40px" }}></div>
      {freqMeds.length > 0 && (
        <div style={{ maxWidth: 1280, margin: isMobile ? "32px auto 0" : "24px auto 0", padding: isMobile ? "0 20px" : "0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Most Bought by customer</h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Explore similar medicines from top-rated brands</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (freqScrollRef.current) freqScrollRef.current.scrollBy({ left: -300, behavior: "smooth" }); }}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
                <FiArrowLeft size={16} />
              </button>
              <button onClick={() => { if (freqScrollRef.current) freqScrollRef.current.scrollBy({ left: 300, behavior: "smooth" }); }}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
                <FiArrowRight size={16} />
              </button>
            </div>
          </div>
          <div ref={freqScrollRef} style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
            {freqMeds.map((p, i) => {
              const mrp = parseFloat(p.productPriceOld || 0);
              const our = parseFloat(p.productPriceNew || 0);
              const disc = mrp > our && mrp > 0 ? Math.round(((mrp - our) / mrp) * 100) : 0;
              const img = p.images?.length > 0 ? `/cloudfront-cdn/products/${p.images[0].img}` : "/medicine-details.png";
              const freqCartItem = (cartItems || []).find(item => String(item.product_id || item.id) === String(p.product_id));
              const freqQty = freqCartItem ? Number(freqCartItem.quantity) : 0;
              return (
                <div key={i} onClick={() => navigate("/product/" + p.product_name_url)}
                  className="sv-product-card"
                  style={{ minWidth: 190, maxWidth: 190, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,.05)", overflow: "hidden", flexShrink: 0, cursor: "pointer", transition: "transform .2s, box-shadow .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.05)"; }}>
                  <div style={{ background: "#f8f9fb", height: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
                    {disc > 0 && <div style={{ position: "absolute", top: 10, right: 10, background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 20, padding: "3px 8px", zIndex: 2 }}>{disc}% OFF</div>}
                    {p.inStock === false && <div className="card-out-of-stock-badge" style={{ zIndex: 2 }}>SOLD OUT</div>}
                    <img src={img} alt={p.productName} onError={e => { e.target.src = "/medicine-details.png"; }} style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain", transform: "scale(1.08)" }} />
                  </div>
                  <div style={{ padding: "14px 14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.3, marginBottom: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.productName}</div>
                    {p.composition && (
                      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>
                        {p.composition?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </div>
                    )}
                    <div style={{ marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>₹{our.toFixed(0)}</div>
                        {mrp > our && <div style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>₹{mrp.toFixed(0)}</div>}
                      </div>
                      
                      {p.rc === 0 ? (
                        <button onClick={e => { e.stopPropagation(); navigate("/product/" + p.product_name_url); }}
                          style={{ width: "100%", background: "transparent", color: "#7c3aed", border: "1.5px solid #7c3aed", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f5f3ff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          View
                        </button>
                      ) : (p.rc === 1 && p.inStock === false) ? (
                        <button onClick={e => handleNotifyAlt(e, p)}
                          style={{ width: "100%", background: "transparent", color: "#7c3aed", border: "1.5px solid #7c3aed", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f5f3ff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          Notify me
                        </button>
                      ) : freqQty > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f3ff", border: "1.5px solid #7c3aed", borderRadius: 10, padding: "8px 12px" }} onClick={e => e.stopPropagation()}>
                          <div onClick={() => handleAnyQtyUpdate(p.product_id, freqQty - 1)} style={{ cursor: "pointer", color: "#7c3aed", display: "flex", alignItems: "center" }}>
                            {freqQty === 1 ? <MdDeleteOutline size={18} /> : <MdRemove size={18} />}
                          </div>
                          <span style={{ fontWeight: 800, fontSize: 15, color: "#7c3aed", minWidth: 20, textAlign: "center" }}>{freqQty}</span>
                          <div onClick={() => handleAnyQtyUpdate(p.product_id, freqQty + 1)} style={{ cursor: "pointer", color: "#7c3aed", display: "flex", alignItems: "center" }}><MdAdd size={18} /></div>
                        </div>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); handleAnyQtyUpdate(p.product_id, 1); }}
                          style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background .2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#6d28d9"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#7c3aed"; }}>
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {blogPosts.length > 0 && (
        <div style={{ maxWidth: 1280, margin: isMobile ? "50px auto 24px" : "56px auto 64px", padding: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 18 : 24, padding: isMobile ? "0 20px" : "0 32px" }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 21 : 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>Related Health Articles</h2>
              <p style={{ fontSize: isMobile ? 12 : 13, color: "#6b7280", marginTop: 4 }}>Expert medical advice from specialist team</p>
            </div>
            <button onClick={() => navigate("/blogs")} style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#7c3aed", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 20, padding: "7px 16px", transition: "all 0.2s" }}>
              View all
            </button>
          </div>
          <div id="blog-scroll-track" style={{ display: "flex", gap: isMobile ? 14 : 20, padding: isMobile ? "0 20px 24px" : "0 32px 32px", overflowX: "auto", scrollbarWidth: "none", scrollSnapType: isMobile ? "x mandatory" : "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
            <style>{`#blog-scroll-track::-webkit-scrollbar { display: none; }`}</style>
            {blogPosts.map((blog, i) => {
              const blogCategories = ["Immunity", "Nutrition", "Wellness", "Diabetes", "Heart Health", "Skin Care"];
              const categoryColors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#8b5cf6"];
              const cat = blogCategories[i % blogCategories.length];
              const catColor = categoryColors[i % categoryColors.length];
              return (
                <div key={blog.id || i}
                  style={{ minWidth: isMobile ? "calc(88vw - 12px)" : "320px", width: isMobile ? "calc(88vw - 12px)" : "320px", background: "#fff", borderRadius: 20, border: "1px solid #efeff4", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", cursor: "pointer", flexShrink: 0, transition: "all 0.3s ease", scrollSnapAlign: "center" }}
                  onClick={() => navigate(`/blogs/${blog.blog_url}`)}
                  onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.08)"; } }}
                  onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)"; } }}>
                  <div style={{ height: isMobile ? 165 : 185, overflow: "hidden", background: "#f8f9fa", position: "relative" }}>
                    <img src={`/cloudfront-cdn/blogs/images/${blog.blog_image_url}`} alt={blog.blog_name}
                      onError={e => { e.target.src = "https://placehold.co/400x200/f3f4f6/9ca3af?text=Article"; }}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: 14, left: 14 }}>
                      <span style={{ background: "rgba(255,255,255,0.9)", color: catColor, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", fontSize: 10, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase", borderRadius: 8, padding: "5px 12px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>{cat}</span>
                    </div>
                  </div>
                  <div style={{ padding: isMobile ? "18px 20px 22px" : "20px 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <h3 style={{ fontSize: isMobile ? 16 : 17, fontWeight: 800, color: "#111827", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", letterSpacing: "-0.2px" }}>{blog.blog_name}</h3>
                    <p style={{ fontSize: isMobile ? 12.5 : 13, color: "#6b7280", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{blog.meta_description || "Read professional medical insights from our specialist pharmacy team."}</p>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                      Learn More <FiArrowRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ margin: isMobile ? "24px 16px 24px" : "40px auto", maxWidth: 1280, padding: isMobile ? "32px 20px" : "80px 64px", background: "#8B5CF6", borderRadius: isMobile ? 20 : 24, textAlign: "center", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(139, 92, 246, 0.15)" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: isMobile ? 160 : 300, height: isMobile ? 160 : 300, background: "rgba(255,255,255,0.1)", borderRadius: "50%", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: isMobile ? 200 : 400, height: isMobile ? 200 : 400, background: "rgba(255,255,255,0.05)", borderRadius: "50%", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: isMobile ? 20 : 36, fontWeight: 800, marginBottom: isMobile ? 8 : 16, color: "#fff" }}>India's Best Generic Online Platform</h2>
          <p style={{ fontSize: isMobile ? 12 : 16, color: "#fff", maxWidth: 650, margin: isMobile ? "0 auto 32px" : "0 auto 48px", lineHeight: 1.6 }}>Delivering genuine medicines and healthcare essentials with uncompromised quality and speed.</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 20 : 32, maxWidth: "100%", margin: "0 auto", marginTop: isMobile ? 32 : 48 }}>
            {[
              { icon: <FiUsers size={isMobile ? 18 : 22} />, val: "10M+", label: "HAPPY CUSTOMERS" },
              { icon: <FiTruckAlt size={isMobile ? 18 : 22} />, val: "50K+", label: "DELIVERIES COMPLETED" },
              { icon: <BsPatchCheckFill size={isMobile ? 18 : 22} />, val: "100%", label: "GENUINE MEDICINES" },
              { icon: <FiShield size={isMobile ? 18 : 22} />, val: "Verified", label: "PHARMACISTS" }
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 10 : 16 }}>
                <div style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, background: "rgba(255,255,255,0.2)", borderRadius: isMobile ? 12 : 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, lineHeight: 1, color: "#fff" }}>{item.val}</div>
                  <div style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 700, color: "#fff", letterSpacing: isMobile ? "0.8px" : "1.2px", marginTop: isMobile ? 5 : 8, textTransform: "uppercase" }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)", width: "100vw" }}>
        <Footer handleScrollToSection={handleScrollToSection} />
      </div>
    </>
  );

  const renderMedicineContent = () => {
    if (!product) return null;
    const hasPremiumContent = ((product.productDescription && !product.productDescription.endsWith('.html')) || (product.benefits?.length > 0) || (product.drugInteractions?.length > 0) || product.howItWorks || (product.howToUse?.length > 0) || (product.safetyAdvice?.length > 0) || (product.sideEffects?.length > 0) || (product.faq?.length > 0) || product.references);

    if (hasPremiumContent) return <PremiumStructuredContent product={product} isMobile={isMobile} />;

    if (Object.keys(tabs).length > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.keys(tabs).map((section) => {
            const content = tabs[section];
            const isFaqSection = section === "Frequently Asked Questions";
            const faqItems = isFaqSection ? parseFAQs(content) : [];
            return (
              <div key={section} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <button
                  onClick={() => { /* no-op to keep always open */ }}
                  style={{ 
                    width: "100%", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: isMobile ? "16px 14px" : "18px 24px", 
                    background: "none", 
                    border: "none", 
                    cursor: "default", 
                    textAlign: "left" 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                  <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#111827" }}>{section}</span>
                  <span style={{ color: "#9ca3af", transition: "transform .3s", transform: "rotate(180deg)" }}>
                    <FiChevronDown size={isMobile ? 18 : 20} />
                  </span>
                </button>
                <div style={{ 
                  padding: isMobile ? "0 14px 16px" : "0 24px 24px", 
                  fontSize: isMobile ? 12 : 13, 
                  color: "#4b5563", 
                  lineHeight: 1.7, 
                  borderTop: "1px solid #f3f4f6", 
                  paddingTop: isMobile ? 14 : 20, 
                  textAlign: "justify" 
                }}>
                  {isFaqSection && faqItems.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
                        {faqItems.map((faq, idx) => (
                          <div key={idx} style={{ background: "#f8f9fa", borderRadius: isMobile ? 12 : 16, padding: isMobile ? "14px 16px" : "18px 20px", borderLeft: "4px solid #7c3aed", border: "1px solid #f1f5f9", borderLeftWidth: 4 }}>
                            <div style={{ display: "flex", gap: isMobile ? 12 : 14, marginBottom: 8 }}>
                              <span style={{ background: "#f3e8ff", color: "#7c3aed", fontWeight: 800, minWidth: isMobile ? 24 : 26, height: isMobile ? 24 : 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 10 : 11, flexShrink: 0 }}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <h4 style={{ margin: 0, fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#111827", flex: 1, lineHeight: 1.4 }}>{faq.question}</h4>
                            </div>
                            <p style={{ margin: 0, fontSize: isMobile ? 12 : 13, color: "#4b5563", lineHeight: 1.7, paddingLeft: isMobile ? 36 : 40, textAlign: "justify" }}>{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    ) : content ? (
                      <div dangerouslySetInnerHTML={{ __html: content }} />
                    ) : (
                      <div style={{ color: "#9ca3af", fontStyle: "italic" }}>Information currently being updated.</div>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  /* ── Trust badges component (reusable) ── */
  const TrustBadgesRow = ({ compact = false }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: compact ? 10 : 16, marginTop: compact ? 20 : 24 }}>
      {[
        { icon: "/BsPatchCheckFill.svg", label: "WHO/GMP\nCERTIFIED", bg: "#f5f3ff" },
        { icon: "/BsTruck.svg", label: "FAST\nDELIVERY", bg: "#faf5ff" },
        { icon: "/BsShieldCheck.svg", label: "SAFE & SECURE\nPAYMENT", bg: "#fdf4ff" },
        { icon: "/BsClockHistory.svg", label: "7 DAYS EASY\nRETURN", bg: "#f5f3ff" },
      ].map(({ icon, label, bg }) => (
        <div key={label} style={{ background: "#fff", borderRadius: 14, padding: compact ? "18px 8px" : "24px 10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 12 : 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ background: bg, borderRadius: "50%", width: compact ? 48 : 56, height: compact ? 48 : 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={icon} alt={label} style={{ width: compact ? 26 : 30, height: compact ? 26 : 30, filter: "invert(46%) sepia(87%) saturate(2135%) hue-rotate(235deg) brightness(101%) contrast(96%)" }} />
          </div>
          <span style={{ fontSize: compact ? 10.5 : 11, fontWeight: 800, color: "#1f2937", letterSpacing: 0.3, lineHeight: 1.35, textTransform: "uppercase", whiteSpace: "pre-line" }}>{label}</span>
        </div>
      ))}
    </div>
  );

  /* ── render ── */
  return <>
    <div className="dashboard">
      <Helmet>
        <title>{product.meta_title || product.metaTitle || product.productName || product.name || "Medingen Product"}</title>
        <meta name="description" content={product.meta_description || product.metaDescription || product.used_for || product.productDescription || "Trusted online pharmacy product details."} />
        <meta name="keywords" content={product.meta_keywords || product.metaKeywords || (product.tags && product.tags.join(", ")) || "online pharmacy, medicine"} />
        <link rel="canonical" href={`https://medingen.in/product/${product.product_name_url || product.productName?.toLowerCase().replace(/\s+/g, "-")}`} />
        <meta property="og:title" content={product.meta_title || product.metaTitle || product.productName || product.name || "Medingen Product"} />
        <meta property="og:description" content={product.meta_description || product.metaDescription || product.used_for || product.productDescription || "Trusted online pharmacy product details."} />
        <meta name="twitter:description" content={product.meta_description || product.metaDescription || product.used_for || product.productDescription || "Trusted online pharmacy product details."} />
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{height:4px;width:4px}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}
        ul,ol{padding-left:20px}
        li{margin-bottom:5px;font-size:14px;color:#374151;line-height:1.7}
        p{margin-bottom:10px;font-size:14px;color:#374151;line-height:1.85}
        h3{margin-bottom:8px;color:#111827}
        .alt-card-btn:hover{background:#5d399b!important;color:#fff!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .sv-cta-btn{flex:1;background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit}
        .sv-cta-btn:hover:not(:disabled){background:#6d28d9;box-shadow:0 6px 16px rgba(124,58,237,0.4);transform:translateY(-1px)}
        .sv-cta-btn:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed}
        .sv-image-container { overflow: hidden; position: relative; }
        .sv-product-card img { 
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .sv-product-card:hover img { 
          transform: scale(1.22) !important;
        }
        @media(max-width:768px){
          .sv-grid{grid-template-columns:1fr!important}
          .sv-price{font-size:28px!important}
          .premium-info-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <Header />

      <div className="dashboard-container" style={{ padding: 0, background: "#fff", overflow: "hidden" }}>
        {!isMobile ? (
          /* ───── DESKTOP VIEW ───── */
          <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 32px", position: "relative" }}>
            {recommendedAlt && (
              <SubstitutionComparison 
                searchedProduct={{
                  product_id: product.product_id,
                  name: product.name,
                  imageSrc: slides[0]?.url,
                  images: slides,
                  composition: medicineDetails?.drugComposition,
                  packaging: medicineDetails?.unitsPerPack,
                  mrp: product.mrp,
                  price: product.ourPrice,
                  inStock: product.inStock,
                  selectedCategory: product.selectedCategory,
                  rc: product.rc,
                  genericName: product.genericName
                }}
                recommendedProduct={recommendedAlt}
                onNotify={handleNotifyAlt}
                onAddToCart={(id) => handleAnyQtyUpdate(id, 1)}
                onBuyNow={(alt) => { handleAnyQtyUpdate(alt.product_id, 1); navigate("/cart"); }}
                onShare={handleShare}
                onCompare={handleCompare}
                isMobile={isMobile}
                deliveryInfo={deliveryInfo}
                googleRating={googleRating}
                googleReviewCount={googleReviewCount}
                qty={(cartItems || []).find(it => String(it.product_id || it.id) === String(recommendedAlt.product_id))?.quantity || 0}
                addedToCart={(cartItems || []).some(it => String(it.product_id || it.id) === String(recommendedAlt.product_id))}
                onUpdateQty={handleAnyQtyUpdate}
                handleCompositionClick={handleCompositionClick}
                editingPincode={editingPincode}
                setEditingPincode={setEditingPincode}
                pincodeInput={pincodeInput}
                setPincodeInput={setPincodeInput}
                pincodeError={pincodeError}
                handleCheckPincode={handleCheckPincode}
                onZoomImage={(targetSlides, index = 0) => { setModalSlides(targetSlides); setModalIdx(index); }}
                handleCategoryClick={handleCategoryClick}
              />
            )}
            {isAltLoading && !recommendedAlt && <ComparisonSkeleton isMobile={false} />}
            <div style={{ display: (isAltLoading || recommendedAlt) ? "none" : "block" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "start", paddingTop: 24 }}>


              {/* ══ LEFT COLUMN ══ */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  {slides.length > 1 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                      {slides.map((img, i) => (
                        <div key={i} onClick={() => setCurrentSlide(i)}
                          style={{ width: 68, height: 68, borderRadius: 10, border: `2px solid ${i === currentSlide ? "#8b5cf6" : "#e5e7eb"}`, overflow: "hidden", cursor: "pointer", background: "#fff", flexShrink: 0, transition: "all .2s", boxShadow: i === currentSlide ? "0 0 0 3px #ede9fe" : "none" }}>
                          <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.src = "https://placehold.co/68x68/f3f4f6/9ca3af?text=Img"; }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ flex: 1, position: "relative", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16, minHeight: 280, maxHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: zoomPos.active ? "crosshair" : "zoom-in" }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setZoomPos({
                        x: ((e.clientX - rect.left) / rect.width) * 100,
                        y: ((e.clientY - rect.top) / rect.height) * 100,
                        active: true
                      });
                    }}
                    onMouseLeave={() => setZoomPos({ x: 50, y: 50, active: false })}>
                    {savingsPct > 0 && (
                      <div style={{ position: "absolute", top: 14, right: 14, background: "#8b5cf6", color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, zIndex: 6 }}>
                        Save {savingsPct}%
                      </div>
                    )}
                    
                    <img
                      src={slides[currentSlide]?.url || "https://placehold.co/400x380/f3f4f6/9ca3af?text=Medicine"}
                      alt={product.name}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "contain", 
                        maxHeight: 320,
                        transform: zoomPos.active ? "scale(2.2)" : "scale(1)",
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transition: zoomPos.active ? "transform 0.1s ease" : "transform 0.3s ease"
                      }}
                      onClick={() => { setModalSlides(slides); setModalIdx(currentSlide); }}
                      onError={(e) => { e.target.src = "https://placehold.co/400x380/f3f4f6/9ca3af?text=Medicine"; }}
                    />
                    {!zoomPos.active && <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 10, borderRadius: 20, padding: "5px 12px", fontWeight: 600, pointerEvents: "none", zIndex: 5 }}>Hover to zoom</div>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
                  {[
                    { icon: "/BsPatchCheckFill.svg", label: "WHO/GMP\nCERTIFIED", bg: "#f5f3ff" },
                    { icon: "/BsTruck.svg", label: "FAST\nDELIVERY", bg: "#faf5ff" },
                    { icon: "/BsShieldCheck.svg", label: "SAFE & SECURE\nPAYMENT", bg: "#fdf4ff" },
                    { icon: "/BsClockHistory.svg", label: "7 DAYS EASY\nRETURN", bg: "#f5f3ff" },
                  ].map(({ icon, label, bg }) => (
                    <div key={label} style={{ background: "#fff", borderRadius: 10, padding: "16px 8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 8, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <div style={{ background: bg, borderRadius: "50%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <img src={icon} alt={label} style={{ width: 30, height: 30, filter: "invert(46%) sepia(87%) saturate(2135%) hue-rotate(235deg) brightness(101%) contrast(96%)" }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#1f2937", letterSpacing: 0.3, lineHeight: 1.4, textTransform: "uppercase", whiteSpace: "pre-line" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══ RIGHT COLUMN ══ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  {product.selectedCategory && (
                    <span 
                      onClick={() => handleCategoryClick(product.selectedCategory)}
                      style={{ background: "#ede9fe", color: "#7c3aed", borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer" }}
                    >
                      {product.selectedCategory}
                    </span>
                  )}
                  <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                    <button onClick={handleCompare} style={{ background: "#ffffff", border: "1.5px solid #7c3aed", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#7c3aed", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#7c3aed"; }}>
                      <MdCompareArrows size={15} color="currentColor" /> Compare
                    </button>
                    <button onClick={handleShare} style={{ background: "#ffffff", border: "1.5px solid #7c3aed", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#7c3aed", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#7c3aed"; }}>
                      <MdShare size={15} /> Share
                    </button>
                  </div>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, color: "#111827", margin: "0 0 12px" }}>{product.name}</h1>

                {(product.genericName || medicineDetails.unitsPerPack) && (
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Composition:</span>
                    {product.genericName && product.genericName.split(",").map((s, i) => (
                      <span 
                        key={i} 
                        onClick={() => handleCompositionClick(s.trim())}
                        style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#7c3aed", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                      >
                        {s.trim()}
                      </span>
                    ))}
                    {medicineDetails.unitsPerPack && (
                      <span style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#7c3aed", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500 }}>{medicineDetails.unitsPerPack}</span>
                    )}
                  </div>
                )}

                {medicineDetails.sellerInfo && (
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                    Brand: <span style={{ color: "#7c3aed", fontWeight: 700 }}>{medicineDetails.sellerInfo}</span>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  <img src="/google.svg" alt="Google" style={{ width: 17, height: 17 }} />
                  <Stars n={googleRating || 0} />
                  <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>{googleRating || "0"}</span>
                  <span style={{ color: "#6b7280", fontSize: 13 }}>({googleReviewCount || 0} Reviews)</span>
                  <span style={{ borderLeft: "1.5px solid #e5e7eb", height: 16, margin: "0 2px" }}></span>
                  {product.inStock
                    ? <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><MdCheckCircle size={15} /> In Stock</span>
                    : <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><MdCancel size={15} /> Out of Stock</span>}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 34, fontWeight: 800, color: "#111827" }}>₹{product.ourPrice}</span>
                    {product.mrp > product.ourPrice && (
                      <span style={{ fontSize: 16, color: "#9ca3af", textDecoration: "line-through", fontWeight: 400 }}>₹{product.mrp}</span>
                    )}
                    {savings > 0 && (
                      <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>Saving: ₹{savings}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>Inclusive of all taxes</div>
                </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 16, marginBottom: 16 }}>
                    {product.inStock && !isRequestable && (
                      addedToCart ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1.5px solid #8b5cf6", borderRadius: 8, padding: "12px 24px", userSelect: "none" }}>
                          <div onClick={() => updateQty(qty - 1)} style={{ cursor: "pointer", color: "#8b5cf6", display: "flex", alignItems: "center" }}>
                            {qty === 1 ? <MdDeleteOutline size={22} /> : <MdRemove size={22} />}
                          </div>
                          <span style={{ fontWeight: 800, fontSize: 18, color: "#8b5cf6", minWidth: 24, textAlign: "center" }}>{qty}</span>
                          <div onClick={() => updateQty(qty + 1)} style={{ cursor: "pointer", color: "#8b5cf6", display: "flex", alignItems: "center" }}><MdAdd size={22} /></div>
                        </div>
                      ) : (
                        <button onClick={handleAddToCart} style={{ flex: 1, background: "#fff", color: "#8b5cf6", border: "1.5px solid #8b5cf6", borderRadius: 8, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", transition: "all 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                          onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                          <MdShoppingCart size={18} /> Add to Cart
                        </button>
                      )
                    )}
                    {isRequestable && (
                      <button onClick={handleRequest} style={{ flex: 1, background: "#fff", border: "1.5px solid #7c3aed", color: "#7c3aed", borderRadius: 8, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        Request Product
                      </button>
                    )}
                    {product.inStock === false && !isRequestable && (
                      <button onClick={handleRequest} style={{ flex: 1, background: "#fff", border: "1.5px solid #7c3aed", color: "#7c3aed", borderRadius: 8, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        Notify me
                      </button>
                    )}
                    {!isRequestable && (
                      <button disabled={!product.inStock} onClick={handleBuyNow} style={{ flex: 1, background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "13px", fontSize: 15, fontWeight: 600, cursor: product.inStock ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", opacity: product.inStock ? 1 : 0.6, transition: "all 0.2s" }}
                        onMouseEnter={e => { if (product.inStock) e.currentTarget.style.background = "#7c3aed"; }}
                        onMouseLeave={e => { if (product.inStock) e.currentTarget.style.background = "#8b5cf6"; }}>
                        Buy Now
                      </button>
                    )}
                  </div>

                {deliveryInfo ? (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MdLocalShipping size={20} color="#8b5cf6" />
                      <span style={{ fontSize: 13, color: "#374151" }}>Delivery by <strong style={{ color: "#16a34a" }}>{deliveryInfo.days}</strong></span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      {editingPincode ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="text" inputMode="numeric" maxLength={6} placeholder="New Pincode" value={pincodeInput}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setPincodeInput(val); setPincodeError(""); if (val.length === 6) handleCheckPincode(val); }}
                              onKeyDown={(e) => e.key === "Enter" && handleCheckPincode()}
                              style={{ width: 90, border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#374151", fontFamily: "inherit", outline: "none" }} autoFocus />
                            <button onClick={handleCheckPincode} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Check</button>
                          </div>
                          {pincodeError && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>⚠ {pincodeError}</div>}
                        </>
                      ) : (
                        <span onClick={() => { setEditingPincode(true); setPincodeInput(""); }} style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          {deliveryInfo.city ? deliveryInfo.city.split(",")[0] : ""}
                          <MdEdit size={14} color="#9ca3af" />
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MdLocalShipping size={20} color="#8b5cf6" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Know Your Delivery Date</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Enter pincode to check estimated delivery</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 170 }}>
                      {editingPincode ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter Pincode" value={pincodeInput}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setPincodeInput(val); setPincodeError(""); if (val.length === 6) handleCheckPincode(val); }}
                              onKeyDown={(e) => e.key === "Enter" && handleCheckPincode()}
                              style={{ width: 110, border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", fontSize: 12, outline: "none", fontFamily: "inherit" }} autoFocus />
                            <button onClick={handleCheckPincode} style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Check</button>
                          </div>
                          {pincodeError && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>⚠ {pincodeError}</div>}
                        </>
                      ) : (
                        <button onClick={() => setEditingPincode(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>Enter Pincode</span>
                          <span style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 700 }}>Check</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {coupons.map((c, i) => (
                  <div key={i} style={{ background: "#eff6ff", border: "1px dashed #bfdbfe", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 5 }}><MdLocalOffer size={14} /> {c.coupon_text}</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Min. ₹{c.minimum_order_value}</span>
                </div>
                ))}
              </div>
            </div>
            </div>
            {altProducts.length > 1 && (
              <div style={{ marginTop: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Alternative Medicine</h2>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => scrollAlts(-1)} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><MdChevronLeft size={24} /></button>
                    <button onClick={() => scrollAlts(1)} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><MdChevronRight size={24} /></button>
                  </div>
                </div>
                <div ref={altRef} style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none" }}>
                  {altProducts.map((alt, i) => {
                    const itemInCart = (cartItems || []).find((item) => String(item.product_id || item.id) === String(alt.product_id));
                    const altQty = itemInCart ? Number(itemInCart.quantity) : 0;
                    return (
                      <div key={i} className="sv-product-card" style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #f3f4f6", padding: 16, display: "flex", flexDirection: "column", gap: 10, minWidth: 220, maxWidth: 220, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,.04)", cursor: "pointer", transition: "transform .2s" }}
                        onClick={() => handleViewAlt(alt)}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                        <div style={{ position: "relative", background: "#f8f9fb", borderRadius: 12, height: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, overflow: "hidden" }}>
                          <img src={getCdnImageUrl(alt.imageUrl)}
                            alt={alt.name} style={{ maxHeight: 150, maxWidth: "100%", objectFit: "contain", transform: "scale(1.08)" }}
                            onError={(e) => { e.target.src = "https://placehold.co/180x140/f3f4f6/9ca3af?text=Medicine"; }} />
                          {alt.inStock === false && (
                            <div style={{ 
                              position: "absolute", 
                              top: 12, 
                              left: -26, 
                              background: "#ef4444", 
                              color: "#fff", 
                              padding: "4px 28px", 
                              fontSize: 10, 
                              fontWeight: 900, 
                              zIndex: 10, 
                              transform: "rotate(-45deg)", 
                              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                              letterSpacing: "0.5px",
                              textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                            }}>
                              SOLD OUT
                            </div>
                          )}
                          {alt.discount > 0 && (
                            <div style={{ position: "absolute", top: 10, right: 10, background: "#22C55E", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800, zIndex: 10 }}>{alt.discount}% OFF</div>
                          )}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{alt.name}</div>
                        {(alt.composition || product.composition) && (
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginTop: 2, marginBottom: 0, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>
                            {(alt.composition || product.composition)?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: "auto" }}>
                          <span style={{ fontSize: 19, fontWeight: 800, color: "#7c3aed" }}>₹{alt.discountedPrice}</span>
                          {alt.originalPrice > alt.discountedPrice && <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>₹{alt.originalPrice}</span>}
                        </div>
                        {alt.rc === 0 ? (
                          <button onClick={e => { e.stopPropagation(); navigate("/product/" + alt.product_name_url); }}
                            style={{ width: "100%", background: "transparent", border: "1.5px solid #7c3aed", color: "#7c3aed", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            View
                          </button>
                        ) : (alt.rc === 1 && alt.inStock === false) ? (
                          <button onClick={e => handleNotifyAlt(e, alt)}
                            style={{ width: "100%", background: "transparent", border: "1.5px solid #7c3aed", color: "#7c3aed", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            Notify me
                          </button>
                        ) : altQty > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f3ff", border: "1.5px solid #7c3aed", borderRadius: 12, padding: "8px 14px", userSelect: "none" }}
                            onClick={e => e.stopPropagation()}>
                            <div onClick={() => handleAnyQtyUpdate(alt.product_id, altQty - 1)} style={{ cursor: "pointer", color: "#7c3aed", display: "flex" }}>
                              {altQty === 1 ? <MdDeleteOutline size={18} /> : <MdRemove size={18} />}
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 15, color: "#7c3aed" }}>{altQty}</span>
                            <div onClick={() => handleAnyQtyUpdate(alt.product_id, altQty + 1)} style={{ cursor: "pointer", color: "#7c3aed", display: "flex" }}><MdAdd size={18} /></div>
                          </div>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); handleAnyQtyUpdate(alt.product_id, 1); }}
                            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#6d28d9"}
                            onMouseLeave={e => e.currentTarget.style.background = "#7c3aed"}>
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Premium Product Info + Sidebar ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, marginTop: 48, alignItems: "start" }} className="premium-info-grid">

              {/* LEFT: Main Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {renderMedicineContent()}

                <div style={{ marginTop: 8, background: "#f8f9fb", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <img src="/disclaimer.svg" alt="Disclaimer" style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, textAlign: "justify" }}>
                    <strong style={{ color: "#111827" }}>Disclaimer:</strong> The information provided on this page is for informational and educational purposes only and is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 24px", display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    { icon: <MdDriveFileRenameOutline size={20} color="#5d399b" />, bg: "#f0edf9", label: "WRITTEN BY", name: "Dr. Helan, PharmD" },
                    { icon: <MdFactCheck size={20} color="#16a34a" />, bg: "#ecfdf5", label: "REVIEWED BY", name: "Dr. Lakshmi MBBS, MD" },
                    { icon: <MdCalendarToday size={20} color="#1d4ed8" />, bg: "#eff6ff", label: "LAST UPDATED", name: "Oct 12, 2024" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: item.bg, borderRadius: 8, padding: "8px 10px", display: "flex" }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.8, textTransform: "uppercase" }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#5d399b", marginTop: 2 }}>{item.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#f0f7ff", border: "1px solid #dbeafe", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ background: "#fff", padding: 9, borderRadius: "50%", display: "flex", color: "#3b82f6", boxShadow: "0 2px 6px rgba(59,130,246,.1)" }}>
                      <img src="/Pharmacist_Support.svg" alt="Support" style={{ width: 20, height: 20 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e40af" }}>Pharmacist Support</div>
                      <div style={{ fontSize: 11, color: "#60a5fa", marginTop: 1 }}>Have questions? We're here.</div>
                    </div>
                  </div>
                  <a href="tel:+917090123709" style={{ color: "#2563eb", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Call Now</a>
                </div>

                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Marketer Details</div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <MdDriveFileRenameOutline size={17} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{medicineDetails.sellerInfo || "MEDINGEN HEALTHCARE PVT LTD"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MdCheckCircle size={17} color="#22c55e" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Country of Origin</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{medicineDetails.countryOfOrigin || "India"}</div>
                    </div>
                  </div>
                </div>

                {/* Offer Widget */}
                <div style={{ background: "linear-gradient(145deg, #ede9fe, #ddd6fe, #c4b5fd)", borderRadius: 20, padding: "22px 20px 16px", position: "relative", overflow: "hidden", minHeight: 200, boxShadow: "0 8px 24px rgba(124,58,237,0.15)" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.0) 100%)", zIndex: 0, borderRadius: 20 }} />
                  <div key={offerIdx} style={{ position: "relative", zIndex: 1, animation: "fadeInUp 0.5s ease" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.5)", borderRadius: 20, padding: "4px 10px", marginBottom: 14 }}>
                      <MdLocalOffer size={12} color="#7c3aed" />
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.8 }}>{promotionalOffers[offerIdx].highlight}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 6, lineHeight: 1.2 }}>{promotionalOffers[offerIdx].title}</div>
                    <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 20, lineHeight: 1.5, minHeight: 38 }}>{promotionalOffers[offerIdx].subtitle}</div>
                    <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 14, padding: "10px 8px 10px 16px", border: "1.5px dashed #a78bfa", boxShadow: "0 2px 8px rgba(124,58,237,0.08)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Use Code</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: 1.5 }}>{promotionalOffers[offerIdx].code}</div>
                      </div>
                      <button onClick={() => navigate("/offers")} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(124,58,237,0.3)", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#6d28d9"}
                        onMouseLeave={e => e.currentTarget.style.background = "#7c3aed"}>
                        Apply
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 12, textAlign: "center" }}>*Applicable on all first-time medical purchases.</div>
                  </div>
                </div>

                {/* User Reviews */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase" }}>User Reviews</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: "#fbbf24" }}>★</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{googleRating || "4.8"}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{googleReviewCount || "1.2k"} ratings</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 34, fontWeight: 800, color: "#111827" }}>{googleRating || "4.8"}</div>
                      <Stars n={googleRating || 4.8} />
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{googleReviewCount || "1.2k"} Ratings</div>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      {[[5, 85], [4, 12], [3, 2], [2, 1], [1, 0]].map(([stars, pct]) => (
                        <div key={stars} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 11, color: "#9ca3af", width: 10 }}>{stars}</span>
                          <div style={{ flex: 1, height: 4, background: "#f3f4f6", borderRadius: 2 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#22c55e", borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, height: 240, overflow: "hidden", position: "relative" }}>
                    <div style={{ opacity: reviewFade ? 1 : 0, transform: reviewFade ? "translateY(0)" : "translateY(-12px)", transition: "all 0.5s ease", display: "flex", flexDirection: "column", gap: 16 }}>
                      {googleReviews.length > 0 ? (
                        [0, 1].map((offset) => {
                          const idx = (reviewIndex + offset) % googleReviews.length;
                          const r = googleReviews[idx];
                          if (!r) return null;
                          return (
                            <div key={r.reviewId}>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                                {r.reviewer?.profilePhotoUrl
                                  ? <img src={r.reviewer.profilePhotoUrl} alt="" style={{ width: 26, height: 26, borderRadius: "50%" }} />
                                  : <FaUserCircle size={26} color="#d1d5db" />}
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{r.reviewer?.displayName}</div>
                                  <Stars n={r.starRating} />
                                </div>
                              </div>
                              <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>"{r.comment || "Great experience!"}"</p>
                            </div>
                          );
                        })
                      ) : (
                        <div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                            <FaUserCircle size={26} color="#d1d5db" />
                            <div><div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>John S.</div><Stars n={5} /></div>
                          </div>
                          <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5, margin: 0 }}>"Excellent products and super fast delivery!"</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => window.open("https://search.google.com/local/writereview?placeid=ChIJ73ps481hUjoR8TGoCm4jvAc", "_blank")}
                    style={{ width: "100%", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16, boxShadow: "0 4px 12px rgba(124,58,237,.25)" }}>
                    Write a Review
                  </button>
                </div>

                <button onClick={() => setIsReportModalOpen(true)}
                  style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "13px", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <MdFlag size={17} /> Report an Issue
                </button>
            </div>
            </div>
            {renderBottomSections()}
          </div>
        ) : (
          /* ───── MOBILE VIEW ───── */
          <div style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
            {recommendedAlt && (
              <SubstitutionComparison 
                searchedProduct={{
                  product_id: product.product_id,
                  name: product.name,
                  imageSrc: slides[0]?.url,
                  images: slides,
                  composition: medicineDetails?.drugComposition,
                  packaging: medicineDetails?.unitsPerPack,
                  mrp: product.mrp,
                  price: product.ourPrice,
                  inStock: product.inStock,
                  selectedCategory: product.selectedCategory,
                  rc: product.rc,
                  genericName: product.genericName
                }}
                recommendedProduct={recommendedAlt}
                onNotify={handleNotifyAlt}
                onAddToCart={(id) => handleAnyQtyUpdate(id, 1)}
                onBuyNow={(alt) => { handleAnyQtyUpdate(alt.product_id, 1); navigate("/cart"); }}
                onShare={handleShare}
                onCompare={handleCompare}
                isMobile={isMobile}
                deliveryInfo={deliveryInfo}
                googleRating={googleRating}
                googleReviewCount={googleReviewCount}
                qty={(cartItems || []).find(it => String(it.product_id || it.id) === String(recommendedAlt.product_id))?.quantity || 0}
                addedToCart={(cartItems || []).some(it => String(it.product_id || it.id) === String(recommendedAlt.product_id))}
                onUpdateQty={handleAnyQtyUpdate}
                handleCompositionClick={handleCompositionClick}
                editingPincode={editingPincode}
                setEditingPincode={setEditingPincode}
                pincodeInput={pincodeInput}
                setPincodeInput={setPincodeInput}
                pincodeError={pincodeError}
                handleCheckPincode={handleCheckPincode}
                onZoomImage={(targetSlides, index = 0) => { setModalSlides(targetSlides); setModalIdx(index); }}
                handleCategoryClick={handleCategoryClick}
              />
            )}
            {isAltLoading && !recommendedAlt && <ComparisonSkeleton isMobile={true} />}

            <div style={{ display: (isAltLoading || recommendedAlt) ? "none" : "block" }}>
              <div style={{ position: "relative", background: "#f9fafb", padding: "16px 16px 0", overflow: "hidden" }}>
                {savingsPct > 0 && <div style={{ position: "absolute", top: 16, right: 16, background: "#8b5cf6", color: "#fff", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 10 }}>Save {savingsPct}%</div>}
                
                <div className="sv-product-card" style={{ width: "100%", height: 280, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "visible", cursor: "zoom-in" }} onClick={() => { setModalSlides(slides); setModalIdx(currentSlide); }}>
                <img src={slides[currentSlide]?.url || "https://placehold.co/320x240/f3f4f6/9ca3af?text=Medicine"} alt={product.name}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: "scale(1.08)" }}
                  onError={(e) => { e.target.src = "https://placehold.co/320x240/f3f4f6/9ca3af?text=Medicine"; }} />
              </div>
              {slides.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "10px 0 12px" }}>
                  {slides.map((_, i) => (
                    <div key={i} onClick={() => setCurrentSlide(i)}
                      style={{ width: i === currentSlide ? 20 : 7, height: 7, borderRadius: 4, background: i === currentSlide ? "#7c3aed" : "#d1d5db", cursor: "pointer", transition: "all .3s" }} />
                  ))}
                </div>
              )}
              {slides.length > 1 && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none", justifyContent: "center" }}>
                  {slides.map((img, i) => (
                    <div key={i} onClick={() => setCurrentSlide(i)}
                      style={{ width: 48, height: 48, borderRadius: 8, border: `2px solid ${i === currentSlide ? "#7c3aed" : "#e5e7eb"}`, overflow: "hidden", flexShrink: 0, cursor: "pointer", background: "#fff" }}>
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.src = "https://placehold.co/48x48/f3f4f6/9ca3af?text=Img"; }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {product.selectedCategory && (
                  <span 
                    onClick={() => handleCategoryClick(product.selectedCategory)}
                    style={{ background: "#f3f0ff", color: "#7c3aed", padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer" }}
                  >
                    {product.selectedCategory}
                  </span>
                )}
                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                  <button onClick={handleCompare} style={{ background: "#ffffff", border: "1.5px solid #7c3aed", borderRadius: 20, padding: "5px 13px", fontSize: 12, color: "#7c3aed", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#7c3aed"; }}>
                    <MdCompareArrows size={14} color="currentColor" /> Compare
                  </button>
                  <button onClick={handleShare} style={{ background: "#ffffff", border: "1.5px solid #7c3aed", borderRadius: 20, padding: "5px 13px", fontSize: 12, color: "#7c3aed", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#7c3aed"; }}>
                    <MdShare size={14} color="currentColor" /> Share
                  </button>
                </div>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.25, margin: "0 0 8px" }}>{product.name}</h1>
              {medicineDetails.sellerInfo && (
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Brand: <span style={{ color: "#7c3aed", fontWeight: 600 }}>{medicineDetails.sellerInfo}</span></div>
              )}
              {(product.genericName || medicineDetails.unitsPerPack) && (
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Composition:</span>
                  {product.genericName && product.genericName.split(",").map((s, i) => (
                    <span 
                      key={i} 
                      onClick={() => handleCompositionClick(s.trim())}
                      style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", color: "#5d399b", borderRadius: 20, padding: "5px 13px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                    >
                      {s.trim()}
                    </span>
                  ))}
                  {medicineDetails.unitsPerPack && (
                    <span style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", color: "#5d399b", borderRadius: 20, padding: "5px 13px", fontSize: 12, fontWeight: 500 }}>{medicineDetails.unitsPerPack}</span>
                  )}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 2 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#111827" }}>₹{product.ourPrice}</span>
                {product.mrp > product.ourPrice && <span style={{ fontSize: 17, color: "#9ca3af", textDecoration: "line-through", fontWeight: 400 }}>₹{product.mrp}</span>}
                {savings > 0 && <span style={{ fontSize: 14, color: "#16a34a", fontWeight: 700 }}>Save ₹{savings}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>Inclusive of all taxes</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                <img src="/google.svg" style={{ width: 15, height: 15 }} alt="Google" />
                <Stars n={googleRating || 0} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{googleRating || "0"}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>({googleReviewCount || "0"} Reviews)</span>
                <span style={{ marginLeft: "auto" }}>
                  {product.inStock
                    ? <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><MdCheckCircle size={15} /> In Stock</span>
                    : <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><MdCancel size={15} /> Out of Stock</span>}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {product.inStock && !isRequestable && (
                  addedToCart ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1.5px solid #8b5cf6", borderRadius: 8, padding: "12px 20px", userSelect: "none" }}>
                      <div onClick={() => updateQty(qty - 1)} style={{ cursor: "pointer", color: "#8b5cf6", display: "flex", alignItems: "center" }}>{qty === 1 ? <MdDeleteOutline size={22} /> : <MdRemove size={22} />}</div>
                      <span style={{ fontWeight: 800, fontSize: 18, color: "#8b5cf6", minWidth: 28, textAlign: "center" }}>{qty}</span>
                      <div onClick={() => updateQty(qty + 1)} style={{ cursor: "pointer", color: "#8b5cf6", display: "flex", alignItems: "center" }}><MdAdd size={22} /></div>
                    </div>
                  ) : (
                    <button onClick={handleAddToCart} style={{ flex: 1, background: "#fff", color: "#8b5cf6", border: "1.5px solid #8b5cf6", borderRadius: 8, padding: "12px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                      <MdShoppingCart size={18} /> Add to Cart
                    </button>
                  )
                )}
                {isRequestable && (
                  <button onClick={handleRequest} style={{ flex: 1, background: "#fff", color: "#8b5cf6", border: "1.5px solid #8b5cf6", borderRadius: 8, padding: "12px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>Request Product</button>
                )}
                {!isRequestable && (
                  <button disabled={!product.inStock} onClick={handleBuyNow} style={{ flex: 1, background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 15, fontWeight: 600, cursor: product.inStock ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", opacity: product.inStock ? 1 : 0.6 }}>Buy Now</button>
                )}
              </div>
              {coupons.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {coupons.map((c, i) => (
                    <div key={i} style={{ background: "#eff6ff", border: "1px dashed #bfdbfe", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 5 }}><MdLocalOffer size={14} /> {c.coupon_text}</span>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Min. ₹{c.minimum_order_value}</span>
                    </div>
                  ))}
                </div>
              )}
              {deliveryInfo ? (
                <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <MdLocalShipping size={20} color="#374151" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>Delivery by <strong style={{ color: "#111827" }}>{deliveryInfo.days}</strong></span>
                  </div>
                  {editingPincode ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="Pincode" value={pincodeInput}
                          onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setPincodeInput(val); setPincodeError(""); if (val.length === 6) handleCheckPincode(val); }}
                          style={{ width: 80, border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 8px", fontSize: 12, fontFamily: "inherit", outline: "none" }} autoFocus />
                        <button onClick={handleCheckPincode} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>OK</button>
                      </div>
                      {pincodeError && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>⚠ {pincodeError}</div>}
                    </div>
                  ) : (
                    <div onClick={() => { setEditingPincode(true); setPincodeInput(""); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", cursor: "pointer" }}>
                      {deliveryInfo.city ? deliveryInfo.city.split(",")[0] : ""}
                      <MdEdit size={14} color="#7c3aed" />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <MdLocalShipping size={20} color="#374151" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Check Delivery Date</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Enter your pincode</div>
                  </div>
                  {editingPincode ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="Pincode" value={pincodeInput}
                          onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setPincodeInput(val); setPincodeError(""); if (val.length === 6) handleCheckPincode(val); }}
                          style={{ width: 80, border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 8px", fontSize: 12, outline: "none", fontFamily: "inherit" }} autoFocus />
                        <button onClick={handleCheckPincode} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Check</button>
                      </div>
                      {pincodeError && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>⚠ {pincodeError}</div>}
                    </div>
                  ) : (
                    <button onClick={() => setEditingPincode(true)} style={{ background: "none", border: "none", color: "#7c3aed", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontFamily: "inherit" }}>
                      Enter <MdChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                {[
                  { icon: "/BsPatchCheckFill.svg", label: "WHO/GMP\nCertified", bg: "#f5f3ff" },
                  { icon: "/BsTruck.svg", label: "Fast\nDelivery", bg: "#faf5ff" },
                  { icon: "/BsShieldCheck.svg", label: "Safe & Secure\nPayment", bg: "#fdf4ff" },
                  { icon: "/BsClockHistory.svg", label: "7 Days\nReturn", bg: "#f5f3ff" },
                ].map(({ icon, label, bg }, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 4px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, border: "1px solid #f1f5f9" }}>
                    <div style={{ background: bg, borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={icon} alt={label} style={{ width: 24, height: 24, filter: "invert(46%) sepia(87%) saturate(2135%) hue-rotate(235deg) brightness(101%) contrast(96%)" }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#1f2937", lineHeight: 1.3, textTransform: "uppercase", whiteSpace: "pre-line", letterSpacing: 0.3 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f0f7ff", border: "1.5px solid #dbeafe", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ background: "#fff", padding: 8, borderRadius: "50%", boxShadow: "0 2px 8px rgba(59,130,246,.12)", display: "flex", flexShrink: 0 }}>
                  <img src="/Pharmacist_Support.svg" style={{ width: 22, height: 22 }} alt="" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e40af" }}>Pharmacist Support</div>
                  <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 1 }}>Have questions?</div>
                </div>
                <a href="tel:+917090123709" style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>Call Now</a>
              </div>
            </div>
            </div>

            {altProducts.length > 1 && (
              <div style={{ padding: "0 16px", marginBottom: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Alternative Medicines</h2>
                <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                  {altProducts.map((alt, i) => {
                    const itemInCart = (cartItems || []).find(item => String(item.product_id || item.id) === String(alt.product_id));
                    const altQty = itemInCart ? Number(itemInCart.quantity) : 0;
                    return (
                      <div key={i} className="sv-product-card" style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f3f4f6", padding: 13, display: "flex", flexDirection: "column", gap: 9, minWidth: 160, maxWidth: 160, flexShrink: 0, boxShadow: "0 2px 10px rgba(0,0,0,.05)", cursor: "pointer" }}
                        onClick={() => handleViewAlt(alt)}>
                        <div style={{ position: "relative", background: "#f8f9fb", borderRadius: 10, height: 130, display: "flex", alignItems: "center", justifyContent: "center", padding: 8, overflow: "hidden" }}>
                          <img src={getCdnImageUrl(alt.imageUrl)}
                            alt={alt.name} style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain", transform: "scale(1.08)" }}
                            onError={(e) => { e.target.src = "https://placehold.co/120x120/f3f4f6/9ca3af?text=Med"; }} />
                          {alt.inStock === false && <div className="card-out-of-stock-badge" style={{ top: 12, left: -28, padding: "3px 30px", zIndex: 10 }}>SOLD OUT</div>}
                          {alt.discount > 0 && <div style={{ position: "absolute", top: 7, right: 7, background: "#22C55E", color: "#fff", borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 800, zIndex: 10 }}>{alt.discount}% OFF</div>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 30 }}>{alt.name}</div>
                         <div 
                           onClick={(e) => { e.stopPropagation(); handleCompositionClick(alt.composition || product.composition); }}
                           style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, cursor: "pointer", marginBottom: 2 }}
                         >
                           {alt.composition || product.composition}
                         </div>
                         {alt.packaging && (
                           <div style={{ fontSize: 10, color: "#6b7280", fontWeight: "700", marginBottom: 4 }}>{formatPackaging(alt.packaging)}</div>
                         )}
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: "auto" }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: "#7c3aed" }}>₹{alt.discountedPrice}</span>
                          {alt.originalPrice > alt.discountedPrice && <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>₹{alt.originalPrice}</span>}
                        </div>
                        {alt.rc === 0 ? (
                          <button onClick={e => { e.stopPropagation(); navigate("/product/" + alt.product_name_url); }}
                            style={{ width: "100%", background: "transparent", border: "1.5px solid #7c3aed", color: "#7c3aed", borderRadius: 9, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            View
                          </button>
                        ) : (alt.rc === 1 && alt.inStock === false) ? (
                          <button onClick={e => handleNotifyAlt(e, alt)}
                            style={{ width: "100%", background: "transparent", border: "1.5px solid #7c3aed", color: "#7c3aed", borderRadius: 9, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            Notify me
                          </button>
                        ) : altQty > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f3ff", border: "1.5px solid #7c3aed", borderRadius: 9, padding: "6px 10px", userSelect: "none" }} onClick={e => e.stopPropagation()}>
                            <div onClick={() => handleAnyQtyUpdate(alt.product_id, altQty - 1)} style={{ cursor: "pointer", color: "#7c3aed", display: "flex" }}>{altQty === 1 ? <MdDeleteOutline size={15} /> : <MdRemove size={15} />}</div>
                            <span style={{ fontWeight: 800, fontSize: 13, color: "#7c3aed" }}>{altQty}</span>
                            <div onClick={() => handleAnyQtyUpdate(alt.product_id, altQty + 1)} style={{ cursor: "pointer", color: "#7c3aed", display: "flex" }}><MdAdd size={15} /></div>
                          </div>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); handleAnyQtyUpdate(alt.product_id, 1); }} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 9, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ padding: "0 16px", marginBottom: 8 }}>{renderMedicineContent()}</div>

            <div style={{ margin: "4px 16px 20px", background: "#f9fafb", borderRadius: 12, padding: "14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <img src="/disclaimer.svg" alt="Disclaimer" style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.65, margin: 0, textAlign: "justify" }}>
                <strong style={{ color: "#374151" }}>Disclaimer:</strong> The information provided on this page is for informational and educational purposes only and is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.
              </p>
            </div>

            <div style={{ margin: "0 16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <MdLibraryBooks size={20} color="#7c3aed" />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Manufacturer Details</span>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px" }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 3 }}>Marketed By:</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{medicineDetails.sellerInfo || "Medingen Healthcare Pvt Ltd."}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                  <MdCheckCircle size={15} color="#22c55e" />
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>Country of Origin: <strong style={{ color: "#111827" }}>{medicineDetails.countryOfOrigin || "India"}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ margin: "0 16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <MdOutlineShield size={20} color="#7c3aed" />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Editorial Info</span>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { color: "#7c3aed", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", label: "WRITTEN BY", name: "Dr. Helan", degree: "PharmD", role: "Clinical Nutritionist" },
                  { color: "#3b82f6", bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", label: "REVIEWED BY", name: "Dr. Lakshmi", degree: "MBBS, MD", role: "Pharmaceutical Sciences Expert" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                      <FaUserCircle size={28} color={item.color} />
                      <div style={{ position: "absolute", bottom: 0, right: 0, background: "#22c55e", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MdCheckCircle size={12} color="#fff" />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{item.name} <span style={{ fontWeight: 500, color: "#6b7280", fontSize: 12 }}>{item.degree}</span></div>
                      <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>{item.role}</div>
                    </div>
                  </div>
                ))}
                <div style={{ paddingTop: 4, borderTop: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Last Updated: <strong style={{ color: "#374151" }}>Oct 2024</strong></span>
                </div>
              </div>
            </div>

            <div style={{ padding: "0 16px 20px" }}>
              <button onClick={() => setIsReportModalOpen(true)} style={{ width: "100%", background: "#fff", border: "1.5px solid #7c3aed", borderRadius: 14, padding: "14px", color: "#7c3aed", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                <MdFlag size={17} color="#7c3aed" /> Report an Issue
              </button>
            </div>

            <div style={{ margin: "0 16px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src="/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: 0.5 }}>Google Reviews</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#f59e0b", fontSize: 16 }}>★</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{googleRating || "4.8"}</span>
                  </div>
                  <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>on Google</span>
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ minWidth: 72 }}>
                    <div style={{ fontSize: 38, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{googleRating || "4.8"}</div>
                    <div style={{ marginTop: 4 }}><Stars n={googleRating || 4.8} /></div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{googleReviewCount || "1,240"} Ratings</div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                    {[[5, 78], [4, 15], [3, 4], [2, 2], [1, 1]].map(([star, pct]) => (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#374151", fontWeight: 600, width: 8, textAlign: "right" }}>{star}</span>
                        <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: star >= 4 ? "#22c55e" : star === 3 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {googleReviews.length > 0 ? (
                  googleReviews.slice(reviewIndex, reviewIndex + 2).map((r, idx) => (
                    <div key={r.reviewId || idx} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {r.reviewer?.profilePhotoUrl ? <img src={r.reviewer.profilePhotoUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} /> : <FaUserCircle size={32} color="#d1d5db" />}
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{r.reviewer?.displayName || "Anonymous"}</span>
                            <MdCheckCircle size={13} color="#3b82f6" />
                          </div>
                        </div>
                        <Stars n={r.starRating || 5} />
                      </div>
                      <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>"{r.comment || "Great product!"}"</p>
                    </div>
                  ))
                ) : (
                  [{ name: "John S.", stars: 5, text: "Great for immunity! Highly recommend!" }, { name: "Maria R.", stars: 4, text: "Quality packaging and fast shipping." }].map((r, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FaUserCircle size={32} color="#d1d5db" />
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{r.name}</span>
                            <MdCheckCircle size={13} color="#3b82f6" />
                          </div>
                        </div>
                        <Stars n={r.stars} />
                      </div>
                      <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>"{r.text}"</p>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => window.open("https://search.google.com/local/reviews?placeid=ChIJ73ps481hUjoR8TGoCm4jvAc", "_blank")}
                style={{ width: "100%", background: "#fff", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", marginBottom: 12, fontFamily: "inherit" }}>
                <img src="/google.svg" alt="" style={{ width: 16, height: 16 }} />
                View all {googleReviewCount || "1,240"} Reviews
              </button>
              <button onClick={() => window.open("https://search.google.com/local/writereview?placeid=ChIJ73ps481hUjoR8TGoCm4jvAc", "_blank")}
                style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase", boxShadow: "0 4px 14px rgba(124,58,237,.3)", fontFamily: "inherit" }}>
                Write a Review
              </button>
            </div>
            {renderBottomSections()}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {modalIdx !== null && (
        <div onClick={() => { setModalIdx(null); setModalSlides([]); }} 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(10, 15, 30, 0.75)", 
            backdropFilter: "blur(12px)", 
            zIndex: 20000, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            animation: "fadeIn 0.3s ease"
          }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: isMobile ? "20px" : "24px", display: "flex", flexDirection: isMobile ? "column-reverse" : "row", gap: isMobile ? 16 : 20, width: isMobile ? "94vw" : "auto", maxWidth: "90vw", maxHeight: "90vh", overflow: "hidden", position: "relative" }}>
            <button onClick={() => { setModalIdx(null); setModalSlides([]); }} style={{ position: "absolute", top: 12, right: 12, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 18, cursor: "pointer", fontWeight: 700, lineHeight: 1, zIndex: 10 }}>×</button>
            <div className="zoom-thumb-container" style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 12, overflowX: isMobile ? "auto" : "hidden", overflowY: isMobile ? "hidden" : "auto", paddingRight: isMobile ? 0 : 4, scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <style>{`.zoom-thumb-container::-webkit-scrollbar { display: none; }`}</style>
              {modalSlides.map((img, i) => (
                <div key={i} onClick={() => setModalIdx(i)} style={{ width: isMobile ? 65 : 80, height: isMobile ? 65 : 80, borderRadius: 12, border: `2.5px solid ${i === modalIdx ? "#5d399b" : "#e5e7eb"}`, overflow: "hidden", cursor: "pointer", background: "#f9fafb", flexShrink: 0 }}>
                  <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 16, minWidth: isMobile ? "100%" : 300, maxWidth: isMobile ? "100%" : "60vw", height: isMobile ? "50vh" : "auto", maxHeight: isMobile ? "50vh" : "75vh", display: "flex", alignItems: "center", justifyContent: "center", cursor: zoomPos.active ? "crosshair" : "zoom-in", background: "#f9fafb" }}
              onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100, active: true }); }}
              onMouseLeave={() => setZoomPos({ x: 50, y: 50, active: false })}>
              <img src={modalSlides[modalIdx]?.url} alt=""
                style={{ width: "100%", height: "100%", maxWidth: isMobile ? "100%" : "60vw", maxHeight: isMobile ? "50vh" : "75vh", objectFit: "contain", display: "block", transform: zoomPos.active ? "scale(2.5)" : "scale(1)", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transition: zoomPos.active ? "transform 0.1s ease" : "transform 0.3s ease", pointerEvents: "none", userSelect: "none" }}
                onError={(e) => { e.target.src = "https://placehold.co/480x360/f3f4f6/9ca3af?text=Product"; }} />
              {!zoomPos.active && <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 10, borderRadius: 20, padding: "4px 10px", fontWeight: 600, pointerEvents: "none" }}>🔍 Hover to zoom</div>}
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {isReportModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,30,0.6)", backdropFilter: "blur(6px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", animation: "fadeInUp 0.3s ease" }}>
            <div style={{ padding: "24px 28px", borderBottom: reportSubmitted ? "none" : "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {!reportSubmitted && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "#f5f3ff", color: "#8b5cf6", padding: 10, borderRadius: 12, display: "flex" }}><MdErrorOutline size={22} /></div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Report an Issue</h3>
                </div>
              )}
              <button onClick={closeReportModal} style={{ background: "#f9fafb", border: "none", color: "#9ca3af", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: reportSubmitted ? "absolute" : "static", top: 20, right: 20 }}>
                <MdClose size={20} />
              </button>
            </div>
            <div style={{ padding: reportSubmitted ? "10px 40px 40px" : "28px", maxHeight: "80vh", overflowY: "auto" }}>
              {reportSubmitted ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 80, height: 80, background: "#f5f3ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <div style={{ width: 44, height: 44, background: "#8b5cf6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><MdCheckCircle size={30} /></div>
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Report Submitted</h2>
                  <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, marginBottom: 32, maxWidth: 300, margin: "0 auto 32px" }}>Thank you. Our pharmacist team will review this within 24 hours.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(() => {
                      const message = `Hello Medingen Team,\n\nI've just submitted an issue report:\n\n*Medicine:* ${product?.name || "N/A"}\n*Issue:* ${reportFormData.issueType}\n*Description:* ${reportFormData.description}${reportFormData.orderId ? `\n*Order ID:* ${reportFormData.orderId}` : ""}\n*Contact:* ${reportFormData.contactDetails}`;
                      return (
                        <a href={`https://wa.me/917090123709?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#8b5cf6", color: "#fff", padding: "16px", borderRadius: 16, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                          <FaWhatsapp size={20} /> Chat on WhatsApp
                        </a>
                      );
                    })()}
                    <button onClick={closeReportModal} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "10px" }}>Close</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Report Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Medicine Name</label>
                        <div style={{ background: "#f9fafb", border: "1.5px solid #f3f4f6", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#4b5563", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product?.name || "Product"}</span>
                          <MdLock size={14} color="#d1d5db" />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Strength</label>
                        <div style={{ background: "#f9fafb", border: "1.5px solid #f3f4f6", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#4b5563", fontWeight: 600 }}>{medicineDetails?.drugComposition || "N/A"}</span>
                          <MdLock size={14} color="#d1d5db" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#374151", marginBottom: 10, textTransform: "uppercase" }}>What is the issue?</label>
                    <div style={{ position: "relative" }}>
                      <select required value={reportFormData.issueType} onChange={(e) => setReportFormData({ ...reportFormData, issueType: e.target.value })}
                        style={{ width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "#1f2937", outline: "none", cursor: "pointer", appearance: "none" }}>
                        <option value="" disabled>Select issue type...</option>
                        <option value="Incorrect price">Incorrect price</option>
                        <option value="Wrong information">Wrong information</option>
                        <option value="Side effects missing">Side effects missing</option>
                        <option value="Packaging issue">Packaging issue</option>
                        <option value="Stock availability issue">Stock availability issue</option>
                        <option value="Received different product">Received different product</option>
                      </select>
                      <FiChevronDown size={18} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase" }}>Description</label>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#8b5cf6" }}>* REQUIRED</span>
                    </div>
                    <textarea required placeholder="Please describe the issue clearly" value={reportFormData.description} onChange={(e) => setReportFormData({ ...reportFormData, description: e.target.value })}
                      style={{ width: "100%", minHeight: 100, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "#1f2937", outline: "none", resize: "none", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Order ID (Optional)</label>
                      <input type="text" placeholder="e.g. #ORD-12345" value={reportFormData.orderId} onChange={(e) => setReportFormData({ ...reportFormData, orderId: e.target.value })}
                        style={{ width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#1f2937", outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Contact Details</label>
                      <input type="text" placeholder="john.doe@email.com" value={reportFormData.contactDetails} onChange={(e) => setReportFormData({ ...reportFormData, contactDetails: e.target.value })}
                        style={{ width: "100%", background: "#f9fafb", border: "1.5px solid #f3f4f6", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#4b5563", outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ background: "#f5f3ff", borderRadius: 16, padding: "16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ color: "#8b5cf6", marginTop: 2 }}><MdCheckCircle size={18} /></div>
                    <p style={{ fontSize: 12, color: "#6d28d9", margin: 0, fontWeight: 500, lineHeight: 1.5 }}>Your report will be reviewed by our medical editorial team. Thank you for helping us improve.</p>
                  </div>
                  <button type="submit" style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 16, padding: "18px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 20px -5px rgba(139,92,246,0.4)", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                    Submit Report
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  </>;
}
