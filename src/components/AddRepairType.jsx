"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

const AddRepairType = () => {
  const navigate = useNavigate();
  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [duurMinuten, setDuurMinuten] = useState("");
  const [icoon, setIcoon] = useState("🛠️");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Niet ingelogd");

      const payload = {
        naam,
        beschrijving,
        duurMinuten: duurMinuten === "" ? undefined : Number(duurMinuten),
        icoon,
      };

      const res = await apiFetch("/repairs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Aanmaken mislukt");
      setSuccess(`Reparatietype aangemaakt: ${data.naam}`);
      setNaam("");
      setBeschrijving("");
      setDuurMinuten("");
      setIcoon("🛠️");
    } catch (err) {
      setError(err.message || "Kon niet aanmaken");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Nieuw reparatietype</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Voeg een nieuw reparatietype toe. De naam moet uniek zijn.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Naam
          </label>
          <input
            type="text"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            required
            placeholder="Bijv. Basic Scherm"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Beschrijving (optioneel)
          </label>
          <textarea
            value={beschrijving}
            onChange={(e) => setBeschrijving(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Duur (minuten, optioneel)
            </label>
            <input
              type="number"
              min={0}
              max={1440}
              value={duurMinuten}
              onChange={(e) => setDuurMinuten(e.target.value)}
              placeholder="30"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Icoon (emoji of tekst)
            </label>
            <input
              type="text"
              value={icoon}
              onChange={(e) => setIcoon(e.target.value)}
              placeholder="🛠️"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>
        </div>

        {success && (
          <div
            style={{
              background: "#e6f4ea",
              border: "1px solid #9fd3ab",
              color: "#175b2b",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {success}
          </div>
        )}
        {error && (
          <div
            style={{
              background: "#fdecea",
              border: "1px solid #f5a09b",
              color: "#8a1f17",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={submitting || !naam}
            style={{
              background: "#1e88e5",
              color: "#fff",
              padding: "10px 16px",
              border: 0,
              borderRadius: 8,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Aanmaken…" : "Aanmaken"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            style={{
              background: "#eee",
              color: "#333",
              padding: "10px 16px",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            Terug naar Admin
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRepairType;
