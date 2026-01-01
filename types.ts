
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 encoded string
  size: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  tokens?: number;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  lastUpdated: number;
  systemPrompt?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
}
