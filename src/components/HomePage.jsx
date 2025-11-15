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
    // Manual brand selection should start with a clean model list
    try {
      localStorage.removeItem("modelSearchTerm");
      localStorage.removeItem("searchInitiated");
    } catch {}
    navigate("/model");
  };

  const handleSearch = () => {
    const raw = searchTerm.trim();
    if (!raw) return;

    const term = raw.toLowerCase();
    const compact = term.replace(/\s+/g, "");
    // Map common aliases to brand names
    const aliasMap = [
      { keys: ["iphone", "ipad", "apple"], brand: "Apple" },
      { keys: ["samsung", "galaxy", "note", "tab"], brand: "Samsung" },
      { keys: ["huawei"], brand: "Huawei" },
      { keys: ["xiaomi", "mi", "redmi", "poco"], brand: "Xiaomi" },
      { keys: ["oneplus"], brand: "OnePlus" },
      { keys: ["oppo"], brand: "Oppo" },
      { keys: ["pixel", "google"], brand: "Google" },
      { keys: ["sony", "xperia"], brand: "Sony" },
      { keys: ["nokia"], brand: "Nokia" },
    ];

    // Heuristics for brand inference
    const isSamsungSPattern =
      /\bgalaxy\s*s\b/.test(term) ||
      /\bs\d{2}\b/.test(term) ||
      /\bgalaxys\d{2}\b/.test(compact);
    const isApplePattern =
      /\biphone\b/.test(term) ||
      /\bipad\b/.test(term) ||
      (/\b(pro|max|mini|plus|se)\b/.test(term) && /\b\d{1,2}\b/.test(term));
    // Oppo patterns: Find X series, Find N series, Reno series (e.g., "find x8 pro", "find n3 flip", "reno 12 pro")
    const isOppoPattern =
      /\bfind\s*x\d+\b/.test(term) ||
      /\bfindx\d+\b/.test(compact) ||
      /\bfind\s*n\d+\b/.test(term) ||
      /\breno\s*\d+\b/.test(term);
    // Samsung A-series without brand token (e.g., "a54", "galaxy a35")
    const isSamsungAPattern =
      /\bgalaxy\s*a\d{1,3}\b/.test(term) || /(^|\b)a\d{1,3}\b/.test(term);
    // Samsung tablets (e.g., "tab s9", "tab a7", "tabs8", "galaxy tab a8")
    const isSamsungTabPattern =
      /\bgalaxy\s*tab\b/.test(term) ||
      /\btab\s*[as]?\d{1,2}\b/.test(term) ||
      /\btabs\d{1,2}\b/.test(compact);
    // Xiaomi series (e.g., "redmi note 12", "poco f5", "mi 11")
    const isXiaomiPattern =
      /\bredmi\b/.test(term) ||
      /\bpoco\b/.test(term) ||
      /\bmi\s*\d+\b/.test(term);
    // OnePlus series without brand token (e.g., "nord 2", "ace 3")
    const isOnePlusPattern = /\bnord\b/.test(term) || /\bace\b/.test(term);
    // Huawei series (e.g., "mate 50", "p30 pro")
    const isHuaweiPattern =
      /\bmate\s*\w*\d+\b/.test(term) || /\bp\d{2,3}\b/.test(term);
    // Sony Xperia
    const isSonyPattern = /\bxperia\b/.test(term);
    // Google Pixel (alias should already catch, but include explicit model-only form)
    const isPixelPattern = /\bpixel\b/.test(term) || /\b\d{1,2}a\b/.test(term);

    let detectedBrand = undefined;
    const findBrand = (predicate) =>
      brands.find((b) => predicate((b.name || b.merk || "").toLowerCase()));

    if (isSamsungSPattern) {
      // Choose the Samsung S-series brand (e.g., "Samsung S modellen")
      detectedBrand =
        findBrand(
          (n) => /samsung/.test(n) && /(\bgalaxy\s*s\b|\bs\b)/.test(n)
        ) || findBrand((n) => /samsung s/.test(n));
    } else if (isApplePattern) {
      // Prefer iPad vs iPhone based on tokens in the query
      if (/\bipad\b/.test(term)) {
        detectedBrand =
          findBrand((n) => /ipad/.test(n)) ||
          findBrand((n) => /(apple|iphone)/.test(n));
      } else {
        detectedBrand =
          findBrand((n) => /iphone/.test(n)) ||
          findBrand((n) => /(apple|ipad)/.test(n));
      }
      // Final fallback: any brand containing apple/iphone/ipad
      if (!detectedBrand) {
        detectedBrand = findBrand((n) => /(apple|iphone|ipad)/.test(n));
      }
    } else if (isSamsungTabPattern) {
      // Samsung tablets ("Samsung Tablets")
      detectedBrand = findBrand(
        (n) => /samsung/.test(n) && /(tablet|tab)/.test(n)
      );
    } else if (isSamsungAPattern) {
      // Samsung A models (e.g., brand tile "Samsung A modellen")
      detectedBrand =
        findBrand((n) => /samsung\s*a\b/.test(n)) ||
        findBrand((n) => /samsung/.test(n) && /\ba\b/.test(n));
    } else if (isOppoPattern) {
      // Oppo brand detection from model-only queries
      detectedBrand = findBrand((n) => /oppo/.test(n));
    } else if (isXiaomiPattern) {
      detectedBrand =
        findBrand((n) => /xiaomi/.test(n)) ||
        findBrand((n) => /(redmi|poco|\bmi\b)/.test(n));
    } else if (isOnePlusPattern) {
      detectedBrand = findBrand((n) => /oneplus/.test(n));
    } else if (isHuaweiPattern) {
      detectedBrand = findBrand((n) => /huawei/.test(n));
    } else if (isSonyPattern) {
      detectedBrand = findBrand((n) => /(sony|xperia)/.test(n));
    } else if (isPixelPattern) {
      detectedBrand = findBrand((n) => /(pixel|google)/.test(n));
    }
    // Try direct brand name match
    if (!detectedBrand) {
      detectedBrand = brands.find((b) =>
        term.includes((b.name || b.merk || "").toLowerCase())
      );
    }
    // Try alias mapping
    if (!detectedBrand) {
      const hit = aliasMap.find((m) => m.keys.some((k) => term.includes(k)));
      if (hit) {
        // Prefer partial name matches using the alias keys, then exact brand name fallback
        detectedBrand = brands.find((b) => {
          const nm = (b.name || b.merk || "").toLowerCase();
          return (
            hit.keys.some((k) => nm.includes(k)) ||
            nm === hit.brand.toLowerCase()
          );
        });
      }
    }

    // Persist brand if detected
    if (detectedBrand) {
      const name = detectedBrand.name || detectedBrand.merk;
      setSelectedBrand(name);
      setSelectedBrandId(detectedBrand._id);
      localStorage.setItem("selectedBrand", name);
      localStorage.setItem("selectedBrandId", detectedBrand._id);
      if (detectedBrand.logo)
        localStorage.setItem("selectedBrandLogo", detectedBrand.logo);
    }

    // Derive a model search fragment by stripping brand/aliases from the input
    let modelFragment = raw;
    const toStrip = new Set([
      ...(detectedBrand
        ? [detectedBrand.name || detectedBrand.merk || ""]
        : []),
      ...aliasMap.flatMap((m) => m.keys),
      // common generic words in brand tiles
      "modellen",
      "models",
      "galaxy",
      "tablet",
      "tab",
      // Oppo series tokens
      "find",
      "x",
      "n",
      "reno",
      "neo",
      "lite",
      "flip",
      // general brand/model tokens for other brands
      "pixel",
      "redmi",
      "poco",
      "mi",
      "nord",
      "ace",
      "mate",
      "xperia",
      "note",
    ]);
    toStrip.forEach((kw) => {
      if (!kw) return;
      const re = new RegExp(
        `\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
        "ig"
      );
      modelFragment = modelFragment.replace(re, " ");
    });
    modelFragment = modelFragment.replace(/\s+/g, " ").trim();

    // Special case: keep brand tokens for Apple iPhone so fragment shows full context
    if (
      detectedBrand &&
      /(apple\s*iphone)/i.test(
        detectedBrand.name || detectedBrand.merk || ""
      ) &&
      modelFragment.length > 0
    ) {
      // Prepend a normalized 'Apple iPhone' if not already present in fragment
      if (!/^apple\s*iphone/i.test(modelFragment)) {
        modelFragment = `Apple iPhone ${modelFragment}`.trim();
      }
    }
    if (detectedBrand && modelFragment.length > 1) {
      try {
        localStorage.setItem("modelSearchTerm", modelFragment);
        localStorage.setItem("searchInitiated", "1");
      } catch {}
    }

    if (detectedBrand) {
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
      // Continuing without typing a search should not carry over a previous fragment
      try {
        localStorage.removeItem("modelSearchTerm");
        localStorage.removeItem("searchInitiated");
      } catch {}
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
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
