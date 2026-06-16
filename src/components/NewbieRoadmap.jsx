import React from 'react';
import { bridge } from '../lib/bridge.js';
import { getConnectTypeTemplate } from '../lib/app/connect.js';

export default function NewbieRoadmap({
  myProfile,
  hasProfile,
  hasConnectedPrimaryBuddy,
  hasMetPrimaryBuddy,
  newbiePrimaryBuddy,
  onSetupProfile,
  onScheduleMeetWithBuddy
}) {
  if (!myProfile?.is_newbie) return null;

  const step1 = true;
  const step2 = hasProfile && myProfile.department && myProfile.facility && (myProfile.tags?.length > 0 || myProfile.skills?.length > 0);
  const step3 = hasConnectedPrimaryBuddy;
  const step4 = hasMetPrimaryBuddy;

  const progressPercentage = [step1, step2, step3, step4].filter(Boolean).length * 25;

  return (
    <div className="newbie-roadmap-widget" style={{
      background: 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(16px)',
      border: '1.5px solid rgba(230, 57, 70, 0.1)',
      borderRadius: '20px',
      padding: '16px 18px',
      marginBottom: '16px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🌱 Hành Trình Tuần Đầu Của Bạn ({progressPercentage}%)
        </span>
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>
          Dành riêng cho Newbie
        </span>
      </div>

      <div style={{ width: '100%', height: '6px', background: 'rgba(15, 15, 18, 0.04)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand) 0%, var(--pink) 100%)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <StepRow done={step1} label="1. Đồng ý tham gia cộng đồng Connect" />

        <StepRow done={step2} label="2. Thiết lập hồ sơ & sở thích">
          {!step2 && (
            <button
              type="button"
              className="mushy-btn mushy-btn--ghost"
              style={{ padding: '2px 8px', fontSize: '10.5px', minHeight: '24px', height: '24px', borderRadius: '8px' }}
              onClick={() => { bridge.haptic('light'); onSetupProfile?.(); }}
            >
              Cài đặt
            </button>
          )}
        </StepRow>

        <StepRow done={step3} label="3. Đặt lịch hẹn làm quen với Primary Buddy">
          {!step3 && newbiePrimaryBuddy && (
            <button
              type="button"
              className="mushy-btn"
              style={{
                padding: '2px 8px', fontSize: '10.5px', minHeight: '24px', height: '24px', borderRadius: '8px',
                color: '#fff', background: '#D97706', borderColor: '#D97706', fontWeight: '700'
              }}
              onClick={() => {
                bridge.haptic('light');
                onScheduleMeetWithBuddy?.(newbiePrimaryBuddy.member.user_id);
              }}
            >
              Đặt lịch
            </button>
          )}
        </StepRow>

        <StepRow done={step4} label="4. Hoàn thành cuộc gặp & Tích lũy 15 điểm thưởng" />
      </div>
    </div>
  );
}

function StepRow({ done, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '14px', color: done ? 'var(--brand)' : 'var(--muted)', opacity: done ? 1 : 0.4 }}>
        {done ? '✅' : '⚪'}
      </span>
      <span style={{
        fontSize: '12.5px',
        color: done ? 'var(--ink)' : 'var(--muted)',
        fontWeight: done ? '600' : 'normal',
        flex: 1,
        textAlign: 'left'
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}
