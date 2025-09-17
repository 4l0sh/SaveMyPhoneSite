import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StatusPage.css";
import logo from "../assets/savemyphone.png";

const mockStatusData = {
  ABC123: {
    customer: "John Doe",
    device: "iPhone 14 Pro",
    repairs: ["Screen Replacement", "Battery Replacement"],
    status: "In Progress",
    lastUpdate: "2024-06-10 14:30",
    notes: "Waiting for parts. Estimated ready tomorrow.",
  },
  XYZ789: {
    customer: "Jane Smith",
    device: "Samsung Galaxy S23",
    repairs: ["Charging Port Repair"],
    status: "Ready for Pickup",
    lastUpdate: "2024-06-09 17:00",
    notes: "Repair complete. Please collect your device.",
  },
};

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
  const navigate = useNavigate();

  const handleCheckStatus = (e) => {
    e.preventDefault();
    setError("");
    setStatusInfo(null);
    setLoading(true);

    setTimeout(() => {
      const info = mockStatusData[refCode.trim().toUpperCase()];
      setLoading(false);
      if (info) {
        setStatusInfo(info);
      } else {
        setError("No repair found for this reference code.");
      }
    }, 700);
  };

  return (
    <div className="status-page smp-dark">
      <nav className="smp-navbar">
        <img src={logo} alt="SaveMyPhone Logo" className="smp-navbar-logo" />
        <button className="smp-navbar-btn" onClick={() => navigate("/")}>
          Home
        </button>
      </nav>
      <div className="status-container smp-dark">
        <div className="status-header">
          <span className="status-main-icon">🔎</span>
          <h2 className="status-title">Track Your Repair</h2>
          <p className="status-subtitle">
            Enter your reference code to see the latest status of your device
            repair.
            <br />
            <span className="status-tip">
              You can find this code on your proof of delivery.
            </span>
          </p>
        </div>
        <form className="status-form" onSubmit={handleCheckStatus}>
          <label htmlFor="refCode" className="status-label">
            Reference Code
          </label>
          <div className="status-input-row">
            <input
              id="refCode"
              type="text"
              className="status-input smp-dark"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="e.g. ABC123"
              required
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary status-btn smp-dark"
            >
              {loading ? <span className="status-loader"></span> : "Check"}
            </button>
          </div>
        </form>
        {error && <div className="status-error smp-dark">{error}</div>}
        {statusInfo && (
          <div className="status-result animate-in smp-dark">
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
                  Last update: {statusInfo.lastUpdate}
                </div>
              </div>
            </div>
            <div className="status-details-list">
              <div className="status-detail-row">
                <span className="status-detail-label">Customer:</span>
                <span>{statusInfo.customer}</span>
              </div>
              <div className="status-detail-row">
                <span className="status-detail-label">Device:</span>
                <span>{statusInfo.device}</span>
              </div>
              <div className="status-detail-row">
                <span className="status-detail-label">Repairs:</span>
                <span>{statusInfo.repairs.join(", ")}</span>
              </div>
              <div className="status-detail-row">
                <span className="status-detail-label">Notes:</span>
                <span>{statusInfo.notes}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusPage;
