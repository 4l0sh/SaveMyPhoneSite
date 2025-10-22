"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RepairSelection.css";
import ProgressBar from "./ProgressBar";

const RepairSelection = () => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedRepairs, setSelectedRepairs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const brand = localStorage.getItem("selectedBrand");
    const model = localStorage.getItem("selectedModel");

    if (brand && model) {
      setSelectedBrand(brand);
      setSelectedModel(model);
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Mock repair data with prices
  const repairOptions = [
    {
      id: "investigation",
      name: "Onderzoek",
      description:
        "Als je niet zeker weet wat het probleem is met je toestel, is verder onderzoek nodig.",
      duration: "2 UUR",
      price: null,
      priceText: "Prijs op aanvraag",
      icon: "🔍",
    },
    {
      id: "screen-basic",
      name: "Scherm (basis)",
      description: "Schermvervanging van basiskwaliteit met garantie.",
      duration: "30 MINUTEN",
      icon: "📱",
      prices: {
        // iPhone 16 Series
        "iPhone 16 Pro Max": 240,
        "iPhone 16 Pro": 220,
        "iPhone 16 Plus": 200,
        "iPhone 16": 180,
        "iPhone 16e": 160,
        // iPhone 15 Series
        "iPhone 15 Pro Max": 220,
        "iPhone 15 Pro": 200,
        "iPhone 15 Plus": 180,
        "iPhone 15": 160,
        // Add all models from your list...
      },
    },
    {
      id: "screen-premium",
      name: "Scherm (premium)",
      description:
        "Schermvervanging van hoge kwaliteit met extra duurzaamheid.",
      duration: "30 MINUTEN",
      icon: "📱",
      prices: {
        // iPhone 16 Series
        "iPhone 16 Pro Max": 270,
        "iPhone 16 Pro": 250,
        "iPhone 16 Plus": 230,
        "iPhone 16": 210,
        "iPhone 16e": 190,
        // iPhone 15 Series
        "iPhone 15 Pro Max": 250,
        "iPhone 15 Pro": 230,
        "iPhone 15 Plus": 210,
        "iPhone 15": 190,
        // Add all models from your list...
      },
    },
    {
      id: "screen-original",
      name: "Scherm (origineel)",
      description: "Origineel fabrikantenscherm.",
      duration: "30 MINUTEN",
      icon: "📱",
      prices: {
        // iPhone 16 Series
        "iPhone 16 Pro Max": 310,
        "iPhone 16 Pro": 290,
        "iPhone 16 Plus": 270,
        "iPhone 16": 250,
        "iPhone 16e": 230,
        // iPhone 15 Series
        "iPhone 15 Pro Max": 290,
        "iPhone 15 Pro": 270,
        "iPhone 15 Plus": 250,
        "iPhone 15": 230,
        // Add all models from your list...
      },
    },
    {
      id: "battery-original",
      name: "Batterij (origineel)",
      description: "Originele batterij van de fabrikant.",
      duration: "45 MINUTEN",
      icon: "🔋",
      prices: {
        // iPhone 16 Series
        "iPhone 16 Pro Max": 70,
        "iPhone 16 Pro": 65,
        "iPhone 16 Plus": 60,
        "iPhone 16": 55,
        "iPhone 16e": 50,
        // Add all models from your list...
      },
    },
    {
      id: "battery-copy",
      name: "Batterij (kopie)",
      description: "Hoogwaardige alternatieve batterij.",
      duration: "45 MINUTEN",
      icon: "🔋",
      prices: {
        // iPhone 16 Series
        "iPhone 16 Pro Max": 60,
        "iPhone 16 Pro": 55,
        "iPhone 16 Plus": 50,
        "iPhone 16": 45,
        "iPhone 16e": 40,
        // Add all models from your list...
      },
    },
    {
      id: "charging-port",
      name: "Oplaadpoort",
      description: "Reparatie of vervanging van een defecte oplaadpoort.",
      duration: "1 UUR",
      icon: "⚡",
      prices: {
        // iPhone 16 Series
        "iPhone 16 Pro Max": 50,
        "iPhone 16 Pro": 45,
        "iPhone 16 Plus": 40,
        "iPhone 16": 35,
        "iPhone 16e": 30,
        // Add all models from your list...
      },
    },
    {
      id: "water-damage",
      name: "Waterschade",
      description:
        "Je toestel is blootgesteld aan water of andere vloeistoffen en werkt niet goed.",
      duration: "2-4 UUR",
      price: null,
      priceText: "Prijs op aanvraag",
      icon: "💧",
    },
    {
      id: "microphone",
      name: "Microfoon (bellen)",
      description:
        "Mensen kunnen je niet horen tijdens telefoongesprekken of spraakopnames werken niet.",
      duration: "1 UUR",
      price: null,
      priceText: "Prijs op aanvraag",
      icon: "🎤",
    },
  ];

  // Update calculateTotal to use model-specific prices
  const calculateTotal = () => {
    return selectedRepairs.reduce((total, repair) => {
      if (repair.prices && repair.prices[selectedModel]) {
        return total + repair.prices[selectedModel];
      }
      return total;
    }, 0);
  };

  const handleContinue = () => {
    if (selectedRepairs.length > 0) {
      localStorage.setItem("selectedRepairs", JSON.stringify(selectedRepairs));
      navigate("/booking");
    }
  };

  const handleBack = () => {
    navigate("/model");
  };

  const handleRepairToggle = (repair) => {
    const isSelected = selectedRepairs.some((r) => r.id === repair.id);
    if (isSelected) {
      const updated = selectedRepairs.filter((r) => r.id !== repair.id);
      setSelectedRepairs(updated);
      localStorage.setItem("selectedRepairs", JSON.stringify(updated));
    } else {
      // Attach resolved price for the selected model if available for better summary later
      const resolvedPrice =
        repair.prices && repair.prices[selectedModel] != null
          ? repair.prices[selectedModel]
          : repair.price ?? null;
      const selected = { ...repair, price: resolvedPrice };
      const updated = [...selectedRepairs, selected];
      setSelectedRepairs(updated);
      localStorage.setItem("selectedRepairs", JSON.stringify(updated));
      // Keep the continue button flow; no auto-advance here
    }
  };

  const formatPrice = (price) => {
    return `€${price}`;
  };

  const renderRepairPrice = (repair, model) => {
    if (repair.prices && repair.prices[model]) {
      return <span className="price">€{repair.prices[model]}</span>;
    }
    return (
      <span className="price-request">
        {repair.priceText || "Prijs op aanvraag"}
      </span>
    );
  };

  return (
    <div className="repair-selection">
      <ProgressBar currentStep={3} />
      <main className="main-content">
        <div className="container">
          <div className="content-wrapper">
            <div className="selection-section">
              <div className="selection-card">
                <div className="back-arrow" onClick={handleBack}>
                  <span className="arrow">←</span>
                </div>

                <div className="device-header">
                  <div className="device-info">
                    <div className="device-icon">📱</div>
                    <div>
                      <h2 className="device-title">
                        {selectedBrand} {selectedModel}
                      </h2>
                      <p className="device-type">Smartphone</p>
                    </div>
                  </div>
                </div>

                <h3 className="selection-title">
                  Selecteer een <span className="highlight">reparatie</span>
                </h3>

                <div className="repairs-grid">
                  {repairOptions.map((repair) => {
                    const isSelected = selectedRepairs.some(
                      (r) => r.id === repair.id
                    );
                    return (
                      <div
                        key={repair.id}
                        className={`repair-card ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => handleRepairToggle(repair)}
                      >
                        <div className="repair-header">
                          <div className="repair-icon">{repair.icon}</div>
                          <div className="repair-info">
                            <h4 className="repair-name">{repair.name}</h4>
                            <p className="repair-duration">{repair.duration}</p>
                          </div>
                          <div className="repair-price">
                            {renderRepairPrice(repair, selectedModel)}
                          </div>
                        </div>
                        <p className="repair-description">
                          {repair.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {selectedRepairs.length > 0 && (
                  <div className="continue-section">
                    <button
                      className="btn btn-primary"
                      onClick={handleContinue}
                    >
                      Ga verder naar afspraak
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedRepairs.length > 0 && (
              <div className="summary-section">
                <div className="repair-list-card">
                  <h3 className="list-title">Reparatielijst</h3>
                  <p className="device-summary">
                    {selectedBrand} {selectedModel}
                  </p>

                  <div className="selected-repairs">
                    {selectedRepairs.map((repair) => (
                      <div key={repair.id} className="repair-item">
                        <div className="item-info">
                          <span className="item-name">{repair.name}</span>
                          <span className="item-detail">
                            {repair.modelPrices &&
                            repair.modelPrices[selectedModel]
                              ? formatPrice(repair.modelPrices[selectedModel])
                              : repair.priceText}
                          </span>
                        </div>
                        <div className="item-price">
                          {repair.price
                            ? formatPrice(repair.price)
                            : "Prijs op aanvraag"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pricing-summary">
                    <div className="price-row">
                      <span>Subtotaal</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>

                    <div className="combo-discount">
                      <span className="discount-label">Combikorting</span>
                      <span className="discount-value">-</span>
                      <div className="discount-offer">
                        <span className="offer-icon">✓</span>
                        <span className="offer-text">
                          Voeg een extra reparatie toe en ontvang €15 korting.
                        </span>
                      </div>
                    </div>

                    <div className="total-row">
                      <span className="total-label">Totaal</span>
                      <div className="total-info">
                        <span className="total-price">€{calculateTotal()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="continue-section">
                    <button
                      className="btn btn-primary"
                      onClick={handleContinue}
                    >
                      Ga verder naar afspraak
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RepairSelection;
