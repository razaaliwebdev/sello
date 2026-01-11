import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail.js";

/**
 * Create Notification
 */
export const createNotification = async (req, res) => {
  try {
    console.log("🔔 Creating notification - User role:", req.user.role);
    console.log("🔔 Request body:", req.body);

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create notifications.",
      });
    }

    const {
      title,
      message,
      type,
      recipient,
      targetAudience,
      actionUrl,
      actionText,
      expiresAt,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    // Determine targetRole based on targetAudience
    let targetRole = null;
    if (targetAudience && targetAudience !== "all" && !recipient) {
      // Map targetAudience to role (matching User model roles: "individual", "dealer", "admin")
      const roleMap = {
        buyers: "individual", // Buyers are individuals
        sellers: "individual", // Sellers are individuals
        dealers: "dealer", // Dealers
        admins: "admin", // Admins
      };
      targetRole = roleMap[targetAudience] || null;
    }

    let notifications = [];
    const notificationData = {
      title: title.trim(),
      message,
      type: type || "info",
      actionUrl: actionUrl || null,
      actionText: actionText || null,
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    // If specific recipient, create single notification
    if (recipient) {
      // If recipient is an email, find the user first
      let recipientUser = null;
      if (typeof recipient === "string" && recipient.includes("@")) {
        recipientUser = await User.findOne({ email: recipient });
        if (!recipientUser) {
          return res.status(400).json({
            success: false,
            message: `User with email "${recipient}" not found.`,
          });
        }
        recipient = recipientUser._id;
      }

      const notification = await Notification.create({
        ...notificationData,
        recipient: recipient,
        targetRole: null,
      });
      notifications.push(notification);
    }
    // If targetAudience is "all", create a single broadcast notification
    else if (targetAudience === "all") {
      console.log("Creating single broadcast notification for all users");

      const notification = await Notification.create({
        ...notificationData,
        recipient: null, // null means broadcast to all users
        targetRole: null,
      });
      notifications.push(notification);
      console.log("Broadcast notification created:", notification._id);
    }
    // If role-based, create notification for each user with that role
    else if (targetRole) {
      const users = await User.find({
        role: targetRole,
        status: "active",
        verified: true,
      }).select("_id email name");

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No active users found with role "${targetRole}" to send notifications to.`,
        });
      }

      // Create notification for each user in batches
      const batchSize = 100;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchPromises = batch.map((user) =>
          Notification.create({
            ...notificationData,
            recipient: user._id,
            targetRole: targetRole,
          })
        );
        const batchNotifications = await Promise.all(batchPromises);
        notifications.push(...batchNotifications);
      }
    }
    // Fallback: create single broadcast notification (for backward compatibility)
    else {
      const notification = await Notification.create({
        ...notificationData,
        recipient: null,
        targetRole: null,
      });
      notifications.push(notification);
    }

    // Emit notification via socket.io
    try {
      const io = req.app.get("io");
      if (io) {
        console.log("🔔 Socket.io available, emitting notification...");
        console.log("🔔 Target audience:", targetAudience);
        console.log("🔔 Notifications created:", notifications.length);

        // Handle broadcast notifications
        if (
          targetAudience === "all" &&
          notifications.length > 0 &&
          notifications[0].recipient === null
        ) {
          console.log("🔔 Emitting broadcast notification to all users");
          // Emit to all connected users (excluding admins for broadcast)
          const roles = ["individual", "dealer"];
          roles.forEach((role) => {
            console.log(`🔔 Emitting to role: ${role}`);
            io.to(`role:${role}`).emit("new-notification", {
              _id: notifications[0]._id,
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type,
              actionUrl: notificationData.actionUrl,
              actionText: notificationData.actionText,
              createdAt: notifications[0].createdAt,
            });
          });
        }
        // Handle individual notifications
        else {
          notifications.forEach((notification) => {
            if (notification.recipient) {
              console.log(
                `🔔 Emitting notification to user: ${notification.recipient}`
              );
              io.to(`user:${notification.recipient}`).emit("new-notification", {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                actionUrl: notification.actionUrl,
                actionText: notification.actionText,
                createdAt: notification.createdAt,
              });
            }
          });
        }

        // Also emit to admin room for tracking
        if (notifications.length > 0) {
          io.to("admin:room").emit("new-notification", {
            _id: notifications[0]._id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            actionUrl: notificationData.actionUrl,
            actionText: notificationData.actionText,
            createdAt: notifications[0].createdAt,
            totalRecipients:
              targetAudience === "all" ? "All Users" : notifications.length,
          });
        }
      } else {
        console.log("Socket.io not available in notification controller");
      }
    } catch (socketError) {
      console.error("Error emitting notification via socket:", socketError);
      // Don't fail the request if socket emission fails
    }

    // Email notifications disabled - only in-app notifications
    // if (process.env.ENABLE_EMAIL_NOTIFICATIONS === "true") {
    //   try {
    //     // Collect unique recipient IDs from created notifications
    //     const recipientIds = Array.from(
    //       new Set(
    //         notifications
    //           .filter((n) => n.recipient)
    //           .map((n) => n.recipient.toString())
    //       )
    //     );

    //     if (recipientIds.length > 0) {
    //       const users = await User.find({
    //         _id: { $in: recipientIds },
    //       }).select("email name");

    //       const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    //       const siteName = process.env.SITE_NAME || "Sello";
    //       const clientUrl =
    //         process.env.NODE_ENV === "production"
    //           ? process.env.PRODUCTION_URL ||
    //             process.env.CLIENT_URL?.split(",")[0]?.trim()
    //           : process.env.CLIENT_URL?.split(",")[0]?.trim() ||
    //             "http://localhost:5173";

    //       for (const notif of notifications) {
    //         if (!notif.recipient) continue;
    //         const user = userMap.get(notif.recipient.toString());
    //         if (!user?.email) continue;

    //         const subject = notif.title;
    //         const actionHref = notif.actionUrl
    //           ? `${clientUrl}${notif.actionUrl}`
    //           : null;

    //         const html = `
    //                         <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    //                             <h2 style="color:#111827;margin-bottom:8px;">${siteName} – ${
    //               notif.title
    //             }</h2>
    //                             <p style="margin:0 0 12px 0;">Hi ${
    //                               user.name || ""
    //                             },</p>
    //                             <p style="margin:0 0 16px 0;">${
    //                               notif.message
    //                             }</p>
    //                             ${
    //                               actionHref
    //                                 ? `<p style="margin:0 0 16px 0;">
    //                                               <a href="${actionHref}" style="display:inline-block;padding:10px 18px;background:#F97316;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;">
    //                                                   ${
    //                                                     notif.actionText ||
    //                                                     "View details"
    //                                                   }
    //                                               </a>
    //                                        </p>`
    //                                 : ""
    //                             }
    //                             <p style="font-size:12px;color:#6B7280;margin-top:24px;">
    //                                 You are receiving this because you have an account on ${siteName}.
    //                             </p>
    //                         </div>
    //                     `;

    //         try {
    //           await sendEmail(user.email, subject, html);
    //         } catch (emailError) {
    //           // Log and continue – email failures shouldn't break notification API
    //           console.error(
    //             `Notification email error for user ${user._id}:`,
    //             emailError.message
    //           );
    //         }
    //       }
    //     } catch (emailBlockError) {
    //       console.error(
    //         "Bulk notification email error:",
    //         emailBlockError.message
    //       );
    //     }
    // }

    return res.status(201).json({
      success: true,
      message: `Notification created and sent successfully.`,
      data: {
        notification: notifications[0], // Return the created notification
        count: notifications.length,
      },
    });
  } catch (error) {
    console.error("Create Notification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get All Notifications (Admin)
 */
export const getAllNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all notifications.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { type, recipient, isRead } = req.query;

    const query = {};
    if (type) query.type = type;
    if (recipient) query.recipient = recipient;
    if (isRead !== undefined) query.isRead = isRead === "true";

    const notifications = await Notification.find(query)
      .populate("recipient", "name email")
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get All Notifications Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get User Notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    console.log("🔍 getUserNotifications called");
    console.log("🔍 req.user:", req.user ? "exists" : "undefined");
    console.log("🔍 req.user._id:", req.user ? req.user._id : "undefined");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { isRead } = req.query;

    // Get user's personal notifications and broadcast notifications
    const finalQuery = {
      $or: [
        { recipient: req.user._id }, // Personal notifications
        { recipient: null }, // Broadcast notifications for all users
      ],
    };

    if (isRead !== undefined) {
      finalQuery.isRead = isRead === "true";
    }

    console.log("🔍 finalQuery:", JSON.stringify(finalQuery, null, 2));

    const notifications = await Notification.find(finalQuery)
      .populate("createdBy", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    console.log("🔍 Notifications found:", notifications.length);

    // Simple count queries
    const totalQuery = {
      $or: [{ recipient: req.user._id }, { recipient: null }],
    };
    const total = await Notification.countDocuments(totalQuery);

    const unreadQuery = {
      $or: [
        { recipient: req.user._id, isRead: false },
        { recipient: null, isRead: false },
      ],
    };
    const unreadCount = await Notification.countDocuments(unreadQuery);

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ getUserNotifications Error:", error.message);
    console.error("❌ Stack:", error.stack);
    const Logger = (await import("../utils/logger.js")).default;
    Logger.error("Get User Notifications Error", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Mark Notification as Read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    // Check if user has access to this notification
    // Users can access: 1) Personal notifications sent to them, 2) Broadcast notifications (recipient: null)
    if (
      notification.recipient &&
      notification.recipient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this notification.",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Mark All as Read
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipient: req.user._id }, // User's personal notifications
          { recipient: null }, // Broadcast notifications for all users
        ],
        isRead: false, // Only unread notifications
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Delete Notification
 */
export const deleteNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete notifications.",
      });
    }

    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    await notification.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
