-- =====================================================================
-- Migration 012: Allow recipients to clean up expired invitations
-- Slug = "buddy-connect" → schema = `app_buddy_connect`
-- =====================================================================

-- 1. Người nhận lời mời kết nối 1-1 cũng có thể xoá lời mời quá hạn gửi tới họ.
drop policy if exists "conn_req_delete" on app_buddy_connect.connection_requests;
create policy "conn_req_delete" on app_buddy_connect.connection_requests
for delete using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- 2. Người nhận invitation vào room/cộng đồng, hoặc host của room, có thể xoá invitation.
drop policy if exists "invitations_delete" on app_buddy_connect.invitations;
create policy "invitations_delete" on app_buddy_connect.invitations
for delete using (
  auth.uid() = receiver_id
  or exists (
    select 1 from app_buddy_connect.rooms r
    where r.id = room_id and r.host_id = auth.uid()
  )
);
