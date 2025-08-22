"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const prisma = new client_1.PrismaClient();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});
// Import routes
const authRoutesSimple_1 = __importDefault(require("./routes/authRoutesSimple"));
// API routes
app.use("/api/auth", authRoutesSimple_1.default);
// Global error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    if (err.name === "ValidationError") {
        return res.status(400).json({
            error: "Validation Error",
            details: err.details || err.message,
        });
    }
    if (err.name === "UnauthorizedError") {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid token",
        });
    }
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
    });
});
// Handle 404 for all other routes
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
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
// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
});
exports.default = app;
//# sourceMappingURL=server.js.map