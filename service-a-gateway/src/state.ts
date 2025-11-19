import { Message, TenantId } from "./types";

const tenantHistory: Record<TenantId, Message[]> = {};

export function addMessage(tenantId: TenantId, message: Message) {
  if (!tenantHistory[tenantId]) {
    tenantHistory[tenantId] = [];
  }
  tenantHistory[tenantId].push(message);

  // keep only last N messages, e.g., 20
  if (tenantHistory[tenantId].length > 20) {
    tenantHistory[tenantId].shift();
  }
}

export function getHistory(tenantId: TenantId): Message[] {
  return tenantHistory[tenantId] || [];
}

export function getAllState() {
  return tenantHistory;
}
