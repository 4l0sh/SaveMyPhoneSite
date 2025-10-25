"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

const RepairTypesList = () => {
  const [items, setItems] = useState([]);
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

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return <div style={{ padding: 24, color: "#b00020" }}>Fout: {error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Reparatietypes</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
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
      <div style={{ border: "1px solid #eee", borderRadius: 8 }}>
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 8,
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              alignItems: "center",
            }}
          >
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
