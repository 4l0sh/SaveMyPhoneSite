"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

const RepairTypesList = () => {
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch("/repairs")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Kon reparatietypes niet laden"))
      .finally(() => setLoading(false));
  }, []);

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const copy = items.slice();
    const tmp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = tmp;
    setItems(copy);
    setDirty(true);
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      setMsg("");
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Niet ingelogd");
      const order = items.map((x) => x.id);
      const res = await apiFetch("/repairs/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order }),
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

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return <div style={{ padding: 24, color: "#b00020" }}>Fout: {error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Reparatietypes</h1>
      <div
        style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}
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
        <Link
          to="/admin/repairs/new"
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#333",
          }}
        >
          Nieuw reparatietype
        </Link>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          margin: "8px 0 12px",
        }}
      >
        <button
          onClick={saveOrder}
          disabled={!dirty || saving}
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
      <div style={{ border: "1px solid #eee", borderRadius: 8 }}>
        {items.map((it, idx) => (
          <div
            key={it.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 2fr 1fr 1fr",
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
                disabled={idx === items.length - 1}
                title="Omlaag"
                style={{ padding: "4px 8px" }}
              >
                ↓
              </button>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{it.naam}</div>
              {it.beschrijving && (
                <div style={{ color: "#666", fontSize: 14 }}>
                  {it.beschrijving}
                </div>
              )}
            </div>
            <div style={{ color: "#444" }}>{it.duurMinuten ?? "-"} min</div>
            <div style={{ textAlign: "right" }}>
              <Link
                to={`/admin/repairs/${encodeURIComponent(it.id)}/edit`}
                style={{
                  background: "#1e88e5",
                  color: "#fff",
                  padding: "6px 10px",
                  borderRadius: 6,
                  textDecoration: "none",
                }}
              >
                Bewerken
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepairTypesList;
