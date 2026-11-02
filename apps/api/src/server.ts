import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/socket.server.js";
import { SOCKET_EVENTS } from "./socket/socket.types.js";
import { conversationRoomName } from "./socket/utils/conversation-room.js";
import { runSessionSettlementTick } from "./service/settlement.service.js";
import { startSettlementScheduler } from "./jobs/settlement-scheduler.js";
import { prisma } from "./config/prisma.js";

const httpServer = createServer(app);
const io = await createSocketServer(httpServer);

if (process.env.VERCEL !== "1") {
  const scheduler = startSettlementScheduler(() =>
    runSessionSettlementTick((message) => {
      io.to(conversationRoomName(message.conversationId)).emit(SOCKET_EVENTS.messageNew, {
        message,
      });
    })
  );
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await scheduler.stop();
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });
    await prisma.$disconnect();
  };
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown().catch((error) => {
        console.error("API shutdown failed", error);
        process.exitCode = 1;
      });
    });
  }
  httpServer.listen(Number(env.PORT), () => {
    console.log(`Server running at http://localhost:${env.PORT}`);
  });
}

export default httpServer;
