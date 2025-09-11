"use client";

import { useState } from "react";
import "./Homepage.css";
import ProgressBar from "./ProgressBar";

const Homepage = ({ selectedBrand, setSelectedBrand, nextStep }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const brands = [
    { name: "Apple", logo: "🍎" },
    { name: "Samsung", logo: "📱" },
    { name: "Huawei", logo: "📲" },
    { name: "Oppo", logo: "📱" },
    { name: "Nokia", logo: "📞" },
    { name: "HTC", logo: "📱" },
    { name: "LG", logo: "📱" },
    { name: "Microsoft", logo: "🪟" },
    { name: "Motorola", logo: "📱" },
    { name: "OnePlus", logo: "📱" },
  ];

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Auto-detect brand from search term
      const detectedBrand = brands.find((brand) =>
        searchTerm.toLowerCase().includes(brand.name.toLowerCase())
      );
      if (detectedBrand) {
        setSelectedBrand(detectedBrand.name);
      }
      nextStep();
    }
  };

  const handleContinue = () => {
    if (selectedBrand) {
      nextStep();
    }
  };

  return (
    <div className="homepage">
      <ProgressBar currentStep={1} />

      <header className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Save my Phone</h1>
            <p className="hero-subtitle">Professional Phone Repair Services</p>
            <p className="hero-description">
              Fast, reliable, and affordable phone repairs with genuine parts
              and expert technicians.
            </p>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <div className="selection-card">
            <div className="back-arrow">
              <span className="arrow">←</span>
            </div>

            <h2 className="selection-title">
              Which <span className="highlight">model</span> do you have?
            </h2>

            <div className="search-section">
              <p className="search-label">
                Type in your <strong>brand, model</strong> or{" "}
                <strong>model code</strong>.
              </p>

              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="iPhone 12 Pro Max"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="search-btn" onClick={handleSearch}>
                  🔍
                </button>
              </div>
            </div>

            <div className="brand-section">
              <p className="brand-label">
                Or select your <strong>brand</strong>
              </p>

              <div className="brand-grid">
                {brands.map((brand) => (
                  <div
                    key={brand.name}
                    className={`brand-card ${
                      selectedBrand === brand.name ? "selected" : ""
                    }`}
                    onClick={() => handleBrandSelect(brand.name)}
                  >
                    <div className="brand-logo">{brand.logo}</div>
                    <span className="brand-name">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedBrand && (
              <div className="continue-section">
                <button className="btn btn-primary" onClick={handleContinue}>
                  Continue with {selectedBrand}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>About Save my Phone</h3>
              <p>
                We are professional phone repair specialists with over 10 years
                of experience. We use only genuine parts and provide warranty on
                all repairs.
              </p>
            </div>

            <div className="footer-section">
              <h3>Our Location</h3>
              <p>
                123 Repair Street
                <br />
                Amsterdam, 1012 AB
                <br />
                Netherlands
                <br />
                <strong>Phone:</strong> +31 20 123 4567
                <br />
                <strong>Email:</strong> info@savemyphone.nl
              </p>
            </div>

            <div className="footer-section">
              <h3>Opening Hours</h3>
              <p>
                Monday - Friday: 9:00 - 18:00
                <br />
                Saturday: 10:00 - 16:00
                <br />
                Sunday: Closed
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Save my Phone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
