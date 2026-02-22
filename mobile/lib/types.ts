// Shared types — mirrors web app
export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string;
  photo_url: string;
  bio: string;
  home_city: string;
  is_public: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  place_id: string;
  place_name: string;
  place_address: string;
  lat: number;
  lng: number;
  city: string;
  caption: string;
  rating: number;
  tags: string[];
  visited_at: string;
  created_at: string;
  photo_urls: string[];
  visibility: "public" | "followers" | "private";
}

export interface PostWithAuthor extends Post {
  author_name: string;
  author_photo: string;
  author_username: string;
}

export interface PlaceCache {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  hours: string[];
  types: string[];
  lat: number;
  lng: number;
  google_maps_url: string;
  photos: string[];
  cached_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowUser {
  id: string;
  username: string | null;
  display_name: string;
  photo_url: string;
  bio: string;
  follower_count: number;
  following_count: number;
  is_following?: boolean;
}
