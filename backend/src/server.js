import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";
import { syncStreamUsers } from "./lib/scripts/syncStreamUsers.js"; // ✅ import your helper

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontenddist/index.html"));
  });
}

// ✅ Wrap server start in async function to handle DB & Stream sync
const startServer = async () => {
  try {
    await connectDB(); // connect to MongoDB
    console.log("✅ MongoDB connected");

    // Optional: only sync in development or staging
    if (process.env.NODE_ENV !== "production") {
      await syncStreamUsers(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);
    }

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(" Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();
