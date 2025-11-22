"use client";

import React, { useEffect, useState } from "react";
import { fetchBlogs } from "../api";
import { Link } from "react-router-dom";
import "./blogs.css";

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchBlogs()
      .then((data) => {
        if (mounted) {
          setBlogs(data);
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

  return (
    <div
      className="blogs-page container"
      style={{ paddingTop: 24, paddingBottom: 60 }}
    >
      <h1 className="blogs-title">Blogs</h1>
      <p className="blogs-subtitle">
        Lees onze updates, tips en inzichten over smartphone onderhoud en
        reparaties.
      </p>
      {loading && <div className="blogs-loading">Laden…</div>}
      {error && !loading && <div className="blogs-error">{error}</div>}
      {!loading && !error && (
        <div className="blogs-grid">
          {blogs.map((b) => {
            const hasImage = !!b.imageUrl;
            return (
              <article
                key={b._id}
                className={`blog-card ${hasImage ? "has-image" : ""}`}
                style={
                  hasImage
                    ? {
                        backgroundImage: `url(${b.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <div className={hasImage ? "blog-card-overlay" : undefined}>
                  <h2 className="blog-card-title">
                    <Link to={`/blogs/${b.slug}`}>{b.title}</Link>
                  </h2>
                  <div className="blog-meta">
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleDateString()
                      : ""}
                  </div>
                  <p className="blog-excerpt">
                    {b.excerpt}
                    {b.excerpt?.length >= 220 ? "…" : ""}
                  </p>
                  <Link to={`/blogs/${b.slug}`} className="blog-read-more">
                    Lees verder →
                  </Link>
                </div>
              </article>
            );
          })}
          {blogs.length === 0 && <div>Geen blogs beschikbaar.</div>}
        </div>
      )}
    </div>
  );
};

export default Blogs;
