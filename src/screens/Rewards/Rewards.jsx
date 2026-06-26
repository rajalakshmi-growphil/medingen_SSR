import React, { useEffect, useState } from "react";
import "./style.css";
import { RewardsViewMIG } from "../RewardsViewMig/RewardsViewMIG";
import Navigation from "../Dashboard/Navigation";
import Swal from "sweetalert2";
import {
  getOffers,
  getRewardsTransactions,
  getRewardsSummary,
  getUser,
} from "../../api/Api"; // Import the API functions
import { Link, useNavigate } from "react-router-dom";
import Header from "../Dashboard/Header";
import { Helmet } from "react-helmet";

export const Rewards = () => {
  const navigate = useNavigate();
  const [migCoins, setMigCoins] = useState({
    available: 0,
    overall: 0,
    expiring: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [offerData, setOfferData] = useState({
    id: 1,
    title: "Biggest Ever Sale is happening on National Pharmacist Day",
    description:
      "Buy all your medicine at 15% flat discount and also free of all delivery charges",
    image: "rectangle-264.png",
    linkText: "View Offer Now",
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchOffers = async (page) => {
    try {
      const data = await getOffers(page);
      if (data.offers.length !== 0) {
        const offersData = data.offers[0] || [];
        setOfferData(offersData);
      }
    } catch (error) {
      Swal.fire("Error", "Failed to fetch offers. Please try again.", "error");
    }
  };

  const fetchMIGCoins = async () => {
    try {
      const data = await getRewardsSummary();

      // Compute available, overall, and expiring values based on the summary data
      const available = parseFloat(data.available);
      const overall = parseFloat(data.overall);
      const expiring = parseFloat(data.expiring);

      setMigCoins({
        available: available.toFixed(2),
        overall: overall.toFixed(2),
        expiring: expiring.toFixed(2),
      });
    } catch (error) {
      Swal.fire(
        "Error",
        "Failed to fetch MIG coin data. Please try again.",
        "error"
      );
    }
  };

  const fetchTransactions = async (page) => {
    try {
      const data = await getRewardsTransactions(page);
      setTransactions((prevTransactions) => [
        ...prevTransactions,
        ...data.transactions,
      ]);
      setHasMore(data.has_next);
    } catch (error) {
      Swal.fire(
        "Error",
        "Failed to fetch transactions. Please try again.",
        "error"
      );
    }
  };

  useEffect(() => {
    const user = getUser();
    if (!user.customer_id) {
      navigate("/login");
      return;
    }
    fetchOffers(1);
    fetchMIGCoins();
    fetchTransactions(page);
  }, [page]);

  const handleViewOffer = (offer) => {
    navigate("/view-offer", { state: { offer } });
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleClose = () => {
    setSelectedTransaction(null);
  };

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  return (
    <>

      <div className="rewards">
        <div className="reward-content">
          <Header title="Rewards" />

          <div className="overlap-wrapper">
            <div className="overlap-2">
              <div className="overlap-group-2">
                <div className="text-wrapper-8">Rewards</div>
              </div>
              <Link to="/offers" className="text-wrapper-9">
                Offers
              </Link>
            </div>
          </div>
          <div className="container">

            <div className="info-container">
              <div className="icon-wrapper">
                <div className="icon-overlay">
                  <div className="icon-circle" />
                  <div className="icon-text">i</div>
                </div>
              </div>
              <p className="info-text">
                Find out how much you can save through MIG Cashback Coins
              </p>
            </div>
            <div className="text-wrapper-16">My MIG Cashback Coins</div>

            <div className="frame-11">
              <div className="frame-12">
                <div className="image-wrapper">
                  <img className="image-2" alt="Available" src="/image-20.png" />
                </div>
                <p className="div-2">
                  <span className="span">
                    Available
                    <br />
                  </span>
                  <span className="text-wrapper-13">
                    {migCoins.available} Coins
                  </span>
                </p>
              </div>
              <div className="frame-12">
                <div className="group-10">
                  <img className="image-2" alt="Overall" src="/image-20.png" />
                </div>
                <p className="div-2">
                  <span className="span">
                    Overall
                    <br />
                  </span>
                  <span className="text-wrapper-13">
                    {migCoins.overall} Coins
                  </span>
                </p>
              </div>
              <div className="frame-12">
                <div className="group-11">
                  <img className="image-2" alt="Expiring" src="/image-20.png" />
                </div>
                <p className="expiring">
                  <span className="span">
                    Expiring
                    <br />
                  </span>
                  <span className="text-wrapper-13">
                    {migCoins.expiring} Coins
                  </span>
                </p>
              </div>
            </div>

            <div className="frame">
              <div className="frame-wrapper">
                <div className="div">
                  <img
                    className="rectangle"
                    alt="Offer"
                    src={
                      "https://d1dh0rr5xj2p49.cloudfront.net/banner/" +
                      offerData.image
                    }
                  />
                  <div className="div">
                    <div className="frame-2">
                      <p className="text-wrapper">{offerData.title}</p>
                      <p
                        className="p"
                        dangerouslySetInnerHTML={{
                          __html: offerData.description.split("</p>")[0] + "</p>",
                        }}
                      ></p>
                    </div>

                    <div
                      className="div-wrapper"
                      onClick={() => handleViewOffer(offerData)}
                    >
                      <div className="frame-3">
                        <div className="text-wrapper-2">{offerData.linkText}</div>
                        <img className="vector" alt="Vector" src="/vector-3.svg" fetchpriority="high" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="recent-transaction">
              {transactions.length != 0 && (
                <div className="text-wrapper-16">
                  Recent MIG Cashback Coin Transactions
                </div>
              )}
              <div className="transaction-list">
                {transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="transaction-item"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <div
                      className={`transaction-icon transaction-icon-${transaction.iconType}`}
                    ></div>
                    <div className="transaction-info">
                      <div className="transaction-description">
                        {transaction.description}
                      </div>
                      <div className="transaction-date-time">
                        <div className="transaction-date">{transaction.date}</div>
                        <div className="transaction-time">{transaction.time}</div>
                      </div>
                    </div>
                    <div className="transaction-reward">
                      {transaction.reward} Coins
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button className="view-more-button" onClick={handleLoadMore}>
                    View More
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="margin-72"></div>

        </div>

        {selectedTransaction && (
          <RewardsViewMIG
            transaction={selectedTransaction}
            onClose={handleClose}
          />
        )}

        <Navigation />
      </div>
    </>
  );
};
