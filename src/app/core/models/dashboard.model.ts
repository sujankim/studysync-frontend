export interface DashboardStats {
  // Stat cards
  studyTimeToday: string;
  studyMinutesToday: number;
  studyTimeChangePercent: number;
  studyTimeUp: boolean;

  roomsJoined: number;
  roomsJoinedThisWeek: number;

  resourcesShared: number;
  resourcesThisWeek: number;

  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  totalStudyMinutes: number;

  // Chart
  weekDays: string[];
  weeklyMinutes: number[];

  // User
  userName: string;
  userPlan: 'FREE' | 'PRO';
}

export interface StudySessionResponse {
  id: number;
  roomId: number | null;
  roomName: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  isActive: boolean;
}

// Hardcoded mock until API returns data
// TODO: remove when all backend data is ready
export const MOCK_ONLINE_FRIENDS = [
  { id: 1, name: 'Aayush Poudel', username: 'aayush', status: 'In a study session', online: true },
  { id: 2, name: 'Pragya Shah', username: 'pragya', status: 'In DSA Grind Together', online: true },
  { id: 3, name: 'Bibek Karki', username: 'bibek', status: 'In System Design Hub', online: true },
  { id: 4, name: 'Anisha Thapa', username: 'anisha', status: 'Online', online: true },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Aayush Poudel', minutes: 1240, you: false },
  { rank: 2, name: 'You', minutes: 980, you: true },
  { rank: 3, name: 'Pragya Shah', minutes: 870, you: false },
  { rank: 4, name: 'Bibek Karki', minutes: 760, you: false },
];
