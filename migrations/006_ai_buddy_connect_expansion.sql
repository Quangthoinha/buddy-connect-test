-- =====================================================================
-- Migration 006: AI Buddy Connect Expansion Schema
-- Slug = "buddy-connect" → schema = `app_buddy_connect`
-- =====================================================================

-- 1. Thêm các trường mở rộng vào bảng user_profiles
alter table app_buddy_connect.user_profiles add column if not exists share_skills text[] default '{}';
alter table app_buddy_connect.user_profiles add column if not exists learn_skills text[] default '{}';
alter table app_buddy_connect.user_profiles add column if not exists connect_types text[] default '{}';
alter table app_buddy_connect.user_profiles add column if not exists is_newbie boolean default false;
alter table app_buddy_connect.user_profiles add column if not exists is_buddy_helper boolean default false;
alter table app_buddy_connect.user_profiles add column if not exists consent_granted_at timestamptz default null;

-- 2. Bảng connection_requests (Yêu cầu kết nối 1-1 theo loại)
-- @realtime
create table if not exists app_buddy_connect.connection_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('food', 'sport', 'knowledge', 'casual', 'intro_meet')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  message_template text,
  chat_group_id text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_conn_req_workspace on app_buddy_connect.connection_requests (workspace_id);
create index if not exists idx_conn_req_lookup on app_buddy_connect.connection_requests (workspace_id, from_user_id, to_user_id);

grant select, insert, update, delete on app_buddy_connect.connection_requests to authenticated;
alter table app_buddy_connect.connection_requests enable row level security;

drop policy if exists "conn_req_select" on app_buddy_connect.connection_requests;
create policy "conn_req_select" on app_buddy_connect.connection_requests for select using (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_req_insert" on app_buddy_connect.connection_requests;
create policy "conn_req_insert" on app_buddy_connect.connection_requests for insert with check (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_req_update" on app_buddy_connect.connection_requests;
create policy "conn_req_update" on app_buddy_connect.connection_requests for update using (
  public.can_access_app_data(workspace_id, 'buddy-connect')
) with check (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_req_delete" on app_buddy_connect.connection_requests;
create policy "conn_req_delete" on app_buddy_connect.connection_requests for delete using (
  public.is_owner_workspace_member(workspace_id)
);


-- 3. Bảng connection_meetings (Quản lý cuộc gặp và xác nhận từ 2 phía)
-- @realtime
create table if not exists app_buddy_connect.connection_meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  request_id uuid not null references app_buddy_connect.connection_requests(id) on delete cascade,
  from_confirmed boolean not null default false,
  to_confirmed boolean not null default false,
  confirmed_at timestamptz,
  points_awarded integer not null default 0,
  status text not null default 'pending_confirmation' check (status in ('pending_confirmation', 'confirmed', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists idx_conn_meet_workspace on app_buddy_connect.connection_meetings (workspace_id);
create index if not exists idx_conn_meet_req on app_buddy_connect.connection_meetings (workspace_id, request_id);

grant select, insert, update, delete on app_buddy_connect.connection_meetings to authenticated;
alter table app_buddy_connect.connection_meetings enable row level security;

drop policy if exists "conn_meet_select" on app_buddy_connect.connection_meetings;
create policy "conn_meet_select" on app_buddy_connect.connection_meetings for select using (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_meet_insert" on app_buddy_connect.connection_meetings;
create policy "conn_meet_insert" on app_buddy_connect.connection_meetings for insert with check (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_meet_update" on app_buddy_connect.connection_meetings;
create policy "conn_meet_update" on app_buddy_connect.connection_meetings for update using (
  public.can_access_app_data(workspace_id, 'buddy-connect')
) with check (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_meet_delete" on app_buddy_connect.connection_meetings;
create policy "conn_meet_delete" on app_buddy_connect.connection_meetings for delete using (
  public.is_owner_workspace_member(workspace_id)
);


-- 4. Bảng connection_points (Tích lũy điểm kết nối nội bộ)
-- @realtime
create table if not exists app_buddy_connect.connection_points (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  confirmed_1to1_count integer not null default 0 check (confirmed_1to1_count >= 0),
  group_activity_count integer not null default 0 check (group_activity_count >= 0),
  helper_badge_level text,
  updated_at timestamptz not null default now(),
  constraint uq_workspace_user unique (workspace_id, user_id)
);

create index if not exists idx_conn_pts_workspace on app_buddy_connect.connection_points (workspace_id);
create index if not exists idx_conn_pts_user on app_buddy_connect.connection_points (workspace_id, user_id);

grant select, insert, update, delete on app_buddy_connect.connection_points to authenticated;
alter table app_buddy_connect.connection_points enable row level security;

drop policy if exists "conn_pts_select" on app_buddy_connect.connection_points;
create policy "conn_pts_select" on app_buddy_connect.connection_points for select using (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_pts_insert" on app_buddy_connect.connection_points;
create policy "conn_pts_insert" on app_buddy_connect.connection_points for insert with check (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_pts_update" on app_buddy_connect.connection_points;
create policy "conn_pts_update" on app_buddy_connect.connection_points for update using (
  public.can_access_app_data(workspace_id, 'buddy-connect')
) with check (
  public.can_access_app_data(workspace_id, 'buddy-connect')
);

drop policy if exists "conn_pts_delete" on app_buddy_connect.connection_points;
create policy "conn_pts_delete" on app_buddy_connect.connection_points for delete using (
  public.is_owner_workspace_member(workspace_id)
);

-- Trigger auto updated_at
drop trigger if exists trg_conn_pts_updated_at on app_buddy_connect.connection_points;
create trigger trg_conn_pts_updated_at before update on app_buddy_connect.connection_points for each row execute function app_buddy_connect.set_updated_at();
