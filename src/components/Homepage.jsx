"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Homepage.css";
import ProgressBar from "./ProgressBar";

const Homepage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/brands")
      .then((res) => res.json())
      .then((data) => {
        setBrands(data);
        console.log("Fetched brands:", data);
      })
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  const handleBrandSelect = (brand) => {
    // brand is the full object
    setSelectedBrand(brand.name);
    setSelectedBrandId(brand._id);
    localStorage.setItem("selectedBrand", brand.name);
    localStorage.setItem("selectedBrandId", brand._id);
    if (brand.logo) localStorage.setItem("selectedBrandLogo", brand.logo);
    navigate("/model");
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Auto-detect brand from search term
      const detectedBrand = brands.find((b) =>
        searchTerm.toLowerCase().includes((b.name || b.merk)?.toLowerCase())
      );
      if (detectedBrand) {
        const name = detectedBrand.name || detectedBrand.merk;
        setSelectedBrand(name);
        setSelectedBrandId(detectedBrand._id);
        localStorage.setItem("selectedBrand", name);
        localStorage.setItem("selectedBrandId", detectedBrand._id);
        if (detectedBrand.logo)
          localStorage.setItem("selectedBrandLogo", detectedBrand.logo);
      }
      navigate("/model");
    }
  };

  const handleContinue = () => {
    if (selectedBrand) {
      localStorage.setItem("selectedBrand", selectedBrand);
      if (selectedBrandId)
        localStorage.setItem("selectedBrandId", selectedBrandId);
      // if brandId missing (e.g., manual selection), try to find by name
      if (!selectedBrandId) {
        const match = brands.find((b) => (b.name || b.merk) === selectedBrand);
        if (match?._id) localStorage.setItem("selectedBrandId", match._id);
        if (match?.logo) localStorage.setItem("selectedBrandLogo", match.logo);
      }
      navigate("/model");
    }
  };

  return (
    <div className="homepage">
      <ProgressBar currentStep={1} />

      <header className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Save my Phone</h1>
            <p className="hero-subtitle">Professionele telefoonreparaties</p>
            <h2>Wil je de status van je reparatie volgen?</h2>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/Status")}
            >
              Volg je reparatie
            </button>
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
              Welk <span className="highlight">model</span> heb je?
            </h2>

            <div className="search-section">
              <p className="search-label">
                Typ je <strong>merk, model</strong> of{" "}
                <strong>modelcode</strong>.
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
                Of selecteer je <strong>merk</strong>
              </p>

              <div className="brand-grid">
                {brands.map((brand) => (
                  <div
                    key={brand._id || brand.name}
                    className={`brand-card ${
                      selectedBrand === brand.name ? "selected" : ""
                    }`}
                    onClick={() => handleBrandSelect(brand)}
                  >
                    <div className="brand-logo">
                      {brand.logo && /^https?:\/\//i.test(brand.logo) ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="brand-logo-img"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      ) : (
                        <span>{brand.logo || "📱"}</span>
                      )}
                    </div>
                    <span className="brand-name">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedBrand && (
              <div className="continue-section">
                <button className="btn btn-primary" onClick={handleContinue}>
                  Ga verder met {selectedBrand}
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
              <h3>Over Save my Phone</h3>
              <p>
                Wij zijn professionele telefoonreparateurs met meer dan 10 jaar
                ervaring. We gebruiken uitsluitend originele onderdelen en geven
                garantie op alle reparaties.
              </p>
            </div>

            <div className="footer-section">
              <h3>Onze locatie</h3>
              <p>
                123 Repair Street
                <br />
                Amsterdam, 1012 AB
                <br />
                Nederland
                <br />
                <strong>Telefoon:</strong> +31 20 123 4567
                <br />
                <strong>E-mail:</strong> info@savemyphone.nl
              </p>
            </div>

            <div className="footer-section">
              <h3>Openingstijden</h3>
              <p>
                Maandag - vrijdag: 9:00 - 18:00
                <br />
                Zaterdag: 10:00 - 16:00
                <br />
                Zondag: Gesloten
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Save my Phone. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
