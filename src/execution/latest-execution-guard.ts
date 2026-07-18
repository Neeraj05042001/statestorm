export interface ExecutionLease {
  signal: AbortSignal;
  isCurrent(): boolean;
}

export interface LatestExecutionGuard {
  begin(): ExecutionLease;
  cancelCurrent(): void;
}

export function createLatestExecutionGuard(): LatestExecutionGuard {
  let generation = 0;
  let controller: AbortController | null = null;

  return {
    begin() {
      controller?.abort();
      controller = new AbortController();
      generation += 1;
      const leaseGeneration = generation;
      const leaseController = controller;
      return {
        signal: leaseController.signal,
        isCurrent: () =>
          generation === leaseGeneration &&
          controller === leaseController &&
          !leaseController.signal.aborted,
      };
    },
    cancelCurrent() {
      controller?.abort();
      controller = null;
      generation += 1;
    },
  };
}
