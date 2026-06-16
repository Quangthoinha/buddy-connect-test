-- =====================================================================
-- Migration 010: Drop legacy unused tables
-- Slug = "buddy-connect" → schema = `app_buddy_connect`
--
-- Các bảng rooms/invitations/reputation/tournaments/community/posts không còn
-- được UI (App.jsx) sử dụng sau khi app chuyển sang mô hình 1-1 connection.
-- Migration này dọn dẹp schema, lưu ý xoá luôn data cũ (irreversible).
-- =====================================================================

-- Drop dependent tables first to avoid FK dependency errors.
-- Tables dropped: post_likes → community_posts → tournament_participants → tournaments
--                 → reputation_history → invitations → rooms

-- 1. Likes on community posts
drop table if exists app_buddy_connect.post_likes;

-- 2. Community feed posts (references rooms)
drop table if exists app_buddy_connect.community_posts;

-- 3. Tournament participation records (references tournaments)
drop table if exists app_buddy_connect.tournament_participants;

-- 4. Tournament definitions
drop table if exists app_buddy_connect.tournaments;

-- 5. Reputation change history
drop table if exists app_buddy_connect.reputation_history;

-- 6. Room invitations (references rooms)
drop table if exists app_buddy_connect.invitations;

-- 7. Rooms / clubs (parent of invitations and community_posts)
drop table if exists app_buddy_connect.rooms;
