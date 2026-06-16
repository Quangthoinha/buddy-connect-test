-- =====================================================================
-- Migration 011: Restore Rooms (Communities/Clubs) and Invitations
-- Slug = "buddy-connect" → schema = `app_buddy_connect`
-- =====================================================================

-- 1. Bảng Quản lý Phòng hẹn / Cộng đồng (rooms)
-- @realtime
create table if not exists app_buddy_connect.rooms (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  host_id          uuid not null references auth.users(id) on delete cascade,
  child_code       text not null,
  location         text not null check (char_length(location) between 1 and 200),
  scheduled_at     timestamptz,
  max_participants integer not null default 100 check (max_participants >= 2),
  status           text not null default 'open' check (status in ('open', 'filling', 'matched', 'cancelled', 'expired')),
  chat_group_id    text,
  chat_messages    text not null default '[]', -- JSON string for group chat
  cancel_reason    text,
  is_club          boolean not null default false,
  club_name        text check (club_name is null or char_length(club_name) between 1 and 200),
  club_description text check (club_description is null or char_length(club_description) between 1 and 1000),
  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_rooms_workspace_status on app_buddy_connect.rooms (workspace_id, status);
create index if not exists idx_rooms_is_club on app_buddy_connect.rooms (workspace_id, is_club);

grant select, insert, update, delete on app_buddy_connect.rooms to authenticated;
alter table app_buddy_connect.rooms enable row level security;

drop policy if exists "rooms_select" on app_buddy_connect.rooms;
create policy "rooms_select" on app_buddy_connect.rooms for select using (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "rooms_insert" on app_buddy_connect.rooms;
create policy "rooms_insert" on app_buddy_connect.rooms for insert with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "rooms_update" on app_buddy_connect.rooms;
create policy "rooms_update" on app_buddy_connect.rooms for update using (public.can_access_app_data(workspace_id, 'buddy-connect')) with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "rooms_delete" on app_buddy_connect.rooms;
create policy "rooms_delete" on app_buddy_connect.rooms for delete using (public.is_owner_workspace_member(workspace_id));


-- 2. Bảng Theo dõi lời mời (invitations)
-- @realtime
create table if not exists app_buddy_connect.invitations (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  room_id       uuid not null references app_buddy_connect.rooms(id) on delete cascade,
  receiver_id   uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_invitations_receiver on app_buddy_connect.invitations (workspace_id, receiver_id);
create index if not exists idx_invitations_room on app_buddy_connect.invitations (workspace_id, room_id);

grant select, insert, update, delete on app_buddy_connect.invitations to authenticated;
alter table app_buddy_connect.invitations enable row level security;

drop policy if exists "invitations_select" on app_buddy_connect.invitations;
create policy "invitations_select" on app_buddy_connect.invitations for select using (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "invitations_insert" on app_buddy_connect.invitations;
create policy "invitations_insert" on app_buddy_connect.invitations for insert with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "invitations_update" on app_buddy_connect.invitations;
create policy "invitations_update" on app_buddy_connect.invitations for update using (public.can_access_app_data(workspace_id, 'buddy-connect')) with check (public.can_access_app_data(workspace_id, 'buddy-connect'));

drop policy if exists "invitations_delete" on app_buddy_connect.invitations;
create policy "invitations_delete" on app_buddy_connect.invitations for delete using (public.is_owner_workspace_member(workspace_id));


-- 3. Triggers auto updated_at
drop trigger if exists trg_rooms_updated_at on app_buddy_connect.rooms;
create trigger trg_rooms_updated_at before update on app_buddy_connect.rooms for each row execute function app_buddy_connect.set_updated_at();

drop trigger if exists trg_invitations_updated_at on app_buddy_connect.invitations;
create trigger trg_invitations_updated_at before update on app_buddy_connect.invitations for each row execute function app_buddy_connect.set_updated_at();
