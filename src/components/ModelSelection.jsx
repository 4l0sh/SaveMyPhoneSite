"use client";

import { useState } from "react";
import "./ModelSelection.css";
import ProgressBar from "./ProgressBar";

const ModelSelection = ({
  selectedBrand,
  selectedModel,
  setSelectedModel,
  nextStep,
  prevStep,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for different brand models
  const modelData = {
    Apple: [
      "iPhone 15 Pro Max",
      "iPhone 15 Pro",
      "iPhone 15 Plus",
      "iPhone 15",
      "iPhone 14 Pro Max",
      "iPhone 14 Pro",
      "iPhone 14 Plus",
      "iPhone 14",
      "iPhone 13 Pro Max",
      "iPhone 13 Pro",
      "iPhone 13",
      "iPhone 13 mini",
      "iPhone 12 Pro Max",
      "iPhone 12 Pro",
      "iPhone 12",
      "iPhone 12 mini",
      "iPhone 11 Pro Max",
      "iPhone 11 Pro",
      "iPhone 11",
      "iPhone XS Max",
      "iPhone XS",
      "iPhone XR",
      "iPhone X",
      "iPhone 8 Plus",
      "iPhone 8",
      "iPhone 7 Plus",
      "iPhone 7",
    ],
    Samsung: [
      "Galaxy S24 Ultra",
      "Galaxy S24+",
      "Galaxy S24",
      "Galaxy S23 Ultra",
      "Galaxy S23+",
      "Galaxy S23",
      "Galaxy S22 Ultra",
      "Galaxy S22+",
      "Galaxy S22",
      "Galaxy S21 Ultra",
      "Galaxy S21+",
      "Galaxy S21",
      "Galaxy Note 20 Ultra",
      "Galaxy Note 20",
      "Galaxy A54",
      "Galaxy A34",
      "Galaxy A24",
      "Galaxy A14",
    ],
    Huawei: [
      "P60 Pro",
      "P60",
      "P50 Pro",
      "P50",
      "P40 Pro",
      "P40",
      "Mate 50 Pro",
      "Mate 50",
      "Mate 40 Pro",
      "Mate 40",
      "Nova 11",
      "Nova 10",
      "Y70",
      "Y60",
    ],
    // Add more brands as needed
  };

  const models = modelData[selectedBrand] || [];
  const filteredModels = models.filter((model) =>
    model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };

  const handleSearch = () => {
    if (searchTerm.trim() && filteredModels.length > 0) {
      setSelectedModel(filteredModels[0]);
      nextStep();
    }
  };

  const handleContinue = () => {
    if (selectedModel) {
      nextStep();
    }
  };

  return (
    <div className="model-selection">
      <ProgressBar currentStep={1} />

      <main className="main-content">
        <div className="container">
          <div className="selection-card">
            <div className="back-arrow" onClick={prevStep}>
              <span className="arrow">←</span>
            </div>

            <div className="brand-header">
              <div className="brand-info">
                <div className="brand-icon">
                  {selectedBrand === "Apple" && "🍎"}
                  {selectedBrand === "Samsung" && "📱"}
                  {selectedBrand === "Huawei" && "📲"}
                  {!["Apple", "Samsung", "Huawei"].includes(selectedBrand) &&
                    "📱"}
                </div>
                <div>
                  <h2 className="brand-title">{selectedBrand}</h2>
                  <p className="device-type">Smartphone</p>
                </div>
              </div>
            </div>

            <h3 className="selection-title">
              Select your <span className="highlight">model</span>
            </h3>

            <div className="search-section">
              <p className="search-label">Search for your specific model</p>

              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Search ${selectedBrand} models...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="search-btn" onClick={handleSearch}>
                  🔍
                </button>
              </div>
            </div>

            <div className="models-section">
              <p className="models-label">
                Or select from <strong>popular models</strong>
              </p>

              <div className="models-grid">
                {filteredModels.length > 0 ? (
                  filteredModels.map((model) => (
                    <div
                      key={model}
                      className={`model-card ${
                        selectedModel === model ? "selected" : ""
                      }`}
                      onClick={() => handleModelSelect(model)}
                    >
                      <div className="model-image">📱</div>
                      <span className="model-name">{model}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-models">
                    <p>No models found for "{searchTerm}"</p>
                    <p className="suggestion">
                      Try a different search term or browse all models
                    </p>
                  </div>
                )}
              </div>

              {searchTerm && (
                <button
                  className="show-all-btn"
                  onClick={() => setSearchTerm("")}
                >
                  Show all {selectedBrand} models
                </button>
              )}
            </div>

            {selectedModel && (
              <div className="continue-section">
                <div className="selected-info">
                  <p>
                    Selected:{" "}
                    <strong>
                      {selectedBrand} {selectedModel}
                    </strong>
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleContinue}>
                  Continue to Repairs
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModelSelection;
