import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { apiRoutes } from "./routes.js";
import { errorHandler } from "./common/middleware/error-handler.middleware.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerSpec));
app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
