"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

// Minimal, focused admin form to add a new model with prices for a selected brand
const Admin = () => {
  const [brands, setBrands] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form fields
  const [brandId, setBrandId] = useState("");
  const [modelName, setModelName] = useState("");
  const [year, setYear] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [prices, setPrices] = useState({}); // { [repairName]: priceString }
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      apiFetch("/brands").then((r) => r.json()),
      apiFetch("/repairs").then((r) => r.json()),
    ])
      .then(([brandsData, repairsData]) => {
        if (!mounted) return;
        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setRepairs(Array.isArray(repairsData) ? repairsData : []);
        // Preselect brand from localStorage if present
        const storedBrandId = localStorage.getItem("selectedBrandId");
        if (storedBrandId) setBrandId(storedBrandId);
      })
      .catch((e) => setError(e.message || "Kon admin data niet laden"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const brandName = useMemo(() => {
    const b = brands.find((x) => x._id === brandId);
    return b?.name || "";
  }, [brands, brandId]);

  const handlePriceChange = (name, value) => {
    setPrices((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Niet ingelogd. Log eerst in om modellen toe te voegen.");
        setSubmitting(false);
        return;
      }

      // Normalize reparaties array from entered prices
      const reparaties = Object.entries(prices)
        .map(([typeNaam, prijsStr]) => ({ typeNaam, prijs: Number(prijsStr) }))
        .filter((r) => Number.isFinite(r.prijs) && r.prijs >= 0);

      const payload = {
        brandId,
        model: modelName,
        year: year || undefined,
        imageUrl: imageUrl || undefined,
        reparaties,
      };

      const res = await apiFetch("/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Aanmaken mislukt");
      }
      setSuccess(`Model aangemaakt: ${data.model} (id: ${data._id})`);
      // Reset form except brand to allow quick subsequent entries
      setModelName("");
      setYear("");
      setImageUrl("");
      setPrices({});
    } catch (err) {
      setError(err.message || "Er ging iets mis bij het aanmaken");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return <div style={{ padding: 24, color: "#b00020" }}>Fout: {error}</div>;

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Admin</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Voeg een nieuw model toe aan een merk en stel de prijzen in per
        reparatietype.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <a
          href="/admin/edit"
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#333",
            display: "inline-block",
          }}
        >
          Bewerk prijzen
        </a>
        <a
          href="/admin/repairs"
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#333",
            display: "inline-block",
          }}
        >
          Reparatietypes beheren
        </a>
        <a
          href="/admin/brands/order"
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#333",
            display: "inline-block",
          }}
        >
          Merken volgorde
        </a>
        <a
          href="/admin/models/order"
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#333",
            display: "inline-block",
          }}
        >
          Modellen volgorde
        </a>
        <a
          href="/admin/repairs/new"
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#333",
            display: "inline-block",
          }}
        >
          Nieuw reparatietype
        </a>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Merk
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            >
              <option value="" disabled>
                Kies een merk
              </option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Modelnaam
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={brandName ? `${brandName} model…` : "Modelnaam"}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div
            style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 2fr" }}
          >
            <div>
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
              >
                Jaar (optioneel)
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min={1990}
                max={2100}
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
                Afbeelding URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
            </div>
          </div>

          <div>
            <h3 style={{ margin: "16px 0 8px" }}>Prijzen per reparatietype</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 8,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 600 }}>Reparatie</div>
              <div style={{ fontWeight: 600, textAlign: "right" }}>
                Prijs (€)
              </div>

              {repairs.map((rep) => (
                <React.Fragment key={rep.id}>
                  <div style={{ padding: "6px 0" }}>{rep.naam}</div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="-"
                      value={prices[rep.naam] ?? ""}
                      onChange={(e) =>
                        handlePriceChange(rep.naam, e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        textAlign: "right",
                      }}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p style={{ color: "#666", marginTop: 8 }}>
              Laat leeg als de prijs nog onbekend is; die reparatie wordt dan
              niet toegevoegd.
            </p>
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

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={submitting || !brandId || !modelName}
              style={{
                background: "#1e88e5",
                color: "#fff",
                padding: "10px 16px",
                border: 0,
                borderRadius: 8,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Bezig…" : "Model aanmaken"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Admin;
