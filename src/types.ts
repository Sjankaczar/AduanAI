export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: number;
}

export interface Message {
  id: string;
  sender: 'citizen' | 'admin';
  text: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'failed';
  attachments?: Attachment[];
}

export interface Report {
  id: string;
  citizenName: string;
  aiCategory: string;
  aiPriorityScore: number;
  status: 'Menunggu' | 'Ditinjau' | 'Diproses' | 'Selesai';
  messages: Message[];
  preview: string;
  originalComplaint: string;
  date: string;
  attachments: Attachment[];
  expiresAt?: number;
}
