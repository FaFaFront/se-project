import { Router } from "express";
import { authMiddleware } from "../common/middleware/auth.middleware.js";
import { walletController } from "../controller/wallet.controller.js";

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get the student's current balance and preset top-up amounts
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Current balance and presets }
 *       401: { description: Unauthorized }
 *       403: { description: Students only }
 * /wallet/top-up:
 *   post:
 *     summary: Add demo credit to the student's balance (no real payment)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 enum: [100, 300, 500, 1000]
 *     responses:
 *       200: { description: Updated balance }
 *       400: { description: Invalid preset amount }
 *       401: { description: Unauthorized }
 *       403: { description: Students only }
 */
router.get("/", walletController.getWallet);
router.post("/top-up", walletController.topUp);

export const walletRouter = router;
