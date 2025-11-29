"use client";

import React, { useState } from "react";
import { addPhoneForSale } from "../api";

const AddPhone = () => {
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [storage, setStorage] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [batteryPercentage, setBatteryPercentage] = useState("");
  const [imageUrl1, setImageUrl1] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [imageUrl3, setImageUrl3] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [condition, setCondition] = useState("");
  const [imei, setImei] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const imageUrls = [imageUrl1, imageUrl2, imageUrl3]
        .map((u) => u.trim())
        .filter((u) => u);
      const payload = {
        title,
        brand,
        model,
        storage,
        color,
        price: Number(price),
        imageUrls,
        description,
        available,
        condition: condition || undefined,
        imei: imei || undefined,
        batteryPercentage:
          batteryPercentage === "" ? undefined : Number(batteryPercentage),
      };
      const created = await addPhoneForSale(payload);
      setSuccess(`Toegevoegd: ${created.title} (id: ${created._id})`);
      setTitle("");
      setBrand("");
      setModel("");
      setStorage("");
      setColor("");
      setPrice("");
      setImageUrl1("");
      setImageUrl2("");
      setImageUrl3("");
      setDescription("");
      setAvailable(true);
      setBatteryPercentage("");
      setCondition("");
      setImei("");
    } catch (err) {
      setError(err.message || "Aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <h1>Telefoon toevoegen (shop)</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Bijv. iPhone 12 128GB Zwart"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Merk</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              placeholder="Apple"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              placeholder="iPhone 12"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Opslag</label>
            <input
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              placeholder="128GB"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Kleur</label>
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Zwart"
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
          <label style={{ display: "block", fontWeight: 600 }}>Prijs (€)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={1}
            placeholder="450"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              textAlign: "right",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>
            Batterijpercentage (0–100)
          </label>
          <input
            type="number"
            value={batteryPercentage}
            onChange={(e) => setBatteryPercentage(e.target.value)}
            min={0}
            max={100}
            placeholder="bijv. 92"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ fontWeight: 600 }}>Afbeeldingen (max 3)</label>
          <input
            type="url"
            value={imageUrl1}
            onChange={(e) => setImageUrl1(e.target.value)}
            placeholder="Afbeelding 1 URL"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <input
            type="url"
            value={imageUrl2}
            onChange={(e) => setImageUrl2(e.target.value)}
            placeholder="Afbeelding 2 URL"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <input
            type="url"
            value={imageUrl3}
            onChange={(e) => setImageUrl3(e.target.value)}
            placeholder="Afbeelding 3 URL"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>Staat</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          >
            <option value="">-- kies staat --</option>
            <option value="nieuw">nieuw</option>
            <option value="zo goed als nieuw">zo goed als nieuw</option>
            <option value="refurbished">refurbished</option>
            <option value="zeer goed">zeer goed</option>
            <option value="goed">goed</option>
            <option value="acceptabel">acceptabel</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>IMEI</label>
          <input
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            placeholder="(alleen intern)"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>
            Beschrijving
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Staat, accessoires, garantie, etc."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          <span>Beschikbaar</span>
        </label>

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

        <button
          type="submit"
          disabled={submitting || !title || !brand || !model || !price}
          style={{
            background: "#1e88e5",
            color: "#fff",
            padding: "10px 16px",
            border: 0,
            borderRadius: 8,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Bezig…" : "Toevoegen"}
        </button>
      </form>
    </div>
  );
};

export default AddPhone;
