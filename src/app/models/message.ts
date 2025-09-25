export interface ChatMessage {
  id?: string;
  text: string;
  uid: string;
  authorName: string;
  authorRole: string; // 'vendedor' | 'cliente' | 'admin' | string
  createdAt: any;     // Timestamp | null mientras llega el serverTimestamp
}