import React from 'react';
import { bridge } from '../lib/bridge.js';

export default function QuickConnectSheet({ buddy, myProfile, allProfiles, onClose, onSendRequest, icebreakerMsg, loadingIcebreaker, onGetIcebreaker }) {
  if (!buddy) return null;

  const buddyProfile = allProfiles[buddy.user_id] || {};
  const isNewbieBuddy = myProfile?.is_newbie && buddyProfile?.is_buddy_helper;

  const actions = [
    { type: 'food', icon: '🍴', title: 'Ăn uống', desc: 'Rủ nhau ăn trưa hoặc cafe ngắn chớp nhoáng' },
    { type: 'sport', icon: '⚽', title: 'Thể thao', desc: 'Tìm người tập cùng, chạy bộ hoặc chơi bóng sau giờ làm' },
    { type: 'knowledge', icon: '📖', title: 'Tri thức', desc: 'Chia sẻ kinh nghiệm chuyên môn, học hỏi kỹ năng chéo' },
    { type: 'casual', icon: '💬', title: 'Tán gẫu', desc: 'Làm quen trò chuyện nhẹ nhàng, tự nhiên không áp lực' },
    ...(isNewbieBuddy ? [{ type: 'intro_meet', icon: '🤝', title: 'Lập lịch làm quen', desc: 'Dành riêng cho nhân viên mới kết nối với Buddy hỗ trợ' }] : [])
  ];

  return (
    <div className="modal-scrim dialog-scrim animated-fade-in" onClick={onClose}>
      <div
        className="modal-card bottom-sheet-card animated-slide-up"
        style={{
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--hairline)', paddingBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
            ⚡ Gửi lời mời tới {buddy.full_name}
          </h3>
          <button
            type="button"
            onClick={onClose}
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
            {actions.map(action => (
              <button
                key={action.type}
                type="button"
                className="quick-action-item"
                onClick={() => { bridge.haptic('light'); onSendRequest?.(buddy.user_id, action.type); onClose?.(); }}
              >
                <div className="quick-action-icon">{action.icon}</div>
                <div className="quick-action-info">
                  <div className="quick-action-name">{action.title}</div>
                  <div className="quick-action-desc">{action.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, borderTop: '1px solid var(--hairline)', paddingTop: 14 }}>
            <button
              type="button"
              className="mushy-btn mushy-btn--ghost mushy-btn--block"
              style={{ fontSize: 12, minHeight: 36 }}
              disabled={loadingIcebreaker}
              onClick={() => { bridge.haptic('light'); onGetIcebreaker?.(); }}
            >
              {loadingIcebreaker ? '✨ AI đang gợi ý…' : '✨ Gợi ý câu mở đầu (AI)'}
            </button>

            {icebreakerMsg && (
              <div className="ai-icebreaker-box" style={{ marginTop: 10 }}>
                <span className="ai-sparkle-icon">✨</span>
                {icebreakerMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
