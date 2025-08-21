import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Test login endpoint
app.post("/api/auth/login", (req, res) => {
  res.json({
    success: true,
    message: "Test login endpoint working",
    data: req.body,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

export default app;
