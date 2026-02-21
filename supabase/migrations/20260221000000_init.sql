-- MyMaps V2 Schema

-- Enable extensions
create extension if not exists "uuid-ossp" schema extensions;

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'User',
  photo_url text default '',
  bio text default '',
  home_city text default '',
  is_public boolean default true,
  follower_count int default 0,
  following_count int default 0,
  post_count int default 0,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_users_username on public.users(username);

-- ============================================================
-- POSTS
-- ============================================================
create type post_visibility as enum ('public', 'followers', 'private');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  place_id text not null,
  place_name text not null,
  place_address text default '',
  lat double precision default 0,
  lng double precision default 0,
  city text default '',
  caption text default '',
  rating smallint default 0 check (rating >= 0 and rating <= 5),
  tags text[] default '{}',
  visited_at timestamptz default now(),
  created_at timestamptz default now(),
  photo_urls text[] default '{}',
  visibility post_visibility default 'public'
);

create index idx_posts_user on public.posts(user_id, created_at desc);
create index idx_posts_place on public.posts(place_id);
create index idx_posts_public on public.posts(created_at desc) where visibility = 'public';
create index idx_posts_city on public.posts(city, created_at desc) where visibility = 'public';

-- ============================================================
-- FOLLOWS
-- ============================================================
create table public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create index idx_follows_following on public.follows(following_id);

-- ============================================================
-- PLACES CACHE (avoid repeated Google Places API calls)
-- ============================================================
create table public.places_cache (
  place_id text primary key,
  name text not null,
  address text default '',
  phone text default '',
  website text default '',
  rating real default 0,
  user_ratings_total int default 0,
  price_level smallint default -1,
  hours text[] default '{}',
  types text[] default '{}',
  lat double precision default 0,
  lng double precision default 0,
  google_maps_url text default '',
  photos text[] default '{}',
  cached_at timestamptz default now()
);

-- ============================================================
-- VIEWS (denormalized for efficient feed queries)
-- ============================================================
create or replace view public.posts_with_author as
select
  p.*,
  u.display_name as author_name,
  u.photo_url as author_photo,
  u.username as author_username
from public.posts p
join public.users u on u.id = p.user_id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Follow a user (handles counts atomically)
create or replace function public.follow_user(target_uid uuid)
returns void
language plpgsql security definer
as $$
begin
  insert into public.follows (follower_id, following_id)
  values (auth.uid(), target_uid)
  on conflict do nothing;

  -- Only update counts if insert actually happened
  if found then
    update public.users set following_count = following_count + 1, updated_at = now() where id = auth.uid();
    update public.users set follower_count = follower_count + 1, updated_at = now() where id = target_uid;
  end if;
end;
$$;

-- Unfollow a user
create or replace function public.unfollow_user(target_uid uuid)
returns void
language plpgsql security definer
as $$
begin
  delete from public.follows where follower_id = auth.uid() and following_id = target_uid;

  if found then
    update public.users set following_count = greatest(following_count - 1, 0), updated_at = now() where id = auth.uid();
    update public.users set follower_count = greatest(follower_count - 1, 0), updated_at = now() where id = target_uid;
  end if;
end;
$$;

-- Get feed (posts from people you follow)
create or replace function public.get_feed(page_size int default 20, page_offset int default 0)
returns setof public.posts_with_author
language sql stable security definer
as $$
  select pa.*
  from public.posts_with_author pa
  where pa.user_id in (
    select following_id from public.follows where follower_id = auth.uid()
  )
  and (pa.visibility = 'public' or pa.visibility = 'followers')
  order by pa.created_at desc
  limit page_size offset page_offset;
$$;

-- Increment post count trigger
create or replace function public.handle_new_post()
returns trigger
language plpgsql security definer
as $$
begin
  update public.users set post_count = post_count + 1, updated_at = now() where id = new.user_id;
  return new;
end;
$$;

create or replace function public.handle_delete_post()
returns trigger
language plpgsql security definer
as $$
begin
  update public.users set post_count = greatest(post_count - 1, 0), updated_at = now() where id = old.user_id;
  return old;
end;
$$;

create trigger on_post_created after insert on public.posts
for each row execute function public.handle_new_post();

create trigger on_post_deleted after delete on public.posts
for each row execute function public.handle_delete_post();

-- Auto-create user profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.users (id, display_name, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.places_cache enable row level security;

-- Users: anyone can read, only self can update
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Posts: public posts readable by everyone, own posts always readable
create policy "Public posts are viewable" on public.posts for select using (
  visibility = 'public'
  or user_id = auth.uid()
  or (visibility = 'followers' and exists (
    select 1 from public.follows where follower_id = auth.uid() and following_id = posts.user_id
  ))
);
create policy "Users can create own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Follows: anyone can read, only self can manage own follows
create policy "Follows are viewable" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- Places cache: anyone can read, anyone authenticated can insert/update
create policy "Places cache is public" on public.places_cache for select using (true);
create policy "Authenticated users can cache places" on public.places_cache for insert with check (auth.uid() is not null);
create policy "Authenticated users can update cache" on public.places_cache for update using (auth.uid() is not null);

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Anyone can view post images" on storage.objects for select using (bucket_id = 'posts');
create policy "Authenticated users can upload" on storage.objects for insert with check (bucket_id = 'posts' and auth.uid() is not null);
create policy "Users can delete own images" on storage.objects for delete using (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);
