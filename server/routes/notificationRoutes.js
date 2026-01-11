import express from "express";
import {
  createNotification,
  getAllNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { auth, authorize } from "../middlewares/authMiddleware.js";
import { hasPermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// User routes
router.get("/me", getUserNotifications);
router.put("/:notificationId/read", markAsRead);
router.put("/read-all", markAllAsRead);

// Admin routes with permission checks
router.use(authorize("admin"));

router.post("/", hasPermission("createNotifications"), createNotification);
router.get("/", hasPermission("viewNotifications"), getAllNotifications);
router.delete(
  "/:notificationId",
  hasPermission("deleteNotifications"),
  deleteNotification
);

export default router;
