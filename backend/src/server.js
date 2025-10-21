import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import helmet from "helmet";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";
import { syncStreamUsers } from "./lib/scripts/syncStreamUsers.js";

const app = express(); // <-- Must initialize app FIRST
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// ---------------------- MIDDLEWARE ----------------------

// Helmet + CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"], // needed for some WebRTC/video libs
        connectSrc: ["'self'", "wss:", "https:"], // allow websockets and API calls
        imgSrc: ["'self'", "data:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: ["'self'"],
      },
    },
  })
);

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// JSON + Cookies
app.use(express.json());
app.use(cookieParser());

// ---------------------- ROUTES ----------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// ---------------------- PRODUCTION FRONTEND ----------------------
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// ---------------------- SERVER START ----------------------
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    if (process.env.NODE_ENV !== "production") {
      await syncStreamUsers(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();
