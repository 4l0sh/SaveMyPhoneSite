"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch, getJson } from "../api";

const ModelsOrder = () => {
  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getJson("/brands", { retries: 4, retryDelay: 1000 })
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    setError("");
    getJson(`/models?brandId=${encodeURIComponent(brandId)}`, {
      retries: 4,
      retryDelay: 1000,
    })
      .then((data) => setModels(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Kon modellen niet laden"))
      .finally(() => setLoading(false));
  }, [brandId]);

  const brandName = useMemo(
    () => brands.find((b) => String(b._id) === String(brandId))?.name || "",
    [brands, brandId]
  );

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= models.length) return;
    const copy = models.slice();
    const tmp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = tmp;
    setModels(copy);
    setDirty(true);
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      setMsg("");
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Niet ingelogd");
      const order = models.map((m) => m._id);
      const res = await apiFetch("/models/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandId, order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Opslaan mislukt");
      setMsg("Volgorde opgeslagen");
      setDirty(false);
    } catch (e) {
      setMsg(e.message || "Opslaan mislukt");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2500);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Modellen volgorde</h1>

      <div style={{ marginBottom: 12 }}>
        <a
          href="/admin"
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#333",
            display: "inline-block",
            marginBottom: 8,
          }}
        >
          Terug naar Admin
        </a>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Merk
        </label>
        <select
          value={brandId}
          onChange={(e) => {
            setBrandId(e.target.value);
            setModels([]);
            setDirty(false);
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

      {brandId && (
        <div>
          <h3 style={{ marginTop: 0 }}>{brandName}</h3>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              margin: "8px 0 12px",
            }}
          >
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
              onClick={saveOrder}
              disabled={!dirty || saving || !brandId}
              style={{
                background: dirty ? "#1e88e5" : "#bbb",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 8,
                border: 0,
                cursor: !dirty || saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Opslaan…" : "Volgorde opslaan"}
            </button>
            {msg && <span style={{ color: "#155724" }}>{msg}</span>}
          </div>

          {loading ? (
            <div style={{ padding: 24 }}>Laden…</div>
          ) : error ? (
            <div style={{ padding: 24, color: "#b00020" }}>Fout: {error}</div>
          ) : (
            <div style={{ border: "1px solid #eee", borderRadius: 8 }}>
              {models.map((m, idx) => (
                <div
                  key={String(m._id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: 8,
                    padding: "10px 12px",
                    borderBottom: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      title="Omhoog"
                      style={{ padding: "4px 8px" }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === models.length - 1}
                      title="Omlaag"
                      style={{ padding: "4px 8px" }}
                    >
                      ↓
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {m.imageUrl ? (
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        style={{ width: 28, height: 28, objectFit: "contain" }}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <span>📱</span>
                    )}
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelsOrder;
