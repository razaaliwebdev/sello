import http from "http";
import { app } from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocket } from "./socket/socketServer.js";
import { initializeRoles } from "./controllers/roleController.js";
import Logger from "./utils/logger.js";
import mongoose from "mongoose";
import validateEnvVars from "./utils/envValidator.js";
import { SERVER_CONFIG, LOG_CONFIG } from "./config/index.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Validate environment variables before starting server
validateEnvVars({ strict: process.env.NODE_ENV === "production" });

// Global error handlers to prevent server crashes
process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception (server will continue running)", error);
  console.error("❌ Uncaught Exception:", error.message);
});

process.on("unhandledRejection", (reason, promise) => {
  Logger.error("Unhandled Rejection (server will continue running)", {
    reason,
    promise,
  });
  console.error("❌ Unhandled Rejection:", reason);
});

// Handle SIGTERM and SIGINT gracefully
process.on("SIGTERM", () => {
  Logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  Logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Optional: Setup cron jobs for background tasks
let cronJobs = null;
if (process.env.ENABLE_CRON_JOBS === "true") {
  try {
    const cron = await import("node-cron");

    // Run subscription expiration daily at midnight
    cron.default.schedule("0 0 * * *", async () => {
      Logger.info("Running subscription expiration job...");
      try {
        const { default: runSubscriptionExpiration } = await import(
          "./scripts/subscriptionExpirationJob.js"
        );
      } catch (error) {
        Logger.error("Subscription expiration cron job failed", error);
      }
    });

    // Run saved search alerts every hour
    cron.default.schedule("0 * * * *", async () => {
      Logger.info("Running saved search alerts job...");
      try {
        const { sendSavedSearchAlerts } = await import(
          "./controllers/savedSearchController.js"
        );
        await sendSavedSearchAlerts();
      } catch (error) {
        Logger.error("Saved search alerts cron job failed", error);
      }
    });

    // Run listing expiry job daily at 2 AM
    cron.default.schedule("0 2 * * *", async () => {
      Logger.info("Running listing expiry job...");
      try {
        const { runExpireListings } = await import(
          "./scripts/expireOldListings.js"
        );
        await runExpireListings();
      } catch (error) {
        Logger.error("Listing expiry cron job failed", error);
      }
    });

    // Run refresh token cleanup daily at 3 AM
    cron.default.schedule("0 3 * * *", async () => {
      Logger.info("Running refresh token cleanup job...");
      try {
        const RefreshToken = (await import("./models/refreshTokenModel.js"))
          .default;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Delete expired tokens
        const expiredResult = await RefreshToken.deleteMany({
          expiresAt: { $lt: new Date() },
        });

        // Delete revoked tokens older than 30 days
        const revokedResult = await RefreshToken.deleteMany({
          isRevoked: true,
          revokedAt: { $lt: thirtyDaysAgo },
        });

        Logger.info("Refresh token cleanup completed", {
          expiredTokensDeleted: expiredResult.deletedCount,
          revokedTokensDeleted: revokedResult.deletedCount,
          totalDeleted: expiredResult.deletedCount + revokedResult.deletedCount,
        });
      } catch (error) {
        Logger.error("Refresh token cleanup cron job failed", error);
      }
    });

    Logger.info("Cron jobs initialized");
  } catch (error) {
    Logger.warn(
      "node-cron not installed. Background jobs disabled. Install with: npm install node-cron",
      { error: error.message }
    );
  }
}

// Start server regardless of DB connection status
const startServer = () => {
  try {
    const PORT = SERVER_CONFIG.PORT;
    const server = http.createServer(app);

    // Increase server timeout for long-running operations
    server.timeout = 60000; // 60 seconds
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds

    // Handle connection issues proactively
    server.on("connection", (socket) => {
      socket.setTimeout(90000); // 90 seconds

      socket.on("timeout", () => {
        Logger.warn("Socket timeout detected", {
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
        });
        socket.destroy();
      });

      socket.on("error", (error) => {
        Logger.error("Socket error", error, {
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
        });
      });
    });

    // Initialize Socket.io with error handling
    let io;
    try {
      io = initializeSocket(server);
      app.set("io", io);
    } catch (socketError) {
      Logger.error("Socket.io initialization error", socketError);
    }

    // Notification routes are already registered in app.js

    server.listen(PORT, () => {
      Logger.info(`🚀 Server running on PORT:${PORT}`);
      Logger.info(`📡 API available at http://localhost:${PORT}/api`);
      Logger.info(`🌍 Environment: ${SERVER_CONFIG.NODE_ENV}`);
      Logger.info(
        `📊 Database: ${
          mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
        }`
      );

      if (io) {
        Logger.info("🔌 Socket.io initialized");
      }
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        Logger.error(`Port ${PORT} is already in use`, error);
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`\n💡 To fix this:`);
        console.error(`   1. Kill process: taskkill /F /PID <PID>`);
        console.error(`   2. Find PID: netstat -ano | findstr :${PORT}`);
        console.error(`   3. Use different port: PORT=3001 npm run dev\n`);
        process.exit(1);
      } else if (error.code === "ECONNRESET" || error.code === "EPIPE") {
        Logger.warn("Connection reset by client", {
          code: error.code,
          message: error.message,
        });
      } else {
        Logger.error("Server error", error);
        console.error("❌ Server error:", error);
      }
    });
  } catch (error) {
    Logger.error("Failed to start server", error);
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Try to connect to DB, but start server anyway
connectDB()
  .then(() => {
    // Initialize default roles only if DB is connected
    if (mongoose.connection.readyState === 1) {
      try {
        initializeRoles();
        Logger.info("🔐 Database roles initialized");
      } catch (roleError) {
        Logger.error("Role initialization error", roleError);
        console.error("Role initialization error:", roleError);
      }
    }
    startServer();
  })
  .catch((error) => {
    Logger.error("DB connection error (server will start anyway)", error);
    console.error(
      "⚠️ DB connection error (server will start anyway):",
      error.message
    );
    // Start server even if DB connection fails
    startServer();
  });
