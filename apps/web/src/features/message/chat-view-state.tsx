import { Button } from "@/components/ui/button";

const chatCardClassName =
  "flex h-[min(72vh,760px)] min-h-[420px] max-h-[760px] flex-col rounded-2xl border border-hairline bg-canvas shadow-sm";

export function ChatViewLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${chatCardClassName} animate-pulse p-5 sm:p-6`}
    >
      <p className="sr-only">Loading conversation...</p>
      <div className="flex items-center gap-3 border-b border-hairline pb-5">
        <div className="size-11 rounded-full bg-surface-lavender" />
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-surface-lavender" />
          <div className="h-3 w-20 rounded bg-surface-lavender" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-4 py-6">
        <div className="h-16 w-3/4 rounded-2xl bg-surface-lavender" />
        <div className="ml-auto h-16 w-2/3 rounded-2xl bg-primary/10" />
      </div>
      <div className="h-16 rounded-lg bg-surface-lavender" />
    </div>
  );
}

type ChatViewErrorProps = {
  message: string;
  onRetry?: () => void;
};

export function ChatViewError({ message, onRetry }: ChatViewErrorProps) {
  return (
    <div className={`${chatCardClassName} items-center justify-center gap-4 px-6 text-center`}>
      <p role="alert" className="max-w-md text-sm text-error sm:text-base">
        {message}
      </p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
