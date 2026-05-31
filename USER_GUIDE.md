# HƯỚNG DẪN SỬ DỤNG & TÀI LIỆU KỸ THUẬT 🍄
## BUDDY CONNECT (MUSHY CONNECT) — MINI-APP GẮN KẾT NỘI BỘ

Chào mừng bạn đến với tài liệu hướng dẫn và đặc tả kỹ thuật chi tiết của ứng dụng **Buddy Connect** (Mushy Connect) chạy trên hệ sinh thái **Mushy Super App**. Đây là giải pháp kết nối chéo nhân viên dựa trên sở thích, cơ sở làm việc và lịch trình rảnh để tạo nên văn hóa gắn kết năng động tại công sở.

---

## Ⅰ. BẢN ĐỒ TÍNH NĂNG CHI TIẾT (4 PHÂN HỆ CHÍNH)

Ứng dụng được chia làm 4 phân hệ chính truy cập thông qua thanh điều hướng Tab (Bottom Navigation) ở dưới cùng màn hình:

### 1. Phân hệ 1: Radar Kết Nối (Tab Radar)
Hệ thống lõi gợi ý và quét tìm những đồng nghiệp phù hợp nhất để rủ lập kèo giao lưu.

#### 🎯 Công thức tính Điểm Trùng Khớp (Match Score)
*   **Điểm cơ bản (Base Score):** `30%` ngay khi thuộc cùng một Workspace.
*   **Thẻ sở thích trùng tuyệt đối (Exact Tag Match):** Cộng `25%` cho mỗi thẻ sở thích con giống nhau (ví dụ: cùng thích *Bóng bàn 🏓*).
*   **Danh mục cha trùng (Parent Group Match):** Cộng `10%` cho mỗi nhóm cha trùng (ví dụ: một người thích *Bóng bàn*, một người thích *Cầu lông*, cùng thuộc nhóm *Thể thao*).
*   **Cùng cơ sở làm việc (Facility Match):** Cộng `15%` nếu làm chung tòa nhà/cơ sở vật lý.
*   **Giới hạn trần điểm:** Tối đa **`99%`** để giữ tính thực tế.

#### 🔀 Thuật toán Xếp hạng Ưu tiên Chéo (Priority Levels)
Hệ thống xếp hạng candidate từ trên xuống dưới theo 4 mức ưu tiên để thúc đẩy kết nối chéo:
1.  **Mức 1 (Ưu tiên cao nhất):** Trùng ít nhất 1 thẻ sở thích con **VÀ** khác phòng ban (Department) **VÀ** chưa từng tương tác (giúp kết nối chéo tối đa).
2.  **Mức 2:** Trùng ít nhất 1 thẻ sở thích con **VÀ** cùng phòng ban **VÀ** chưa từng tương tác.
3.  **Mức 3:** Gợi ý chéo dựa trên bộ môn cùng nhóm cha (ví dụ: rủ người thích bóng đá đi chơi tennis vì cùng thuộc nhóm Thể thao) dành cho những ai thiếu ứng viên trùng tag con. Bạn có thể Bật/Tắt gợi ý này qua checkbox **💡 Gợi ý** trên Radar.
4.  **Mức 4 (Đã quen):** Những đồng nghiệp đã từng kết nối thành công trước đó (dựa trên lịch sử tương tác).

#### 💎 Điểm nhấn UX Cao Cấp:
*   **Match Badge phát sáng (Glowing Premium Match Badge):** Với những người có độ khớp từ **80% trở lên**, nhãn Match sẽ hiển thị dạng Gradient đỏ-hồng chuyển động nhẹ nhàng kèm icon lấp lánh (`✨ 95% Match`), giúp họ nổi bật hoàn toàn.
*   **Xem nhanh hồ sơ (Long-press Avatar Tooltip):** Giữ ngón tay vào avatar của đồng nghiệp trong 500ms sẽ kích hoạt Haptic rung nhẹ và mở Bottom Sheet hiển thị chi tiết: Họ tên, phòng ban, cơ sở, khung giờ rảnh của người đó, cùng các nút hành động gọi điện hoặc mời nhanh.
*   **Lập kèo Connect Nhanh:** Click trực tiếp vào thẻ candidate để mở Form mời nhanh, tự động điền thẻ sở thích trùng khớp và gợi ý địa điểm.

---

### 2. Phân hệ 2: Quản Lý Phòng Hẹn (Tab Rooms)
Nơi tự lập hoặc tham gia các phòng giao lưu thể thao, ăn uống, học tập.

#### 🔒 Ràng buộc Tạo phòng Văn minh (Co-creation Constraint)
*   Để tránh "phòng mồ côi", khi tạo phòng, Host bắt buộc phải mời **ít nhất 1 người đồng nghiệp** trong danh sách gợi ý thì mới có thể nhấn nút tạo phòng.

#### ⏳ Tránh trùng lịch trình (Schedule Clash Prevention)
*   Thời gian giãn cách an toàn giữa các kèo là **1.5 giờ** ($\pm 1.5h$).
*   Nếu Host tạo phòng trùng lịch với một phòng khác họ đang tham gia, hệ thống sẽ cảnh báo nhưng cho phép tạo bù nếu muốn.
*   Nếu Guest chấp nhận lời mời trùng lịch, hệ thống sẽ đưa ra hộp thoại cho phép **tự động rút lui khỏi phòng cũ** để gia nhập phòng mới.

#### Stepper Hạn ngạch Lời mời Chờ (Quota Multiplier)
*   Để tránh spam, số lượng lời mời đang ở trạng thái chờ (Pending) bị giới hạn theo công thức:
    $$\text{Hạn ngạch pending} = (\text{Sĩ số tối đa} - \text{Số thành viên hiện tại}) \times \text{Hạn ngạch chờ tối đa}$$
*   Trong Form tạo phòng, bạn có thể điều chỉnh nút **`− / +`** của *Hạn ngạch lời mời chờ tối đa* (hệ số nhân từ 1× đến 10×, mặc định là 3×) giúp tùy biến số slot pending được gửi đi.

#### 🎲 Nút Ghép Ngẫu Nhiên Lập Đầy Hạn Ngạch
Nằm ngay trên danh sách gợi ý tạo phòng hẹn:
*   **Bảo toàn thủ công:** Giữ nguyên những người bạn đã tự tay chọn trước đó.
*   **Tránh trùng lặp:** Tự lọc bỏ những người đã được chọn ra khỏi pool ghép ngẫu nhiên.
*   **Tính toán hạn ngạch tự động:** Lấy số hạn ngạch tối đa trừ đi số người đã chọn, sau đó tự chọn thêm số người tương ứng (hoặc tối đa 3 người nếu hạn ngạch trống lớn) để lấp đầy số lượng pending một cách hoàn hảo nhất.

#### 🛡️ Chống tranh chấp Slot (Optimistic Locking)
*   Sử dụng cơ chế khóa lạc quan (tăng cột `version` của phòng hẹn). Khi slot phòng sắp đầy và có nhiều người cùng bấm tham gia, người gửi yêu cầu trước sẽ lấy được slot, người sau sẽ nhận được thông báo lịch sự *"Slot phòng đã đầy hoặc có tranh chấp"*, ngăn chặn việc phòng bị vượt quá sĩ số tối đa.

#### 🧹 Tự động dọn dẹp kèo hết hạn (Lazy Sweep Daemon)
*   Mỗi khi có bất kỳ ai mở ứng dụng, một tiến trình chạy ngầm quét các phòng hẹn có thời gian diễn ra (`scheduled_at`) nhỏ hơn thời điểm hiện tại mà vẫn ở trạng thái `open` hoặc `filling` để tự động chuyển trạng thái của phòng hẹn đó và các lời mời liên quan sang trạng thái hết hạn (`expired`).

#### 🤝 Hủy kèo văn minh (Host Withdrawal with reasons)
*   Host có quyền hủy phòng hẹn bất kỳ lúc nào nhưng **bắt buộc phải chọn hoặc nhập lý do hủy** (bận việc, thời tiết...). Hệ thống sẽ tự động đăng thông báo lý do hủy vào nhóm chat và đưa nhóm chat đó về chế độ chỉ đọc (Read-only) để giải tán nhóm một cách văn minh.

---

### 3. Phân hệ 3: Hộp Thư Lời Mời (Tab Inbox)
Nơi hiển thị các lời mời tham gia phòng hẹn gửi tới bạn.

*   **Bong bóng số đếm mới:** Tab "Lời Mời" hiển thị một bong bóng số màu đỏ nổi bật (nhún nhảy nhẹ) thông báo số lượng lời mời pending đang đợi bạn duyệt.
*   **Phản hồi nhanh:** Nút *Đồng ý* / *Từ chối* hiển thị trực tiếp.
*   **Vô hiệu hóa thông minh:** Nếu phòng hẹn liên quan đã bị hủy, hết hạn hoặc đầy slot trước khi bạn đồng ý, thẻ lời mời sẽ chuyển sang trạng thái vô hiệu hóa kèm thông báo rõ ràng: *"Rất tiếc, phòng hẹn đã đủ thành viên hoặc đã bị hủy. Hẹn bạn kèo sau nhé! 🍄"*

---

### 4. Phân hệ 4: Thiết Lập Hồ Sơ (Tab Profile)
Nơi cá nhân hóa sở thích và thông tin công việc để tối ưu hóa thuật toán Radar chéo.

*   **Thông tin công việc:** Đăng ký Phòng ban (Department), Cơ sở làm việc (Facility).
*   **Khung giờ rảnh rỗi:** Tick chọn các khung giờ phù hợp (Giờ ăn trưa, Chiều sau giờ làm, Cuối tuần, Tối ngày thường).
*   **Bản đồ 200 nhãn sở thích (Accordion & Sticky Search):**
    *   200 nhãn sở thích được chia đều vào **10 nhóm cha** (Thể thao, Giải trí, Ăn uống, Học tập, Công nghệ, Sức khỏe, Du lịch, Nghệ thuật, Phong cách sống, Giao lưu).
    *   **Tìm kiếm thông minh (Sticky Search):** Gõ tìm kiếm nhãn con (ví dụ: "tennis"), hệ thống sẽ tự động lọc, bôi vàng từ khóa trùng khớp (Highlight) và tự động mở bung (auto expand) danh mục cha chứa từ khóa đó để bạn chọn nhanh.

---

## Ⅱ. TÍNH NĂNG LIÊN-WORKSPACE (CROSS-WORKSPACE SHARING)

Giải pháp đột phá hỗ trợ liên kết chia sẻ dữ liệu và kết nối chéo giữa các tổ chức/chi nhánh độc lập.

1.  **Thiết lập liên kết:**
    *   Admin Workspace A bấm **⚙️ (icon bánh răng Header)** -> Chọn tab **Tạo mã** để sinh mã PIN 6 ký tự (có hiệu lực 24 giờ).
    *   Admin Workspace B sang ứng dụng của mình, bấm bánh răng -> Tab **Nhận mã** và nhập mã PIN để kết nối hai Workspace.
2.  **Chuyển đổi Scope linh hoạt:**
    *   Sau khi liên kết, mọi thành viên sẽ thấy một **Dropdown chuyển đổi Workspace (ScopeSwitcher)** nằm ngay trên Header chính của ứng dụng.
    *   Chuyển đổi Workspace nào, toàn bộ Radar, Phòng hẹn và Gợi ý sẽ lập tức query tập dữ liệu động của Workspace đó.
3.  **Phân quyền bảo mật RLS chặt chẽ:**
    *   *Đọc/Thêm/Sửa:* Cho phép cả thành viên Workspace chính và Workspace liên kết thực hiện (thông qua hàm kiểm tra quyền truy cập chéo `public.can_access_app_data`).
    *   *Xóa dữ liệu:* Chỉ tài khoản thuộc Workspace gốc sở hữu dữ liệu mới được phép xóa (thông qua hàm RLS `public.is_owner_workspace_member`), ngăn chặn triệt để tình trạng Workspace liên kết xóa nhầm dữ liệu của Workspace gốc.

---

## Ⅲ. HƯỚNG DẪN DÀNH CHO NGƯỜI DÙNG MỚI (QUICK START)

*   **Bước 1: Thiết lập hồ sơ**
    Khi vừa mở ứng dụng lần đầu, hãy truy cập Tab **Hồ Sơ** để điền Phòng ban, Cơ sở và chọn ít nhất 3-5 thẻ sở thích. Bấm **Lưu thay đổi**.
*   **Bước 2: Tìm cạ cứng trên Radar**
    Chuyển sang Tab **Radar**. Bạn sẽ thấy danh sách đồng nghiệp được xếp thứ tự từ hợp nhất đến ít hợp hơn.
    *   *Tip:* Bạn có thể ấn giữ avatar của họ trong 500ms để xem nhanh họ rảnh lúc nào, thích những môn gì.
*   **Bước 3: Lên lịch hẹn (Connect)**
    Click chọn một đồng nghiệp trên Radar -> Chọn môn bạn muốn rủ -> Điền địa điểm, thời gian -> Mời thêm người khác (hoặc bấm **Ghép ngẫu nhiên lấp đầy hạn ngạch** để hệ thống tự điền) -> Nhấn **Tạo phòng hẹn & Gửi lời mời**.
*   **Bước 4: Trải nghiệm & Kết nối**
    Lời mời sẽ bay tới Inbox của đồng nghiệp. Ngay khi họ bấm **Chấp nhận**, một nhóm chat native trên Mushy Super App sẽ tự động được khởi tạo để các bạn bàn bạc chi tiết!

---

## Ⅳ. TÀI LIỆU KỸ THUẬT CHO LẬP TRÌNH VIÊN (TECHNICAL MANUAL)

### 1. Khung công nghệ lõi
*   **Frontend:** React 18, Vite.
*   **Styling:** Vanilla CSS (với các biến CSS token đồng nhất với Mushy Design System).
*   **Database:** Supabase PostgreSQL (Schema Production: `app_buddy_connect` / Schema Sandbox Dev: `app_buddy_connect_dev`).
*   **Realtime:** Logical replication qua Pub/Sub của Supabase Realtime (bảng `rooms` và `invitations`).

### 2. Cấu trúc cơ sở dữ liệu (Database Schema)

*   **Bảng `tags`:** Định nghĩa 200 nhãn sở thích phân cấp cha/con.
*   **Bảng `user_profiles`:** Lưu thông tin hành chính (phòng ban, facility) và mảng thời gian rảnh.
*   **Bảng `user_tags`:** Mối quan hệ nhiều-nhiều giữa User và các thẻ sở thích con (`tags`).
*   **Bảng `rooms`:** Lưu thông tin các phòng hẹn (host, địa điểm, thời gian, trạng thái, version khóa lạc quan).
*   **Bảng `invitations`:** Trạng thái lời mời (`pending`, `accepted`, `declined`, `expired`) gửi đến Guest.
*   **Bảng `interaction_history`:** Lưu vết cặp người dùng đã từng tham gia chung phòng hẹn thành công để gợi ý mục "Đã từng kết nối".

### 3. Tích hợp Native JS Bridge (`postMessage`)
Ứng dụng sử dụng Native Bridge giao tiếp với thiết bị di động:
*   `bridge.haptic('light' | 'medium' | 'success')`: Rung phản hồi vật lý khi click, giữ avatar hoặc lưu thành công.
*   `CREATE_CHAT_GROUP`: Sinh group chat native khi phòng hẹn gom đủ người (`status = 'matched'`).
*   `OPEN_CHAT_GROUP`: Mở group chat native từ UI của phòng hẹn.
*   `SEND_CHAT_MESSAGE`: Gửi tin nhắn bot tự động thông báo khi hủy phòng hẹn.
*   `LOCK_CHAT_GROUP_READONLY`: Khóa quyền chat của group khi phòng hẹn kết thúc hoặc bị hủy.
*   `bridge.tel(phone)`: Thực hiện gọi điện trực tiếp từ app.

### 4. Gửi thông báo đẩy (`mini-proxy` Push API)
*   Khi có lời mời mới, hệ thống gọi API `mushyApi.push` gửi notification.
*   **Chế độ Dev Mode:** API tự động chặn lọc thông báo chéo để **chỉ gửi đến thiết bị của chính nhà phát triển (App Owner)**, tuyệt đối không làm phiền những thành viên khác trong Workspace khi đang lập trình/thử nghiệm.

---
*Chúc bạn có những giây phút kết nối thật tuyệt vời cùng Buddy Connect! 🍄*
