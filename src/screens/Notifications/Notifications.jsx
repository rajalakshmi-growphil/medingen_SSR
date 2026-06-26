import React, { useState, useEffect } from "react";
import "./style.css";
import Swal from "sweetalert2";
import Navigation from "../Dashboard/Navigation";
import Header from "../Dashboard/Header";
import {
  getNotifications,
  getUser,
  markNotificationAsRead,
} from "../../api/Api"; // Import the API functions
import { useNavigate } from "react-router-dom";

import { Helmet } from "react-helmet";

const formatDate = (date) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  return new Date(date).toLocaleDateString(undefined, options);
};

const isRecent = (date) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  return notificationDate > oneWeekAgo;
};

const formatRelativeTime = (date) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now - notificationDate) / 1000);

  if (diffInSeconds < 60) return `${Math.floor(diffInSeconds)}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

const defaultImageSrc = "migfulllogo.png";

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();

    if (!user.isLoggedIn) {
      navigate("/login"); // Redirect to login page
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        Swal.showLoading(); // Show the loading spinner
        const data = await getNotifications(page);
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          ...data.notifications,
        ]);
        setTotalPages(data.total_pages);
        Swal.close(); // Close the loading spinner
        setLoading(false);
      } catch (error) {
        Swal.close(); // Close the loading spinner in case of an error
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load notifications.",
        });
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [page]);

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read_status: true,
    }));
    setNotifications(updatedNotifications);
  };

  const handleNotificationClick = async (notification) => {
    const { id, sender, message, description, date_received } = notification;

    try {
      await markNotificationAsRead(id);
      Swal.fire({
        html: `
          <div class="notification-detail">
            <h2>Notification</h2>
            <p>
              ${message
            ? message.split('\n').map((line, index) => {
              // Regex to find URLs
              const urlRegex = /(https?:\/\/[^\s]+)/g;

              // Replace URLs with <a> tags
              const lineWithLinks = line.replace(urlRegex, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
              });

              // Return the line with links, preserving newlines
              return `${lineWithLinks}${index < message.split('\n').length - 1 ? '<br />' : ''}`;
            }).join('')
            : 'No message'
          }
            </p>
            <p>Date: ${new Date(date_received).toLocaleString()}</p>
          </div>
        `,
        confirmButtonText: "Close",
        width: "95%",
        customClass: {
          popup: "my-popup",
        },
      });


      // Update the local state to mark as read
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id
          ? { ...notification, read_status: true }
          : notification
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to mark notification as read.",
      });
    }
  };

  const handleViewMore = () => {
    if (page < totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const section = isRecent(notification.date_received)
      ? "Recent"
      : "Earlier Notifications";
    (acc[section] = acc[section] || []).push(notification);
    return acc;
  }, {});

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
      <div className="notifications">
        <Header />

        <div className="content">
          {Object.entries(groupedNotifications).map(
            ([section, notifications]) => (
              <div className="section" key={section}>
                <div className="section-header">
                  <div className="label">{section}</div>
                  {section === "Recent" && (
                    <>
                      &nbsp;&nbsp;
                      <div
                        className="text-wrapper"
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all as read
                      </div>
                    </>
                  )}
                </div>

                {notifications.map((notification) => (
                  <div
                    className="notification"
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <img
                      className="image"
                      alt="Notification"
                      src={notification.imageSrc || defaultImageSrc}
                    />
                    <div className="notification-content">
                      <p className="not-title">
                        {notification.message
                          ? notification.message.length > 100
                            ? notification.message.slice(0, 100).split("\n").map((line, index) => (
                              <span key={index}>
                                {line}
                                {index < notification.message.slice(0, 100).split("\n").length - 1 && <br />}
                              </span>
                            ))
                            : notification.message.split("\n").map((line, index) => (
                              <span key={index}>
                                {line}
                                {index < notification.message.split("\n").length - 1 && <br />}
                              </span>
                            ))
                          : "No Title"}
                        {notification.message && notification.message.length > 100 && "..."}
                      </p>

                      <div className="time-wrapper">
                        <div className="time">
                          {formatRelativeTime(notification.date_received)}
                        </div>
                      </div>
                    </div>

                    {!notification.read_status ? (
                      <img src="/redtick.svg" fetchpriority="high" alt="UnRead" className="red-tick" />
                    ) : (
                      <img src="/greentick.svg" fetchpriority="high" alt="Read" className="green-tick" />
                    )}

                  </div>
                ))}
              </div>
            )
          )}
          <div className="view-more-container">
            {page < totalPages ? (
              <button className="view-more" onClick={handleViewMore}>
                View More
              </button>
            ) : (
              <p>No more notifications</p>
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
