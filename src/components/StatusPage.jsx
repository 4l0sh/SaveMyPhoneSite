import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StatusPage.css";
import logo from "../assets/savemyphone.png";

const statusIcons = {
  "In Progress": "🔧",
  "Ready for Pickup": "✅",
  "Waiting for Parts": "⏳",
  Received: "📦",
  Completed: "🎉",
};

const statusColors = {
  "In Progress": "#ff9800", // orange
  "Ready for Pickup": "#43a047",
  "Waiting for Parts": "#fbc02d",
  Received: "#0288d1",
  Completed: "#8e24aa",
};

const StatusPage = () => {
  const [refCode, setRefCode] = useState("");
  const [statusInfo, setStatusInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);
  const navigate = useNavigate();

  // Fetch data when component mounts
  useEffect(() => {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${import.meta.env.VITE_REM_API}`,
      },
    };

    fetch("https://api.roapp.io/orders", options)
      .then((res) => res.json())
      .then((res) => setApiData(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleCheckStatus = (e) => {
    e.preventDefault();
    setError("");
    setStatusInfo(null);
    setLoading(true);

    setTimeout(() => {
      if (apiData) {
        const order = apiData.find(
          (order) => order.id_label === refCode.trim().toUpperCase()
        );

        if (order) {
          const mappedStatus = {
            customer: order.client.name,
            device: `${order.asset.brand} ${order.asset.model}`, // Combine brand and model
            repairs: [order.malfunction],
            status: order.status.name,
            lastUpdate: new Date(order.modified_at).toLocaleString(),
            price: order.price ? `€${order.price}` : "Price not set",
            notes:
              order.engineer_notes ||
              order.manager_notes ||
              "No notes available",
          };
          setStatusInfo(mappedStatus);
        } else {
          setError("Geen reparatie gevonden voor deze referentiecode.");
        }
      } else {
        setError(
          "Kan reparatiegegevens niet ophalen. Probeer het later opnieuw."
        );
      }
      setLoading(false);
    }, 700);
  };

  return (
    <div className="status-page">
      <nav className="smp-navbar">
        <img src={logo} alt="SaveMyPhone Logo" className="smp-navbar-logo" />
        <button className="smp-navbar-btn" onClick={() => navigate("/")}>
          Home
        </button>
      </nav>
      <div className="status-container">
        <div className="status-header">
          <span className="status-main-icon">🔎</span>
          <h2 className="status-title">Volg je reparatie</h2>
          <p className="status-subtitle">
            Vul je referentiecode in om de laatste status van je reparatie te
            bekijken.
            <br />
            <span className="status-tip">
              Je vindt deze code op je afgiftebewijs.
            </span>
          </p>
        </div>
        <form className="status-form" onSubmit={handleCheckStatus}>
          <label htmlFor="refCode" className="status-label">
            Referentiecode
          </label>
          <div className="status-input-row">
            <input
              id="refCode"
              type="text"
              className="status-input"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="bijv. ABC123"
              required
              autoFocus
            />
            <button type="submit" className="btn btn-primary status-btn">
              {loading ? <span className="status-loader"></span> : "Controleer"}
            </button>
          </div>
        </form>
        {error && <div className="status-error">{error}</div>}
        {statusInfo && (
          <div className="status-result animate-in">
            <div className="status-result-header">
              <span
                className="status-result-icon"
                style={{
                  background: statusColors[statusInfo.status] || "#ff9800",
                }}
              >
                {statusIcons[statusInfo.status] || "🔧"}
              </span>
              <div>
                <h3>
                  <span
                    className="status-badge"
                    style={{
                      background: statusColors[statusInfo.status] || "#ff9800",
                    }}
                  >
                    {statusInfo.status}
                  </span>
                </h3>
                <div className="status-last-update">
                  Laatste update: {statusInfo.lastUpdate}
                </div>
              </div>
            </div>
            <div className="status-details-list">
              <div className="status-detail-row">
                <span className="status-detail-label">Klant:</span>
                <span>{statusInfo.customer}</span>
              </div>
              <div className="status-detail-row">
                <span className="status-detail-label">Toestel:</span>
                <span>{statusInfo.device}</span>
              </div>
              <div className="status-detail-row">
                <span className="status-detail-label">Probleem:</span>
                <span>{statusInfo.repairs.join(", ")}</span>
              </div>
              <div className="status-detail-row">
                <span className="status-detail-label">Prijs:</span>
                <span>{statusInfo.price}</span>
              </div>
              {statusInfo.notes && (
                <div className="status-detail-row">
                  <span className="status-detail-label">Notities:</span>
                  <span>{statusInfo.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusPage;
