import Log from "../models/Log.js";

// In-memory store for rate limiting: { ipAddress: { count, startTime } }
const ipTracker = new Map();

const WARNING_THRESHOLD = 60; // 60 hits per minute = Warning
const BLOCKED_THRESHOLD = 150; // 150 hits per minute = Blocked
const TIME_WINDOW_MS = 60 * 1000; // 1 minute window

// In-memory logs buffer for high-performance write optimization
const logBuffer = [];
const BUFFER_FLUSH_INTERVAL = 15000; // 15 seconds
const MAX_BUFFER_SIZE = 50; // Maximum items before a forced flush

const flushLogs = async () => {
  if (logBuffer.length === 0) return;
  const logsToInsert = [...logBuffer];
  logBuffer.length = 0; // Clear buffer immediately to prevent duplicates on concurrent calls

  try {
    // Bulk write logs to the database asynchronously
    await Log.insertMany(logsToInsert, { ordered: false });
  } catch (err) {
    console.error("Failed to flush traffic logs to database:", err);
  }
};

// Periodic background log flushing
setInterval(flushLogs, BUFFER_FLUSH_INTERVAL);

export const trafficLogger = async (req, res, next) => {
  try {
    let rawIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "";
    const ip = rawIp.split(",")[0].trim() || "Unknown";
    const currentTime = Date.now();
    const endpoint = req.originalUrl;
    const method = req.method;

    // Only log API requests, skip static files if any sneak in
    if (!endpoint.startsWith("/api/")) {
      return next();
    }

    // Rate Limiting Logic
    let tracker = ipTracker.get(ip);
    if (!tracker) {
      tracker = { count: 1, startTime: currentTime };
    } else {
      // Check if time window has passed
      if (currentTime - tracker.startTime > TIME_WINDOW_MS) {
        tracker = { count: 1, startTime: currentTime }; // Reset
      } else {
        tracker.count += 1;
      }
    }
    ipTracker.set(ip, tracker);

    // Determine Risk Level
    let riskLevel = "Safe";
    if (tracker.count >= BLOCKED_THRESHOLD) {
      riskLevel = "Blocked";
    } else if (tracker.count >= WARNING_THRESHOLD) {
      riskLevel = "Warning";
    }

    // Determine Action Name
    let action = `${method} ${endpoint}`;
    if (endpoint.includes("/api/products") && method === "GET") {
      action = "Viewed Product(s)";
    } else if (endpoint.includes("/api/auth/login") && method === "POST") {
      action = "Attempted Login";
    } else if (endpoint.includes("/api/orders") && method === "POST") {
      action = "Placed Order / Action";
    }

    // Collect user info if logged in (from authMiddleware if it runs before this, else from req.body/token)
    let user = req.user ? req.user._id : null;
    let email = req.user ? req.user.email : (req.body?.email || null);

    // Queue Log Entry in buffer instead of writing instantly
    logBuffer.push({
      ipAddress: ip,
      user,
      email,
      action: tracker.count >= BLOCKED_THRESHOLD ? `High Traffic Detected (${tracker.count}/min)` : action,
      riskLevel,
      method,
      endpoint,
      createdAt: new Date()
    });

    // Forced flush if buffer is filled
    if (logBuffer.length >= MAX_BUFFER_SIZE) {
      flushLogs();
    }

    // If completely blocked, reject request
    if (riskLevel === "Blocked") {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    next();
  } catch (error) {
    console.error("Traffic Logger Error:", error);
    next(); // Don't block requests if logger fails
  }
};
