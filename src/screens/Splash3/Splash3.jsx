import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import { getUser } from "../../api/Api";
import { useSwipeable } from "react-swipeable";
import { use } from "react";
import { Helmet } from "react-helmet";

const splashData = [
  {
    id: 1,
    title: "Compare medicines",
    description:
      "Compare medicines with Medingen and see the real cost savings!",
    imageSrc: "splash1.svg",
    showSkip: true,
  },
  {
    id: 2,
    title: "MIG Coins",
    description:
      "Earn Mig Coins Cashback on every order and save on future carts!",
    imageSrc: "splash2.svg",
    showSkip: true,
  },
  {
    id: 3,
    title: "Refill medicines",
    description:
      "Enable refill reminders to restock medicines easily with one click!",
    imageSrc: "splash3.svg",
    showSkip: false,
  },
];

export const Splash3 = ({avoidRedirect = false, embedded = false}) => {
  const navigate = useNavigate();
  const [zoomeffect, setZoomeffect] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = getUser();

    if (user.isLoggedIn && !avoidRedirect) {
      navigate("/");
      return;
    }
  }, [navigate]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState("slide-in-right"); // State for animation class
  const handleNext = () => {
    setAnimationClass("slide-out-left"); // Set animation class for sliding out

    setTimeout(() => {
      if (currentIndex < splashData.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        navigate("/");
      }
      setAnimationClass("slide-in-right"); // Set animation class for sliding in
    }, 500); // Duration should match the CSS transition
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const nextIndex = (currentIndex + 1) % 3;
      setCurrentIndex(nextIndex);
    },
    onSwipedRight: () => {
      const prevIndex = (currentIndex - 1 + 3) % 3;
      setCurrentIndex(prevIndex);
    },
  });

  const handleSkip = () => {
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!window.matchMedia("(display-mode: standalone)").matches) {
      const interval = setTimeout(() => {
        console.log("incrementing", currentIndex);
        if (currentIndex < splashData.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setCurrentIndex(0);
        }
      }, 3000);
    }
  }, [currentIndex]);

  const currentSplash = splashData[currentIndex];
  console.log("currentSplash", embedded);

  // hide image-container after 1 second
  useEffect(() => {
    setTimeout(() => {
      setZoomeffect(false);
    }, 1000
    );
  }, []);

  return (
    
    <>
     
    {((!embedded) && zoomeffect)  ? (
    <div className="image-container">
        <img src="android-chrome-512x512.png" alt="Zoom and Fade" class="zoom-fade"/>
    </div>
    ) : ""}

    {((!zoomeffect) || embedded )? (

    <div className={`splash-container`} {...swipeHandlers}>
      {!embedded && (
        <div className="skip-container" onClick={handleSkip}>
          {currentSplash.showSkip && (
            <>
              <div className="skip-text">Skip</div>
              <img
                className="next-icon"
                alt="Next Icon"
                src="/ooui-next-ltr.svg"
                fetchPriority="high"
              />
            </>
          )}
        </div>
      )}

      <img
        className={`splash-image  ${animationClass}`}
        alt={currentSplash.title}
        src={currentSplash.imageSrc}
        fetchPriority="high"
      />

      <div className="text-container">
        <div className="title-text">{currentSplash.title}</div>
        <p className="description-text">{currentSplash.description}</p>
      </div>
      {!embedded ? (
        <div className="next-button-wrapper" onClick={handleNext}>
          <div className="next-button">
            <div className="next-text">
              {currentIndex === splashData.length - 1 ? "Get Started" : "Next"}
            </div>
            <img
              className="next-arrow"
              alt="Next Arrow"
              src="/frame-3016860.svg"
              fetchPriority="high"
            />
          </div>
        </div>
      ): ""}
      {embedded ? (
        <div className="pagination">
          <div
            className={`page-indicator  ${currentIndex == 0 ? "active" : ""} `}
            onClick={() => {
              setCurrentIndex(0);
            }}
          ></div>
          <div
            className={`page-indicator  ${currentIndex == 1 ? "active" : ""} `}
            onClick={() => {
              setCurrentIndex(1);
            }}
          ></div>
          <div
            className={`page-indicator  ${currentIndex == 2 ? "active" : ""} `}
            onClick={() => {
              setCurrentIndex(2);
            }}
          ></div>
        </div>
      ): ""}
    </div>
    ) : ""}
    </>
  );
};

export default Splash3;
