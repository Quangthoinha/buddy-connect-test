import React from 'react';
import { bridge } from '../lib/bridge.js';
import { getAvatarGradient } from '../lib/app/avatar.js';
import { getConnectTypeLabel, parseMessageTemplate } from '../lib/app/connect.js';
import { parseChatMessages } from '../lib/app/chat.js';

export default function ConnectionsScreen({
  myPoints,
  myProfile,
  connectionMeetings,
  connectionRequests,
  members,
  allProfiles,
  allPoints,
  ctx,
  helperNewbieCounts,
  onConfirmMeeting,
  onOpenChat,
  onOpenInvite,
  onOpenSharing
}) {
  const pendingConfirmationMeetings = connectionMeetings.filter(m => {
    if (m.status !== 'pending_confirmation') return false;
    const req = connectionRequests.find(r => r.id === m.request_id);
    if (!req) return false;
    const isFrom = ctx.userId === req.from_user_id;
    const isTo = ctx.userId === req.to_user_id;
    return (isFrom && !m.from_confirmed) || (isTo && !m.to_confirmed);
  });

  const activeConns = connectionRequests.filter(r => r.status === 'accepted');
  const outbox = connectionRequests.filter(r => r.from_user_id === ctx.userId && r.status === 'pending');

  return (
    <div className="tab-pane animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <PointsCard points={myPoints} />

      <button
        type="button"
        className="mushy-btn mushy-btn--primary"
        style={{
          width: '100%',
          minHeight: '44px',
          height: '44px',
          borderRadius: '20px',
          fontSize: '13.5px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, var(--brand) 0%, #E63946 100%)',
          border: 'none',
          color: '#fff',
          boxShadow: '0 8px 20px rgba(230, 57, 70, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}
        onClick={() => { bridge.haptic('light'); onOpenInvite?.(); }}
      >
        <span>➕</span> Gửi lời mời kết nối mới
      </button>

      {pendingConfirmationMeetings.length > 0 && (
        <PendingMeetings
          meetings={pendingConfirmationMeetings}
          connectionRequests={connectionRequests}
          members={members}
          ctx={ctx}
          onConfirm={onConfirmMeeting}
        />
      )}

      {myProfile.is_buddy_helper && (
        <BuddyHelperDashboard
          ctx={ctx}
          members={members}
          allProfiles={allProfiles}
          connectionRequests={connectionRequests}
          helperNewbieCounts={helperNewbieCounts}
          onApprove={onOpenChat}
          onChat={onOpenChat}
        />
      )}

      <ActiveConnections
        connections={activeConns}
        members={members}
        allProfiles={allProfiles}
        ctx={ctx}
        onChat={onOpenChat}
      />

      <Outbox
        outbox={outbox}
        members={members}
        allProfiles={allProfiles}
      />

      <Leaderboard
        allPoints={allPoints}
        members={members}
        ctx={ctx}
        onOpenSharing={onOpenSharing}
      />
    </div>
  );
}

function PointsCard({ points }) {
  const badge = points.helper_badge_level;
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
    nextTargetText = 'Tích lũy thêm ' + (100 - points.points) + ' điểm để đạt Huy chương Vàng';
  } else if (badge === 'bronze') {
    gradient = 'linear-gradient(135deg, #FED7AA 0%, #EA580C 100%)';
    label = 'Huy chương Đồng';
    emoji = '🥉';
    nextTargetText = 'Tích lũy thêm ' + (60 - points.points) + ' điểm để đạt Huy chương Bạc';
  }

  return (
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
            {points.points}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
            Điểm Kết Nối
          </div>
        </div>
        <div style={{ height: '32px', width: '1.5px', background: 'rgba(230, 57, 70, 0.15)' }} />
        <div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', lineHeight: '1.1' }}>
            {points.confirmed_1to1_count}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
            Cuộc Gặp 1-1
          </div>
        </div>
      </div>

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
    </div>
  );
}

function PendingMeetings({ meetings, connectionRequests, members, ctx, onConfirm }) {
  return (
    <section>
      <h4 className="chip-group-title" style={{ margin: '0 0 10px 6px' }}>
        🔔 Xác nhận cuộc gặp
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {meetings.map(meeting => {
          const req = connectionRequests.find(r => r.id === meeting.request_id);
          const buddyId = req?.from_user_id === ctx.userId ? req?.to_user_id : req?.from_user_id;
          const buddy = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
          const typeLabel = getConnectTypeLabel(req?.action_type);

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
                    Hình thức: <strong>{typeLabel}</strong>. {req?.action_type === 'intro_meet' ? 'Xác nhận gặp để nhận ngay 15 điểm thưởng nhân viên mới! 🌟' : 'Xác nhận gặp để nhận ngay 10 điểm kết nối!'}
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
                  onClick={() => onConfirm?.(meeting.id, 'confirmed')}
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
                  onClick={() => onConfirm?.(meeting.id, 'skipped')}
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
}

function BuddyHelperDashboard({ ctx, members, allProfiles, connectionRequests, helperNewbieCounts, onApprove, onChat }) {
  const supportedNewbies = connectionRequests.filter(r =>
    r.to_user_id === ctx.userId &&
    (r.status === 'pending' || r.status === 'accepted')
  );
  const myNewbieCount = helperNewbieCounts[ctx.userId] || 0;

  return (
    <section className="mushy-card buddy-helper-dashboard" style={{
      background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
      border: '1.5px solid #5EEAD4',
      borderRadius: '20px',
      padding: '16px 18px',
      boxShadow: '0 8px 24px rgba(13, 148, 136, 0.05)',
      margin: '0 0 16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0D9488', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🤝 Vai trò: Buddy Helper ({myNewbieCount}/3 Newbies)
        </span>
        {myNewbieCount >= 3 ? (
          <span style={{ fontSize: '10px', fontWeight: '800', background: '#FEE2E2', color: '#EF4444', padding: '2px 6px', borderRadius: '6px' }}>
            🔥 Đầy tải (Tạm ẩn gợi ý)
          </span>
        ) : (
          <span style={{ fontSize: '10px', fontWeight: '800', background: '#E0F2FE', color: '#0284C7', padding: '2px 6px', borderRadius: '6px' }}>
            🟢 Sẵn sàng nhận match
          </span>
        )}
      </div>

      <p style={{ margin: '0 0 12px', fontSize: '11.5px', color: '#374151', lineHeight: '1.4', textAlign: 'left' }}>
        Bạn đang đóng vai trò là người hướng dẫn cho nhân viên mới. Danh sách các newbie bạn đang hỗ trợ:
      </p>

      {supportedNewbies.length === 0 ? (
        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontStyle: 'italic', textAlign: 'left' }}>
          Chưa có newbie nào gửi lời mời làm quen.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {supportedNewbies.map(req => {
            const newbie = members.find(m => m.user_id === req.from_user_id) || { full_name: 'Nhân viên mới' };
            const newbieProf = allProfiles[req.from_user_id] || {};
            const statusLabel = req.status === 'pending' ? 'Đang chờ duyệt' : 'Đã kết nối';

            return (
              <div key={req.id} style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(13, 148, 136, 0.15)'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>
                    👶 {newbie.full_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                    🏢 {newbieProf.department || 'Phòng ban'} · {statusLabel}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {req.status === 'pending' ? (
                    <button
                      type="button"
                      className="mushy-btn"
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        minHeight: '26px',
                        height: '26px',
                        background: '#0D9488',
                        borderColor: '#0D9488',
                        color: '#fff',
                        borderRadius: '8px'
                      }}
                      onClick={() => onApprove?.(req.id, 'accepted')}
                    >
                      Duyệt
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mushy-btn mushy-btn--ghost"
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        minHeight: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        margin: 0
                      }}
                      onClick={() => { bridge.haptic('light'); onChat?.(req); }}
                    >
                      Chat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActiveConnections({ connections, members, allProfiles, ctx, onChat }) {
  return (
    <section>
      <h4 className="chip-group-title" style={{ margin: '0 0 10px 6px' }}>
        💬 Kết nối đã thiết lập
      </h4>

      {connections.length === 0 ? (
        <div className="mushy-empty-state" style={{ padding: '30px 16px', margin: 0 }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤝</div>
          <h5 className="mushy-empty-title">Chưa có kết nối nào</h5>
          <p className="mushy-empty-desc">Chấp nhận lời mời hoặc gửi rủ nhanh để thiết lập kết nối 1-1 và trò chuyện.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {connections.map(conn => {
            const buddyId = conn.from_user_id === ctx.userId ? conn.to_user_id : conn.from_user_id;
            const buddy = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
            const buddyProf = allProfiles[buddyId] || {};
            const typeLabel = getConnectTypeLabel(conn.action_type);
            const messages = parseChatMessages(conn.chat_messages);
            const hasUnread = messages.length > 0 && messages[messages.length - 1].senderId !== ctx.userId;

            return (
              <div key={conn.id} className="buddy-card-compact" style={{ padding: '14px 16px', margin: 0 }}>
                <div className="buddy-card-main">
                  <div className="buddy-avatar-compact" style={{ background: getAvatarGradient(buddy.full_name?.charAt(0)) }}>
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
                    onClick={() => { bridge.haptic('light'); onChat?.(conn); }}
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
      )}
    </section>
  );
}

function Outbox({ outbox, members, allProfiles }) {
  return (
    <section>
      <h4 className="chip-group-title" style={{ margin: '0 0 10px 6px' }}>
        📤 Yêu cầu đã gửi (Outbox)
      </h4>

      {outbox.length === 0 ? (
        <div className="mushy-empty-state" style={{ padding: '24px 16px', margin: 0 }}>
          <p className="mushy-empty-desc" style={{ fontSize: '11.5px' }}>Chưa gửi lời mời kết nối nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {outbox.map(req => {
            const buddy = members.find(m => m.user_id === req.to_user_id) || { full_name: 'Đồng nghiệp' };
            const buddyProf = allProfiles[req.to_user_id] || {};
            const typeLabel = getConnectTypeLabel(req.action_type);
            const { text, time, location } = parseMessageTemplate(req.message_template);

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
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {time && (
                        <div style={{ fontSize: '10.5px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📅</span> <span>Hẹn lúc: <strong>{time}</strong></span>
                        </div>
                      )}
                      {location && (
                        <div style={{ fontSize: '10.5px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📍</span> <span>Tại: <strong>{location}</strong></span>
                        </div>
                      )}
                      {text && (
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.01)', padding: '4px 6px', borderRadius: '6px' }}>
                          💬 "{text}"
                        </p>
                      )}
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
      )}
    </section>
  );
}

function Leaderboard({ allPoints, members, ctx, onOpenSharing }) {
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px 6px' }}>
        <h4 className="chip-group-title" style={{ margin: 0 }}>
          🏆 Bảng xếp hạng Connect
        </h4>
        <button
          type="button"
          className="mushy-btn mushy-btn--ghost"
          style={{ minHeight: '26px', height: '26px', fontSize: '10.5px', padding: '0 8px', margin: 0, borderRadius: '6px' }}
          onClick={() => { bridge.haptic('light'); onOpenSharing?.(); }}
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
  );
}
