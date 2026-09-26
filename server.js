const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// -----------------------------
// Configuration
// -----------------------------
const VIBRATION_LIMIT = 20.0; // m/s²

// Middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// -----------------------------
// Health check
// -----------------------------
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        service: "Industrial IoT Dashboard",
        timestamp: new Date().toISOString()
    });
});

// -----------------------------
// ESP32 data endpoint
// -----------------------------
app.post("/api/data", (req, res) => {
    const { vibration, temperature, status } = req.body;

    // Validate payload
    if (
        typeof vibration !== "number" ||
        typeof temperature !== "number" ||
        typeof status !== "string"
    ) {
        return res.status(400).json({
            success: false,
            error: "Invalid payload. Expected vibration, temperature and status."
        });
    }

    const timestamp = new Date().toISOString();

    const alert = vibration > VIBRATION_LIMIT;

    const data = {
        vibration,
        temperature,
        status,
        alert,
        timestamp
    };

    console.log(
        `[${timestamp}] Vibration: ${vibration} m/s² | Temperature: ${temperature} °C | Status: ${status}`
    );

    // Send data to every connected dashboard
    io.emit("sensorData", data);

    // Send response to ESP32
    res.status(200).json({
        success: true,
        message: "Data received successfully",
        data
    });
});

// -----------------------------
// Socket.IO
// -----------------------------
io.on("connection", (socket) => {
    console.log(`Dashboard connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`Dashboard disconnected: ${socket.id}`);
    });
});

// -----------------------------
// Start server
// -----------------------------
server.listen(PORT, "0.0.0.0", () => {
    console.log(`
========================================
 Industrial IoT Dashboard
========================================
 Server: http://localhost:${PORT}
 Vibration limit: ${VIBRATION_LIMIT} m/s²
========================================
`);
});