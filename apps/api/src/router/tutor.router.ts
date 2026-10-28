import { Router } from "express";
import { tutorController } from "../controller/tutor.controller.js";

export const tutorRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TutorListItem:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, nullable: true, example: Tutor Name }
 *         profileUrl: { type: string, format: uri, nullable: true }
 *         bio: { type: string, nullable: true }
 *         hourlyRate: { type: number, nullable: true, example: 25 }
 *         subjects:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, format: uuid }
 *               name: { type: string, example: Mathematics }
 *         rating:
 *           type: number
 *           nullable: true
 *           description: Average review score out of 5, rounded to one decimal; null when the tutor has no reviews
 *           example: 4.8
 *         reviewCount: { type: integer, example: 12 }
 *         studentCount:
 *           type: integer
 *           description: Number of distinct students who have learned with the tutor
 *           example: 30
 *     TutorReview:
 *       type: object
 *       required: [id, rating, comment, createdAt, student]
 *       properties:
 *         id: { type: string, format: uuid }
 *         rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *         comment: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         student:
 *           type: object
 *           description: Reviewer display details only; no ID or contact details
 *           required: [name, profileUrl]
 *           properties:
 *             name: { type: string, nullable: true, example: Student Name }
 *             profileUrl: { type: string, format: uri, nullable: true }
 *     TutorDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/TutorListItem'
 *         - type: object
 *           required: [reviews]
 *           properties:
 *             reviews:
 *               type: array
 *               description: All of the tutor's reviews, newest first; rating and reviewCount summarise them
 *               items: { $ref: '#/components/schemas/TutorReview' }
 */

/**
 * @swagger
 * /tutors:
 *   get:
 *     summary: List active tutors
 *     description: >
 *       Public list of tutors whose account is active and whose profile is complete.
 *       Search, subject, and price filters combine (AND). Tutors with no value for the
 *       sort key (e.g. no reviews when sorting by rating) are listed last.
 *     tags: [Tutors]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *         description: Case-insensitive match against the tutor's name
 *       - in: query
 *         name: subjectId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number, minimum: 0 }
 *         description: Minimum hourly rate (inclusive)
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number, minimum: 0 }
 *         description: Maximum hourly rate (inclusive)
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [rating, price, popularity], default: rating }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *         description: Defaults to desc for rating and popularity, asc for price
 *     responses:
 *       200:
 *         description: Tutors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Tutors retrieved successfully. }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TutorListItem'
 *       400: { description: Invalid query parameters }
 */
tutorRouter.get("/", tutorController.listTutors);

/**
 * @swagger
 * /tutors/{tutorId}:
 *   get:
 *     summary: Get one active tutor
 *     description: Retrieves the public profile for the UUID selected from the tutor directory, with the tutor's reviews and average rating.
 *     tags: [Tutors]
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tutor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Tutor retrieved successfully. }
 *                 data: { $ref: '#/components/schemas/TutorDetail' }
 *       400: { description: Tutor ID must be a valid UUID }
 *       404: { description: Tutor not found }
 */
tutorRouter.get("/:tutorId", tutorController.getTutor);
