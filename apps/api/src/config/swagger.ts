import swaggerJsdoc from "swagger-jsdoc";
import { THAI_BANK_CODES } from "@tutorist/shared";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    components: {
      schemas: { ThaiBankCode: { type: "string", enum: THAI_BANK_CODES } },
    },
    info: {
      title: "SE Project API",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [{ url: "/api" }],
  },
  apis: ["./src/router/*.ts"],
});
