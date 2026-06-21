export interface Message {
  id: string;
  sender: 'citizen' | 'admin';
  text: string;
  timestamp: string;
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
}
