"use client";

import React, { useEffect, useState } from "react";
import { fetchAdminBlogs, deleteBlog } from "../api";
import { Link, useNavigate } from "react-router-dom";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    fetchAdminBlogs()
      .then((list) => {
        if (mounted) {
          setBlogs(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Kon blogs niet laden");
          setLoading(false);
        }
      });
    return () => (mounted = false);
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Weet je zeker dat je deze blog wilt verwijderen?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => String(b._id) !== String(id)));
    } catch (err) {
      alert(err.message || "Verwijderen mislukt");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "28px auto", padding: "0 18px" }}>
      <h1 style={{ margin: 0 }}>Blogs beheren</h1>
      <p style={{ marginTop: 6, color: "#555" }}>
        Overzicht van alle blogs. Bewerk of verwijder indien nodig.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        <Link
          to="/admin/blogs/new"
          style={{
            background: "#ff6b35",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          + Nieuwe blog
        </Link>
        <Link
          to="/admin"
          style={{
            background: "#eee",
            color: "#333",
            padding: "8px 14px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          ← Terug naar admin
        </Link>
      </div>

      {loading && <div style={{ marginTop: 28 }}>Laden…</div>}
      {error && !loading && (
        <div style={{ marginTop: 28, color: "#b00020" }}>Fout: {error}</div>
      )}

      {!loading && !error && (
        <table
          style={{
            width: "100%",
            marginTop: 24,
            borderCollapse: "collapse",
            fontSize: ".92rem",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", background: "#fafafa" }}>
              <th
                style={{ padding: "10px 8px", borderBottom: "1px solid #ddd" }}
              >
                Titel
              </th>
              <th
                style={{ padding: "10px 8px", borderBottom: "1px solid #ddd" }}
              >
                Slug
              </th>
              <th
                style={{ padding: "10px 8px", borderBottom: "1px solid #ddd" }}
              >
                Datum
              </th>
              <th
                style={{ padding: "10px 8px", borderBottom: "1px solid #ddd" }}
              >
                Acties
              </th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b) => (
              <tr key={b._id}>
                <td
                  style={{ padding: "8px 8px", borderBottom: "1px solid #eee" }}
                >
                  <Link
                    to={`/blogs/${b.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "#1e88e5" }}
                  >
                    {b.title}
                  </Link>
                </td>
                <td
                  style={{
                    padding: "8px 8px",
                    borderBottom: "1px solid #eee",
                    fontFamily: "monospace",
                    fontSize: ".75rem",
                    color: "#555",
                  }}
                >
                  {b.slug}
                </td>
                <td
                  style={{
                    padding: "8px 8px",
                    borderBottom: "1px solid #eee",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.createdAt
                    ? new Date(b.createdAt).toLocaleDateString()
                    : ""}
                </td>
                <td
                  style={{ padding: "8px 8px", borderBottom: "1px solid #eee" }}
                >
                  <button
                    onClick={() => navigate(`/admin/blogs/${b._id}/edit`)}
                    style={{
                      background: "#1e88e5",
                      color: "#fff",
                      border: 0,
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginRight: 6,
                    }}
                  >
                    Bewerken
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    disabled={deletingId === b._id}
                    style={{
                      background: "#b00020",
                      color: "#fff",
                      border: 0,
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: deletingId === b._id ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingId === b._id ? "Verwijderen…" : "Verwijderen"}
                  </button>
                </td>
              </tr>
            ))}
            {blogs.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: 20, textAlign: "center", color: "#666" }}
                >
                  Geen blogs gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminBlogs;
