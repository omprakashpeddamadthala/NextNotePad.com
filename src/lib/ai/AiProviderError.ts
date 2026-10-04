export class AiProviderError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}
