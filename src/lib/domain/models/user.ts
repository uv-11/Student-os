export interface UserProfile {
  id: string;
  name: string;
  subtitle: string;
  avatarColor: string;
  avatarUrl?: string;
  isGuest: boolean;
  email?: string;
  university?: string;
  degree?: string;
  branch?: string;
  semester?: string;
  targetAttendance?: number;
  bio?: string;
}

