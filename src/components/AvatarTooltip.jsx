import React from 'react';
import { getAvatarGradient } from '../lib/app/avatar.js';

export default function AvatarTooltip({ member, profile, onClose, onConnect }) {
  if (!member) return null;

  return (
    <div
      onClick={onClose}
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
            background: getAvatarGradient(member.full_name?.charAt(0)),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(15,15,18,0.15)'
          }}>
            {member.full_name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', lineHeight: 1.3 }}>
              {member.full_name}
            </div>
            {member.work_phone && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                📞 {member.work_phone}
              </div>
            )}
          </div>
        </div>

        {/* Detail rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profile?.department && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, minWidth: 20 }}>🏢</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phòng ban</div>
                <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, marginTop: 1 }}>{profile.department}</div>
              </div>
            </div>
          )}
          {profile?.facility && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, minWidth: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cơ sở</div>
                <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, marginTop: 1 }}>{profile.facility}</div>
              </div>
            </div>
          )}
          {profile?.available_times?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, minWidth: 20 }}>🕐</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Khung giờ rảnh</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {profile.available_times.map(t => (
                    <span key={t} style={{
                      fontSize: 11, background: 'var(--brand-soft)', color: 'var(--brand)',
                      borderRadius: 8, padding: '2px 8px', fontWeight: 600
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!profile && (
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '4px 0' }}>
              Chưa có hồ sơ chi tiết
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: '1.5px solid var(--border)',
              background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => { onConnect?.(member); onClose?.(); }}
            style={{
              flex: 2, padding: '10px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--brand) 0%, var(--pink) 100%)',
              color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            🤝 Kết nối nhanh
          </button>
        </div>
      </div>
    </div>
  );
}
