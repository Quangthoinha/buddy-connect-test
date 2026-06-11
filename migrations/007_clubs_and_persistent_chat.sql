-- =====================================================================
-- Migration 007: Clubs (Câu lạc bộ) and Persistent Chat Support
-- Slug = "buddy-connect" → schema = `app_buddy_connect`
-- =====================================================================

-- 1. Thêm các cột cho Câu lạc bộ vào bảng rooms
alter table app_buddy_connect.rooms add column if not exists is_club boolean not null default false;
alter table app_buddy_connect.rooms add column if not exists club_name text;
alter table app_buddy_connect.rooms add column if not exists club_description text;

-- 2. Cho phép scheduled_at có thể null (Câu lạc bộ hoạt động lâu dài không có thời gian hết hạn)
alter table app_buddy_connect.rooms alter column scheduled_at drop not null;
