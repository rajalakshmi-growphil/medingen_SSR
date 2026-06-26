import React, { useState, useEffect } from "react";
import "./style.css";
import Navigation from "../Dashboard/Navigation";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getOffers } from "../../api/Api";
import HeadActions from "../../components/HeadActions/HeadActions";
import Header from "../Dashboard/Header";
import { DashboardHeader } from "../Dashboard/DashboardHeader";

import { Helmet } from "react-helmet";

export const Offers = () => {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  useEffect(() => {
    fetchOffers(page);
  }, [page]);

  const fetchOffers = async (page) => {
    Swal.fire({
      title: "Loading...",
      text: "Fetching offers, please wait.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const data = await getOffers(page);
      setOffers((prevOffers) => [...prevOffers, ...data.offers]);
      setHasNext(data.has_next);
      Swal.close();
    } catch (error) {
      Swal.close();
      Swal.fire("Error", "Failed to fetch offers. Please try again.", "error");
    }
  };

  const handleViewOffer = (offer) => {
    navigate("/view-offer", { state: { offer } });
  };

  const handleViewMore = () => {
    if (hasNext) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  // 🔧 Utility function to format description into HTML
  const formatOfferDescription = (desc) => {
    if (!desc) return "";

    const lines = desc
      .replace(/\\r/g, "")
      .split(/\n|\r|\r\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const isTnC = lines[0].toLowerCase().includes("terms & conditions");

    if (isTnC) {
      const numberedList = lines.slice(1)
        .map((line) => `<li>${line.replace(/^\d+\.\s*/, '')}</li>`)
        .join("");

      return `
        <p><strong>${lines[0]}</strong></p>
        <ol class="offer-terms-list">${numberedList}</ol>
      `;
    }

    return `<p>${lines.join("<br/>")}</p>`;
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

      <div className="offers">
        <Header id="offers-page-header" title={"Offers"} />

        <div className="overlap-wrapper">
          <div className="overlap-2">
            <div className="overlap-group-2">
              <div className="text-wrapper-8">Offers</div>
            </div>
            <Link to="/rewards" className="text-wrapper-9">
              Rewards
            </Link>
          </div>
        </div>

        <div className="offers-container">
          {offers.map((offer) => (
            <div key={offer.id} className="offers-item">
              <div className="frame">
                <div className="frame-wrapper">
                  <div className="div">
                    <img
                      className="rectangle"
                      alt="Offer"
                      src={
                        "https://d1dh0rr5xj2p49.cloudfront.net/banner/" +
                        offer.image
                      }
                    />
                    <div className="div">
                      <div className="frame-2">
                        <p className="p-margin text-wrapper">{offer.title}</p>
                        <div
                          className="p-margin p"
                          dangerouslySetInnerHTML={{
                            __html: formatOfferDescription(offer.description),
                          }}
                        ></div>
                      </div>
                      <div className="div-wrapper">
                        <div className="frame-3">
                          <div
                            onClick={() => handleViewOffer(offer)}
                            className="text-wrapper-2"
                          >
                            {offer.linkText}
                          </div>
                          <img
                            className="vector"
                            alt="Vector"
                            src={offer.linkIcon || "vector-3.svg"}
                            fetchpriority="high"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="offers-item">
            {hasNext ? (
              <button onClick={handleViewMore} className="view-more-button">
                View More
              </button>
            ) : (
              <p className="p-margin no-more-offers-text">
                No more offers available at the moment.
              </p>
            )}
          </div>
        </div>

        <div className="landing-page">
          </div>
      </div>

      <Navigation />
    </>
  );
};

export default Offers;
