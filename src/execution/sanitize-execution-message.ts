const DEFAULT_MESSAGE = "The sandbox could not complete this fixture.";

export function sanitizeExecutionMessage(
  value: unknown,
  maximumLength = 1_000,
): string {
  let message = DEFAULT_MESSAGE;

  if (value instanceof Error) {
    message = value.message || DEFAULT_MESSAGE;
  } else if (typeof value === "string") {
    message = value;
  } else if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    message = value.message;
  }

  const normalized = message.replace(/\s+/g, " ").trim();
  return (normalized || DEFAULT_MESSAGE).slice(0, maximumLength);
}
