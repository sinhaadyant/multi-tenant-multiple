import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { AuthService } from "./services/authService";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const authService = new AuthService();

// Basic middleware
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:4200"],
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Email and password are required",
      });
    }

    // Get the default tenant ID from database
    const defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
    });

    if (!defaultTenant) {
      return res.status(500).json({
        error: "Server Error",
        message: "Default tenant not found",
      });
    }

    const result = await authService.login(
      {
        email,
        password,
        rememberMe,
        tenantId: defaultTenant.id,
      },
      req.ip,
      req.get("User-Agent")
    );

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      error: "Authentication Failed",
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, invitationToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Email and password are required",
      });
    }

    // Get the default tenant ID from database
    const defaultTenant = await prisma.tenant.findUnique({
      where: { slug: "default" },
    });

    if (!defaultTenant) {
      return res.status(500).json({
        error: "Server Error",
        message: "Default tenant not found",
      });
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      tenantId: defaultTenant.id,
      invitationToken,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      error: "Registration Failed",
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
});

app.post("/api/auth/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Verification token is required",
      });
    }

    const result = await authService.verifyEmail(token);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({
      error: "Email Verification Failed",
      message:
        error instanceof Error ? error.message : "Email verification failed",
    });
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🔐 Login endpoint: http://localhost:${port}/api/auth/login`);
  console.log(
    `📝 Register endpoint: http://localhost:${port}/api/auth/register`
  );
});

export default app;
