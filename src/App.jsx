import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getContext, isInShell } from './lib/context.js';
import { callNative, bridge } from './lib/bridge.js';
import { db, dbPublic } from './lib/supabase.js';
import { listMembers } from './lib/members.js';
import {
  generateShareCode,
  redeemShareCode,
  listShareGrants,
  revokeShareGrant,
  useActiveScope,
  useIsAnyWorkspaceAdmin,
  useDefaultScopeInitializer,
} from './lib/sharing.js';
import { mushyApi } from './lib/mushy-api.js';
import { useDialog } from './components/Dialog.jsx';
import Select from './components/Select.jsx';
import { subscribeToTable } from './lib/realtime.js';
import './App.css';

// Tag Taxonomy - 10 Parent Groups x 20 Child Tags = 200 Tags total
const TAXONOMY = [
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

// Helper to flat list of all child tags
const FLAT_TAGS = TAXONOMY.reduce((acc, parent) => {
  return acc.concat(parent.children.map(c => ({ ...c, parent_code: parent.parent_code, parent_name: parent.parent_name })));
}, []);

// Deterministic avatar gradient generator based on name initials
function getAvatarGradient(char) {
  const gradients = [
    'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', // Coral sunset
    'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)', // Indigo cyan
    'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Emerald mint
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber gold
    'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', // Pink purple
    'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)', // Teal sky
    'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'  // Violet indigo
  ];
  if (!char) return gradients[0];
  const code = char.charCodeAt(0);
  return gradients[code % gradients.length];
}

// Helper to parse chat messages from connection request
function parseChatMessages(chatGroupId) {
  if (!chatGroupId) return [];
  try {
    const parsed = JSON.parse(chatGroupId);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Premium Skeleton Loader component for smooth visual transition
function SkeletonScreen() {
  return (
    <div className="skeleton-container animated-fade-in" style={{ padding: '0 4px' }}>
      {/* Skeleton Radar Header */}
      <div className="compact-radar-header" style={{ borderStyle: 'solid', borderColor: 'rgba(15,15,18,0.04)', background: 'rgba(255,255,255,0.4)', pointerEvents: 'none', marginBottom: 14 }}>
        <div className="mushy-skeleton" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="mushy-skeleton" style={{ width: '40%', height: 14, marginBottom: 6 }} />
          <div className="mushy-skeleton" style={{ width: '60%', height: 10 }} />
        </div>
      </div>

      {/* Skeleton Search */}
      <div className="mushy-skeleton" style={{ width: '100%', height: 44, borderRadius: 12, marginBottom: 14 }} />

      {/* Card Skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="buddy-card-compact" style={{ opacity: 1 - i * 0.18, borderStyle: 'solid', borderColor: 'rgba(15,15,18,0.03)', pointerEvents: 'none', marginBottom: 12 }}>
          <div className="buddy-card-main">
            {/* Circle avatar */}
            <div className="mushy-skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
            <div className="buddy-body-compact" style={{ flex: 1 }}>
              <div className="buddy-header-row" style={{ marginBottom: 6 }}>
                {/* Name */}
                <div className="mushy-skeleton" style={{ width: '35%', height: 14 }} />
                {/* Match percentage badge */}
                <div className="mushy-skeleton" style={{ width: 45, height: 16, borderRadius: 999 }} />
              </div>
              {/* Department & Facility */}
              <div className="mushy-skeleton" style={{ width: '55%', height: 10, marginBottom: 10 }} />
              {/* Available time */}
              <div className="mushy-skeleton" style={{ width: '70%', height: 10, marginBottom: 8 }} />
              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <div className="mushy-skeleton" style={{ width: 50, height: 16, borderRadius: 999 }} />
                <div className="mushy-skeleton" style={{ width: 65, height: 16, borderRadius: 999 }} />
                <div className="mushy-skeleton" style={{ width: 40, height: 16, borderRadius: 999 }} />
              </div>
            </div>
          </div>
          {/* Bottom buttons */}
          <div className="buddy-actions-compact" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(15,15,18,0.04)', marginTop: 12, paddingTop: 10 }}>
            <div className="mushy-skeleton" style={{ width: 30, height: 30, borderRadius: '50%' }} />
            <div className="mushy-skeleton" style={{ width: 90, height: 30, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const dialog = useDialog();
  const ctx = useMemo(() => getContext(), []);
  const scope = useActiveScope();
  const isAnyAdmin = useIsAnyWorkspaceAdmin();

  // Initialize scope
  useDefaultScopeInitializer();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'inbox' | 'connections' | 'profile'

  // Data states
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [myProfile, setMyProfile] = useState({
    department: '',
    facility: '',
    available_times: [],
    share_skills: [],
    learn_skills: [],
    connect_types: [],
    is_newbie: false,
    is_buddy_helper: false,
    consent_granted_at: null,
  });
  const [myTags, setMyTags] = useState([]); // Selected child_codes
  const [mySkills, setMySkills] = useState([]); // Selected skills
  const [myGoals, setMyGoals] = useState([]); // Selected career goals
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentCheckbox, setConsentCheckbox] = useState(false); // for consent form checkbox
  
  // Connection states
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connectionMeetings, setConnectionMeetings] = useState([]);
  const [myPoints, setMyPoints] = useState({ points: 0, confirmed_1to1_count: 0, helper_badge_level: null });
  const [allPoints, setAllPoints] = useState([]); // for leaderboard
  const [activeChatConnection, setActiveChatConnection] = useState(null);
  const [buddyChatInput, setBuddyChatInput] = useState('');
  
  // Quick Connect Connection Modal (Bottom Sheet)
  const [selectedConnectBuddy, setSelectedConnectBuddy] = useState(null); // buddy member object
  const [showConnectSheet, setShowConnectSheet] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  
  // Confirm meeting popup
  const [showConfirmMeetingId, setShowConfirmMeetingId] = useState(null); // meeting_id to confirm

  const [members, setMembers] = useState([]); // Workspace members
  const [allProfiles, setAllProfiles] = useState({}); // user_id -> profile
  const [allUserTags, setAllUserTags] = useState({}); // user_id -> array of child_codes
  const [interactionHistory, setInteractionHistory] = useState([]);

  // UI Interactivity states
  const [expandedParents, setExpandedParents] = useState({}); // parent_code -> boolean
  const [searchQuery, setSearchQuery] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);

  // Cross-Workspace Sharing states
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [shareCodeInput, setShareCodeInput] = useState('');
  const [radarPage, setRadarPage] = useState(1);
  const RADAR_PAGE_SIZE = 10;

  const [avatarTooltip, setAvatarTooltip] = useState(null); // { member, profile } — shown on long-press

  useEffect(() => {
    setRadarPage(1);
  }, [searchQuery, fallbackEnabled, scope]);

  useEffect(() => {
    if (activeChatConnection) {
      setTimeout(() => {
        const el = document.getElementById('mushy-chat-messages-container');
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }, [activeChatConnection, connectionRequests]);

  const [shareGrants, setShareGrants] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loadingGrants, setLoadingGrants] = useState(false);

  // AI features
  const [serverMatchReasons, setServerMatchReasons] = useState({}); // user_id -> string[]
  const [icebreakerMsg, setIcebreakerMsg] = useState('');
  const [loadingIcebreaker, setLoadingIcebreaker] = useState(false);

  // 1. Fetch all data on mount and scope changes
  useEffect(() => {
    if (scope?.workspaceId) {
      loadData();
    }
  }, [scope?.workspaceId]);

  // 2. Setup Real-time Change Listeners
  useEffect(() => {
    if (!scope?.workspaceId) return;

    // Listen to connection requests
    const unsubConnReqs = subscribeToTable('connection_requests', scope.workspaceId, () => {
      loadConnectionData();
    });

    // Listen to connection meetings
    const unsubConnMeets = subscribeToTable('connection_meetings', scope.workspaceId, () => {
      loadConnectionData();
    });

    // Listen to connection points
    const unsubConnPoints = subscribeToTable('connection_points', scope.workspaceId, () => {
      loadConnectionData();
    });

    return () => {
      unsubConnReqs();
      unsubConnMeets();
      unsubConnPoints();
    };
  }, [scope?.workspaceId]);

  // Reset icebreaker message khi đổi người mời
  useEffect(() => {
    setIcebreakerMsg('');
  }, [quickInviteData]);

  // Load complete state from DB
  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const activeWs = scope.workspaceId;
      if (!activeWs) return;



      // 1. Fetch current user profile
      const { data: prof, error: profErr } = await db
        .from('user_profiles')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', ctx.userId)
        .maybeSingle();

      if (prof) {
        setMyProfile({
          department: prof.department || '',
          facility: prof.facility || '',
          available_times: prof.available_times || [],
          share_skills: prof.share_skills || [],
          learn_skills: prof.learn_skills || [],
          connect_types: prof.connect_types || [],
          is_newbie: !!prof.is_newbie,
          is_buddy_helper: !!prof.is_buddy_helper,
          consent_granted_at: prof.consent_granted_at || null,
        });
        setMySkills(prof.skills || []);
        setMyGoals(prof.career_goals || []);
        setHasProfile(true);
        setConsentGranted(!!prof.consent_granted_at);
      } else {
        setHasProfile(false);
        setConsentGranted(false);
      }

      // 2. Fetch workspace members
      const workspaceMembers = await listMembers(activeWs);
      setMembers(workspaceMembers.filter(m => m.user_id !== ctx.userId));

      // 3. Fetch all profiles & tags in workspace to build match registry
      const { data: allProfs } = await db
        .from('user_profiles')
        .select('*')
        .eq('workspace_id', activeWs);
      const profMap = {};
      if (allProfs) {
        allProfs.forEach(p => { profMap[p.user_id] = p; });
      }
      setAllProfiles(profMap);

      const { data: allTags } = await db
        .from('user_tags')
        .select('*')
        .eq('workspace_id', activeWs);
      const tagsMap = {};
      if (allTags) {
        allTags.forEach(t => {
          if (!tagsMap[t.user_id]) tagsMap[t.user_id] = [];
          tagsMap[t.user_id].push(t.child_code);
        });
      }
      setAllUserTags(tagsMap);

      // 4. Fetch interaction history
      const { data: history } = await db
        .from('interaction_history')
        .select('*')
        .eq('workspace_id', activeWs);
      setInteractionHistory(history || []);

      // 5. Load Connection Data
      await loadConnectionData();

      // 6. Load server-side match reasons (non-blocking)
      loadServerMatchReasons();

    } catch (err) {
      console.error('Lỗi tải dữ liệu Connect:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadConnectionData() {
    const activeWs = scope.workspaceId;
    if (!activeWs) return;

    try {
      // 1. Fetch connection requests involving the current user
      const { data: requests, error: reqErr } = await db
        .from('connection_requests')
        .select('*')
        .eq('workspace_id', activeWs)
        .or(`from_user_id.eq.${ctx.userId},to_user_id.eq.${ctx.userId}`)
        .order('created_at', { ascending: false });

      if (reqErr) {
        console.error('Error fetching connection requests:', reqErr);
      } else {
        setConnectionRequests(requests || []);
      }

      // 2. Fetch connection meetings for active workspace
      const { data: meetings, error: meetErr } = await db
        .from('connection_meetings')
        .select('*')
        .eq('workspace_id', activeWs)
        .order('created_at', { ascending: false });

      if (meetErr) {
        console.error('Error fetching connection meetings:', meetErr);
      } else {
        setConnectionMeetings(meetings || []);
      }

      // 3. Fetch current user points
      const { data: pts, error: ptsErr } = await db
        .from('connection_points')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', ctx.userId)
        .maybeSingle();

      if (ptsErr) {
        console.error('Error fetching user connection points:', ptsErr);
      } else if (pts) {
        setMyPoints({
          points: pts.points || 0,
          confirmed_1to1_count: pts.confirmed_1to1_count || 0,
          helper_badge_level: pts.helper_badge_level || null
        });
      } else {
        setMyPoints({ points: 0, confirmed_1to1_count: 0, helper_badge_level: null });
      }

      // 4. Fetch all points in workspace for leaderboard
      const { data: allPts, error: allPtsErr } = await db
        .from('connection_points')
        .select('*')
        .eq('workspace_id', activeWs)
        .order('points', { ascending: false });

      if (allPtsErr) {
        console.error('Error fetching leaderboard points:', allPtsErr);
      } else {
        setAllPoints(allPts || []);
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Connection:', err);
    }
  }

  // --- Profile / Tag Manager Handlers ---
  const toggleParentAccordion = (code) => {
    setExpandedParents(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleSelectTag = (code) => {
    bridge.haptic('light');
    if (myTags.includes(code)) {
      setMyTags(prev => prev.filter(t => t !== code));
    } else {
      setMyTags(prev => [...prev, code]);
    }
  };

  const handleSaveProfile = async () => {
    if (!myProfile.department.trim() || !myProfile.facility.trim()) {
      return dialog.error('Thiếu thông tin', 'Vui lòng nhập đầy đủ Phòng ban và Cơ sở làm việc!');
    }

    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;

      // Auto-initialize or fix tags taxonomy in database right before saving to prevent foreign key errors
      try {
        const { error: checkTagsErr, count } = await db
          .from('tags')
          .select('child_code', { count: 'exact', head: true })
          .eq('workspace_id', activeWs);

        if (checkTagsErr) {
          throw new Error(`Kiểm tra danh mục thẻ thất bại: ${checkTagsErr.message} (Code: ${checkTagsErr.code})`);
        }

        if (count === null || count < 200) {
          console.log('⚡ Saving profile: tags incomplete. Auto-upserting 200 tags...');
          const tagsToInsert = [];
          TAXONOMY.forEach(parent => {
            parent.children.forEach(child => {
              tagsToInsert.push({
                workspace_id: activeWs,
                parent_code: parent.parent_code,
                parent_name: parent.parent_name,
                child_code: child.code,
                name: child.name
              });
            });
          });
          const { error: seedErr } = await db.from('tags').upsert(tagsToInsert, { onConflict: 'workspace_id,child_code' });
          if (seedErr) {
            throw new Error(`Khởi tạo danh mục thẻ thất bại: ${seedErr.message} (Code: ${seedErr.code})`);
          }
        }
      } catch (checkErr) {
        throw new Error(`Không thể đồng bộ danh mục thẻ sở thích vào Database: ${checkErr.message}`);
      }

      // 1. Upsert profile
      const { error: profErr } = await db.from('user_profiles').upsert({
        user_id: ctx.userId,
        workspace_id: activeWs,
        department: myProfile.department.trim(),
        facility: myProfile.facility.trim(),
        available_times: myProfile.available_times,
        skills: mySkills,
        career_goals: myGoals,
        share_skills: myProfile.share_skills || [],
        learn_skills: myProfile.learn_skills || [],
        connect_types: myProfile.connect_types || [],
        is_newbie: !!myProfile.is_newbie,
        is_buddy_helper: !!myProfile.is_buddy_helper,
        updated_at: new Date().toISOString()
      });
      if (profErr) throw profErr;

      // 2. Update user_tags: delete old, insert new
      await db.from('user_tags').delete().eq('workspace_id', activeWs).eq('user_id', ctx.userId);

      if (myTags.length > 0) {
        const tagsPayload = myTags.map(code => ({
          workspace_id: activeWs,
          user_id: ctx.userId,
          child_code: code
        }));
        const { error: tagsErr } = await db.from('user_tags').insert(tagsPayload);
        if (tagsErr) throw tagsErr;
      }

      setHasProfile(true);
      setShowProfileModal(false);
      await dialog.success('Đã lưu hồ sơ!', 'Thông tin kết nối của bạn đã được cập nhật thành công.');
      loadData();
    } catch (e) {
      dialog.error('Lỗi lưu hồ sơ', e.message);
    }
  };

  const handleGrantConsent = async () => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      const consentTime = new Date().toISOString();

      const { data: existingProf } = await db
        .from('user_profiles')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', ctx.userId)
        .maybeSingle();

      if (existingProf) {
        const { error: consentErr } = await db
          .from('user_profiles')
          .update({ consent_granted_at: consentTime, updated_at: consentTime })
          .eq('workspace_id', activeWs)
          .eq('user_id', ctx.userId);
        if (consentErr) throw consentErr;
      } else {
        const { error: consentErr } = await db
          .from('user_profiles')
          .insert({
            user_id: ctx.userId,
            workspace_id: activeWs,
            consent_granted_at: consentTime,
            updated_at: consentTime,
            department: '',
            facility: '',
            available_times: [],
            share_skills: [],
            learn_skills: [],
            connect_types: [],
            is_newbie: false,
            is_buddy_helper: false,
          });
        if (consentErr) throw consentErr;
      }

      setConsentGranted(true);
      setMyProfile(prev => ({ ...prev, consent_granted_at: consentTime }));
      await dialog.success('Xác nhận thành công!', 'Bạn đã đồng ý với các điều khoản chia sẻ dữ liệu và kết nối.');
      
      // If user profile details are not fully set up yet, show the setup modal.
      if (!existingProf || !existingProf.department || !existingProf.facility) {
        setShowProfileModal(true);
      }
      
      loadData();
    } catch (e) {
      dialog.error('Lỗi xác nhận', e.message);
    }
  };

  const getConnectTypeLabel = (type) => {
    switch (type) {
      case 'food': return 'Ăn uống 🍴';
      case 'sport': return 'Thể thao ⚽';
      case 'knowledge': return 'Tri thức 📖';
      case 'casual': return 'Tán gẫu 💬';
      case 'intro_meet': return 'Làm quen 🤝';
      default: return 'Kết nối';
    }
  };

  const handleSendConnectionRequest = async (buddyId, actionType, messageTemplate) => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      // Check if there is already a pending connection request of the same type between these users
      const { data: existing } = await db
        .from('connection_requests')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('from_user_id', ctx.userId)
        .eq('to_user_id', buddyId)
        .eq('action_type', actionType)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return dialog.error('Yêu cầu đã tồn tại', `Bạn đã gửi một yêu cầu kết nối "${getConnectTypeLabel(actionType)}" tới đồng nghiệp này và đang chờ phản hồi.`);
      }

      // Generate a mock chat_group_id as serialized JSON array [] if mock mode is used.
      const chatGroupId = JSON.stringify([]);

      // Insert connection request
      const { data: newReq, error: insertErr } = await db
        .from('connection_requests')
        .insert({
          workspace_id: activeWs,
          from_user_id: ctx.userId,
          to_user_id: buddyId,
          action_type: actionType,
          status: 'pending',
          message_template: messageTemplate || '',
          chat_group_id: chatGroupId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Push notification
      try {
        const typeLabel = getConnectTypeLabel(actionType);
        await mushyApi.push({
          workspaceId: activeWs,
          appSlug: 'buddy-connect',
          userIds: [buddyId],
          title: '⚡ Lời mời kết nối mới!',
          body: `${ctx.userFullName || 'Một đồng nghiệp'} đã gửi lời mời kết nối "${typeLabel}" tới bạn. Mở app để xem ngay!`,
        });
      } catch (pushErr) {
        console.warn('Lỗi push notification:', pushErr);
      }

      await dialog.success('Đã gửi yêu cầu!', 'Lời mời kết nối của bạn đã được gửi thành công.');
      setShowConnectSheet(false);
      setSelectedConnectBuddy(null);
      loadConnectionData();
    } catch (e) {
      dialog.error('Lỗi gửi yêu cầu', e.message);
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      const now = new Date().toISOString();

      const { data: updatedReq, error: updateErr } = await db
        .from('connection_requests')
        .update({ status, resolved_at: now })
        .eq('id', requestId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      if (status === 'accepted') {
        // Automatically create a connection meeting record
        const { error: meetErr } = await db
          .from('connection_meetings')
          .insert({
            workspace_id: activeWs,
            request_id: requestId,
            from_confirmed: false,
            to_confirmed: false,
            points_awarded: 0,
            status: 'pending_confirmation',
            created_at: now
          });
        if (meetErr) throw meetErr;

        // Push notification to the sender
        try {
          await mushyApi.push({
            workspaceId: activeWs,
            appSlug: 'buddy-connect',
            userIds: [updatedReq.from_user_id],
            title: '🎉 Lời mời đã được chấp nhận!',
            body: `${ctx.userFullName || 'Đồng nghiệp'} đã đồng ý kết nối với bạn. Hãy lên lịch gặp mặt ngoài đời nhé!`,
          });
        } catch (pushErr) {
          console.warn('Lỗi push notification:', pushErr);
        }

        await dialog.success('Đã chấp nhận!', 'Bạn đã đồng ý kết nối. Cuộc gặp mặt đã được lập lịch xác nhận.');
      } else {
        await dialog.info('Đã từ chối', 'Bạn đã từ chối yêu cầu kết nối.');
      }

      loadConnectionData();
    } catch (e) {
      dialog.error('Lỗi phản hồi yêu cầu', e.message);
    }
  };

  const awardConnectionPoints = async (userId, pointsToAdd) => {
    const activeWs = scope.workspaceId;
    if (!activeWs) return;

    try {
      // Get existing points
      const { data: existing } = await db
        .from('connection_points')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', userId)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing) {
        const newPoints = (existing.points || 0) + pointsToAdd;
        const newCount = (existing.confirmed_1to1_count || 0) + 1;
        
        let badge = null;
        if (newPoints >= 100) badge = 'gold';
        else if (newPoints >= 60) badge = 'silver';
        else if (newPoints >= 30) badge = 'bronze';

        await db
          .from('connection_points')
          .update({
            points: newPoints,
            confirmed_1to1_count: newCount,
            helper_badge_level: badge,
            updated_at: now
          })
          .eq('workspace_id', activeWs)
          .eq('user_id', userId);
      } else {
        let badge = null;
        if (pointsToAdd >= 100) badge = 'gold';
        else if (pointsToAdd >= 60) badge = 'silver';
        else if (pointsToAdd >= 30) badge = 'bronze';

        await db
          .from('connection_points')
          .insert({
            workspace_id: activeWs,
            user_id: userId,
            points: pointsToAdd,
            confirmed_1to1_count: 1,
            group_activity_count: 0,
            helper_badge_level: badge,
            updated_at: now
          });
      }
    } catch (err) {
      console.error('Error awarding connection points:', err);
    }
  };

  const handleConfirmMeeting = async (meetingId, isConfirmed) => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      // Fetch meeting and corresponding request to know from/to users
      const { data: meeting, error: meetErr } = await db
        .from('connection_meetings')
        .select('*, request:connection_requests(*)')
        .eq('id', meetingId)
        .single();

      if (meetErr || !meeting) {
        throw new Error('Không tìm thấy bản ghi cuộc gặp.');
      }

      const request = meeting.request;
      if (!request) {
        throw new Error('Không tìm thấy yêu cầu kết nối liên quan.');
      }

      const isFrom = ctx.userId === request.from_user_id;
      const isTo = ctx.userId === request.to_user_id;

      if (!isFrom && !isTo) {
        throw new Error('Bạn không tham gia vào cuộc kết nối này.');
      }

      const updates = {};
      if (isConfirmed === 'confirmed') {
        if (isFrom) updates.from_confirmed = true;
        if (isTo) updates.to_confirmed = true;

        // Check if both are now confirmed
        const bothConfirmed = (isFrom && meeting.to_confirmed) || (isTo && meeting.from_confirmed);
        if (bothConfirmed) {
          updates.status = 'confirmed';
          updates.confirmed_at = new Date().toISOString();
          updates.points_awarded = 10;

          // Award points to both
          await awardConnectionPoints(request.from_user_id, 10);
          await awardConnectionPoints(request.to_user_id, 10);
        } else {
          updates.status = 'pending_confirmation';
        }
      } else if (isConfirmed === 'skipped') {
        updates.status = 'skipped';
      }

      const { error: updateErr } = await db
        .from('connection_meetings')
        .update(updates)
        .eq('id', meetingId);

      if (updateErr) throw updateErr;

      if (updates.status === 'confirmed') {
        await dialog.success('Tuyệt vời! 🎉', 'Cuộc gặp mặt đã được xác nhận từ cả hai phía. Mỗi bạn được cộng 10 điểm kết nối.');
      } else if (isConfirmed === 'confirmed') {
        await dialog.success('Đã xác nhận!', 'Đã ghi nhận xác nhận từ phía bạn. Đang chờ đồng nghiệp xác nhận.');
      } else {
        await dialog.info('Đã hủy cuộc gặp', 'Trạng thái cuộc gặp được cập nhật thành Bỏ qua.');
      }

      loadConnectionData();
    } catch (e) {
      dialog.error('Lỗi xác nhận cuộc gặp', e.message);
    }
  };

  const handleSendChatMessageForBuddy = async (requestId, content) => {
    if (!content.trim()) return;
    const req = connectionRequests.find(r => r.id === requestId);
    if (!req) return;

    const currentMessages = parseChatMessages(req.chat_group_id);
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: ctx.userId,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...currentMessages, newMessage];
    const newChatGroupId = JSON.stringify(updatedMessages);

    try {
      await db
        .from('connection_requests')
        .update({ chat_group_id: newChatGroupId })
        .eq('id', requestId);
    } catch (e) {
      console.error('Failed to send buddy chat message:', e);
    }
  };



  // --- Smart Matching & Sorting Priority Logic (PRD Section 5) ---
  const helperNewbieCounts = useMemo(() => {
    const counts = {};
    connectionRequests.forEach(req => {
      if (req.status === 'pending' || req.status === 'accepted') {
        const senderProfile = allProfiles[req.from_user_id];
        if (senderProfile && senderProfile.is_newbie) {
          counts[req.to_user_id] = (counts[req.to_user_id] || 0) + 1;
        }
      }
    });
    return counts;
  }, [connectionRequests, allProfiles]);

  const rankedCandidates = useMemo(() => {
    if (!hasProfile) return [];

    const myInterests = myTags || [];
    const q = searchQuery.trim().toLowerCase();

    return members
      .map(member => {
        const profile = allProfiles[member.user_id] || {};
        // Compliance: skip candidates who have not granted onboarding consent
        if (!profile.consent_granted_at) return null;

        const tags = allUserTags[member.user_id] || [];

        // Apply search query filter if present
        if (q) {
          const nameMatch = member.full_name?.toLowerCase().includes(q);
          const deptMatch = profile.department?.toLowerCase().includes(q);
          const facMatch = profile.facility?.toLowerCase().includes(q);
          
          // Match tag names
          const tagMatches = tags.some(code => {
            const tagObj = FLAT_TAGS.find(t => t.code === code);
            const tagName = tagObj?.name?.toLowerCase();
            const parentName = tagObj?.parent_name?.toLowerCase();
            return tagName?.includes(q) || parentName?.includes(q);
          });

          if (!nameMatch && !deptMatch && !facMatch && !tagMatches) {
            return null;
          }
        }

        // Check exact child tag overlap
        const exactMatches = myInterests.filter(code => tags.includes(code));
        const matchedChildObjects = exactMatches.map(code => FLAT_TAGS.find(t => t.code === code)).filter(Boolean);

        // Check parent tag overlap for fallback suggesting
        const myParentCodes = myInterests.map(code => FLAT_TAGS.find(t => t.code === code)?.parent_code).filter(Boolean);
        const memberParentCodes = tags.map(code => FLAT_TAGS.find(t => t.code === code)?.parent_code).filter(Boolean);
        const sharedParents = myParentCodes.filter(p => memberParentCodes.includes(p));

        // Check interaction history
        const hasInteracted = interactionHistory.some(h => 
          (h.user_id_1 === ctx.userId && h.user_id_2 === member.user_id) ||
          (h.user_id_1 === member.user_id && h.user_id_2 === ctx.userId)
        );

        // Priority calculation
        let priority = 3; // Mức 3 (mặc định)
        let exactMatchCount = exactMatches.length;
        let isFallback = false;
        let fallbackParentLabel = '';

        if (exactMatchCount > 0) {
          const differentDept = profile.department !== myProfile.department;
          if (differentDept && !hasInteracted) {
            priority = 1; // Mức 1 (Trùng thẻ con VÀ khác phòng ban VÀ chưa tương tác)
          } else if (!differentDept && !hasInteracted) {
            priority = 2; // Mức 2 (Trùng thẻ con VÀ cùng phòng ban VÀ chưa tương tác)
          }
        } else if (fallbackEnabled && sharedParents.length > 0) {
          // Trigger controlled fallback: no exact match, but share parent group
          isFallback = true;
          const matchedParentObj = TAXONOMY.find(p => p.parent_code === sharedParents[0]);
          fallbackParentLabel = matchedParentObj ? matchedParentObj.parent_name : '';
        }

        // Filter out if no exact match AND (fallback turned off or no parent matches)
        if (exactMatchCount === 0 && !isFallback) return null;

        // Calculate match percentage to display
        let matchScore = 30; // base weight
        matchScore += exactMatchCount * 25;
        matchScore += sharedParents.length * 10;
        if (profile.facility === myProfile.facility) matchScore += 15; // same office bonus

        // expansion boosters
        if (myProfile.is_newbie && profile.is_buddy_helper) {
          matchScore += 30;
        }

        const commonConnectTypes = (myProfile.connect_types || []).filter(ct => (profile.connect_types || []).includes(ct));
        if (commonConnectTypes.length > 0) {
          matchScore += 15;
        }

        const myShare = myProfile.share_skills || [];
        const myLearn = myProfile.learn_skills || [];
        const theirShare = profile.share_skills || [];
        const theirLearn = profile.learn_skills || [];
        const hasKnowledgeOverlap = 
          myShare.some(s => theirLearn.includes(s)) || 
          myLearn.some(s => theirShare.includes(s));
        if (hasKnowledgeOverlap) {
          matchScore += 20;
        }

        const pendingNewbies = helperNewbieCounts[member.user_id] || 0;
        if (profile.is_buddy_helper && pendingNewbies >= 3) {
          matchScore -= 15;
        }

        if (matchScore > 100) matchScore = 100;
        if (matchScore < 0) matchScore = 0;

        return {
          member,
          profile,
          tags,
          exactMatches: matchedChildObjects,
          sharedParents,
          priority,
          isFallback,
          fallbackParentLabel,
          matchScore,
          hasInteracted
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort primarily by priority level (1 is highest, then 2, then 3)
        if (a.priority !== b.priority) return a.priority - b.priority;
        // Secondarily sort by higher match score
        return b.matchScore - a.matchScore;
      });
  }, [members, allProfiles, allUserTags, myTags, myProfile, interactionHistory, fallbackEnabled, hasProfile, searchQuery, helperNewbieCounts]);

  const newbiePrimaryBuddy = useMemo(() => {
    if (!hasProfile || !myProfile.is_newbie) return null;

    // Filter candidates who are buddy helpers, have consented, and are not overloaded (less than 3 pending/accepted newbie connections)
    const candidates = rankedCandidates.filter(c => {
      const isHelper = c.profile.is_buddy_helper;
      const hasConsent = c.profile.consent_granted_at;
      const pendingNewbies = helperNewbieCounts[c.member.user_id] || 0;
      const notOverloaded = pendingNewbies < 3;
      return isHelper && hasConsent && notOverloaded;
    });

    if (candidates.length === 0) return null;
    return candidates[0]; // Top matching buddy helper
  }, [rankedCandidates, myProfile, hasProfile, helperNewbieCounts]);



  // --- Sharing Modal Handlers ---
  const handleOpenSharing = async () => {
    setShowSharingModal(true);
    setLoadingGrants(true);
    setGeneratedCode(null);
    try {
      const grants = await listShareGrants();
      setShareGrants(grants);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrants(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      bridge.haptic('light');
      const codeData = await generateShareCode({ expiresHours: 24 });
      setGeneratedCode(codeData);
      const grants = await listShareGrants();
      setShareGrants(grants);
    } catch (err) {
      dialog.error('Lỗi tạo mã', err.message);
    }
  };

  const handleRedeemCode = async () => {
    if (!shareCodeInput.trim()) return;
    try {
      bridge.haptic('light');
      await redeemShareCode({ code: shareCodeInput.trim().toUpperCase() });
      setShareCodeInput('');
      await dialog.success('Kết nối thành công!', 'Đã mở rộng phạm vi kết nối với workspace chia sẻ.');
      const grants = await listShareGrants();
      setShareGrants(grants);
      loadData();
    } catch (err) {
      dialog.error('Lỗi redeem', err.message);
    }
  };

  const handleRevokeGrant = async (grantId) => {
    const ok = await dialog.confirm('Hủy kết nối chia sẻ này?', 'Hai bên sẽ không còn nhìn thấy thông tin của nhau nữa.', {
      danger: true,
      confirmLabel: 'Hủy kết nối',
      cancelLabel: 'Bỏ qua',
    });
    if (!ok) return;

    try {
      bridge.haptic('medium');
      await revokeShareGrant(grantId);
      const grants = await listShareGrants();
      setShareGrants(grants);
      loadData();
    } catch (err) {
      dialog.error('Lỗi hủy chia sẻ', err.message);
    }
  };

  // --- UI Filters and highlights ---
  const filteredAccordionTaxonomy = useMemo(() => {
    if (!searchQuery.trim()) return TAXONOMY;

    const query = searchQuery.toLowerCase().trim();
    return TAXONOMY.map(parent => {
      const matchedChildren = parent.children.filter(c => c.name.toLowerCase().includes(query));
      if (matchedChildren.length > 0 || parent.parent_name.toLowerCase().includes(query)) {
        return {
          ...parent,
          children: matchedChildren.length > 0 ? matchedChildren : parent.children,
          isAutoExpanded: true
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  const highlightSearchText = (text, query) => {
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
  };

  // Time Formatter
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
  };

  // Get tag name from child code
  const getTagName = (code) => {
    const tag = FLAT_TAGS.find(t => t.code === code);
    return tag ? tag.name : code;
  };

  // Xây câu lý do kết nối explainable cho Buddy Card
  const buildMatchReason = (member, profile, exactMatches, sharedParents, hasInteracted) => {
    const parts = [];

    if (exactMatches.length > 0) {
      parts.push(`đều thích ${exactMatches[0].name}`);
    } else if (sharedParents.length > 0) {
      const parentObj = TAXONOMY.find(p => p.parent_code === sharedParents[0]);
      if (parentObj) parts.push(`đều quan tâm nhóm ${parentObj.parent_name}`);
    }

    // Skills trùng
    const mySkillSet = new Set(mySkills);
    const commonSkills = (profile.skills || []).filter(s => mySkillSet.has(s));
    if (commonSkills.length > 0 && parts.length === 0) {
      parts.push(`đều có kỹ năng ${commonSkills[0]}`);
    }

    // Goals trùng
    const myGoalSet = new Set(myGoals);
    const commonGoals = (profile.career_goals || []).filter(g => myGoalSet.has(g));
    if (commonGoals.length > 0 && parts.length === 0) {
      parts.push(`đều hướng tới "${commonGoals[0]}"`);
    }

    if (!hasInteracted && parts.length > 0) parts.push('chưa từng tương tác');
    if (profile.facility && profile.facility === myProfile.facility) {
      parts.push(`cùng cơ sở ${myProfile.facility}`);
    }

    if (parts.length === 0) return null;
    return `Bạn và ${member.full_name} ${parts.join(' và ')}.`;
  };

  // Gọi server-side matching để lấy match_reasons bổ sung
  const loadServerMatchReasons = async () => {
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
          'X-Workspace-Id': scope.workspaceId,
          'X-Home-Workspace-Id': ctx.workspaceId,
        },
        body: JSON.stringify({ userId: ctx.userId, workspaceId: scope.workspaceId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const reasonMap = {};
      (Array.isArray(data) ? data : []).forEach(d => {
        if (d.user_id && d.match_reasons) reasonMap[d.user_id] = d.match_reasons;
      });
      setServerMatchReasons(reasonMap);
    } catch (e) {
      console.warn('[match-api] unavailable, using client-side reasons');
    }
  };

  // Gọi AI Icebreaker — gợi ý câu mở đầu khi rủ nhanh
  const handleGetIcebreaker = async () => {
    if (!quickInviteData) return;
    const toProfile = allProfiles[quickInviteData.member.user_id] || {};
    setLoadingIcebreaker(true);
    try {
      const res = await fetch('/api/icebreaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
          'X-Workspace-Id': scope.workspaceId,
          'X-Home-Workspace-Id': ctx.workspaceId,
        },
        body: JSON.stringify({
          fromUser: {
            full_name: members.find(m => m.user_id === ctx.userId)?.full_name || 'Tôi',
            tags: myTags,
            career_goals: myGoals,
          },
          toUser: {
            full_name: quickInviteData.member.full_name,
            tags: allUserTags[quickInviteData.member.user_id] || [],
            career_goals: toProfile.career_goals || [],
          },
        }),
      });
      if (res.status === 429) {
        return dialog.error('Hết quota AI', 'Bạn đã dùng hết 10 lần gợi ý AI hôm nay. Hãy thử lại vào ngày mai!');
      }
      const data = await res.json();
      if (data.message) setIcebreakerMsg(data.message);
    } catch (e) {
      console.warn('[icebreaker] failed:', e);
      setIcebreakerMsg(`Chào ${quickInviteData.member.full_name}, mình thấy chúng ta có vài điểm chung và muốn kết nối! Bạn có rảnh không?`);
    } finally {
      setLoadingIcebreaker(false);
    }
  };

  if (ctx.isMissingContext) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFF0F2 0%, #FFE5E9 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 77, 109, 0.15)',
          borderRadius: '24px',
          padding: '40px 30px',
          maxWidth: '420px',
          boxShadow: '0 15px 35px rgba(255, 77, 109, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '56px', marginBottom: '20px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}>📱</span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px', letterSpacing: '-0.3px' }}>
            Mở trong Mushy Super App
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', margin: '0 0 28px' }}>
            Bạn đang truy cập bản build trực tiếp trên Vercel. Để trải nghiệm và kiểm thử đầy đủ các tính năng kết nối, <strong>vui lòng mở ứng dụng này bằng ứng ứng di động Mushy của bạn</strong>.
          </p>
          <div style={{
            fontSize: '12px',
            color: '#FF4D6D',
            background: 'rgba(255, 77, 109, 0.06)',
            border: '1px solid rgba(255, 77, 109, 0.12)',
            borderRadius: '12px',
            padding: '12px 18px',
            fontWeight: '600',
            width: '100%',
            boxSizing: 'border-box',
            lineHeight: '1.4'
          }}>
            ℹ️ Yêu cầu môi trường Mushy Super App Shell
          </div>
        </div>
      </div>
    );
  }

  if (!consentGranted) {
    return (
      <div className="consent-screen animated-fade-in" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFF0F2 0%, #FFE5E9 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 77, 109, 0.15)',
          borderRadius: '24px',
          padding: '32px 24px',
          maxWidth: '400px',
          boxShadow: '0 15px 35px rgba(255, 77, 109, 0.08)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>🤝🍄</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px' }}>
            Chào mừng bạn đến với Connect!
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.6', margin: '0 0 20px', textAlign: 'left' }}>
            Để hỗ trợ bạn kết nối với đúng các đồng nghiệp có cùng sở thích, cùng cơ sở và phòng ban, hệ thống cần xử lý thông tin hồ sơ của bạn.
          </p>
          <div style={{
            background: 'rgba(15, 15, 18, 0.02)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '14px',
            fontSize: '12px',
            textAlign: 'left',
            color: 'var(--ink)',
            marginBottom: '20px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>Thông tin sẽ được thu thập:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
              <li>Thông tin phòng ban & cơ sở làm việc</li>
              <li>Sở thích cá nhân & kỹ năng chia sẻ/học hỏi</li>
              <li>Lịch sử tương tác và gặp mặt nội bộ</li>
            </ul>
          </div>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            marginBottom: '24px',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              style={{ marginTop: '3px', accentColor: 'var(--brand)' }}
              checked={consentCheckbox}
              onChange={(e) => setConsentCheckbox(e.target.checked)}
            />
            <span style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: '1.4' }}>
              Tôi đồng ý cung cấp thông tin profile và cho phép hệ thống gợi ý buddy phù hợp, nhận lời mời kết nối nội bộ.
            </span>
          </label>
          <button
            className="mushy-btn mushy-btn--primary mushy-btn--block"
            style={{ minHeight: '44px', fontWeight: 700 }}
            disabled={!consentCheckbox}
            onClick={handleGrantConsent}
          >
            Đồng ý và tiếp tục 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mushy-page">
      {/* Avatar detail tooltip overlay — triggered by long-press on avatar chips */}
      {avatarTooltip && (
        <div
          onClick={() => setAvatarTooltip(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 15, 18, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 16px 32px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: 20,
              padding: '20px 20px 24px',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 -4px 40px rgba(15,15,18,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto -4px' }} />

            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: getAvatarGradient(avatarTooltip.member.full_name?.charAt(0)),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#fff',
                boxShadow: '0 4px 12px rgba(15,15,18,0.15)'
              }}>
                {avatarTooltip.member.full_name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', lineHeight: 1.3 }}>
                  {avatarTooltip.member.full_name}
                </div>
                {avatarTooltip.member.work_phone && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    📞 {avatarTooltip.member.work_phone}
                  </div>
                )}
              </div>
            </div>

            {/* Detail rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {avatarTooltip.profile?.department && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, minWidth: 20 }}>🏢</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phòng ban</div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, marginTop: 1 }}>{avatarTooltip.profile.department}</div>
                  </div>
                </div>
              )}
              {avatarTooltip.profile?.facility && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, minWidth: 20 }}>📍</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cơ sở</div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, marginTop: 1 }}>{avatarTooltip.profile.facility}</div>
                  </div>
                </div>
              )}
              {avatarTooltip.profile?.available_times?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, minWidth: 20 }}>🕐</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Khung giờ rảnh</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {avatarTooltip.profile.available_times.map(t => (
                        <span key={t} style={{
                          fontSize: 11, background: 'var(--brand-soft)', color: 'var(--brand)',
                          borderRadius: 8, padding: '2px 8px', fontWeight: 600
                        }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!avatarTooltip.profile && (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '4px 0' }}>
                  Chưa có hồ sơ chi tiết
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
              <button
                type="button"
                onClick={() => setAvatarTooltip(null)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: '1.5px solid var(--border)',
                  background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  bridge.haptic('light');
                  setSelectedConnectBuddy(avatarTooltip.member);
                  setShowConnectSheet(true);
                  setAvatarTooltip(null);
                }}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)',
                  color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                🤝 Kết nối nhanh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <header className="app-header">
        <div className="brand-section">
          <span className="brand-icon">🍄</span>
          <div>
            <h1 className="brand-name">Mushy Connect</h1>
            <p className="brand-tagline">Tự tạo phòng hẹn nhanh đi chill & thể thao</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-navigation tab-navigation-bottom" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <button
          className={`nav-tab-btn ${activeTab === 'radar' ? 'nav-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('radar')}
        >
          <span>🛰️</span> Radar
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'inbox' ? 'nav-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          <span style={{ position: 'relative', display: 'inline-block' }}>
            📥
            {connectionRequests.filter(r => r.to_user_id === ctx.userId && r.status === 'pending').length > 0 && (
              <span className="notification-dot" style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--brand)',
                border: '1.5px solid #fff',
                boxShadow: '0 1px 3px rgba(230, 57, 70, 0.3)'
              }} />
            )}
          </span>
          Lời Mời
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'connections' ? 'nav-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <span style={{ position: 'relative', display: 'inline-block' }}>
            🤝
            {connectionMeetings.filter(m => m.status === 'pending_confirmation' && 
              ((connectionRequests.find(r => r.id === m.request_id)?.from_user_id === ctx.userId && !m.from_confirmed) || 
               (connectionRequests.find(r => r.id === m.request_id)?.to_user_id === ctx.userId && !m.to_confirmed))
            ).length > 0 && (
              <span className="notification-dot" style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--brand)',
                border: '1.5px solid #fff',
                boxShadow: '0 1px 3px rgba(230, 57, 70, 0.3)'
              }} />
            )}
          </span>
          Kết Nối
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'profile' ? 'nav-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span>⚙️</span> Hồ Sơ
        </button>
      </nav>

      {loading ? (
        <SkeletonScreen />
      ) : (
        <>
          {/* TAB 1: RADAR */}
          {activeTab === 'radar' && (
            <div className="tab-pane animated-fade-in">
              {!hasProfile ? (
                <section className="mushy-card" style={{ textAlign: 'center', padding: '30px 18px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛰️</div>
                  <h3 className="mushy-section-title" style={{ justifyContent: 'center' }}>Chưa thiết lập hồ sơ Connect</h3>
                  <p className="mushy-section-sub">
                    Nhập phòng ban, cơ sở và các thẻ sở thích dạng Accordion để khởi động radar xếp hạng ưu tiên chéo cực đỉnh nào!
                  </p>
                  <button className="mushy-btn mushy-btn--primary" onClick={() => { bridge.haptic('light'); setShowProfileModal(true); }}>
                    Tạo Hồ Sơ Ngay
                  </button>
                </section>
              ) : (
                <>
                  <div className="compact-radar-header">
                    <div className="radar-pulse-wrapper">
                      <div className="radar-pulse-dot"></div>
                      <div className="radar-pulse-ring"></div>
                    </div>
                    <div className="radar-text-wrapper">
                      <h4 className="compact-radar-title">Connect Radar đang quét...</h4>
                      <p className="compact-radar-sub">
                        Khớp chéo sở thích trong tổ chức <strong>{scope.label}</strong>
                      </p>
                    </div>
                    <div className="compact-radar-action">
                      <label className="fallback-toggle-label" title="Cho phép gợi ý bộ môn cùng nhóm khi thiếu người">
                        <input
                          type="checkbox"
                          checked={fallbackEnabled}
                          onChange={(e) => setFallbackEnabled(e.target.checked)}
                          className="fallback-checkbox-hidden"
                        />
                        <span className={`fallback-toggle-btn ${fallbackEnabled ? 'active' : ''}`}>
                          {fallbackEnabled ? '💡 Gợi ý bật' : '💡 Gợi ý tắt'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Search box for Radar */}
                  <div className="search-box-container" style={{ marginBottom: 14 }}>
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="mushy-input search-input"
                      placeholder="Tìm đồng nghiệp theo tên, phòng ban, sở thích..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 38 }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: 16
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Primary Buddy section for Newbies */}
                  {newbiePrimaryBuddy && (
                    <section className="mushy-card newbie-buddy-card" style={{
                      background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                      border: '1.5px solid #FCD34D',
                      borderRadius: '20px',
                      padding: '16px 20px',
                      marginBottom: '16px',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px'
                      }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#D97706',
                          background: '#FEF3C7',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          border: '1px solid #FCD34D',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          🌟 Buddy cho tuần đầu
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#D97706' }}>
                          {newbiePrimaryBuddy.matchScore}% Match
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: getAvatarGradient(newbiePrimaryBuddy.member.full_name?.charAt(0)),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#fff',
                          boxShadow: '0 4px 10px rgba(217, 119, 6, 0.15)',
                          flexShrink: 0
                        }}>
                          {newbiePrimaryBuddy.member.full_name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: '#1F2937' }}>
                            {newbiePrimaryBuddy.member.full_name}
                          </h4>
                          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#4B5563' }}>
                            🏢 {newbiePrimaryBuddy.profile.department} · 📍 {newbiePrimaryBuddy.profile.facility}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#D97706', fontStyle: 'italic' }}>
                            💡 Sẵn sàng hướng dẫn bạn làm quen môi trường làm việc mới!
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid rgba(245, 158, 11, 0.15)', paddingTop: '12px' }}>
                        <button
                          className="mushy-btn mushy-btn--primary"
                          style={{
                            flex: 1,
                            minHeight: '34px',
                            height: '34px',
                            fontSize: '12px',
                            background: '#D97706',
                            borderColor: '#D97706',
                            color: '#fff',
                            fontWeight: '700'
                          }}
                          onClick={() => {
                            setSelectedConnectBuddy(newbiePrimaryBuddy.member);
                            setShowConnectSheet(true);
                          }}
                        >
                          🤝 Kết nối nhanh
                        </button>
                      </div>
                    </section>
                  )}

                  {/* Count badge */}
                  {rankedCandidates.length > 0 && (
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10, textAlign: 'right' }}>
                      Tìm thấy <strong>{rankedCandidates.length}</strong> đồng nghiệp phù hợp
                    </p>
                  )}

                  {rankedCandidates.length === 0 ? (
                    <div className="mushy-empty-state animated-fade-in">
                      <div className="mushy-empty-icon">🛰️</div>
                      <h4 className="mushy-empty-title">Radar chưa quét thấy ai</h4>
                      <p className="mushy-empty-desc">Không tìm thấy đồng nghiệp nào trùng thẻ sở thích với bạn. Hãy thử đổi sở thích hoặc chia sẻ workspace nhé!</p>
                    </div>
                  ) : (() => {
                    const totalPages = Math.ceil(rankedCandidates.length / RADAR_PAGE_SIZE);
                    const paginatedCandidates = rankedCandidates.slice((radarPage - 1) * RADAR_PAGE_SIZE, radarPage * RADAR_PAGE_SIZE);
                    return (
                      <>
                        {paginatedCandidates.map(({ member, profile, tags, exactMatches, sharedParents, priority, isFallback, fallbackParentLabel, matchScore, hasInteracted }) => (
                          <section
                            key={member.user_id}
                            className="buddy-card-compact"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              bridge.haptic('light');
                              setSelectedConnectBuddy(member);
                              setShowConnectSheet(true);
                            }}
                          >
                            <div className="buddy-card-main">
                              <div className="buddy-avatar-compact">
                                <span>{member.full_name?.charAt(0)}</span>
                              </div>
                              
                              <div className="buddy-body-compact">
                                <div className="buddy-header-row">
                                  <h4 className="buddy-name-compact">{member.full_name}</h4>
                                  <span className={`buddy-match-badge ${matchScore >= 80 ? 'buddy-match-badge--premium' : ''}`}>
                                    {matchScore >= 80 ? '✨ ' : ''}{matchScore}% Match
                                  </span>
                                </div>
                                
                                <div className="buddy-meta-row">
                                  <span className="buddy-dept">{profile.department || 'Phòng ban'}</span>
                                  <span className="buddy-dot-separator">·</span>
                                  <span className="buddy-facility">{profile.facility || 'Cơ sở'}</span>
                                </div>

                                {/* Explainable reason */}
                                {(() => {
                                  const serverReasons = serverMatchReasons[member.user_id];
                                  const clientReason = buildMatchReason(member, profile, exactMatches, sharedParents || [], hasInteracted);
                                  const displayReason = serverReasons?.length > 0 ? serverReasons.join(' · ') : clientReason;
                                  return displayReason ? <p className="buddy-reason-text">💡 {displayReason}</p> : null;
                                })()}

                                <p className="buddy-time-text">
                                  🕒 Rảnh: {profile.available_times?.join(', ') || 'Chưa cập nhật'}
                                </p>

                                <div className="buddy-labels-row">
                                  {/* Show exactly one key badge */}
                                  {priority === 1 ? (
                                    <span className="buddy-status-pill priority-high">🔥 Khác phòng ban</span>
                                  ) : priority === 2 ? (
                                    <span className="buddy-status-pill priority-same">👥 Cùng phòng ban</span>
                                  ) : hasInteracted ? (
                                    <span className="buddy-status-pill priority-interacted">⇆ Đã tương tác</span>
                                  ) : isFallback ? (
                                    <span className="buddy-status-pill priority-fallback">💡 Gợi ý nhóm {fallbackParentLabel}</span>
                                  ) : null}

                                  {/* Clean matching tag chips */}
                                  {exactMatches.slice(0, 3).map(tag => (
                                    <span
                                      key={tag.code}
                                      className="buddy-tag-compact"
                                      style={{ cursor: 'pointer' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        bridge.haptic('light');
                                        setSelectedConnectBuddy(member);
                                        setShowConnectSheet(true);
                                      }}
                                      title={`Rủ nhanh ${member.full_name} cùng chơi ${tag.name}`}
                                    >
                                      ❤️ {tag.name}
                                    </span>
                                  ))}
                                </div>

                                {/* Skills của người kia */}
                                {profile.skills?.length > 0 && (
                                  <div className="buddy-labels-row" style={{ marginTop: 4 }}>
                                    {profile.skills.slice(0, 3).map(s => (
                                      <span key={s} className="buddy-tag-compact buddy-tag-skill">🛠 {s}</span>
                                    ))}
                                  </div>
                                )}

                                {/* Goals của người kia */}
                                {profile.career_goals?.length > 0 && (
                                  <p className="buddy-time-text" style={{ color: '#A855F7' }}>
                                    🎯 {profile.career_goals.slice(0, 2).join(' · ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </section>
                        ))}

                        {/* Beautiful Pagination Controls */}
                        {totalPages > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 10 }}>
                            <button
                              type="button"
                              className="mushy-btn mushy-btn--ghost"
                              disabled={radarPage === 1}
                              onClick={() => { bridge.haptic('light'); setRadarPage(prev => Math.max(1, prev - 1)); }}
                              style={{ padding: '6px 14px', minHeight: 34, height: 34, fontSize: 12.5 }}
                            >
                              ◀ Trước
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                              Trang {radarPage} / {totalPages}
                            </span>
                            <button
                              type="button"
                              className="mushy-btn mushy-btn--ghost"
                              disabled={radarPage === totalPages}
                              onClick={() => { bridge.haptic('light'); setRadarPage(prev => Math.min(totalPages, prev + 1)); }}
                              style={{ padding: '6px 14px', minHeight: 34, height: 34, fontSize: 12.5 }}
                            >
                              Sau ▶
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* TAB 3: CONNECTIONS - DANH SÁCH KẾT NỐI & ĐIỂM SỐ */}
          {activeTab === 'connections' && (
            <div className="tab-pane animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Point Card & Badge Level */}
              <div className="mushy-card" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,240,242,0.8) 100%)',
                border: '1.5px solid rgba(255, 77, 109, 0.15)',
                borderRadius: '24px',
                padding: '22px 20px',
                boxShadow: '0 10px 30px rgba(230, 57, 70, 0.05)',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--brand)', lineHeight: '1.1' }}>
                      {myPoints.points}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                      Điểm Kết Nối
                    </div>
                  </div>
                  <div style={{ height: '32px', width: '1.5px', background: 'rgba(230, 57, 70, 0.15)' }} />
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', lineHeight: '1.1' }}>
                      {myPoints.confirmed_1to1_count}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                      Cuộc Gặp 1-1
                    </div>
                  </div>
                </div>

                {/* Huy chương */}
                {(() => {
                  const badge = myPoints.helper_badge_level;
                  let gradient = 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)';
                  let label = 'Chưa có Huy chương';
                  let emoji = '🎗️';
                  let nextTargetText = 'Tích lũy 30 điểm để đạt Huy chương Đồng';

                  if (badge === 'gold') {
                    gradient = 'linear-gradient(135deg, #FDE047 0%, #EAB308 100%)';
                    label = 'Huy chương Vàng';
                    emoji = '🥇';
                    nextTargetText = 'Bạn đã đạt cấp độ kết nối cao nhất! 🎉';
                  } else if (badge === 'silver') {
                    gradient = 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)';
                    label = 'Huy chương Bạc';
                    emoji = '🥈';
                    nextTargetText = 'Tích lũy thêm ' + (100 - myPoints.points) + ' điểm để đạt Huy chương Vàng';
                  } else if (badge === 'bronze') {
                    gradient = 'linear-gradient(135deg, #FED7AA 0%, #EA580C 100%)';
                    label = 'Huy chương Đồng';
                    emoji = '🥉';
                    nextTargetText = 'Tích lũy thêm ' + (60 - myPoints.points) + ' điểm để đạt Huy chương Bạc';
                  }

                  return (
                    <div style={{
                      background: 'rgba(255,255,255,0.6)',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      border: '1px solid rgba(15,15,18,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{emoji}</span>
                        <span style={{
                          fontWeight: '800',
                          fontSize: '13.5px',
                          background: gradient,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {label}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                        {nextTargetText}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Confirmation Prompt Carousel / List */}
              {(() => {
                const pendingConfirmationMeetings = connectionMeetings.filter(m => {
                  if (m.status !== 'pending_confirmation') return false;
                  const req = connectionRequests.find(r => r.id === m.request_id);
                  if (!req) return false;
                  
                  const isFrom = ctx.userId === req.from_user_id;
                  const isTo = ctx.userId === req.to_user_id;
                  
                  return (isFrom && !m.from_confirmed) || (isTo && !m.to_confirmed);
                });

                if (pendingConfirmationMeetings.length === 0) return null;

                return (
                  <section>
                    <h4 className="chip-group-title" style={{ margin: '0 0 10px 6px' }}>
                      🔔 Xác nhận cuộc gặp
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {pendingConfirmationMeetings.map(meeting => {
                        const req = connectionRequests.find(r => r.id === meeting.request_id);
                        const buddyId = req.from_user_id === ctx.userId ? req.to_user_id : req.from_user_id;
                        const buddy = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
                        const typeLabel = getConnectTypeLabel(req.action_type);

                        return (
                          <div key={meeting.id} className="mushy-card form-slide-down" style={{
                            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                            border: '1.5px solid #FCD34D',
                            padding: '16px 18px',
                            borderRadius: '20px',
                            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)'
                          }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontSize: '32px' }}>☕</span>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <h5 style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: '800', color: '#1F2937' }}>
                                  Bạn và {buddy.full_name} đã gặp nhau chưa?
                                </h5>
                                <p style={{ margin: 0, fontSize: '11.5px', color: '#4B5563', lineHeight: '1.4' }}>
                                  Hình thức: <strong>{typeLabel}</strong>. Xác nhận gặp để nhận ngay 10 điểm kết nối!
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid rgba(245, 158, 11, 0.15)', paddingTop: '12px' }}>
                              <button
                                type="button"
                                className="mushy-btn mushy-btn--primary"
                                style={{
                                  flex: 2,
                                  minHeight: '34px',
                                  height: '34px',
                                  fontSize: '12px',
                                  background: '#D97706',
                                  borderColor: '#D97706',
                                  color: '#fff',
                                  fontWeight: '800'
                                }}
                                onClick={() => handleConfirmMeeting(meeting.id, 'confirmed')}
                              >
                                ✓ Đã gặp mặt ngoài đời
                              </button>
                              <button
                                type="button"
                                className="mushy-btn mushy-btn--ghost"
                                style={{
                                  flex: 1,
                                  minHeight: '34px',
                                  height: '34px',
                                  fontSize: '12px',
                                  color: '#D97706',
                                  borderColor: '#FCD34D',
                                  background: 'transparent',
                                  fontWeight: '600'
                                }}
                                onClick={() => handleConfirmMeeting(meeting.id, 'skipped')}
                              >
                                Bỏ qua
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}

              {/* Active Connections & Chat list */}
              <section>
                <h4 className="chip-group-title" style={{ margin: '0 0 10px 6px' }}>
                  💬 Kết nối đã thiết lập
                </h4>
                {(() => {
                  const activeConns = connectionRequests.filter(r => r.status === 'accepted');

                  if (activeConns.length === 0) {
                    return (
                      <div className="mushy-empty-state" style={{ padding: '30px 16px', margin: 0 }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤝</div>
                        <h5 className="mushy-empty-title">Chưa có kết nối nào</h5>
                        <p className="mushy-empty-desc">Chấp nhận lời mời hoặc gửi rủ nhanh để thiết lập kết nối 1-1 và trò chuyện.</p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeConns.map(conn => {
                        const buddyId = conn.from_user_id === ctx.userId ? conn.to_user_id : conn.from_user_id;
                        const buddy = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
                        const buddyProf = allProfiles[buddyId] || {};
                        const typeLabel = getConnectTypeLabel(conn.action_type);
                        const messages = parseChatMessages(conn.chat_group_id);
                        const hasUnread = messages.length > 0 && messages[messages.length - 1].senderId !== ctx.userId;

                        return (
                          <div key={conn.id} className="buddy-card-compact" style={{ padding: '14px 16px', margin: 0 }}>
                            <div className="buddy-card-main">
                              <div className="buddy-avatar-compact" style={{
                                background: getAvatarGradient(buddy.full_name?.charAt(0))
                              }}>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{buddy.full_name?.charAt(0)}</span>
                              </div>
                              <div className="buddy-body-compact" style={{ textAlign: 'left' }}>
                                <div className="buddy-header-row">
                                  <h4 className="buddy-name-compact">{buddy.full_name}</h4>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    background: 'var(--brand-soft)',
                                    color: 'var(--brand)',
                                    borderRadius: '6px'
                                  }}>
                                    {typeLabel}
                                  </span>
                                </div>
                                <div className="buddy-meta-row" style={{ marginTop: '2px' }}>
                                  <span className="buddy-dept">{buddyProf.department || 'Phòng ban'}</span>
                                  <span className="buddy-dot-separator">·</span>
                                  <span className="buddy-facility">{buddyProf.facility || 'Cơ sở'}</span>
                                </div>
                                {messages.length > 0 && (
                                  <p style={{
                                    margin: '6px 0 0',
                                    fontSize: '11.5px',
                                    color: hasUnread ? 'var(--brand)' : 'var(--muted)',
                                    fontWeight: hasUnread ? 'bold' : 'normal',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden'
                                  }}>
                                    💬 {messages[messages.length - 1].content}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="buddy-actions-compact" style={{ borderTop: '1px solid var(--hairline)', marginTop: '12px', paddingTop: '10px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="mushy-btn"
                                style={{
                                  minHeight: '30px',
                                  height: '30px',
                                  fontSize: '11.5px',
                                  padding: '0 12px',
                                  background: 'var(--brand)',
                                  borderColor: 'var(--brand)',
                                  color: '#fff',
                                  fontWeight: '700',
                                  borderRadius: '16px',
                                  position: 'relative'
                                }}
                                onClick={() => {
                                  bridge.haptic('light');
                                  setActiveChatConnection(conn);
                                }}
                              >
                                Vào Chat
                                {hasUnread && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'var(--brand)',
                                    border: '1.5px solid #fff'
                                  }} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>

              {/* Pending Outbox Invites */}
              <section>
                <h4 className="chip-group-title" style={{ margin: '0 0 10px 6px' }}>
                  📤 Yêu cầu đã gửi (Outbox)
                </h4>
                {(() => {
                  const outbox = connectionRequests.filter(r => r.from_user_id === ctx.userId && r.status === 'pending');

                  if (outbox.length === 0) {
                    return (
                      <div className="mushy-empty-state" style={{ padding: '24px 16px', margin: 0 }}>
                        <p className="mushy-empty-desc" style={{ fontSize: '11.5px' }}>Chưa gửi lời mời kết nối nào.</p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {outbox.map(req => {
                        const buddy = members.find(m => m.user_id === req.to_user_id) || { full_name: 'Đồng nghiệp' };
                        const buddyProf = allProfiles[req.to_user_id] || {};
                        const typeLabel = getConnectTypeLabel(req.action_type);

                        return (
                          <div key={req.id} className="buddy-card-compact" style={{
                            background: 'rgba(255,255,255,0.5)',
                            padding: '12px 14px',
                            margin: 0,
                            borderColor: 'rgba(15,15,18,0.05)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>
                                  Gửi tới: {buddy.full_name}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '2px' }}>
                                  Hình thức: <strong>{typeLabel}</strong> · Trạng thái: <span style={{ color: '#F59E0B', fontWeight: '700' }}>Chờ phản hồi</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '10px', color: 'var(--muted)', flexShrink: 0 }}>
                                {new Date(req.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>

              {/* Leaderboard Section */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px 6px' }}>
                  <h4 className="chip-group-title" style={{ margin: 0 }}>
                    🏆 Bảng xếp hạng Connect
                  </h4>
                  <button
                    type="button"
                    className="mushy-btn mushy-btn--ghost"
                    style={{ minHeight: '26px', height: '26px', fontSize: '10.5px', padding: '0 8px', margin: 0, borderRadius: '6px' }}
                    onClick={handleOpenSharing}
                  >
                    ⇆ Liên-Workspace
                  </button>
                </div>
                
                <div className="mushy-card" style={{ padding: '10px 14px', borderRadius: '20px' }}>
                  {allPoints.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', margin: '10px 0' }}>Chưa có ai tích lũy điểm kết nối.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {allPoints.map((row, index) => {
                        const isMe = row.user_id === ctx.userId;
                        const userObj = members.find(m => m.user_id === row.user_id) || (isMe ? { full_name: 'Bạn' } : { full_name: 'Đồng nghiệp' });
                        const isTop3 = index < 3;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                        return (
                          <div key={row.user_id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 6px',
                            borderBottom: index < allPoints.length - 1 ? '1px solid var(--hairline)' : 'none',
                            background: isMe ? 'rgba(230, 57, 70, 0.04)' : 'transparent',
                            borderRadius: isMe ? '10px' : '0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <span style={{
                                width: '22px',
                                textAlign: 'center',
                                fontWeight: '800',
                                fontSize: isTop3 ? '16px' : '12px',
                                color: isTop3 ? 'var(--brand)' : 'var(--muted)',
                                flexShrink: 0
                              }}>
                                {medal || (index + 1)}
                              </span>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: getAvatarGradient(userObj.full_name?.charAt(0)),
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}>
                                {userObj.full_name?.charAt(0)}
                              </div>
                              <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: isMe ? '800' : '600',
                                  color: isMe ? 'var(--brand)' : 'var(--ink)',
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {userObj.full_name} {isMe ? '(Tôi)' : ''}
                                </span>
                                {row.helper_badge_level && (
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    padding: '1px 5px',
                                    background: row.helper_badge_level === 'gold' ? '#FEF08A' : row.helper_badge_level === 'silver' ? '#F1F5F9' : '#FFEDD5',
                                    color: row.helper_badge_level === 'gold' ? '#854D0E' : row.helper_badge_level === 'silver' ? '#475569' : '#C2410C',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase'
                                  }}>
                                    {row.helper_badge_level}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, fontWeight: '800', fontSize: '13px', color: 'var(--ink)' }}>
                              {row.points} <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'normal' }}>đối tác</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
              
            </div>
          )}
          
          {/* TAB 2: INBOX - HỘP THƯ LỜI MỜI NHẬN ĐƯỢC */}
          {activeTab === 'inbox' && (
            <div className="tab-pane animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="compact-tab-header">
                <div className="radar-pulse-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, width: 24, height: 24 }}>
                  📥
                </div>
                <div className="radar-text-wrapper" style={{ flex: 1, textAlign: 'left' }}>
                  <h4 className="compact-radar-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Hộp thư lời mời Connect</h4>
                  <p className="compact-radar-sub" style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Lời mời kết nối nhận được từ đồng nghiệp</p>
                </div>
              </div>

              {(() => {
                const incomingRequests = connectionRequests.filter(r => r.to_user_id === ctx.userId && r.status === 'pending');

                if (incomingRequests.length === 0) {
                  return (
                    <div className="mushy-empty-state animated-fade-in">
                      <div className="mushy-empty-icon">📥</div>
                      <h4 className="mushy-empty-title">Hộp thư lời mời trống</h4>
                      <p className="mushy-empty-desc">Hiện chưa có lời mời Connect nào gửi tới bạn. Hãy thử đổi sở thích hoặc chủ động gửi lời mời trước nhé!</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {incomingRequests.map(req => {
                      const hostObj = members.find(m => m.user_id === req.from_user_id) || { full_name: 'Đồng nghiệp' };
                      const typeLabel = getConnectTypeLabel(req.action_type);
                      const profileObj = allProfiles[req.from_user_id] || {};

                      return (
                        <div
                          key={req.id}
                          className="mushy-card invitation-card"
                          style={{ margin: 0, textAlign: 'left' }}
                        >
                          <div className="buddy-card-header">
                            <div className="buddy-avatar-wrapper" style={{
                              width: 44,
                              height: 44,
                              flexShrink: 0,
                              background: getAvatarGradient(hostObj.full_name?.charAt(0)),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              fontWeight: 'bold',
                              color: '#fff'
                            }}>
                              <span>{hostObj.full_name?.charAt(0)}</span>
                            </div>
                            <div className="buddy-info" style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.35 }}>
                                Lời mời từ {hostObj.full_name}
                              </h4>
                              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.35 }}>
                                🏢 {profileObj.department || 'Phòng ban'} · 📍 {profileObj.facility || 'Cơ sở'}
                              </p>
                            </div>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              background: 'var(--brand-soft)',
                              color: 'var(--brand)',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}>
                              {typeLabel}
                            </span>
                          </div>

                          {req.message_template && (
                            <div style={{
                              marginTop: 10,
                              padding: '10px 12px',
                              background: 'rgba(15,15,18,0.02)',
                              borderRadius: 12,
                              fontSize: 12.5,
                              color: 'var(--ink)',
                              border: '1px solid var(--hairline)',
                              lineHeight: 1.4
                            }}>
                              💬 "{req.message_template}"
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                            <button
                              className="mushy-btn mushy-btn--primary"
                              style={{ flex: 1, minHeight: 36, height: 36, fontSize: 13, fontWeight: 700 }}
                              onClick={() => handleRespondRequest(req.id, 'accepted')}
                            >
                              Chấp nhận
                            </button>
                            <button
                              className="mushy-btn mushy-btn--ghost"
                              style={{ 
                                color: 'var(--danger)', 
                                borderColor: 'var(--danger)', 
                                flex: 1,
                                minHeight: 36, 
                                height: 36, 
                                fontSize: 13, 
                                fontWeight: 700
                              }}
                              onClick={() => handleRespondRequest(req.id, 'declined')}
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* TAB 4: PROFILE - HỒ SƠ CÁ NHÂN */}
          {activeTab === 'profile' && (
            <div className="tab-pane animated-fade-in">
              <div className="compact-tab-header">
                <div className="radar-pulse-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, width: 24, height: 24 }}>
                  ⚙️
                </div>
                <div className="radar-text-wrapper" style={{ flex: 1 }}>
                  <h4 className="compact-radar-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Hồ sơ Connect</h4>
                  <p className="compact-radar-sub" style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Điền thông tin và chọn sở thích để radar kết nối hoạt động</p>
                </div>
              </div>

              <section className="mushy-card">
                <div style={{ marginBottom: 12 }}>
                  <label className="mushy-label">Phòng ban trực thuộc (Department)</label>
                  <input
                    type="text"
                    className="mushy-input"
                    placeholder="Vd: Kỹ thuật (R&D), Kinh doanh, Nhân sự..."
                    value={myProfile.department}
                    onChange={(e) => setMyProfile(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="mushy-label">Cơ sở làm việc (Facility)</label>
                  <input
                    type="text"
                    className="mushy-input"
                    placeholder="Vd: Cơ sở Hà Nội - Keangnam, Cơ sở Landmark 81..."
                    value={myProfile.facility}
                    onChange={(e) => setMyProfile(prev => ({ ...prev, facility: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label className="mushy-label">Khung giờ rảnh thông thường (Multi-select)</label>
                  <div className="chips-container" style={{ marginTop: 6 }}>
                    {['Giờ ăn trưa', 'Chiều sau giờ làm', 'Cuối tuần', 'Tối ngày thường'].map(time => {
                      const isSelected = myProfile.available_times.includes(time);
                      return (
                        <span
                          key={time}
                          className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setMyProfile(prev => ({ ...prev, available_times: prev.available_times.filter(t => t !== time) }));
                            } else {
                              setMyProfile(prev => ({ ...prev, available_times: [...prev.available_times, time] }));
                            }
                          }}
                        >
                          ⏰ {time}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Thẻ sở thích (Accordion)</h4>
                  <div className="search-box-container">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="mushy-input search-input"
                      placeholder="Gõ từ khóa để lọc nhanh 200 Child Tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {filteredAccordionTaxonomy.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>Không tìm thấy thẻ sở thích phù hợp.</p>
                    ) : (
                      filteredAccordionTaxonomy.map(parent => {
                        const isOpen = expandedParents[parent.parent_code] || parent.isAutoExpanded;
                        return (
                          <div key={parent.parent_code} className="accordion-item">
                            <div
                              className="accordion-header"
                              onClick={() => toggleParentAccordion(parent.parent_code)}
                            >
                              <span>{highlightSearchText(parent.parent_name, searchQuery)}</span>
                              <span className={`accordion-icon ${isOpen ? 'accordion-icon--open' : ''}`}>▼</span>
                            </div>
                            {isOpen && (
                              <div className="accordion-content">
                                <div className="chips-container">
                                  {parent.children.map(c => {
                                    const isSelected = myTags.includes(c.code);
                                    return (
                                      <span
                                        key={c.code}
                                        className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                                        onClick={() => toggleSelectTag(c.code)}
                                      >
                                        {highlightSearchText(c.name, searchQuery)}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="form-actions" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 14, marginTop: 14 }}>
                  <button
                    type="button"
                    className="mushy-btn mushy-btn--primary mushy-btn--block"
                    onClick={handleSaveProfile}
                  >
                    Lưu hồ sơ Connect 🍄
                  </button>
                </div>
              </section>
            </div>
          )}

        </>
      )}

      {/* QUICK CONNECT BOTTOM SHEET (TYPED ACTIONS) */}
      {showConnectSheet && selectedConnectBuddy && (() => {
        const buddyProfile = allProfiles[selectedConnectBuddy.user_id] || {};
        const isNewbieBuddy = myProfile.is_newbie && buddyProfile.is_buddy_helper;

        return (
          <div className="modal-scrim dialog-scrim animated-fade-in" onClick={() => { setShowConnectSheet(false); setSelectedConnectBuddy(null); }}>
            <div className="modal-card bottom-sheet-card animated-slide-up" style={{
              maxWidth: 420,
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              marginTop: 'auto',
              borderRadius: '24px 24px 0 0',
              padding: '20px 24px 34px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              animation: 'sheet-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--hairline)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  ⚡ Gửi lời mời tới {selectedConnectBuddy.full_name}
                </h3>
                <button 
                  type="button"
                  onClick={() => { setShowConnectSheet(false); setSelectedConnectBuddy(null); }}
                  style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', padding: '0 4px', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                  Chọn hình thức kết nối phù hợp để tự động gửi lời nhắn châm ngòi cuộc gặp gỡ ngoài đời thực:
                </p>

                <div className="quick-action-list">
                  {[
                    { type: 'food', icon: '🍴', title: 'Ăn uống', desc: 'Rủ nhau ăn trưa hoặc cafe ngắn chớp nhoáng', msg: 'Chào bạn, mình muốn rủ bạn ăn trưa/cafe để làm quen và trao đổi thêm nhé!' },
                    { type: 'sport', icon: '⚽', title: 'Thể thao', desc: 'Tìm người tập cùng, chạy bộ hoặc chơi bóng sau giờ làm', msg: 'Chào bạn, mình thấy bạn cũng thích thể thao, hôm nào chúng ta giao lưu nhé!' },
                    { type: 'knowledge', icon: '📖', title: 'Tri thức', desc: 'Chia sẻ kinh nghiệm chuyên môn, học hỏi kỹ năng chéo', msg: 'Chào bạn, mình rất ấn tượng với profile của bạn và muốn kết nối trao đổi tri thức!' },
                    { type: 'casual', icon: '💬', title: 'Tán gẫu', desc: 'Làm quen trò chuyện nhẹ nhàng, tự nhiên không áp lực', msg: 'Chào bạn, mình muốn kết nối làm quen trò chuyện nhẹ nhàng lúc rảnh.' },
                    ...(isNewbieBuddy ? [{ type: 'intro_meet', icon: '🤝', title: 'Lập lịch làm quen', desc: 'Dành riêng cho nhân viên mới kết nối với Buddy hỗ trợ', msg: 'Chào anh/chị, em là người mới onboard. Em rất mong được kết nối và học hỏi kinh nghiệm làm việc từ anh/chị!' }] : [])
                  ].map(action => (
                    <button
                      key={action.type}
                      type="button"
                      className="quick-action-item"
                      onClick={() => handleSendConnectionRequest(selectedConnectBuddy.user_id, action.type, action.msg)}
                    >
                      <div className="quick-action-icon">{action.icon}</div>
                      <div className="quick-action-info">
                        <div className="quick-action-name">{action.title}</div>
                        <div className="quick-action-desc">{action.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PROFILE CONFIGURATION MODAL */}
      {showProfileModal && (
        <div className="modal-scrim dialog-scrim animated-fade-in" onClick={() => setShowProfileModal(false)}>
          <div className="modal-card" style={{ maxWidth: 500, textAlign: 'left', display: 'flex', flexDirection: 'column', maxHeight: '90dvh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
              <h3 className="dialog-title" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚙️</span> Thiết lập Hồ sơ Connect
              </h3>
              <button 
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', padding: '0 4px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              <p className="mushy-section-sub" style={{ margin: '0 0 16px' }}>Điền các thông tin hành chính chéo và chọn tối đa 200 thẻ sở thích được thiết kế dạng Accordion thả xuống tiện lợi.</p>

              {/* Form fields */}
              <div style={{ marginBottom: 12 }}>
                <label className="mushy-label">Phòng ban trực thuộc (Department)</label>
                <input
                  type="text"
                  className="mushy-input"
                  placeholder="Vd: Kỹ thuật (R&D), Kinh doanh, Nhân sự..."
                  value={myProfile.department}
                  onChange={(e) => setMyProfile(prev => ({ ...prev, department: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="mushy-label">Cơ sở làm việc (Facility)</label>
                <input
                  type="text"
                  className="mushy-input"
                  placeholder="Vd: Cơ sở Hà Nội - Keangnam, Cơ sở Landmark 81..."
                  value={myProfile.facility}
                  onChange={(e) => setMyProfile(prev => ({ ...prev, facility: e.target.value }))}
                  required
                />
              </div>

              {/* Available times multi-select */}
              <div style={{ marginBottom: 18 }}>
                <label className="mushy-label">Khung giờ rảnh thông thường (Multi-select)</label>
                <div className="chips-container" style={{ marginTop: 6 }}>
                  {['Giờ ăn trưa', 'Chiều sau giờ làm', 'Cuối tuần', 'Tối ngày thường'].map(time => {
                    const isSelected = myProfile.available_times.includes(time);
                    return (
                      <span
                        key={time}
                        className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setMyProfile(prev => ({ ...prev, available_times: prev.available_times.filter(t => t !== time) }));
                          } else {
                            setMyProfile(prev => ({ ...prev, available_times: [...prev.available_times, time] }));
                          }
                        }}
                      >
                        ⏰ {time}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* SKILLS */}
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                <label className="mushy-label">Kỹ năng chuyên môn (Skills)</label>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 8px' }}>Chọn các kỹ năng bạn có — dùng để match với người cùng chuyên môn</p>
                <div className="chips-container">
                  {['JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 'Design', 'Marketing', 'Sales', 'Data Analysis', 'Public Speaking'].map(skill => {
                    const isSelected = mySkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                        style={isSelected ? {} : { background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.2)', color: '#06B6D4' }}
                        onClick={() => {
                          bridge.haptic('light');
                          setMySkills(prev => isSelected ? prev.filter(s => s !== skill) : [...prev, skill]);
                        }}
                      >
                        🛠 {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* CAREER GOALS */}
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                <label className="mushy-label">Mục tiêu nghề nghiệp (Career Goals)</label>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 8px' }}>Chọn mục tiêu bạn đang hướng tới — giúp kết nối với người cùng chí hướng</p>
                <div className="chips-container">
                  {['Tìm mentor', 'Trở thành mentor', 'Học công nghệ mới', 'Mở rộng network', 'Luyện kỹ năng mềm', 'Chuyển hướng nghề nghiệp'].map(goal => {
                    const isSelected = myGoals.includes(goal);
                    return (
                      <span
                        key={goal}
                        className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                        style={isSelected ? {} : { background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.2)', color: '#A855F7' }}
                        onClick={() => {
                          bridge.haptic('light');
                          setMyGoals(prev => isSelected ? prev.filter(g => g !== goal) : [...prev, goal]);
                        }}
                      >
                        🎯 {goal}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* USER ROLES */}
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                <label className="mushy-label">Vai trò thành viên (User Roles)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      style={{ accentColor: 'var(--brand)' }}
                      checked={!!myProfile.is_newbie}
                      onChange={(e) => setMyProfile(prev => ({ ...prev, is_newbie: e.target.checked }))}
                    />
                    <span>Tôi là nhân viên mới (Intern / Onboard tuần đầu) 👶</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      style={{ accentColor: 'var(--brand)' }}
                      checked={!!myProfile.is_buddy_helper}
                      onChange={(e) => setMyProfile(prev => ({ ...prev, is_buddy_helper: e.target.checked }))}
                    />
                    <span>Tôi sẵn sàng hỗ trợ người mới làm quen môi trường 🤝</span>
                  </label>
                </div>
              </div>

              {/* CONNECT TYPES */}
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                <label className="mushy-label">Ưu tiên hình thức kết nối (Connect Types)</label>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 8px' }}>Chọn các hoạt động bạn muốn giao lưu cùng đồng nghiệp</p>
                <div className="chips-container">
                  {[
                    { code: 'food', label: '🍴 Ăn uống / Cafe' },
                    { code: 'sport', label: '⚽ Thể thao' },
                    { code: 'knowledge', label: '📖 Tri thức' },
                    { code: 'casual', label: '💬 Tán gẫu' }
                  ].map(ct => {
                    const isSelected = (myProfile.connect_types || []).includes(ct.code);
                    return (
                      <span
                        key={ct.code}
                        className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                        onClick={() => {
                          bridge.haptic('light');
                          setMyProfile(prev => {
                            const current = prev.connect_types || [];
                            const next = isSelected ? current.filter(x => x !== ct.code) : [...current, ct.code];
                            return { ...prev, connect_types: next };
                          });
                        }}
                      >
                        {ct.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* KNOWLEDGE SHARING */}
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                <label className="mushy-label">Kỹ năng tôi có thể chia sẻ (Share Skills)</label>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 8px' }}>Chọn kỹ năng bạn tự tin hướng dẫn, trao đổi cho đồng nghiệp</p>
                <div className="chips-container">
                  {['JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 'Design', 'Marketing', 'Sales', 'Data Analysis', 'Public Speaking'].map(skill => {
                    const isSelected = (myProfile.share_skills || []).includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                        style={isSelected ? {} : { background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)', color: '#10B981' }}
                        onClick={() => {
                          bridge.haptic('light');
                          setMyProfile(prev => {
                            const current = prev.share_skills || [];
                            const next = isSelected ? current.filter(x => x !== skill) : [...current, skill];
                            return { ...prev, share_skills: next };
                          });
                        }}
                      >
                        📖 {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                <label className="mushy-label">Kỹ năng tôi muốn học hỏi (Learn Skills)</label>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 8px' }}>Chọn kỹ năng bạn đang muốn tìm hiểu hoặc cải thiện</p>
                <div className="chips-container">
                  {['JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 'Design', 'Marketing', 'Sales', 'Data Analysis', 'Public Speaking'].map(skill => {
                    const isSelected = (myProfile.learn_skills || []).includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                        style={isSelected ? {} : { background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)', color: '#D97706' }}
                        onClick={() => {
                          bridge.haptic('light');
                          setMyProfile(prev => {
                            const current = prev.learn_skills || [];
                            const next = isSelected ? current.filter(x => x !== skill) : [...current, skill];
                            return { ...prev, learn_skills: next };
                          });
                        }}
                      >
                        🎓 {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* SEARCH BAR LỌC NHANH */}
              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Hệ thống thẻ sở thích (Tag Taxonomy - Accordion & Lọc Nhanh)</h4>
                <div className="search-box-container">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="mushy-input search-input"
                    placeholder="Gõ từ khóa để lọc nhanh 200 Child Tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* ACCORDION CATEGORY GRIDS */}
                <div style={{ marginTop: 12 }}>
                  {filteredAccordionTaxonomy.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>Không tìm thấy thẻ sở thích phù hợp.</p>
                  ) : (
                    filteredAccordionTaxonomy.map(parent => {
                      const isOpen = expandedParents[parent.parent_code] || parent.isAutoExpanded;
                      return (
                        <div key={parent.parent_code} className="accordion-item">
                          <div
                            className="accordion-header"
                            onClick={() => toggleParentAccordion(parent.parent_code)}
                          >
                            <span>{highlightSearchText(parent.parent_name, searchQuery)}</span>
                            <span className={`accordion-icon ${isOpen ? 'accordion-icon--open' : ''}`}>▼</span>
                          </div>

                          {isOpen && (
                            <div className="accordion-content">
                              <div className="chips-container">
                                {parent.children.map(c => {
                                  const isSelected = myTags.includes(c.code);
                                  return (
                                    <span
                                      key={c.code}
                                      className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                                      onClick={() => toggleSelectTag(c.code)}
                                    >
                                      {highlightSearchText(c.name, searchQuery)}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 14, marginTop: 14 }}>
              <button
                type="button"
                className="mushy-btn mushy-btn--primary mushy-btn--block"
                onClick={handleSaveProfile}
              >
                Lưu hồ sơ Connect 🍄
              </button>
              <button 
                type="button"
                className="mushy-btn mushy-btn--ghost mushy-btn--block" 
                onClick={() => setShowProfileModal(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CROSS-WORKSPACE SHARING MODAL */}
      {showSharingModal && (
        <div className="modal-scrim dialog-scrim animated-fade-in" onClick={() => setShowSharingModal(false)}>
          <div className="modal-card dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon" style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--brand)' }}>
              ⇆
            </div>
            <h3 className="dialog-title">Kết nối liên-Workspace</h3>
            <p className="dialog-body" style={{ textAlign: 'left', marginBottom: 16 }}>
              Tính năng chia sẻ chéo (superapp mig 049) cho phép thành viên giữa các workspace được liên kết xem thông tin và lập kèo chung cùng nhau!
            </p>

            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16, textAlign: 'left' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Nhập mã kết nối nhận chia sẻ</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="mushy-input"
                  placeholder="Nhập mã 6 ký tự..."
                  value={shareCodeInput}
                  onChange={(e) => setShareCodeInput(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
                <button className="mushy-btn mushy-btn--primary" style={{ padding: '0 16px', minHeight: 44 }} onClick={handleRedeemCode}>
                  Gửi
                </button>
              </div>
            </div>

            {isAnyAdmin && (
              <div style={{ borderTop: '1px solid var(--hairline)', marginTop: 18, paddingTop: 16, textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Tạo mã chia sẻ Workspace hiện tại</h4>
                <button className="mushy-btn mushy-btn--ghost mushy-btn--block" onClick={handleGenerateCode}>
                  Tạo Mã Kết Nối
                </button>

                {generatedCode && (
                  <div style={{ background: 'var(--surface-muted)', borderRadius: 12, padding: 12, marginTop: 10, textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--muted)' }}>Gửi mã này cho Workspace liên kết (Hạn 24h):</p>
                    <div style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 2, color: 'var(--brand)' }}>{generatedCode.code}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--hairline)', marginTop: 18, paddingTop: 16, textAlign: 'left' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Các kết nối chia sẻ hiện tại</h4>
              {loadingGrants ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
                  <span className="mushy-spinner" />
                </div>
              ) : shareGrants.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>Chưa có kết nối chia sẻ chéo nào.</p>
              ) : (
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {shareGrants.map(grant => {
                    const isOwner = grant.direction === 'as_owner';
                    return (
                      <div key={grant.grantId} className="sharing-grant-row">
                        <div className="grant-info">
                          <span className={`grant-direction-tag ${isOwner ? 'grant-direction-tag--in' : 'grant-direction-tag--out'}`}>
                            {isOwner ? 'Phát chia sẻ' : 'Nhận chia sẻ'}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--ink)' }}>
                            {isOwner ? grant.followerWorkspaceName : grant.ownerWorkspaceName}
                          </span>
                        </div>
                        <button
                          className="mushy-btn mushy-btn--ghost"
                          style={{ padding: '4px 10px', minHeight: 30, fontSize: 11, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => handleRevokeGrant(grant.grantId)}
                        >
                          Xóa
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button className="mushy-btn mushy-btn--ghost mushy-btn--block" onClick={() => setShowSharingModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CHAT MODAL FOR 1-1 CONNECTION */}
      {activeChatConnection && (() => {
        const buddyId = activeChatConnection.from_user_id === ctx.userId ? activeChatConnection.to_user_id : activeChatConnection.from_user_id;
        const buddyMember = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
        const messages = parseChatMessages(activeChatConnection.chat_group_id);
        const actionLabel = getConnectTypeLabel(activeChatConnection.action_type);

        return (
          <div className="modal-scrim animated-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setActiveChatConnection(null)}>
            <div className="modal-card" style={{ width: '100%', maxWidth: '480px', height: '85vh', maxHeight: '720px', borderRadius: '24px', padding: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(24px)', border: '1.5px solid rgba(255, 255, 255, 0.45)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
              
              {/* Chat Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--hairline)', background: 'linear-gradient(135deg, rgba(255, 240, 242, 0.8) 0%, rgba(255, 229, 233, 0.8) 100%)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>💬</span>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
                      Trò chuyện với {buddyMember.full_name}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                      ⚡ Hình thức: {actionLabel}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveChatConnection(null)}
                  style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: 'var(--muted)' }}
                >
                  ✕
                </button>
              </div>

              {/* Chat Messages */}
              <div 
                id="mushy-chat-messages-container"
                style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255, 255, 255, 0.3)' }}
              >
                {messages.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--muted)', opacity: 0.8 }}>
                    <span style={{ fontSize: 44, marginBottom: 8 }}>💬🍄</span>
                    <span style={{ fontSize: 13, fontStyle: 'italic' }}>Chưa có tin nhắn nào.</span>
                    <span style={{ fontSize: 11, marginTop: 4 }}>Hãy gửi tin nhắn để bắt đầu câu chuyện nhé!</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === ctx.userId;
                    const senderName = isMe ? 'Bạn' : buddyMember.full_name;
                    const formattedTime = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          width: '100%'
                        }}
                      >
                        <span style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 2, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0, fontWeight: 600 }}>
                          {senderName}
                        </span>
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            borderTopRightRadius: isMe ? '4px' : '16px',
                            borderTopLeftRadius: isMe ? '16px' : '4px',
                            background: isMe ? 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)' : '#fff',
                            color: isMe ? '#fff' : 'var(--foreground)',
                            fontSize: 13,
                            lineHeight: 1.4,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            border: isMe ? 'none' : '1px solid var(--hairline)',
                            textAlign: 'left',
                            wordBreak: 'break-word'
                          }}
                        >
                          {msg.content}
                        </div>
                        <span style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, opacity: 0.7 }}>
                          {formattedTime}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessageForBuddy(activeChatConnection.id, buddyChatInput);
                  setBuddyChatInput('');
                }}
                style={{ padding: '14px 16px', borderTop: '1px solid var(--hairline)', background: '#fff', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', gap: 10 }}
              >
                <input
                  type="text"
                  className="mushy-input"
                  placeholder="Nhập tin nhắn..."
                  value={buddyChatInput}
                  onChange={(e) => setBuddyChatInput(e.target.value)}
                  style={{ flex: 1, margin: 0, borderRadius: '20px', minHeight: '38px', height: '38px', fontSize: '13px', padding: '0 16px' }}
                />
                <button
                  type="submit"
                  className="mushy-btn mushy-btn--primary"
                  style={{ minHeight: '38px', height: '38px', borderRadius: '50%', width: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  disabled={!buddyChatInput.trim()}
                >
                  🚀
                </button>
              </form>

            </div>
          </div>
        );
      })()}
      </div>
    );
  }
