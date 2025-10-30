"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getJson } from "../api";
import "./RepairSelection.css";
import ProgressBar from "./ProgressBar";

const RepairSelection = () => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedRepairs, setSelectedRepairs] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Show all non-hidden repairs; if prijs is null, show "Prijs op aanvraag"
  const visibleRepairs = (repairs || []).filter((r) => !r.hidden);

  useEffect(() => {
    const brand = localStorage.getItem("selectedBrand");
    const modelName = localStorage.getItem("selectedModel");
    const modelId = localStorage.getItem("selectedModelId");

    if (!brand || !modelId) {
      navigate("/model");
      return;
    }
    setSelectedBrand(brand);
    if (modelName) setSelectedModel(modelName);

    // Load merged repairs for the selected model from backend
    setLoading(true);
    setError("");
    getJson(`/models/${encodeURIComponent(modelId)}/repairs`, {
      retries: 4,
      retryDelay: 1000,
    })
      .then((payload) => {
        // payload: { modelId, modelNaam, imageUrl, reparaties: [...] }
        if (payload?.modelNaam) setSelectedModel(payload.modelNaam);
        setRepairs(
          Array.isArray(payload?.reparaties) ? payload.reparaties : []
        );
      })
      .catch((e) => setError(e.message || "Kon reparaties niet laden"))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Update calculateTotal to use model-specific prices
  const calculateTotal = () => {
    return selectedRepairs.reduce((total, r) => total + (r.price || 0), 0);
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
      // Normalize the repair object for summary: use naam->name and prijs->price
      const selected = {
        id: repair.id,
        name: repair.naam,
        description: repair.beschrijving,
        duration: repair.duurMinuten ? `${repair.duurMinuten} MINUTEN` : null,
        icon: repair.icoon || "🛠️",
        price: repair.prijs ?? null,
        priceText: repair.prijs == null ? "Prijs op aanvraag" : undefined,
      };
      const updated = [...selectedRepairs, selected];
      setSelectedRepairs(updated);
      localStorage.setItem("selectedRepairs", JSON.stringify(updated));
      // Keep the continue button flow; no auto-advance here
    }
  };

  const formatPrice = (price) => `€${price}`;

  const renderRepairPrice = (repair) => {
    if (repair.prijs != null) {
      return <span className="price">€{repair.prijs}</span>;
    }
    return <span className="price-request">Prijs op aanvraag</span>;
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
                  {loading ? (
                    <div className="no-models">
                      <p>Reparaties laden...</p>
                    </div>
                  ) : error ? (
                    <div className="no-models">
                      <p>{error}</p>
                    </div>
                  ) : visibleRepairs.length === 0 ? (
                    <div className="no-models">
                      <p>Geen reparaties met prijs beschikbaar</p>
                    </div>
                  ) : (
                    visibleRepairs.map((repair) => {
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
                            <div className="repair-icon">
                              {repair.icoon || "🛠️"}
                            </div>
                            <div className="repair-info">
                              <h4 className="repair-name">{repair.naam}</h4>
                              <p className="repair-duration">
                                {repair.duurMinuten
                                  ? `${repair.duurMinuten} MINUTEN`
                                  : ""}
                              </p>
                            </div>
                            <div className="repair-price">
                              {renderRepairPrice(repair)}
                            </div>
                          </div>
                          <p className="repair-description">
                            {repair.beschrijving}
                          </p>
                        </div>
                      );
                    })
                  )}
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
                            {repair.price != null
                              ? formatPrice(repair.price)
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
