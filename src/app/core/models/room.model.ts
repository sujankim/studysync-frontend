import { UserResponse } from './auth.model';

export interface StudyRoomResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  topic: string;
  tags: string[];
  coverImageUrl: string | null;
  isPrivate: boolean;
  inviteCode: string | null; // only for room owner
  maxMembers: number;
  memberCount: number;
  owner: UserResponse;
  isMember: boolean;
  memberRole: 'OWNER' | 'MODERATOR' | 'MEMBER' | null;
  createdAt: string;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  topic: string;
  tags?: string[];
  isPrivate: boolean;
  maxMembers: number;
}

export interface RoomMemberResponse {
  userId: number;
  name: string;
  username: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  isOnline: boolean;
  joinedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Topic options for browse + create
export const ROOM_TOPICS = [
  'All Topics',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'System Design',
  'DSA',
  'React',
  'Angular',
  'Spring Boot',
  'DevOps',
  'Machine Learning',
  'Open Source',
  'Frontend',
  'Backend',
] as const;

export type RoomTopic = (typeof ROOM_TOPICS)[number];

// Topic → emoji mapping
export const TOPIC_EMOJI: Record<string, string> = {
  Java: '☕',
  Python: '🐍',
  JavaScript: '⚡',
  TypeScript: '🔷',
  'System Design': '🏗️',
  DSA: '🧮',
  React: '⚛️',
  Angular: '🅰️',
  'Spring Boot': '🍃',
  DevOps: '🐳',
  'Machine Learning': '🤖',
  'Open Source': '🌍',
  Frontend: '🎨',
  Backend: '⚙️',
};

export function getTopicEmoji(topic: string): string {
  return TOPIC_EMOJI[topic] ?? '📚';
}
