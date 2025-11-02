"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getJson } from "../api";
import "./HomePage.css";
import ProgressBar from "./ProgressBar";

const Homepage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Show development notice unless dismissed before
    const dismissed = localStorage.getItem("devNoticeDismissed");
    if (!dismissed) setShowNotice(true);

    getJson("/brands", { retries: 4, retryDelay: 1000 })
      .then((data) => {
        setBrands(data);
        console.log("Fetched brands:", data);
      })
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  const closeNotice = () => {
    setShowNotice(false);
    // remember dismissal
    localStorage.setItem("devNoticeDismissed", String(Date.now()));
  };

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
      {showNotice && (
        <div
          className="dev-notice-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-notice-title"
        >
          <div className="dev-notice-modal">
            <button
              className="dev-notice-close"
              aria-label="Sluiten"
              onClick={closeNotice}
            >
              ×
            </button>
            <h3 id="dev-notice-title">Website in ontwikkeling</h3>
            <p>
              Deze website is nog in ontwikkeling. Heb je vragen? Bel ons op{" "}
              <a href="tel:0365256149">036 525 6149</a> of stuur een WhatsApp
              bericht naar{" "}
              <a
                href="https://wa.me/31620808787"
                target="_blank"
                rel="noreferrer"
              >
                +31 6 2080 8787
              </a>
              .
            </p>
          </div>
        </div>
      )}
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
            {/* Removed back arrow on homepage (no page to go back to) */}

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
        {/* SEO content block */}
        <section className="seo-section">
          <div className="container">
            <h2 className="seo-title">
              Smartphone- en tabletreparatie in Almere
            </h2>
            <p className="seo-paragraph">
              Bij Save my Phone in Almere helpen we je snel met reparaties voor
              iPhone, Samsung en andere smartphones en tablets. Door onze
              jarenlange ervaring lossen we vrijwel elke klacht vakkundig op en
              denken we met je mee over de slimste keuze: repareren of
              vervangen. We werken met kwaliteitsonderdelen en duidelijke
              communicatie, zodat je precies weet waar je aan toe bent.
            </p>

            <h3 className="seo-subtitle">
              Scherpe prijzen en transparant advies
            </h3>
            <p className="seo-paragraph">
              Onze tarieven zijn gebaseerd op de inkoop van onderdelen en de
              benodigde werktijd. Geen kleine lettertjes: je hoort de prijs
              vooraf en we repareren pas na akkoord. Populaire reparaties zoals{" "}
              iPhone schermen en batterijen zijn vaak direct uit voorraad
              leverbaar.
            </p>

            <h3 className="seo-subtitle">
              Je weet altijd waar je aan toe bent
            </h3>
            <p className="seo-paragraph">
              Twijfel je over de staat van je toestel? Loop gerust binnen voor
              een gratis check. We onderzoeken het probleem, leggen de opties
              uit en geven eerlijk advies. Is repareren niet logisch, dan zeggen
              we dat ook.
            </p>

            <h3 className="seo-subtitle">Zeven dagen per week geopend</h3>
            <p className="seo-paragraph">
              We zijn van maandag tot en met zondag geopend. Veel reparaties
              zijn klaar terwijl je wacht (afhankelijk van voorraad) — ideaal
              als je snel weer bereikbaar wilt zijn.
            </p>

            <div className="seo-features">
              <div className="seo-feature">
                <div className="seo-icon">
                  {" "}
                  <i class="fa-solid fa-screwdriver-wrench icon"></i>
                </div>
                <h4>Gratis reparatiecheck</h4>
                <p>
                  We onderzoeken je toestel gratis en bespreken vooraf de
                  kosten.
                </p>
              </div>
              <div className="seo-feature">
                <div className="seo-icon">
                  <i class="fa-solid fa-star icon"></i>
                </div>
                <h4>100% service</h4>
                <p>
                  Vriendelijke service, heldere uitleg en garantie op onze
                  werkzaamheden.
                </p>
              </div>
              <div className="seo-feature">
                <div className="seo-icon">
                  <i class="fa-solid fa-hourglass-start icon"></i>
                </div>
                <h4>Binnen 60 min. klaar</h4>
                <p>
                  Veelvoorkomende reparaties zijn vaak binnen een uur gereed.
                </p>
              </div>
              <div className="seo-feature">
                <div className="seo-icon">
                  <i class="fa-solid fa-shield icon"></i>
                </div>
                <h4>6 maanden garantie</h4>
                <p>
                  Op onderdelen en arbeid, volgens onze garantievoorwaarden.
                </p>
              </div>
            </div>
          </div>
        </section>
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
                Schutterstraat 42b
                <br />
                Almere, 1315 VJ
                <br />
                Nederland
                <br />
                <i class="fa-solid fa-phone-volume call-icon"></i>{" "}
                <a href="tel:0365256149">036 525 6149</a>
                <br />
                <i class="fa-brands fa-whatsapp whatsapp-icon"></i>{" "}
                <a href="https://wa.me/0620808787">06 20808787</a>
                <br />
                <i class="fa-solid fa-envelope call-icon"></i>{" "}
                <a href="mailto:info@savemysmartphone.nl">
                  info@savemysmartphone.nl
                </a>
              </p>
            </div>

            <div className="footer-section">
              <h3>Openingstijden</h3>
              <p>
                Maandag: 12:00 - 18:00
                <br />
                Dinsdag - Zaterdag : 10:00 - 18:00
                <br />
                Donderdag: 10:00 - 20:00
                <br />
                Zondag: 12:00 - 17:00
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
