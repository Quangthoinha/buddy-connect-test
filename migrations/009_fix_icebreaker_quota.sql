-- =====================================================================
-- Migration 009: Fix icebreaker_quotas missing FKs and DELETE policy
-- Slug = "buddy-connect" → schema = `app_buddy_connect`
--
-- 005 tạo bảng icebreaker_quotas thiếu foreign key và dùng sai DELETE policy
-- (can_access_app_data cho phép follower xoá). Migration này khắc phục.
-- =====================================================================

-- 1. Add FK on user_id → auth.users(id) (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fk_icebreaker_quotas_user'
      and conrelid = 'app_buddy_connect.icebreaker_quotas'::regclass
  ) then
    alter table app_buddy_connect.icebreaker_quotas
      add constraint fk_icebreaker_quotas_user
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- 2. Add FK on workspace_id → public.workspaces(id) (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fk_icebreaker_quotas_workspace'
      and conrelid = 'app_buddy_connect.icebreaker_quotas'::regclass
  ) then
    alter table app_buddy_connect.icebreaker_quotas
      add constraint fk_icebreaker_quotas_workspace
      foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  end if;
end $$;

-- 3. Fix DELETE policy: only the quota owner can delete their own row
-- Followers / cross-workspace members must NOT delete someone else's quota.
drop policy if exists "quotas_delete" on app_buddy_connect.icebreaker_quotas;
create policy "quotas_delete" on app_buddy_connect.icebreaker_quotas
for delete using (
  auth.uid() = user_id
);
