import React from 'react';
import { bridge } from '../lib/bridge.js';
import { getAvatarGradient } from '../lib/app/avatar.js';
import { getConnectTypeLabel, parseMessageTemplate, isConnectionExpired, formatName } from '../lib/app/connect.js';
import { parseChatMessages } from '../lib/app/chat.js';

export default function ConnectionsScreen({
  myPoints,
  myProfile,
  connectionMeetings,
  connectionRequests,
  rooms = [],
  invitations = [],
  members,
  allProfiles,
  allPoints,
  ctx,
  helperNewbieCounts,
  onConfirmMeeting,
  onOpenChat,
  onOpenInvite,
  onCreateCommunityClick,
  onDeleteConnectionRequest
}) {
  const [activeFilter, setActiveFilter] = React.useState('all');

  const pendingConfirmationMeetings = connectionMeetings.filter(m => {
    if (m.status !== 'pending_confirmation') return false;
    const req = connectionRequests.find(r => r.id === m.request_id);
    if (!req) return false;
    const isFrom = ctx.userId === req.from_user_id;
    const isTo = ctx.userId === req.to_user_id;
    return (isFrom && !m.from_confirmed) || (isTo && !m.to_confirmed);
  });

  const active1to1 = connectionRequests.filter(r => r.status === 'accepted');
  
  const activeOutings = (rooms || []).filter(r => {
    if (r.is_club) return false;
    const isHost = r.host_id === ctx.userId;
    const isMember = (invitations || []).some(i => i.room_id === r.id && i.receiver_id === ctx.userId && i.status === 'accepted');
    return isHost || isMember;
  });

  const activeCommunities = (rooms || []).filter(r => {
    if (!r.is_club) return false;
    const isHost = r.host_id === ctx.userId;
    const isMember = (invitations || []).some(i => i.room_id === r.id && i.receiver_id === ctx.userId && i.status === 'accepted');
    return isHost || isMember;
  });

  // Combine and sort all active connections chronologically (newest first)
  const allActiveConnections = [
    ...active1to1.map(c => ({ ...c, connType: '1to1', timeStamp: c.resolved_at || c.created_at })),
    ...activeOutings.map(o => ({ ...o, connType: 'outing', timeStamp: o.created_at })),
    ...activeCommunities.map(m => ({ ...m, connType: 'community', timeStamp: m.created_at }))
  ].sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));

  const outbox = connectionRequests.filter(r => r.from_user_id === ctx.userId && r.status === 'pending');

  return (
    <div className="tab-pane animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <PointsCard points={myPoints} />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className="mushy-btn mushy-btn--primary"
          style={{
            flex: 1,
            minHeight: '44px',
            height: '44px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--brand) 0%, #E63946 100%)',
            border: 'none',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(230, 57, 70, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            margin: 0
          }}
          onClick={() => { bridge.haptic('light'); onOpenInvite?.(); }}
        >
          <span>➕</span> Lời mời kết nối mới
        </button>

        <button
          type="button"
          className="mushy-btn"
          style={{
            flex: 1,
            minHeight: '44px',
            height: '44px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '800',
            border: '1.5px solid #0d9488',
            color: '#0d9488',
            background: 'rgba(13, 148, 136, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            margin: 0
          }}
          onClick={() => { bridge.haptic('light'); onCreateCommunityClick?.(); }}
        >
          <span>👥</span> Tạo cộng đồng
        </button>
      </div>

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
        connections={allActiveConnections.filter(c => activeFilter === 'all' || c.connType === activeFilter)}
        members={members}
        allProfiles={allProfiles}
        ctx={ctx}
        invitations={invitations}
        onChat={onOpenChat}
        filter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <Outbox
        outbox={outbox}
        members={members}
        allProfiles={allProfiles}
        ctx={ctx}
        onDelete={onDeleteConnectionRequest}
      />

      <Leaderboard
        allPoints={allPoints}
        members={members}
        ctx={ctx}
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
                    Bạn và {formatName(buddy)} đã gặp nhau chưa?
                  </h5>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#4B5563', lineHeight: '1.4' }}>
                    Hình thức: <strong>{typeLabel}</strong>. {req?.action_type === 'intro_meet' ? 'Xác nhận gặp để nhận ngay 15 điểm thưởng nhân viên mới! 🌟' : 'Xác nhận gặp để nhận ngay 10 điểm kết nối!'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid rgba(245, 158, 11, 0.15)', paddingTop: '12px' }}>
                <button
                  type="button"
                  className="mushy-btn"
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
                    👶 {formatName(newbie)}
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

function ActiveConnections({ connections, members, allProfiles, ctx, invitations, onChat, filter, onFilterChange }) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, connections.length]);

  const totalConnections = connections.length;
  const totalPages = Math.ceil(totalConnections / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedConnections = connections.slice(startIndex, startIndex + pageSize);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '0 0 10px 6px' }}>
        <h4 className="chip-group-title" style={{ margin: 0 }}>
          💬 Kết nối đã thiết lập
        </h4>
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{connections.length} kết nối</span>
      </div>

      <div className="chips-container" style={{ marginBottom: 14, marginLeft: 6 }}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: '1to1', label: '⚡ 1-1' },
          { key: 'outing', label: '🚗 Đi chung' },
          { key: 'community', label: '👥 Cộng đồng' },
        ].map(f => (
          <button
            key={f.key}
            type="button"
            className={`selectable-chip ${filter === f.key ? 'selectable-chip--selected' : ''}`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => onFilterChange?.(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {connections.length === 0 ? (
        <div className="mushy-empty-state" style={{ padding: '30px 16px', margin: 0 }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤝</div>
          <h5 className="mushy-empty-title">Chưa có kết nối nào</h5>
          <p className="mushy-empty-desc">Chấp nhận lời mời hoặc tự tạo cộng đồng để trò chuyện và kết nối.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginatedConnections.map(conn => {
            if (conn.connType === '1to1') {
              const buddyId = conn.from_user_id === ctx.userId ? conn.to_user_id : conn.from_user_id;
              const buddy = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
              const buddyProf = allProfiles[buddyId] || {};
              const typeLabel = getConnectTypeLabel(conn.action_type);
              const messages = parseChatMessages(conn.chat_messages);
              const hasUnread = messages.length > 0 && messages[messages.length - 1].senderId !== ctx.userId;

              return (
                <div key={`1to1-${conn.id}`} className="buddy-card-compact" style={{ padding: '14px 16px', margin: 0 }}>
                  <div className="buddy-card-main">
                    <div className="buddy-avatar-compact" style={{ background: getAvatarGradient(formatName(buddy).charAt(0)) }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{formatName(buddy).charAt(0)}</span>
                    </div>
                    <div className="buddy-body-compact" style={{ textAlign: 'left' }}>
                      <div className="buddy-header-row">
                        <h4 className="buddy-name-compact">{formatName(buddy)}</h4>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          background: 'var(--brand-soft)',
                          color: 'var(--brand)',
                          borderRadius: '6px'
                        }}>
                          ⚡ 1-1 ({typeLabel})
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
            } else if (conn.connType === 'outing') {
              const hostObj = members.find(m => m.user_id === conn.host_id) || { full_name: 'Đồng nghiệp' };
              const typeLabel = getConnectTypeLabel(conn.child_code);
              const messages = parseChatMessages(conn.chat_messages);
              const hasUnread = messages.length > 0 && messages[messages.length - 1].senderId !== ctx.userId;

              return (
                <div key={`outing-${conn.id}`} className="buddy-card-compact" style={{ padding: '14px 16px', margin: 0, borderLeft: '4px solid #0284c7' }}>
                  <div className="buddy-card-main">
                    <div className="buddy-avatar-compact" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>🚗</span>
                    </div>
                    <div className="buddy-body-compact" style={{ textAlign: 'left' }}>
                      <div className="buddy-header-row">
                        <h4 className="buddy-name-compact" style={{ color: '#0284c7' }}>Phòng đi chung</h4>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284c7',
                          borderRadius: '6px'
                        }}>
                          🚗 Đi chung ({typeLabel})
                        </span>
                      </div>
                      <div className="buddy-meta-row" style={{ marginTop: '2px' }}>
                        <span className="buddy-dept">Host: {formatName(hostObj)}</span>
                        <span className="buddy-dot-separator">·</span>
                        <span className="buddy-facility">📍 {conn.location}</span>
                      </div>
                      {messages.length > 0 && (
                        <p style={{
                          margin: '6px 0 0',
                          fontSize: '11.5px',
                          color: hasUnread ? '#0284c7' : 'var(--muted)',
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
                        background: '#0284c7',
                        borderColor: '#0284c7',
                        color: '#fff',
                        fontWeight: '700',
                        borderRadius: '16px',
                        position: 'relative'
                      }}
                      onClick={() => { bridge.haptic('light'); onChat?.(conn); }}
                    >
                      Chat nhóm
                      {hasUnread && (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#0284c7',
                          border: '1.5px solid #fff'
                        }} />
                      )}
                    </button>
                  </div>
                </div>
              );
            } else if (conn.connType === 'community') {
              const hostObj = members.find(m => m.user_id === conn.host_id) || { full_name: 'Đồng nghiệp' };
              const typeLabel = getConnectTypeLabel(conn.child_code);
              const acceptedInvs = (invitations || []).filter(i => i.room_id === conn.id && i.status === 'accepted');
              const memberCount = 1 + acceptedInvs.length; // Host + accepted members
              const messages = parseChatMessages(conn.chat_messages);
              const hasUnread = messages.length > 0 && messages[messages.length - 1].senderId !== ctx.userId;

              return (
                <div key={`club-${conn.id}`} className="buddy-card-compact" style={{ padding: '14px 16px', margin: 0, borderLeft: '4px solid #0d9488' }}>
                  <div className="buddy-card-main">
                    <div className="buddy-avatar-compact" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>👥</span>
                    </div>
                    <div className="buddy-body-compact" style={{ textAlign: 'left' }}>
                      <div className="buddy-header-row">
                        <h4 className="buddy-name-compact" style={{ color: '#0d9488' }}>{conn.club_name}</h4>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          background: 'rgba(13, 148, 136, 0.1)',
                          color: '#0d9488',
                          borderRadius: '6px'
                        }}>
                          👥 Cộng đồng ({typeLabel})
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conn.club_description || 'Cộng đồng giao lưu, chia sẻ.'}
                      </p>
                      <div className="buddy-meta-row" style={{ marginTop: '4px' }}>
                        <span className="buddy-dept">Mở bởi: {formatName(hostObj)}</span>
                        <span className="buddy-dot-separator">·</span>
                        <span className="buddy-facility">👥 {memberCount} thành viên</span>
                      </div>
                      {messages.length > 0 && (
                        <p style={{
                          margin: '6px 0 0',
                          fontSize: '11.5px',
                          color: hasUnread ? '#0d9488' : 'var(--muted)',
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
                        background: '#0d9488',
                        borderColor: '#0d9488',
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
                          background: '#0d9488',
                          border: '1.5px solid #fff'
                        }} />
                      )}
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '18px',
          marginBottom: '10px'
        }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => {
              bridge.haptic('light');
              setCurrentPage(prev => Math.max(prev - 1, 1));
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '16px',
              border: '1px solid var(--hairline)',
              background: currentPage === 1 ? 'rgba(0,0,0,0.02)' : '#fff',
              color: currentPage === 1 ? 'var(--muted)' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: currentPage === 1 ? 0.6 : 1,
              boxShadow: currentPage === 1 ? 'none' : '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            Trước
          </button>

          <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Trang <strong>{currentPage}</strong> / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => {
              bridge.haptic('light');
              setCurrentPage(prev => Math.min(prev + 1, totalPages));
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '16px',
              border: '1px solid var(--hairline)',
              background: currentPage === totalPages ? 'rgba(0,0,0,0.02)' : '#fff',
              color: currentPage === totalPages ? 'var(--muted)' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: currentPage === totalPages ? 0.6 : 1,
              boxShadow: currentPage === totalPages ? 'none' : '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            Sau
          </button>
        </div>
      )}
    </section>
  );
}

function Outbox({ outbox, members, allProfiles, ctx, onDelete }) {
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px 6px' }}>
        <h4 className="chip-group-title" style={{ margin: 0 }}>
          📤 Yêu cầu đã gửi (Outbox)
        </h4>
        {outbox.some(req => isConnectionExpired(req)) && (
          <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>⏰ Có lời mời quá hạn</span>
        )}
      </div>

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
            const expired = isConnectionExpired(req);

            return (
              <div key={req.id} className={`buddy-card-compact ${expired ? 'invitation-card--expired' : ''}`} style={{
                background: expired ? '#F9FAFB' : 'rgba(255,255,255,0.5)',
                padding: '12px 14px',
                margin: 0,
                borderColor: expired ? '#E5E7EB' : 'rgba(15,15,18,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: expired ? '#9CA3AF' : 'var(--ink)' }}>
                      Gửi tới: {formatName(buddy)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: expired ? '#9CA3AF' : 'var(--muted)', marginTop: '2px' }}>
                      Hình thức: <strong>{typeLabel}</strong> · Trạng thái: {' '}
                      {expired ? (
                        <span style={{ color: '#9CA3AF', fontWeight: '700' }}>⏰ Quá hạn</span>
                      ) : (
                        <span style={{ color: '#F59E0B', fontWeight: '700' }}>Chờ phản hồi</span>
                      )}
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {time && (
                        <div style={{ fontSize: '10.5px', color: expired ? '#9CA3AF' : '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📅</span> <span>Hẹn lúc: <strong>{time}</strong></span>
                        </div>
                      )}
                      {location && (
                        <div style={{ fontSize: '10.5px', color: expired ? '#9CA3AF' : '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📍</span> <span>Tại: <strong>{location}</strong></span>
                        </div>
                      )}
                      {text && (
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: expired ? '#9CA3AF' : 'var(--muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.01)', padding: '4px 6px', borderRadius: '6px' }}>
                          💬 "{text}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: expired ? '#9CA3AF' : 'var(--muted)' }}>
                      {new Date(req.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      className="mushy-btn mushy-btn--ghost"
                      style={{
                        minHeight: '28px',
                        height: '28px',
                        fontSize: '11px',
                        padding: '0 10px',
                        color: 'var(--danger)',
                        borderColor: 'var(--danger)',
                        borderRadius: '8px'
                      }}
                      onClick={() => onDelete?.(req.id)}
                    >
                      {expired ? 'Xoá' : 'Thu hồi'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Leaderboard({ allPoints, members, ctx }) {
  return (
    <section>
      <div style={{ margin: '0 0 10px 6px' }}>
        <h4 className="chip-group-title" style={{ margin: 0 }}>
          🏆 Bảng xếp hạng Connect
        </h4>
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
                      background: getAvatarGradient((isMe ? 'Bạn' : formatName(userObj)).charAt(0)),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {(isMe ? 'Bạn' : formatName(userObj)).charAt(0)}
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
                        {isMe ? 'Bạn' : formatName(userObj)} {isMe ? '(Tôi)' : ''}
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
                    {row.points} <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'normal' }}>điểm</span>
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
