"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { getJson } from "../api";

const MoveModelBrand = () => {
  const [brands, setBrands] = useState([]);
  const [sourceBrandId, setSourceBrandId] = useState("");
  const [targetBrandId, setTargetBrandId] = useState("");
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    getJson("/brands", { retries: 4, retryDelay: 1000 })
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setBrands(list);
        const stored = localStorage.getItem("selectedBrandId");
        if (stored) setSourceBrandId(stored);
      })
      .catch((e) => setError(e.message || "Kon merken niet laden"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Load models for selected source brand
  useEffect(() => {
    if (!sourceBrandId) {
      setModels([]);
      setModelId("");
      return;
    }
    setError("");
    setLoading(true);
    getJson(`/models?brandId=${encodeURIComponent(sourceBrandId)}`, {
      retries: 4,
      retryDelay: 1000,
    })
      .then((data) => setModels(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Kon modellen niet laden"))
      .finally(() => setLoading(false));
  }, [sourceBrandId]);

  const brandName = (id) =>
    brands.find((b) => String(b._id) === String(id))?.name || "";

  const selectedModelName = useMemo(
    () => models.find((m) => String(m._id) === String(modelId))?.name || "",
    [models, modelId]
  );

  const handleMove = async () => {
    try {
      if (!modelId || !targetBrandId) return;
      if (String(sourceBrandId) === String(targetBrandId)) {
        setMsg("Kies een andere bestemming");
        return;
      }
      setSaving(true);
      setMsg("");
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Niet ingelogd");
      const res = await apiFetch(`/models/${encodeURIComponent(modelId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandId: targetBrandId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Verplaatsen mislukt");
      setMsg(
        `Model verplaatst: ${selectedModelName} → ${brandName(targetBrandId)}`
      );
      // Remove from current list
      setModels((list) =>
        list.filter((m) => String(m._id) !== String(modelId))
      );
      setModelId("");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg(e.message || "Verplaatsen mislukt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return <div style={{ padding: 24, color: "#b00020" }}>Fout: {error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Model verplaatsen naar ander merk</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Kies het huidige merk en model, vervolgens het doel-merk. Bevestig om te
        verplaatsen.
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Huidig merk
          </label>
          <select
            value={sourceBrandId}
            onChange={(e) => {
              setSourceBrandId(e.target.value);
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
              <option key={String(b._id)} value={String(b._id)}>
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
            disabled={!sourceBrandId}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          >
            <option value="">Kies een model…</option>
            {models.map((m) => (
              <option key={String(m._id)} value={String(m._id)}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Doel-merk
          </label>
          <select
            value={targetBrandId}
            onChange={(e) => setTargetBrandId(e.target.value)}
            disabled={!modelId}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          >
            <option value="">Kies een merk…</option>
            {brands.map((b) => (
              <option key={String(b._id)} value={String(b._id)}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <a
            href="/admin"
            style={{
              background: "#eee",
              border: "1px solid #ccc",
              padding: "8px 12px",
              borderRadius: 8,
              textDecoration: "none",
              color: "#333",
            }}
          >
            Terug naar Admin
          </a>
          <button
            onClick={handleMove}
            disabled={!modelId || !targetBrandId || saving}
            style={{
              background: !modelId || !targetBrandId ? "#bbb" : "#1e88e5",
              color: "#fff",
              padding: "10px 16px",
              border: 0,
              borderRadius: 8,
              cursor:
                !modelId || !targetBrandId || saving
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {saving ? "Verplaatsen…" : "Verplaats model"}
          </button>
          {msg && (
            <span style={{ alignSelf: "center", color: "#155724" }}>{msg}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveModelBrand;
