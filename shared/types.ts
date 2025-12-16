export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}
// New types for ScanForm
export type ScanStatus = 'processing' | 'completed' | 'flagged' | 'error';
export type ScanVerdict = 'clean' | 'suspicious' | 'malicious';
export interface ScanSummary {
  verdict: ScanVerdict;
  reasons?: string[];
  score?: number;
}
export interface ScanRecord {
  id: string;
  filename: string;
  size: number;
  mime?: string;
  fields?: Record<string, string>;
  status: ScanStatus;
  summary?: ScanSummary;
  ts: number; // epoch millis
}