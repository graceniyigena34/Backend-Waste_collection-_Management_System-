import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { listConversations, listChatMessages, sendChatMessage, editChatMessage, removeChatMessage } from "../controllers/chatController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Citizen ↔ Waste Company messaging
 */

/**
 * @swagger
 * /api/chat/company/{companyId}/conversations:
 *   get:
 *     summary: List all citizen conversations for a company (company/admin only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of conversation summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       citizen_user_id:
 *                         type: integer
 *                       last_message:
 *                         type: string
 *                       last_at:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (citizens cannot access this)
 *       404:
 *         description: Company not found
 */
router.get("/company/:companyId/conversations", authenticate, listConversations);

/**
 * @swagger
 * /api/chat/company/{companyId}:
 *   get:
 *     summary: Get all chat messages with a company
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the waste company
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.get("/company/:companyId", authenticate, listChatMessages);

/**
 * @swagger
 * /api/chat/company/{companyId}:
 *   post:
 *     summary: Send a message to a company
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the waste company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hello, when is the next collection?
 *               sender_name:
 *                 type: string
 *                 example: Grace Uwera
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 chat:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.post("/company/:companyId", authenticate, sendChatMessage);

/**
 * @swagger
 * /api/chat/company/{companyId}/{messageId}:
 *   put:
 *     summary: Edit your own message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Updated message text
 *     responses:
 *       200:
 *         description: Message updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 chat:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found or not yours
 */
router.put("/company/:companyId/:messageId", authenticate, editChatMessage);

/**
 * @swagger
 * /api/chat/company/{companyId}/{messageId}:
 *   delete:
 *     summary: Delete your own message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found or not yours
 */
router.delete("/company/:companyId/:messageId", authenticate, removeChatMessage);

export default router;
