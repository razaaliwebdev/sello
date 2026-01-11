import Promotion from "../models/promotionModel.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import sendEmail from "../utils/sendEmail.js";
import Logger from "../utils/logger.js";
import { EMAIL_CONFIG, SITE_CONFIG } from "../config/index.js";

/**
 * Create Promotion
 */
export const createPromotion = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create promotions.",
      });
    }

    const {
      title,
      description,
      promoCode,
      discountType,
      discountValue,
      usageLimit,
      startDate,
      endDate,
      targetAudience,
      status,
      minPurchaseAmount,
      maxDiscountAmount,
    } = req.body;

    // Validation
    if (
      !title ||
      !promoCode ||
      !discountType ||
      !discountValue ||
      !usageLimit ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    if (end < new Date()) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be in the past.",
      });
    }

    // Validate discount value
    if (
      discountType === "percentage" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100.",
      });
    }

    if (discountType === "fixed" && discountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount must be greater than 0.",
      });
    }

    // Check if promo code already exists
    const existingPromotion = await Promotion.findOne({
      promoCode: promoCode.toUpperCase().trim(),
    });

    if (existingPromotion) {
      return res.status(409).json({
        success: false,
        message: "Promo code already exists. Please use a different code.",
      });
    }

    const promotion = await Promotion.create({
      title: title.trim(),
      description: description || "",
      promoCode: promoCode.toUpperCase().trim(),
      discountType,
      discountValue: parseFloat(discountValue),
      usageLimit: parseInt(usageLimit),
      startDate: start,
      endDate: end,
      targetAudience: targetAudience || "all",
      status: status || "active",
      minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
      maxDiscountAmount: maxDiscountAmount
        ? parseFloat(maxDiscountAmount)
        : null,
      createdBy: req.user._id,
    });

    // Send email notifications and create in-app notifications
    await sendPromotionNotifications(promotion, req.user);

    return res.status(201).json({
      success: true,
      message: "Promotion created successfully and notifications sent.",
      data: promotion,
    });
  } catch (error) {
    console.error("Create Promotion Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Promo code already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get All Promotions
 */
export const getAllPromotions = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all promotions.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, search, targetAudience } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (targetAudience) {
      query.targetAudience = targetAudience;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { promoCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const promotions = await Promotion.find(query)
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Promotion.countDocuments(query);

    // Get statistics
    const activePromotions = await Promotion.countDocuments({
      status: "active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    });

    const expiredPromotions = await Promotion.countDocuments({
      $or: [{ status: "expired" }, { endDate: { $lt: new Date() } }],
    });

    return res.status(200).json({
      success: true,
      message: "Promotions retrieved successfully.",
      data: {
        promotions,
        statistics: {
          total,
          active: activePromotions,
          expired: expiredPromotions,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get All Promotions Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get Single Promotion
 */
export const getPromotionById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view promotions.",
      });
    }

    const { promotionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion ID.",
      });
    }

    const promotion = await Promotion.findById(promotionId).populate(
      "createdBy",
      "name email"
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promotion retrieved successfully.",
      data: promotion,
    });
  } catch (error) {
    console.error("Get Promotion Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Update Promotion
 */
export const updatePromotion = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update promotions.",
      });
    }

    const { promotionId } = req.params;
    const {
      title,
      description,
      promoCode,
      discountType,
      discountValue,
      usageLimit,
      startDate,
      endDate,
      targetAudience,
      status,
      minPurchaseAmount,
      maxDiscountAmount,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion ID.",
      });
    }

    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found.",
      });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date.",
        });
      }
    }

    // Check if promo code is being changed and if it already exists
    if (promoCode && promoCode.toUpperCase().trim() !== promotion.promoCode) {
      const existingPromotion = await Promotion.findOne({
        promoCode: promoCode.toUpperCase().trim(),
        _id: { $ne: promotionId },
      });

      if (existingPromotion) {
        return res.status(409).json({
          success: false,
          message: "Promo code already exists. Please use a different code.",
        });
      }
    }

    // Update fields
    if (title) promotion.title = title.trim();
    if (description !== undefined) promotion.description = description;
    if (promoCode) promotion.promoCode = promoCode.toUpperCase().trim();
    if (discountType) promotion.discountType = discountType;
    if (discountValue !== undefined)
      promotion.discountValue = parseFloat(discountValue);
    if (usageLimit !== undefined) promotion.usageLimit = parseInt(usageLimit);
    if (startDate) promotion.startDate = new Date(startDate);
    if (endDate) promotion.endDate = new Date(endDate);
    if (targetAudience) promotion.targetAudience = targetAudience;
    if (status) promotion.status = status;
    if (minPurchaseAmount !== undefined)
      promotion.minPurchaseAmount = parseFloat(minPurchaseAmount);
    if (maxDiscountAmount !== undefined)
      promotion.maxDiscountAmount = maxDiscountAmount
        ? parseFloat(maxDiscountAmount)
        : null;

    // Auto-update status based on dates
    const now = new Date();
    if (promotion.endDate < now) {
      promotion.status = "expired";
    }

    await promotion.save();

    return res.status(200).json({
      success: true,
      message: "Promotion updated successfully.",
      data: promotion,
    });
  } catch (error) {
    console.error("Update Promotion Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Promo code already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Delete Promotion
 */
export const deletePromotion = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete promotions.",
      });
    }

    const { promotionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(promotionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion ID.",
      });
    }

    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found.",
      });
    }

    await promotion.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Promotion deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Promotion Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get Promotion Statistics
 */
export const getPromotionStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view promotion statistics.",
      });
    }

    const [
      totalPromotions,
      activePromotions,
      expiredPromotions,
      todayPromotions,
    ] = await Promise.all([
      Promotion.countDocuments({}),
      Promotion.countDocuments({
        status: "active",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $expr: { $lt: ["$usedCount", "$usageLimit"] },
      }),
      Promotion.countDocuments({
        $or: [{ status: "expired" }, { endDate: { $lt: new Date() } }],
      }),
      Promotion.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
    ]);

    // Get total usage across all promotions
    const totalUsage = await Promotion.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$usedCount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Promotion statistics retrieved successfully.",
      data: {
        promotions: {
          total: totalPromotions,
          active: activePromotions,
          expired: expiredPromotions,
          today: todayPromotions,
        },
        usage: {
          total: totalUsage[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error("Get Promotion Stats Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Validate Promo Code (Public endpoint for users)
 */
export const validatePromoCode = async (req, res) => {
  try {
    const { promoCode, amount } = req.body;

    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required.",
      });
    }

    const promotion = await Promotion.findOne({
      promoCode: promoCode.toUpperCase().trim(),
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Invalid promo code.",
      });
    }

    // Check if promotion can be used
    if (!promotion.canBeUsed()) {
      return res.status(400).json({
        success: false,
        message: "This promo code is no longer valid.",
      });
    }

    // Check minimum purchase amount
    if (
      amount &&
      promotion.minPurchaseAmount > 0 &&
      amount < promotion.minPurchaseAmount
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${promotion.minPurchaseAmount} required.`,
      });
    }

    // Calculate discount
    const discount = promotion.calculateDiscount(amount || 0);

    return res.status(200).json({
      success: true,
      message: "Promo code is valid.",
      data: {
        promotion: {
          _id: promotion._id,
          title: promotion.title,
          promoCode: promotion.promoCode,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          maxDiscountAmount: promotion.maxDiscountAmount,
        },
        discount,
      },
    });
  } catch (error) {
    console.error("Validate Promo Code Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get Active Promotions (Public endpoint for users)
 */
export const getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
      isActive: true,
    })
      .select(
        "title description promoCode discountType discountValue minPurchaseAmount maxDiscountAmount startDate endDate usageLimit usedCount"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Active promotions retrieved successfully.",
      data: promotions,
    });
  } catch (error) {
    Logger.error("Get Active Promotions Error", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Apply Promo Code (Used during checkout/purchase)
 */
export const applyPromoCode = async (req, res) => {
  try {
    const { promoCode, amount, userId } = req.body;

    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required.",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required.",
      });
    }

    const promotion = await Promotion.findOne({
      promoCode: promoCode.toUpperCase().trim(),
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Invalid promo code.",
      });
    }

    // Check if promotion can be used
    if (!promotion.canBeUsed()) {
      return res.status(400).json({
        success: false,
        message: "This promo code is no longer valid.",
      });
    }

    // Check minimum purchase amount
    if (
      promotion.minPurchaseAmount > 0 &&
      amount < promotion.minPurchaseAmount
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${promotion.minPurchaseAmount} required.`,
      });
    }

    // Calculate discount
    const discount = promotion.calculateDiscount(amount);

    // Update usage count
    await Promotion.findByIdAndUpdate(promotion._id, {
      $inc: { usedCount: 1 },
    });

    Logger.info(`[Promotion] Promo code applied successfully`, {
      promotionId: promotion._id,
      promoCode: promotion.promoCode,
      userId: userId || "anonymous",
      originalAmount: amount,
      discountAmount: discount,
      finalAmount: amount - discount,
      newUsedCount: promotion.usedCount + 1,
    });

    return res.status(200).json({
      success: true,
      message: "Promo code applied successfully!",
      data: {
        promotion: {
          _id: promotion._id,
          title: promotion.title,
          promoCode: promotion.promoCode,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          maxDiscountAmount: promotion.maxDiscountAmount,
        },
        originalAmount: amount,
        discount,
        finalAmount: amount - discount,
        savingsPercentage: ((discount / amount) * 100).toFixed(1),
      },
    });
  } catch (error) {
    Logger.error("Apply Promo Code Error", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Send Promotion Notifications (Email + In-App)
 */
const sendPromotionNotifications = async (promotion, adminUser) => {
  try {
    // Starting notification process for promotion

    // Get target users based on promotion targetAudience
    let targetUsers = [];
    const siteName = process.env.SITE_NAME || "Sello";
    const clientUrl = EMAIL_CONFIG.getFrontendUrl();

    // Determine user query based on targetAudience
    let userQuery = {}; // Default: all users (including admins for testing)

    if (promotion.targetAudience === "buyers") {
      userQuery = { role: "individual" };
    } else if (promotion.targetAudience === "sellers") {
      userQuery = { role: "seller" };
    } else if (promotion.targetAudience === "dealers") {
      userQuery = { role: "dealer" };
    }

    // Only get active/verified users for better deliverability
    targetUsers = await User.find(userQuery)
      .select("_id email name verified status")
      .limit(1000); // Limit to prevent overwhelming

    // Found users to notify for target audience
    Logger.info(
      `[Promotion] User query executed for target audience: ${promotion.targetAudience}`,
      {
        promotionId: promotion._id,
        targetAudience: promotion.targetAudience,
        userQuery: JSON.stringify(userQuery),
        totalUsersFound: targetUsers.length,
      }
    );

    if (targetUsers.length === 0) {
      Logger.warn(
        `[Promotion] No users found to notify for target audience: ${promotion.targetAudience}`,
        {
          promotionId: promotion._id,
          targetAudience: promotion.targetAudience,
          userQuery: JSON.stringify(userQuery),
          suggestion:
            "Check if users exist in database with the specified role",
        }
      );

      // Still create a system notification for admins that promotion was created but no users were notified
      try {
        await Notification.create({
          title: `📢 Promotion Created - No Users Notified`,
          message: `Promotion "${promotion.title}" was created but no users found for target audience: ${promotion.targetAudience}`,
          type: "warning",
          recipient: adminUser._id,
          targetRole: null,
          actionUrl: "/admin/promotions", // Point to admin promotions page
          actionText: "View Promotion",
          createdBy: adminUser._id,
        });
        Logger.info(
          `[Promotion] Created admin notification about no users found`,
          {
            promotionId: promotion._id,
            targetAudience: promotion.targetAudience,
          }
        );
      } catch (notificationError) {
        Logger.error(
          `[Promotion] Failed to create admin notification`,
          notificationError,
          {
            promotionId: promotion._id,
          }
        );
      }

      return;
    }

    // Create in-app notifications
    const notificationPromises = targetUsers.map(async (user) => {
      try {
        const notification = await Notification.create({
          title: `🎉 New Promotion: ${promotion.title}`,
          message: `Use code ${promotion.promoCode} to get ${
            promotion.discountType === "percentage"
              ? promotion.discountValue + "%"
              : "$" + promotion.discountValue
          } off!${
            promotion.minPurchaseAmount > 0
              ? ` Minimum purchase: $${promotion.minPurchaseAmount}`
              : ""
          }`,
          type: "promotion",
          recipient: user._id,
          targetRole: null,
          actionUrl: "/", // Point to home page instead of non-existent promotions page
          actionText: "View Details",
          createdBy: adminUser._id,
          expiresAt: promotion.endDate,
          metadata: {
            promotionId: promotion._id,
            title: promotion.title,
            description: promotion.description,
            promoCode: promotion.promoCode,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            minPurchaseAmount: promotion.minPurchaseAmount,
            maxDiscountAmount: promotion.maxDiscountAmount,
            usageLimit: promotion.usageLimit,
            usedCount: promotion.usedCount,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
            status: promotion.status,
            targetAudience: promotion.targetAudience,
          },
        });
        return notification;
      } catch (error) {
        Logger.error(
          `[Promotion] Failed to create notification for user ${user._id}`,
          error,
          {
            userId: user._id,
            promotionId: promotion._id,
            userEmail: user.email,
          }
        );
        return { success: true, email: user.email };
      }
    });

    const successfulNotifications = await Promise.all(notificationPromises);
    const filteredNotifications = successfulNotifications.filter(
      (n) => n !== null
    );

    Logger.info(
      `[Promotion] Created ${filteredNotifications.length} in-app notifications`,
      {
        promotionId: promotion._id,
        totalUsers: targetUsers.length,
        successfulNotifications: filteredNotifications.length,
      }
    );

    // Send email notifications if enabled
    let successfulEmails = [];
    if (EMAIL_CONFIG.ENABLED) {
      if (targetUsers.length > 0) {
        Logger.info(
          `[Promotion] Sending email notifications to ${targetUsers.length} users`,
          {
            promotionId: promotion._id,
            totalEmails: targetUsers.length,
            targetAudience: promotion.targetAudience,
          }
        );

        const emailPromises = targetUsers.map(async (user) => {
          if (!user.email || !user.verified) {
            return null; // Skip unverified users or users without email
          }

          try {
            const subject = `🎉 Exclusive Promotion: ${promotion.title}`;
            const discountText =
              promotion.discountType === "percentage"
                ? `${promotion.discountValue}% OFF`
                : `$${promotion.discountValue} OFF`;

            const html = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="color:#111827;margin-bottom:8px;">🎉 Exclusive Promotion Available!</h2>
                <p style="margin:0 0 12px 0;">Hi ${user.name || "there"},</p>
                <p style="margin:0 0 16px 0;">We're excited to offer you an exclusive promotion with great savings!</p>
                
                <div style="background:#F3F4F6;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #F97316;">
                    <h3 style="color:#111827;margin:0 0 12px 0;font-size:18px;">${
                      promotion.title
                    }</h3>
                    ${
                      promotion.description
                        ? `<p style="margin:0 0 16px 0;color:#6B7280;">${promotion.description}</p>`
                        : ""
                    }
                    <div style="background:#FFFFFF;padding:16px;border-radius:6px;border:2px dashed #F97316;text-align:center;margin:16px 0;">
                        <p style="margin:0 0 8px 0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Your Promo Code</p>
                        <p style="margin:0;font-size:24px;font-weight:700;color:#F97316;font-family:'Courier New',monospace;letter-spacing:2px;">${
                          promotion.promoCode
                        }</p>
                    </div>
                    <p style="margin:0 0 8px 0;"><strong>Your Discount:</strong> <span style="color:#059669;font-weight:700;">${discountText}</span></p>
                    ${
                      promotion.minPurchaseAmount > 0
                        ? `<p style="margin:0 0 8px 0;"><strong>Min Purchase:</strong> <span style="color:#7C3AED;font-weight:700;">$${promotion.minPurchaseAmount}</span></p>`
                        : ""
                    }
                    <p style="margin:0 0 8px 0;"><strong>Valid Until:</strong> <span style="color:#DC2626;font-weight:700;">${new Date(
                      promotion.endDate
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}</span></p>
                </div>
                
                <p style="margin:0 0 16px 0;">
                    <a href="${clientUrl}" style="display:inline-block;padding:10px 18px;background:#F97316;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;">
                        Shop Now & Save Big 🚀
                    </a>
                </p>
                
                <p style="margin:0 0 16px 0;">This promotion will expire on ${new Date(
                  promotion.endDate
                ).toLocaleDateString()}.</p>
                ${
                  promotion.usageLimit
                    ? `<p style="margin:0 0 16px 0;">Limited to ${promotion.usageLimit} uses.</p>`
                    : ""
                }
                <p style="margin:0 0 16px 0;">Cannot be combined with other offers. Terms and conditions apply.</p>
                
                <p style="font-size:12px;color:#6B7280;margin-top:24px;">
                    If you didn't expect this promotion, you can safely ignore this email.
                </p>
            </div>
          `;

            await sendEmail(user.email, subject, html);
            Logger.info(
              `[Promotion] Email sent successfully to ${user.email}`,
              {
                userId: user._id,
                userEmail: user.email,
                promotionId: promotion._id,
              }
            );
            return { success: true, email: user.email };
          } catch (emailError) {
            Logger.error(
              `[Promotion] Failed to send email to ${user.email}`,
              emailError,
              {
                userId: user._id,
                userEmail: user.email,
                promotionId: promotion._id,
              }
            );
            return {
              success: false,
              email: user.email,
              error: emailError.message,
            };
          }
        });

        const emailResults = await Promise.all(emailPromises);
        successfulEmails = emailResults.filter((r) => r && r.success);
        Logger.info(
          `[Promotion] Sent ${successfulEmails.length} emails successfully`,
          {
            promotionId: promotion._id,
            totalEmails: targetUsers.length,
            successfulEmails: successfulEmails.length,
          }
        );
      }
    } else {
      Logger.info(`[Promotion] Email notifications disabled`, {
        promotionId: promotion._id,
        emailNotificationsEnabled: false,
      });
    }

    // Emit real-time notifications via socket.io
    try {
      let successfulEmailsCount = 0;
      if (successfulEmails && successfulEmails.length > 0) {
        successfulEmailsCount = successfulEmails.length;
      }

      // Get socket.io instance - handle both ES modules and CommonJS
      let io;
      try {
        // Try to get from global first (for ES modules)
        io = global.io;
      } catch (err) {
        // Fallback for CommonJS
        try {
          const serverModule = await import("../server.js");
          io = serverModule.default?.io || serverModule.io;
        } catch (importErr) {
          Logger.warn(`[Promotion] Could not import socket.io`, {
            error: importErr.message,
          });
        }
      }

      if (io && filteredNotifications.length > 0) {
        const socketData = {
          _id: promotion._id,
          title: `🎉 New Promotion: ${promotion.title}`,
          message: `Use code ${promotion.promoCode} to get ${
            promotion.discountType === "percentage"
              ? promotion.discountValue + "%"
              : "$" + promotion.discountValue
          } off!`,
          type: "promotion",
          actionUrl: "/", // Point to home page instead of non-existent promotions page
          actionText: "View Details",
          createdAt: new Date(),
          metadata: {
            promotionId: promotion._id,
            title: promotion.title,
            description: promotion.description,
            promoCode: promotion.promoCode,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            minPurchaseAmount: promotion.minPurchaseAmount,
            maxDiscountAmount: promotion.maxDiscountAmount,
            usageLimit: promotion.usageLimit,
            usedCount: promotion.usedCount,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
            status: promotion.status,
            targetAudience: promotion.targetAudience,
          },
        };

        // Send to all users based on target audience
        if (promotion.targetAudience === "all") {
          io.emit("new-notification", socketData);
        } else if (promotion.targetAudience === "dealers") {
          io.to("role:dealer").emit("new-notification", socketData);
        } else if (promotion.targetAudience === "buyers") {
          io.to("role:individual").emit("new-notification", socketData);
        } else if (promotion.targetAudience === "sellers") {
          io.to("role:seller").emit("new-notification", socketData);
        }

        Logger.info(`[Promotion] Real-time notifications sent via socket.io`, {
          promotionId: promotion._id,
          targetAudience: promotion.targetAudience,
          notificationCount: filteredNotifications.length,
        });
      }
    } catch (socketError) {
      Logger.error(`[Promotion] Socket.io error`, socketError, {
        promotionId: promotion._id,
        targetAudience: promotion.targetAudience,
      });
    }

    Logger.info(`[Promotion] Notification process completed`, {
      promotionId: promotion._id,
      targetAudience: promotion.targetAudience,
      totalUsers: targetUsers.length,
      successfulNotifications: filteredNotifications.length,
      successfulEmails: successfulEmails?.length || 0,
    });
  } catch (error) {
    Logger.error(`[Promotion] Error in sendPromotionNotifications`, error, {
      promotionId: promotion._id,
      targetAudience: promotion.targetAudience,
    });
  }
};
