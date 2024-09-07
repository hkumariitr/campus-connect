import path from "path";
import { fileURLToPath } from 'url';
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { app, server } from "./socket/socket.js";
import job from "./cron/cron.js";
import fs from 'fs';  // Add this line

dotenv.config();

connectDB();
job.start();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary configured with cloud name:", process.env.CLOUDINARY_CLOUD_NAME);

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
  console.log("Frontend build path:", frontendBuildPath);
  
  try {
    const directoryContents = fs.readdirSync(frontendBuildPath);
    console.log("Directory contents:", directoryContents);

    app.use(express.static(frontendBuildPath));

    app.get("*", (req, res) => {
      const indexPath = path.join(frontendBuildPath, "index.html");
      console.log("Attempting to serve:", indexPath);
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("index.html not found");
      }
    });
  } catch (error) {
    console.error("Error accessing frontend build:", error);
  }
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));