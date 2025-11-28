"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import "./admin.css";

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
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-title">Admin</div>
        <div className="admin-subtitle">
          Beheer modellen, reparatietypes, blogs en shop.
        </div>
      </div>

      <div className="admin-actions">
        <div className="card">
          <div className="card-title">Modellen</div>
          <div className="card-desc">Beheer modelgegevens en prijzen.</div>
          <div className="card-actions">
            <a href="/admin/edit" className="btn">
              Bewerk prijzen
            </a>
            <a href="/admin/models/edit-details" className="btn">
              Modelgegevens
            </a>
            <a href="/admin/models/order" className="btn">
              Volgorde
            </a>
            <a href="/admin/models/delete" className="btn btn-danger">
              Verwijderen
            </a>
            <a href="/admin/move-model" className="btn">
              Verplaats model
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Reparatietypes</div>
          <div className="card-desc">
            Voeg nieuwe types toe en beheer volgorde.
          </div>
          <div className="card-actions">
            <a href="/admin/repairs/new" className="btn">
              Nieuw type
            </a>
            <a href="/admin/repairs" className="btn">
              Beheren
            </a>
            <a href="/admin/brands/order" className="btn">
              Merken volgorde
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Blogs</div>
          <div className="card-desc">Publiceer en beheer blogposts.</div>
          <div className="card-actions">
            <a href="/admin/blogs/new" className="btn btn-primary">
              Nieuwe blog
            </a>
            <a href="/admin/blogs" className="btn">
              Blogs beheren
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Shop</div>
          <div className="card-desc">Beheer telefoons voor verkoop.</div>
          <div className="card-actions">
            <a href="/admin/phones/new" className="btn">
              Telefoon toevoegen
            </a>
            <a href="/admin/phones" className="btn">
              Telefoons beheren
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-grid">
          <div>
            <label className="label">Merk</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="input"
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
            <label className="label">Modelnaam</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={brandName ? `${brandName} model…` : "Modelnaam"}
              required
              className="input"
            />
          </div>

          <div className="admin-grid-2">
            <div>
              <label className="label">Jaar (optioneel)</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min={1990}
                max={2100}
                className="input"
              />
            </div>
            <div>
              <label className="label">Afbeelding URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="input"
              />
            </div>
          </div>

          <div>
            <h3 style={{ margin: "16px 0 8px" }}>Prijzen per reparatietype</h3>
            <div className="admin-price-grid">
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
                      className="input input-sm right"
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

          {success && <div className="banner-success">{success}</div>}
          {error && <div className="banner-error">{error}</div>}

          <div className="form-actions">
            <button
              type="submit"
              disabled={submitting || !brandId || !modelName}
              className="btn btn-primary"
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
