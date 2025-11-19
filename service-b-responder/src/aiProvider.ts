export interface AiProvider {
  generateReply(input: {
    message: string;
    tenantId: string;
    mode?: string;
  }): Promise<string>;
}

export class EchoAiProvider implements AiProvider {
  async generateReply(input: {
    message: string;
    tenantId: string;
    mode?: string;
  }): Promise<string> {
    const base = `Tenant ${input.tenantId} says: ${input.message}`;

    if (input.mode === "slow") {
      return (
        base +
        " | This is a longer simulated response to test streaming behavior. " +
        "It contains multiple sentences so the gateway can chunk it into several pieces."
      );
    }

    return base + " 🤖";
  }
}
