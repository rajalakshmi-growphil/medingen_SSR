import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./style.css";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { getFooterProducts, getMainCategories } from "../../api/Api";

import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";
import { Helmet } from "react-helmet";

import { ReactGoogleReviews } from "react-google-reviews";
import "react-google-reviews/dist/index.css";
import Testimonials from "./Testimonials";

export const LandingPage = ({ showInstall }) => {
  const [activeSection, setActiveSection] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);


  const playStoreLink =
    "https://play.google.com/store/apps/details?id=in.medingen.twa";
  const appStoreLink = "https://apps.apple.com/in/app/medingen/id1580223477";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        drawerOpen &&
        !document.querySelector(".mobile-menu-icon").contains(event.target)
      ) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [drawerOpen]);

  useEffect(() => {
    const container = document.querySelector('.landing-page');
    if (!container) return;

    const imgs = Array.from(container.querySelectorAll('img'))
      .filter((img) =>
        !img.closest('header, footer') &&
        !img.hasAttribute('fetchpriority') &&
        !img.classList.contains('no-lazy') &&
        !img.classList.contains('iphone-svg') &&
        !img.classList.contains('why-icon') &&
        !img.classList.contains('bullet-icon') &&
        !img.classList.contains('team-icon') &&
        !img.classList.contains('trust-icon') &&
        !img.classList.contains('founder-photo') &&
        !img.classList.contains('store-badge')
      );

    if (!imgs.length) return;

    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

    imgs.forEach((img) => {
      if (img.dataset.lazyProcessed) return;
      img.dataset.src = img.getAttribute('src') || '';
      img.setAttribute('src', placeholder);
      img.classList.add('lazy-img', 'loading');
      img.dataset.lazyProcessed = 'true';
    });

    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const realSrc = img.dataset.src;
              if (realSrc) {
                img.onload = () => {
                  img.classList.remove('loading');
                  img.classList.add('loaded');
                  img.removeAttribute('data-src');
                };
                img.onerror = () => {
                  img.classList.remove('loading');
                  img.classList.add('error');
                };
                img.setAttribute('src', realSrc);
                img.setAttribute('loading', 'lazy');
                observer.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '200px',
          threshold: 0.01,
        }
      );

      imgs.forEach((img) => observer.observe(img));
    } else {
      imgs.forEach((img) => {
        const realSrc = img.dataset.src;
        if (realSrc) {
          img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            img.removeAttribute('data-src');
          };
          img.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('error');
          };
          img.setAttribute('src', realSrc);
          img.setAttribute('loading', 'lazy');
        }
      });
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1);
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
          setActiveSection(sectionId);
        }
      }, 300);
    }
  }, []);

  const handleScrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
      setDrawerOpen(false);
    }
  };

  const location = useLocation();

  const handleGetTheApp = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      window.location.href = playStoreLink;
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      window.location.href = appStoreLink;
    } else {
      showInstall();
    }
  };

  const handlePlayStore = () => {
    window.location.href = playStoreLink;
  };

  const handleAppStore = () => {
    Swal.fire({
      title: "Coming Soon",
      text: "Our iOS App is launching soon. Stay tuned for updates!",
      icon: "info",
      confirmButtonText: "Close",
    });
  };

  return (
    <div className="landing-page">
      <Header title="About Medingen" variant="landing" />

      {/* Navigation Drawer for mobile */}
      <div className={`nav-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-logo">
          <img src="/migfulllogo.png" alt="Drawer Logo" />
        </div>
        <ul>
          <li
            className={activeSection === "home" ? "active" : ""}
            onClick={() => handleScrollToSection("home")}
          >
            Home
          </li>
          <li
            className={activeSection === "features" ? "active" : ""}
            onClick={() => handleScrollToSection("features")}
          >
            Features
          </li>
          <li
            className={activeSection === "how-it-works" ? "active" : ""}
            onClick={() => handleScrollToSection("how-it-works")}
          >
            How it works
          </li>
        </ul>
        <div className="get-app-drawer-button" onClick={handleGetTheApp}>
          Get the App
        </div>
      </div>

      <div className="head-margin"></div>

      {/* Body Sections */}
      <section id="home" className="section">
        <Home
          showInstall={showInstall}
          handleAppStore={handleAppStore}
          handlePlayStore={handlePlayStore}
        />
      </section>

      <section id="who-we-are" className="section">
        <WhoWeAre />
      </section>

      <section id="our-story" className="section">
        <OurStory />
      </section>

      <section id="features" className="section">
        <Features />
      </section>
      <section id="how-it-works" className="section">
        <HowItWorks />
      </section>
      <br />
      <section id="TrustSignals" className="section">
        <TrustSignals />
      </section>

      <section id="testimonials" className="section">
        <Testimonials />
      </section>

      <section id="get-started" className="section">
        <GetStarted
          handleAppStore={handleAppStore}
          handlePlayStore={handlePlayStore}
        />
      </section>

      <section id="faq" className="section">
        <FAQ />
      </section>

      <Footer handleScrollToSection={handleScrollToSection} />
    </div>
  );
};

export const Home = ({ showInstall, handleAppStore, handlePlayStore }) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate("/searchbox", { state: { voiceSearch: searchText } });
    }
  };

  return (
    <section className="home-hero">
      <div className="home-hero-content">
        <h1 className="hero-title">
          The Best Online Platform to Buy Affordable Medicines in India – <span className="brand">Medingen</span>
        </h1>

        <h3 className="hero-subtitle">
          Buy Medicines Online with Confidence – Save Up to 80%
        </h3>

        <div className="hero-description">
          India's most transparent and tech-enabled platform for prescription
          medicines. Get affordable, high-quality alternatives delivered to
          your doorstep.
        </div>

        <div className="home-hero-visual mobile-only">
          <img
            src="/landingscreenshot1.png"
            alt="Medingen App Screens"
            className="hero-phone"
          />
        </div>

        <h4 className="hero-download-title">
          Download the Medingen App & Shop Smarter
        </h4>

        <div className="hero-actions">
          <img
            src="/app-store-badge.png"
            alt="Download on App Store"
            onClick={handleAppStore}
            className="store-badge"
          />
          <img
            src="/google-play-badge.png"
            alt="Get it on Google Play"
            onClick={handlePlayStore}
            className="store-badge"
          />
          <Link to="/upload-prescription" className="upload-btn">
            Upload Prescription
          </Link>
        </div>
      </div>

      <div className="home-hero-visual desktop-only">
        <img
          src="/landingscreenshot1.png"
          alt="Medingen App Screens"
          className="hero-phone"
        />
      </div>
    </section>
  );
};

export const WhoWeAre = () => {
  return (
    <div className="who-we-are">
      <div className="who-we-are-container">
        <div className="who-we-are-visual">
          <img
            src="/who_we_are_illustration_1766484653978.png"
            alt="Who We Are Illustration"
          />
        </div>
        <div className="who-we-are-content">
          <h2 className="who-we-are-title">Who We Are</h2>
          <div className="who-we-are-description">
            Medingen is a tech-enabled healthcare platform committed to making
            quality medicines affordable and accessible for all. Unlike
            traditional sellers, we provide a curated range of certified generic
            and branded medicines that are sourced only from licensed suppliers
            and verified for safety, efficacy and regulatory compliance. Our
            platform empowers users to compare prices, explore salt-based
            alternatives and make well-informed, cost-effective choices—often
            saving up to 80% on medical expenses. With features like monthly
            medicine refills and automated health reminders for chronic
            conditions like diabetes, Medingen ensures continuous care without
            the hassle. From one-time prescriptions to long-term health needs, we
            combine convenience, trust and transparency to help you manage your
            health better, every day.
          </div>
        </div>
      </div>
    </div>
  );
};

export const OurStory = () => {
  return (
    <div className="our-story">
      <img src="/medingen-watermark.png" className="our-story-watermark" alt="watermark" />
      <div className="story-points">
        <h2 className="our-story-large-title">Our Story</h2>
        <div className="story-point card point-1">
          <div className="point-visual">
            <img
              src="/problem_solving_illustration_1_1766484681259.png"
              alt="The Problem Illustration"
            />
          </div>
          <div className="point-content">
            <h3>1.The Problem We're Solving</h3>
            <div>
              Healthcare in India is often expensive, confusing and inaccessible
              for many. Millions struggle to afford life saving medications,
              especially when only branded versions are available. We saw this
              as more than a challenge - we saw it as an opportunity for impact.
            </div>
            <div>
              That's when Medingen was born a platform dedicated to making
              affordable, high-quality generic medicines available to everyone, no
              matter where they live or what they earn.
            </div>
            <div className="highlight">
              <strong>Our idea was simple:</strong><br />
              Enable <strong>smarter, safer medicine</strong> access through technology,
              transparency and <strong>verified alternatives.</strong>
            </div>
          </div>
        </div>

        <div className="story-point card point-2">
          <div className="point-visual">
            <img
              src="/solution_illustration_2_1766484705019.png"
              alt="Our Solution Illustration"
            />
          </div>
          <div className="point-content">
            <h3>2. Our Solution</h3>
            <p>
              Medingen is a transparent, patient-first online medicine platform,
              not a traditional pharmacy. We empower users through:
            </p>
            <ul className="solution-list">
              <li>
                <img src="/bullet-point.png" alt="•" className="bullet-icon" /> Secure prescription
                uploads
              </li>
              <li>
                <img src="/bullet-point.png" alt="•" className="bullet-icon" /> Price comparison
                between branded and generic alternatives
              </li>
              <li>
                <img src="/bullet-point.png" alt="•" className="bullet-icon" /> Verified suppliers and
                licensed partners only
              </li>
              <li>
                <img src="/bullet-point.png" alt="•" className="bullet-icon" /> Doorstep delivery
                across 25,000+ pincodes
              </li>
              <li>
                <img src="/bullet-point.png" alt="•" className="bullet-icon" /> Monthly refill
                subscriptions and personalized reminders
              </li>
              <li>
                <img src="/bullet-point.png" alt="•" className="bullet-icon" /> Customer support
                headed by pharmacy experts
              </li>
            </ul>
            <p>
              Everything we do is designed to reduce costs, simplify access and
              ensure safe, informed choices.
            </p>
          </div>
        </div>

        <div className="story-point card point-3">
          <div className="point-visual">
            <img
              src="/problem_solving_illustration_1_1766484681259.png"
              alt="Future Illustration"
            />
          </div>
          <div className="point-content">
            <h3>3. From Launch to Today</h3>
            <p>
              From day one, we focused on solving real-world problems - not just
              listing medicines online.
            </p>
            <ul className="impact-list">
              <li>
                We launched with a robust price comparison engine to help users
                see affordable alternatives to costly branded drugs.
              </li>
              <li>
                Recognizing the needs of chronic patients, we built in automated
                monthly refills and refill reminders - a core feature now
                helping thousands stay consistent with treatment.
              </li>
              <li>
                Over time, we expanded our network of licensed partner
                pharmacies, enabling faster deliveries and wider reach.
              </li>
              <li>
                With growing trust from our customers, we're now scaling into
                new areas like diagnostic test bookings, teleconsultations and
                holistic health solutions like Ayurveda and Siddha.
              </li>
            </ul>
            <p>
              Today Medingen stands as a symbol of healthcare that's tech-driven,
              transparent and truly affordable - and we're just getting started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Features = () => {
  return (
    <>
      <div className="why-medingen">
        <h2 className="section-title-1">Why Medingen?</h2>
        <div className="section-subtitle">
          Why More People are Switching to Medingen for Their Medicine Needs
        </div>

        {/* Desktop View */}
        <div className="why-grid desktop-only">
          <div className="why-card">
            <h3 className="why-card-title">Up to<span className="highlight-purple"> 80%</span> <br /> Savings</h3>
            <div className="why-icon-wrapper">
              <img src="/pig.png" alt="Savings" className="why-icon" />
            </div>
            <p className="why-card-text">
              We provide high-quality, verified substitutes that cost significantly less than branded medicines
            </p>
          </div>

          <div className="why-card">
            <h3 className="why-card-title">Trusted by <br /> <span className="highlight-purple">1000+</span></h3>
            <div className="why-icon-wrapper">
              <img src="/multiuser.png" alt="Trust" className="why-icon" />
            </div>
            <p className="why-card-text">
              Doctors and patients across India trust Medingen for transparent pricing and consistent delivery
            </p>
          </div>

          <div className="why-card">
            <h3 className="why-card-title">Tech-Powered <br /> <span className="highlight-purple">Transparency</span></h3>
            <div className="why-icon-wrapper">
              <img src="/compare.png" alt="Transparency" className="why-icon" />
            </div>
            <p className="why-card-text">
              Instantly compare prices, check salt composition, and explore affordable options
            </p>
          </div>

          <div className="why-card">
            <h3 className="why-card-title">Pan-India <br /> <span className="highlight-purple">Delivery</span></h3>
            <div className="why-icon-wrapper">
              <img src="/pan-india.png" alt="Delivery" className="why-icon" />
            </div>
            <p className="why-card-text">
              We deliver across 25,000+ pincodes - ensuring your medicine reaches you, wherever you are.
            </p>
          </div>

          <div className="why-card">
            <h3 className="why-card-title">Monthly Refill <br /> <span className="highlight-purple">Reminders</span></h3>
            <div className="why-icon-wrapper">
              <img src="/refill-reminder.png" alt="Refills" className="why-icon" />
            </div>
            <p className="why-card-text">
              Never run out of medicine again. Subscribe for automated refills and health reminders
            </p>
          </div>

          <div className="why-card">
            <h3 className="why-card-title"><span className="highlight-purple">Licensed &</span> <br /> Regulated</h3>
            <div className="why-icon-wrapper">
              <img src="/vector-white.png" alt="Regulated" className="why-icon" />
            </div>
            <p className="why-card-text">
              All medicines are sourced from licensed suppliers and certified manufacturers, ensuring safety and authenticity
            </p>
          </div>
        </div>

        {/* Mobile View */}
        <div className="why-grid mobile-only">
          <div className="why-card">
            <div className="why-icon-wrapper">
              <img src="/Salt-Based1.svg" alt="Medicine Finder" className="why-icon" />
            </div>
            <h3 className="why-card-title">Salt-Based Medicine Finder</h3>
          </div>

          <div className="why-card">
            <div className="why-icon-wrapper">
              <img src="/Comparison.svg" alt="Price Comparison" className="why-icon" />
            </div>
            <h3 className="why-card-title">Real Price Comparison</h3>
          </div>

          <div className="why-card">
            <div className="why-icon-wrapper">
              <img src="/Cost-Saving.svg" alt="Cost Saving" className="why-icon" />
            </div>
            <h3 className="why-card-title">Up to 80% Cost Saving</h3>
          </div>

          <div className="why-card">
            <div className="why-icon-wrapper">
              <img src="/Free-Delivery.svg" alt="Free Delivery" className="why-icon" />
            </div>
            <h3 className="why-card-title">Free Delivery Over ₹499</h3>
          </div>

          <div className="why-card">
            <div className="why-icon-wrapper">
              <img src="/Prescription.svg" alt="Prescription" className="why-icon" />
            </div>
            <h3 className="why-card-title">Prescription Upload Support</h3>
          </div>

          <div className="why-card">
            <div className="why-icon-wrapper">
              <img src="/Alternatives.svg" alt="Alternatives" className="why-icon" />
            </div>
            <h3 className="why-card-title">Generic Alternatives Shown</h3>
          </div>
        </div>
      </div>

      <div className="meet-the-team">
        <div className="team-container">
          <div className="team-image">
            <img src="/ASHASH.svg" alt="Founder ASHASH" className="founder-photo desktop-only" />
            <img src="/ashash-mobile.svg" alt="Founder ASHASH" className="founder-photo mobile-only" />
          </div>
          <div className="team-content">
            <h2 className="team-title">Meet the Team Behind Medingen</h2>
            <h3 className="founder-name">Founder <span className="highlight-purple">ASHASH</span></h3>
            <p className="team-intro">
              At the heart of Medingen is a passionate, diverse team focused on changing how India experiences healthcare
            </p>

            <div className="team-grid">
              <div className="team-item">
                <img src="/TechInnovators.png" alt="Tech" className="team-icon" />
                <p className="team-text">
                  <span className="team-highlight">Tech Innovators</span> building scalable, secure platforms that support millions of searches and orders
                </p>
              </div>

              <div className="team-item">
                <img src="/PharmacyExperts.png" alt="Pharmacy" className="team-icon" />
                <p className="team-text">
                  <span className="team-highlight">Pharmacy Experts</span> ensuring every order meets safety standards and regulatory compliance
                </p>
              </div>

              <div className="team-item">
                <img src="/CustomerSupportChampions.png" alt="Support" className="team-icon" />
                <p className="team-text">
                  <span className="team-highlight">Customer Support Champions</span> who guide patients every step of the way
                </p>
              </div>

              <div className="team-item">
                <img src="/DataScientists.png" alt="Data" className="team-icon" />
                <p className="team-text">
                  <span className="team-highlight">Data Scientists & Product Strategists</span> driving smarter care journeys using real-world data
                </p>
              </div>
            </div>

            <p className="team-mission">
              We're a team that believes in people-first innovation - where every click, order and reminder brings us closer to a healthier India.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export const HowItWorks = () => {
  return (
    <div className="how-it-works">
      <div className="how-it-works-title">How It Works - Simple Ordering Process</div>

      {/* Desktop View */}
      <img src="/howitworks1.svg" fetchpriority="high" alt="How it Works" className="desktop-only" />

      {/* Mobile View */}
      <div className="how-it-works-mobile-list mobile-only">
        <div className="hiw-step">
          <div className="hiw-icon-wrapper">
            <img src="/trolley.svg" alt="Shop" />
          </div>
          <div className="hiw-content">
            <h4>Shop Medicines</h4>
            <div>Browse by brand, category, or health condition</div>
          </div>
        </div>

        <div className="hiw-step">
          <div className="hiw-icon-wrapper">
            <img src="/inflation.svg" alt="Compare" />
          </div>
          <div className="hiw-content">
            <h4>Compare Prices</h4>
            <div>Find affordable generic alternatives to branded drugs</div>
          </div>
        </div>

        <div className="hiw-step">
          <div className="hiw-icon-wrapper">
            <img src="/outgoing.svg" alt="Upload" />
          </div>
          <div className="hiw-content">
            <h4>Upload Prescription</h4>
            <div>Complete your order securely</div>
          </div>
        </div>

        <div className="hiw-step">
          <div className="hiw-icon-wrapper">
            <img src="/addtocart.svg" alt="Cart" />
          </div>
          <div className="hiw-content">
            <h4>Add to Cart</h4>
            <div>Choose quantity and check availability</div>
          </div>
        </div>

        <div className="hiw-step highlight-card">
          <div className="hiw-icon-wrapper">
            <img src="/delivery.svg" alt="Delivery" />
          </div>
          <div className="hiw-content">
            <h4>Checkout & Get Delivery</h4>
            <div>Sit back while we deliver to your doorstep</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrustSignals = () => {
  return (
    <div className="trust-signals">
      <h2 className="trust-title">Credentials & Trust Signals</h2>
      <div className="trust-row">
        <div className="trust-item">
          <img src="/Licensed.svg" alt="Licensed" className="trust-icon" />
          <span>Licensed under applicable Indian drug regulations</span>
        </div>
        <div className="trust-item">
          <img src="/Satisfied.svg" alt="Satisfied" className="trust-icon" />
          <span>10,000+ satisfied customers across India</span>
        </div>
        <div className="trust-item">
          <img src="/Secure.svg" alt="Secure" className="trust-icon" />
          <span>Secure prescription upload & encrypted patient data</span>
        </div>
        <div className="trust-item">
          <img src="/Partnerships.svg" alt="Partnerships" className="trust-icon" />
          <span>Partnerships with certified, licensed pharmacies</span>
        </div>
        <div className="trust-item">
          <img src="/WHO-GMP.svg" alt="WHO-GMP" className="trust-icon" />
          <span>Compliant with WHO-GMP quality guidelines</span>
        </div>
      </div>
    </div>
  );
};

export const GetStarted = ({ handleAppStore, handlePlayStore }) => {
  return (
    <div className="get-started-section">
      <div className="get-started-banner">
        <div className="get-started-content">
          <h2 className="get-started-title">
            Get Started with <br /> Medingen Today
          </h2>

          <p className="get-started-subtext">
            Join thousands of users saving big on their monthly medicine bills.
          </p>

          <p className="get-started-subtext">
            Download the Medingen App or Upload Your Prescription Now!
          </p>

          <span className="get-started-highlight">
            Medingen - Your trusted partner for generic medicines.
          </span>

          <div className="get-started-buttons">
            <img
              src="/app-store-badge.png"
              alt="Download on App Store"
              className="get-started-btn"
              onClick={handleAppStore}
            />
            <img
              src="/google-play-badge.png"
              alt="Get it on Google Play"
              className="get-started-btn"
              onClick={handlePlayStore}
            />
          </div>
        </div>

        <div className="get-started-phones desktop-only" aria-hidden="true">
          <img
            src="/iphone-16.svg"
            alt="iPhone 16 App Preview"
            className="iphone-svg no-lazy"
            fetchpriority="high"
          />
        </div>
      </div>
    </div>
  );
};

export const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = [
    {
      question: "Are the medicines from Medingen genuine and safe?",
      answer: "Yes. Medingen sources only from licensed suppliers and certified partner pharmacies. All medicines comply with Indian drug regulations and WHO-GMP quality standards."
    },
    {
      question: "What is Medingen and how does it work?",
      answer: "Medingen is a tech-enabled healthcare platform that helps you buy affordable, high-quality medicines online. You can upload your prescription, compare prices between branded and generic medicines, explore salt-based alternatives and get doorstep delivery anywhere in India."
    },
    {
      question: "Can Medingen help with monthly medicine refills?",
      answer: "Absolutely. Medingen offers monthly refill subscriptions and automated health reminders, ensuring you never run out of essential medicines."
    },
    {
      question: "How is Medingen different from other online pharmacies?",
      answer: "Unlike traditional pharmacies, Medingen focuses on transparency, price comparison, and salt-based alternatives. We empower patients to make informed choices and save money without compromising quality."
    },
    {
      question: "Can I find both branded and generic medicines on Medingen?",
      answer: "Absolutely. Medingen lists both branded and generic medicines so you can compare prices and choose the best option for your needs."
    },
    {
      question: "How can I track my order on Medingen?",
      answer: "You can easily track your order through your Medingen account dashboard or via the tracking link sent to your registered email and phone."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-section">
      <h2 className="faq-title">FAQ's</h2>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div className="faq-item" key={index}>
            <div className="faq-question" onClick={() => toggleFAQ(index)}>
              <h3 className={activeIndex === index ? "active" : ""}>
                {faq.question}
              </h3>
              <span className="faq-icon">
                {activeIndex === index ? "−" : "+"}
              </span>
            </div>
            {activeIndex === index && (
              <div className="faq-answer">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const HelpCenter = () => {
  return (
    <>
      <div className="help-center">
        <div className="help-center-content">
          <h1>Customer Support at Medingen</h1>
          <p>
            At Medingen, we prioritize your satisfaction and convenience when it comes
            to purchasing generic medicines online. We offer multiple ways for you to
            reach out to our dedicated customer support team.
          </p>

          <h2>How to Contact Us:</h2>
          <p>
            <strong>Email Support:</strong> For any inquiries, concerns, or assistance
            with your order, contact us via email at <a href="mailto:support@medingen.in">support@medingen.in</a>.
            Our customer care team is available to respond promptly.
          </p><br />
          <p>
            <strong>Phone Support:</strong> <br />
            <a href="tel:+917090123709">
              <img className="help-contact-icon" src="/call.png" alt="Call Icon" />
              <strong> &nbsp; 70901 23709</strong>
            </a>
          </p><br />

          <p>
            <strong>WhatsApp Support:</strong> <br />
            <a href="https://wa.me/917090123709">
              <img className="help-contact-icon" src="/ph-whatsapp-logo-thin.png" alt="WhatsApp Icon" />
              <strong> &nbsp; 70901 23709</strong>
            </a>
          </p>

          <h2>Common Issues We Help With</h2>
          <ul>
            <li>Placing Orders</li>
            <li>Tracking Orders</li>
            <li>Payment Issues</li>
            <li>Product Information</li>
            <li>Technical Support</li>
          </ul>

          <h2>Support Availability:</h2>
          <p>
            Our customer care team is available from <strong>9:00 AM to 6:00 PM</strong>, every day of the week.
          </p>
        </div>
        <div className="margin-72" />
        <Navigation />
        <div className="landing-page">
          </div>
      </div>
    </>
  );
};

export const Footer = ({ handleScrollToSection }) => {
  if (handleScrollToSection === undefined) {
    handleScrollToSection = (section) => {
      window.location.href = "/about#" + section;
    };
  }

  const nameToSlug = (name) => {
    return name
      ? name
          .toLowerCase()
          .replace(/&/g, "and") // Replace & with 'and'
          .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphen
          .replace(/-+/g, "-") // Collapse multiple hyphens
          .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
      : "";
  };

  const navigate = useNavigate();

  const handleLinkClick = (linkType, value) => {
    if (linkType === "internal") {
      navigate(value);
    } else if (linkType === "external") {
      window.open(value, "_blank", "noopener,noreferrer");
    } else if (linkType === "scroll") {
      if (window.location.pathname === "/about") {
        handleScrollToSection(value);
      } else {
        window.location.href = `/about#${value}`;
      }
    } else if (linkType === "tel") {
      window.location.href = `tel:${value}`;
    } else if (linkType === "mailto") {
      window.location.href = `mailto:${value}`;
    }
  };

  const knowUsLinks = [
    { label: "About Medingen", type: "internal", value: "/about" },
    { label: "How to buy Medicines", type: "scroll", value: "how-it-works" },
    { label: "Terms & Condition", type: "internal", value: "/policies-terms-and-conditions" },
    { label: "Privacy Policy", type: "internal", value: "/policies-privacy-policy" },
    { label: "Contact Us", type: "internal", value: "/help-center" },
  ];

  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getMainCategories();

        const mapCategories = (list) =>
          list.map((cat) => {
            const categoryName = cat.name || cat.category_name || cat.title || "";
            return {
              label: categoryName,
              type: "internal",
              value: `/categories/${nameToSlug(categoryName)}`,
            };
          }).filter(cat => cat.label !== "");

        if (Array.isArray(data)) {
          setTopCategories(mapCategories(data));
        } else if (data && data.categories && Array.isArray(data.categories)) {
          setTopCategories(mapCategories(data.categories));
        } else if (data && data.main_categories && Array.isArray(data.main_categories)) {
          setTopCategories(mapCategories(data.main_categories));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback categories if API fails
        setTopCategories([
          { label: "Ayurvedic & Herbal", type: "internal", value: "/categories/ayurvedic-and-herbal" },
          { label: "Chronic Care", type: "internal", value: "/categories/chronic-care" },
          { label: "Gastro Care", type: "internal", value: "/categories/gastro-care" },
          { label: "Health Conditions", type: "internal", value: "/categories/health-conditions" },
          { label: "Health Supplements", type: "internal", value: "/categories/health-supplements" },
          { label: "Infection Care", type: "internal", value: "/categories/infection-care" },
          { label: "Mental Health", type: "internal", value: "/categories/mental-health" },
          { label: "Over The Counter (OTC)", type: "internal", value: "/categories/over-the-counter-otc" },
          { label: "Pain & Inflammation Care", type: "internal", value: "/categories/pain-and-inflammation-care" },
          { label: "Personal Care", type: "internal", value: "/categories/personal-care" },
          { label: "Specialty Medicines", type: "internal", value: "/categories/specialty-medicines" },
          { label: "Vitamins & Supplements", type: "internal", value: "/categories/vitamins-and-supplements" },
        ]);
      }
    };
    fetchCategories();
  }, []);

  const [topSellingMedicines, setTopSellingMedicines] = useState([
    { label: "Pantosec 40mg", type: "internal", value: "/product/pantosec-40mg" },
    { label: "Azicip 500mg", type: "internal", value: "/product/azicip-500mg" },
    { label: "Azicip 250mg", type: "internal", value: "/product/azicip-250mg" },
    { label: "Olox 200mg", type: "internal", value: "/product/olox-200mg" },
    { label: "Pantosec DSR 30/40mg", type: "internal", value: "/product/pantosec-dsr-30-40mg" },
    { label: "Alergin L 5mg", type: "internal", value: "/product/alergin-l-5mg" },
    { label: "Amoxyclav 500/125mg", type: "internal", value: "/product/amoxyclav-500-125mg" },
    { label: "Rabesec DSR 30/20mg", type: "internal", value: "/product/rabesec-dsr-30-20mg" },
    { label: "Montecip LC 5/10mg", type: "internal", value: "/product/montecip-lc-5-10mg" },
    { label: "Itracip 200mg", type: "internal", value: "/product/itracip-200mg" },
    { label: "Rabesec 20mg", type: "internal", value: "/product/rabesec-20mg" },
    { label: "Movexx SP 100/325/15mg", type: "internal", value: "/product/movexx-sp-100-325-15mg" },
    { label: "L Quin 500mg", type: "internal", value: "/product/l-quin-500mg" },
    { label: "Podocip 200mg", type: "internal", value: "/product/podocip-200mg" },
    { label: "Cefix 200mg", type: "internal", value: "/product/cefix-200mg" },
    { label: "Cof Q D 5/2/10mg", type: "internal", value: "/product/cof-q-d-5-2-10mg" },
    { label: "C One 1000mg Injection", type: "internal", value: "/product/c-one-1000mg-injection" },
  ]);

  const [topHealthcareDevices, setTopHealthcareDevices] = useState([
    { label: "Dr Morepen BP 14 Blood...", type: "internal", value: "/product/dr-morepen-bp-14-blood-pressure-monitor" },
    { label: "Omron Hem 7121 J BP...", type: "internal", value: "/product/omron-hem-7121-j-bp-monitor" },
    { label: "Omron Compressor Ne...", type: "internal", value: "/product/omron-compressor-nebulizer" },
    { label: "Revalizer Device", type: "internal", value: "/product/revalizer-device" },
    { label: "Accu Chek Active Blood...", type: "internal", value: "/product/accu-chek-active-blood-glucose-meter" },
    { label: "Transpacer VM Device", type: "internal", value: "/product/transpacer-vm-device" },
    { label: "Romsons SS 3062 Infusion", type: "internal", value: "/product/romsons-ss-3062-infusion" },
  ]);

  const [topHealthProducts, setTopHealthProducts] = useState([
    { label: "Paracip 500mg", type: "internal", value: "/product/paracip-500mg" },
    { label: "Fericip XT 100/1.5mg", type: "internal", value: "/product/fericip-xt-100-1-5mg" },
    { label: "Cipcal XT Tablet", type: "internal", value: "/product/cipcal-xt-tablet" },
    { label: "CMSooth Eye Drop 0.5%", type: "internal", value: "/product/cmsooth-eye-drop-0-5" },
    { label: "Ketocip 2% Soap", type: "internal", value: "/product/ketocip-2-soap" },
    { label: "Calciquick D3 2k Capsule", type: "internal", value: "/product/calciquick-d3-2k-capsule" },
    { label: "Pralyte ORS Powder", type: "internal", value: "/product/pralyte-ors-powder" },
    { label: "Vitamin D3 400IU Drop", type: "internal", value: "/product/vitamin-d3-400iu-drop" },
  ]);

  useEffect(() => {
    const fetchFooterProductsData = async () => {
      try {
        const data = await getFooterProducts();
        if (data.topSellingMedicines && data.topSellingMedicines.length > 0) {
          setTopSellingMedicines(data.topSellingMedicines);
        }
        if (data.topHealthcareDevices && data.topHealthcareDevices.length > 0) {
          setTopHealthcareDevices(data.topHealthcareDevices);
        }
        if (data.topHealthProducts && data.topHealthProducts.length > 0) {
          setTopHealthProducts(data.topHealthProducts);
        }
      } catch (error) {
        console.error("Failed to fetch footer products:", error);
      }
    };
    fetchFooterProductsData();
  }, []);

  const socialLinks = {
    instagram: "https://www.instagram.com/medin.gen/?hl=en",
    facebook: "https://www.facebook.com/people/Medingen/61567679517972/",
    youtube: "https://www.youtube.com/@ashash_mig",
    linkedin: "https://www.linkedin.com/company/medingen2024/posts/?feedView=all",
    twitter: "https://twitter.com/medingen",
  };

  return (
    <footer className="footer-new">
      <div className="footer-container">
        <div className="footer-header">
          <div className="footer-logo-section">
            <img src="/migfulllogo.png" alt="Medingen Logo" className="footer-logo-img" />
            <div className="footer-logo-text">Save your health and wealth</div>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <h3 className="footer-heading">Know Us</h3>
            <ul className="footer-list">
              {knowUsLinks.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>

            <h3 className="footer-heading mt-4">Health Resources</h3>
            <ul className="footer-list">
              <li onClick={() => handleLinkClick("internal", "/blogs")}>All Blogs</li>
              {/* ── CHANGED: "All Categories" now uses slug URL ── */}
              <li onClick={() => handleLinkClick("internal", "/categories")}>All Categories</li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Top Categories</h3>
            <ul className="footer-list">
              {topCategories.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Top Selling Medicines</h3>
            <ul className="footer-list">
              {topSellingMedicines.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Top Healthcare Devices</h3>
            <ul className="footer-list">
              {topHealthcareDevices.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>

            <h3 className="footer-heading mt-4">Top Health Products</h3>
            <ul className="footer-list">
              {topHealthProducts.map((link, index) => (
                <li key={index} onClick={() => handleLinkClick(link.type, link.value)}>{link.label}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom-section">
          <div className="footer-bottom-col">
            <h3 className="footer-heading">Contact Us</h3>
            <p className="footer-text">Our customer support team is available 7 days a week from 10:00 am - 7:00 pm.</p><br />
            <p className="footer-text email" onClick={() => handleLinkClick("mailto", "support@medingen.in")}>support@medingen.in</p><br />
            <p className="footer-text phone" onClick={() => handleLinkClick("tel", "+917090123709")}>709 0123 709</p>
          </div>

          <div className="footer-bottom-col">
            <h3 className="footer-heading">Grievance Officer</h3>
            <p className="footer-text">Name: Kapilesh</p><br />
            <p className="footer-text email" onClick={() => handleLinkClick("mailto", "grievancemig@gmail.com")}>Email: grievancemig@gmail.com</p>
          </div>

          <div className="footer-bottom-col">
            <h3 className="footer-heading">Registered Office Address</h3>
            <p className="footer-text">No.16, Ground Floor, School Street, Mangadu, Chennai 600 122.</p>
          </div>

          <div className="footer-bottom-col social-col">
            <h3 className="footer-heading">Medingen</h3>
            <h4 className="footer-subheading">Follow Us On</h4>
            <div className="social-icons">
              <img src="/FB.svg" alt="Facebook" onClick={() => handleLinkClick("external", socialLinks.facebook)} />
              <img src="/YT.svg" alt="YouTube" onClick={() => handleLinkClick("external", socialLinks.youtube)} />
              <img src="/IG.svg" alt="Instagram" onClick={() => handleLinkClick("external", socialLinks.instagram)} />
              <img src="/twt.svg" alt="Twitter / X" onClick={() => handleLinkClick("external", socialLinks.twitter)} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};