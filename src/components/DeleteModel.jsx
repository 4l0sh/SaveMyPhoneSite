"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getJson } from "../api";

const DeleteModel = () => {
  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

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

  const selectedModelName = useMemo(
    () => models.find((m) => m._id === modelId)?.name || "",
    [models, modelId]
  );

  const handleDelete = async () => {
    try {
      if (!modelId) return;
      if (confirmText.trim() !== selectedModelName) {
        setMsg("Typ exact de modelnaam om te bevestigen");
        return;
      }
      setDeleting(true);
      setMsg("");
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Niet ingelogd");
      const res = await apiFetch(`/models/${encodeURIComponent(modelId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Verwijderen mislukt");
      setMsg("Model verwijderd");
      // Remove from list and reset selection
      setModels((list) => list.filter((m) => m._id !== modelId));
      setModelId("");
      setConfirmText("");
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setMsg(e.message || "Verwijderen mislukt");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return <div style={{ padding: 24, color: "#b00020" }}>Fout: {error}</div>;

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8, color: "#b00020" }}>Model verwijderen</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Let op: verwijderen is permanent. Deze actie kan niet ongedaan worden
        gemaakt.
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
              setConfirmText("");
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
            onChange={(e) => {
              setModelId(e.target.value);
              setConfirmText("");
            }}
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
            <div
              style={{
                background: "#fff7f7",
                border: "1px solid #f5a09b",
                padding: 12,
                borderRadius: 8,
              }}
            >
              Typ <strong>{selectedModelName}</strong> om te bevestigen:
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginTop: 8,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={handleDelete}
                disabled={
                  deleting ||
                  !modelId ||
                  confirmText.trim() !== selectedModelName
                }
                style={{
                  background:
                    confirmText.trim() === selectedModelName
                      ? "#d32f2f"
                      : "#bbb",
                  color: "#fff",
                  padding: "10px 16px",
                  border: 0,
                  borderRadius: 8,
                  cursor:
                    deleting || confirmText.trim() !== selectedModelName
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {deleting ? "Verwijderen…" : "Model verwijderen"}
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
                Annuleren
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

export default DeleteModel;
