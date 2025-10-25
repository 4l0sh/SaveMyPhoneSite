"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiFetch } from "../api";

const EditRepairType = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [icoon, setIcoon] = useState("");
  const [duurMinuten, setDuurMinuten] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    apiFetch(`/repairs/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setNaam(data.naam || "");
        setBeschrijving(data.beschrijving || "");
        setIcoon(data.icoon || "");
        setDuurMinuten(
          typeof data.duurMinuten === "number" ? String(data.duurMinuten) : ""
        );
      })
      .catch((e) => setError(e.message || "Kon reparatietype niet laden"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Niet ingelogd. Log eerst in om te bewaren.");
        setSaving(false);
        return;
      }
      const payload = {
        naam: naam?.trim(),
        beschrijving: beschrijving?.trim() || undefined,
        icoon: icoon?.trim() || undefined,
        duurMinuten:
          duurMinuten === "" || duurMinuten === null
            ? undefined
            : Number(duurMinuten),
      };
      const res = await apiFetch(`/repairs/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Opslaan mislukt");
      }
      setSaved(true);
      // Optional: navigate back after a short delay
      // setTimeout(() => navigate("/admin/repairs"), 600);
    } catch (err) {
      setError(err.message || "Er ging iets mis bij het opslaan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "#b00020", marginBottom: 12 }}>Fout: {error}</div>
        <Link to="/admin/repairs">Terug naar lijst</Link>
      </div>
    );

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ marginBottom: 8, marginTop: 0 }}>
          Reparatietype bewerken
        </h1>
        <div style={{ marginLeft: "auto" }}>
          <Link
            to="/admin/repairs"
            style={{ textDecoration: "none", color: "#1e88e5" }}
          >
            Terug naar lijst
          </Link>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Naam
            </label>
            <input
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
            <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
              Moet uniek zijn.
            </div>
          </div>

          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Beschrijving (optioneel)
            </label>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={3}
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
              Icoon (optioneel)
            </label>
            <input
              type="text"
              placeholder="bijv. mdi:tools of een emoji"
              value={icoon}
              onChange={(e) => setIcoon(e.target.value)}
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
              Duur (minuten, optioneel)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="bijv. 30"
              value={duurMinuten}
              onChange={(e) => setDuurMinuten(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>

          {saved && (
            <div
              style={{
                background: "#e6f4ea",
                border: "1px solid #9fd3ab",
                color: "#175b2b",
                padding: 12,
                borderRadius: 8,
              }}
            >
              Opgeslagen.
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

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving || !naam.trim()}
              style={{
                background: "#1e88e5",
                color: "#fff",
                padding: "10px 16px",
                border: 0,
                borderRadius: 8,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Bezig…" : "Opslaan"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/repairs")}
              style={{
                background: "#eee",
                color: "#333",
                padding: "10px 16px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            >
              Annuleren
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditRepairType;
