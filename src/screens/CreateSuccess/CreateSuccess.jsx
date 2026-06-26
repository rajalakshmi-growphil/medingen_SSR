import React, { useState } from "react";
import Swal from "sweetalert2";
import "./style.css";

export const Createsuccess = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const handleLanguageSelection = async () => {
    const { value: language } = await Swal.fire({
      title: 'Select a language',
      input: 'select',
      inputOptions: {
        English: 'English',
        Tamil: 'Tamil',
        Hindi: 'Hindi',
      },
      inputPlaceholder: 'Select a language',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to select a language!';
        }
      }
    });

    if (language) {
      setSelectedLanguage(language);
    }
  };

  const handlePlayButtonClick = () => {
    // Set the video URL based on the selected language
    const videoUrls = {
      English: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual URLs
      Tamil: "https://www.youtube.com/embed/tgbNymZ7vqY", // Replace with actual URLs
      Hindi: "https://www.youtube.com/embed/3JZ_D3ELw8Q", // Replace with actual URLs
    };

    setVideoUrl(videoUrls[selectedLanguage]);
    setShowVideo(true);
  };

  return (
  <>
  
    <div className="createsuccess">
           {/* Play Button */}
      {!showVideo && (
        <div className="play-button-container" onClick={handlePlayButtonClick}>
                <div className="overlap-group">
        <div className="group">

          <img className="polygon" alt="Polygon" src="/polygon-1.svg" fetchpriority="high" />
          </div>
          </div>
          </div>
      )}

            {/* Video Player */}
            {showVideo && (
              <div className="overlap-group">
        <div className="video-player">
          <iframe
            width="100%"
            height="200px"
            src={videoUrl + "?controls=0&modestbranding=1&rel=0&autoplay=1"}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        </div>
      )}

        
      <div className="frame" id="audio" onClick={handleLanguageSelection}>
        <div className="div-wrapper">
          <div className="text-wrapper">Audio</div>
        </div>
        <div className="div">
          <div className="text-wrapper-2">{selectedLanguage}</div>
          <img className="ooui-next-ltr" alt="Ooui next ltr" src="/ooui-next-ltr.svg" fetchpriority="high" />
        </div>
      </div>
      <div className="frame-wrapper">
        <div className="frame-2">
          <div className="text-wrapper-3">View Dashboard</div>
          <img className="img" alt="Frame" src="/frame-3016860.svg" fetchpriority="high" />
        </div>
      </div>

     

    </div>
  </>
  );
};
