import React from 'react';

// Tag Taxonomy - 10 Parent Groups x 20 Child Tags = 200 Tags total
export const TAXONOMY = [
  {
    parent_code: 'sport', parent_name: 'Thể thao 🏸',
    children: [
      { code: 'badminton', name: 'Cầu lông 🏸' },
      { code: 'football', name: 'Bóng đá ⚽' },
      { code: 'running', name: 'Chạy bộ 🏃' },
      { code: 'gym', name: 'Tập Gym 🏋️' },
      { code: 'tennis', name: 'Tennis 🎾' },
      { code: 'basketball', name: 'Bóng rổ 🏀' },
      { code: 'swimming', name: 'Bơi lội 🏊' },
      { code: 'cycling', name: 'Đạp xe 🚴' },
      { code: 'tabletennis', name: 'Bóng bàn 🏓' },
      { code: 'yoga', name: 'Tập Yoga 🧘' },
      { code: 'climbing', name: 'Leo núi 🧗' },
      { code: 'billiards', name: 'Bi-a 🎱' },
      { code: 'chess', name: 'Cờ vua ♟️' },
      { code: 'xiangqi', name: 'Cờ tướng ☖' },
      { code: 'archery', name: 'Bắn cung 🏹' },
      { code: 'golf', name: 'Chơi Golf 🏌️' },
      { code: 'kayaking', name: 'Chèo thuyền 🛶' },
      { code: 'skateboarding', name: 'Trượt ván 🛹' },
      { code: 'bowling', name: 'Bowling 🎳' },
      { code: 'martialarts', name: 'Võ thuật 🥋' }
    ]
  },
  {
    parent_code: 'entertainment', parent_name: 'Giải trí 🎮',
    children: [
      { code: 'gaming', name: 'Chơi Game 🎮' },
      { code: 'boardgame', name: 'Board game 🎲' },
      { code: 'movie', name: 'Xem phim 🎬' },
      { code: 'music', name: 'Nghe nhạc 🎵' },
      { code: 'painting', name: 'Vẽ tranh 🎨' },
      { code: 'photography', name: 'Chụp ảnh 📸' },
      { code: 'reading', name: 'Đọc sách 📚' },
      { code: 'podcast', name: 'Nghe Podcast 🎧' },
      { code: 'theater', name: 'Xem kịch 🎭' },
      { code: 'karaoke', name: 'Hát Karaoke 🎤' },
      { code: 'pubbar', name: 'Đi Bar/Pub 🍷' },
      { code: 'comedy', name: 'Hài độc thoại 🎤' },
      { code: 'collecting', name: 'Sưu tầm 🪙' },
      { code: 'tarot', name: 'Bói Tarot 🃏' },
      { code: 'petcare', name: 'Thú cưng 🐶' },
      { code: 'gardening', name: 'Làm vườn 🪴' },
      { code: 'origami', name: 'Xếp giấy Origami 📄' },
      { code: 'lego', name: 'Lắp Lego 🧱' },
      { code: 'walking', name: 'Đi dạo 🚶' },
      { code: 'blogging', name: 'Viết Blog 📝' }
    ]
  },
  {
    parent_code: 'gastronomy', parent_name: 'Ăn uống 🍲',
    children: [
      { code: 'cafe', name: 'Đi uống Cafe ☕' },
      { code: 'milktea', name: 'Uống Trà sữa 🧋' },
      { code: 'snacking', name: 'Ăn vặt 🍟' },
      { code: 'buffet', name: 'Ăn Buffet 🥩' },
      { code: 'hotpot', name: 'Ăn Lẩu 🍲' },
      { code: 'bbq', name: 'Ăn đồ nướng BBQ 🍖' },
      { code: 'pastries', name: 'Bánh ngọt 🍰' },
      { code: 'afternoontea', name: 'Trà chiều 🫖' },
      { code: 'foodhunting', name: 'Khám phá quán mới 🔍' },
      { code: 'homecooking', name: 'Nấu ăn tại nhà 🍳' },
      { code: 'baking', name: 'Làm bánh 🥖' },
      { code: 'vegan', name: 'Ăn đồ chay 🥗' },
      { code: 'wine', name: 'Thưởng rượu 🍷' },
      { code: 'koreanfood', name: 'Món ăn Hàn 🇰🇷' },
      { code: 'japanesefood', name: 'Món ăn Nhật 🇯🇵' },
      { code: 'thaifood', name: 'Món ăn Thái 🇹🇭' },
      { code: 'noodles', name: 'Phở & Bún bò 🍜' },
      { code: 'streetfood', name: 'Ẩm thực đường phố 🍢' },
      { code: 'seafood', name: 'Ăn Hải sản 🦞' },
      { code: 'healthyfood', name: 'Đồ ăn Healthy 🥗' }
    ]
  },
  {
    parent_code: 'learning', parent_name: 'Học tập & Kỹ năng 📖',
    children: [
      { code: 'language', name: 'Học ngoại ngữ 🗣️' },
      { code: 'presentation', name: 'Thuyết trình 📊' },
      { code: 'writing', name: 'Viết sáng tạo ✍️' },
      { code: 'communication', name: 'Kỹ năng giao tiếp 💬' },
      { code: 'criticalthinking', name: 'Tư duy phản biện 🧠' },
      { code: 'timemanagement', name: 'Quản lý thời gian ⏱️' },
      { code: 'finance', name: 'Đầu tư tài chính 📈' },
      { code: 'professionalreading', name: 'Sách chuyên môn 📘' },
      { code: 'leadership', name: 'Kỹ năng lãnh đạo 👑' },
      { code: 'slidedesign', name: 'Thiết kế Slide 🖼️' },
      { code: 'voice', name: 'Luyện giọng nói 🗣️' },
      { code: 'negotiation', name: 'Kỹ năng đàm phán 🤝' },
      { code: 'problemsolving', name: 'Giải quyết vấn đề 🧩' },
      { code: 'teamwork', name: 'Làm việc nhóm 👥' },
      { code: 'mindmap', name: 'Vẽ Mindmap 🗺️' },
      { code: 'instrument', name: 'Học chơi đàn 🎸' },
      { code: 'artclasses', name: 'Học vẽ mỹ thuật 🎨' },
      { code: 'flowerarranging', name: 'Cắm hoa 💐' },
      { code: 'phonephoto', name: 'Chụp ảnh điện thoại 📱' },
      { code: 'potteryclas', name: 'Làm gốm 🏺' }
    ]
  },
  {
    parent_code: 'technology', parent_name: 'Công nghệ & Sáng tạo 💻',
    children: [
      { code: 'ai', name: 'Trí tuệ nhân tạo AI 🤖' },
      { code: 'frontend', name: 'Lập trình Frontend 💻' },
      { code: 'backend', name: 'Lập trình Backend ⚙️' },
      { code: 'uiux', name: 'Thiết kế UI/UX 🎨' },
      { code: 'datascience', name: 'Khoa học dữ liệu 📊' },
      { code: 'productmanagement', name: 'Phát triển sản phẩm 🚀' },
      { code: 'blockchain', name: 'Blockchain ⛓️' },
      { code: 'security', name: 'An toàn thông tin 🛡️' },
      { code: 'cloud', name: 'Điện toán đám mây ☁️' },
      { code: 'graphicdesign', name: 'Thiết kế đồ họa 🎨' },
      { code: 'videoediting', name: 'Edit Video 🎬' },
      { code: 'content', name: 'Sáng tạo nội dung ✍️' },
      { code: 'nocode', name: 'No-code / Low-code 🛠️' },
      { code: 'automation', name: 'Tự động hóa 🤖' },
      { code: 'miniapp', name: 'Phát triển Mini-App 📱' },
      { code: 'seo', name: 'Tối ưu hóa SEO 📈' },
      { code: 'ba', name: 'Phân tích nghiệp vụ BA 📊' },
      { code: 'agilescrum', name: 'Agile & Scrum 🔄' },
      { code: 'iot', name: 'Internet of Things 🔌' },
      { code: 'illustration', name: 'Vẽ minh họa 🎨' }
    ]
  },
  {
    parent_code: 'health', parent_name: 'Sức khỏe & Tinh thần 🧘',
    children: [
      { code: 'meditation', name: 'Thiền định 🧘' },
      { code: 'mentalhealth', name: 'Trị liệu tinh thần 🧠' },
      { code: 'skincare', name: 'Chăm sóc da Skincare 🧴' },
      { code: 'keto', name: 'Chế độ ăn Keto 🥩' },
      { code: 'sleep', name: 'Rèn giấc ngủ ngon 😴' },
      { code: 'detox', name: 'Detox cơ thể 🥤' },
      { code: 'aerobic', name: 'Thể dục nhịp điệu 🤸' },
      { code: 'walking10k', name: 'Đi bộ 10k bước 🚶' },
      { code: 'pilates', name: 'Tập Pilates 🧘' },
      { code: 'spa', name: 'Massage & Spa 💆' },
      { code: 'counseling', name: 'Tư vấn tâm lý 💬' },
      { code: 'aromatherapy', name: 'Liệu pháp hương thơm 🪵' },
      { code: 'soundbath', name: 'Trị liệu chuông xoay 🔔' },
      { code: 'naturalhealing', name: 'Chữa lành tự nhiên 🌱' },
      { code: 'minimalismlife', name: 'Sống tối giản 🌿' },
      { code: 'focus', name: 'Rèn sự tập trung 🎯' },
      { code: 'gratitude', name: 'Viết sổ biết ơn 📓' },
      { code: 'earlyrise', name: 'Thử thách dậy sớm 🌅' },
      { code: 'fasting', name: 'Nhịn ăn gián đoạn ⏱️' },
      { code: 'laughteryoga', name: 'Yoga cười 😄' }
    ]
  },
  {
    parent_code: 'travel', parent_name: 'Du lịch & Khám phá ✈️',
    children: [
      { code: 'roadtrip', name: 'Phượt xe máy 🏍️' },
      { code: 'camping', name: 'Cắm trại Camping ⛺' },
      { code: 'checkin', name: 'Check-in địa danh 📸' },
      { code: 'resort', name: 'Du lịch nghỉ dưỡng 🏖️' },
      { code: 'museum', name: 'Khám phá bảo tàng 🏛️' },
      { code: 'trekking', name: 'Trekking leo rừng 🥾' },
      { code: 'spiritual', name: 'Du lịch tâm linh 🛕' },
      { code: 'backpacking', name: 'Du lịch bụi 🎒' },
      { code: 'beach', name: 'Đi du lịch biển 🏖️' },
      { code: 'summit', name: 'Chinh phục đỉnh núi 🏔️' },
      { code: 'cave', name: 'Khám phá hang động 🪨' },
      { code: 'architecture', name: 'Chụp ảnh kiến trúc cổ 📸' },
      { code: 'citynight', name: 'City tour buổi tối 🌃' },
      { code: 'homestay', name: 'Trải nghiệm Homestay 🏡' },
      { code: 'localfood', name: 'Ẩm thực vùng miền 🍲' },
      { code: 'solotravel', name: 'Du lịch một mình 🧭' },
      { code: 'hiddencafe', name: 'Khám phá quán ẩn ☕' },
      { code: 'nightmarket', name: 'Đi chợ đêm 🌌' },
      { code: 'sunset', name: 'Xem hoàng hôn 🌅' },
      { code: 'train', name: 'Đi du lịch tàu hỏa 🚂' }
    ]
  },
  {
    parent_code: 'arts', parent_name: 'Nghệ thuật & Sáng tác 🎨',
    children: [
      { code: 'poetry', name: 'Viết thơ ca 📝' },
      { code: 'guitar', name: 'Chơi Guitar 🎸' },
      { code: 'piano', name: 'Chơi Piano 🎹' },
      { code: 'oilpainting', name: 'Vẽ tranh sơn dầu 🎨' },
      { code: 'claywork', name: 'Nặn đất sét 🧱' },
      { code: 'handmade', name: 'Làm đồ handmade ✂️' },
      { code: 'acting', name: 'Kịch nghệ & Diễn xuất 🎭' },
      { code: 'shortstory', name: 'Viết truyện ngắn ✍️' },
      { code: 'flowerart', name: 'Cắm hoa nghệ thuật 💐' },
      { code: 'calligraphy', name: 'Thư pháp 🖌️' },
      { code: 'embroidery', name: 'Thêu thùa 🪡' },
      { code: 'watercolor', name: 'Vẽ màu nước 🎨' },
      { code: 'filmphoto', name: 'Chụp ảnh Film 🎞️' },
      { code: 'dance', name: 'Nhảy hiện đại 💃' },
      { code: 'songwriting', name: 'Sáng tác nhạc 🎵' },
      { code: 'vinyl', name: 'Sưu tầm đĩa than 📻' },
      { code: 'artexhibition', name: 'Xem triển lãm nghệ thuật 🖼️' },
      { code: 'candles', name: 'Làm nến thơm 🕯️' },
      { code: 'pottery', name: 'Làm gốm thủ công 🏺' },
      { code: 'fashiondesign', name: 'Thiết kế thời trang 👗' }
    ]
  },
  {
    parent_code: 'lifestyle', parent_name: 'Phong cách sống 🌿',
    children: [
      { code: 'minimalism', name: 'Sống tối giản 🌿' },
      { code: 'marikondo', name: 'Dọn nhà Mari Kondo 🧹' },
      { code: 'workspace', name: 'Setup góc làm việc 💻' },
      { code: 'secondhand', name: 'Thời trang secondhand 👗' },
      { code: 'vintage', name: 'Phong cách vintage 📻' },
      { code: 'sneakers', name: 'Sưu tầm Sneakers 👟' },
      { code: 'houseplants', name: 'Chăm sóc cây cảnh 🪴' },
      { code: 'zerowaste', name: 'Sống xanh không rác thải ♻️' },
      { code: 'fengshui', name: 'Phong thủy nhà ở 🏡' },
      { code: 'bookcafe', name: 'Văn hóa đọc Cafe ☕' },
      { code: 'cats', name: 'Nuôi mèo 🐱' },
      { code: 'dogs', name: 'Nuôi chó 🐶' },
      { code: 'personalfinance', name: 'Tài chính cá nhân 💰' },
      { code: 'perfume', name: 'Sưu tầm nước hoa 🧪' },
      { code: 'gadgets', name: 'Đồ chơi công nghệ 🔌' },
      { code: 'selfhelp', name: 'Đọc sách Self-help 📚' },
      { code: 'culture', name: 'Trải nghiệm văn hóa 🎭' },
      { code: 'weekendmarket', name: 'Hội chợ cuối tuần 🎪' },
      { code: 'sunsetwatching', name: 'Ngắm hoàng hôn 🌅' },
      { code: 'selfcare', name: 'Chăm sóc bản thân 🧴' }
    ]
  },
  {
    parent_code: 'networking', parent_name: 'Giao lưu & Kết nối 🤝',
    children: [
      { code: 'startup', name: 'Chia sẻ khởi nghiệp 🚀' },
      { code: 'careerguidance', name: 'Mentoring nghề nghiệp 🤝' },
      { code: 'cofounder', name: 'Tìm Co-founder 👥' },
      { code: 'jobhunting', name: 'Kinh nghiệm ứng tuyển 📄' },
      { code: 'businessbooks', name: 'Thảo luận sách kinh tế 📚' },
      { code: 'fundraising', name: 'Kỹ năng gọi vốn 💰' },
      { code: 'personalbranding', name: 'Thương hiệu cá nhân 👤' },
      { code: 'partnership', name: 'Tìm kiếm đối tác 🤝' },
      { code: 'seminar', name: 'Hội thảo chuyên ngành 🎤' },
      { code: 'englishclub', name: 'English Club 🗣️' },
      { code: 'crossdepartment', name: 'Cafe chéo phòng ban ☕' },
      { code: 'softskills', name: 'Chia sẻ kỹ năng mềm 💬' },
      { code: 'news', name: 'Thảo luận tin tức thế giới 📰' },
      { code: 'careerdev', name: 'Trao đổi cơ hội nghề nghiệp 💼' },
      { code: 'womenintech', name: 'Women in Tech 👩‍💻' },
      { code: 'toastmasters', name: 'CLB Toastmasters 🗣️' },
      { code: 'debating', name: 'Tranh biện kinh doanh 🧠' },
      { code: 'productivity', name: 'Tối ưu hiệu suất làm việc ⏱️' },
      { code: 'alumni', name: 'Gặp gỡ cựu sinh viên 🎓' },
      { code: 'lunchbuddy', name: 'Tìm đồng nghiệp ăn trưa 🍲' }
    ]
  }
];

export const FLAT_TAGS = TAXONOMY.reduce((acc, parent) => {
  return acc.concat(parent.children.map(c => ({ ...c, parent_code: parent.parent_code, parent_name: parent.parent_name })));
}, []);

export function getTagName(code) {
  const tag = FLAT_TAGS.find(t => t.code === code);
  return tag ? tag.name : code;
}

export function highlightSearchText(text, query) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="highlighted-text">{part}</span>
        ) : (
          part
        )
      )}
    </span>
  );
}
