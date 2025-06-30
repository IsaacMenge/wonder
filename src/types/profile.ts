export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface ProfileUpdate {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}
