import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAveragePrice, getSalt, searchsaltProducts, getProductDescription } from "../../api/Api";
import Header from "../Dashboard/Header";

import Navigation from "../Dashboard/Navigation";
import Swal from "sweetalert2";
import axios from "axios";
import DOMPurify from "dompurify";
import { Helmet } from "react-helmet";
import "./style.css";

/* ─────────────────────────────────────────────
   Helper: parse raw FAQ html into Q&A pairs
   Handles two common formats:
     1. <strong>Q. question?</strong> answer text
     2. Plain paragraph starting with "Q."
───────────────────────────────────────────── */
const parseFaqHtml = (html) => {
  if (!html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const faqs = [];

  // Format 1 – paragraphs where a <strong> holds the question
  const paras = doc.querySelectorAll("p");
  paras.forEach((p) => {
    const strong = p.querySelector("strong");
    if (strong) {
      const q = strong.textContent.replace(/^Q\.\s*/i, "").replace(/\?$/, "").trim() + "?";
      // answer = everything after the <strong>
      const clone = p.cloneNode(true);
      clone.querySelectorAll("strong").forEach((s) => s.remove());
      const a = clone.textContent.trim();
      if (q && a) faqs.push({ q, a });
    }
  });

  // Format 2 – if no strong-based pairs found, try splitting by "Q."
  if (faqs.length === 0) {
    const text = doc.body.textContent || "";
    const chunks = text.split(/Q\.\s+/).filter(Boolean);
    chunks.forEach((chunk) => {
      const qEnd = chunk.search(/[?]/);
      if (qEnd === -1) return;
      const q = chunk.slice(0, qEnd + 1).trim();
      const a = chunk.slice(qEnd + 1).trim();
      if (q && a) faqs.push({ q, a });
    });
  }

  return faqs;
};

export const SaltPage = () => {
  const [salt, setSalt] = useState(null);
  const [alternateProducts, setAlternateProducts] = useState([]);
  const [tabs, setTabs] = useState({});
  const [activeTab, setActiveTab] = useState("");
  const [openFaq, setOpenFaq] = useState(null);          // which FAQ item is open
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const salt_name = decodeURIComponent(
    location.pathname.replace(/^\/(salt|salt_name)\//, "")
  );

  const handleView = (product) => navigate(`/product/${product.product_name_url}`);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  /* ── fetch products ── */
  const fetchAlternateProducts = async () => {
    try {
      setProductsLoading(true);
      const result = await searchsaltProducts(salt_name, 1, { rc: 1 });
      if (result?.results) {
        setAlternateProducts(
          result.results.map((prod) => ({
            product_name_url: prod.product_name_url,
            originalPrice: prod.product_pricing_old,
            discountedPrice: prod.product_pricing_new,
            discount: Math.round(
              ((parseFloat(prod.product_pricing_new)) / parseFloat(prod.product_pricing_new)) * 100
            ),
            imageUrl: prod.first_image_url,
            name: prod.product_name,
            manufacturer: prod.manufacturer,
            product_id: prod.product_id,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProductsLoading(false);
    }
  };

  /* ── parse description html → tabs ── */
  const parseDescriptionToTabs = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headerLevels = ["h1", "h2", "h3", "h4", "h5", "h6"];
    let sections = null;
    for (const level of headerLevels) {
      sections = doc.querySelectorAll(level);
      if (sections.length > 0) break;
    }
    if (!sections || sections.length === 0) return {};
    const tabsData = {};
    sections.forEach((section) => {
      const heading =
        section.querySelector("strong")?.textContent.trim() ||
        section.textContent.trim();
      const content = [];
      let sibling = section.nextElementSibling;
      while (sibling && !headerLevels.includes(sibling.tagName.toLowerCase())) {
        content.push(sibling.outerHTML);
        sibling = sibling.nextElementSibling;
      }
      if (heading) tabsData[heading] = content.join("");
    });
    return tabsData;
  };

  /* ── fetch salt info ── */
  const fetchSalt = async () => {
    try {
      setLoading(true);
      const response = await getSalt(salt_name);
      if (response) {
        setSalt((prev) => ({ ...prev, response }));
        const data = await getProductDescription(response.description_url);
        const sanitized = DOMPurify.sanitize(data);
        const parsedTabs = parseDescriptionToTabs(sanitized);
        setTabs(parsedTabs);
        setActiveTab(Object.keys(parsedTabs)[0]);
      } else {
        Swal.fire({ icon: "error", title: "Salt not found", text: "Redirecting to home page" })
          .then(() => { window.location.href = "/"; });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salt_name) { fetchSalt(); fetchAlternateProducts(); }
  }, [salt_name]);

  const mainTabs = Object.keys(tabs).filter((t) => t !== "Frequently Asked Questions");
  const faqItems = parseFaqHtml(tabs["Frequently Asked Questions"] || "");

  const seoTitle = `${salt_name} – Uses, Dosage, Side Effects & Price | MediGen`;
  const seoDescription = `Complete information on ${salt_name}: uses, dosage, side effects, interactions, substitutes and best price. Compare generic medicines with ${salt_name} composition.`;
  const canonicalUrl = `https://medigen.in/salt/${encodeURIComponent(salt_name)}`;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Drug",
          "name": salt_name,
          "description": seoDescription,
          "url": canonicalUrl,
          "activeIngredient": salt_name,
        })}</script>
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap');

        /* Note: Header is rendered without title prop to prevent its built-in breadcrumb.
           Our custom .sp-breadcrumb below is the sole breadcrumb on the page. */

        * {
          box-sizing: border-box;
        }

        .sp-root {
          --purple:        #6C3CE1;
          --purple-dark:   #5228c4;
          --purple-light:  #EEF0FF;
          --purple-mid:    #c5bbf5;
          --purple-border: #ddd8f8;
          --ink:           #111827;
          --ink-2:         #374151;
          --muted:         #6b7280;
          --border:        #e5e7eb;
          --surface:       #f8f9ff;
          --white:         #ffffff;
          --green:         #059669;
          --green-bg:      #d1fae5;
          --radius:        14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f5f4ff;
          min-height: 100vh;
          color: var(--ink);
          -webkit-text-size-adjust: 100%;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .sp-wrap {
          max-width: 1300px;
          margin: 0 auto;
          padding: 24px 20px 100px;
        }

        @media (max-width: 1024px) {
          .sp-wrap {
            padding: 20px 18px 100px;
          }
        }

        @media (max-width: 768px) {
          .sp-wrap {
            padding: 16px 14px 140px;
          }
          aside {
            margin-bottom: 60px;
          }
        }

        @media (max-width: 640px) {
          .sp-wrap {
            padding: 14px 12px 140px;
          }
        }

        @media (max-width: 480px) {
          .sp-wrap {
            padding: 12px 10px 160px;
          }
        }

        /* ══ Breadcrumb — single row, straight alignment ══ */
        .sp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 20px;
          flex-wrap: wrap;
          line-height: 1;
        }

        @media (max-width: 640px) {
          .sp-breadcrumb {
            font-size: 12px;
            gap: 4px;
            margin-bottom: 16px;
          }
        }

        .sp-breadcrumb a {
          color: var(--purple);
          text-decoration: none;
          font-weight: 500;
          white-space: nowrap;
        }
        .sp-breadcrumb a:hover { text-decoration: underline; }
        .sp-bc-sep {
          display: inline-flex;
          align-items: center;
          color: var(--muted);
          flex-shrink: 0;
        }
        .sp-bc-sep svg { width: 13px; height: 13px; display: block; }

        @media (max-width: 640px) {
          .sp-bc-sep svg { width: 11px; height: 11px; }
        }

        .sp-bc-current {
          color: var(--ink);
          font-weight: 600;
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 320px;
        }

        @media (max-width: 640px) {
          .sp-bc-current {
            max-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .sp-bc-current {
            max-width: 140px;
          }
        }

        /* ══ Hero ══ */
        .sp-hero {
          background: linear-gradient(135deg, #5228c4 0%, #6C3CE1 55%, #8B5CF6 100%);
          border-radius: 20px;
          padding: 36px 44px;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(108,60,225,.28);
        }

        @media (max-width: 1024px) {
          .sp-hero {
            padding: 32px 36px;
            margin-bottom: 24px;
          }
        }

        @media (max-width: 768px) {
          .sp-hero {
            padding: 28px 28px;
            margin-bottom: 20px;
            gap: 18px;
          }
        }

        @media (max-width: 640px) {
          .sp-hero {
            flex-direction: column;
            padding: 24px 20px;
            margin-bottom: 18px;
            gap: 16px;
            border-radius: 16px;
          }
        }

        @media (max-width: 480px) {
          .sp-hero {
            padding: 18px 14px;
            margin-bottom: 14px;
            gap: 12px;
          }
        }

        .sp-hero::before {
          content:''; position:absolute; top:-80px; right:-80px;
          width:300px; height:300px; border-radius:50%;
          background:rgba(255,255,255,.07); pointer-events:none;
        }
        .sp-hero::after {
          content:''; position:absolute; bottom:-100px; left:25%;
          width:360px; height:360px; border-radius:50%;
          background:rgba(255,255,255,.04); pointer-events:none;
        }
        .sp-hero-left { position:relative; z-index:1; flex:1; min-width:0; }
        .sp-hero-badge {
          display:inline-flex; align-items:center; gap:7px;
          background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
          color:rgba(255,255,255,.92); font-size:11px; font-weight:600;
          letter-spacing:.09em; text-transform:uppercase;
          padding:5px 13px; border-radius:20px; margin-bottom:14px;
        }

        @media (max-width: 640px) {
          .sp-hero-badge {
            font-size: 10px;
            padding: 4px 10px;
            gap: 5px;
            margin-bottom: 10px;
          }
        }

        .sp-hero-badge svg { width:13px; height:13px; }

        @media (max-width: 640px) {
          .sp-hero-badge svg { width: 11px; height: 11px; }
        }

        .sp-hero h1 {
          font-family:'Sora',sans-serif;
          font-size:clamp(22px,3.5vw,36px);
          font-weight:700; color:#fff;
          margin:0 0 8px; line-height:1.15; text-transform:capitalize;
        }

        @media (max-width: 640px) {
          .sp-hero h1 {
            font-size: clamp(18px, 5vw, 26px);
            margin: 0 0 6px;
          }
        }

        @media (max-width: 480px) {
          .sp-hero h1 {
            font-size: clamp(16px, 4.5vw, 22px);
            margin: 0 0 4px;
          }
        }

        .sp-hero-sub { 
          color:rgba(255,255,255,.72); 
          font-size:14px; 
          margin:0; 
          font-weight:400; 
          max-width:560px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .sp-hero-sub {
            font-size: 13px;
          }
        }

        @media (max-width: 640px) {
          .sp-hero-sub {
            font-size: 12px;
            max-width: 100%;
          }
        }



        /* ══ Layout ══ */
        .sp-layout {
          display:grid;
          grid-template-columns:1fr 368px;
          gap:24px;
          align-items:start;
        }

        @media (max-width: 1024px) {
          .sp-layout {
            grid-template-columns: 1fr 320px;
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .sp-layout {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* ══ Card ══ */
        .sp-card {
          background:var(--white);
          border-radius:var(--radius);
          border:1px solid var(--purple-border);
          overflow:hidden;
          box-shadow:0 2px 12px rgba(108,60,225,.07);
        }

        /* ══ Tab nav ══ */
        .sp-tab-nav {
          display:flex; flex-wrap:nowrap;
          padding:0 20px;
          border-bottom:2px solid var(--purple-border);
          background:var(--surface);
          overflow-x:auto; -webkit-overflow-scrolling:touch;
          scrollbar-width:none;
        }

        @media (max-width: 768px) {
          .sp-tab-nav {
            padding: 0 14px;
          }
        }

        @media (max-width: 480px) {
          .sp-tab-nav {
            padding: 0 10px;
          }
        }

        .sp-tab-nav::-webkit-scrollbar { display:none; }
        .sp-tab-btn {
          padding:14px 18px; 
          font-size:13px; 
          font-weight:500;
          color:var(--muted); 
          cursor:pointer; 
          border:none;
          background:transparent; 
          border-bottom:2px solid transparent;
          margin-bottom:-2px; 
          transition:color .2s,border-color .2s;
          white-space:nowrap; 
          font-family:'Plus Jakarta Sans',sans-serif;
          touch-action: manipulation;
        }

        @media (max-width: 768px) {
          .sp-tab-btn {
            padding: 12px 14px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .sp-tab-btn {
            padding: 10px 12px;
            font-size: 11px;
          }
        }

        .sp-tab-btn:hover { color:var(--purple); }
        .sp-tab-btn:active { color:var(--purple); }
        .sp-tab-btn.active {
          color:var(--purple); 
          border-bottom-color:var(--purple);
          font-weight:700;
          background:linear-gradient(to bottom,transparent,rgba(108,60,225,.04));
        }

        /* ══ Tab content ══ */
        .sp-tab-body { 
          padding:28px 30px 32px; 
        }

        @media (max-width: 768px) {
          .sp-tab-body {
            padding: 22px 22px 26px;
          }
        }

        @media (max-width: 640px) {
          .sp-tab-body {
            padding: 18px 16px 22px;
          }
        }

        @media (max-width: 480px) {
          .sp-tab-body {
            padding: 14px 12px 18px;
          }
        }

        .sp-tab-body h2 {
          font-family:'Sora',sans-serif; 
          font-size:20px; 
          font-weight:700;
          color:var(--ink); 
          margin:0 0 4px;
          word-break: break-word;
        }

        @media (max-width: 768px) {
          .sp-tab-body h2 {
            font-size: 18px;
          }
        }

        @media (max-width: 640px) {
          .sp-tab-body h2 {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .sp-tab-body h2 {
            font-size: 14px;
          }
        }

        .sp-tab-accent {
          height:3px; 
          width:44px;
          background:linear-gradient(90deg,var(--purple),#a78bfa);
          border-radius:4px; 
          margin-bottom:20px;
        }

        @media (max-width: 640px) {
          .sp-tab-accent {
            margin-bottom: 16px;
          }
        }

        .sp-tab-body p  { 
          color:var(--ink-2); 
          line-height:1.8; 
          font-size:14.5px; 
          margin-bottom:14px;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        @media (max-width: 768px) {
          .sp-tab-body p {
            font-size: 14px;
            margin-bottom: 12px;
          }
        }

        @media (max-width: 640px) {
          .sp-tab-body p {
            font-size: 13px;
            margin-bottom: 10px;
          }
        }

        .sp-tab-body ul,.sp-tab-body ol { 
          padding-left:22px; 
          margin-bottom:14px;
        }

        @media (max-width: 640px) {
          .sp-tab-body ul, .sp-tab-body ol {
            padding-left: 18px;
            margin-bottom: 10px;
          }
        }

        .sp-tab-body li { 
          color:var(--ink-2); 
          line-height:1.75; 
          font-size:14.5px; 
          margin-bottom:7px;
          word-break: break-word;
        }

        @media (max-width: 640px) {
          .sp-tab-body li {
            font-size: 13px;
            margin-bottom: 5px;
          }
        }

        .sp-tab-body li::marker { color:var(--purple); }
        .sp-tab-body table { 
          width:100%; 
          border-collapse:collapse; 
          font-size:14px; 
          margin-bottom:16px;
          overflow-x: auto;
          display: block;
        }

        @media (max-width: 768px) {
          .sp-tab-body table {
            font-size: 13px;
            margin-bottom: 12px;
          }
        }

        @media (max-width: 480px) {
          .sp-tab-body table {
            font-size: 12px;
            margin-bottom: 10px;
          }
        }

        .sp-tab-body th { 
          background:var(--purple-light); 
          color:var(--purple-dark); 
          font-weight:700; 
          padding:11px 16px; 
          text-align:left; 
          border:1px solid var(--purple-border);
          word-break: break-word;
        }

        @media (max-width: 640px) {
          .sp-tab-body th {
            padding: 9px 12px;
            font-size: 12px;
          }
        }

        .sp-tab-body td { 
          padding:10px 16px; 
          border:1px solid var(--border); 
          color:var(--ink-2);
          word-break: break-word;
        }

        @media (max-width: 640px) {
          .sp-tab-body td {
            padding: 8px 12px;
            font-size: 12px;
          }
        }

        .sp-tab-body tr:nth-child(even) td { background:var(--surface); }
        .sp-tab-body strong { color:var(--ink); font-weight:600; }
        .sp-tab-body a { color:var(--purple); text-decoration:underline; word-break: break-word; }

        /* ══ FAQ accordion ══ */
        .sp-faq-section {
          border-top:2px solid var(--purple-border);
          padding:24px 30px 28px;
        }

        @media (max-width: 768px) {
          .sp-faq-section {
            padding: 20px 22px 24px;
          }
        }

        @media (max-width: 640px) {
          .sp-faq-section {
            padding: 16px 16px 20px;
          }
        }

        @media (max-width: 480px) {
          .sp-faq-section {
            padding: 12px 12px 16px;
          }
        }

        .sp-faq-section-title {
          display:flex; 
          align-items:center; 
          gap:10px;
          margin-bottom:18px;
          flex-wrap: wrap;
        }

        @media (max-width: 640px) {
          .sp-faq-section-title {
            gap: 8px;
            margin-bottom: 14px;
          }
        }

        .sp-faq-section-title-icon {
          width:36px; 
          height:36px; 
          border-radius:9px;
          background:var(--purple-light);
          display:flex; 
          align-items:center; 
          justify-content:center; 
          flex-shrink:0;
        }

        @media (max-width: 640px) {
          .sp-faq-section-title-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }
        }

        .sp-faq-section-title-icon svg { 
          color:var(--purple); 
          width:18px; 
          height:18px; 
        }

        @media (max-width: 640px) {
          .sp-faq-section-title-icon svg {
            width: 16px;
            height: 16px;
          }
        }

        .sp-faq-section h2 {
          font-family:'Sora',sans-serif; 
          font-size:17px; 
          font-weight:700;
          color:var(--ink); 
          margin:0;
          word-break: break-word;
        }

        @media (max-width: 768px) {
          .sp-faq-section h2 {
            font-size: 16px;
          }
        }

        @media (max-width: 640px) {
          .sp-faq-section h2 {
            font-size: 15px;
          }
        }

        @media (max-width: 480px) {
          .sp-faq-section h2 {
            font-size: 13px;
          }
        }

        .sp-faq-list { 
          display:flex; 
          flex-direction:column; 
          gap:10px;
        }

        @media (max-width: 640px) {
          .sp-faq-list {
            gap: 8px;
          }
        }

        .sp-faq-item {
          border:1.5px solid var(--purple-border);
          border-radius:11px;
          overflow:hidden;
          transition:border-color .2s, box-shadow .2s;
        }

        @media (max-width: 640px) {
          .sp-faq-item {
            border-radius: 9px;
            border-width: 1px;
          }
        }

        .sp-faq-item.open {
          border-color:var(--purple-mid);
          box-shadow:0 4px 16px rgba(108,60,225,.1);
        }
        .sp-faq-q {
          display:flex; 
          align-items:center; 
          justify-content:space-between;
          gap:12px; 
          padding:15px 18px;
          cursor:pointer; 
          background:var(--white);
          transition:background .15s;
          user-select:none;
          -webkit-user-select: none;
          min-height: 44px;
        }

        @media (max-width: 768px) {
          .sp-faq-q {
            padding: 13px 14px;
            gap: 10px;
          }
        }

        @media (max-width: 640px) {
          .sp-faq-q {
            padding: 12px 12px;
            gap: 8px;
            min-height: 40px;
          }
        }

        @media (max-width: 480px) {
          .sp-faq-q {
            padding: 10px 10px;
            gap: 6px;
            min-height: 36px;
          }
        }

        .sp-faq-item.open .sp-faq-q { background:var(--purple-light); }
        .sp-faq-q:hover { background:var(--purple-light); }
        .sp-faq-q:active { background:var(--purple-light); }
        
        .sp-faq-q-left { 
          display:flex; 
          align-items:flex-start; 
          gap:10px;
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 640px) {
          .sp-faq-q-left {
            gap: 8px;
          }
        }

        .sp-faq-q-badge {
          flex-shrink:0; 
          margin-top:1px;
          width:22px; 
          height:22px; 
          border-radius:6px;
          background:var(--purple); 
          color:#fff;
          font-size:11px; 
          font-weight:700;
          display:flex; 
          align-items:center; 
          justify-content:center;
          letter-spacing:.02em;
          min-width: 22px;
        }

        @media (max-width: 640px) {
          .sp-faq-q-badge {
            width: 20px;
            height: 20px;
            font-size: 10px;
            min-width: 20px;
          }
        }

        .sp-faq-q-text {
          font-size:14px; 
          font-weight:600; 
          color:var(--ink); 
          line-height:1.45;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        @media (max-width: 768px) {
          .sp-faq-q-text {
            font-size: 13px;
          }
        }

        @media (max-width: 640px) {
          .sp-faq-q-text {
            font-size: 12px;
            line-height: 1.35;
          }
        }

        .sp-faq-chevron {
          flex-shrink:0; 
          width:18px; 
          height:18px; 
          color:var(--purple);
          transition:transform .28s ease;
        }

        @media (max-width: 640px) {
          .sp-faq-chevron {
            width: 16px;
            height: 16px;
          }
        }

        .sp-faq-item.open .sp-faq-chevron { transform:rotate(180deg); }

        .sp-faq-a {
          max-height:0; 
          overflow:hidden;
          transition:max-height .32s ease, padding .28s ease;
          padding:0 18px;
          font-size:14px; 
          color:var(--ink-2); 
          line-height:1.75;
          background:var(--white);
          word-break: break-word;
          overflow-wrap: break-word;
        }

        @media (max-width: 640px) {
          .sp-faq-a {
            font-size: 13px;
            padding: 0 12px;
          }
        }

        @media (max-width: 480px) {
          .sp-faq-a {
            font-size: 12px;
            padding: 0 10px;
          }
        }

        .sp-faq-item.open .sp-faq-a {
          max-height:600px;
          padding:12px 18px 16px;
          border-top:1px solid var(--purple-border);
        }

        @media (max-width: 640px) {
          .sp-faq-item.open .sp-faq-a {
            padding: 10px 12px 12px;
          }
        }

        .sp-faq-a ul { 
          padding-left:18px; 
          margin:6px 0 0;
        }

        @media (max-width: 640px) {
          .sp-faq-a ul {
            padding-left: 14px;
            margin: 4px 0 0;
          }
        }

        .sp-faq-a li { 
          margin-bottom:5px; 
          color:var(--ink-2);
          word-break: break-word;
        }
        .sp-faq-a li::marker { color:var(--purple); }

        /* ══ Products sidebar ══ */
        .sp-products-card { 
          position:sticky; 
          top:24px;
        }

        @media (max-width: 768px) {
          .sp-products-card {
            position: static;
            top: auto;
          }
        }

        .sp-products-header {
          padding:16px 18px; 
          border-bottom:1px solid var(--purple-border);
          display:flex; 
          align-items:center; 
          gap:12px;
          background:var(--purple-light);
        }

        @media (max-width: 768px) {
          .sp-products-header {
            padding: 14px 14px;
            gap: 10px;
          }
        }

        @media (max-width: 640px) {
          .sp-products-header {
            padding: 12px 12px;
            gap: 8px;
          }
        }

        .sp-products-header-icon {
          width:40px; 
          height:40px; 
          background:var(--purple); 
          border-radius:10px;
          display:flex; 
          align-items:center; 
          justify-content:center; 
          flex-shrink:0;
        }

        @media (max-width: 768px) {
          .sp-products-header-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
          }
        }

        .sp-products-header-icon svg { 
          color:#fff; 
          width:18px; 
          height:18px; 
        }

        @media (max-width: 768px) {
          .sp-products-header-icon svg {
            width: 16px;
            height: 16px;
          }
        }

        .sp-products-header-text { 
          flex:1; 
          min-width:0; 
        }
        .sp-products-header h2 {
          font-size:13.5px; 
          font-weight:700; 
          color:var(--purple-dark);
          margin:0 0 2px; 
          white-space:nowrap; 
          overflow:hidden; 
          text-overflow:ellipsis;
          font-family:'Plus Jakarta Sans',sans-serif;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }

        @media (max-width: 768px) {
          .sp-products-header h2 {
            font-size: 12px;
          }
        }

        @media (max-width: 640px) {
          .sp-products-header h2 {
            font-size: 11px;
            margin: 0 0 1px;
          }
        }

        .sp-products-header-sub { 
          font-size:12px; 
          color:var(--purple); 
          font-weight:500;
        }

        @media (max-width: 768px) {
          .sp-products-header-sub {
            font-size: 11px;
          }
        }

        @media (max-width: 640px) {
          .sp-products-header-sub {
            font-size: 10px;
          }
        }

        .sp-product-list {
          max-height:580px; 
          overflow-y:auto;
          padding:12px; 
          display:flex; 
          flex-direction:column; 
          gap:10px;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .sp-product-list {
            max-height: none;
            padding: 10px;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .sp-product-list {
            max-height: none;
            padding: 10px 10px 40px;
            gap: 6px;
          }
        }

        .sp-product-list::-webkit-scrollbar { width:4px; }
        .sp-product-list::-webkit-scrollbar-thumb { background:var(--purple-mid); border-radius:4px; }

        .sp-product-item {
          display:flex; 
          align-items:center; 
          gap:12px;
          padding:12px; 
          border-radius:11px;
          border:1.5px solid var(--border); 
          background:var(--white);
          transition:border-color .2s,box-shadow .2s,transform .15s;
          cursor:pointer;
          -webkit-tap-highlight-color: transparent;
          min-height: 80px;
        }

        @media (max-width: 768px) {
          .sp-product-item {
            padding: 10px;
            gap: 10px;
            min-height: 70px;
          }
        }

        @media (max-width: 640px) {
          .sp-product-item {
            padding: 12px;
            gap: 12px;
            border-radius: 12px;
            min-height: 80px;
            margin-bottom: 4px;
          }
        }

        .sp-product-item:hover {
          border-color:var(--purple-mid);
          box-shadow:0 4px 18px rgba(108,60,225,.12);
          transform:translateY(-1px);
        }

        .sp-product-item:active {
          transform: translateY(0);
          box-shadow:0 2px 8px rgba(108,60,225,.08);
        }

        .sp-product-img {
          width:58px; 
          height:58px; 
          border-radius:9px;
          background:var(--surface); 
          border:1px solid var(--purple-border);
          display:flex; 
          align-items:center; 
          justify-content:center;
          flex-shrink:0; 
          overflow:hidden;
        }

        @media (max-width: 768px) {
          .sp-product-img {
            width: 50px;
            height: 50px;
            border-radius: 8px;
          }
        }

        @media (max-width: 640px) {
          .sp-product-img {
            width: 44px;
            height: 44px;
            border-radius: 7px;
          }
        }

        .sp-product-img img { 
          width:100%; 
          height:100%; 
          object-fit:contain; 
        }
        
        .sp-product-info { 
          flex:1; 
          min-width:0; 
        }
        .sp-product-name { 
          font-size:13px; 
          font-weight:700; 
          color:var(--ink); 
          white-space:nowrap; 
          overflow:hidden; 
          text-overflow:ellipsis; 
          margin-bottom:2px;
          word-break: break-word;
          white-space: normal;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        @media (max-width: 768px) {
          .sp-product-name {
            font-size: 12px;
          }
        }

        @media (max-width: 640px) {
          .sp-product-name {
            font-size: 11px;
            margin-bottom: 1px;
          }
        }

        .sp-product-mfg  { 
          font-size:11px; 
          color:var(--muted); 
          margin-bottom:6px; 
          white-space:nowrap; 
          overflow:hidden; 
          text-overflow:ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        @media (max-width: 768px) {
          .sp-product-mfg {
            font-size: 10px;
            margin-bottom: 4px;
          }
        }

        @media (max-width: 640px) {
          .sp-product-mfg {
            font-size: 9px;
            margin-bottom: 3px;
          }
        }

        .sp-product-pricing { 
          display:flex; 
          align-items:center; 
          gap:6px;
          flex-wrap: wrap;
        }

        @media (max-width: 640px) {
          .sp-product-pricing {
            gap: 4px;
          }
        }

        .sp-product-price { 
          font-size:14px; 
          font-weight:700; 
          color:var(--ink); 
        }

        @media (max-width: 768px) {
          .sp-product-price {
            font-size: 13px;
          }
        }

        @media (max-width: 640px) {
          .sp-product-price {
            font-size: 12px;
          }
        }

        .sp-discount-pill { 
          font-size:10px; 
          font-weight:700; 
          color:var(--green); 
          background:var(--green-bg); 
          border-radius:20px; 
          padding:2px 8px;
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .sp-discount-pill {
            font-size: 8px;
            padding: 1px 6px;
          }
        }

        .sp-view-btn {
          flex-shrink:0; 
          padding:8px 15px;
          background:var(--purple); 
          color:#fff;
          font-size:12px; 
          font-weight:700; 
          border-radius:8px; 
          border:none;
          cursor:pointer; 
          font-family:'Plus Jakarta Sans',sans-serif;
          box-shadow:0 4px 12px rgba(108,60,225,.25);
          transition:background .2s,transform .15s;
          min-height: 36px;
          min-width: 70px;
          touch-action: manipulation;
        }

        @media (max-width: 768px) {
          .sp-view-btn {
            padding: 7px 12px;
            font-size: 11px;
            min-width: 60px;
            min-height: 32px;
          }
        }

        @media (max-width: 640px) {
          .sp-view-btn {
            padding: 6px 10px;
            font-size: 10px;
            min-width: 55px;
            min-height: 30px;
            border-radius: 6px;
          }
        }

        .sp-view-btn:hover { 
          background:var(--purple-dark); 
          transform:scale(1.04); 
        }

        .sp-view-btn:active {
          transform: scale(0.98);
        }

        /* ══ Skeleton ══ */
        .sp-skel { animation:sp-pulse 1.5s ease-in-out infinite; }
        @keyframes sp-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .sp-skel-b { background:var(--purple-border); border-radius:8px; }

        /* ══ Empty ══ */
        .sp-empty { 
          padding:40px 24px; 
          text-align:center; 
          color:var(--muted); 
          font-size:14px;
        }

        @media (max-width: 640px) {
          .sp-empty {
            padding: 30px 16px;
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .sp-empty {
            padding: 20px 12px;
            font-size: 12px;
          }
        }

        .sp-empty svg { 
          width:48px; 
          height:48px; 
          color:var(--purple-mid); 
          margin:0 auto 12px; 
          display:block;
        }

        @media (max-width: 640px) {
          .sp-empty svg {
            width: 40px;
            height: 40px;
            margin: 0 auto 8px;
          }
        }

        /* Touch-friendly adjustments */
        @media (hover: none) and (pointer: coarse) {
          .sp-tab-btn,
          .sp-faq-q,
          .sp-product-item,
          .sp-view-btn {
            min-height: 44px;
          }
        }

        /* Fix floating cart overlap on mobile */
        @media (max-width: 800px) {
          .floating-cart-left {
            left: auto !important;
            right: 15px !important;
            bottom: 100px !important;
          }
          .sp-footer-section {
            display: none !important;
          }
        }
      `}</style>

      <div className="sp-root">
        <Header />

        <div className="sp-wrap">

          {/* ── Hero ── */}
          <header className="sp-hero">
            <div className="sp-hero-left">
              <div className="sp-hero-badge">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Active Pharmaceutical Ingredient
              </div>
              <h1>{salt_name} – Uses, Side Effects &amp; Price</h1>
              <p className="sp-hero-sub">
                Detailed information on uses, dosage, side effects, interactions &amp; available generic medicines
              </p>
            </div>

          </header>

          {/* ── Two-column layout ── */}
          <div className="sp-layout">

            {/* LEFT — info + FAQ */}
            <main>
              <article className="sp-card">

                {/* Tab nav */}
                {mainTabs.length > 0 && (
                  <div className="sp-tab-nav" role="tablist">
                    {mainTabs.map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={activeTab === tab}
                        className={`sp-tab-btn ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tab body */}
                <div className="sp-tab-body" role="tabpanel">
                  {activeTab && tabs[activeTab] ? (
                    <>
                      <h2>{activeTab} of {salt_name}</h2>
                      <div className="sp-tab-accent" />
                      <div dangerouslySetInnerHTML={{ __html: tabs[activeTab] }} />
                    </>
                  ) : loading ? (
                    <div className="sp-skel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div className="sp-skel-b" style={{ height: 24, width: "55%" }} />
                      <div className="sp-skel-b" style={{ height: 4, width: "10%" }} />
                      {[90, 75, 85, 60, 80].map((w, i) => (
                        <div key={i} className="sp-skel-b" style={{ height: 15, width: `${w}%` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="sp-empty">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      No information available.
                    </div>
                  )}
                </div>

                {/* ── Styled FAQ accordion ── */}
                {faqItems.length > 0 && (
                  <section className="sp-faq-section" aria-label="Frequently Asked Questions">
                    <div className="sp-faq-section-title">
                      <div className="sp-faq-section-title-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2>Frequently Asked Questions about {salt_name}</h2>
                    </div>

                    <div className="sp-faq-list">
                      {faqItems.map((item, i) => (
                        <div
                          key={i}
                          className={`sp-faq-item ${openFaq === i ? "open" : ""}`}
                        >
                          {/* Question row */}
                          <div
                            className="sp-faq-q"
                            onClick={() => toggleFaq(i)}
                            role="button"
                            aria-expanded={openFaq === i}
                          >
                            <div className="sp-faq-q-left">
                              <span className="sp-faq-q-badge">Q</span>
                              <span className="sp-faq-q-text">{item.q}</span>
                            </div>
                            <svg
                              className="sp-faq-chevron"
                              fill="none" viewBox="0 0 24 24"
                              stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Answer panel */}
                          <div className="sp-faq-a">
                            {item.a}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              </article>
            </main>

            {/* RIGHT — products */}
            <aside>
              <div className="sp-products-card sp-card">
                <div className="sp-products-header">
                  <div className="sp-products-header-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="sp-products-header-text">
                    <h2>Medicines Containing {salt_name}</h2>
                    <div className="sp-products-header-sub">
                      {productsLoading ? "Loading…" : `${alternateProducts.length} options available`}
                    </div>
                  </div>
                </div>

                {productsLoading ? (
                  <div className="sp-skel" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div className="sp-skel-b" style={{ width: 58, height: 58, borderRadius: 9, flexShrink: 0 }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <div className="sp-skel-b" style={{ height: 13, width: "70%" }} />
                          <div className="sp-skel-b" style={{ height: 11, width: "45%" }} />
                          <div className="sp-skel-b" style={{ height: 13, width: "35%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : alternateProducts.length === 0 ? (
                  <div className="sp-empty">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    No products found.
                  </div>
                ) : (
                  <div className="sp-product-list">
                    {alternateProducts.map((p, i) => (
                      <div
                        key={i}
                        className="sp-product-item"
                        onClick={() => handleView(p)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View ${p.name}`}
                        onKeyDown={(e) => e.key === "Enter" && handleView(p)}
                      >
                        <div className="sp-product-img">
                          <img
                            alt={`${p.name} – ${salt_name}`}
                            src={`https://d1dh0rr5xj2p49.cloudfront.net/products/${p.imageUrl}`}
                            loading="lazy"
                            onError={(e) => { e.target.style.opacity = 0; }}
                          />
                        </div>
                        <div className="sp-product-info">
                          <div className="sp-product-name">{p.name}</div>
                          <div className="sp-product-mfg">{p.manufacturer}</div>
                          <div className="sp-product-pricing">
                            <span className="sp-product-price">₹{p.discountedPrice}</span>
                            {p.discount > 0 && (
                              <span className="sp-discount-pill">{p.discount}% less</span>
                            )}
                          </div>
                        </div>
                        <button className="sp-view-btn" tabIndex={-1} aria-hidden="true">View</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        <div className="landing-page sp-footer-section"></div>
      </div>
      <Navigation />
    </>
  );
};