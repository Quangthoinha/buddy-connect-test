import React from 'react';
import { bridge } from '../lib/bridge.js';
import { getConnectTypeLabel, formatName } from '../lib/app/connect.js';
import { getAvatarGradient } from '../lib/app/avatar.js';

export default function CreateCommunityModal({
  members,
  allProfiles = {},
  ctx,
  onCreate,
  onClose
}) {
  const [clubName, setClubName] = React.useState('');
  const [clubDesc, setClubDesc] = React.useState('');
  const [category, setCategory] = React.useState('casual');
  const [location, setLocation] = React.useState('Văn phòng');
  const [communityInvitedIds, setCommunityInvitedIds] = React.useState([]);

  function toggleCommunityInvite(userId) {
    setCommunityInvitedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!clubName.trim()) return;
    onCreate?.({
      club_name: clubName.trim(),
      club_description: clubDesc.trim(),
      child_code: category,
      location: location.trim()
    }, communityInvitedIds);
    onClose();
  }

  return (
    <div className="modal-scrim dialog-scrim animated-fade-in" onClick={onClose}>
      <form
        onSubmit={handleCreateSubmit}
        className="modal-card dialog-card form-slide-down"
        style={{ maxWidth: 400, textAlign: 'left', display: 'flex', flexDirection: 'column', maxHeight: '80dvh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
          <h3 className="dialog-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontWeight: 800 }}>
            <span>👥</span> Tạo Cộng đồng mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 4, paddingBottom: 10 }}>
          <div>
            <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '13px', fontWeight: '700' }}>Tên Cộng đồng</label>
            <input
              type="text"
              className="mushy-input"
              placeholder="Vd: CLB Chạy bộ Keangnam..."
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              maxLength={200}
              style={{ minHeight: '36px', height: '36px', fontSize: '13px', padding: '0 12px' }}
            />
          </div>

          <div>
            <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '13px', fontWeight: '700' }}>Mô tả ngắn</label>
            <textarea
              className="mushy-input"
              rows={3}
              placeholder="Giới thiệu mục tiêu, lịch sinh hoạt của cộng đồng..."
              value={clubDesc}
              onChange={(e) => setClubDesc(e.target.value)}
              maxLength={1000}
              style={{ fontSize: '12.5px', padding: '8px 10px', minHeight: '60px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '13px', fontWeight: '700' }}>Chủ đề chính</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mushy-input"
                style={{ minHeight: '36px', height: '36px', fontSize: '13px', padding: '0 8px', width: '100%' }}
              >
                <option value="food">🍴 Ăn uống</option>
                <option value="sport">⚽ Thể thao</option>
                <option value="knowledge">📖 Tri thức</option>
                <option value="casual">💬 Tán gẫu</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '13px', fontWeight: '700' }}>📍 Địa điểm mặc định</label>
              <input
                type="text"
                className="mushy-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                maxLength={200}
                style={{ minHeight: '36px', height: '36px', fontSize: '13px', padding: '0 8px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label className="mushy-label" style={{ marginBottom: 6, display: 'block', fontSize: '13px', fontWeight: '700' }}>
              ➕ Mời thành viên ngay ({communityInvitedIds.length})
            </label>
            {communityInvitedIds.length > 0 && (
              <div className="chips-container" style={{ marginBottom: 8, gap: '6px' }}>
                {communityInvitedIds.map(uid => {
                  const m = members.find(item => item.user_id === uid);
                  if (!m) return null;
                  return (
                    <span
                      key={uid}
                      className="selectable-chip selectable-chip--selected"
                      style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      onClick={() => toggleCommunityInvite(uid)}
                    >
                      {formatName(m)} ✕
                    </span>
                  );
                })}
              </div>
            )}
            <div style={{
              maxHeight: '160px',
              overflowY: 'auto',
              border: '1px solid var(--hairline)',
              borderRadius: '16px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: '#F8FAFC'
            }}>
              {members.filter(m => {
                const name = m.full_name?.trim();
                const hasValidName = name && name !== '.';
                const email = m.work_email || m.personal_email;
                const hasValidEmail = email && typeof email === 'string' && email.includes('@');
                if (!hasValidName && !hasValidEmail) return false;
                return m.user_id !== ctx.userId;
              }).map(m => {
                const isSelected = communityInvitedIds.includes(m.user_id);
                const prof = allProfiles?.[m.user_id] || {};
                const name = formatName(m);
                return (
                  <div
                    key={m.user_id}
                    onClick={() => toggleCommunityInvite(m.user_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(13, 148, 136, 0.15)' : 'transparent'}`,
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
                        <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#0d9488' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      border: `1.5px solid ${isSelected ? '#0d9488' : 'rgba(0,0,0,0.12)'}`,
                      background: isSelected ? '#0d9488' : 'transparent',
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
        </div>

        {/* Footer Buttons (Fixed) */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
          <button
            type="button"
            className="mushy-btn"
            style={{ flex: 1, minHeight: '38px', height: '38px', fontSize: '13px', borderColor: 'var(--hairline)', background: 'transparent', color: 'var(--ink)' }}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="mushy-btn mushy-btn--primary"
            style={{ flex: 2, minHeight: '38px', height: '38px', fontSize: '13px', fontWeight: '700', background: '#0d9488', borderColor: '#0d9488' }}
            disabled={!clubName.trim()}
          >
            Tạo Cộng đồng
          </button>
        </div>
      </form>
    </div>
  );
}
