"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Basic middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
exports.default = app;
//# sourceMappingURL=test-server.js.map