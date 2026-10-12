import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SE Project API",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [{ url: "/api" }],
  },
  apis: ["./src/router/*.ts"],
});
