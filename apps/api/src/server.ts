import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { attachChatWebSocketServer } from "./websocket/chat.websocket.js";

const server = createServer(app);
attachChatWebSocketServer(server);

server.listen(Number(env.PORT), () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
