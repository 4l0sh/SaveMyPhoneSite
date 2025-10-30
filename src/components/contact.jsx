import React, { useState } from "react";
import "./contact.css";
import { postContactMessage } from "../api";

const Contact = () => {
  const handleCall = () => {
    // Use tel: to trigger the device dialer
    window.location.href = "tel:0365256149";
  };

  const handleWhatsApp = () => {
    // Open WhatsApp chat in a new tab/window
    window.open("https://wa.me/31620808787", "_blank", "noopener,noreferrer");
  };

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = "Vul je naam in";
    if (!form.email && !form.phone) e.email = "E-mail of telefoon is verplicht";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Ongeldig e-mailadres";
    if (!form.message || form.message.trim().length < 5)
      e.message = "Vertel ons kort waar we mee kunnen helpen";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await postContactMessage(form);
      setSuccess("Bedankt! We nemen zo snel mogelijk contact met je op.");
      setForm({ name: "", email: "", phone: "", message: "" });
      setErrors({});
    } catch (err) {
      setErrors({ submit: err?.message || "Verzenden mislukt" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1>Neem contact op</h1>
          <p>
            Vragen over een reparatie of direct een afspraak maken? We helpen je
            graag snel verder.
          </p>
          <div className="contact-actions">
            <button className="btn btn-primary callBtn" onClick={handleCall}>
              <span className="callText">Bel ons</span>
              <i
                className="fa-solid fa-phone-volume callIcon"
                aria-hidden="true"
              ></i>
            </button>
            <button
              className="btn btn-whatsapp callBtn"
              onClick={handleWhatsApp}
            >
              <span className="callText">WhatsApp</span>
              <i
                className="fa-brands fa-whatsapp callIcon"
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </div>
      </div>

      <div className="contact-details">
        <div className="card">
          <h2>Stuur ons een bericht</h2>
          {success && (
            <div className="success-banner" role="status">
              {success}
            </div>
          )}
          {errors.submit && (
            <div
              className="error-text"
              role="alert"
              style={{ marginBottom: 10 }}
            >
              {errors.submit}
            </div>
          )}
          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Naam</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={onChange}
                  autoComplete="name"
                  required
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                />
                {errors.email && (
                  <div className="error-text">{errors.email}</div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Telefoon</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-control"
                value={form.phone}
                onChange={onChange}
                autoComplete="tel"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Bericht</label>
              <textarea
                id="message"
                name="message"
                className="form-control"
                rows={5}
                value={form.message}
                onChange={onChange}
                required
              />
              {errors.message && (
                <div className="error-text">{errors.message}</div>
              )}
            </div>
            <div
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Verzenden..." : "Verstuur bericht"}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Openingstijden</h2>
          <ul className="hours">
            <li>
              <span>Maandag</span>
              <span>12:00 – 18:00</span>
            </li>
            <li>
              <span>Di — Za</span>
              <span>10:00 – 18:00</span>
            </li>
            <li>
              <span>Donderdag</span>
              <span>10:00 – 20:00</span>
            </li>
            <li>
              <span>Zondag</span>
              <span>12:00 - 17:00</span>
            </li>
          </ul>
          <p className="hint">
            Buiten openingstijden? Stuur een WhatsApp en we reageren zo snel
            mogelijk.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
