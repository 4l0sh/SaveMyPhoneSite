import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { router } from "./routes/routes.mjs";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
// Use PORT in hosting environments (Render/Heroku), fall back to dev vars
const port = process.env.PORT || process.env.VITE_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Mount API under /api to avoid static SPA fallback collisions
app.use("/api", router);

// MongoDB connection (from environment only)
const mongoUri = process.env.MONGO_URI || process.env.VITE_MONGO_URI || "";
if (!mongoUri) {
  console.error(
    "❌ Missing Mongo connection string. Set MONGO_URI (preferred) or VITE_MONGO_URI in your environment."
  );
  // Fail fast to avoid starting the server without a database
  process.exit(1);
}
let db;

MongoClient.connect(mongoUri)
  .then((client) => {
    db = client.db("savemyphone");
    console.log("✅ Connected to MongoDB Atlas successfully");

    // All user passwords should be bcrypt-hashed at this point.
  })
  .catch((error) => {
    console.error("❌ MongoDB Connection Error:", error.message);
  });

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

export { db };

// --- Serve built frontend (SPA) when available ---
// This enables deep-linking like /iphonescreens in production.
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.join(__dirname, "dist");
  const indexHtml = path.join(distDir, "index.html");

  if (fs.existsSync(indexHtml)) {
    app.use(express.static(distDir));

    // Catch-all: send index.html for non-API routes to support React Router
    app.get("*", (req, res, next) => {
      // Allow API calls to pass through
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(indexHtml);
    });
    console.log(
      "🧩 SPA fallback enabled: serving dist/index.html for deep links"
    );
  }
} catch (e) {
  // Non-fatal if dist is not present on this server
}
