"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getJson } from "../api";
import "./ModelSelection.css";
import ProgressBar from "./ProgressBar";

const ModelSelection = () => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBrandLogo, setSelectedBrandLogo] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const brand = localStorage.getItem("selectedBrand");
    const brandId = localStorage.getItem("selectedBrandId");
    const brandLogoLS = localStorage.getItem("selectedBrandLogo");
    if (!brand || !brandId) {
      navigate("/");
      return;
    }
    setSelectedBrand(brand);
    if (brandLogoLS) setSelectedBrandLogo(brandLogoLS);

    // If we don't have a logo in localStorage, fetch brands and resolve it
    if (!brandLogoLS) {
      getJson("/brands", { retries: 4, retryDelay: 1000 })
        .then((list) => {
          const match = (list || []).find(
            (b) => String(b._id) === String(brandId)
          );
          if (match?.logo) {
            setSelectedBrandLogo(match.logo);
            try {
              localStorage.setItem("selectedBrandLogo", match.logo);
            } catch {}
          }
          if (!brand && match?.name) setSelectedBrand(match.name);
        })
        .catch(() => {});
    }

    setLoading(true);
    const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : "";
    getJson(`/models?brandId=${encodeURIComponent(brandId)}${q}`, {
      retries: 4,
      retryDelay: 1000,
    })
      .then((data) => setModels(data || []))
      .catch((err) => console.error("Error fetching models:", err))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filteredModels = (models || []).filter((m) =>
    (m.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModelSelect = (model) => {
    setSelectedModel(model.name);
    localStorage.setItem("selectedModel", model.name);
    localStorage.setItem("selectedModelId", model._id);
    navigate("/repair");
  };

  const handleSearch = () => {
    if (searchTerm.trim() && filteredModels.length > 0) {
      const first = filteredModels[0];
      setSelectedModel(first.name);
      localStorage.setItem("selectedModel", first.name);
      localStorage.setItem("selectedModelId", first._id);
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
                  {selectedBrandLogo ? (
                    <img
                      src={selectedBrandLogo}
                      alt={selectedBrand}
                      style={{ width: 56, height: 56, objectFit: "contain" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <span>📱</span>
                  )}
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
                {loading ? (
                  <div className="no-models">
                    <p>Modellen laden...</p>
                  </div>
                ) : filteredModels.length > 0 ? (
                  filteredModels.map((model) => (
                    <div
                      key={model._id}
                      className={`model-card ${
                        selectedModel === model.name ? "selected" : ""
                      }`}
                      onClick={() => handleModelSelect(model)}
                    >
                      <div className="model-image">
                        {model.imageUrl ? (
                          <img
                            src={model.imageUrl}
                            alt={model.name}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "contain",
                            }}
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        ) : (
                          <span>📱</span>
                        )}
                      </div>
                      <span className="model-name">{model.name}</span>
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
