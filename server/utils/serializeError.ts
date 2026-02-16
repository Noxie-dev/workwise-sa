export function serializeError(err: unknown): Record<string, any> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  if (typeof err === 'object' && err) {
    return err as Record<string, any>;
  }

  return { message: String(err) };
}
