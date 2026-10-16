import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { successResponse } from "../common/utils/response.js";
import { tutorService } from "../service/tutor.service.js";

const optionalPrice = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .finite(`${label} must be finite`)
    .nonnegative(`${label} must not be negative`)
    .optional();

const tutorListQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(100, "Search term is too long")
      .optional()
      .transform((value) => value || undefined),
    subjectId: z
      .string()
      .uuid("Subject ID must be a valid UUID")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    minPrice: z.preprocess(
      (value) => (value === "" ? undefined : value),
      optionalPrice("Minimum price")
    ),
    maxPrice: z.preprocess(
      (value) => (value === "" ? undefined : value),
      optionalPrice("Maximum price")
    ),
    sortBy: z
      .enum(["rating", "price", "popularity"], {
        message: 'Sort must be one of "rating", "price", or "popularity"',
      })
      .optional(),
    order: z.enum(["asc", "desc"], { message: 'Order must be "asc" or "desc"' }).optional(),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    "Minimum price must not exceed maximum price"
  );

const tutorIdParamsSchema = z.object({
  tutorId: z.string().uuid("Tutor ID must be a valid UUID"),
});

export const tutorController = {
  async listTutors(req: Request, res: Response, next: NextFunction) {
    try {
      const query = tutorListQuerySchema.parse(req.query);
      const tutors = await tutorService.listTutors(query);
      res.status(200).json(successResponse(tutors, "Tutors retrieved successfully."));
    } catch (error) {
      next(error);
    }
  },

  async getTutor(req: Request, res: Response, next: NextFunction) {
    try {
      const { tutorId } = tutorIdParamsSchema.parse(req.params);
      const tutor = await tutorService.getTutor(tutorId);
      res.status(200).json(successResponse(tutor, "Tutor retrieved successfully."));
    } catch (error) {
      next(error);
    }
  },
};
