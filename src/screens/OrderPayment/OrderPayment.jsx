import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Dashboard/Header";
import {
  applyCouponAPI,
  check_payment,
  create_order,
  loadCoupons,
  updateCartPayment,
} from "../../api/Api";
import Swal from "sweetalert2";
import { Helmet } from "react-helmet";

export const OrderPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponSaved, setCouponSaved] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [unavailableCoupons, setUnavailableCoupons] = useState([]);
  const inputRef = useRef(null);

  if (!location.state) {
    navigate("/cart");
  }
  const { total_amount, mig_coins, cart_id } = location.state;
  const [totalAmount, setTotalAmount] = useState(total_amount - mig_coins);
  const [useMigCoins, setUseMigCoins] = useState(true);

  const toggleMigCoins = () => {
    if (useMigCoins) {
      // disable mig coins
      setTotalAmount(total_amount);
    } else {
      setTotalAmount(total_amount - mig_coins);
    }
    setUseMigCoins(!useMigCoins);
  };

  const applyCoupon = async (couponCode) => {
    try {
      const response = await applyCouponAPI(couponCode, cart_id);
      const coupon_savings = response.coupon_savings;
      setAppliedCoupon(couponCode);
      inputRef.current.value = couponCode;
      setCouponSaved(coupon_savings);
      if (useMigCoins) {
        setTotalAmount(total_amount - mig_coins - coupon_savings);
      } else {
        setTotalAmount(total_amount - coupon_savings);
      }
    } catch (error) {
      console.error("Failed to apply coupon:", error);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponSaved(0);
    if (useMigCoins) {
      setTotalAmount(total_amount - mig_coins);
    }
  };

  const loadRazorpay = (order_id, amount_due) => {
    console.log(order_id, amount_due);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key: "rzp_live_gD2p7TIiAYtioQ", // Replace with your Razorpay Key ID
        amount: amount_due,
        currency: "INR",
        name: "Medingen",
        description: "Medingen Order ID: " + cart_id,
        image: "https://medingen.in/migfulllogo.png",
        order_id: order_id,
        handler: async (response) => {
          // Handle the payment response
          const razorpay_order_id = response.razorpay_order_id;
          const razorpay_payment_id = response.razorpay_payment_id;
          const resp = await check_payment(
            cart_id,
            razorpay_order_id,
            razorpay_payment_id
          );
          if (resp) {
            await updateCartPayment(cart_id, 'online', 'payment');
            Swal.fire({
              title: "Payment Successful!",
              text: "Your payment is complete! Recipt will be sent to your email (if exists).",
              icon: "success",
              confirmButtonText: "Continue",
            }).then(() => {
              navigate("/cart/pharmacist-verification/payment/place-order", {
                state: {
                  total_amount: totalAmount,
                  cart_id,
                  coupon_savings: couponSaved,
                },
              });
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: "Failed to check for payment completion",
              icon: "error",
              confirmButtonText: "Okay",
            }).then(() => {
              navigate("/cart");
            });
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3399cc",
        },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    };
    document.body.appendChild(script);
  };

  const completePayment = async () => {};

  const handlePay = async () => {
    Swal.showLoading();
    const response = await create_order(cart_id, totalAmount, couponSaved);
    if (!response) {
      Swal.fire({
        title: "Error!",
        text: "Failed to create order. Please try again.",
        icon: "error",
        confirmButtonText: "Okay",
      }).then(() => {
        navigate("/cart");
      });
    } else {
      Swal.close();

      const order_id = response.data.id;
      const amount_due = response.data.amount_due;
      await loadRazorpay(order_id, amount_due);
    }
  };

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await loadCoupons(cart_id);
        setAvailableCoupons(
          data.available_coupons.map((coupon) => ({
            code: coupon.coupon_code,
            description: `${coupon.coupon_text} (Min order: ₹${coupon.minimum_order_value})`,
            available: true,
          }))
        );
        setUnavailableCoupons(
          data.unavailable_coupons.map((coupon) => ({
            code: coupon.coupon_code,
            description: `${coupon.coupon_text} (Min order: ₹${coupon.minimum_order_value})`,
            available: false,
          }))
        );
      } catch (error) {
        console.error("Failed to load coupons:", error);
      }
    };

    fetchCoupons();
  }, [cart_id]);

  return (
    <>
    
      <div className="order-payment">
      <Header title="Payment" />

        <section className="order-confirmation">
          <p className="confirmation-message">Your Order is Confirmed!</p>
          <br />
          <div className="order-amount">
            ₹ {totalAmount < 0 ? 0 : totalAmount.toFixed(2)}
          </div>
        </section>

        <section className="coupon-section">
          <CouponOption
            appliedCoupon={appliedCoupon}
            couponSaved={couponSaved}
            totalAmount={totalAmount}
            total_amount={total_amount}
            useMigCoins={useMigCoins}
            mig_coins={mig_coins}
            toggleMigCoins={toggleMigCoins}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
            inputRef={inputRef}
          />
        </section>

        <section className="available-coupons">
          <h3>Available Coupons</h3>
          {availableCoupons.map((coupon) => (
            <AvailableCoupon
              key={coupon.code}
              couponCode={coupon.code}
              description={coupon.description}
              applyCoupon={() => applyCoupon(coupon.code)}
            />
          ))}
        </section>

        {/* <section className="available-coupons">
          <h3>Unavailable Coupons</h3>
          {unavailableCoupons.map(coupon => (
            <UnavailableCoupon
              key={coupon.code}
              couponCode={coupon.code}
              description={coupon.description}
            />
          ))}
        </section> */}

        <div className="margin-bottom"></div>

        <footer className="payment-action">
          {totalAmount > 0 && (
            <div className="payment-button" onClick={handlePay}>
              <p>
                <span>Continue to Pay ₹ </span>
                <span className="amount">{totalAmount.toFixed(2)}</span>
              </p>
              <img className="arrow-icon" alt="Proceed" src="/vector-3.svg" />
            </div>
          )}

          {totalAmount <= 0 && (
            <div className="payment-button" onClick={completePayment}>
              <p>
                <span>Complete Payment </span>
              </p>
              <img className="arrow-icon" alt="Proceed" src="/vector-3.svg" />
            </div>
          )}
        </footer>
        <div className="margin-72"></div>
      </div>
    </>
  );
};

const AvailableCoupon = ({ couponCode, description, applyCoupon }) => (
  <div className="available-coupon">
    <div className="coupon-details">
      <div className="coupon-code">{couponCode}</div>
      <div className="coupon-description">{description}</div>
    </div>
    <div className="apply-button" onClick={applyCoupon}>
      <p className="apply-text">Apply</p>
    </div>
  </div>
);

const UnavailableCoupon = ({ couponCode, description }) => (
  <div className="available-coupon">
    <div className="coupon-details">
      <div className="coupon-code">{couponCode}</div>
      <div className="coupon-description">{description}</div>
    </div>
  </div>
);

const CouponOption = ({
  appliedCoupon,
  couponSaved,
  useMigCoins,
  toggleMigCoins,
  mig_coins,
  applyCoupon,
  removeCoupon,
  inputRef,
  totalAmount,
  total_amount
}) => (
  <div className="coupon-option">
    <div className="coupon-content">
      <div className="coupon-input-section">
        <div className="coupon-input-box">
          <div className="coupon-input">
            <input
              className="textbox"
              type="text"
              ref={inputRef}
              placeholder="Enter Coupon Code"
              disabled={!!appliedCoupon}
            />
          </div>

          {!appliedCoupon && (
            <div
              className="apply-button"
              onClick={() => {
                applyCoupon(inputRef.current.value);
              }}
            >
              <p className="apply-text">Apply</p>
            </div>
          )}

          {appliedCoupon && (
            <div className="apply-button" onClick={removeCoupon}>
              <p className="apply-text">Remove</p>
            </div>
          )}
        </div>

        {appliedCoupon && (
          <div className="coupon-applied">
            <p>
              Coupon <span className="applied-code">{appliedCoupon}</span>{" "}
              applied. You saved{" "}
              <span className="saved-amount">₹{couponSaved}</span>!
            </p>
          </div>
        )}
      </div>
    </div>

    <div className="coupon-mig-box">
      <input
        type="checkbox"
        className="checkbox"
        checked={useMigCoins}
        onChange={toggleMigCoins}
      />
      <div className="coupon-text">
        <p>Pay with MIG Coins for the payment of ₹{total_amount - couponSaved}</p>
        <div className="balance">BALANCE : ₹{mig_coins}</div>
      </div>
    </div>
  </div>
);
