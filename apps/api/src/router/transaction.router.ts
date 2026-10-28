import { Router } from "express";
import { authMiddleware } from "../common/middleware/auth.middleware.js";
import { transactionController } from "../controller/transaction.controller.js";

export const transactionRouter = Router();
transactionRouter.use(authMiddleware);

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
 * /transactions/withdrawals:
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
 *     tags: [Transactions]
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
 *                 enum: [BBL, KBANK, KTB, SCB, BAY, TTB, GSB, BAAC, GHB, KKP, TISCO, CIMBT, UOB]
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
 * /transactions/{id}:
 *   get:
 *     summary: Retrieve an owned transaction with safe operation receipt fields
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Transaction details (Cache-Control no-store). Versioned metadata in note is never exposed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 *       401:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 *       403:
 *         $ref: '#/components/responses/WithdrawalErrorResponse'
 *       404:
 *         description: Transaction does not exist or belongs to another user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawalError'
 */
transactionRouter.post("/withdrawals", transactionController.withdraw);
/**
 * @openapi
 * /transactions/withdrawals/by-request/{requestId}:
 *   get:
 *     summary: Reconcile an owned mock withdrawal using its original request ID
 *     description: A 404 means no completed record is visible yet, not that an in-flight POST cannot complete. Retry only with the same request ID.
 *     tags: [Transactions]
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
transactionRouter.get(
  "/withdrawals/by-request/:requestId",
  transactionController.getWithdrawalByRequest
);
transactionRouter.get("/top-ups/options", transactionController.getTopUpOptions);
transactionRouter.post("/top-ups", transactionController.topUp);
transactionRouter.get("/", transactionController.list);
transactionRouter.get("/:id", transactionController.get);

/**
 * @openapi
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required: [id, userId, type, amount, relatedSessionId, note, createdAt]
 *       properties:
 *         id: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         type: { type: string, enum: [topup, session_charge, earning, withdrawal] }
 *         amount: { type: string, example: "100.00", description: Positive amount; direction is implied by type. }
 *         relatedSessionId: { type: string, format: uuid, nullable: true }
 *         note: { type: string, nullable: true, description: Internal top-up and withdrawal metadata is redacted. }
 *         createdAt: { type: string, format: date-time }
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string }
 *         data:
 *           allOf:
 *             - $ref: '#/components/schemas/Transaction'
 *             - type: object
 *               properties:
 *                 balanceAfter: { type: string, example: "600.00", description: Historical balance immediately after the operation, when receipt metadata is available. }
 *                 currency: { type: string, enum: [THB] }
 *                 status: { type: string, enum: [completed] }
 *                 destination:
 *                   $ref: '#/components/schemas/Withdrawal/properties/destination'
 *                 requestedAt: { type: string, format: date-time }
 *                 completedAt: { type: string, format: date-time }
 * /transactions:
 *   get:
 *     summary: List the signed-in user's transaction history
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, maximum: 1000000, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [topup, session_charge, earning, withdrawal] }
 *     responses:
 *       200:
 *         description: Owned transactions, newest first. Internal operation metadata is redacted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Transaction' }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *       400: { description: Invalid pagination or transaction type }
 *       401: { description: Authentication required }
 * /transactions/top-ups/options:
 *   get:
 *     summary: Get the student's allowed top-up amounts
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Allowed mock top-up presets. Read balance from GET /users/me.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     topUpAmounts: { type: array, items: { type: number }, example: [100, 300, 500, 1000] }
 *       401: { description: Authentication required }
 *       403: { description: Students only }
 * /transactions/top-ups:
 *   post:
 *     summary: Record a mock student top-up and credit its balance atomically
 *     description: No real payment. Retry with the same requestId and amount after an uncertain response. A completed retry returns the original receipt without another credit. balanceAfter is historical; read current balance from GET /users/me.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [requestId, amount]
 *             properties:
 *               requestId: { type: string, format: uuid }
 *               amount: { type: number, enum: [100, 300, 500, 1000] }
 *     responses:
 *       201:
 *         description: Top-up recorded and balance credited.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TransactionResponse' }
 *       200:
 *         description: Identical request replayed, with its original receipt.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TransactionResponse' }
 *       400: { description: Invalid preset, request ID or balance overflow }
 *       401: { description: Authentication required }
 *       403: { description: Students only }
 *       409: { description: Request ID already used with different or incompatible details }
 */
