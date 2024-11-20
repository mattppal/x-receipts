import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.REPLIT_DEV_DOMAIN || "https://x-receipts.replit.app",
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 requests per window
  message: {
    error: "Rate limit exceeded",
    details: "You can only generate 3 receipts every 24 hours",
    resetTime: null // Will be set dynamically
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"]?.toString();
    const ip = forwarded ? forwarded.split(',')[0] : req.ip;
    return ip;
  },
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + limiter.windowMs);
    res.status(429).json({
      error: "Rate limit exceeded",
      details: `Please try again after ${resetTime.toISOString()}`,
      resetTime: resetTime.toISOString()
    });
  },
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests
    return req.method === 'OPTIONS';
  }
});

// Apply rate limiting to API routes
app.use("/api/", limiter);

(async () => {
  registerRoutes(app);
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    console.log(`${formattedTime} [express] API server serving on port ${PORT}`);
  });
})();
