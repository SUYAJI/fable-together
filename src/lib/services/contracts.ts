export interface AppUser {
  id: string
  email?: string
  created_at: string
  user_metadata: {
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}

export interface AppProfile {
  id: string
  display_name: string
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  created_at: string
  available_credits: number
  total_credits: number
}

export interface ProfileUpdate {
  display_name?: string
  avatar_url?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  phone?: string | null
}

export interface AuthService {
  getCurrentUser(): Promise<AppUser | null>
  signOut(): Promise<void>
}

export interface ProfileService {
  getProfile(userId: string): Promise<AppProfile | null>
  updateProfile(userId: string, update: ProfileUpdate): Promise<AppProfile>
}

export interface AppServices {
  auth: AuthService
  profiles: ProfileService
}
