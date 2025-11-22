"use client";

import React, { useState } from "react";
import { createBlog } from "../api";
import { useNavigate } from "react-router-dom";

const AddBlog = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const created = await createBlog({ title, content, imageUrl });
      setSuccess(`Blog aangemaakt: ${created.title}`);
      setTitle("");
      setContent("");
      setImageUrl("");
    } catch (err) {
      setError(err.message || "Kon blog niet aanmaken");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 840, margin: "32px auto", padding: "16px 20px" }}>
      <h1 style={{ marginBottom: 8 }}>Nieuwe blog</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Voeg een nieuwe blog toe. Titel wordt gebruikt voor een unieke slug.
      </p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Titel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Bijv. Tips voor batterijduur"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Afbeelding URL (cover)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <p style={{ margin: "6px 0 0", fontSize: ".75rem", color: "#666" }}>
            Gebruik een volledige http(s) URL. Laat leeg voor geen cover.
          </p>
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            required
            placeholder="Schrijf je inhoud hier..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontFamily: "Segoe UI",
            }}
          />
        </div>
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
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={submitting || !title || !content}
            style={{
              background: "#ff6b35",
              color: "#fff",
              padding: "10px 18px",
              border: 0,
              borderRadius: 8,
              cursor: submitting ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Opslaan…" : "Publiceren"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            style={{
              background: "#eee",
              color: "#333",
              padding: "10px 18px",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            Terug
          </button>
          <button
            type="button"
            onClick={() => navigate("/blogs")}
            style={{
              background: "#1e88e5",
              color: "#fff",
              padding: "10px 18px",
              border: 0,
              borderRadius: 8,
            }}
          >
            Bekijk blogs
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBlog;
