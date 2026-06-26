import React, { useState, useEffect } from "react";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";

import "./style.css";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";

import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import {
  addReminder,
  checkReminderAtGivenTime,
  deleteReminder,
  getAllReminders,
  getUser,
  markAsTaken,
  searchProducts,
} from "../../api/Api";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const AddMedicineButton = ({ selectedProducts, setSelectedProducts }) => {
  const [isOpen, setIsOpen] = useState(false); // Modal visibility state
  const [searchText, setSearchText] = useState(""); // Search input text
  const [products, setProducts] = useState([]); // List of products returned from API
  const [showSelected, setShowSelected] = useState(false); // Toggle selected products display

  // Toggle modal visibility
  const handleClick = () => {
    setIsOpen(!isOpen);
    setSearchText("");
    setProducts([]);
  };

  // Fetch products from API
  const handleSearch = async (text) => {
    setSearchText(text);
    if (text.length >= 3) {
      try {
        const response = await searchProducts(searchText, 1);
        setProducts(response.results || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    } else {
      setProducts([]);
    }
  };

  // Handle product selection/deselection
  const toggleSelection = (product) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.some((p) => p.product_name === product.product_name)
        ? prevSelected.filter((p) => p.product_name !== product.product_name)
        : [...prevSelected, product]
    );
  };

  return (
    <div className="reminder-page">

      <img
        onClick={handleClick}
        src="/add-rem.png"
        alt="add-rem"
        className="add-rem-icon"
      />

      {/* Modal for adding medicine */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="add-modal-content">
            <div className="top-section">
              {/* Search box */}
              <input
                type="text"
                className="rem-search-box"
                placeholder="Search for products..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />

              {/* Product results */}
              <div className="product-results">
                {products.map((product) => (
                  <div
                    key={product.product_name}
                    className={`product-item ${
                      selectedProducts.some(
                        (p) => p.product_name === product.product_name
                      )
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => toggleSelection(product)}
                  >
                    <img
                      src={
                        "https://d1dh0rr5xj2p49.cloudfront.net/products/" +
                        product.first_image_url
                      }
                      alt={product.product_name}
                    />
                    <span>{product.product_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom section */}
            <div className="bottom-section">
              {/* Flex layout for title and toggle */}
              <div className="header-section">
                <h3>{selectedProducts.length} Products Selected</h3>
                <button
                  className="toggle-btn"
                  onClick={() => setShowSelected(!showSelected)}
                >
                  <img
                    className={`arrow-icon ${showSelected ? "collapsed" : ""}`}
                    alt="Arrow"
                    src="/down-arrow.svg" fetchpriority="high"
                  />
                </button>
              </div>

              {/* Grid layout for selected items, conditionally rendered */}
              {showSelected && (
                <div className="selected-grid">
                  {selectedProducts.map((product) => (
                    <div key={product.product_name} className="chip">
                      <span>{product.product_name}</span>
                      <button
                        className="remove-btn"
                        onClick={() =>
                          setSelectedProducts((prev) =>
                            prev.filter(
                              (p) => p.product_name !== product.product_name
                            )
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Done button */}
              <button className="done-btn" onClick={handleClick}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimePickerButton = ({ selectedTime, setSelectedTime }) => {
  const [isOpen, setIsOpen] = useState(false); // Control visibility of the time picker

  const handleClick = () => {
    setIsOpen(!isOpen); // Toggle the time picker visibility
  };

  const handleAccept = (newTime) => {
    setSelectedTime(newTime); // Update the selected time
    setIsOpen(false); // Close the modal after "OK" button is pressed
  };

  // Format the selected time to 12-hour format (HH:mm A)
  const formattedTime = dayjs(selectedTime);
  const hour = formattedTime.format("hh"); // 12-hour format
  const minute = formattedTime.format("mm");
  const ampm = formattedTime.format("A");

  return (
    <div>
      {/* Updated button to trigger time picker with 12-hour format */}
      <div className="digit-rem-wrapper" onClick={handleClick}>
        <div className="digit-rem">{hour}</div>
        <span>:</span>
        <div className="digit-rem">{minute}</div>
        <div className="digit-rem-ampm">
          <div className={`digit-rem-am ${ampm === "AM" ? "selected" : ""}`}>
            AM
          </div>
          <div className={`digit-rem-pm ${ampm === "PM" ? "selected" : ""}`}>
            PM
          </div>
        </div>
      </div>

      {/* Modal-like overlay when time picker is open */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* TimePicker component in a modal */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <StaticTimePicker
                defaultValue={selectedTime}
                onChange={(newTime) => {
                  console.log("selected time", newTime);

                  // Get the selected time as it is without converting it to UTC
                  const localTime = new Date(newTime);

                  // Update the selected time with the new time in local timezone
                  setSelectedTime(localTime.toISOString());
                }}
                onClose={() => setIsOpen(false)} // Close the modal when clicking outside
                onAccept={handleAccept}
                sx={{
                  "& .MuiTypography-root": {
                    fontFamily: "Outfit",
                  },
                  "& .MuiPickersLayout-root": {
                    fontFamily: "Outfit",
                  },
                  "& .MuiIconButton-root": {
                    display: "none", // Hide all the icon buttons (including arrows)
                  },
                  "& .MuiPickersToolbar-content": {
                    justifyContent: "space-around", // Center the "OK" button
                  },
                  "& .MuiTimePickerToolbar-ampmSelection": {
                    margin: "unset",
                  },
                  "& .MuiClockPointer-root": {
                    backgroundColor: "#65558F",
                  },
                  "& .MuiClockPointer-thumb": {
                    border: "16px solid #65558F",
                  },
                  "& .MuiClock-clock ": {
                    backgroundColor: "#E6E0E9",
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </div>
      )}
    </div>
  );
};

const ReminderCard = ({ reminder, fetchReminders, rindex }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle modal visibility
  const handleClick = () => setIsOpen(!isOpen);

  // Helper function to format dates
  const formatDate = (date) => date.toISOString().split("T")[0];

  // Generate a list of dates between start_date and end_date
  const generateDateRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const stopDate = new Date(endDate);

    while (currentDate <= stopDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // Calculate the last 7 days from today
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - i);
    return date;
  }).reverse(); // Reverse to show in chronological order

  // Generate the full date range for the modal
  const dateRange = generateDateRange(reminder.start_date, reminder.end_date);

  return (
    <div className="rem-progress-container">
      {/* Reminder Card */}
      <div className="rem-card" onClick={handleClick}>
        <div className="rem-card-progress">
          <div className="rem-card-progress-head">
            <div className="rem-card-progress-head-text">
              Reminder {rindex + 1}
            </div>
            <span>Last 7 days</span>
          </div>
          <div className="rem-card-progress-dates">
            {last7Days.map((date) => {
              const dateString = formatDate(date);
              const isTaken = reminder.taken_history.some(
                (history) => history.split(" ")[0] === dateString
              );

              return (
                <div className="rem-card-progress-date" key={dateString}>
                  <div className="rem-card-progress-date-icon">
                    <img
                      src={isTaken ? "/taken.png" : "/norem.png"}
                      alt={isTaken ? "Taken" : "Not Taken"}
                    />
                  </div>
                  <div className="rem-card-progress-date-text">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Reminder Details - {rindex + 1}</h2>
              <button onClick={handleClick}>Close</button>
            </div>
            <div className="modal-body">
              {dateRange.map((date) => {
                const dateString = formatDate(date);
                const historyEntry = reminder.taken_history.find(
                  (history) => history.split(" ")[0] === dateString
                );
                const isTaken = !!historyEntry;

                return (
                  <div
                    className="modal-row"
                    key={dateString}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: isTaken ? "green" : "red",
                    }}
                  >
                    <span>{dateString}</span>
                    <span>
                      {isTaken ? historyEntry.split(" ")[1] : "Not Taken"}
                    </span>
                    <span>
                      <img
                        src={isTaken ? "/taken.png" : "/norem.png"}
                        alt={isTaken ? "Taken" : "Not Taken"}
                        style={{ height: "20px" }}
                      />
                    </span>
                  </div>
                );
              })}
              {/* Delete button */}
              <button
                className="done-btn"
                onClick={async () => {
                  const response = await deleteReminder(reminder.id);
                  if (response) {
                    setIsOpen(false);
                    fetchReminders();
                  }
                }}
              >
                Delete reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationReminder = () => {
  const [isOpen, setIsOpen] = useState(false); // Control visibility of the modal
  const [reminderData, setReminderData] = useState([]); // Store reminders (active and missed)
  const [customerName, setCustomerName] = useState(""); // Store the customer name
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0); // Track the current reminder being displayed
  const [isReminderCompleted, setIsReminderCompleted] = useState(false); // Flag to indicate reminder completion

  useEffect(() => {
    // Get current datetime and check for reminders on component load
    const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
    checkReminderAtGivenTimeHandler(currentTime);
  }, []);

  const checkReminderAtGivenTimeHandler = async (givenTime) => {
    try {
      const data = await checkReminderAtGivenTime(givenTime); // Assuming customer_id is 1
      setReminderData([...data.active_reminders, ...data.missed_reminders]);
      setCustomerName(data.active_reminders[0]?.customer_name || ""); // Set customer name from the API response
      setIsOpen(true); // Open the modal if reminders exist
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while fetching reminders.",
      });
    }
  };

  const markAsTakenHandler = async (reminderId) => {
    try {
      await markAsTaken(reminderId);
      setIsReminderCompleted(true);
      setTimeout(() => {
        nextReminder(); // Show next reminder after 2 seconds
      }, 2000);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while marking the reminder as taken.",
      });
    }
  };

  const nextReminder = () => {
    if (currentReminderIndex + 1 < reminderData.length) {
      setCurrentReminderIndex(currentReminderIndex + 1); // Move to the next reminder
      setIsReminderCompleted(false); // Reset completion state for next reminder
    } else {
      setIsOpen(false); // Close modal if no more reminders
    }
  };
  const getReminderText = (reminder) => {
    if (reminder && reminder.reminder_time) {
      const reminderType =
        reminder.reminder_time > new Date().toISOString() ? "active" : "missed";

      const reminderText =
        reminderType === "active"
          ? `Hi ${customerName}, gentle reminder to take your medicine (Reminder ID: ${reminder.id}). Taking it now helps keep you on your path to wellness!`
          : `Hi ${customerName}, you missed your reminder for the day (Reminder ID: ${reminder.id}). Please try to stay on track for your wellness!`;

      const icon =
        reminderType === "active"
          ? "notification_pending.png"
          : "notification_missed.png";

      return (
        <div className="rem-noti">
          <img
            src={`/${icon}`}
            alt={`${reminderType} notification`}
            className="rem-noti-icon"
          />
          <div className="rem-noti-text">{reminderText}</div>
        </div>
      );
    }
    return "";
  };

  return (
    <div>
      {/* Modal-like overlay when date picker is open */}
      {isOpen && reminderData.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content not-modal">
            {isReminderCompleted ? (
              <div className="rem-noti">
                <img
                  src="/notification_success.png"
                  alt="Success notification"
                  className="rem-noti-icon"
                />
                <p>
                  Well done, {customerName}! Staying on track with your wellness
                  is a big win!
                </p>
              </div>
            ) : (
              <>
                {getReminderText(reminderData[currentReminderIndex])}
                <div className="rem-noti-actions">
                  <button
                    className="rem-noti-btn"
                    onClick={() =>
                      markAsTakenHandler(reminderData[currentReminderIndex].id)
                    }
                  >
                    Mark as Taken
                  </button>
                  <button className="rem-noti-btn" onClick={nextReminder}>
                    Ignore
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DatePickerButton = ({ selectedDate, setSelectedDate }) => {
  const [isOpen, setIsOpen] = useState(false); // Control visibility of the date picker

  const handleClick = () => {
    setIsOpen(!isOpen); // Toggle the date picker visibility
  };

  // Format the date values to 2-digit numbers
  const day = selectedDate
    ? String(selectedDate.getDate()).padStart(2, "0")
    : "00";
  const month = selectedDate
    ? String(selectedDate.getMonth() + 1).padStart(2, "0")
    : "00"; // Months are 0-indexed
  const year = selectedDate
    ? String(selectedDate.getFullYear()).slice(-2)
    : "00";

  return (
    <div>
      {/* Button to trigger date picker */}
      <div className="digit-rem-wrapper" onClick={handleClick}>
        <div className="digit-rem">{day}</div>
        <div className="digit-rem">{month}</div>
        <div className="digit-rem">{year}</div>
      </div>

      {/* Modal-like overlay when date picker is open */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* DatePicker component without text box, only calendar */}
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setIsOpen(false);
              }}
              onClickOutside={() => setIsOpen(false)} // Close picker when clicking outside
              inline // Render calendar inline (not in a popup)
              calendarClassName="custom-datepicker" // Custom class for the calendar
            />
          </div>
        </div>
      )}
    </div>
  );
};

const HappyReminder = () => {
  return (
    <div className="modal-overlay">
      <div>
        <img
          src="/happy.png"
          alt="Happy reminder"
          className="animate__animated animate__bounce happy-reminder"
        />
        <div className="happy-text">D O N E !</div>
      </div>
    </div>
  );
};

export const Reminder = () => {
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(dayjs());
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showSelected, setShowSelected] = useState(false); // Toggle selected products display
  const [isOpen, setIsOpen] = useState(false); // Modal visibility state
  const [selectedWindow, setSelectedWindow] = useState("progress");
  const [reminders, setReminders] = useState([]);

  const navigate = useNavigate();

  const handleClick = async () => {
    if (selectedProducts.length === 0) {
      Swal.fire({
        title: "No products selected",
        text: "Please select at least one product to set a reminder.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!selectedStartDate || !selectedEndDate) {
      Swal.fire({
        title: "Invalid date",
        text: "Please select a valid start and end date.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!selectedTime) {
      Swal.fire({
        title: "Invalid time",
        text: "Please select a valid time.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    console.log(selectedStartDate, selectedEndDate, selectedTime);
    if (selectedStartDate > selectedEndDate) {
      Swal.fire({
        title: "Invalid date range",
        text: "End date must be after the start date.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const response = await addReminder({
      start_date: selectedStartDate,
      end_date: selectedEndDate,
      time: selectedTime,
      products: selectedProducts.map((product) => product.product_id),
    });

    if (response) {
      setIsOpen(true);
      // set timeout for 2 seconds and then close the modal
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    }

    fetchReminders();
    setSelectedWindow("progress");
  };

  const fetchReminders = async () => {
    const response = await getAllReminders();
    setReminders(response || []);
  };

  useEffect(() => {
    // Check if user is logged in
    const user = getUser();

    if (!user.isLoggedIn) {
      navigate("/login"); // Redirect to login pagetr
      return;
    } else {
      fetchReminders();
    }
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(display-mode: standalone)").matches) {
      //   Swal.fire({
      //     title: "Install Medingen",
      //     text: "Reminder functionality is not available in browser. Install Medingen to use this feature.",
      //     icon: "info",
      //     confirmButtonText: "Install",
      //     showCancelButton: true,
      //     cancelButtonText: "Go Back",
      //   }).then((result) => {
      //     if (result.isConfirmed) {
      //       window.location.href = "/";
      //     }else{
      //         window.location.href = "/";
      //         }
      //   });
    }
  }, [window.innerWidth]);

  return (
    <>
      
      <Header title={"Reminder"} />
      <div className="reminder-page">
        {isOpen && <HappyReminder />}
        <div className="rem-card-container">
          {/* set active based on selectedWindow and also add css class active */}
          <div
            className={`rem-card ${
              selectedWindow === "set_reminder" ? "active" : ""
            }`}
            onClick={() => setSelectedWindow("set_reminder")}
          >
            Set Reminder
          </div>

          <div
            className={`rem-card ${
              selectedWindow === "progress" ? "active" : ""
            }`}
            onClick={() => {
              fetchReminders();
              setSelectedWindow("progress");
            }}
          >
            Progress
          </div>

          {selectedWindow === "set_reminder" && (
            <>
              <div className="rem-card">
                <div className="card-actions-wrapper">
                  <div className="text-wrapper-876">Add Medications</div>
                  <div>
                    <AddMedicineButton
                      selectedProducts={selectedProducts}
                      setSelectedProducts={setSelectedProducts}
                    />
                  </div>
                </div>
              </div>

              <div className="rem-card">
                <div className="card-actions-wrapper">
                  <div className="text-wrapper-876">Time</div>

                  <TimePickerButton
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                  />
                </div>
              </div>

              <div className="rem-card">
                <div className="card-actions-wrapper">
                  <div className="text-wrapper-876">Start from</div>
                  <div className="digit-rem-wrapper">
                    <DatePickerButton
                      selectedDate={selectedStartDate}
                      setSelectedDate={setSelectedStartDate}
                    />
                  </div>
                </div>
              </div>

              <div className="rem-card">
                <div className="card-actions-wrapper">
                  <div className="text-wrapper-876">Until</div>
                  <div className="digit-rem-wrapper">
                    <DatePickerButton
                      selectedDate={selectedEndDate}
                      setSelectedDate={setSelectedEndDate}
                    />
                  </div>
                </div>
              </div>

              <div className="rem-card rem-card-selected">
                <div className="card-actions-wrapper">
                  <div className="products-bottom-section">
                    <div className="header-section">
                      <h3>{selectedProducts.length} Products Selected</h3>
                      <button
                        className="toggle-btn"
                        onClick={() => setShowSelected(!showSelected)}
                      >
                        <img
                          className={`arrow-icon ${
                            showSelected ? "collapsed" : ""
                          }`}
                          alt="Arrow"
                          src="/down-arrow.svg" fetchpriority="high"
                        />
                      </button>
                    </div>

                    {/* Grid layout for selected items, conditionally rendered */}
                    {showSelected && (
                      <div className="selected-grid">
                        {selectedProducts.map((product) => (
                          <div key={product.product_name} className="chip">
                            <span>{product.product_name}</span>
                            <button
                              className="remove-btn"
                              onClick={() =>
                                setSelectedProducts((prev) =>
                                  prev.filter(
                                    (p) =>
                                      p.product_name !== product.product_name
                                  )
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Done button */}
              <button className="done-btn" onClick={handleClick}>
                Activate
              </button>
            </>
          )}

          {selectedWindow === "progress" && (
            <>
              {reminders.length === 0 && (
                <div className="rem-card">
                  <div className="card-actions-wrapper">
                    <div className="text-wrapper-876 align-center">
                      No reminders to show
                    </div>
                  </div>
                </div>
              )}
              {reminders.map((reminder, index) => (
                <ReminderCard
                  reminder={reminder}
                  fetchReminders={fetchReminders}
                  rindex={index}
                />
              ))}
            </>
          )}

          <NotificationReminder />
        </div>
        <div className="margin-72"></div>
        <div className="landing-page">
          </div>
      </div>
      <Navigation />
    </>
  );
};
