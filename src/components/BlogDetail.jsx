"use client";

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBlog } from "../api";
import "./blogs.css";

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchBlog(slug)
      .then((data) => {
        if (mounted) {
          setBlog(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Blog niet gevonden");
          setLoading(false);
        }
      });
    return () => (mounted = false);
  }, [slug]);

  return (
    <div
      className="blog-detail-page container"
      style={{ paddingTop: 28, paddingBottom: 60 }}
    >
      {loading && <div className="blogs-loading">Laden…</div>}
      {error && !loading && <div className="blogs-error">{error}</div>}
      {!loading && blog && (
        <article className="blog-detail-card">
          {blog.imageUrl && (
            <div
              className="blog-detail-hero"
              style={{
                backgroundImage: `url(${blog.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "14px",
                height: 240,
                marginBottom: 24,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "16px 22px",
                }}
              >
                <h1
                  className="blog-detail-title"
                  style={{ color: "#fff", margin: 0 }}
                >
                  {blog.title}
                </h1>
              </div>
            </div>
          )}
          {!blog.imageUrl && (
            <h1 className="blog-detail-title" style={{ marginTop: 0 }}>
              {blog.title}
            </h1>
          )}
          <div className="blog-meta">
            {blog.createdAt ? new Date(blog.createdAt).toLocaleString() : ""}
          </div>
          <div className="blog-content" style={{ whiteSpace: "pre-wrap" }}>
            {blog.content}
          </div>
          {blog.imageUrl && (
            <div style={{ marginTop: 32 }}>
              <a
                href={blog.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: ".75rem",
                  color: "#666",
                  textDecoration: "none",
                }}
              >
                Bekijk originele afbeelding ↗
              </a>
            </div>
          )}
          <div style={{ marginTop: 24 }}>
            <Link to="/blogs" className="blog-back-link">
              ← Terug naar blogs
            </Link>
          </div>
        </article>
      )}
    </div>
  );
};

export default BlogDetail;
