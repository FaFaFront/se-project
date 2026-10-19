import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/socket.server.js";

const httpServer = createServer(app);
await createSocketServer(httpServer);

if (process.env.VERCEL !== "1") {
  httpServer.listen(Number(env.PORT), () => {
    console.log(`Server running at http://localhost:${env.PORT}`);
  });
}

export default httpServer;
