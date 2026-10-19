import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/socket.server.js";

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(Number(env.PORT), () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
