"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./style.css";

interface FooterProps {
  handleScrollToSection?: (section: string) => void;
  initialTopCategories?: any;
  initialFooterProducts?: any;
}

const nameToSlug = (name: string) => {
  return name
    ? name
        .toLowerCase()
        .replace(/&/g, "and") // Replace & with 'and'
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphen
        .replace(/-+/g, "-") // Collapse multiple hyphens
        .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    : "";
};

export const Footer: React.FC<FooterProps> = ({ 
  handleScrollToSection,
  initialTopCategories,
  initialFooterProducts
}) => {
  const router = useRouter();

  const localScrollToSection = handleScrollToSection || ((section: string) => {
    window.location.href = "/about#" + section;
  });

  const handleLinkClick = (linkType: string, value: string) => {
    if (linkType === "internal") {
      router.push(value);
    } else if (linkType === "external") {
      window.open(value, "_blank", "noopener,noreferrer");
    } else if (linkType === "scroll") {
      if (typeof window !== "undefined" && window.location.pathname === "/about") {
        localScrollToSection(value);
      } else {
        window.location.href = `/about#${value}`;
      }
    } else if (linkType === "tel") {
      window.location.href = `tel:${value}`;
    } else if (linkType === "mailto") {
      window.location.href = `mailto:${value}`;
    }
  };

  const knowUsLinks = [
    { label: "About Medingen", type: "internal", value: "/about" },
    { label: "How to buy Medicines", type: "scroll", value: "how-it-works" },
    { label: "Terms & Condition", type: "internal", value: "/policies-terms-and-conditions" },
    { label: "Privacy Policy", type: "internal", value: "/policies-privacy-policy" },
    { label: "Contact Us", type: "internal", value: "/help-center" },
  ];

  const [topCategories, setTopCategories] = useState<any[]>([]);

  useEffect(() => {
    if (initialTopCategories) {
      const cats = Array.isArray(initialTopCategories) 
        ? initialTopCategories 
        : (initialTopCategories.categories || initialTopCategories.main_categories || []);
      const mapped = cats.map((cat: any) => {
        const categoryName = cat.name || cat.category_name || cat.title || "";
        return {
          label: categoryName,
          type: "internal",
          value: `/categories/${nameToSlug(categoryName)}`,
        };
      }).filter((cat: any) => cat.label !== "");
      setTopCategories(mapped);
    } else {
      // Fallback categories
      setTopCategories([
        { label: "Ayurvedic & Herbal", type: "internal", value: "/categories/ayurvedic-and-herbal" },
        { label: "Chronic Care", type: "internal", value: "/categories/chronic-care" },
        { label: "Gastro Care", type: "internal", value: "/categories/gastro-care" },
        { label: "Health Conditions", type: "internal", value: "/categories/health-conditions" },
        { label: "Health Supplements", type: "internal", value: "/categories/health-supplements" },
        { label: "Infection Care", type: "internal", value: "/categories/infection-care" },
        { label: "Mental Health", type: "internal", value: "/categories/mental-health" },
        { label: "Over The Counter (OTC)", type: "internal", value: "/categories/over-the-counter-otc" },
        { label: "Pain & Inflammation Care", type: "internal", value: "/categories/pain-and-inflammation-care" },
        { label: "Personal Care", type: "internal", value: "/categories/personal-care" },
        { label: "Specialty Medicines", type: "internal", value: "/categories/specialty-medicines" },
        { label: "Vitamins & Supplements", type: "internal", value: "/categories/vitamins-and-supplements" },
      ]);
    }
  }, [initialTopCategories]);

  const [topSellingMedicines, setTopSellingMedicines] = useState<any[]>([
    { label: "Pantosec 40mg", type: "internal", value: "/product/pantosec-40mg" },
    { label: "Azicip 500mg", type: "internal", value: "/product/azicip-500mg" },
    { label: "Azicip 250mg", type: "internal", value: "/product/azicip-250mg" },
    { label: "Olox 200mg", type: "internal", value: "/product/olox-200mg" },
    { label: "Pantosec DSR 30/40mg", type: "internal", value: "/product/pantosec-dsr-30-40mg" },
    { label: "Alergin L 5mg", type: "internal", value: "/product/alergin-l-5mg" },
    { label: "Amoxyclav 500/125mg", type: "internal", value: "/product/amoxyclav-500-125mg" },
    { label: "Rabesec DSR 30/20mg", type: "internal", value: "/product/rabesec-dsr-30-20mg" },
    { label: "Montecip LC 5/10mg", type: "internal", value: "/product/montecip-lc-5-10mg" },
    { label: "Itracip 200mg", type: "internal", value: "/product/itracip-200mg" },
    { label: "Rabesec 20mg", type: "internal", value: "/product/rabesec-20mg" },
    { label: "Movexx SP 100/325/15mg", type: "internal", value: "/product/movexx-sp-100-325-15mg" },
    { label: "L Quin 500mg", type: "internal", value: "/product/l-quin-500mg" },
    { label: "Podocip 200mg", type: "internal", value: "/product/podocip-200mg" },
    { label: "Cefix 200mg", type: "internal", value: "/product/cefix-200mg" },
    { label: "Cof Q D 5/2/10mg", type: "internal", value: "/product/cof-q-d-5-2-10mg" },
    { label: "C One 1000mg Injection", type: "internal", value: "/product/c-one-1000mg-injection" },
  ]);

  const [topHealthcareDevices, setTopHealthcareDevices] = useState<any[]>([
    { label: "Dr Morepen BP 14 Blood...", type: "internal", value: "/product/dr-morepen-bp-14-blood-pressure-monitor" },
    { label: "Omron Hem 7121 J BP...", type: "internal", value: "/product/omron-hem-7121-j-bp-monitor" },
    { label: "Omron Compressor Ne...", type: "internal", value: "/product/omron-compressor-nebulizer" },
    { label: "Revalizer Device", type: "internal", value: "/product/revalizer-device" },
    { label: "Accu Chek Active Blood...", type: "internal", value: "/product/accu-chek-active-blood-glucose-meter" },
    { label: "Transpacer VM Device", type: "internal", value: "/product/transpacer-vm-device" },
    { label: "Romsons SS 3062 Infusion", type: "internal", value: "/product/romsons-ss-3062-infusion" },
  ]);

  const [topHealthProducts, setTopHealthProducts] = useState<any[]>([
    { label: "Paracip 500mg", type: "internal", value: "/product/paracip-500mg" },
    { label: "Fericip XT 100/1.5mg", type: "internal", value: "/product/fericip-xt-100-1-5mg" },
    { label: "Cipcal XT Tablet", type: "internal", value: "/product/cipcal-xt-tablet" },
    { label: "CMSooth Eye Drop 0.5%", type: "internal", value: "/product/cmsooth-eye-drop-0-5" },
    { label: "Ketocip 2% Soap", type: "internal", value: "/product/ketocip-2-soap" },
    { label: "Calciquick D3 2k Capsule", type: "internal", value: "/product/calciquick-d3-2k-capsule" },
    { label: "Pralyte ORS Powder", type: "internal", value: "/product/pralyte-ors-powder" },
    { label: "Vitamin D3 400IU Drop", type: "internal", value: "/product/vitamin-d3-400iu-drop" },
  ]);

  useEffect(() => {
    if (initialFooterProducts) {
      const data = initialFooterProducts;
      if (data.topSellingMedicines && data.topSellingMedicines.length > 0) {
        setTopSellingMedicines(data.topSellingMedicines.slice(0, 15));
      }
      if (data.topHealthcareDevices && data.topHealthcareDevices.length > 0) {
        setTopHealthcareDevices(data.topHealthcareDevices.slice(0, 10));
      }
      if (data.topHealthProducts && data.topHealthProducts.length > 0) {
        setTopHealthProducts(data.topHealthProducts.slice(0, 10));
      }
    }
  }, [initialFooterProducts]);

  const socialLinks = {
    instagram: "https://www.instagram.com/medin.gen/?hl=en",
    facebook: "https://www.facebook.com/people/Medingen/61567679517972/",
    youtube: "https://www.youtube.com/@ashash_mig",
    linkedin: "https://www.linkedin.com/company/medingen2024/posts/?feedView=all",
    twitter: "https://twitter.com/medingen",
  };

  return (
    <footer className="footer-new">
      <div className="footer-container">
        <div className="footer-header">
          <div className="footer-logo-section">
            <img src="/migfulllogo.png" alt="Medingen Logo" className="footer-logo-img" />
            <div className="footer-logo-text">Save your health and wealth</div>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <h3 className="footer-heading">Know Us</h3>
            <ul className="footer-list">
              {knowUsLinks.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>

            <h3 className="footer-heading mt-4">Health Resources</h3>
            <ul className="footer-list">
              <li onClick={() => handleLinkClick("internal", "/blogs")}>All Blogs</li>
              <li onClick={() => handleLinkClick("internal", "/categories")}>All Categories</li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Top Categories</h3>
            <ul className="footer-list">
              {topCategories.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Top Selling Medicines</h3>
            <ul className="footer-list">
              {topSellingMedicines.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Top Healthcare Devices</h3>
            <ul className="footer-list">
              {topHealthcareDevices.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>

            <h3 className="footer-heading mt-4">Top Health Products</h3>
            <ul className="footer-list">
              {topHealthProducts.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom-section">
          <div className="footer-bottom-col">
            <h3 className="footer-heading">Contact Us</h3>
            <p className="footer-text">Our customer support team is available 7 days a week from 10:00 am - 7:00 pm.</p><br />
            <p className="footer-text email" onClick={() => handleLinkClick("mailto", "support@medingen.in")}>support@medingen.in</p><br />
            <p className="footer-text phone" onClick={() => handleLinkClick("tel", "+917090123709")}>709 0123 709</p>
          </div>

          <div className="footer-bottom-col">
            <h3 className="footer-heading">Grievance Officer</h3>
            <p className="footer-text">Name: Kapilesh</p><br />
            <p className="footer-text email" onClick={() => handleLinkClick("mailto", "grievancemig@gmail.com")}>Email: grievancemig@gmail.com</p>
          </div>

          <div className="footer-bottom-col">
            <h3 className="footer-heading">Registered Office Address</h3>
            <p className="footer-text">No.16, Ground Floor, School Street, Mangadu, Chennai 600 122.</p>
          </div>

          <div className="footer-bottom-col social-col">
            <h3 className="footer-heading">Medingen</h3>
            <h4 className="footer-subheading">Follow Us On</h4>
            <div className="social-icons">
              <img src="/FB.svg" alt="Facebook" onClick={() => handleLinkClick("external", socialLinks.facebook)} />
              <img src="/YT.svg" alt="YouTube" onClick={() => handleLinkClick("external", socialLinks.youtube)} />
              <img src="/IG.svg" alt="Instagram" onClick={() => handleLinkClick("external", socialLinks.instagram)} />
              <img src="/twt.svg" alt="Twitter / X" onClick={() => handleLinkClick("external", socialLinks.twitter)} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
