/** One scheduler per long-lived API process; database guards also protect multiple instances. */
export function startSettlementScheduler(
  run: () => Promise<void>,
  onError: (error: unknown) => void = (error) =>
    console.error("Session settlement tick failed", error)
) {
  let stopped = false;
  let running: Promise<void> | null = null;
  const tick = (): Promise<void> => {
    if (stopped) return Promise.resolve();
    if (running) return running;
    running = Promise.resolve()
      .then(run)
      .catch(onError)
      .finally(() => {
        running = null;
      });
    return running;
  };
  const timer = setInterval(() => {
    void tick();
  }, 60_000);
  timer.unref();
  void tick();
  return {
    tick,
    async stop(): Promise<void> {
      stopped = true;
      clearInterval(timer);
      await running;
    },
  };
}
