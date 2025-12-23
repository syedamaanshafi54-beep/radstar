import { Router } from "express";
import Razorpay from "razorpay";
import * as admin from "firebase-admin";
import crypto from "crypto";

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ---------------- CREATE ORDER ----------------
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, userId } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: "amount and userId are required" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt,
    });

    // Save order to Firestore
    await admin.firestore().collection("users").doc(userId)
      .collection("orders").doc(order.id).set({
        orderNumber: receipt,
        status: "created",
        paymentStatus: "created",
        amount,
        currency,
        createdAt: new Date(),
      });

    return res.json(order);
  } catch (error) {
    console.error("Failed to create order:", error);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// ---------------- VERIFY PAYMENT ----------------
router.post("/verify-payment", async (req, res) => {
  try {
    const { userId, orderId, razorpay_payment_id, razorpay_signature } = req.body;

    if (!userId || !orderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${orderId}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      await admin.firestore().collection("users").doc(userId)
        .collection("orders").doc(orderId)
        .update({ paymentStatus: "failed" });
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    await admin.firestore().collection("users").doc(userId)
      .collection("orders").doc(orderId)
      .update({
        status: "confirmed",
        paymentStatus: "paid",
        paymentDetails: {
          orderId,
          paymentId: razorpay_payment_id,
        },
      });

    return res.json({ success: true, message: "Payment verified" });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;
