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
    components: {
      schemas: {
        ChatMessage: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            conversationId: { type: "string", format: "uuid" },
            senderId: { type: "string", format: "uuid" },
            text: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            sender: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", nullable: true },
                role: { type: "string", enum: ["student", "tutor"] },
                profileUrl: { type: "string", format: "uri", nullable: true },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/router/*.ts"],
});
