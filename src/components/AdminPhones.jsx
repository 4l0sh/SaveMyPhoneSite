"use client";

import React, { useEffect, useState } from "react";
import { fetchAllPhonesAdmin, updatePhone, deletePhone } from "../api";

const Row = ({ phone, onUpdated, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: phone.title || "",
    price: phone.price || "",
    batteryPercentage:
      typeof phone.batteryPercentage === "number"
        ? String(phone.batteryPercentage)
        : "",
    available: phone.available !== false,
    imageUrl: phone.imageUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        price: Number(form.price),
        available: !!form.available,
        imageUrl: form.imageUrl,
      };
      if (form.batteryPercentage !== "") {
        payload.batteryPercentage = Number(form.batteryPercentage);
      } else {
        payload.batteryPercentage = 0; // set to 0 if cleared
      }
      await updatePhone(phone._id, payload);
      onUpdated();
      setEditing(false);
    } catch (e) {
      setError(e.message || "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Weet je zeker dat je deze telefoon wilt verwijderen?"))
      return;
    try {
      await deletePhone(phone._id);
      onDeleted();
    } catch (e) {
      alert(e.message || "Verwijderen mislukt");
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "start",
      }}
    >
      <div>
        {!editing ? (
          <>
            <div style={{ fontWeight: 600 }}>{phone.title}</div>
            <div style={{ color: "#666", fontSize: 13 }}>
              {[phone.brand, phone.model, phone.storage, phone.color]
                .filter(Boolean)
                .join(" · ")}
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              Prijs:{" "}
              {Number(phone.price).toLocaleString("nl-NL", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            {typeof phone.batteryPercentage === "number" && (
              <div style={{ fontSize: 13 }}>
                Batterij: {phone.batteryPercentage}%
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <label>
              <div style={{ fontWeight: 600 }}>Titel</div>
              <input
                value={form.title}
                onChange={(e) => onChange("title", e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600 }}>Prijs (€)</div>
              <input
                type="number"
                value={form.price}
                onChange={(e) => onChange("price", e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  textAlign: "right",
                }}
              />
            </label>
            <label>
              <div style={{ fontWeight: 600 }}>Batterij%</div>
              <input
                type="number"
                min={0}
                max={100}
                value={form.batteryPercentage}
                onChange={(e) => onChange("batteryPercentage", e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  textAlign: "right",
                }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => onChange("available", e.target.checked)}
              />
              <span>Beschikbaar</span>
            </label>
            <label>
              <div style={{ fontWeight: 600 }}>Afbeelding URL</div>
              <input
                value={form.imageUrl}
                onChange={(e) => onChange("imageUrl", e.target.value)}
                placeholder="https://…"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
            </label>
            {error && (
              <div
                style={{
                  background: "#fdecea",
                  border: "1px solid #f5a09b",
                  color: "#8a1f17",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  background: "#1e88e5",
                  color: "#fff",
                  border: 0,
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: 0,
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: "#eee",
              border: 0,
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Bewerken
          </button>
        )}
        <button
          onClick={remove}
          style={{
            background: "#fee",
            border: "1px solid #f5a09b",
            color: "#b00020",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Verwijderen
        </button>
      </div>
    </div>
  );
};

const AdminPhones = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    fetchAllPhonesAdmin()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Laden mislukt"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
      <h1>Telefoons beheren</h1>
      {loading && <div>Laden…</div>}
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
      {!loading && !items.length && <div>Geen telefoons gevonden.</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((p) => (
          <Row key={p._id} phone={p} onUpdated={load} onDeleted={load} />
        ))}
      </div>
    </div>
  );
};

export default AdminPhones;
