# Kế hoạch fix 4 lỗi từ screenshot Mushy Connect (buddy-connect)

## 1. Radar search không tìm được đồng nghiệp không "match"

**Nguyên nhân:** `src/hooks/useRankedCandidates.js` lọc kết quả theo tên/phòng ban/cơ sở/thẻ khi `searchQuery` có giá trị, nhưng sau đó vẫn áp dụng `if (exactMatchCount === 0 && !isFallback) return null;` → những người không có tag/skill chung bị loại ngay cả khi user tìm đúng tên.

**Giải pháp:** Khi `searchQuery` khác rỗng, bỏ qua bộ lọc "phải có điểm chung". Giữ lại kết quả tìm kiếm với điểm match thấp hơn (chỉ tính các yếu tố có thì cộng, không cần exact tag). Đảm bảo tìm theo tên vẫn hiện người đó.

## 2. Thanh liên-Workspace / ScopeSwitcher nhấn không có phản ứng

**Nguyên nhân:** `src/components/SharingModal.jsx` dòng 72 dùng biến `loading` chưa được khai báo (prop truyền vào là `loadingGrants`). Khi người dùng bấm nút "⇆ Liên-Workspace" trong leaderboard, component render bị `ReferenceError`, khiến màn hình trắng / không hiện modal.

**Giải pháp:** Sửa `loading` → `loadingGrants`. Đồng thời kiểm tra `ScopeSwitcher` có bị vô hiệu hóa khi chỉ có 1 scope không (hiện tại code đã cố tình luôn mở dropdown để user vào quản lý share, nhưng cần đảm bảo dropdown hiện rõ).

## 3. Gửi lời mời lỗi "JWT expired" + AI không chạy

**Nguyên nhân:** Token JWT từ `getContext()` hết hạn sau ~1h. `App.jsx` capture context 1 lần bằng `useMemo(..., [])`, và mọi handler gọi DB/API/push đều dùng token cũ. `mushyApi.push` và các endpoint `/api/icebreaker`, `/api/match` trả về lỗi JWT expired.

**Giải pháp:**
- Tạo helper app-specific `src/lib/app/token.js` để parse JWT `exp` và gọi `bridge.refreshToken()` khi token sắp/đã hết hạn.
- Sau refresh, cập nhật `window.__APP_CONTEXT__.token` và gọi `resetSupabaseClients()` để Supabase client REST dùng token mới.
- Gọi `ensureFreshToken()` ở đầu các handler quan trọng: gửi lời mời (group + quick connect), chấp nhận/từ chối, xác nhận cuộc gặp, tạo cộng đồng, mời thành viên, gửi AI icebreaker, load match reasons.
- Với các `fetch('/api/*')`, dùng token mới từ `ensureFreshToken()` trong header thay vì token `ctx` cũ.

## 4. Đồng nghiệp nhận tin/tin nhắn không có push notification

**Nguyên nhân:**
- Lời mời đã có `mushyApi.push`, nhưng bị fail do JWT expired (fix ở mục 3). Ngoài ra payload thiếu `data.kind` nên user không thể tắt loại thông báo riêng.
- Chat message (`handleSendChatMessage`) hiện không gửi push nào.

**Giải pháp:**
- Sau khi fix token, thêm `data: { appSlug: 'buddy-connect', kind: 'connection_invite', screen: 'inbox' }` cho push lời mời.
- Thêm push khi gửi tin nhắn chat (1-1 gửi cho buddy, nhóm gửi cho members khác sender) với `kind: 'chat_message'`.

## Các file cần sửa

- `src/hooks/useRankedCandidates.js` — search override match logic.
- `src/components/SharingModal.jsx` — fix `loading` → `loadingGrants`.
- `src/lib/app/token.js` — helper token refresh mới.
- `src/App.jsx` — gọi `ensureFreshToken()` trong các handler + cập nhật header API fetch + thêm push cho chat.
- `src/components/QuickConnectSheet.jsx` — có thể cần đảm bảo AI button không bị vô hiệu hóa khi token hết hạn (chủ yếu fix token).

## Kiểm thử

- Radar: tìm tên đồng nghiệp không có tag/skill chung vẫn hiện.
- Connections → bấm "⇆ Liên-Workspace" hiện modal.
- Gửi lời mời sau khi token cũ: thành công, đồng nghiệp nhận push.
- AI gợi ý câu mở đầu chạy được sau refresh token.

## Trade-off

- Token helper là app-specific (`src/lib/app/token.js`), không đụng shared infra (`src/lib/*`), tuân thủ CLAUDE.md.
- Không sửa `mushy-api.js` / `context.js` / `supabase.js`; chỉ import `resetSupabaseClients` từ shared infra (export công khai) để tái tạo client khi token mới.
