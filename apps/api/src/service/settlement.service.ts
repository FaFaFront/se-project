import { sessionRepository } from "../repository/session.repository.js";
import { settlementRepository } from "../repository/settlement.repository.js";
import type { SerializedMessage } from "../common/utils/message-presenter.js";

export async function runSessionSettlementTick(
  broadcast: (message: SerializedMessage) => void,
  now = new Date()
): Promise<void> {
  try {
    await sessionRepository.advanceScheduled(now);
    for (const { id } of await settlementRepository.findDue(now)) {
      try {
        const outcome = await settlementRepository.settleSession(id, now);
        console.info("Session settlement", { sessionId: id, outcome: outcome.kind });
      } catch (error) {
        console.error("Session settlement failed; will retry", { sessionId: id, error });
      }
    }
  } catch (error) {
    console.error("Unable to find due sessions; will retry", error);
  }

  // Independent pass: a failed payment must not block committed payment notices.
  for (const { id } of await settlementRepository.findPendingNotices()) {
    try {
      const message = await settlementRepository.createSettlementNotice(id);
      if (message) {
        try {
          broadcast(message);
        } catch (error) {
          console.error(
            "Settlement notice broadcast failed after persistence; available in chat history",
            { sessionId: id, error }
          );
        }
      }
    } catch (error) {
      console.error("Settlement notice failed; will retry persistence on next tick", {
        sessionId: id,
        error,
      });
    }
  }
}
