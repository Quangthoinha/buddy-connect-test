import React, { useEffect, useState } from 'react';
import { getConnectTypeLabel, formatName } from '../lib/app/connect.js';
import { parseChatMessages } from '../lib/app/chat.js';
import { getAvatarGradient } from '../lib/app/avatar.js';

export default function ChatModal({
  connection,
  members,
  ctx,
  invitations = [],
  onClose,
  onSend,
  onUpgradeToCommunity,
  onInviteMembers
}) {
  const [input, setInput] = useState('');
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [showInvitePicker, setShowInvitePicker] = useState(false);
  const [selectedInviteIds, setSelectedInviteIds] = useState([]);
  const [clubName, setClubName] = useState('');

  const messages = parseChatMessages(connection?.chat_messages);

  useEffect(() => {
    setTimeout(() => {
      const el = document.getElementById('mushy-chat-messages-container');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }, [connection, messages.length]);

  if (!connection || !ctx) return null;

  // Determine if this is a group/room chat (outing or community) versus 1-1 chat
  const isGroupChat = connection.is_club !== undefined;

  let chatTitle = '';
  let chatSub = '';
  let buddyMember = null;

  if (isGroupChat) {
    if (connection.is_club) {
      chatTitle = `👥 ${connection.club_name}`;
      chatSub = connection.club_description || 'Cộng đồng giao lưu chia sẻ';
    } else {
      chatTitle = `🚗 Đi chung: ${getConnectTypeLabel(connection.child_code)}`;
      chatSub = `Phòng đi chung tại ${connection.location}`;
    }
  } else {
    const buddyId = connection.from_user_id === ctx.userId ? connection.to_user_id : connection.from_user_id;
    buddyMember = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
    chatTitle = `💬 Trò chuyện với ${formatName(buddyMember.full_name)}`;
    chatSub = `⚡ Hình thức: ${getConnectTypeLabel(connection.action_type)}`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend?.(connection.id, input.trim(), isGroupChat);
    setInput('');
  }

  function handleUpgradeSubmit(e) {
    e.preventDefault();
    const finalClubName = clubName.trim() || `Cộng đồng ${formatName(buddyMember?.full_name)}`;
    onUpgradeToCommunity?.(connection.id, finalClubName);
    setShowUpgradeForm(false);
  }

  // Calculate inviteable workspace members (those not in the community yet)
  const communityInvs = invitations.filter(i => i.room_id === connection.id);
  const existingMemberIds = [connection.host_id, ...communityInvs.map(i => i.receiver_id)];
  const inviteableMembers = members.filter(m => m.user_id !== ctx.userId && !existingMemberIds.includes(m.user_id));

  return (
    <div className="modal-scrim animated-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{
          width: '100%', maxWidth: '480px', height: '85vh', maxHeight: '720px',
          borderRadius: '24px', padding: 0, display: 'flex', flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(255, 255, 255, 0.45)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--hairline)',
          background: isGroupChat 
            ? 'linear-gradient(135deg, rgba(204, 251, 241, 0.8) 0%, rgba(224, 242, 254, 0.8) 100%)'
            : 'linear-gradient(135deg, rgba(255, 240, 242, 0.8) 0%, rgba(255, 229, 233, 0.8) 100%)',
          borderTopLeftRadius: '24px', borderTopRightRadius: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 24 }}>{isGroupChat ? '👥' : '💬'}</span>
            <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chatTitle}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chatSub}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Upgrade Button (for 1-1 chats) */}
            {!isGroupChat && (
              <button
                type="button"
                className="mushy-btn"
                style={{
                  minHeight: '28px', height: '28px', fontSize: '11px', padding: '0 8px', margin: 0,
                  borderRadius: '12px', background: 'var(--brand)', color: '#fff', border: 'none', fontWeight: 'bold'
                }}
                onClick={() => {
                  setClubName(`Cộng đồng ${formatName(buddyMember?.full_name)}`);
                  setShowUpgradeForm(true);
                }}
              >
                👥 Nâng cấp
              </button>
            )}

            {/* Invite Button (for group/community chats) */}
            {isGroupChat && connection.is_club && (
              <button
                type="button"
                className="mushy-btn"
                style={{
                  minHeight: '28px', height: '28px', fontSize: '11px', padding: '0 8px', margin: 0,
                  borderRadius: '12px', background: '#0d9488', color: '#fff', border: 'none', fontWeight: 'bold'
                }}
                onClick={() => setShowInvitePicker(true)}
              >
                ➕ Mời
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 14, color: 'var(--muted)'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Inline Upgrade Form Overlay */}
        {showUpgradeForm && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.95)', zIndex: 100, borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 12px', color: 'var(--ink)' }}>
              👥 Nâng cấp lên Cộng đồng
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.45 }}>
              Nâng cấp cuộc trò chuyện này thành một Cộng đồng (Câu lạc bộ) hoạt động lâu dài. Bạn và <strong>{formatName(buddyMember?.full_name)}</strong> sẽ tự động trở thành những thành viên đầu tiên, và bạn có thể rủ thêm nhiều đồng nghiệp khác tham gia!
            </p>
            <form onSubmit={handleUpgradeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="mushy-label" style={{ marginBottom: 4, display: 'block', fontSize: '12px' }}>Tên Cộng đồng</label>
                <input
                  type="text"
                  className="mushy-input"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  required
                  placeholder="Vd: CLB Chạy bộ, Hội ăn trưa..."
                  style={{ minHeight: '38px', height: '38px', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="mushy-btn"
                  style={{ flex: 1, minHeight: '38px', height: '38px' }}
                  onClick={() => setShowUpgradeForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="mushy-btn mushy-btn--primary"
                  style={{ flex: 2, minHeight: '38px', height: '38px', background: 'var(--brand)', borderColor: 'var(--brand)' }}
                  disabled={!clubName.trim()}
                >
                  Xác nhận nâng cấp 🚀
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inline Member Invite Picker Overlay */}
        {showInvitePicker && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.95)', zIndex: 100, borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            display: 'flex', flexDirection: 'column', padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--hairline)', paddingBottom: 8 }}>
              <button
                type="button"
                onClick={() => { setSelectedInviteIds([]); setShowInvitePicker(false); }}
                style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← <span style={{ fontSize: '13px', fontWeight: 700 }}>Quay lại</span>
              </button>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                Đã chọn {selectedInviteIds.length}
              </span>
            </div>

            {inviteableMembers.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--muted)' }}>
                <span style={{ fontSize: 40, marginBottom: 8 }}>👥</span>
                <p style={{ fontSize: '12.5px', textAlign: 'center', margin: 0 }}>
                  Không còn đồng nghiệp nào khác để mời trong workspace này (hoặc tất cả đã được mời).
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 4px' }}>
                  Chọn đồng nghiệp muốn mời:
                </p>
                {inviteableMembers.map(m => {
                  const isSelected = selectedInviteIds.includes(m.user_id);
                  return (
                    <div
                      key={m.user_id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', border: `1.5px solid ${isSelected ? '#0d9488' : 'var(--hairline)'}`, borderRadius: '14px',
                        background: isSelected ? 'rgba(13, 148, 136, 0.06)' : '#fff', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setSelectedInviteIds(prev =>
                          prev.includes(m.user_id) ? prev.filter(id => id !== m.user_id) : [...prev, m.user_id]
                        );
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: getAvatarGradient(formatName(m.full_name).charAt(0)),
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 'bold'
                        }}>
                          {formatName(m.full_name).charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>{formatName(m.full_name)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{isSelected ? 'Đã chọn' : 'Bấm để chọn'}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '18px', color: '#0d9488', opacity: isSelected ? 1 : 0 }}>
                        ✓
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {inviteableMembers.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                <button
                  type="button"
                  className="mushy-btn"
                  style={{ flex: 1, minHeight: '38px', height: '38px', fontSize: '13px' }}
                  onClick={() => { setSelectedInviteIds([]); setShowInvitePicker(false); }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="mushy-btn mushy-btn--primary"
                  style={{ flex: 2, minHeight: '38px', height: '38px', fontSize: '13px', background: '#0d9488', borderColor: '#0d9488' }}
                  disabled={selectedInviteIds.length === 0}
                  onClick={() => {
                    if (selectedInviteIds.length > 0) {
                      onInviteMembers?.(connection.id, selectedInviteIds);
                      setSelectedInviteIds([]);
                      setShowInvitePicker(false);
                    }
                  }}
                >
                  Gửi lời mời ({selectedInviteIds.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <div
          id="mushy-chat-messages-container"
          style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255, 255, 255, 0.3)' }}
        >
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--muted)', opacity: 0.8 }}>
              <span style={{ fontSize: 44, marginBottom: 8 }}>💬🍄</span>
              <span style={{ fontSize: 13, fontStyle: 'italic' }}>Chưa có tin nhắn nào.</span>
              <span style={{ fontSize: 11, marginTop: 4 }}>Hãy gửi tin nhắn để bắt đầu trò chuyện nhé!</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === ctx.userId;
              let senderName = '';
              if (isMe) {
                senderName = 'Bạn';
              } else {
                const memberObj = members.find(m => m.user_id === msg.senderId);
                senderName = memberObj ? formatName(memberObj.full_name) : 'Đồng nghiệp';
              }
              const formattedTime = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 2, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0, fontWeight: 600 }}>
                    {senderName}
                  </span>
                  <div
                    style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
                      borderTopRightRadius: isMe ? '4px' : '16px',
                      borderTopLeftRadius: isMe ? '16px' : '4px',
                      background: isMe 
                        ? 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)' 
                        : (isGroupChat ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' : '#fff'),
                      color: isMe ? '#fff' : 'var(--foreground)',
                      fontSize: 13, lineHeight: 1.4,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      border: isMe ? 'none' : '1px solid var(--hairline)',
                      textAlign: 'left', wordBreak: 'break-word'
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
          onSubmit={handleSubmit}
          style={{ padding: '14px 16px', borderTop: '1px solid var(--hairline)', background: '#fff', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', gap: 10 }}
        >
          <input
            type="text"
            className="mushy-input"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1, margin: 0, borderRadius: '20px', minHeight: '38px', height: '38px', fontSize: '13px', padding: '0 16px' }}
          />
          <button
            type="submit"
            className="mushy-btn mushy-btn--primary"
            style={{
              minHeight: '38px', height: '38px', borderRadius: '50%', width: '38px',
              padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
            disabled={!input.trim()}
          >
            🚀
          </button>
        </form>
      </div>
    </div>
  );
}
