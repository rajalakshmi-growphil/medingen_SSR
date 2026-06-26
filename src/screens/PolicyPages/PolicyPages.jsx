import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import "./style.css";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";

import Swal from "sweetalert2";
import { fetchPolicyHtml } from "../../api/Api";

export const PolicyPages = ({ policy }) => {
  const [policyContent, setPolicyContent] = useState(null);
  const [summary, setSummary] = useState([]);

  const policyFileMap = {
    privacy_policy: "privacy.html",
    terms_and_conditions: "tnc.html",
    grievance_redressal_policy: "grievance.html",
    return_policy: "return.html",
  };

  useEffect(() => {
    if (policy && policyFileMap[policy]) {
      fetchPolicy(policyFileMap[policy]);
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid Policy",
        text: "Redirecting to home page",
        showConfirmButton: true,
      }).then(() => {
        window.location.href = "/";
      });
    }
  }, [policy]);

  const fetchPolicy = async (fileName) => {
    try {
      const htmlContent = await fetchPolicyHtml(fileName);
      const updatedHtmlContent = addIdsToHeadings(htmlContent);
      setPolicyContent(updatedHtmlContent);
      generateSummary(updatedHtmlContent);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Policy not found",
        text: "Redirecting to home page",
        showConfirmButton: true,
      }).then(() => {
        window.location.href = "/";
      });
    }
  };

  const addIdsToHeadings = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h2, h3, h4");

    headings.forEach((heading) => {
      const text = heading.textContent;
      const id = heading.id || text.replace(/\s+/g, "-").toLowerCase();
      heading.id = id;
    });

    return doc.body.innerHTML;
  };

  const generateSummary = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h2, h3, h4");

    const summaryData = [];
    let currentH1 = null;
    let currentH2 = null;

    headings.forEach((heading) => {
      const level = heading.tagName.toLowerCase();
      const text = heading.textContent;
      const id = heading.id || text.replace(/\s+/g, "-").toLowerCase();

      heading.id = id;

      if (level === "h2") {
        currentH1 = { text, id, children: [] };
        summaryData.push(currentH1);
      }    });

    setSummary(summaryData);
  };

  return (
    <>
      
     <Helmet>
     <meta title="Buy Generic Medicines Online | Trusted Store - Medingen" />

  <meta
    name="description"
    content="Medingen offers affordable generic medicines and fast doorstep delivery across India. Shop online for trusted and quality healthcare products."
  />
  <link rel="canonical" href="https://medingen.in/" />
</Helmet>
      <Header title={policy.replace(/_/g, " ").toUpperCase()} />
      <div className="policy-page">
        <div className="policy-container">
          {policyContent ? (
            <>
              <div
                className="policy-content"
                dangerouslySetInnerHTML={{ __html: policyContent }}
              ></div>
              <div className="policy-navigation">
                <ul>
                  {summary.map((h1) => (
                     <a href={`#${h1.id}`}>
                    <li key={h1.id} className="pol-navigation-item">
                     {h1.text}
                      {h1.children.length > 0 && (
                        <ul>
                          {h1.children.map((h2) => (
                            <li key={h2.id}>
                              <a href={`#${h2.id}`}>{h2.text}</a>
                              {h2.children.length > 0 && (
                                <ul>
                                  {h2.children.map((h3) => (
                                    <li key={h3.id}>
                                      <a href={`#${h3.id}`}>{h3.text}</a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="arrow-left"><img src="/chevron-left-arrow.svg" fetchpriority="high" alt="Arrow Left"/></div>
                    </li>
                    </a>
                  ))}
                </ul>
                <div className="download-the-app">
                    <img
                      src="/migfulllogo.png"
                      alt="MigMig"
                      className="miglogo"
                    />
                    <p>Download medingen app for better experience</p>
                    <button
                      className="continue-button"
                      onClick={() => {
                        window.location.href = "/";
                      }}
                    >
                      Click here
                      <img
                        className="button-icon"
                        alt="Arrow"
                        src="/vector-3.svg" fetchpriority="high"
                      />
                    </button>
                  </div>
              </div>
             
            </>
          ) : (
            <p>Loading policy...</p>
          )}
        </div>
        <div className="margin-72"></div>
        <div className="landing-page">
          </div>
      </div>
      <Navigation />
    </>
  );
};
