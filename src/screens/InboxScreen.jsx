import React from 'react';
import { getAvatarGradient } from '../lib/app/avatar.js';
import { getConnectTypeLabel, parseMessageTemplate } from '../lib/app/connect.js';

export default function InboxScreen({ connectionRequests, members, allProfiles, ctx, onRespond }) {
  const incomingRequests = connectionRequests.filter(r => r.to_user_id === ctx.userId && r.status === 'pending');

  return (
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

      {incomingRequests.length === 0 ? (
        <div className="mushy-empty-state animated-fade-in">
          <div className="mushy-empty-icon">📥</div>
          <h4 className="mushy-empty-title">Hộp thư lời mời trống</h4>
          <p className="mushy-empty-desc">Hiện chưa có lời mời Connect nào gửi tới bạn. Hãy thử đổi sở thích hoặc chủ động gửi lời mời trước nhé!</p>
        </div>
      ) : (
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
                  <MessageTemplate template={req.message_template} />
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                  <button
                    className="mushy-btn mushy-btn--primary"
                    style={{ flex: 1, minHeight: 36, height: 36, fontSize: 13, fontWeight: 700 }}
                    onClick={() => onRespond?.(req.id, 'accepted')}
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
                    onClick={() => onRespond?.(req.id, 'declined')}
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MessageTemplate({ template }) {
  const { text, time, location } = parseMessageTemplate(template);
  return (
    <div style={{
      marginTop: 10,
      padding: '10px 12px',
      background: 'rgba(15,15,18,0.02)',
      borderRadius: 12,
      fontSize: 12.5,
      color: 'var(--ink)',
      border: '1px solid var(--hairline)',
      lineHeight: 1.4,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      {time && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1F2937' }}>
          <span style={{ fontSize: '13px' }}>📅</span>
          <span>Hẹn lúc: <strong>{time}</strong></span>
        </div>
      )}
      {location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1F2937' }}>
          <span style={{ fontSize: '13px' }}>📍</span>
          <span>Tại: <strong>{location}</strong></span>
        </div>
      )}
      {text && (
        <div style={{ display: 'flex', gap: 6, color: 'var(--muted)', fontStyle: 'italic', marginTop: time || location ? '4px' : '0' }}>
          <span>💬</span>
          <span>"{text}"</span>
        </div>
      )}
    </div>
  );
}
