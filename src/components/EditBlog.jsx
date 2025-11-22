"use client";

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchAdminBlogs, updateBlog } from "../api";

// For simplicity we fetch all blogs then pick one. Could have separate fetch-by-id.
const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blog, setBlog] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchAdminBlogs()
      .then((list) => {
        if (!mounted) return;
        const found = list.find((b) => String(b._id) === String(id));
        if (!found) {
          setError("Blog niet gevonden");
          setLoading(false);
          return;
        }
        setBlog(found);
        setTitle(found.title || "");
        setContent(found.content || "");
        setImageUrl(found.imageUrl || "");
        setLoading(false);
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Kon blog niet laden");
          setLoading(false);
        }
      });
    return () => (mounted = false);
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateBlog({ id, title, content, imageUrl });
      setSuccess("Blog succesvol bijgewerkt");
      setBlog(updated);
      if (updated.slug && updated.slug !== blog.slug) {
        // slug changed, we could navigate to new public URL if desired
      }
    } catch (err) {
      setError(err.message || "Updaten mislukt");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Laden…</div>;
  if (error)
    return <div style={{ padding: 24, color: "#b00020" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: "28px auto", padding: "0 18px" }}>
      <h1 style={{ marginTop: 0 }}>Blog bewerken</h1>
      <p style={{ color: "#555", marginTop: 4 }}>ID: {id}</p>
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}
      >
        <Link
          to="/admin/blogs"
          style={{
            background: "#eee",
            color: "#333",
            padding: "8px 14px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          ← Terug naar lijst
        </Link>
        <Link
          to={`/blogs/${blog.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#1e88e5",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Open publieke versie ↗
        </Link>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Titel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
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
            Volledige http(s) URL. Laat leeg om cover te verwijderen.
          </p>
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            required
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontFamily: "Segoe UI",
              lineHeight: 1.5,
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
            disabled={saving}
            style={{
              background: "#ff6b35",
              color: "#fff",
              padding: "10px 18px",
              border: 0,
              borderRadius: 8,
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {saving ? "Opslaan…" : "Wijzigingen opslaan"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: "#eee",
              color: "#333",
              padding: "10px 18px",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBlog;
