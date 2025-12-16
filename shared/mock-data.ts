import type { User, Chat, ChatMessage, ScanRecord } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'User A' },
  { id: 'u2', name: 'User B' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
export const MOCK_SCANS: ScanRecord[] = [
  {
    id: 's1',
    filename: 'demo-report.pdf',
    size: 123456,
    mime: 'application/pdf',
    status: 'completed',
    summary: {
      verdict: 'clean',
      score: 98,
    },
    ts: Date.now() - 86400000, // 1 day ago
  }
];