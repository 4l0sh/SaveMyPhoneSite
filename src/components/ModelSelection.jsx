"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ModelSelection.css";
import ProgressBar from "./ProgressBar";

const ModelSelection = () => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const brand = localStorage.getItem("selectedBrand");
    if (brand) {
      setSelectedBrand(brand);
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Mock data for different brand models
  const modelData = {
    Apple: [
      // iPhone 16 Series
      "iPhone 16 Pro Max",
      "iPhone 16 Pro",
      "iPhone 16 Plus",
      "iPhone 16",
      "iPhone 16e",
      // iPhone 15 Series
      "iPhone 15 Pro Max",
      "iPhone 15 Pro",
      "iPhone 15 Plus",
      "iPhone 15",
      // iPhone 14 Series
      "iPhone 14 Pro Max",
      "iPhone 14 Pro",
      "iPhone 14 Plus",
      "iPhone 14",
      // iPhone 13 Series
      "iPhone 13 Pro Max",
      "iPhone 13 Pro",
      "iPhone 13",
      "iPhone 13 Mini",
      // iPhone 12 Series
      "iPhone 12 Pro Max",
      "iPhone 12 Pro",
      "iPhone 12",
      "iPhone 12 Mini",
      // iPhone 11 Series
      "iPhone 11 Pro Max",
      "iPhone 11 Pro",
      "iPhone 11",
      // iPhone X/XS/XR Series
      "iPhone XS Max",
      "iPhone XS",
      "iPhone XR",
      "iPhone X",
      // iPhone 8/SE Series
      "iPhone 8 Plus",
      "iPhone 8",
      "iPhone SE (2022)",
      "iPhone SE (2020)",
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
    localStorage.setItem("selectedModel", model);
    navigate("/repair");
  };

  const handleSearch = () => {
    if (searchTerm.trim() && filteredModels.length > 0) {
      setSelectedModel(filteredModels[0]);
      localStorage.setItem("selectedModel", filteredModels[0]);
      navigate("/repair");
    }
  };

  const handleContinue = () => {
    if (selectedModel) {
      localStorage.setItem("selectedModel", selectedModel);
      navigate("/repair");
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="model-selection">
      <ProgressBar currentStep={2} />

      <main className="main-content">
        <div className="container">
          <div className="selection-card">
            <div className="back-arrow" onClick={handleBack}>
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
              Selecteer je <span className="highlight">model</span>
            </h3>

            <div className="search-section">
              <p className="search-label">Zoek naar je specifieke model</p>

              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Zoek ${selectedBrand}-modellen...`}
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
                Of kies uit <strong>populaire modellen</strong>
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
                    <p>Geen modellen gevonden voor "{searchTerm}"</p>
                    <p className="suggestion">
                      Probeer een andere zoekterm of bekijk alle modellen
                    </p>
                  </div>
                )}
              </div>

              {searchTerm && (
                <button
                  className="show-all-btn"
                  onClick={() => setSearchTerm("")}
                >
                  Toon alle {selectedBrand}-modellen
                </button>
              )}
            </div>

            {selectedModel && (
              <div className="continue-section">
                <div className="selected-info">
                  <p>
                    Geselecteerd:{" "}
                    <strong>
                      {selectedBrand} {selectedModel}
                    </strong>
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleContinue}>
                  Ga verder naar reparaties
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
