import { UserResponse } from './auth.model';

// A message received from the server (either via WebSocket or history API)
export interface MessageResponse {
  id: number;
  content: string;
  roomId: number;
  sender: UserResponse;
  isEdited: boolean;
  createdAt: string;
}

// What we send TO the server when a user sends a message
export interface ChatMessagePayload {
  content: string;
}

// Typing indicator — received from server
export interface TypingResponse {
  userId: number;
  username: string;
  name: string;
  isTyping: boolean;
}

// Online/offline status change
export interface OnlineStatusResponse {
  userId: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isOnline: boolean;
}
