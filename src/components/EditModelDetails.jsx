"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getJson } from "../api";

const EditModelDetails = () => {
  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [apparaat, setApparaat] = useState("smartphone");

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    getJson("/brands", { retries: 4, retryDelay: 1000 })
      .then((data) => {
        if (!mounted) return;
        setBrands(Array.isArray(data) ? data : []);
        const storedBrandId = localStorage.getItem("selectedBrandId");
        if (storedBrandId) setBrandId(storedBrandId);
      })
      .catch((e) => setError(e.message || "Kon merken niet laden"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Load models for brand
  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId("");
      return;
    }
    setError("");
    setLoading(true);
    getJson(`/models?brandId=${encodeURIComponent(brandId)}`, {
      retries: 4,
      retryDelay: 1000,
    })
      .then((data) => setModels(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Kon modellen niet laden"))
      .finally(() => setLoading(false));
  }, [brandId]);

  // When model chosen, fetch details
  useEffect(() => {
    if (!modelId) return;
    setError("");
    getJson(`/models/${encodeURIComponent(modelId)}`, {
      retries: 2,
      retryDelay: 600,
    })
      .then((m) => {
        setName(m?.model || "");
        setYear(m?.year != null ? String(m.year) : "");
        setImageUrl(m?.imageUrl || "");
        setApparaat(m?.apparaat || "smartphone");
      })
      .catch((e) => setError(e.message || "Kon modelgegevens niet laden"));
  }, [modelId]);

  const brandName = useMemo(
    () => brands.find((b) => b._id === brandId)?.name || "",
    [brands, brandId]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg("");
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Niet ingelogd");
      const payload = {
        model: name,
        brandId,
        year: year === "" ? null : Number(year),
        imageUrl,
        apparaat,
      };
      const res = await apiFetch(`/models/${encodeURIComponent(modelId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Opslaan mislukt");
      setMsg("Modelgegevens opgeslagen");
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setMsg(e.message || "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return <div style={{ padding: 24, color: "#b00020" }}>Fout: {error}</div>;

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Modelgegevens bewerken</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Kies een merk en model; werk daarna de gegevens bij en sla op.
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Merk
          </label>
          <select
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setModelId("");
            }}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          >
            <option value="">Kies een merk…</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
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
            <option value="">Kies een model…</option>
            {models.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {modelId && (
          <>
            <div>
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
              >
                Modelnaam
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={brandName ? `${brandName} …` : "Modelnaam"}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "1fr 2fr",
              }}
            >
              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                >
                  Jaar
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min={1990}
                  max={2100}
                  placeholder="2024"
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
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
              >
                Apparaat
              </label>
              <select
                value={apparaat}
                onChange={(e) => setApparaat(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              >
                <option value="smartphone">Smartphone</option>
                <option value="tablet">Tablet</option>
                <option value="overig">Overig</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving || !name || !brandId || !modelId}
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
                Terug
              </button>
              {msg && (
                <span style={{ alignSelf: "center", color: "#155724" }}>
                  {msg}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditModelDetails;
