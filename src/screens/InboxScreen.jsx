import React from 'react';
import { getAvatarGradient } from '../lib/app/avatar.js';
import { getConnectTypeLabel, parseMessageTemplate, isConnectionExpired, isInvitationExpired, formatName } from '../lib/app/connect.js';

export default function InboxScreen({
  connectionRequests,
  invitations = [],
  rooms = [],
  members,
  allProfiles,
  ctx,
  onRespond,
  onRespondInvitation,
  onDeleteRequest,
  onDeleteInvitation
}) {
  const [inboxFilter, setInboxFilter] = React.useState('all');
  const incomingRequests = connectionRequests.filter(r => r.to_user_id === ctx.userId && r.status === 'pending');
  
  const pendingInvs = (invitations || []).filter(i => i.receiver_id === ctx.userId && i.status === 'pending');
  
  const incomingOutings = pendingInvs.filter(i => {
    const room = (rooms || []).find(r => r.id === i.room_id);
    return room && !room.is_club;
  });

  const incomingCommunities = pendingInvs.filter(i => {
    const room = (rooms || []).find(r => r.id === i.room_id);
    return room && room.is_club;
  });

  // Combine and sort all incoming invites chronologically (newest first)
  const allInboxItems = [
    ...incomingRequests.map(r => ({ ...r, inboxType: '1to1', timeStamp: r.created_at })),
    ...incomingOutings.map(i => ({ ...i, inboxType: 'outing', timeStamp: i.created_at })),
    ...incomingCommunities.map(i => ({ ...i, inboxType: 'community', timeStamp: i.created_at }))
  ].sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));

  const filteredInboxItems = inboxFilter === 'all'
    ? allInboxItems
    : allInboxItems.filter(item => item.inboxType === inboxFilter);

  return (
    <div className="tab-pane animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="compact-tab-header">
        <div className="radar-pulse-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, width: 24, height: 24 }}>
          📥
        </div>
        <div className="radar-text-wrapper" style={{ flex: 1, textAlign: 'left' }}>
          <h4 className="compact-radar-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Hộp thư lời mời Connect</h4>
          <p className="compact-radar-sub" style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Lời mời kết nối 1-1, Đi chung nhóm, và Cộng đồng</p>
        </div>
      </div>

      {allInboxItems.length > 0 && (
        <div className="chips-container" style={{ margin: '0 0 4px 6px' }}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: '1to1', label: '⚡ Kết nối 1-1' },
            { key: 'outing', label: '🚗 Đi chung' },
            { key: 'community', label: '👥 Cộng đồng' },
          ].map(f => (
            <button
              key={f.key}
              type="button"
              className={`selectable-chip ${inboxFilter === f.key ? 'selectable-chip--selected' : ''}`}
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setInboxFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filteredInboxItems.length === 0 ? (
        <div className="mushy-empty-state animated-fade-in">
          <div className="mushy-empty-icon">📥</div>
          <h4 className="mushy-empty-title">Hộp thư lời mời trống</h4>
          <p className="mushy-empty-desc">Hiện chưa có lời mời Connect nào gửi tới bạn. Hãy thử cập nhật sở thích để tăng cơ hội kết nối nhé!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredInboxItems.map(item => {
            if (item.inboxType === '1to1') {
              const hostObj = members.find(m => m.user_id === item.from_user_id) || { full_name: 'Đồng nghiệp' };
              const typeLabel = getConnectTypeLabel(item.action_type);
              const profileObj = allProfiles[item.from_user_id] || {};
              const expired = isConnectionExpired(item);

              return (
                <div
                  key={item.id}
                  className={`mushy-card invitation-card ${expired ? 'invitation-card--expired' : ''}`}
                  style={{ margin: 0, textAlign: 'left', borderLeft: `4px solid ${expired ? '#9CA3AF' : 'var(--brand)'}` }}
                >
                  <div className="buddy-card-header">
                    <div className="buddy-avatar-wrapper" style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      background: expired ? '#E5E7EB' : getAvatarGradient(formatName(hostObj).charAt(0)),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      <span>{formatName(hostObj).charAt(0)}</span>
                    </div>
                    <div className="buddy-info" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: expired ? '#9CA3AF' : 'var(--ink)', margin: 0, lineHeight: 1.35 }}>
                          Lời mời từ {formatName(hostObj)}
                        </h4>
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: expired ? '#9CA3AF' : 'var(--muted)', lineHeight: 1.35 }}>
                        🏢 {profileObj.department || 'Phòng ban'} · 📍 {profileObj.facility || 'Cơ sở'}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      background: expired ? '#F3F4F6' : 'var(--brand-soft)',
                      color: expired ? '#9CA3AF' : 'var(--brand)',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}>
                      {expired ? '⏰ Quá hạn' : `⚡ Kết nối 1-1 (${typeLabel})`}
                    </span>
                  </div>

                  {item.message_template && !expired && (
                    <MessageTemplate template={item.message_template} />
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                    {expired ? (
                      <button
                        className="mushy-btn mushy-btn--ghost"
                        style={{
                          flex: 1,
                          minHeight: 36,
                          height: 36,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--danger)',
                          borderColor: 'var(--danger)'
                        }}
                        onClick={() => onDeleteRequest?.(item.id)}
                      >
                        Xoá
                      </button>
                    ) : (
                      <>
                        <button
                          className="mushy-btn mushy-btn--primary"
                          style={{ flex: 1, minHeight: 36, height: 36, fontSize: 13, fontWeight: 700 }}
                          onClick={() => onRespond?.(item.id, 'accepted')}
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
                          onClick={() => onRespond?.(item.id, 'declined')}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            } else if (item.inboxType === 'outing') {
              const room = rooms.find(r => r.id === item.room_id) || {};
              const hostObj = members.find(m => m.user_id === room.host_id) || { full_name: 'Đồng nghiệp' };
              const typeLabel = getConnectTypeLabel(room.child_code);
              const profileObj = allProfiles[room.host_id] || {};
              const expired = isInvitationExpired(item, room);

              return (
                <div
                  key={item.id}
                  className={`mushy-card invitation-card ${expired ? 'invitation-card--expired' : ''}`}
                  style={{ margin: 0, textAlign: 'left', borderLeft: `4px solid ${expired ? '#9CA3AF' : '#0284c7'}` }}
                >
                  <div className="buddy-card-header">
                    <div className="buddy-avatar-wrapper" style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      background: expired ? '#E5E7EB' : getAvatarGradient(formatName(hostObj).charAt(0)),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      <span>{formatName(hostObj).charAt(0)}</span>
                    </div>
                    <div className="buddy-info" style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: expired ? '#9CA3AF' : 'var(--ink)', margin: 0, lineHeight: 1.35 }}>
                        Lời mời đi chung từ {formatName(hostObj)}
                      </h4>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: expired ? '#9CA3AF' : 'var(--muted)', lineHeight: 1.35 }}>
                        🏢 {profileObj.department || 'Phòng ban'} · 📍 {profileObj.facility || 'Cơ sở'}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      background: expired ? '#F3F4F6' : 'rgba(2, 132, 199, 0.1)',
                      color: expired ? '#9CA3AF' : '#0284c7',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}>
                      {expired ? '⏰ Quá hạn' : `🚗 Đi chung (${typeLabel})`}
                    </span>
                  </div>

                  {!expired && (
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
                      {room.scheduled_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1F2937' }}>
                          <span>📅</span>
                          <span>Hẹn lúc: <strong>{new Date(room.scheduled_at).toLocaleString('vi-VN')}</strong></span>
                        </div>
                      )}
                      {room.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1F2937' }}>
                          <span>📍</span>
                          <span>Tại: <strong>{room.location}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                    {expired ? (
                      <button
                        className="mushy-btn mushy-btn--ghost"
                        style={{
                          flex: 1,
                          minHeight: 36,
                          height: 36,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--danger)',
                          borderColor: 'var(--danger)'
                        }}
                        onClick={() => onDeleteInvitation?.(item.id)}
                      >
                        Xoá
                      </button>
                    ) : (
                      <>
                        <button
                          className="mushy-btn mushy-btn--primary"
                          style={{ flex: 1, minHeight: 36, height: 36, fontSize: 13, fontWeight: 700, background: '#0284c7', borderColor: '#0284c7' }}
                          onClick={() => onRespondInvitation?.(item.id, 'accepted')}
                        >
                          Đồng ý tham gia
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
                          onClick={() => onRespondInvitation?.(item.id, 'declined')}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            } else if (item.inboxType === 'community') {
              const room = rooms.find(r => r.id === item.room_id) || {};
              const hostObj = members.find(m => m.user_id === room.host_id) || { full_name: 'Đồng nghiệp' };
              const typeLabel = getConnectTypeLabel(room.child_code);
              const profileObj = allProfiles[room.host_id] || {};
              const expired = isInvitationExpired(item, room);

              return (
                <div
                  key={item.id}
                  className={`mushy-card invitation-card ${expired ? 'invitation-card--expired' : ''}`}
                  style={{ margin: 0, textAlign: 'left', borderLeft: `4px solid ${expired ? '#9CA3AF' : '#0d9488'}` }}
                >
                  <div className="buddy-card-header">
                    <div className="buddy-avatar-wrapper" style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      background: expired ? '#E5E7EB' : getAvatarGradient(formatName(hostObj).charAt(0)),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      <span>{formatName(hostObj).charAt(0)}</span>
                    </div>
                    <div className="buddy-info" style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: expired ? '#9CA3AF' : 'var(--ink)', margin: 0, lineHeight: 1.35 }}>
                        Mời vào cộng đồng: {room.club_name}
                      </h4>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: expired ? '#9CA3AF' : 'var(--muted)', lineHeight: 1.35 }}>
                        👤 Người mời: {formatName(hostObj)} · 🏢 {profileObj.department || 'Phòng ban'}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      background: expired ? '#F3F4F6' : 'rgba(13, 148, 136, 0.1)',
                      color: expired ? '#9CA3AF' : '#0d9488',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}>
                      {expired ? '⏰ Quá hạn' : `👥 Cộng đồng (${typeLabel})`}
                    </span>
                  </div>

                  {room.club_description && !expired && (
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
                      📝 <em>"{room.club_description}"</em>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                    {expired ? (
                      <button
                        className="mushy-btn mushy-btn--ghost"
                        style={{
                          flex: 1,
                          minHeight: 36,
                          height: 36,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--danger)',
                          borderColor: 'var(--danger)'
                        }}
                        onClick={() => onDeleteInvitation?.(item.id)}
                      >
                        Xoá
                      </button>
                    ) : (
                      <>
                        <button
                          className="mushy-btn mushy-btn--primary"
                          style={{ flex: 1, minHeight: 36, height: 36, fontSize: 13, fontWeight: 700, background: '#0d9488', borderColor: '#0d9488' }}
                          onClick={() => onRespondInvitation?.(item.id, 'accepted')}
                        >
                          Đồng ý gia nhập
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
                          onClick={() => onRespondInvitation?.(item.id, 'declined')}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }
            return null;
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
