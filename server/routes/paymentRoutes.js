import express from "express";
import {
  createSubscriptionCheckout,
  stripeWebhook,
  verifyPaymentSession,
} from "../controllers/paymentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create subscription checkout session
router.post("/subscription/checkout", authenticate, createSubscriptionCheckout);

// Verify payment session status
router.get("/verify/:session_id", authenticate, verifyPaymentSession);

// Stripe webhook endpoint (no authentication required)
router.post("/stripe/webhook", stripeWebhook);

export default router;
