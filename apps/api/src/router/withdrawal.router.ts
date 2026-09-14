import { Router } from "express";
import { authMiddleware } from "../common/middleware/auth.middleware.js";
import { withdrawalController } from "../controller/withdrawal.controller.js";

export const withdrawalRouter = Router();
withdrawalRouter.use(authMiddleware);

/**
 * @openapi
 * components:
 *   schemas:
 *     Withdrawal:
 *       type: object
 *       required: [id, amount, currency, status, destination, requestedAt, completedAt, balanceAfter]
 *       properties:
 *         id: { type: string, format: uuid, description: Transaction ID of this withdrawal. }
 *         amount: { type: string, example: "300.00" }
 *         currency: { type: string, enum: [THB] }
 *         status: { type: string, enum: [completed] }
 *         destination:
 *           type: object
 *           properties:
 *             bankCode: { type: string, example: KBANK }
 *             accountNumberMasked: { type: string, example: "******6789" }
 *             accountHolderName: { type: string, example: Tutor Name }
 *         requestedAt: { type: string, format: date-time }
 *         completedAt: { type: string, format: date-time }
 *         balanceAfter:
 *           type: string
 *           example: "700.00"
 *           description: Balance immediately after this withdrawal, not the current balance.
 *     WithdrawalResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/Withdrawal'
 *     WithdrawalError:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: false }
 *         message: { type: string }
 *   responses:
 *     WithdrawalErrorResponse:
 *       description: Request rejected; no balance change.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawalError'
 * /wallet/withdrawals:
 *   post:
 *     summary: Immediately complete a mock tutor withdrawal (no real transfer)
 *     description: >-
 *       THB only, no fees. Bank details are entered each time and only format-validated;
 *       bank ownership is not verified. Password confirms the signed-in tutor.
 *       Reuse requestId with identical normalized details to retry safely. Successful
 *       retries return the original withdrawal without another deduction. Changing
 *       the amount or destination with the same requestId returns 409. Withdrawals use
 *       the existing Transaction model with validated versioned metadata in note.
 *       Incompatible existing retry records also return 409 without deduction.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [requestId, amount, password, bankCode, accountNumber, accountHolderName]
 *             properties:
 *               requestId: { type: string, format: uuid }
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 9999999999.99
 *                 multipleOf: 0.01
 *                 example: 300
 *               password: { type: string, format: password, minLength: 1, writeOnly: true }
 *               bankCode:
 *                 type: string
 *                 $ref: '#/components/schemas/ThaiBankCode'
 *               accountNumber:
 *                 type: string
 *                 maxLength: 64
 *                 example: "0123456789"
 *                 description: 6-20 digits after removing spaces and hyphens; generic mock validation only.
 *               accountHolderName: { type: string, minLength: 1, maxLength: 100 }
 *     responses:
 *       201:
 *         description: Mock payout completed and wallet debited atomically.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalResponse'
 *       200:
 *         description: Identical request replayed; original result returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalResponse'
 *       400:
 *         description: Invalid input or insufficient available balance.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalError'
 *       401:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 *       403:
 *         description: Tutors only, incorrect confirmation password, or password changed during request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalError'
 *       409:
 *         description: Request ID already used with different or incompatible withdrawal details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalError'
 *       500:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 * /wallet/withdrawals/{id}:
 *   get:
 *     summary: Retrieve an owned withdrawal with a masked destination
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Withdrawal details (Cache-Control no-store).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalResponse'
 *       400:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 *       401:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 *       403:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 *       404:
 *         description: Withdrawal does not exist or belongs to another tutor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalError'
 */
withdrawalRouter.post("/", withdrawalController.submit);
/**
 * @openapi
 * /wallet/withdrawals/by-request/{requestId}:
 *   get:
 *     summary: Reconcile an owned mock withdrawal using its original request ID
 *     description: A 404 means no completed record is visible yet, not that an in-flight POST cannot complete. Retry only with the same request ID.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Completed withdrawal with masked destination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalResponse'
 *       400: { description: Invalid UUID }
 *       401: { description: Authentication required }
 *       403: { description: Tutors only }
 *       404: { description: No valid owned withdrawal is currently visible }
 */
withdrawalRouter.get("/by-request/:requestId", withdrawalController.getByRequest);
withdrawalRouter.get("/:id", withdrawalController.get);
