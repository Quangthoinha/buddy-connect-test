-- =====================================================================
-- Migration 006: Reputation Score, Corporate Tournaments & Community Feed
-- Slug = "buddy-connect" → schema = `app_buddy_connect`
-- =====================================================================

-- 1. Thêm cột reputation_score vào bảng user_profiles
alter table app_buddy_connect.user_profiles add column if not exists reputation_score integer not null default 100;

-- 2. Thêm cột checked_in_users, no_shows, và roll_call_done vào bảng rooms
alter table app_buddy_connect.rooms 
  add column if not exists checked_in_users uuid[] not null default '{}',
  add column if not exists no_shows uuid[] not null default '{}',
  add column if not exists roll_call_done boolean not null default false;

-- 3. Bảng Lịch sử Uy Tín (reputation_history)
-- @realtime
create table if not exists app_buddy_connect.reputation_history (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  points_change integer not null,
  reason        text not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_reputation_history_workspace on app_buddy_connect.reputation_history (workspace_id);
create index if not exists idx_reputation_history_user on app_buddy_connect.reputation_history (workspace_id, user_id);

grant select, insert, update, delete on app_buddy_connect.reputation_history to authenticated;
alter table app_buddy_connect.reputation_history enable row level security;

drop policy if exists "reputation_history_select" on app_buddy_connect.reputation_history;
create policy "reputation_history_select" on app_buddy_connect.reputation_history for select using (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "reputation_history_insert" on app_buddy_connect.reputation_history;
create policy "reputation_history_insert" on app_buddy_connect.reputation_history for insert with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "reputation_history_update" on app_buddy_connect.reputation_history;
create policy "reputation_history_update" on app_buddy_connect.reputation_history for update using (public.can_access_app_data(workspace_id, 'buddy-connect')) with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "reputation_history_delete" on app_buddy_connect.reputation_history;
create policy "reputation_history_delete" on app_buddy_connect.reputation_history for delete using (public.is_owner_workspace_member(workspace_id));


-- 4. Bảng Giải Đấu (tournaments)
-- @realtime
create table if not exists app_buddy_connect.tournaments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  creator_id    uuid not null references auth.users(id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  sport_code    text not null,
  target_metric text not null check (target_metric in ('km', 'matches', 'points', 'hours')),
  target_value  integer not null check (target_value > 0),
  start_at      timestamptz not null,
  end_at        timestamptz not null,
  status        text not null default 'active' check (status in ('active', 'completed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_tournaments_workspace on app_buddy_connect.tournaments (workspace_id);

grant select, insert, update, delete on app_buddy_connect.tournaments to authenticated;
alter table app_buddy_connect.tournaments enable row level security;

drop policy if exists "tournaments_select" on app_buddy_connect.tournaments;
create policy "tournaments_select" on app_buddy_connect.tournaments for select using (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "tournaments_insert" on app_buddy_connect.tournaments;
create policy "tournaments_insert" on app_buddy_connect.tournaments for insert with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "tournaments_update" on app_buddy_connect.tournaments;
create policy "tournaments_update" on app_buddy_connect.tournaments for update using (public.can_access_app_data(workspace_id, 'buddy-connect')) with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "tournaments_delete" on app_buddy_connect.tournaments;
create policy "tournaments_delete" on app_buddy_connect.tournaments for delete using (public.is_owner_workspace_member(workspace_id));

drop trigger if exists trg_tournaments_updated_at on app_buddy_connect.tournaments;
create trigger trg_tournaments_updated_at before update on app_buddy_connect.tournaments for each row execute function app_buddy_connect.set_updated_at();


-- 5. Bảng Thành Viên Tham Gia Giải Đấu (tournament_participants)
-- @realtime
create table if not exists app_buddy_connect.tournament_participants (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  tournament_id uuid not null references app_buddy_connect.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  current_value integer not null default 0 check (current_value >= 0),
  created_at    timestamptz not null default now(),
  primary key (workspace_id, tournament_id, user_id)
);

create index if not exists idx_tournament_parts_workspace on app_buddy_connect.tournament_participants (workspace_id);

grant select, insert, update, delete on app_buddy_connect.tournament_participants to authenticated;
alter table app_buddy_connect.tournament_participants enable row level security;

drop policy if exists "tournament_parts_select" on app_buddy_connect.tournament_participants;
create policy "tournament_parts_select" on app_buddy_connect.tournament_participants for select using (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "tournament_parts_insert" on app_buddy_connect.tournament_participants;
create policy "tournament_parts_insert" on app_buddy_connect.tournament_participants for insert with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "tournament_parts_update" on app_buddy_connect.tournament_participants;
create policy "tournament_parts_update" on app_buddy_connect.tournament_participants for update using (public.can_access_app_data(workspace_id, 'buddy-connect')) with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "tournament_parts_delete" on app_buddy_connect.tournament_participants;
create policy "tournament_parts_delete" on app_buddy_connect.tournament_participants for delete using (public.is_owner_workspace_member(workspace_id));


-- 6. Bảng Bài viết Cộng đồng (community_posts)
-- @realtime
create table if not exists app_buddy_connect.community_posts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 2000),
  room_id       uuid references app_buddy_connect.rooms(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_community_posts_workspace on app_buddy_connect.community_posts (workspace_id);

grant select, insert, update, delete on app_buddy_connect.community_posts to authenticated;
alter table app_buddy_connect.community_posts enable row level security;

drop policy if exists "community_posts_select" on app_buddy_connect.community_posts;
create policy "community_posts_select" on app_buddy_connect.community_posts for select using (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "community_posts_insert" on app_buddy_connect.community_posts;
create policy "community_posts_insert" on app_buddy_connect.community_posts for insert with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "community_posts_update" on app_buddy_connect.community_posts;
create policy "community_posts_update" on app_buddy_connect.community_posts for update using (public.can_access_app_data(workspace_id, 'buddy-connect')) with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "community_posts_delete" on app_buddy_connect.community_posts;
create policy "community_posts_delete" on app_buddy_connect.community_posts for delete using (public.is_owner_workspace_member(workspace_id) or auth.uid() = user_id);


-- 7. Bảng Lượt thích bài viết (post_likes)
-- @realtime
create table if not exists app_buddy_connect.post_likes (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  post_id       uuid not null references app_buddy_connect.community_posts(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (workspace_id, post_id, user_id)
);

create index if not exists idx_post_likes_workspace on app_buddy_connect.post_likes (workspace_id);

grant select, insert, update, delete on app_buddy_connect.post_likes to authenticated;
alter table app_buddy_connect.post_likes enable row level security;

drop policy if exists "post_likes_select" on app_buddy_connect.post_likes;
create policy "post_likes_select" on app_buddy_connect.post_likes for select using (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "post_likes_insert" on app_buddy_connect.post_likes;
create policy "post_likes_insert" on app_buddy_connect.post_likes for insert with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "post_likes_update" on app_buddy_connect.post_likes;
create policy "post_likes_update" on app_buddy_connect.post_likes for update using (public.can_access_app_data(workspace_id, 'buddy-connect')) with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "post_likes_delete" on app_buddy_connect.post_likes;
create policy "post_likes_delete" on app_buddy_connect.post_likes for delete using (public.can_access_app_data(workspace_id, 'buddy-connect'));
