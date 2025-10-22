import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { router } from "./routes/routes.mjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.VITE_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/", router);

// MongoDB connection
const mongoUri =
  "mongodb+srv://admin:Save261128@savemyphone.crauq01.mongodb.net/Savemyphone?retryWrites=true&w=majority";
let db;

MongoClient.connect(mongoUri)
  .then((client) => {
    db = client.db("savemyphone");
    console.log("✅ Connected to MongoDB Atlas successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB Connection Error:", error.message);
  });

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

export { db };
