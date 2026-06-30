"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSalt, searchsaltProducts, getProductDescription } from "@/lib/api";
import Header from "../../Dashboard/Header";
import Navigation from "../../Dashboard/Navigation";
import Swal from "sweetalert2";
import DOMPurify from "dompurify";

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

  const paras = doc.querySelectorAll("p");
  paras.forEach((p) => {
    const strong = p.querySelector("strong");
    if (strong) {
      const q = strong.textContent.replace(/^Q\.\s*/i, "").replace(/\?$/, "").trim() + "?";
      const clone = p.cloneNode(true);
      clone.querySelectorAll("strong").forEach((s) => s.remove());
      const a = clone.textContent.trim();
      if (q && a) faqs.push({ q, a });
    }
  });

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
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const salt_name = params.saltName ? decodeURIComponent(String(params.saltName)) : "";

  const handleView = (product) => router.push(`/product/${product.product_name_url}`);
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
          .then(() => { router.push("/"); });
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        .sp-root {
          --purple:        #6C3CE1;
          --purple-dark:   #5228c4;
          --purple-light:  #EEF0FF;
          --purple-mid:    #c5bbf5;
          --purple-border: #ddd8f8;
          --bg-light:      #F8FAFF;
          --text-gray:     #4B5563;
          --text-dark:     #1F2937;
          --radius-lg:     16px;
          --radius-md:     12px;
          --radius-sm:     8px;
          --shadow-sm:     0 2px 8px rgba(108,60,225,0.04);
          --shadow-md:     0 8px 24px rgba(108,60,225,0.06);

          background-color: var(--bg-light);
          height: 100dvh;
          overflow-y: auto;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--text-dark);
          line-height: 1.5;
        }

        .sp-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 100px;
        }

        /* ── Hero ── */
        .sp-hero {
          background: linear-gradient(135deg, #7F4DFF 0%, #6C3CE1 100%);
          border: none;
          border-radius: var(--radius-lg);
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .sp-hero-left {
          flex: 1;
        }

        .sp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .sp-hero-badge svg {
          width: 14px;
          height: 14px;
        }

        .sp-hero h1 {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .sp-hero-sub {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }

        /* ── Two-column layout ── */
        .sp-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }

        .sp-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        /* LEFT — info + FAQ */
        main {
          min-width: 0; /* prevent grid blowouts */
        }

        .sp-tab-nav {
          display: flex;
          background: var(--bg-light);
          border-bottom: 1px solid #E5E7EB;
          padding: 8px 16px 0;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
        }

        .sp-tab-nav::-webkit-scrollbar {
          display: none; /* Safari/Chrome */
        }

        .sp-tab-btn {
          background: transparent;
          border: none;
          outline: none;
          padding: 12px 18px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-gray);
          cursor: pointer;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          border: 1px solid transparent;
          border-bottom: none;
          margin-bottom: -1px;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .sp-tab-btn:hover {
          color: var(--purple);
          background: rgba(108,60,225,0.02);
        }

        .sp-tab-btn.active {
          color: var(--purple);
          background: #ffffff;
          border-color: #E5E7EB;
          border-bottom: 1px solid #ffffff;
        }

        .sp-tab-body {
          padding: 32px;
          min-height: 250px;
        }

        .sp-tab-body h2 {
          font-family: 'Sora', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px;
          color: var(--text-dark);
        }

        .sp-tab-accent {
          width: 24px;
          height: 3px;
          background: var(--purple);
          border-radius: 2px;
          margin-bottom: 20px;
        }

        .sp-tab-body p {
          font-size: 14px;
          color: var(--text-gray);
          margin: 0 0 16px;
          line-height: 1.6;
        }

        /* ── FAQ accordion ── */
        .sp-faq-section {
          padding: 32px;
          border-top: 1px solid #F3F4F6;
          background: #FCFDFE;
        }

        .sp-faq-section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .sp-faq-section-title-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--purple-light);
          color: var(--purple);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sp-faq-section-title-icon svg {
          width: 18px;
          height: 18px;
        }

        .sp-faq-section h2 {
          font-family: 'Sora', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: var(--text-dark);
        }

        .sp-faq-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sp-faq-item {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .sp-faq-item:hover {
          border-color: var(--purple-mid);
          box-shadow: 0 2px 8px rgba(108,60,225,0.02);
        }

        .sp-faq-item.open {
          border-color: var(--purple-mid);
          box-shadow: var(--shadow-sm);
        }

        .sp-faq-q {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          gap: 16px;
          user-select: none;
        }

        .sp-faq-q-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sp-faq-q-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--purple);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .sp-faq-q-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
        }

        .sp-faq-chevron {
          width: 16px;
          height: 16px;
          color: var(--text-gray);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .sp-faq-item.open .sp-faq-chevron {
          transform: rotate(180deg);
          color: var(--purple);
        }

        .sp-faq-a {
          padding: 0 20px 20px 52px;
          font-size: 13px;
          color: var(--text-gray);
          line-height: 1.6;
          display: none;
          border-top: 1px solid transparent;
        }

        .sp-faq-item.open .sp-faq-a {
          display: block;
        }

        /* RIGHT — products */
        aside {
          position: sticky;
          top: 24px;
        }

        .sp-products-card {
          padding: 24px;
        }

        .sp-products-card.sp-card {
          background: var(--purple-light);
          border: 1px solid var(--purple-border);
        }

        .sp-products-header {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(108, 60, 225, 0.12);
          padding-bottom: 16px;
        }

        .sp-products-header-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--purple);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sp-products-header-icon svg {
          width: 20px;
          height: 20px;
        }

        .sp-products-header-text h2 {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px;
          color: var(--purple-dark);
        }

        .sp-products-header-sub {
          font-size: 11px;
          color: var(--purple);
          font-weight: 600;
        }

        .sp-product-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 600px;
          overflow-y: auto;
          padding-right: 4px;
        }

        /* custom scrollbar for side list */
        .sp-product-list::-webkit-scrollbar {
          width: 4px;
        }
        .sp-product-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .sp-product-list::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 2px;
        }

        .sp-product-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-md);
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
        }

        .sp-product-item:hover, .sp-product-item:focus {
          border-color: var(--purple-mid);
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(108, 60, 225, 0.08);
        }

        .sp-product-img {
          width: 48px;
          height: 48px;
          background: #F9FAFB;
          border: 1px solid #F3F4F6;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sp-product-img img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          transition: opacity 0.2s ease;
        }

        .sp-product-info {
          flex: 1;
          min-width: 0;
        }

        .sp-product-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-product-mfg {
          font-size: 10px;
          color: var(--text-gray);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-product-pricing {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sp-product-price {
          font-size: 13px;
          font-weight: 700;
          color: var(--purple);
        }

        .sp-discount-pill {
          background: #ECFDF5;
          color: #10B981;
          border: 1px solid #D1FAE5;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 10px;
        }

        .sp-view-btn {
          border: 1px solid var(--purple);
          background: var(--purple);
          color: #ffffff;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sp-product-item:hover .sp-view-btn,
        .sp-product-item:focus .sp-view-btn,
        .sp-view-btn:hover {
          background: var(--purple-dark);
          border-color: var(--purple-dark);
          color: #ffffff;
        }

        /* ── Skeletons ── */
        .sp-skel-b {
          background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
          background-size: 200% 100%;
          animation: sp-pulse 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes sp-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Empty ── */
        .sp-empty {
          text-align: center;
          padding: 40px 24px;
          color: var(--text-gray);
          font-size: 13px;
          font-weight: 500;
        }

        .sp-empty svg {
          width: 44px;
          height: 44px;
          color: var(--purple-mid);
          margin: 0 auto 12px;
          display: block;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .sp-layout {
            grid-template-columns: 1fr;
          }
          aside {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .sp-hero {
            padding: 24px;
            flex-direction: column;
            align-items: flex-start;
          }
          .sp-hero h1 {
            font-size: 22px;
          }
          .sp-tab-nav {
            padding: 8px 8px 0;
          }
          .sp-tab-btn {
            padding: 10px 14px;
            font-size: 12px;
          }
          .sp-tab-body {
            padding: 20px;
          }
          .sp-faq-section {
            padding: 20px;
          }
          .sp-faq-q {
            padding: 14px 16px;
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

                {/* FAQ accordion */}
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
                            onError={(e) => { e.currentTarget.style.opacity = "0"; }}
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
      </div>
      <Navigation />
    </>
  );
};
