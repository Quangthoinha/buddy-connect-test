// Helper to parse chat messages from a serialized JSON string stored in DB
export function parseChatMessages(chatGroupId) {
  if (!chatGroupId) return [];
  try {
    const parsed = JSON.parse(chatGroupId);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
