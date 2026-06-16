import React, { useEffect, useState } from 'react';
import { getConnectTypeLabel } from '../lib/app/connect.js';
import { parseChatMessages } from '../lib/app/chat.js';

export default function ChatModal({ connection, members, ctx, onClose, onSend }) {
  const [input, setInput] = useState('');

  if (!connection || !ctx) return null;

  const buddyId = connection.from_user_id === ctx.userId ? connection.to_user_id : connection.from_user_id;
  const buddyMember = members.find(m => m.user_id === buddyId) || { full_name: 'Đồng nghiệp' };
  const messages = parseChatMessages(connection.chat_messages);
  const actionLabel = getConnectTypeLabel(connection.action_type);

  useEffect(() => {
    setTimeout(() => {
      const el = document.getElementById('mushy-chat-messages-container');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }, [connection, messages.length]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend?.(connection.id, input.trim());
    setInput('');
  }

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
          background: 'linear-gradient(135deg, rgba(255, 240, 242, 0.8) 0%, rgba(255, 229, 233, 0.8) 100%)',
          borderTopLeftRadius: '24px', borderTopRightRadius: '24px'
        }}>
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
                      background: isMe ? 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)' : '#fff',
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
