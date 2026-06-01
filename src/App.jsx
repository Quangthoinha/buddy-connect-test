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
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'rooms' | 'inbox' | 'profile'

  // Data states
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [myProfile, setMyProfile] = useState({
    department: '',
    facility: '',
    available_times: [],
  });
  const [myTags, setMyTags] = useState([]); // Selected child_codes

  const [members, setMembers] = useState([]); // Workspace members
  const [allProfiles, setAllProfiles] = useState({}); // user_id -> profile
  const [allUserTags, setAllUserTags] = useState({}); // user_id -> array of child_codes
  const [rooms, setRooms] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [interactionHistory, setInteractionHistory] = useState([]);

  // UI Interactivity states
  const [expandedParents, setExpandedParents] = useState({}); // parent_code -> boolean
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [reconnectingRoomId, setReconnectingRoomId] = useState(null);
  const [highlightedRoomId, setHighlightedRoomId] = useState(null);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const isSwiping = useRef(false);
  const hasTriggeredSwipeHaptic = useRef(false);
  const swipeDirection = useRef(null); // null | 'horizontal' | 'vertical'


  // Room Co-creation Form State
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    child_code: 'badminton',
    location: '',
    scheduled_at: '',
    max_participants: 2,
  });
  const [invitedGuests, setInvitedGuests] = useState([]); // selected guest user_ids
  const [randomMode, setRandomMode] = useState('mix'); // 'mix' | 'strangers' | 'acquaintances'
  const [guestSearchQuery, setGuestSearchQuery] = useState(''); // text query to search colleagues
  const [submittingRoom, setSubmittingRoom] = useState(false);
  const [quotaMultiplier, setQuotaMultiplier] = useState(3); // default x3 per empty slot

  // Host Withdraw Form state
  const [showCancelModal, setShowCancelModal] = useState(null); // room object
  const [cancelReason, setCancelReason] = useState('Bận việc đột xuất');

  // Cross-Workspace Sharing states
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Quick Invite states
  const [quickInviteData, setQuickInviteData] = useState(null); // { member, tagCode, tagName }
  const [quickInviteLocation, setQuickInviteLocation] = useState('Căn tin công ty');
  const [quickInviteTime, setQuickInviteTime] = useState('');
  const [submittingQuickInvite, setSubmittingQuickInvite] = useState(false);

  const [shareCodeInput, setShareCodeInput] = useState('');
  const [radarPage, setRadarPage] = useState(1);
  const RADAR_PAGE_SIZE = 10;

  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [avatarTooltip, setAvatarTooltip] = useState(null); // { member, profile } — shown on long-press

  useEffect(() => {
    setRadarPage(1);
  }, [searchQuery, fallbackEnabled, scope]);

  useEffect(() => {
    if (activeChatRoom) {
      setTimeout(() => {
        const el = document.getElementById('mushy-chat-messages-container');
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }, [activeChatRoom, rooms]);
  const [shareGrants, setShareGrants] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loadingGrants, setLoadingGrants] = useState(false);

  // 1. Fetch all data on mount and scope changes
  useEffect(() => {
    if (scope?.workspaceId) {
      loadData();
    }
  }, [scope?.workspaceId]);

  // 2. Setup Real-time Change Listeners
  useEffect(() => {
    if (!scope?.workspaceId) return;

    // Listen to rooms changes (realtime matching and slot indicators)
    const unsubRooms = subscribeToTable('rooms', scope.workspaceId, () => {
      loadRoomsData();
    });

    // Listen to invitations (accepted counts, expiring list)
    const unsubInvs = subscribeToTable('invitations', scope.workspaceId, () => {
      loadInvitationsData();
    });

    return () => {
      unsubRooms();
      unsubInvs();
    };
  }, [scope?.workspaceId]);

  // Load complete state from DB
  async function loadData() {
    setLoading(true);
    try {
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      // Run lazy daemon to clean up expired rooms
      await runLazyExpiryDaemon(activeWs);

      // Auto-initialize database tags taxonomy if missing for this workspace
      // (Required for production/staging workspaces that haven't been manually seeded!)
      try {
        const { error: checkTagsErr, count } = await db
          .from('tags')
          .select('child_code', { count: 'exact', head: true })
          .eq('workspace_id', activeWs);

        if (checkTagsErr) {
          console.error('Lỗi kiểm tra tags danh mục:', checkTagsErr);
        }

        if (!checkTagsErr && (count === null || count < 200)) {
          console.log('⚡ Taxonomy missing or incomplete. Auto-seeding/upserting 200 tags...');
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
            console.error('Lỗi tự động seed tags:', seedErr);
            dialog.error('Lỗi khởi tạo danh mục', `Không thể ghi danh mục sở thích: ${seedErr.message} (Code: ${seedErr.code})`);
          } else {
            console.log('✓ Tự động seed 200 tags thành công cho workspace!');
          }
        }
      } catch (checkErr) {
        console.warn('Lỗi kiểm tra/seeding tags:', checkErr);
      }

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
        });
        setHasProfile(true);

        // Fetch my user_tags
        const { data: tags } = await db
          .from('user_tags')
          .select('child_code')
          .eq('workspace_id', activeWs)
          .eq('user_id', ctx.userId);
        setMyTags((tags || []).map(t => t.child_code));
      } else {
        setHasProfile(false);
        setShowProfileModal(true); // Force setup profile modal if empty
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

      // 5. Load Rooms & Invitations
      await loadRoomsData();
      await loadInvitationsData();

    } catch (err) {
      console.error('Lỗi tải dữ liệu Connect:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoomsData() {
    const activeWs = scope.workspaceId;
    if (!activeWs) return;

    const { data: rms } = await db
      .from('rooms')
      .select('*')
      .eq('workspace_id', activeWs)
      .order('scheduled_at', { ascending: true });

    setRooms(rms || []);
  }

  async function loadInvitationsData() {
    const activeWs = scope.workspaceId;
    if (!activeWs) return;

    const { data: invs } = await db
      .from('invitations')
      .select('*')
      .eq('workspace_id', activeWs);

    setInvitations(invs || []);
  }

  // 8.1 Expiry Daemon: Client-side lazy sweep
  async function runLazyExpiryDaemon(activeWs) {
    try {
      const nowStr = new Date().toISOString();
      // Fetch open or filling rooms in the past
      const { data: expiredRooms } = await db
        .from('rooms')
        .select('id')
        .eq('workspace_id', activeWs)
        .in('status', ['open', 'filling'])
        .lt('scheduled_at', nowStr);

      if (expiredRooms && expiredRooms.length > 0) {
        const roomIds = expiredRooms.map(r => r.id);
        console.log('Lazy daemon detected expired rooms:', roomIds);

        // Update rooms status
        await db
          .from('rooms')
          .update({ status: 'expired', updated_at: nowStr })
          .in('id', roomIds);

        // Update all pending invitations for these rooms to expired
        await db
          .from('invitations')
          .update({ status: 'expired', updated_at: nowStr })
          .in('room_id', roomIds)
          .eq('status', 'pending');
      }

      // Delete/clear mock chat logs for rooms scheduled more than 1 week ago
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString();

      const { data: oldRoomsChatToClean } = await db
        .from('rooms')
        .select('id')
        .eq('workspace_id', activeWs)
        .lt('scheduled_at', oneWeekAgoStr)
        .not('chat_group_id', 'is', null);

      if (oldRoomsChatToClean && oldRoomsChatToClean.length > 0) {
        const oldRoomIds = oldRoomsChatToClean.map(r => r.id);
        console.log('Lazy daemon cleaning old chat histories (> 1 week) for rooms:', oldRoomIds);

        await db
          .from('rooms')
          .update({ chat_group_id: null, updated_at: nowStr })
          .in('id', oldRoomIds);
      }
    } catch (e) {
      console.warn('Lỗi lazy daemon sweep:', e);
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

  // --- Quick Invite helper options & handlers ---
  const quickTimeOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    
    // 1. Trưa nay / trưa mai (12:00)
    const lunch = new Date(now);
    lunch.setHours(12, 0, 0, 0);
    if (lunch.getTime() < now.getTime()) {
      lunch.setDate(lunch.getDate() + 1);
      options.push({ label: 'Trưa mai (12:00)', value: lunch.toISOString(), icon: '🍲' });
    } else {
      options.push({ label: 'Trưa nay (12:00)', value: lunch.toISOString(), icon: '🍲' });
    }

    // 2. Chiều nay / chiều mai (17:30)
    const evening = new Date(now);
    evening.setHours(17, 30, 0, 0);
    if (evening.getTime() < now.getTime()) {
      evening.setDate(evening.getDate() + 1);
      options.push({ label: 'Chiều mai (17:30)', value: evening.toISOString(), icon: '🏸' });
    } else {
      options.push({ label: 'Chiều nay (17:30)', value: evening.toISOString(), icon: '🏸' });
    }

    // 3. Tối nay / tối mai (19:30)
    const night = new Date(now);
    night.setHours(19, 30, 0, 0);
    if (night.getTime() < now.getTime()) {
      night.setDate(night.getDate() + 1);
      options.push({ label: 'Tối mai (19:30)', value: night.toISOString(), icon: '☕' });
    } else {
      options.push({ label: 'Tối nay (19:30)', value: night.toISOString(), icon: '☕' });
    }

    // 4. Sáng mai (08:30)
    const morning = new Date(now);
    morning.setDate(morning.getDate() + 1);
    morning.setHours(8, 30, 0, 0);
    options.push({ label: 'Sáng mai (08:30)', value: morning.toISOString(), icon: '🏃' });

    return options;
  }, [quickInviteData]);

  const handleQuickInviteSubmit = async () => {
    if (!quickInviteTime) {
      return dialog.error('Thiếu thông tin', 'Vui lòng chọn thời gian hẹn nhanh!');
    }

    setSubmittingQuickInvite(true);
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;

      // 1. Create a room instantly
      const { data: room, error: roomErr } = await db
        .from('rooms')
        .insert({
          workspace_id: activeWs,
          host_id: ctx.userId,
          child_code: quickInviteData.tagCode,
          location: quickInviteLocation,
          scheduled_at: quickInviteTime,
          max_participants: 2,
          status: 'filling',
        })
        .select()
        .single();

      if (roomErr) throw roomErr;

      // 2. Send invitation to the selected colleague
      const { error: invErr } = await db.from('invitations').insert({
        workspace_id: activeWs,
        room_id: room.id,
        receiver_id: quickInviteData.member.user_id,
        status: 'pending',
      });

      if (invErr) throw invErr;

      // 4. Push remote native notification if in app
      try {
        const tagName = FLAT_TAGS.find(t => t.code === quickInviteData.tagCode)?.name || 'gặp gỡ';
        await mushyApi.push({
          workspaceId: activeWs,
          appSlug: 'buddy-connect',
          userIds: [quickInviteData.member.user_id],
          title: '⚡ Lập kèo nhanh!',
          body: `${ctx.userFullName || 'Đồng nghiệp'} đã rủ bạn cùng tham gia hoạt động "${tagName}" lúc ${quickInviteLocation} vào lúc ${new Date(quickInviteTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Mở app để nhận lời ngay!`,
        });
      } catch (pushErr) {
        console.warn('Lỗi push notification:', pushErr);
      }

      setQuickInviteData(null);
      await dialog.success('Đã gửi lời mời!', `Lập kèo nhanh thành công! Lời mời tham gia "${quickInviteData.tagName}" đã được gửi tới ${quickInviteData.member.full_name}.`);
      
      // Reload lists
      loadData();
    } catch (e) {
      dialog.error('Lỗi lập kèo nhanh', e.message);
    } finally {
      setSubmittingQuickInvite(false);
    }
  };

  // --- Smart Matching & Sorting Priority Logic (PRD Section 5) ---
  const rankedCandidates = useMemo(() => {
    if (!hasProfile) return [];

    const myProfileData = allProfiles[ctx.userId] || {};
    const myInterests = myTags || [];
    const q = searchQuery.trim().toLowerCase();

    return members
      .map(member => {
        const profile = allProfiles[member.user_id] || {};
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
        if (matchScore > 99) matchScore = 99; // Cap at 99%

        return {
          member,
          profile,
          tags,
          exactMatches: matchedChildObjects,
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
  }, [members, allProfiles, allUserTags, myTags, myProfile, interactionHistory, fallbackEnabled, hasProfile, searchQuery]);

  // --- Room Management Handlers ---

  // 6.2 Outbound Rate Quota Calculation
  const getOutboundLimit = (room) => {
    const acceptedCount = invitations.filter(i => i.room_id === room.id && i.status === 'accepted').length;
    const peopleJoined = acceptedCount + 1; // Host + accepted guests
    const slotsRemaining = room.max_participants - peopleJoined;
    return slotsRemaining * 3;
  };

  const getPendingInvitationsCount = (roomId) => {
    return invitations.filter(i => i.room_id === roomId && i.status === 'pending').length;
  };

  // Schedule Clash Detection Helper
  const checkScheduleClash = (scheduledTimeStr) => {
    const targetTime = new Date(scheduledTimeStr).getTime();
    const safetyWindow = 1.5 * 60 * 60 * 1000; // 1.5 hours in ms

    // Find any room that Guest has accepted (invitation status = accepted) OR hosting (host_id = userId)
    // where scheduled_at is within +/- 1.5 hours
    const clashingRooms = rooms.filter(room => {
      if (room.status === 'cancelled' || room.status === 'expired') return false;

      const roomTime = new Date(room.scheduled_at).getTime();
      const isClashing = Math.abs(roomTime - targetTime) < safetyWindow;
      if (!isClashing) return false;

      const isHost = room.host_id === ctx.userId;
      const isAcceptedGuest = invitations.some(i => i.room_id === room.id && i.receiver_id === ctx.userId && i.status === 'accepted');

      return isHost || isAcceptedGuest;
    });

    return clashingRooms[0] || null;
  };

  // Derived state for cascading selectors in room creation
  const selectedParentCode = useMemo(() => {
    const matched = FLAT_TAGS.find(t => t.code === newRoom.child_code);
    return matched ? matched.parent_code : TAXONOMY[0].parent_code;
  }, [newRoom.child_code]);

  const availableChildOptions = useMemo(() => {
    const parent = TAXONOMY.find(p => p.parent_code === selectedParentCode);
    return parent ? parent.children.map(c => ({ value: c.code, label: c.name })) : [];
  }, [selectedParentCode]);

  // Derived matching members for the selected tag during room creation
  const matchingTagMembers = useMemo(() => {
    if (!newRoom.child_code) return [];
    return members.filter(m => {
      const tags = allUserTags[m.user_id] || [];
      return tags.includes(newRoom.child_code);
    });
  }, [newRoom.child_code, members, allUserTags]);

  // Derived outbound limit during room creation
  const createRoomAllowedLimit = useMemo(() => {
    const maxParticipants = parseInt(newRoom.max_participants) || 2;
    return (maxParticipants - 1) * quotaMultiplier;
  }, [newRoom.max_participants, quotaMultiplier]);

  // Partition members into matching-tag and non-matching-tag lists for categorized creation display, supporting search and relationship filters
  const sortedMembersForCreate = useMemo(() => {
    const matching = [];
    const others = [];
    const q = guestSearchQuery.trim().toLowerCase();

    members.forEach(m => {
      // 1. Name query filter
      if (q && !m.full_name.toLowerCase().includes(q)) return;

      // 2. Relationship mix filter
      const hasInteracted = interactionHistory.some(h => 
        (h.user_id_1 === ctx.userId && h.user_id_2 === m.user_id) ||
        (h.user_id_1 === m.user_id && h.user_id_2 === ctx.userId)
      );

      if (randomMode === 'acquaintances' && !hasInteracted) return;
      if (randomMode === 'strangers' && hasInteracted) return;

      const tags = allUserTags[m.user_id] || [];
      if (tags.includes(newRoom.child_code)) {
        matching.push({ member: m, hasInteracted });
      } else {
        others.push({ member: m, hasInteracted });
      }
    });
    return { matching, others };
  }, [members, allUserTags, newRoom.child_code, guestSearchQuery, randomMode, interactionHistory, ctx.userId]);

  const handleParentChange = (parentCode) => {
    const parent = TAXONOMY.find(p => p.parent_code === parentCode);
    if (parent && parent.children.length > 0) {
      setNewRoom(prev => ({ ...prev, child_code: parent.children[0].code }));
    }
  };

  const handleSelectAllMatchingTagMembers = () => {
    bridge.haptic('light');
    if (matchingTagMembers.length === 0) return;

    const toSelect = matchingTagMembers.slice(0, createRoomAllowedLimit);
    setInvitedGuests(toSelect.map(m => m.user_id));

    if (matchingTagMembers.length > createRoomAllowedLimit) {
      dialog.info(
        'Đã chọn giới hạn',
        `Chỉ có thể mời tối đa ${createRoomAllowedLimit} người (hạn ngạch pending của phòng sỹ số ${newRoom.max_participants} là ${createRoomAllowedLimit}). Đã tự động chọn ${createRoomAllowedLimit} người đầu tiên trùng sở thích.`
      );
    } else {
      dialog.success(
        'Đã chọn tất cả',
        `Đã chọn toàn bộ ${toSelect.length} người có chung sở thích!`
      );
    }
  };

  const setQuickTime = (type) => {
    bridge.haptic('light');
    const now = new Date();
    let target = new Date();

    if (type === 'today_19') {
      target.setHours(19, 0, 0, 0);
      if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
    } else if (type === 'today_20') {
      target.setHours(20, 0, 0, 0);
      if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
    } else if (type === 'tomorrow_8') {
      target.setDate(target.getDate() + 1);
      target.setHours(8, 0, 0, 0);
    } else if (type === 'tomorrow_17') {
      target.setDate(target.getDate() + 1);
      target.setHours(17, 0, 0, 0);
    } else if (type === 'weekend_9') {
      const day = now.getDay();
      const daysUntilSaturday = day === 6 ? 7 : (6 - day);
      target.setDate(target.getDate() + daysUntilSaturday);
      target.setHours(9, 0, 0, 0);
    }

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const date = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');

    setNewRoom(prev => ({ ...prev, scheduled_at: `${year}-${month}-${date}T${hours}:${minutes}` }));
  };

  const handleSelectRandomGuests = (type, count) => {
    bridge.haptic('light');

    // Check remaining available slots
    const available = createRoomAllowedLimit - invitedGuests.length;
    if (available <= 0) {
      return dialog.info('Hạn ngạch đã đầy', `Bạn đã chọn đủ số lượng lời mời tối đa cho phép (${createRoomAllowedLimit} người).`);
    }

    let pool = [];

    // 1. Initial filter based on tag preference
    if (type === 'same_tag') {
      pool = members.filter(m => {
        const tags = allUserTags[m.user_id] || [];
        return tags.includes(newRoom.child_code);
      });
    } else {
      pool = members;
    }

    // Exclude guests who are already invited/selected
    pool = pool.filter(m => !invitedGuests.includes(m.user_id));

    // 2. Secondary filter based on relationship profile history (stranger vs acquaintance)
    pool = pool.filter(m => {
      const hasInteracted = interactionHistory.some(h => 
        (h.user_id_1 === ctx.userId && h.user_id_2 === m.user_id) ||
        (h.user_id_1 === m.user_id && h.user_id_2 === ctx.userId)
      );

      if (randomMode === 'acquaintances') return hasInteracted;
      if (randomMode === 'strangers') return !hasInteracted;
      return true; // 'mix' mode
    });

    if (pool.length === 0) {
      let modeName = randomMode === 'acquaintances' ? 'người quen' : 'người lạ';
      if (randomMode === 'mix') modeName = 'thành viên';
      return dialog.info('Không tìm thấy', `Không tìm thấy đồng nghiệp nào chưa được chọn trong nhóm "${modeName}" để ghép.`);
    }

    // 3. Shuffle pool and apply limits
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const limit = Math.min(shuffled.length, count, available);
    if (limit === 0) {
      let modeName = randomMode === 'acquaintances' ? 'người quen' : 'người lạ';
      if (randomMode === 'mix') modeName = 'thành viên';
      return dialog.info('Không tìm thấy', `Không tìm thấy đồng nghiệp nào chưa được chọn trong nhóm "${modeName}" để ghép thêm.`);
    }
    const selected = shuffled.slice(0, limit);

    setInvitedGuests(prev => [...prev, ...selected.map(m => m.user_id)]);
    const namesStr = selected.map(m => m.full_name).join(', ');
    dialog.success(
      'Đã chọn ngẫu nhiên',
      `Đã chọn thêm ${selected.length} đồng nghiệp (${randomMode === 'mix' ? 'lạ/quen mix' : randomMode === 'strangers' ? 'chỉ người lạ' : 'chỉ người quen'}) vào danh sách mời:\n\n${namesStr}`
    );
  };

  // Co-creation validation & submit
  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();

    if (!newRoom.location.trim() || !newRoom.scheduled_at) {
      return dialog.error('Thiếu thông tin', 'Vui lòng nhập vị trí và chọn thời gian hẹn.');
    }

    const maxParticipants = parseInt(newRoom.max_participants);
    if (!maxParticipants || maxParticipants < 2) {
      return dialog.error('Sĩ số không hợp lệ', 'Sĩ số tối đa phải từ 2 người trở lên.');
    }

    // 4.1 Co-creation requirement: must select at least 1 guest
    if (invitedGuests.length === 0) {
      return dialog.error('Ràng buộc tạo phòng', 'Hệ thống bắt buộc Host phải chọn ít nhất 1 người để gửi lời mời đầu tiên thì mới cho phép tạo phòng, tránh phòng mồ côi!');
    }

    if (invitedGuests.length > createRoomAllowedLimit) {
      return dialog.error('Vượt quá hạn ngạch', `Số người được mời (${invitedGuests.length}) vượt quá số lượng pending tối đa cho phép (${createRoomAllowedLimit}) cho phòng này.`);
    }

    setSubmittingRoom(true);
    try {
      const activeWs = scope.workspaceId;
      const nowStr = new Date().toISOString();

      // Check if Host has a schedule clash
      const clash = checkScheduleClash(newRoom.scheduled_at);
      if (clash) {
        setSubmittingRoom(false);
        const ok = await dialog.confirm(
          'Phát hiện trùng lịch trình!',
          `Bạn đã có lịch tham gia hoặc host kèo "${clash.location}" vào lúc ${formatTime(clash.scheduled_at)}. Bạn có chắc chắn muốn tiếp tục tạo kèo mới này không?`,
          { danger: true, confirmLabel: 'Tạo Kèo Mới', cancelLabel: 'Hủy' }
        );
        if (!ok) return;
        setSubmittingRoom(true);
      }

      // 1. Create Room
      const { data: room, error: roomErr } = await db
        .from('rooms')
        .insert({
          workspace_id: activeWs,
          host_id: ctx.userId,
          child_code: newRoom.child_code,
          location: newRoom.location.trim(),
          scheduled_at: new Date(newRoom.scheduled_at).toISOString(),
          max_participants: parseInt(newRoom.max_participants),
          status: 'open',
          version: 1
        })
        .select()
        .single();

      if (roomErr) throw roomErr;

      // 2. Dispatch Invitations
      const invitationsPayload = invitedGuests.map(receiverId => ({
        workspace_id: activeWs,
        room_id: room.id,
        receiver_id: receiverId,
        status: 'pending'
      }));

      const { error: invsErr } = await db.from('invitations').insert(invitationsPayload);
      if (invsErr) throw invsErr;

      // 3. Reset form
      setShowCreateRoom(false);
      setInvitedGuests([]);
      setNewRoom({
        child_code: 'badminton',
        location: '',
        scheduled_at: '',
        max_participants: 2,
      });

      bridge.haptic('success');
      await dialog.success('Tạo phòng thành công!', 'Phòng hẹn đã được khởi tạo và phát đi các lời mời đầu tiên.');
      loadData();

      // Super App Push Notification
      try {
        await mushyApi.push({
          title: `🍄 Lời mời Connect mới!`,
          body: `Bạn được mời tham gia kèo: "${room.location}".`,
          userIds: invitedGuests,
          data: { appSlug: 'buddy-connect', screen: 'inbox' }
        });
      } catch (err) {
        console.warn('Push error:', err);
      }

    } catch (e) {
      dialog.error('Lỗi tạo phòng', e.message);
    } finally {
      setSubmittingRoom(false);
    }
  };

  // 6.3 Schedule Clash & Accept Invitation Handler
  const handleAcceptInvitation = async (inv) => {
    try {
      bridge.haptic('light');
      const activeWs = scope.workspaceId;
      

      const room = rooms.find(r => r.id === inv.room_id);
      if (!room) return;

      // Fetch latest state of the room to prevent race condition
      const { data: latestRoom } = await db
        .from('rooms')
        .select('*')
        .eq('id', room.id)
        .single();

      if (!latestRoom || latestRoom.status === 'matched' || latestRoom.status === 'expired' || latestRoom.status === 'cancelled') {
        return dialog.error('Không thể tham gia', 'Rất tiếc, phòng hẹn đã đủ thành viên hoặc không còn khả dụng.');
      }

      // Schedule clash check
      const clash = checkScheduleClash(room.scheduled_at);
      if (clash) {
        const confirmSwitch = await dialog.confirm(
          'Đụng độ lịch trình!',
          `Bạn đã có lịch tham gia kèo khác vào khung giờ này (${formatTime(clash.scheduled_at)}). Bạn có chắc chắn muốn rút lui khỏi kèo cũ để tham gia kèo mới này không?`,
          { danger: true, confirmLabel: 'Đồng ý Đổi Kèo', cancelLabel: 'Giữ Kèo Cũ' }
        );

        if (!confirmSwitch) return;

        // Auto withdraw from the clashing old room
        if (clash.host_id === ctx.userId) {
          // If you are the Host of the old room, you must cancel it
          await db
            .from('rooms')
            .update({ status: 'cancelled', cancel_reason: 'Host chuyển sang kèo khác', updated_at: new Date().toISOString() })
            .eq('id', clash.id);
        } else {
          // If you are a Guest in the old room, change old invitation to declined
          await db
            .from('invitations')
            .update({ status: 'declined', updated_at: new Date().toISOString() })
            .eq('room_id', clash.id)
            .eq('receiver_id', ctx.userId)
            .eq('status', 'accepted');
        }
      }

      // 6.1 Multi-Participant Accept logic
      // Lock room with optimistic locking via version increment
      const nextVersion = latestRoom.version + 1;
      const { data: updatedRoom, error: updateErr } = await db
        .from('rooms')
        .update({ version: nextVersion, updated_at: new Date().toISOString() })
        .eq('id', room.id)
        .eq('version', latestRoom.version)
        .select()
        .single();

      if (updateErr || !updatedRoom) {
        // Race condition: someone else accepted first
        return dialog.error('Tranh chấp slot', 'Phòng vừa mới được lấp đầy hoặc trạng thái đã thay đổi. Vui lòng thử kèo khác nhé!');
      }

      // Accept current invitation
      await db
        .from('invitations')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', inv.id);

      // Recalculate participant counts
      const currentAccepted = invitations.filter(i => i.room_id === room.id && i.status === 'accepted').length + 1; // including the new acceptance
      const totalParticipants = currentAccepted + 1; // + Host

      if (totalParticipants >= room.max_participants) {
        // 6.1 Lock the room, set to matched and expire other pending invitations
        await db
          .from('rooms')
          .update({ status: 'matched', updated_at: new Date().toISOString() })
          .eq('id', room.id);

        await db
          .from('invitations')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('room_id', room.id)
          .eq('status', 'pending');

        // Add symmetric interactions between all participants to interaction_history
        await recordInteractionHistory(room.id, room.host_id);

        // 7.1 Native chat creation via JS Bridge
        await createRoomNativeChat(room.id, room.location);
      } else {
        // Update to filling state
        await db
          .from('rooms')
          .update({ status: 'filling', updated_at: new Date().toISOString() })
          .eq('id', room.id);
      }

      bridge.haptic('success');
      await loadData();

      // Optimistically redirect to the 'rooms' tab and trigger a premium highlight glow
      setHighlightedRoomId(room.id);
      setActiveTab('rooms');

      // Allow DOM rendering of the tab switcher, then scroll the accepted room card into center view smoothly
      setTimeout(() => {
        const roomEl = document.getElementById(`room-card-${room.id}`);
        if (roomEl) {
          roomEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);

      // Fade out the crimson highlighting border after 3.5 seconds
      setTimeout(() => {
        setHighlightedRoomId(null);
      }, 3850);
    } catch (e) {
      dialog.error('Lỗi khi chấp nhận', e.message);
    }
  };

  // Record symmetric connection chéo history (PRD Section 3)
  const recordInteractionHistory = async (roomId, hostId) => {
    try {
      const activeWs = scope.workspaceId;
      // Get all accepted participants in this room
      const { data: accInvs } = await db
        .from('invitations')
        .select('receiver_id')
        .eq('room_id', roomId)
        .eq('status', 'accepted');

      if (!accInvs) return;

      const participantIds = [hostId, ...accInvs.map(i => i.receiver_id)];

      // Build symmetric pairs: always store user_id_1 < user_id_2
      const historyPayload = [];
      for (let i = 0; i < participantIds.length; i++) {
        for (let j = i + 1; j < participantIds.length; j++) {
          const id1 = participantIds[i] < participantIds[j] ? participantIds[i] : participantIds[j];
          const id2 = participantIds[i] < participantIds[j] ? participantIds[j] : participantIds[i];

          historyPayload.push({
            workspace_id: activeWs,
            user_id_1: id1,
            user_id_2: id2
          });
        }
      }

      if (historyPayload.length > 0) {
        // Use upsert to avoid duplicate key errors
        await db.from('interaction_history').upsert(historyPayload);
      }
    } catch (e) {
      console.warn('Lỗi ghi chép lịch sử tương tác:', e);
    }
  };

  // Native chat group generator (PRD Section 7)
  const createRoomNativeChat = async (roomId, roomLocation) => {
    try {
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      // Fetch the latest room state from DB to ensure absolute accuracy and avoid stale React state
      const { data: room, error: roomDbErr } = await db
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomDbErr || !room) {
        console.error('Không tìm thấy phòng hẹn khi khởi tạo nhóm chat:', roomDbErr);
        return;
      }

      // Fetch latest accepted participants directly from DB to prevent React async state lag
      const { data: dbInvs } = await db
        .from('invitations')
        .select('receiver_id')
        .eq('room_id', roomId)
        .eq('status', 'accepted');

      const accGuests = dbInvs ? dbInvs.map(i => i.receiver_id) : [];
      const participantIds = [room.host_id, ...accGuests];

      // Call Native Shell Bridge with fallback support
      let chatGroupId;
      try {
        const nativeChatResult = await callNative('CREATE_CHAT_GROUP', {
          title: `💬 Connect Room: ${roomLocation.substring(0, 20)}`,
          userIds: participantIds
        });
        chatGroupId = nativeChatResult?.chatGroupId;
      } catch (bridgeErr) {
        console.warn('Lỗi Native Shell CREATE_CHAT_GROUP, sử dụng fallback ID.', bridgeErr);
      }

      if (!chatGroupId) {
        chatGroupId = `mock-chat-${Math.random().toString(36).substring(2, 9)}`;
      }

      // Update room in DB
      await db
        .from('rooms')
        .update({ chat_group_id: chatGroupId, updated_at: new Date().toISOString() })
        .eq('id', roomId);

      console.log('✓ Khởi tạo nhóm chat thành công:', chatGroupId);
    } catch (e) {
      console.error('Lỗi khởi tạo nhóm chat:', e);
    }
  };

  // 7.1 Distributed Fault-Tolerance reconnection trigger
  const handleReconnectChat = async (room) => {
    if (reconnectingRoomId) return;
    bridge.haptic('light');
    setReconnectingRoomId(room.id);
    try {
      await createRoomNativeChat(room.id, room.location);
      await loadData();
      dialog.success('Kết nối thành công!', 'Nhóm chat chéo của phòng hẹn đã được kết nối lại thành công.');
    } catch (err) {
      console.error('Lỗi khi kết nối lại nhóm chat:', err);
      dialog.error('Lỗi kết nối lại', 'Không thể kết nối lại nhóm chat. Vui lòng thử lại sau.');
    } finally {
      setReconnectingRoomId(null);
    }
  };

  const parseChatMessages = (chatGroupId) => {
    try {
      if (!chatGroupId) return [];
      if (chatGroupId.startsWith('[') && chatGroupId.endsWith(']')) {
        return JSON.parse(chatGroupId);
      }
    } catch (e) {
      console.warn('Failed to parse chat messages from chat_group_id:', e);
    }
    return [];
  };

  const getSenderName = (senderId, hostId) => {
    if (senderId === ctx.userId) return 'Bạn';
    if (senderId === hostId) return 'Host';
    const member = members.find(m => m.user_id === senderId);
    return member ? member.full_name : 'Đồng nghiệp';
  };

  const handleSendChatMessage = async (room, content) => {
    if (!content.trim()) return;
    const currentMessages = parseChatMessages(room.chat_group_id);
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
        .from('rooms')
        .update({ chat_group_id: newChatGroupId, updated_at: new Date().toISOString() })
        .eq('id', room.id);
    } catch (e) {
      console.error('Failed to send chat message:', e);
    }
  };

  // Host withdraw/cancel with reasons (PRD Section 7.2)
  const handleCancelRoomSubmit = async () => {
    if (!showCancelModal) return;

    try {
      bridge.haptic('medium');
      const room = showCancelModal;
      const activeWs = scope.workspaceId;
      const nowStr = new Date().toISOString();

      // 1. Update room status to cancelled
      await db
        .from('rooms')
        .update({
          status: 'cancelled',
          cancel_reason: cancelReason,
          updated_at: nowStr
        })
        .eq('id', room.id);

      // 2. Set pending/accepted invitations to declined/expired
      await db
        .from('invitations')
        .update({ status: 'declined', updated_at: nowStr })
        .eq('room_id', room.id);

      // 3. Send distributed native chat announcement message via bridge
      if (room.chat_group_id) {
        const cancelMsg = `🚨 Thông báo: Host đã hủy kèo đi chill này với lý do: "[Lý do Host nhập: ${cancelReason}]". Nhóm chat sẽ đóng lại tại đây. Hẹn gặp mọi người ở các kèo sau nhé 🍄.`;
        try {
          await callNative('SEND_CHAT_MESSAGE', {
            chatGroupId: room.chat_group_id,
            message: cancelMsg
          });
          // Transition group to Read-only
          await callNative('LOCK_CHAT_GROUP_READONLY', {
            chatGroupId: room.chat_group_id
          });
        } catch (bridgeErr) {
          console.warn('Không gửi được tin nhắn bù do bridge lỗi:', bridgeErr);
        }
      }

      setShowCancelModal(null);
      await dialog.success('Đã hủy phòng hẹn', 'Hệ thống đã đóng phòng và gửi thông báo văn minh đến các thành viên.');
      loadData();
    } catch (e) {
      dialog.error('Lỗi hủy phòng', e.message);
    }
  };

  const handleDeclineInvitation = async (inv) => {
    try {
      bridge.haptic('light');
      

      await db
        .from('invitations')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', inv.id);

      // If room was filling, update room back to open if no guest remains
      const room = rooms.find(r => r.id === inv.room_id);
      if (room && room.status === 'filling') {
        const remainingGuests = invitations.filter(i => i.room_id === room.id && i.status === 'accepted' && i.id !== inv.id).length;
        if (remainingGuests === 0) {
          await db
            .from('rooms')
            .update({ status: 'open', updated_at: new Date().toISOString() })
            .eq('id', room.id);
        }
      }

      loadData();
    } catch (e) {
      dialog.error('Lỗi từ chối', e.message);
    }
  };



  const handleInviteAdditionalGuest = async (roomId, guestId) => {
    try {
      bridge.haptic('light');
      const activeWs = scope.workspaceId;
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      // Rate Limit quota check
      const currentPending = getPendingInvitationsCount(roomId);
      const allowedLimit = getOutboundLimit(room);

      if (currentPending >= allowedLimit) {
        return dialog.error(
          'Chặn hạn ngạch!',
          `Không thể mời thêm. Số lời mời pending tối đa của phòng này tại thời điểm này là: ${allowedLimit} lời mời. Vui lòng bấm nút [Thu hồi] các lời mời cũ để nhường chỗ.`
        );
      }

      await db.from('invitations').insert({
        workspace_id: activeWs,
        room_id: roomId,
        receiver_id: guestId,
        status: 'pending'
      });

      loadData();
    } catch (e) {
      dialog.error('Lỗi mời thêm', e.message);
    }
  };

  const handleInviteMatchingGuests = async (roomId) => {
    try {
      bridge.haptic('light');
      const activeWs = scope.workspaceId;
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const currentPending = getPendingInvitationsCount(roomId);
      const allowedLimit = getOutboundLimit(room);
      const roomInvs = invitations.filter(i => i.room_id === roomId);

      // Find all members who have matching tags
      const matchingMembers = members.filter(m => {
        // Not invited yet
        if (roomInvs.some(i => i.receiver_id === m.user_id)) return false;
        // Has matching tag
        const tags = allUserTags[m.user_id] || [];
        return tags.includes(room.child_code);
      });

      if (matchingMembers.length === 0) {
        return dialog.info('Không tìm thấy', 'Không có thành viên nào khác trong workspace có chung tag này chưa được mời.');
      }

      const remainingQuota = allowedLimit - currentPending;
      if (remainingQuota <= 0) {
        return dialog.error(
          'Chặn hạn ngạch!',
          `Không thể mời thêm. Đã đạt giới hạn pending (${currentPending}/${allowedLimit}). Vui lòng bấm nút [Thu hồi] các lời mời cũ để nhường chỗ.`
        );
      }

      const toInvite = matchingMembers.slice(0, remainingQuota);
      const omittedCount = matchingMembers.length - toInvite.length;

      const invitationsPayload = toInvite.map(m => ({
        workspace_id: activeWs,
        room_id: roomId,
        receiver_id: m.user_id,
        status: 'pending'
      }));

      const { error: err } = await db.from('invitations').insert(invitationsPayload);
      if (err) throw err;

      loadData();

      if (omittedCount > 0) {
        dialog.info(
          'Đã gửi lời mời',
          `Đã gửi lời mời đến ${toInvite.length} người có chung sở thích. ${omittedCount} người còn lại không thể mời do chạm hạn ngạch pending tối đa (${allowedLimit}).`
        );
      } else {
        dialog.success('Thành công', `Đã gửi lời mời đến ${toInvite.length} người có chung sở thích!`);
      }
    } catch (e) {
      dialog.error('Lỗi mời hàng loạt', e.message);
    }
  };

  const handleInviteRandomActiveGuests = async (roomId, type, count) => {
    try {
      bridge.haptic('light');
      const activeWs = scope.workspaceId;
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const currentPending = getPendingInvitationsCount(roomId);
      const allowedLimit = getOutboundLimit(room);
      const roomInvs = invitations.filter(i => i.room_id === roomId);

      // 1. Initial pool of uninvited members
      let pool = members.filter(m => !roomInvs.some(i => i.receiver_id === m.user_id));

      // 2. Tag filter
      if (type === 'same_tag') {
        pool = pool.filter(m => {
          const tags = allUserTags[m.user_id] || [];
          return tags.includes(room.child_code);
        });
      }

      // 3. Social circle mix filter
      pool = pool.filter(m => {
        const hasInteracted = interactionHistory.some(h => 
          (h.user_id_1 === ctx.userId && h.user_id_2 === m.user_id) ||
          (h.user_id_1 === m.user_id && h.user_id_2 === ctx.userId)
        );

        if (randomMode === 'acquaintances') return hasInteracted;
        if (randomMode === 'strangers') return !hasInteracted;
        return true;
      });

      if (pool.length === 0) {
        let modeName = randomMode === 'acquaintances' ? 'người quen' : 'người lạ';
        if (randomMode === 'mix') modeName = 'thành viên';
        return dialog.info('Không tìm thấy', `Không có ${modeName} nào phù hợp chưa được mời.`);
      }

      const remainingQuota = allowedLimit - currentPending;
      if (remainingQuota <= 0) {
        return dialog.error(
          'Chặn hạn ngạch!',
          `Không thể mời thêm. Đã đạt giới hạn pending (${currentPending}/${allowedLimit}). Vui lòng thu hồi bớt các lời mời cũ để nhường chỗ.`
        );
      }

      // 4. Shuffle and take limit
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const toInvite = shuffled.slice(0, Math.min(shuffled.length, count, remainingQuota));
      const omittedCount = shuffled.length - toInvite.length;

      const invitationsPayload = toInvite.map(m => ({
        workspace_id: activeWs,
        room_id: roomId,
        receiver_id: m.user_id,
        status: 'pending'
      }));

      const { error: err } = await db.from('invitations').insert(invitationsPayload);
      if (err) throw err;

      loadData();

      const labelMode = randomMode === 'mix' ? 'lạ/quen mix' : randomMode === 'strangers' ? 'chỉ người lạ' : 'chỉ người quen';
      if (omittedCount > 0) {
        dialog.info(
          'Đã gửi lời mời',
          `Đã mời ngẫu nhiên ${toInvite.length} đồng nghiệp (${labelMode}). ${omittedCount} người còn lại không thể mời do chạm hạn ngạch pending tối đa (${allowedLimit}).`
        );
      } else {
        dialog.success('Thành công', `Đã mời ngẫu nhiên ${toInvite.length} đồng nghiệp (${labelMode})!`);
      }
    } catch (e) {
      dialog.error('Lỗi mời ngẫu nhiên', e.message);
    }
  };

  const handleRevokeInvitation = async (invId) => {
    try {
      bridge.haptic('light');
      await db.from('invitations').delete().eq('id', invId);
      loadData();
    } catch (e) {
      dialog.error('Lỗi thu hồi', e.message);
    }
  };

  const handleDeleteInvitation = async (invId) => {
    try {
      bridge.haptic('medium');
      const container = document.getElementById(`swipe-container-${invId}`);
      if (container) {
        // 1. Instantly lock height to avoid layout jumps, then animate collapse
        const height = container.offsetHeight;
        container.style.height = `${height}px`;
        container.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        
        // Force browser reflow to apply locked height before animating to 0
        container.offsetHeight;
        
        // 2. Smoothly shrink height, margin, and opacity to 0
        container.style.opacity = '0';
        container.style.height = '0px';
        container.style.marginBottom = '0px';
        container.style.paddingTop = '0px';
        container.style.paddingBottom = '0px';
      }

      // 3. Once collapse animation completes, optimistically remove from state and sync silently in DB
      setTimeout(async () => {
        // Optimistically filter invitation list so the node disappears instantly from the DOM tree
        setInvitations(prev => prev.filter(i => i.id !== invId));

        try {
          // Silent DB deletion in the background (no screen skeleton loaders or blinks!)
          await db.from('invitations').delete().eq('id', invId);
          // Silent background sync
          await loadInvitationsData();
        } catch (dbErr) {
          console.error('Lỗi khi xóa trong DB:', dbErr);
        }
      }, 300);

    } catch (e) {
      console.error('Lỗi khi thực hiện xóa lời mời:', e);
    }
  };

  const handleLoadMockInvitations = async () => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      // 1. Create a mock room first to ensure we have a valid room_id
      const mockRooms = [
        {
          workspace_id: activeWs,
          host_id: members[0]?.user_id || 'mock-host-1',
          child_code: 'badminton',
          location: 'Sân Cầu Lông Bộ Công An',
          scheduled_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          max_participants: 4,
          status: 'open',
          version: 1
        },
        {
          workspace_id: activeWs,
          host_id: members[1]?.user_id || 'mock-host-2',
          child_code: 'coffee',
          location: 'Cà phê Cộng - Triệu Việt Vương',
          scheduled_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          max_participants: 2,
          status: 'filling',
          version: 1
        },
        {
          workspace_id: activeWs,
          host_id: members[2]?.user_id || 'mock-host-3',
          child_code: 'football',
          location: 'Sân bóng đá Đại Học Y',
          scheduled_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // expired (2 hours ago)
          max_participants: 10,
          status: 'expired',
          version: 1
        }
      ];

      // Insert mock rooms
      const { data: dbRooms, error: roomErr } = await db
        .from('rooms')
        .insert(mockRooms.slice(0, Math.min(mockRooms.length, members.length || 3)))
        .select();

      if (roomErr || !dbRooms) throw roomErr || new Error('Không thể tạo phòng mock.');

      // 2. Create mock invitations pointing to these rooms
      const mockInvs = dbRooms.map((room, idx) => ({
        workspace_id: activeWs,
        room_id: room.id,
        receiver_id: ctx.userId,
        status: 'pending',
        created_at: new Date(Date.now() - idx * 3600 * 1000).toISOString() // staggered times
      }));

      const { error: invErr } = await db.from('invitations').insert(mockInvs);
      if (invErr) throw invErr;

      await loadData();
      dialog.success('Đã tải Mock Data!', `Đã tạo ${dbRooms.length} lời mời Connect mẫu từ đồng nghiệp để bạn trải nghiệm tính năng vuốt xóa.`);
    } catch (e) {
      console.error(e);
      dialog.error('Lỗi nạp Mock Data', e.message);
    }
  };

  // Pure 60FPS GPU-accelerated touch handlers for buttery smooth mobile swiping (no React re-renders)
  const handleTouchStart = (e) => {
    // Smoothly close any other swiped cards in the DOM first for premium native feel
    const swipedContainers = document.querySelectorAll('.swipe-delete-container.is-swiped');
    swipedContainers.forEach(container => {
      if (container !== e.currentTarget.parentElement) {
        container.classList.remove('is-swiped');
        const card = container.querySelector('.invitation-card');
        if (card) {
          card.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          card.style.transform = 'translate3d(0px, 0, 0)';
          setTimeout(() => {
            card.style.transform = '';
          }, 300);
          const dbg = container.querySelector('.swipe-delete-bg');
          if (dbg) {
            dbg.style.transition = 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            dbg.style.width = '80px';
          }
        }
      }
    });

    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
    swipeDirection.current = null; // Reset gesture lock on tap
    hasTriggeredSwipeHaptic.current = false;
  };

  const handleTouchMove = (e, invId) => {
    if (!isSwiping.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = swipeStartX.current - currentX;
    const diffY = swipeStartY.current - currentY;

    // 1. Gesture Direction Lock: lock main swipe axis at 8px movement
    if (!swipeDirection.current) {
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      if (absX > 8 || absY > 8) {
        if (absX > absY) {
          swipeDirection.current = 'horizontal';
        } else {
          swipeDirection.current = 'vertical';
          isSwiping.current = false;
          return;
        }
      } else {
        return; // wait for enough movement to lock
      }
    }

    // 2. Cancel and skip if vertical scroll lock is established
    if (swipeDirection.current === 'vertical') {
      isSwiping.current = false;
      return;
    }

    const cardEl = e.currentTarget;
    const containerEl = cardEl.parentElement;
    const deleteBg = containerEl.querySelector('.swipe-delete-bg');
    const isCurrentlySwiped = containerEl.classList.contains('is-swiped');
    
    let translateX = 0;
    if (isCurrentlySwiped) {
      // Swiping right closes the swiped card
      translateX = -80 - diffX;
      if (translateX > 0) translateX = 0;
    } else {
      // Swiping left reveals the delete button
      if (diffX > 0) {
        translateX = -diffX;
      }
    }

    // Direct GPU-accelerated translate3d to bypass React render tree completely (60FPS)
    cardEl.style.transition = 'none';
    cardEl.style.transform = `translate3d(${translateX}px, 0, 0)`;

    // Butter smooth elastic stretching: expand background button width as user swipes
    const currentDisplacement = Math.abs(translateX);
    if (deleteBg) {
      deleteBg.style.transition = 'none';
      deleteBg.style.width = `${Math.max(80, currentDisplacement)}px`;

      // Scale the glassmorphic bubble inside as swipe displacement increases
      const bubble = deleteBg.querySelector('.trash-bubble') || deleteBg.children[0];
      if (bubble) {
        const scaleVal = 1 + Math.min(0.2, (currentDisplacement - 80) / 400);
        bubble.style.transform = `scale(${scaleVal}) translate3d(0,0,0)`;
      }

      // Trigger high-fidelity click haptic at 180px threshold to notify user of full-swipe action
      if (currentDisplacement >= 180) {
        if (!hasTriggeredSwipeHaptic.current) {
          bridge.haptic('medium');
          hasTriggeredSwipeHaptic.current = true;
        }
        deleteBg.style.background = deleteBg.getAttribute('data-is-expired') === 'true'
          ? 'linear-gradient(135deg, #4B5563 0%, #1F2937 100%)' // Extreme Slate Grey
          : 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'; // Extreme Crimson red
      } else {
        hasTriggeredSwipeHaptic.current = false;
        deleteBg.style.background = ''; // revert to default CSS inline style
      }
    }
    
    // Prevent default browser scroll once actively horizontal swiping
    if (swipeDirection.current === 'horizontal' && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e, invId) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    
    const cardEl = e.currentTarget;
    const containerEl = cardEl.parentElement;
    const deleteBg = containerEl.querySelector('.swipe-delete-bg');
    const currentX = e.changedTouches[0].clientX;
    const diffX = swipeStartX.current - currentX;
    
    cardEl.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    if (deleteBg) {
      deleteBg.style.transition = 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease';
      
      const bubble = deleteBg.querySelector('.trash-bubble') || deleteBg.children[0];
      if (bubble) {
        bubble.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        bubble.style.transform = 'scale(1) translate3d(0,0,0)';
      }
    }
    
    const isCurrentlySwiped = containerEl.classList.contains('is-swiped');
    
    // 1. FULL SWIPE TO DELETE threshold (180px) -> Auto delete with off-screen animation
    if (diffX > 180) {
      bridge.haptic('success');
      cardEl.style.transform = 'translate3d(-100%, 0, 0)';
      if (deleteBg) {
        deleteBg.style.width = '100%';
        deleteBg.style.background = deleteBg.getAttribute('data-is-expired') === 'true'
          ? 'linear-gradient(135deg, #4B5563 0%, #1F2937 100%)'
          : 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)';
      }
      setTimeout(() => {
        handleDeleteInvitation(invId);
      }, 300);
      return;
    }

    // 2. Snap points and Tap-to-Close mechanics
    if (isCurrentlySwiped) {
      // Swipe right or simple tap/minimal horizontal drag (diffX < 15): Snap shut!
      if (diffX < 15) {
        containerEl.classList.remove('is-swiped');
        cardEl.style.transform = 'translate3d(0px, 0, 0)';
        if (deleteBg) deleteBg.style.width = '80px';
        setTimeout(() => {
          cardEl.style.transform = '';
        }, 300);
        bridge.haptic('light');
        
        // Prevent click/tap propagation to underlying buttons (Click Hijacking prevention)
        if (Math.abs(diffX) < 5) {
          e.preventDefault();
          e.stopPropagation();
        }
      } else {
        // Remain swiped open
        cardEl.style.transform = 'translate3d(-80px, 0, 0)';
        if (deleteBg) deleteBg.style.width = '80px';
        setTimeout(() => {
          cardEl.style.transform = '';
        }, 300);
      }
    } else {
      if (diffX > 40) {
        // Reveal swipe actions
        containerEl.classList.add('is-swiped');
        cardEl.style.transform = 'translate3d(-80px, 0, 0)';
        if (deleteBg) deleteBg.style.width = '80px';
        setTimeout(() => {
          cardEl.style.transform = '';
        }, 300);
        bridge.haptic('light');
      } else {
        // Return to closed state
        cardEl.style.transform = 'translate3d(0px, 0, 0)';
        if (deleteBg) deleteBg.style.width = '80px';
        setTimeout(() => {
          cardEl.style.transform = '';
        }, 300);
      }
    }
  };

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
                  const id = avatarTooltip.member.user_id;
                  if (invitedGuests.includes(id)) {
                    setInvitedGuests(prev => prev.filter(x => x !== id));
                  } else {
                    if (invitedGuests.length >= createRoomAllowedLimit) {
                      dialog.error('Hạn ngạch đầy!', `Chỉ có thể mời tối đa ${createRoomAllowedLimit} người.`);
                    } else {
                      bridge.haptic('light');
                      setInvitedGuests(prev => [...prev, id]);
                    }
                  }
                  setAvatarTooltip(null);
                }}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 12, border: 'none',
                  background: invitedGuests.includes(avatarTooltip.member.user_id)
                    ? 'rgba(230, 57, 70, 0.1)' : 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)',
                  color: invitedGuests.includes(avatarTooltip.member.user_id) ? 'var(--brand)' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {invitedGuests.includes(avatarTooltip.member.user_id) ? '✕ Bỏ chọn' : '✓ Mời người này'}
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
          className={`nav-tab-btn ${activeTab === 'rooms' ? 'nav-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <span>🏆</span> Phòng Hẹn
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'inbox' ? 'nav-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          <span style={{ position: 'relative', display: 'inline-block' }}>
            📥
            {invitations.filter(i => i.receiver_id === ctx.userId && i.status === 'pending').length > 0 && (
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
                        {paginatedCandidates.map(({ member, profile, tags, exactMatches, priority, isFallback, fallbackParentLabel, matchScore, hasInteracted }) => (
                          <section 
                            key={member.user_id} 
                            className="buddy-card-compact"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              bridge.haptic('light');
                              let targetTag = null;
                              if (exactMatches.length > 0) {
                                targetTag = exactMatches[0];
                              } else {
                                const memberTags = tags.map(code => FLAT_TAGS.find(t => t.code === code)).filter(Boolean);
                                const myParentCodes = (myTags || []).map(code => FLAT_TAGS.find(t => t.code === code)?.parent_code).filter(Boolean);
                                targetTag = memberTags.find(tagObj => myParentCodes.includes(tagObj.parent_code)) || memberTags[0] || FLAT_TAGS[0];
                              }
                              if (targetTag) {
                                setQuickInviteData({ member, tagCode: targetTag.code, tagName: targetTag.name });
                                setQuickInviteTime(quickTimeOptions[0]?.value || '');
                              }
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
                                        setQuickInviteData({ member, tagCode: tag.code, tagName: tag.name });
                                        setQuickInviteTime(quickTimeOptions[0]?.value || '');
                                      }}
                                      title={`Rủ nhanh ${member.full_name} cùng chơi ${tag.name}`}
                                    >
                                      ❤️ {tag.name}
                                    </span>
                                  ))}
                                </div>
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

          {/* TAB 2: ROOMS - PHÒNG HẸN KẾT NỐI */}
          {activeTab === 'rooms' && (
            <div className="tab-pane animated-fade-in">
              <div className="compact-tab-header">
                <div className="radar-pulse-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, width: 24, height: 24 }}>
                  🏆
                </div>
                <div className="radar-text-wrapper" style={{ flex: 1 }}>
                  <h4 className="compact-radar-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Phòng hẹn Connect</h4>
                  <p className="compact-radar-sub" style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Tự lập hoặc tham gia phòng đi chơi, thể thao cùng đồng nghiệp</p>
                </div>
                <div className="compact-radar-action">
                  <button
                    className={`mushy-btn ${showCreateRoom ? 'mushy-btn--ghost' : 'mushy-btn--primary'}`}
                    style={{ 
                      padding: '6px 12px', 
                      minHeight: 30,
                      fontSize: '11.5px',
                      fontWeight: 700,
                      borderRadius: 999,
                      color: showCreateRoom ? 'var(--brand)' : '#fff',
                      borderColor: showCreateRoom ? 'var(--brand)' : undefined,
                      background: showCreateRoom ? 'transparent' : 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)',
                      boxShadow: showCreateRoom ? 'none' : '0 2px 8px rgba(230, 57, 70, 0.2)'
                    }}
                    onClick={() => {
                      bridge.haptic('light');
                      setShowCreateRoom(!showCreateRoom);
                    }}
                  >
                    {showCreateRoom ? 'Hủy' : '+ Lập Kèo'}
                  </button>
                </div>
              </div>

              {/* Create Room Form Card */}
              {showCreateRoom && (
                <section className="mushy-card premium-glow-card form-slide-down" style={{ marginBottom: 16, padding: '16px 20px' }}>
                  <form onSubmit={handleCreateRoomSubmit}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label className="mushy-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '6px', marginBottom: '5px', minHeight: '28px' }}>Danh mục chính</label>
                        <Select
                          value={selectedParentCode}
                          onChange={handleParentChange}
                          options={TAXONOMY.map(p => ({ value: p.parent_code, label: p.parent_name }))}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="mushy-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '6px', marginBottom: '5px', minHeight: '28px' }}>Bộ môn / Sở thích cụ thể</label>
                        <Select
                          value={newRoom.child_code}
                          onChange={(val) => setNewRoom(prev => ({ ...prev, child_code: val }))}
                          options={availableChildOptions}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label className="mushy-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '6px', marginBottom: '5px', minHeight: '28px' }}>Vị trí / Địa điểm hẹn</label>
                      <input
                        type="text"
                        className="mushy-input"
                        placeholder="Vd: Sân cầu lông Thượng Đình, 345 Nguyễn Trãi..."
                        value={newRoom.location}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, location: e.target.value }))}
                        style={{ borderRadius: '14px', border: '1.5px solid var(--hairline)', padding: '10px 14px', fontSize: '13.5px', minHeight: '44px', width: '100%', outline: 'none' }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label className="mushy-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '6px', marginBottom: '5px', minHeight: '28px' }}>Thời gian hẹn tổ chức</label>
                      <input
                        type="datetime-local"
                        className="mushy-input"
                        style={{ borderRadius: '14px', border: '1.5px solid var(--hairline)', padding: '10px 14px', fontSize: '13.5px', minHeight: '44px', width: '100%', outline: 'none' }}
                        value={newRoom.scheduled_at}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, scheduled_at: e.target.value }))}
                        required
                      />
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 2px', marginTop: 6, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <button type="button" onClick={() => setQuickTime('today_19')} style={{ flexShrink: 0, fontSize: 11, padding: '6px 12px', background: 'rgba(15,15,18,0.03)', border: '1px solid var(--hairline)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Tối nay 19h</button>
                        <button type="button" onClick={() => setQuickTime('today_20')} style={{ flexShrink: 0, fontSize: 11, padding: '6px 12px', background: 'rgba(15,15,18,0.03)', border: '1px solid var(--hairline)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Tối nay 20h</button>
                        <button type="button" onClick={() => setQuickTime('tomorrow_8')} style={{ flexShrink: 0, fontSize: 11, padding: '6px 12px', background: 'rgba(15,15,18,0.03)', border: '1px solid var(--hairline)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Sáng mai 8h</button>
                        <button type="button" onClick={() => setQuickTime('tomorrow_17')} style={{ flexShrink: 0, fontSize: 11, padding: '6px 12px', background: 'rgba(15,15,18,0.03)', border: '1px solid var(--hairline)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Chiều mai 17h</button>
                        <button type="button" onClick={() => setQuickTime('weekend_9')} style={{ flexShrink: 0, fontSize: 11, padding: '6px 12px', background: 'rgba(15,15,18,0.03)', border: '1px solid var(--hairline)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }}>T7/CN 9h sáng</button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label className="mushy-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '6px', marginBottom: '5px', minHeight: '28px' }}>Sĩ số tối đa</label>
                      <input
                        type="number"
                        className="mushy-input"
                        min="2"
                        style={{ borderRadius: '14px', border: '1.5px solid var(--hairline)', padding: '10px 14px', fontSize: '13.5px', minHeight: '44px', width: '100%', outline: 'none' }}
                        value={newRoom.max_participants}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewRoom(prev => ({ ...prev, max_participants: val === '' ? '' : (parseInt(val) || '') }));
                        }}
                        required
                      />
                    </div>

                    {/* Quota multiplier stepper */}
                    <div style={{ marginBottom: 12 }}>
                      <label className="mushy-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '6px', marginBottom: '5px', minHeight: '28px' }}>Hạn ngạch lời mời chờ tối đa</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(15,15,18,0.02)', border: '1.5px solid var(--hairline)', borderRadius: 14, minHeight: 44 }}>
                        <button type="button" onClick={() => setQuotaMultiplier(v => Math.max(1, v - 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--hairline)', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>{createRoomAllowedLimit}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>lời mời</span>
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{parseInt(newRoom.max_participants)||2} người × {quotaMultiplier} lần/slot = {createRoomAllowedLimit}</div>
                        </div>
                        <button type="button" onClick={() => setQuotaMultiplier(v => Math.min(10, v + 1))} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--hairline)', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label className="mushy-label" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6, marginLeft: '6px', marginBottom: 10 }}>
                        <span style={{ color: 'var(--brand)' }}>⚠️</span> Gửi lời mời đầu tiên (Chọn ít nhất 1 người)
                      </label>
                      {members.length > 0 && (
                        <button
                          type="button"
                          className="mushy-btn mushy-btn--ghost"
                          onClick={() => handleSelectRandomGuests('any', Math.max(0, createRoomAllowedLimit - invitedGuests.length))}
                          style={{ width: '100%', minHeight: 36, fontSize: 12, marginBottom: 12, borderRadius: 10, color: 'var(--muted)', borderColor: 'var(--hairline)' }}
                        >
                          🎲 Ghép ngẫu nhiên lấp đầy hạn ngạch (tối đa {Math.max(0, createRoomAllowedLimit - invitedGuests.length)} người)
                        </button>
                      )}

                      {/* ── Suggestion rows ── */}
                      {(() => {
                        // Build acquaintances list from interaction history, filtered by selected tag
                        const acquaintanceMembers = members.filter(m => {
                          if (m.user_id === ctx.userId) return false;
                          return interactionHistory.some(h =>
                            (h.user_id_1 === ctx.userId && h.user_id_2 === m.user_id) ||
                            (h.user_id_1 === m.user_id && h.user_id_2 === ctx.userId)
                          );
                        }).slice(0, 8);

                        const renderChipRow = (list, label, emoji) => {
                          if (list.length === 0) return null;
                          return (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingLeft: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                                  {emoji} {label} ({list.length})
                                </span>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 11, fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                                  onClick={() => {
                                    bridge.haptic('light');
                                    const toAdd = list.map(m => m.user_id).filter(id => !invitedGuests.includes(id));
                                    const available = createRoomAllowedLimit - invitedGuests.length;
                                    if (available <= 0) { dialog.error('Hạn ngạch đầy!', `Chỉ có thể mời tối đa ${createRoomAllowedLimit} người.`); return; }
                                    setInvitedGuests(prev => [...prev, ...toAdd.slice(0, available)]);
                                  }}
                                >
                                  ✨ Chọn tất cả
                                </button>
                              </div>
                              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 2px 8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {list.map(m => {
                                  const isSelected = invitedGuests.includes(m.user_id);
                                  const profile = allProfiles[m.user_id];
                                  let _pt = null;
                                  const startPress = () => { _pt = setTimeout(() => { bridge.haptic('tooltip_vibe'); setAvatarTooltip({ member: m, profile }); _pt = null; }, 500); };
                                  const cancelPress = () => { if (_pt) { clearTimeout(_pt); _pt = null; } };
                                  return (
                                    <div
                                      key={m.user_id}
                                      onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
                                      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchCancel={cancelPress}
                                      onClick={() => {
                                        cancelPress();
                                        if (avatarTooltip) return;
                                        bridge.haptic('light');
                                        if (isSelected) {
                                          setInvitedGuests(prev => prev.filter(id => id !== m.user_id));
                                        } else {
                                          if (invitedGuests.length >= createRoomAllowedLimit) {
                                            dialog.error('Hạn ngạch đầy!', `Chỉ có thể mời tối đa ${createRoomAllowedLimit} người.`);
                                            return;
                                          }
                                          setInvitedGuests(prev => [...prev, m.user_id]);
                                        }
                                      }}
                                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 64, cursor: 'pointer', position: 'relative', userSelect: 'none' }}
                                    >
                                      <div style={{
                                        width: 46, height: 46, borderRadius: '50%',
                                        background: isSelected ? 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)' : getAvatarGradient(m.full_name?.charAt(0)),
                                        border: isSelected ? '2.5px solid var(--brand)' : '1.5px solid rgba(255,255,255,0.4)',
                                        boxShadow: isSelected ? '0 0 10px rgba(230,57,70,0.35)' : '0 3px 8px rgba(15,15,18,0.06)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 15, fontWeight: 700, color: '#fff',
                                        transition: 'all 180ms ease', position: 'relative'
                                      }}>
                                        <span>{m.full_name?.charAt(0)}</span>
                                        {isSelected && (
                                          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#4CAF50', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 'bold', border: '1.5px solid #fff' }}>✓</div>
                                        )}
                                      </div>
                                      <span style={{ fontSize: 10, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--brand)' : 'var(--ink)', textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.full_name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <>
                            {renderChipRow(acquaintanceMembers, 'Đã từng kết nối', '🤝')}
                            {renderChipRow(matchingTagMembers, 'Trùng sở thích', '🔥')}
                          </>
                        );
                      })()}


                      {/* Selected Guests Summary Chips */}
                      {invitedGuests.length > 0 && (
                        <div style={{ marginBottom: 14, background: 'rgba(230, 57, 70, 0.03)', padding: '10px 12px', borderRadius: '16px', border: '1px solid rgba(230, 57, 70, 0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 2 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand)' }}>
                              👥 Đồng nghiệp đã chọn ({invitedGuests.length}):
                            </span>
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--muted)',
                                fontSize: 11,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              onClick={() => {
                                bridge.haptic('light');
                                setInvitedGuests([]);
                              }}
                            >
                              Xóa tất cả
                            </button>
                          </div>
                          
                          <div 
                            style={{ 
                              display: 'flex', 
                              gap: 12, 
                              overflowX: 'auto', 
                              padding: '4px 2px 6px', 
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            }}
                          >
                            {invitedGuests.map(guestId => {
                              const m = members.find(member => member.user_id === guestId) || { user_id: guestId, full_name: 'Đồng nghiệp' };
                              return (
                                <div
                                  key={m.user_id}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 5,
                                    minWidth: 70,
                                    position: 'relative',
                                    userSelect: 'none'
                                  }}
                                >
                                  {/* Avatar circle */}
                                  <div
                                    style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: '50%',
                                      background: getAvatarGradient(m.full_name?.charAt(0)),
                                      border: '1.5px solid rgba(255, 255, 255, 0.8)',
                                      boxShadow: '0 4px 8px rgba(15, 15, 18, 0.05)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: '#fff',
                                      position: 'relative'
                                    }}
                                  >
                                    <span>{m.full_name?.charAt(0)}</span>
                                    
                                    {/* Remove badge */}
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        bridge.haptic('light');
                                        setInvitedGuests(prev => prev.filter(id => id !== m.user_id));
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: -3,
                                        right: -3,
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        background: 'var(--brand)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 9,
                                        fontWeight: 'bold',
                                        border: '1.5px solid #fff',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      ✕
                                    </div>
                                  </div>
                                  
                                  {/* Name */}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color: 'var(--ink)',
                                      textAlign: 'center',
                                      maxWidth: 72,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {m.full_name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Search Bar for manual colleague selector */}
                      {members.length > 0 && (
                        <div className="search-box-container" style={{ marginBottom: 10 }}>
                          <span className="search-icon">🔍</span>
                          <input
                            type="text"
                            placeholder="Gõ tìm kiếm tên đồng nghiệp khác..."
                            className="mushy-input search-input"
                            style={{ minHeight: 38, paddingLeft: 38, fontSize: '13px', borderRadius: 10 }}
                            value={guestSearchQuery}
                            onChange={(e) => setGuestSearchQuery(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Search Results list - Hidden by default unless query is not empty */}
                      {guestSearchQuery.trim() !== '' ? (
                        <div className="guest-selector-scroll" style={{ background: 'var(--surface-muted)', border: '1.5px solid var(--hairline)', maxHeight: 200, overflowY: 'auto', borderRadius: 12 }}>
                          {sortedMembersForCreate.matching.length === 0 && sortedMembersForCreate.others.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--muted)', fontSize: 12, fontStyle: 'italic' }}>
                              Không tìm thấy kết quả phù hợp.
                            </div>
                          ) : (
                            <>
                              {sortedMembersForCreate.matching.length > 0 && (
                                <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 'bold', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  🔥 Trùng sở thích ({sortedMembersForCreate.matching.length})
                                </div>
                              )}
                              {sortedMembersForCreate.matching.map(item => {
                                const m = item.member;
                                const isSelected = invitedGuests.includes(m.user_id);
                                return (
                                  <div
                                    key={m.user_id}
                                    className={`guest-select-item ${isSelected ? 'guest-select-item--selected' : ''}`}
                                    style={{ borderLeft: '3px solid var(--brand)', marginLeft: 4, marginRight: 4 }}
                                    onClick={() => {
                                      bridge.haptic('light');
                                      if (isSelected) {
                                        setInvitedGuests(prev => prev.filter(id => id !== m.user_id));
                                      } else {
                                        if (invitedGuests.length >= createRoomAllowedLimit) {
                                          dialog.error('Hạn ngạch đầy!', `Chỉ có thể mời tối đa ${createRoomAllowedLimit} người cho phòng này.`);
                                          return;
                                        }
                                        setInvitedGuests(prev => [...prev, m.user_id]);
                                      }
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                                        {m.full_name}
                                        {item.hasInteracted ? (
                                          <span style={{ fontSize: 9.5, padding: '1px 6px', background: 'rgba(230, 57, 70, 0.08)', color: 'var(--brand)', borderRadius: 4, marginLeft: 6, fontWeight: 'bold' }}>👥 Quen</span>
                                        ) : (
                                          <span style={{ fontSize: 9.5, padding: '1px 6px', background: 'rgba(6, 182, 212, 0.08)', color: '#06B6D4', borderRadius: 4, marginLeft: 6, fontWeight: 'bold' }}>🕵️ Lạ</span>
                                        )}
                                      </span>
                                      <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>🔥 Trùng tag: {getTagName(newRoom.child_code)}</span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      style={{ accentColor: 'var(--brand)' }}
                                    />
                                  </div>
                                );
                              })}

                              {sortedMembersForCreate.matching.length > 0 && sortedMembersForCreate.others.length > 0 && (
                                <div style={{ margin: '8px 12px 4px', borderTop: '1px solid var(--hairline)' }} />
                              )}

                              {sortedMembersForCreate.others.length > 0 && (
                                <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 'bold', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  👥 Thành viên khác ({sortedMembersForCreate.others.length})
                                </div>
                              )}
                              {sortedMembersForCreate.others.map(item => {
                                const m = item.member;
                                const isSelected = invitedGuests.includes(m.user_id);
                                return (
                                  <div
                                    key={m.user_id}
                                    className={`guest-select-item ${isSelected ? 'guest-select-item--selected' : ''}`}
                                    style={{ marginLeft: 4, marginRight: 4 }}
                                    onClick={() => {
                                      bridge.haptic('light');
                                      if (isSelected) {
                                        setInvitedGuests(prev => prev.filter(id => id !== m.user_id));
                                      } else {
                                        if (invitedGuests.length >= createRoomAllowedLimit) {
                                          dialog.error('Hạn ngạch đầy!', `Chỉ có thể mời tối đa ${createRoomAllowedLimit} người cho phòng này.`);
                                          return;
                                        }
                                        setInvitedGuests(prev => [...prev, m.user_id]);
                                      }
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                                        {m.full_name}
                                        {item.hasInteracted ? (
                                          <span style={{ fontSize: 9.5, padding: '1px 6px', background: 'rgba(230, 57, 70, 0.08)', color: 'var(--brand)', borderRadius: 4, marginLeft: 6, fontWeight: 'bold' }}>👥 Quen</span>
                                        ) : (
                                          <span style={{ fontSize: 9.5, padding: '1px 6px', background: 'rgba(6, 182, 212, 0.08)', color: '#06B6D4', borderRadius: 4, marginLeft: 6, fontWeight: 'bold' }}>🕵️ Lạ</span>
                                        )}
                                      </span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      style={{ accentColor: 'var(--brand)' }}
                                    />
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '12px 14px', 
                          color: 'var(--muted)', 
                          fontSize: '11.5px',
                          background: 'rgba(15,15,18,0.02)',
                          borderRadius: 12,
                          border: '1px dashed var(--hairline)',
                          marginTop: 4
                        }}>
                          💡 Gõ tên vào ô tìm kiếm trên để tìm & mời thêm đồng nghiệp khác ngoài sở thích.
                        </div>
                      )}

                      {/* Thống kê hạn ngạch */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
                        <span>Đã chọn: <strong>{invitedGuests.length}</strong> người</span>
                        <span className={invitedGuests.length > createRoomAllowedLimit ? 'quota-indicator--warning' : ''}>
                          Hạn ngạch pending tối đa: <strong>{createRoomAllowedLimit}</strong> người
                        </span>
                      </div>
                      {invitedGuests.length > createRoomAllowedLimit && (
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
                          ⚠️ Số người được mời vượt hạn ngạch tối đa. Vui lòng bỏ chọn bớt hoặc nâng sĩ số phòng!
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="mushy-btn mushy-btn--primary mushy-btn--block"
                      disabled={submittingRoom || invitedGuests.length === 0 || invitedGuests.length > createRoomAllowedLimit}
                    >
                      {submittingRoom ? <span className="mushy-spinner" /> : 'Xác nhận tạo phòng & Gửi lời mời 🚀'}
                    </button>
                  </form>
                </section>
              )}

              {/* Rooms list */}
              {(() => {
                const userRooms = rooms.filter(room => {
                  const isHost = room.host_id === ctx.userId;
                  const hasJoined = invitations.some(i => i.room_id === room.id && i.receiver_id === ctx.userId && i.status === 'accepted');
                  return isHost || hasJoined;
                });

                if (userRooms.length === 0) {
                  return (
                    <div className="mushy-empty-state animated-fade-in">
                      <div className="mushy-empty-icon">🏆✨</div>
                      <h4 className="mushy-empty-title">Bạn chưa tham gia phòng hẹn nào</h4>
                      <p className="mushy-empty-desc">Nhấn "+ Lập Kèo" để tự tạo phòng mới hoặc nhận lời mời từ đồng nghiệp để cùng tham gia nhé!</p>
                    </div>
                  );
                }

                return userRooms.map(room => {
                  const isHost = room.host_id === ctx.userId;
                  const roomInvs = invitations.filter(i => i.room_id === room.id);
                  const acceptedCount = roomInvs.filter(i => i.status === 'accepted').length;
                  const totalJoined = acceptedCount + 1; // including Host
                  const isFull = totalJoined >= room.max_participants;
                  
                  const hostMemberObj = members.find(m => m.user_id === room.host_id) || (isHost ? { full_name: 'Bạn' } : { full_name: 'Đồng nghiệp' });

                  // 6.2 Rate limit parameters
                  const pendingCount = roomInvs.filter(i => i.status === 'pending').length;
                  const currentLimit = getOutboundLimit(room);
                  const isQuotaExceeded = pendingCount >= currentLimit;

                  return (
                    <div 
                      key={room.id} 
                      id={`room-card-${room.id}`}
                      className={`mushy-card activity-card ${highlightedRoomId === room.id ? 'room-card--highlighted' : ''}`} 
                      style={{ 
                        marginBottom: 14,
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        ...(highlightedRoomId === room.id ? {
                          borderColor: 'var(--brand)',
                          boxShadow: '0 0 0 2.5px var(--brand), 0 10px 32px rgba(230, 57, 70, 0.22)',
                          transform: 'scale(1.03) translate3d(0,0,0)',
                          background: 'rgba(230, 57, 70, 0.02)'
                        } : {})
                      }}
                    >
                      <div className={`activity-type-banner act-badge-sports`}>
                        {FLAT_TAGS.find(t => t.code === room.child_code)?.name?.charAt(0) || '🏸'}
                      </div>
                      <h4 className="activity-title" style={{ fontSize: 16 }}>
                        {getTagName(room.child_code)} · {room.location}
                      </h4>
                      <p className="activity-desc" style={{ fontSize: 12, margin: '4px 0 8px' }}>
                        Host bởi: <strong>{hostMemberObj.full_name}</strong>
                      </p>

                      <div className="activity-meta-row">
                        <div className="activity-meta-item">
                          <span>⏰ Hẹn vào:</span> <strong>{formatTime(room.scheduled_at)}</strong>
                        </div>
                      </div>

                      {/* Display Room state (PRD Section 6.1) */}
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                        {room.status === 'open' && <span className="mushy-status --warn" style={{ fontSize: 11, padding: '2px 8px' }}><span className="mushy-status-dot" />Mới lập (open)</span>}
                        {room.status === 'filling' && <span className="mushy-status --warn" style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(6,182,212,0.1)', color: '#06B6D4' }}><span className="mushy-status-dot" style={{ background: '#06B6D4' }} />Đang gom slot ({totalJoined}/{room.max_participants})</span>}
                        {room.status === 'matched' && <span className="mushy-status --ok" style={{ fontSize: 11, padding: '2px 8px' }}><span className="mushy-status-dot" />Đã ghép đủ (matched)</span>}
                        {room.status === 'cancelled' && <span className="mushy-status --err" style={{ fontSize: 11, padding: '2px 8px' }}><span className="mushy-status-dot" />Đã hủy</span>}
                        {room.status === 'expired' && <span className="mushy-status --err" style={{ fontSize: 11, padding: '2px 8px', background: '#E5E7EB', color: '#9CA3AF' }}><span className="mushy-status-dot" style={{ background: '#9CA3AF' }} />Hết hạn</span>}
                      </div>

                      {room.status === 'cancelled' && room.cancel_reason && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)', fontStyle: 'italic' }}>
                          Lý do hủy: "{room.cancel_reason}"
                        </div>
                      )}

                      {/* Members Avatars Joined */}
                      <div className="participants-container">
                        <div className="participants-avatars">
                          <div className="participant-avatar-icon" title="Host">
                            <span>👑</span>
                          </div>
                          {roomInvs.filter(i => i.status === 'accepted').map(inv => {
                            const guest = members.find(m => m.user_id === inv.receiver_id) || (inv.receiver_id === ctx.userId ? { full_name: 'Bạn' } : { full_name: 'Đồng nghiệp' });
                            return (
                              <div key={inv.id} className="participant-avatar-icon" title={guest.full_name}>
                                <span>{guest.full_name?.charAt(0)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <span className="participants-status-text">
                          Sĩ số: {totalJoined} / {room.max_participants}
                        </span>
</div>

                      {/* 7.1 Distributed Fault-Tolerance Group Chat Status */}
                      {(room.status === 'matched' || isFull) && (
                        <div style={{ marginTop: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '8px 12px' }}>
                          {room.chat_group_id ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>💬 Nhóm chat Super App đã sẵn sàng!</span>
                              <button
                                className="mushy-btn"
                                style={{ minHeight: 30, fontSize: 11, padding: '4px 10px', background: '#10B981', color: '#fff' }}
                                onClick={() => {
                                  bridge.haptic('light');
                                  setActiveChatRoom(room);
                                  if (isInShell()) {
                                    callNative('OPEN_CHAT_GROUP', { chatGroupId: room.chat_group_id });
                                  }
                                }}
                              >
                                Vào Chat
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>
                                {reconnectingRoomId === room.id ? '⏳ Đang thiết lập kết nối lại...' : '⏳ Đang khởi tạo nhóm kết nối...'}
                              </span>
                              <button
                                className="mushy-btn mushy-btn--ghost"
                                style={{ minHeight: 30, fontSize: 11, padding: '4px 10px', color: '#D97706', borderColor: '#F59E0B', opacity: reconnectingRoomId === room.id ? 0.6 : 1 }}
                                disabled={reconnectingRoomId === room.id}
                                onClick={() => handleReconnectChat(room)}
                              >
                                {reconnectingRoomId === room.id ? '⏳ Kết nối lại...' : 'Kết nối lại nhóm chat'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Host Actions: Invite more or Cancel room */}
                      {isHost && (room.status === 'open' || room.status === 'filling' || room.status === 'matched') && (
                        <div style={{ marginTop: 14, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                          <h5 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700 }}>Bảng điều khiển của Host:</h5>

                          {/* Rate limiting indicator */}
                          <div className="quota-indicator">
                            Hạn ngạch lời mời pending: <strong>{pendingCount}/{currentLimit}</strong>
                          </div>

                          {/* Invite more candidates drop grid */}
                          {!isFull && room.status !== 'matched' && (() => {
                            const matching = [];
                            const others = [];

                            members.filter(m => !roomInvs.some(i => i.receiver_id === m.user_id)).forEach(m => {
                              const tags = allUserTags[m.user_id] || [];
                              if (tags.includes(room.child_code)) {
                                matching.push({ member: m, isMatch: true });
                              } else {
                                others.push({ member: m, isMatch: false });
                              }
                            });

                            const allCandidates = [...matching, ...others];
                            const q = inviteSearchQuery.trim().toLowerCase();
                            const filteredCandidates = allCandidates.filter(c => {
                              const dept = allProfiles[c.member.user_id]?.department || '';
                              return !q || c.member.full_name.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
                            });

                            // Smart limit displayed list to prevent overwhelm
                            const displayedCandidates = [];
                            if (q) {
                              displayedCandidates.push(...filteredCandidates.slice(0, 30));
                            } else {
                              displayedCandidates.push(...matching);
                              displayedCandidates.push(...others.slice(0, 10));
                            }

                            return (
                              <div style={{ marginTop: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                                  <label style={{ fontSize: 11.5, color: 'var(--muted)', display: 'block', margin: 0, fontWeight: 600 }}>Mời thêm ứng viên mới:</label>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {matching.length > 0 && (
                                      <button
                                        type="button"
                                        className="mushy-btn btn-glow-brand"
                                        disabled={isQuotaExceeded}
                                        onClick={() => handleInviteMatchingGuests(room.id)}
                                        style={{ minHeight: 26, fontSize: 10, padding: '2px 8px' }}
                                      >
                                        🔥 Mời tất cả trùng tag ({matching.length})
                                      </button>
                                    )}
                                    {allCandidates.length > 0 && (
                                      <button
                                        type="button"
                                        className="mushy-btn"
                                        disabled={isQuotaExceeded}
                                        onClick={() => {
                                          const remainingQuota = currentLimit - pendingCount;
                                          handleInviteRandomActiveGuests(room.id, 'any', Math.min(3, remainingQuota));
                                        }}
                                        style={{
                                          minHeight: 26,
                                          fontSize: 10,
                                          padding: '2px 8px',
                                          background: 'rgba(6, 182, 212, 0.08)',
                                          borderColor: 'rgba(6, 182, 212, 0.3)',
                                          color: '#06B6D4',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        🎲 Mời ngẫu nhiên ({randomMode === 'mix' ? 'mix' : randomMode === 'strangers' ? 'lạ' : 'quen'})
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Small search input for invitation panel */}
                                <div style={{ position: 'relative', marginBottom: 8 }}>
                                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>🔍</span>
                                  <input
                                    type="text"
                                    className="mushy-input"
                                    placeholder="Tìm nhanh tên đồng nghiệp muốn mời..."
                                    value={inviteSearchQuery}
                                    onChange={(e) => setInviteSearchQuery(e.target.value)}
                                    style={{ paddingLeft: 26, height: 28, fontSize: 11.5, borderRadius: 8, margin: 0 }}
                                  />
                                  {inviteSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => setInviteSearchQuery('')}
                                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: 0 }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>

                                {/* Scrollable box for invite candidate list (Vertical rows) */}
                                <div 
                                  className="guest-selector-scroll" 
                                  style={{ 
                                    maxHeight: 220, 
                                    overflowY: 'auto',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: 6, 
                                    background: 'rgba(15, 15, 18, 0.01)',
                                    padding: '8px',
                                    border: '1px solid var(--hairline)',
                                    borderRadius: '12px'
                                  }}
                                >
                                  {displayedCandidates.length === 0 ? (
                                    <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--muted)', padding: '4px', textAlign: 'center' }}>Không còn thành viên khả dụng hoặc khớp tìm kiếm.</span>
                                  ) : (
                                    <>
                                      {displayedCandidates.map(({ member: m, isMatch }) => {
                                        const profile = allProfiles[m.user_id] || {};
                                        return (
                                          <div
                                            key={m.user_id}
                                            style={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              padding: '6px 10px',
                                              background: isMatch ? 'rgba(230, 57, 70, 0.04)' : '#fff',
                                              border: isMatch ? '1.5px solid rgba(230, 57, 70, 0.2)' : '1px solid var(--hairline)',
                                              borderRadius: '10px',
                                              transition: 'all 150ms ease'
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                              {/* Tiny Initials Avatar */}
                                              <div style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: isMatch ? 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)' : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                                                color: isMatch ? '#fff' : '#64748B',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 11,
                                                fontWeight: 'bold',
                                                flexShrink: 0
                                              }}>
                                                {m.full_name?.charAt(0)}
                                              </div>
                                              <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.full_name}</span>
                                                  {isMatch && (
                                                    <span style={{
                                                      fontSize: 8.5,
                                                      padding: '1px 4px',
                                                      background: 'var(--brand-soft)',
                                                      color: 'var(--brand)',
                                                      borderRadius: 4,
                                                      fontWeight: 'bold',
                                                      flexShrink: 0
                                                    }}>
                                                      🔥 Trùng tag
                                                    </span>
                                                  )}
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                  {profile.department || 'Đồng nghiệp'}
                                                </div>
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              className="mushy-btn"
                                              disabled={isQuotaExceeded}
                                              onClick={() => handleInviteAdditionalGuest(room.id, m.user_id)}
                                              style={{
                                                minHeight: 26,
                                                fontSize: 10.5,
                                                padding: '2px 10px',
                                                background: isMatch ? 'var(--brand)' : 'transparent',
                                                borderColor: 'var(--brand)',
                                                color: isMatch ? '#fff' : 'var(--brand)',
                                                borderRadius: 6,
                                                fontWeight: 600,
                                                flexShrink: 0,
                                                margin: 0
                                              }}
                                            >
                                              Mời
                                            </button>
                                          </div>
                                        );
                                      })}
                                      
                                      {!q && allCandidates.length > displayedCandidates.length && (
                                        <div style={{ 
                                          fontSize: 10, 
                                          color: 'var(--muted)', 
                                          textAlign: 'center', 
                                          padding: '4px 0', 
                                          borderTop: '1px dashed var(--hairline)',
                                          marginTop: 4
                                        }}>
                                          💡 Gợi ý {displayedCandidates.length}/{allCandidates.length} đồng nghiệp. Nhập ô tìm kiếm để lọc thêm...
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                {isQuotaExceeded && (
                                  <p style={{ fontSize: 10, color: 'var(--danger)', margin: '4px 0 0' }}>
                                    ⚠️ Đã đạt giới hạn pending ({pendingCount}). Vui lòng thu hồi bớt các lời mời cũ bên dưới để có thể mời tiếp.
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {/* Display pending list with Revoke option */}
                          {roomInvs.filter(i => i.status === 'pending').length > 0 && (
                            <div style={{ marginTop: 10 }}>
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Lời mời đang chờ:</span>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                {roomInvs.filter(i => i.status === 'pending').map(inv => {
                                  const invitedGuest = members.find(m => m.user_id === inv.receiver_id) || { full_name: 'Ứng viên' };
                                  return (
                                    <span key={inv.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(15,15,18,0.03)', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                                      {invitedGuest.full_name}
                                      <button
                                        style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                                        onClick={() => handleRevokeInvitation(inv.id)}
                                      >
                                        [Thu hồi]
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Withdraw cancellation button */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                            <button
                              className="mushy-btn mushy-btn--ghost"
                              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', minHeight: 36, fontSize: 12, padding: '4px 12px' }}
                              onClick={() => {
                                setCancelReason('Bận việc đột xuất');
                                setShowCancelModal(room);
                              }}
                            >
                              🚨 Hủy phòng hẹn văn minh
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              })()}
            </div>
          )}

          {/* TAB 3: INBOX - HỘP THƯ LỜI MỜI NHẬN ĐƯỢC */}
          {activeTab === 'inbox' && (
            <div className="tab-pane animated-fade-in">
              <div className="compact-tab-header">
                <div className="radar-pulse-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, width: 24, height: 24 }}>
                  📥
                </div>
                <div className="radar-text-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="compact-radar-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Hộp thư lời mời Connect</h4>
                    <p className="compact-radar-sub" style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>Lời mời nhận được từ đồng nghiệp</p>
                  </div>
                  <button
                    onClick={handleLoadMockInvitations}
                    style={{
                      background: 'rgba(230, 57, 70, 0.08)',
                      color: 'var(--brand)',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(230, 57, 70, 0.06)'
                    }}
                  >
                    ⚡ Mock Data
                  </button>
                </div>
              </div>

              {invitations.filter(i => i.receiver_id === ctx.userId).length === 0 ? (
                <div className="mushy-empty-state animated-fade-in">
                  <div className="mushy-empty-icon">📥</div>
                  <h4 className="mushy-empty-title">Hộp thư lời mời trống</h4>
                  <p className="mushy-empty-desc">Hiện chưa có lời mời Connect nào gửi tới bạn. Hãy thử đổi sở thích hoặc chủ động lập kèo trước nhé!</p>
                  <button
                    className="mushy-btn mushy-btn--ghost"
                    style={{ 
                      marginTop: 16, 
                      minHeight: 34, 
                      height: 34, 
                      fontSize: 12, 
                      padding: '0 16px',
                      color: 'var(--brand)',
                      borderColor: 'var(--brand)',
                      background: 'var(--brand-soft)',
                      fontWeight: 800
                    }}
                    onClick={handleLoadMockInvitations}
                  >
                    ⚡ Nạp Mock Data để test Vuốt Xóa
                  </button>
                </div>
              ) : (
                invitations
                  .filter(i => i.receiver_id === ctx.userId)
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(inv => {
                    const room = rooms.find(r => r.id === inv.room_id);
                    if (!room) return null;

                    const isExpired = inv.status === 'expired' || room.status === 'expired' || room.status === 'cancelled';
                    const hostObj = members.find(m => m.user_id === room.host_id) || { full_name: 'Đồng nghiệp' };

                    return (
                      <div
                        key={inv.id}
                        id={`swipe-container-${inv.id}`}
                        className="swipe-delete-container animated-fade-in"
                        style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--r-card)', marginBottom: 14 }}
                      >
                        {/* Premium designed Swipe Delete Background button */}
                        <div
                          className="swipe-delete-bg"
                          data-is-expired={isExpired}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '80px',
                            background: isExpired 
                              ? 'linear-gradient(135deg, #9CA3AF 0%, #4B5563 100%)' // Premium Slate Grey for expired cards
                              : 'linear-gradient(135deg, #FF6B6B 0%, #E63946 100%)', // Crimson red gradient for active cards
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            zIndex: 1,
                            borderRadius: '0', // Straight edge to fill the parent container perfectly, parent clips it!
                            cursor: 'pointer',
                            boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.12)'
                          }}
                          onClick={() => handleDeleteInvitation(inv.id)}
                        >
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.22)', // Translucent glassmorphism circle
                              backdropFilter: 'blur(4px)',
                              WebkitBackdropFilter: 'blur(4px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            }}
                          >
                            <span style={{ fontSize: '18px' }}>🗑️</span>
                          </div>
                          <span style={{ color: '#fff', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Xóa</span>
                        </div>

                        {/* Invitation Card */}
                        <div
                          className={`mushy-card invitation-card ${isExpired ? 'invitation-card--expired' : ''}`}
                          style={{
                            margin: 0,
                            position: 'relative',
                            zIndex: 2,
                            touchAction: 'pan-y'
                          }}
                          onTouchStart={handleTouchStart}
                          onTouchMove={(e) => handleTouchMove(e, inv.id)}
                          onTouchEnd={(e) => handleTouchEnd(e, inv.id)}
                        >
                          <div className="buddy-card-header">
                            <div className="buddy-avatar-wrapper" style={{ width: 44, height: 44, flexShrink: 0 }}>
                              <span>{hostObj.full_name?.charAt(0)}</span>
                            </div>
                            <div className="buddy-info" style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1.35, display: 'block' }}>
                                Kèo Connect từ <strong>{hostObj.full_name}</strong>
                              </h4>
                              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.35 }}>
                                🎯 Thẻ: <strong>{getTagName(room.child_code)}</strong> · 📍 Địa điểm: <strong>{room.location}</strong>
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span className={`grant-direction-tag ${inv.status === 'accepted' ? 'grant-direction-tag--in' : 'grant-direction-tag--out'}`} style={{ background: inv.status === 'accepted' ? '#10B981' : inv.status === 'pending' ? '#F59E0B' : '#9CA3AF', color: '#fff', whiteSpace: 'nowrap' }}>
                                {inv.status === 'accepted' ? 'Đã Chấp Nhận' : inv.status === 'declined' ? 'Từ chối' : inv.status === 'pending' ? 'Đang Chờ' : 'Hết hạn'}
                              </span>
                            </div>
                          </div>

                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                            ⏰ Thời gian: <strong>{formatTime(room.scheduled_at)}</strong>
                          </div>

                          {/* Expired UX (PRD Section 8.2) */}
                          {isExpired ? (
                            <div className="expired-badge">
                              Rất tiếc, phòng hẹn đã đủ thành viên hoặc đã bị hủy. Hẹn bạn kèo sau nhé! 🍄
                            </div>
                          ) : (
                            inv.status === 'pending' && (
                              <div style={{ display: 'flex', gap: 10, marginTop: 12, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                                <button
                                  className="mushy-btn mushy-btn--primary"
                                  style={{ flex: 1, minHeight: 38, height: 38, padding: '0 16px', fontSize: 13.5 }}
                                  onClick={() => handleAcceptInvitation(inv)}
                                >
                                  Chấp nhận tham gia
                                </button>
                                <button
                                  className="mushy-btn mushy-btn--ghost"
                                  style={{ 
                                    color: 'var(--danger)', 
                                    borderColor: 'var(--danger)', 
                                    minHeight: 38, 
                                    height: 38, 
                                    padding: '0 16px', 
                                    fontSize: 13.5, 
                                    whiteSpace: 'nowrap' 
                                  }}
                                  onClick={() => handleDeclineInvitation(inv)}
                                >
                                  Từ chối
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
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

      {/* QUICK INVITE MODAL */}
      {quickInviteData && (
        <div className="modal-scrim dialog-scrim animated-fade-in" onClick={() => setQuickInviteData(null)}>
          <div className="modal-card" style={{ maxWidth: 420, textAlign: 'left', display: 'flex', flexDirection: 'column', maxHeight: '95dvh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--hairline)', paddingBottom: 8 }}>
              <h3 className="dialog-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span>⚡</span> Lập kèo nhanh
              </h3>
              <button 
                type="button"
                onClick={() => setQuickInviteData(null)}
                style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: 'var(--muted)', padding: '0 4px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(230,57,70,0.03)', padding: 12, borderRadius: 12, border: '1px solid rgba(230,57,70,0.08)', marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', color: 'var(--brand)' }}>
                  {quickInviteData.member.full_name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>Rủ {quickInviteData.member.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Cùng tham gia hoạt động: <strong>{quickInviteData.tagName}</strong></div>
                </div>
              </div>

              {/* Time selection grid */}
              <div style={{ marginBottom: 14 }}>
                <label className="mushy-label" style={{ fontSize: 11.5 }}>Chọn thời gian rảnh nhanh (Khớp giờ rảnh)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                  {quickTimeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`selectable-chip ${quickInviteTime === opt.value ? 'selectable-chip--selected' : ''}`}
                      style={{ padding: '6px 12px', fontSize: 11.5, textAlign: 'center', margin: 0 }}
                      onClick={() => { bridge.haptic('light'); setQuickInviteTime(opt.value); }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location selection grid */}
              <div style={{ marginBottom: 14 }}>
                <label className="mushy-label" style={{ fontSize: 11.5 }}>Địa điểm gặp mặt</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {['Căn tin công ty 🍲', 'Sân thể thao gần cty 🏸', 'Quán cafe tầng G ☕', 'Khu vực Pantry 🥤'].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      className={`selectable-chip ${quickInviteLocation === loc ? 'selectable-chip--selected' : ''}`}
                      style={{ padding: '6px 12px', fontSize: 11.5, margin: 0 }}
                      onClick={() => { bridge.haptic('light'); setQuickInviteLocation(loc); }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 10, marginTop: 10, paddingBottom: 0 }}>
              <button 
                type="button" 
                className="mushy-btn mushy-btn--ghost" 
                style={{ height: 34, fontSize: 12.5 }}
                onClick={() => setQuickInviteData(null)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="mushy-btn mushy-btn--primary btn-glow-brand" 
                style={{ height: 34, fontSize: 12.5 }}
                disabled={submittingQuickInvite || !quickInviteTime}
                onClick={handleQuickInviteSubmit}
              >
                {submittingQuickInvite ? 'Đang gửi...' : 'Gửi lời mời nhanh 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* HOST CANCEL WITH REASONS MODAL (PRD Section 7.2) */}
      {showCancelModal && (
        <div className="modal-scrim dialog-scrim animated-fade-in" onClick={() => setShowCancelModal(null)}>
          <div className="modal-card dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon" style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--brand)' }}>
              🚨
            </div>
            <h3 className="dialog-title">Yêu cầu lý do hủy kèo</h3>
            <p className="dialog-body" style={{ textAlign: 'left', marginBottom: 12 }}>
              Hệ thống Connect bảo vệ văn hóa gắn kết văn minh. Vui lòng chọn hoặc nhập lý do để tự động gửi thông báo trang trọng tới nhóm chat trước khi đóng.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label className="mushy-label">Chọn lý do hủy phòng</label>
              <Select
                value={cancelReason}
                onChange={(val) => setCancelReason(val)}
                options={[
                  { value: 'Bận việc đột xuất', label: 'Bận việc đột xuất 💼' },
                  { value: 'Lý do thời tiết bất lợi', label: 'Lý do thời tiết bất lợi 🌧️' },
                  { value: 'Thay đổi kế hoạch tổ chức', label: 'Thay đổi kế hoạch tổ chức 🔄' },
                  { value: 'Không đủ số lượng thành viên tham gia mong muốn', label: 'Không đủ số lượng thành viên 👥' }
                ]}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label className="mushy-label">Lý do cụ thể khác (tùy chọn)</label>
              <textarea
                className="mushy-input"
                placeholder="Nhập lý do chi tiết..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: 10 }}>
              <button className="mushy-btn mushy-btn--danger mushy-btn--block" onClick={handleCancelRoomSubmit}>
                Xác nhận Hủy phòng
              </button>
              <button className="mushy-btn mushy-btn--ghost mushy-btn--block" onClick={() => setShowCancelModal(null)}>
                Bỏ qua
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

      {/* IN-APP CHAT MODAL */}
      {activeChatRoom && (() => {
        const room = rooms.find(r => r.id === activeChatRoom.id) || activeChatRoom;
        const roomLocation = room.location;
        const childCode = room.child_code;
        const messages = parseChatMessages(room.chat_group_id);
        const hostObj = members.find(m => m.user_id === room.host_id) || (room.host_id === ctx.userId ? { full_name: 'Bạn' } : { full_name: 'Đồng nghiệp' });

        return (
          <div className="modal-scrim animated-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setActiveChatRoom(null)}>
            <div className="modal-card" style={{ width: '100%', maxWidth: '480px', height: '85vh', maxHeight: '720px', borderRadius: '24px', padding: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(24px)', border: '1.5px solid rgba(255, 255, 255, 0.45)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
              
              {/* Chat Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--hairline)', background: 'linear-gradient(135deg, rgba(255, 240, 242, 0.8) 0%, rgba(255, 229, 233, 0.8) 100%)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>💬</span>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
                      Kèo: {getTagName(childCode)}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                      📍 {roomLocation} · Host: {hostObj.full_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveChatRoom(null)}
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
                    <span style={{ fontSize: 13, fontStyle: 'italic' }}>Chưa có tin nhắn nào trong phòng.</span>
                    <span style={{ fontSize: 11, marginTop: 4 }}>Hãy là người nhắn lời chào đầu tiên nhé!</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === ctx.userId;
                    const senderName = getSenderName(msg.senderId, room.host_id);
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
                  handleSendChatMessage(room, chatInput);
                  setChatInput('');
                }}
                style={{ padding: '14px 16px', borderTop: '1px solid var(--hairline)', background: '#fff', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', gap: 10 }}
              >
                <input
                  type="text"
                  className="mushy-input"
                  placeholder="Nhập tin nhắn đi chill..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{ flex: 1, margin: 0, borderRadius: '20px', minHeight: '38px', height: '38px', fontSize: '13px', padding: '0 16px' }}
                />
                <button
                  type="submit"
                  className="mushy-btn mushy-btn--primary"
                  style={{ minHeight: '38px', height: '38px', borderRadius: '50%', width: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  disabled={!chatInput.trim()}
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
