import React from 'react';
import { bridge } from '../lib/bridge.js';
import { getConnectTypeLabel, getConnectTypeTemplate, formatName } from '../lib/app/connect.js';
import { getAvatarGradient } from '../lib/app/avatar.js';

export default function InviteModal({
  members,
  allProfiles = {},
  selectedUserIds,
  setSelectedUserIds,
  inviteType,
  setInviteType,
  inviteTime,
  setInviteTime,
  inviteLocation,
  setInviteLocation,
  inviteMessage,
  setInviteMessage,
  onSend,
  onClose
}) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredMembers = members.filter(m => {
    const name = m.full_name?.trim();
    if (!name || name === '.') return false;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  function toggleUser(userId) {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  function handleTypeChange(type) {
    setInviteType(type);
    const currentDefaultMsg = getConnectTypeTemplate(inviteType);
    if (!inviteMessage || inviteMessage === currentDefaultMsg) {
      setInviteMessage(getConnectTypeTemplate(type));
    }
  }

  return (
    <div className="modal-scrim dialog-scrim animated-fade-in" onClick={onClose}>
      <div
        className="modal-card dialog-card form-slide-down"
        style={{ maxWidth: 440, textAlign: 'left', display: 'flex', flexDirection: 'column', maxHeight: '85dvh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
          <h3 className="dialog-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontWeight: 800 }}>
            <span>🤝</span> Gửi lời mời kết nối mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4, paddingBottom: 10 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '13px', fontWeight: '700' }}>
              Đồng nghiệp nhận lời mời ({selectedUserIds.length})
            </label>

            {selectedUserIds.length > 0 && (
              <div className="chips-container" style={{ maxHeight: '80px', overflowY: 'auto', gap: '6px', marginBottom: '8px', padding: '4px', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '8px', background: '#F8FAFC' }}>
                {selectedUserIds.map(uid => {
                  const m = members.find(item => item.user_id === uid);
                  if (!m) return null;
                  return (
                    <span
                      key={uid}
                      className="selectable-chip selectable-chip--selected"
                      style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => toggleUser(uid)}
                    >
                      {formatName(m.full_name)} ✕
                    </span>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              className="mushy-input"
              placeholder="🔍 Tìm tên đồng nghiệp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: '8px', minHeight: '36px', height: '36px', fontSize: '12.5px', padding: '0 12px' }}
            />

            <div style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--hairline)',
              borderRadius: '16px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: '#F8FAFC'
            }}>
              {filteredMembers.map(m => {
                const isSelected = selectedUserIds.includes(m.user_id);
                const prof = allProfiles[m.user_id] || {};
                const name = formatName(m.full_name);
                return (
                  <div
                    key={m.user_id}
                    onClick={() => toggleUser(m.user_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: isSelected ? 'var(--brand-soft)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(230, 57, 70, 0.15)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: getAvatarGradient(name.charAt(0)),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {name.charAt(0)}
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? 'var(--brand)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prof.department || 'Đồng nghiệp'} · {prof.facility || 'Cơ sở'}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isSelected ? 'var(--brand)' : 'rgba(0,0,0,0.12)'}`,
                      background: isSelected ? 'var(--brand)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      transition: 'all 0.2s'
                    }}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '13px', fontWeight: '700' }}>Hình thức kết nối</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {[
                { code: 'food', label: '🍴 Ăn trưa' },
                { code: 'sport', label: '⚽ Thể thao' },
                { code: 'knowledge', label: '📖 Tri thức' },
                { code: 'casual', label: '💬 Tán gẫu' }
              ].map(type => (
                <button
                  key={type.code}
                  type="button"
                  onClick={() => handleTypeChange(type.code)}
                  style={{
                    padding: '8px 2px',
                    fontSize: '11px',
                    fontWeight: '800',
                    borderRadius: '10px',
                    border: inviteType === type.code ? '1.5px solid var(--brand)' : '1px solid var(--hairline)',
                    background: inviteType === type.code ? 'var(--brand-soft)' : '#fff',
                    color: inviteType === type.code ? 'var(--brand)' : 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '12px', fontWeight: '700' }}>⏰ Thời gian hẹn</label>
              <input
                type="datetime-local"
                className="mushy-input"
                value={inviteTime}
                onChange={(e) => setInviteTime(e.target.value)}
                required
                style={{ minHeight: '36px', height: '36px', fontSize: '12.5px', padding: '0 8px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '12px', fontWeight: '700' }}>📍 Địa điểm</label>
              <input
                type="text"
                className="mushy-input"
                placeholder="Vd: Keangnam, Lotte..."
                value={inviteLocation}
                onChange={(e) => setInviteLocation(e.target.value)}
                required
                style={{ minHeight: '36px', height: '36px', fontSize: '12.5px', padding: '0 8px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '12.5px', fontWeight: '700' }}>💬 Lời nhắn</label>
            <textarea
              className="mushy-input"
              rows={2}
              placeholder="Nhập lời nhắn rủ..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              style={{ fontSize: '12.5px', padding: '8px 10px', minHeight: '52px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--hairline)', paddingTop: '12px' }}>
            <button
              type="button"
              className="mushy-btn"
              style={{
                flex: 1,
                minHeight: '38px',
                height: '38px',
                fontSize: '12.5px',
                borderColor: 'var(--hairline)',
                background: 'transparent',
                color: 'var(--ink)',
                fontWeight: '600'
              }}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="button"
              className="mushy-btn mushy-btn--primary"
              style={{
                flex: 2,
                minHeight: '38px',
                height: '38px',
                fontSize: '12.5px',
                fontWeight: '700',
                background: 'var(--brand)',
                borderColor: 'var(--brand)',
                color: '#fff'
              }}
              disabled={selectedUserIds.length === 0 || !inviteTime || !inviteLocation.trim()}
              onClick={() => { bridge.haptic('medium'); onSend?.(); }}
            >
              Gửi lời mời
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
