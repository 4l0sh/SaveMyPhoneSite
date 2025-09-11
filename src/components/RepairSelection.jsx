"use client";

import { useState } from "react";
import "./RepairSelection.css";
import ProgressBar from "./ProgressBar";

const RepairSelection = ({
  selectedBrand,
  selectedModel,
  selectedRepairs,
  setSelectedRepairs,
  nextStep,
  prevStep,
}) => {
  const [includeTax, setIncludeTax] = useState(true);

  // Mock repair data with prices
  const repairOptions = [
    {
      id: "investigation",
      name: "Investigation",
      description:
        "If you are unsure about the issue with your device, further investigation is needed.",
      duration: "2 HOURS",
      price: null,
      priceText: "Price on request",
      icon: "🔍",
    },
    {
      id: "screen",
      name: "Screen",
      description:
        "Your screen is cracked, doesn't respond properly, or displays horizontal/vertical lines and/or unusual colors.",
      duration: "30 MINUTES",
      price: 435,
      icon: "📱",
    },
    {
      id: "charging-port",
      name: "Charging Port",
      description:
        "Your device is unable to charge and/or connect to your computer.",
      duration: "1 HOUR",
      price: 125,
      icon: "⚡",
    },
    {
      id: "battery",
      name: "Battery",
      description:
        "The battery life of your device is very short, or your device keeps turning off.",
      duration: "45 MINUTES",
      price: 100,
      icon: "🔋",
    },
    {
      id: "water-damage",
      name: "Water Damage",
      description:
        "Your device has been exposed to water or other liquids and is not functioning properly.",
      duration: "2-4 HOURS",
      price: 75,
      icon: "💧",
    },
    {
      id: "microphone",
      name: "Microphone (calling)",
      description:
        "People can't hear you during phone calls or voice recordings are not working.",
      duration: "1 HOUR",
      price: null,
      priceText: "Price on request",
      icon: "🎤",
    },
  ];

  const handleRepairToggle = (repair) => {
    const isSelected = selectedRepairs.some((r) => r.id === repair.id);
    if (isSelected) {
      setSelectedRepairs(selectedRepairs.filter((r) => r.id !== repair.id));
    } else {
      setSelectedRepairs([...selectedRepairs, repair]);
    }
  };

  const calculateSubtotal = () => {
    return selectedRepairs.reduce((total, repair) => {
      return total + (repair.price || 0);
    }, 0);
  };

  const calculateTax = (subtotal) => {
    return Math.round(subtotal * 0.21);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = includeTax ? calculateTax(subtotal) : 0;
    return subtotal + tax;
  };

  const handleContinue = () => {
    if (selectedRepairs.length > 0) {
      nextStep();
    }
  };

  const formatPrice = (price) => {
    return `€${price}`;
  };

  return (
    <div className="repair-selection">
      <ProgressBar currentStep={2} />

      <main className="main-content">
        <div className="container">
          <div className="content-wrapper">
            <div className="selection-section">
              <div className="selection-card">
                <div className="back-arrow" onClick={prevStep}>
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
                  Select <span className="highlight">repair</span>
                </h3>

                <div className="tax-toggle">
                  <label className="toggle-label">
                    <span>Incl. TAX</span>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={includeTax}
                        onChange={(e) => setIncludeTax(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </div>
                  </label>
                </div>

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
                            {repair.price ? (
                              <span className="price">
                                {formatPrice(repair.price)}
                              </span>
                            ) : (
                              <span className="price-request">
                                {repair.priceText}
                              </span>
                            )}
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
                      Continue to Booking
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedRepairs.length > 0 && (
              <div className="summary-section">
                <div className="repair-list-card">
                  <h3 className="list-title">Repair List</h3>
                  <p className="device-summary">
                    {selectedBrand} {selectedModel}
                  </p>

                  <div className="selected-repairs">
                    {selectedRepairs.map((repair) => (
                      <div key={repair.id} className="repair-item">
                        <div className="item-info">
                          <span className="item-name">{repair.name}</span>
                          <span className="item-detail">
                            Original {repair.name.toLowerCase()}
                          </span>
                        </div>
                        <div className="item-price">
                          {repair.price
                            ? formatPrice(repair.price)
                            : "Price on request"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pricing-summary">
                    <div className="price-row">
                      <span>sub-total</span>
                      <span>{formatPrice(calculateSubtotal())}</span>
                    </div>

                    <div className="combo-discount">
                      <span className="discount-label">Combo-discount</span>
                      <span className="discount-value">-</span>
                      <div className="discount-offer">
                        <span className="offer-icon">✓</span>
                        <span className="offer-text">
                          Add an extra repair and receive €15 discount.
                        </span>
                      </div>
                    </div>

                    <div className="total-row">
                      <span className="total-label">Total</span>
                      <div className="total-info">
                        <span className="total-price">
                          {formatPrice(calculateTotal())}
                        </span>
                        {includeTax && (
                          <span className="tax-info">incl. tax (21%)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="quotation-section">
                    <h4 className="quotation-title">Create A Quotation</h4>
                    <p className="quotation-subtitle">
                      Directly in your mailbox
                    </p>
                    <button className="btn btn-primary quotation-btn">
                      Final Step
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
