import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { Chat, Message } from "../models/chatModel.js";
import { generateChatbotResponse } from "../utils/chatbot.js";
import sendEmail from "../utils/sendEmail.js";
import Logger from "../utils/logger.js";

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // chatId -> Set of userIds typing
const liveLocationTrackers = new Map(); // userId -> { carId, location, isActive }

// Cleanup function for socket connections
const cleanupSocketConnection = (socketToClean) => {
  try {
    if (socketToClean.userId) {
      activeUsers.delete(socketToClean.userId);
      Logger.info(`Cleaned up connection for user: ${socketToClean.userId}`);
    }

    // Remove from typing indicators
    typingUsers.forEach((userSet, chatId) => {
      userSet.delete(socketToClean.userId);
      if (userSet.size === 0) {
        typingUsers.delete(chatId);
      }
    });

    // Clean up live location tracking
    const tracker = liveLocationTrackers.get(socketToClean.userId);
    if (tracker) {
      socketToClean
        .to(`car-location:${tracker.carId}`)
        .emit("live-location-disabled", {
          carId: tracker.carId,
        });
      liveLocationTrackers.delete(socketToClean.userId);
    }

    // Disconnect the socket if still connected
    if (socketToClean.connected) {
      socketToClean.disconnect(true);
    }
  } catch (cleanupError) {
    Logger.error("Error during socket cleanup", cleanupError, {
      socketId: socketToClean.id,
      userId: socketToClean.userId,
    });
  }
};

export const initializeSocket = (server) => {
  // CORS configuration for Socket.io
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

  if (process.env.PRODUCTION_URL) {
    allowedOrigins.push(process.env.PRODUCTION_URL);
  }

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.indexOf(origin) !== -1 ||
          process.env.NODE_ENV === "development"
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization", "Content-Type"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    upgradeTimeout: 30000, // 30 seconds
    maxHttpBufferSize: 1e6, // 1MB
    compression: true,
    // Additional stability settings
    connectTimeout: 45000, // 45 seconds
    serveClient: false,
    // Handle connection retries gracefully
    forceNew: true,
    // Better error handling
    rememberUpgrade: false,
    // Reduce reconnection attempts to prevent spam
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Global error handler for socket.io
  io.on("error", (err) => {
    Logger.error("Socket.IO server error", err);
  });

  // Handle connection errors at the server level
  io.engine.on("connection_error", (err) => {
    Logger.error("Socket connection error", err, {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  // Enhanced error handling for connection stability
  io.use(async (socket, next) => {
    try {
      // Authentication middleware for Socket.io
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1] ||
        socket.handshake.query?.token;

      if (!token) {
        Logger.warn("Socket connection attempt without token", {
          socketId: socket.id,
          userAgent: socket.handshake.headers["user-agent"],
          ip: socket.handshake.address,
        });
        return next(
          new Error("Authentication required: Please provide a valid token")
        );
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (jwtError) {
        Logger.error("JWT verification error in socket", jwtError, {
          socketId: socket.id,
          errorType: jwtError.name,
        });

        // Handle specific JWT errors
        if (jwtError.name === "TokenExpiredError") {
          return next(
            new Error(
              "Authentication error: Token expired. Please refresh your session."
            )
          );
        } else if (jwtError.name === "JsonWebTokenError") {
          return next(new Error("Authentication error: Invalid token format."));
        } else {
          return next(
            new Error("Authentication error: Token verification failed.")
          );
        }
      }
    } catch (error) {
      Logger.error("Socket auth error", error, { socketId: socket.id });
      return next(new Error("Authentication error: " + error.message));
    }
  });

  // Enhanced connection handling with error recovery
  io.on("connection", (socket) => {
    // Set connection timeout and error handling
    socket.conn.on("error", (err) => {
      Logger.error("Socket connection error", err, {
        socketId: socket.id,
        userId: socket.userId,
        errorCode: err.code,
        errorMessage: err.message,
      });

      // Handle different error types appropriately
      switch (err.code) {
        case "ECONNRESET":
          Logger.warn(
            "Connection reset detected - client disconnected abruptly",
            {
              socketId: socket.id,
              userId: socket.userId,
            }
          );
          // Graceful cleanup for connection reset
          cleanupSocketConnection(socket);
          break;

        case "ECONNREFUSED":
          Logger.warn("Connection refused - network issue", {
            socketId: socket.id,
            userId: socket.userId,
          });
          cleanupSocketConnection(socket);
          break;

        case "ETIMEDOUT":
          Logger.warn("Connection timeout", {
            socketId: socket.id,
            userId: socket.userId,
          });
          cleanupSocketConnection(socket);
          break;

        default:
          Logger.error("Unhandled socket error", err, {
            socketId: socket.id,
            userId: socket.userId,
          });
          cleanupSocketConnection(socket);
          break;
      }
    });

    // Handle socket-level errors
    socket.on("error", (err) => {
      Logger.error("Socket-level error", err, {
        socketId: socket.id,
        userId: socket.userId,
      });

      // Don't immediately disconnect on all errors
      if (err.code === "ECONNRESET" || err.code === "ECONNREFUSED") {
        Logger.warn("Socket error detected, cleaning up connection", {
          socketId: socket.id,
          errorCode: err.code,
        });
        cleanupSocketConnection(socket);
      }
    });

    Logger.info(`User connected via socket`, {
      userId: socket.userId,
      socketId: socket.id,
    });

    // Store user's socket connection
    activeUsers.set(socket.userId, socket.id);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based room for notifications
    if (socket.user.role) {
      socket.join(`role:${socket.user.role}`);
      Logger.info(
        `User ${socket.userId} joined role room: role:${socket.user.role}`
      );
      console.log(
        `🔔 User ${socket.userId} with role ${socket.user.role} joined room role:${socket.user.role}`
      );
    } else {
      console.log(`🔔 User ${socket.userId} has no role defined`);
    }

    // If admin, join admin room
    if (socket.user.role === "admin") {
      socket.join("admin:room");
      Logger.info(`Admin connected: ${socket.userId}`);
    }

    // Join notifications room
    socket.on("join-notifications", () => {
      socket.join(`user:${socket.userId}`);
      Logger.info(`User ${socket.userId} joined notifications room`);
    });

    // Join all user's chat rooms (both support and car chats)
    socket.on("join-chats", async () => {
      try {
        console.log("🔵 join-chats event received for user:", socket.userId);
        const chats = await Chat.find({
          participants: { $in: [socket.userId] },
          chatType: { $in: ["support", "car"] },
        });

        console.log("🔵 Found chats for user:", {
          userId: socket.userId,
          chatCount: chats.length,
          chats: chats.map((c) => ({ _id: c._id, chatType: c.chatType })),
        });

        chats.forEach((chat) => {
          socket.join(`chat:${chat._id}`);
        });
        Logger.info(`User joined chat rooms`, {
          userId: socket.userId,
          chatCount: chats.length,
        });
      } catch (error) {
        Logger.error("Error joining chats", error, {
          userId: socket.userId,
        });
      }
    });

    // Join support chat room (for admin monitoring)
    socket.on("join-support-chat", async (chatId) => {
      try {
        if (!chatId) {
          Logger.warn("No chatId provided to join-support-chat", {
            userId: socket.userId,
          });
          return;
        }

        // Only admins can join support chat monitoring
        if (socket.user.role !== "admin") {
          Logger.warn("Non-admin attempted to join support chat", {
            chatId,
            userId: socket.userId,
            role: socket.user.role,
          });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          Logger.warn("Support chat not found", {
            chatId,
            userId: socket.userId,
          });
          return;
        }

        // Admins can join any support chat for monitoring
        if (chat.chatType === "support") {
          socket.join(`chat:${chatId}`);
          socket.emit("joined-support-chat", chatId);
          Logger.info(`Admin ${socket.userId} joined support chat ${chatId}`);
        } else {
          Logger.warn("Chat is not a support chat", {
            chatId,
            chatType: chat.chatType,
          });
        }
      } catch (error) {
        Logger.error("Error joining support chat", error, {
          chatId,
          userId: socket.userId,
        });
      }
    });

    // Join specific chat room
    socket.on("join-chat", async (chatId) => {
      try {
        console.log("🔵 Received join-chat event:", {
          chatId,
          userId: socket.userId,
          socketId: socket.id,
        });

        if (!chatId) {
          Logger.warn("No chatId provided to join-chat", {
            userId: socket.userId,
          });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          Logger.warn("Chat not found", { chatId, userId: socket.userId });
          return;
        }

        // Check if user is participant (convert to string for comparison)
        const userIdStr = socket.userId.toString();
        const isParticipant = chat.participants.some(
          (p) => p.toString() === userIdStr
        );

        console.log("🔵 Chat participant check:", {
          chatId,
          userId: socket.userId,
          isParticipant,
          chatParticipants: chat.participants.map((p) => p.toString()),
        });

        if (isParticipant) {
          socket.join(`chat:${chatId}`);
          socket.emit("joined-chat", chatId);
          Logger.info(`User ${socket.userId} joined chat ${chatId}`);
          console.log("🔵 Successfully joined chat room:", `chat:${chatId}`);
        } else {
          Logger.warn("User not a participant in chat", {
            chatId,
            userId: socket.userId,
          });
          console.log("🔴 User not a participant in chat:", {
            chatId,
            userId: socket.userId,
          });
        }
      } catch (error) {
        Logger.error("Error joining chat", error, {
          chatId,
          userId: socket.userId,
        });
      }
    });

    // Handle typing indicator
    socket.on("typing", async ({ chatId, isAdmin = false }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return;
        }

        // For admin monitoring, check if it's a support chat
        if (
          isAdmin &&
          socket.user.role === "admin" &&
          chat.chatType === "support"
        ) {
          // Admin typing in support chat - notify user participants
          socket.to(`chat:${chatId}`).emit("typing", {
            chatId,
            userId: socket.userId,
            isAdmin: true,
          });
          return;
        }

        // Regular user typing - check if participant
        const userIdStr = socket.userId.toString();
        const isParticipant = chat.participants.some(
          (p) => p.toString() === userIdStr
        );

        if (!isParticipant) {
          return;
        }

        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }
        typingUsers.get(chatId).add(socket.userId);

        // Notify other participants
        socket.to(`chat:${chatId}`).emit("typing", {
          chatId,
          userId: socket.userId,
          isAdmin: socket.user.role === "admin",
        });

        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          if (typingUsers.has(chatId)) {
            typingUsers.get(chatId).delete(socket.userId);
            if (typingUsers.get(chatId).size === 0) {
              typingUsers.delete(chatId);
            }
          }
          socket.to(`chat:${chatId}`).emit("stop-typing", {
            chatId,
            userId: socket.userId,
            isAdmin: socket.user.role === "admin",
          });
        }, 3000);
      } catch (error) {
        console.error("Error handling typing:", error);
      }
    });

    // Handle stop typing indicator
    socket.on("stop-typing", async ({ chatId, isAdmin = false }) => {
      try {
        if (typingUsers.has(chatId)) {
          typingUsers.get(chatId).delete(socket.userId);
          if (typingUsers.get(chatId).size === 0) {
            typingUsers.delete(chatId);
          }
        }

        socket.to(`chat:${chatId}`).emit("stop-typing", {
          chatId,
          userId: socket.userId,
          isAdmin: isAdmin || socket.user.role === "admin",
        });
      } catch (error) {
        console.error("Error handling stop typing:", error);
      }
    });

    // Handle sending message
    socket.on(
      "send-message",
      async ({ chatId, message, messageType = "text", attachments = [] }) => {
        try {
          console.log("🔵 Received send-message event:", {
            chatId,
            message,
            messageType,
            userId: socket.userId,
            socketId: socket.id,
          });

          if (!chatId || !message) {
            socket.emit("error", {
              message: "Chat ID and message are required",
            });
            return;
          }

          const chat = await Chat.findById(chatId);
          if (!chat) {
            socket.emit("error", { message: "Chat not found" });
            return;
          }

          // Check if user is participant (convert to string for comparison)
          const userIdStr = socket.userId.toString();
          const isParticipant = chat.participants.some(
            (p) => p.toString() === userIdStr
          );

          if (!isParticipant) {
            socket.emit("error", {
              message: "Access denied. You are not a participant in this chat.",
            });
            return;
          }

          // Create message
          const newMessage = await Message.create({
            chat: chatId,
            sender: socket.userId,
            message: message.trim(),
            messageType,
            attachments,
            isBot: false,
          });

          // Populate sender
          await newMessage.populate("sender", "name email avatar role");

          // Update chat
          chat.lastMessage = message.trim();
          chat.lastMessageAt = new Date();
          chat.isActive = true;

          // Update unread count for other participants
          chat.participants.forEach((participantId) => {
            if (participantId.toString() !== socket.userId) {
              const currentUnread =
                chat.unreadCount.get(participantId.toString()) || 0;
              chat.unreadCount.set(participantId.toString(), currentUnread + 1);
            }
          });

          await chat.save();

          console.log("🔵 Emitting new-message to room:", `chat:${chatId}`);
          console.log("🔵 New message details:", {
            messageId: newMessage._id,
            chatId,
            senderId: socket.userId,
            message: newMessage.message,
          });

          // Emit to all participants in the chat room
          io.to(`chat:${chatId}`).emit("new-message", {
            message: newMessage,
            chat: chat,
            chatId: chatId,
          });

          // Create and emit user notifications for chat participants (buyer / seller / dealer)
          try {
            const Notification = (
              await import("../models/notificationModel.js")
            ).default;

            const senderId = socket.userId.toString();
            const participantIds = chat.participants.map((p) => p.toString());
            const recipientIds = participantIds.filter((id) => id !== senderId);

            if (recipientIds.length > 0) {
              let car = null;
              if (chat.chatType === "car" && chat.car) {
                const Car = (await import("../models/carModel.js")).default;
                car = await Car.findById(chat.car).populate(
                  "postedBy",
                  "name email role"
                );
              }

              // Load recipient users (for role / email)
              const recipients = await User.find({
                _id: { $in: recipientIds },
              }).select("name email role");
              const recipientsMap = new Map(
                recipients.map((u) => [u._id.toString(), u])
              );

              const siteName = process.env.SITE_NAME || "Sello";
              const clientUrl =
                process.env.NODE_ENV === "production"
                  ? process.env.PRODUCTION_URL ||
                    process.env.CLIENT_URL?.split(",")[0]?.trim()
                  : process.env.CLIENT_URL?.split(",")[0]?.trim() ||
                    "http://localhost:5173";
              const emailEnabled =
                process.env.ENABLE_EMAIL_NOTIFICATIONS === "true";

              for (const recipientId of recipientIds) {
                const recipientUser = recipientsMap.get(recipientId);
                if (!recipientUser) continue;

                let title = "New Message";
                let messageText = "";
                let actionUrl = "";

                if (chat.chatType === "car") {
                  // Skip admin system notifications for car chats – focus on buyer/seller/dealer
                  if (recipientUser.role === "admin") continue;

                  const listingTitle = car?.title || "your listing";

                  // If this recipient is the listing owner (seller/dealer)
                  const isListingOwner =
                    car?.postedBy &&
                    car.postedBy._id.toString() === recipientId;

                  messageText = `${socket.user.name} sent you a message about "${listingTitle}"`;

                  // Seller/dealer sees seller chats page, buyers see generic chats
                  if (isListingOwner) {
                    actionUrl = `/seller/chats?chatId=${chatId}`;
                  } else {
                    actionUrl = `/chats?chatId=${chatId}`;
                  }
                } else {
                  // Support chat
                  if (recipientUser.role === "admin") {
                    // Admin receives support chat notification - direct to admin support chatbot
                    messageText = `${socket.user.name} sent you a support message`;
                    actionUrl = `/admin/support-chatbot/${chatId}`;
                  } else {
                    // Regular user receives support chat notification
                    messageText = `${socket.user.name} sent you a support message`;
                    actionUrl = `/support?chatId=${chatId}`;
                  }
                }

                // Create Notification document
                await Notification.create({
                  title,
                  message: messageText,
                  type: "info",
                  recipient: recipientId,
                  actionUrl,
                  actionText: "View Chat",
                });

                // Emit in-app notification via socket
                io.to(`user:${recipientId}`).emit("new-notification", {
                  title,
                  message: messageText,
                  chatId,
                  carId: car?._id || null,
                  actionUrl,
                });
              }
            }
          } catch (notifError) {
            console.error("Error creating chat notifications:", notifError);
          }

          // Try chatbot response only for support chats (not car chats)
          // Don't trigger chatbot if admin is responding
          // Chatbot disabled per user request
          if (socket.user.role !== "admin" && chat.chatType === "support") {
            setTimeout(async () => {
              try {
                const chatbotResponse = await generateChatbotResponse(
                  message,
                  chatId
                );
                if (chatbotResponse) {
                  // Create bot message
                  const botMessage = await Message.create({
                    chat: chatId,
                    sender: null, // Bot has no sender
                    message: chatbotResponse,
                    messageType: "text",
                    isBot: true,
                  });

                  // Update chat
                  chat.lastMessage = chatbotResponse;
                  chat.lastMessageAt = new Date();
                  await chat.save();

                  // Emit bot message
                  io.to(`chat:${chatId}`).emit("new-message", {
                    message: botMessage,
                    chat: chat,
                    chatId: chatId,
                  });
                }
              } catch (error) {
                console.error("Chatbot error:", error);
              }
            }, 1000); // 1 second delay for bot response
          } else if (socket.user.role === "admin") {
            // Admin message - update unread count for user
            chat.participants.forEach((participantId) => {
              if (participantId.toString() !== socket.userId) {
                const currentUnread =
                  chat.unreadCount.get(participantId.toString()) || 0;
                chat.unreadCount.set(
                  participantId.toString(),
                  currentUnread + 1
                );
              }
            });
            await chat.save();
          }
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Handle message seen
    socket.on("message-seen", async ({ messageId, chatId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        if (!message.seenBy.includes(socket.userId)) {
          message.seenBy.push(socket.userId);
          await message.save();

          // Emit seen status to chat
          io.to(`chat:${chatId}`).emit("message-seen", {
            messageId,
            seenBy: message.seenBy,
          });
        }
      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    });

    // Handle mark chat as read (Bulk)
    socket.on("mark-chat-read", async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        // Reset unread count for this user
        if (chat.unreadCount && chat.unreadCount.has(socket.userId)) {
          chat.unreadCount.set(socket.userId, 0);
          await chat.save();
        }

        // Mark all messages as seen by this user
        await Message.updateMany(
          { chat: chatId, seenBy: { $ne: socket.userId } },
          { $addToSet: { seenBy: socket.userId } }
        );

        // Emit update
        io.to(`chat:${chatId}`).emit("chat-read", {
          chatId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error("Error marking chat as read:", error);
      }
    });

    // Handle delete message
    socket.on("delete-message", async ({ messageId, chatId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Check if user owns the message or is admin
        if (
          message.sender.toString() !== socket.userId &&
          socket.user.role !== "admin"
        ) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Emit to chat
        io.to(`chat:${chatId}`).emit("message-deleted", {
          messageId,
          chatId,
        });
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // Live Location Tracking - Seller enables live location for a car
    socket.on("enable-live-location", async ({ carId, location }) => {
      try {
        if (!carId || !location || !location.coordinates) {
          socket.emit("error", { message: "Car ID and location are required" });
          return;
        }

        // Verify user owns the car
        const Car = (await import("../models/carModel.js")).default;
        const car = await Car.findById(carId);

        if (!car || car.postedBy.toString() !== socket.userId) {
          socket.emit("error", {
            message: "Unauthorized: You do not own this car",
          });
          return;
        }

        // Store live location tracking
        liveLocationTrackers.set(socket.userId, {
          carId,
          location: {
            type: "Point",
            coordinates: location.coordinates, // [longitude, latitude]
          },
          isActive: true,
          updatedAt: new Date(),
        });

        // Join car-specific room for location updates
        socket.join(`car-location:${carId}`);

        // Notify buyers viewing this car
        io.to(`car-location:${carId}`).emit("live-location-enabled", {
          carId,
          location: liveLocationTrackers.get(socket.userId).location,
        });

        socket.emit("live-location-enabled", { carId });
        Logger.info(
          `Live location enabled for car ${carId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Error enabling live location:", error);
        socket.emit("error", { message: "Failed to enable live location" });
      }
    });

    // Update live location (seller sends periodic updates)
    socket.on("update-live-location", ({ carId, location }) => {
      try {
        const tracker = liveLocationTrackers.get(socket.userId);
        if (!tracker || tracker.carId !== carId || !tracker.isActive) {
          socket.emit("error", {
            message: "Live location not enabled for this car",
          });
          return;
        }

        // Update location
        tracker.location = {
          type: "Point",
          coordinates: location.coordinates, // [longitude, latitude]
        };
        tracker.updatedAt = new Date();

        // Broadcast to buyers viewing this car
        io.to(`car-location:${carId}`).emit("live-location-update", {
          carId,
          location: tracker.location,
          updatedAt: tracker.updatedAt,
        });
      } catch (error) {
        console.error("Error updating live location:", error);
        socket.emit("error", { message: "Failed to update live location" });
      }
    });

    // Disable live location
    socket.on("disable-live-location", ({ carId }) => {
      try {
        if (!carId) {
          socket.emit("error", { message: "Car ID is required" });
          return;
        }

        // Check if user is the one who enabled live location
        const tracker = liveLocationTrackers.get(socket.userId);
        if (tracker && tracker.carId === carId && tracker.isActive) {
          tracker.isActive = false;
          liveLocationTrackers.delete(socket.userId);

          // Notify buyers
          io.to(`car-location:${carId}`).emit("live-location-disabled", {
            carId,
          });
          socket.emit("live-location-disabled", { carId });
          Logger.info(
            `Live location disabled for car ${carId} by user ${socket.userId}`
          );
        }
      } catch (error) {
        console.error("Error disabling live location:", error);
      }
    });

    // Buyer subscribes to live location updates for a car
    socket.on("subscribe-car-location", ({ carId }) => {
      try {
        socket.join(`car-location:${carId}`);

        // Send current location if available
        const tracker = Array.from(liveLocationTrackers.values()).find(
          (t) => t.carId === carId && t.isActive
        );

        if (tracker) {
          socket.emit("live-location-update", {
            carId,
            location: tracker.location,
            updatedAt: tracker.updatedAt,
          });
        }
      } catch (error) {
        console.error("Error subscribing to car location:", error);
      }
    });

    // Buyer unsubscribes from live location updates
    socket.on("unsubscribe-car-location", ({ carId }) => {
      try {
        socket.leave(`car-location:${carId}`);
      } catch (error) {
        console.error("Error unsubscribing from car location:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      Logger.info(`User disconnected: ${socket.userId}, reason: ${reason}`);
      cleanupSocketConnection(socket);
    });
  });

  return io;
};
