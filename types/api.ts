// API Types matching Django backend models

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  user: User;
  bio: string;
  avatar: string;
  total_completions: number;
  total_created: number;
  created_at: string;
  updated_at: string;
}

export interface PublicUserProfile {
  name: string;
  bio: string;
  avatar: string | null;
  total_completions: number;
  total_created: number;
}

export interface PhotoHunt {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  reference_image: string | null;
  // For hunts not created by the user, if the user hunted it, backend may
  // include the user's submitted image. This can be null or absent.
  submission_image?: string | null;
  difficulty?: number; // Float from 0-5
  hint?: string; // Optional hint text
  orientation?: 'portrait' | 'landscape';
  created_by: string;
  created_by_name: string;
  created_by_avatar?: string; // Optional avatar URL for the creator
  is_user_generated: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hunted: boolean; // Computed field indicating if current user has completed this hunt
}

export interface PhotoHuntCompletion {
  id: string;
  user: string;
  user_name: string;
  photohunt: string;
  photohunt_name: string;
  submitted_image: string;
  validation_score: number | null;
  is_valid: boolean;
  validation_notes: string;
  created_at: string;
}

export interface PhotoValidation {
  id: string;
  completion: string;
  reference_image_url: string;
  submitted_image_url: string;
  similarity_score: number;
  confidence_score: number;
  validation_prompt: string;
  ai_response: string;
  is_approved: boolean;
  created_at: string;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface PhotoHuntCreateRequest {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  reference_image?: string;
  difficulty?: number; // Float from 0-5
  hint?: string; // Optional hint text
  orientation?: 'portrait' | 'landscape';
}

export interface PhotoHuntCreateFormData {
  name: string;
  description: string;
  lat: number;
  long: number;
  reference_image_file: {
    uri: string;
    type: string;
    name: string;
  };
  difficulty?: number; // Float from 0-5
  hint?: string; // Optional hint text
  orientation?: 'portrait' | 'landscape';
}

export interface PhotoSubmissionRequest {
  photohunt_id: string;
  photo: {
    uri: string;
    type: string;
    name: string;
  };
}

export interface PhotoSubmissionResponse {
  completion: PhotoHuntCompletion;
  validation: {
    similarity_score: number;
    confidence_score: number;
    is_valid: boolean;
    notes: string;
    prompt: string;
    ai_response: string;
  };
}

export interface NearbyPhotoHuntsRequest {
  lat: number;
  lng: number;
  radius?: number; // Default 10km
}

// Query parameters for PhotoHunt list
export interface PhotoHuntListParams {
  user_generated?: boolean;
  created_by?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// Profile update requests
export interface ProfileUpdateRequest {
  name?: string;
  bio?: string;
}

export interface ProfileUpdateWithAvatarRequest {
  name?: string;
  bio?: string;
  avatar_file?: {
    uri: string;
    type: string;
    name: string;
  };
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

// Error response from API
export interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: Record<string, any>;
  [key: string]: any;
}
