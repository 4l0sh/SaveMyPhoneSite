import React, { useEffect, useState } from "react";
import { fetchPhones } from "../api";
import "./shop.css";

const Shop = () => {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetchPhones()
      .then((data) => {
        if (!mounted) return;
        setPhones(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message || "Kon telefoons niet laden"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="shop-container">
      <h1 className="shop-title">Telefoons te koop</h1>
      <p>
        Hieronder is onze voorraad van telefoons die u kunt kopen. Bij elke
        model krijgt u 3 maanden garantie.
      </p>
      <br />
      {loading && <div className="shop-status">Laden…</div>}
      {error && <div className="shop-error">Fout: {error}</div>}
      {!loading && !error && phones.length === 0 && (
        <div className="shop-status">Momenteel geen telefoons beschikbaar.</div>
      )}
      <div className="shop-grid">
        {phones.map((p) => (
          <div key={p._id} className="phone-card">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.title} className="phone-image" />
            ) : (
              <div className="phone-image placeholder" />
            )}
            <div className="phone-content">
              <div className="phone-title">{p.title}</div>
              <div className="phone-meta">
                {[p.brand, p.model, p.storage, p.color]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {p.description && (
                <div className="phone-desc">{p.description}</div>
              )}
              {typeof p.batteryPercentage === "number" && (
                <div className="phone-battery">
                  Batterij: {p.batteryPercentage}%
                  <div className="battery-bar">
                    <div
                      className="battery-fill"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, p.batteryPercentage)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="phone-footer">
                <div className="phone-price">
                  {Number.isFinite(Number(p.price))
                    ? `€${Number(p.price).toLocaleString("nl-NL")}`
                    : "Prijs op aanvraag"}
                </div>
                <button
                  className="phone-action"
                  onClick={() => (window.location.href = "/contact")}
                >
                  Reserveren ?
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
