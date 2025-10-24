"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Page to edit an existing model's repair prices
const EditModel = () => {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [search, setSearch] = useState("");

  const [prices, setPrices] = useState({}); // { [repairName]: number|string }
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Load brands initially
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetch("http://localhost:3000/brands")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setBrands(Array.isArray(data) ? data : []);
        const storedBrandId = localStorage.getItem("selectedBrandId");
        const queryModelId = params.get("modelId");
        if (storedBrandId) setBrandId(storedBrandId);
        if (queryModelId) setModelId(queryModelId);
      })
      .catch((e) => setError(e.message || "Kon merken niet laden"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [params]);

  // Load models when brand changes or search term changes
  useEffect(() => {
    if (!brandId) return;
    const url = new URL("http://localhost:3000/models");
    url.searchParams.set("brandId", brandId);
    if (search) url.searchParams.set("q", search);
    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => setModels(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Kon modellen niet laden"));
  }, [brandId, search]);

  // Load selected model's current repairs when modelId chosen
  useEffect(() => {
    if (!modelId) return;
    setError("");
    fetch(`http://localhost:3000/models/${encodeURIComponent(modelId)}/repairs`)
      .then((r) => {
        if (!r.ok) throw new Error("Kon reparaties niet laden");
        return r.json();
      })
      .then((payload) => {
        const reps = Array.isArray(payload?.reparaties)
          ? payload.reparaties
          : [];
        setRepairs(reps);
        // Pre-fill prices map
        const p = {};
        for (const rep of reps) {
          if (rep.prijs != null) p[rep.naam] = String(rep.prijs);
        }
        setPrices(p);
      })
      .catch((e) =>
        setError(e.message || "Fout bij laden van model reparaties")
      );
  }, [modelId]);

  const handlePriceChange = (name, value) => {
    setPrices((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Niet ingelogd");

      // Build reparaties array only for filled prices
      const reparaties = Object.entries(prices)
        .map(([typeNaam, prijsStr]) => ({ typeNaam, prijs: Number(prijsStr) }))
        .filter((r) => Number.isFinite(r.prijs) && r.prijs >= 0);

      const res = await fetch(
        `http://localhost:3000/models/${encodeURIComponent(modelId)}/repairs`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reparaties }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Opslaan mislukt");
      setSuccess("Prijzen opgeslagen");
    } catch (e) {
      setError(e.message || "Kon niet opslaan");
    } finally {
      setSaving(false);
    }
  };

  const brandName = useMemo(
    () => brands.find((b) => b._id === brandId)?.name || "",
    [brands, brandId]
  );

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Bewerk modelprijzen</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Kies eerst een merk en model; bewerk daarna de prijzen en sla op.
      </p>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Merk
          </label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
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
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Zoek model
          </label>
          <input
            type="text"
            placeholder={brandName ? `${brandName} …` : "Modelnaam"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            Model
          </label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          >
            <option value="" disabled>
              Kies een model
            </option>
            {models.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {modelId && (
          <div>
            <h3 style={{ margin: "16px 0 8px" }}>
              Prijzen voor geselecteerd model
            </h3>
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

            {success && (
              <div
                style={{
                  background: "#e6f4ea",
                  border: "1px solid #9fd3ab",
                  color: "#175b2b",
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 12,
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
                  marginTop: 12,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: "#1e88e5",
                  color: "#fff",
                  padding: "10px 16px",
                  border: 0,
                  borderRadius: 8,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Opslaan…" : "Opslaan"}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default EditModel;
