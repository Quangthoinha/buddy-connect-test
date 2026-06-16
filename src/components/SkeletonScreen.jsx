import React from 'react';

export default function SkeletonScreen() {
  return (
    <div className="skeleton-container animated-fade-in" style={{ padding: '0 4px' }}>
      {/* Skeleton Radar Header */}
      <div className="compact-radar-header" style={{ borderStyle: 'solid', borderColor: 'rgba(15,15,18,0.04)', background: 'rgba(255,255,255,0.4)', pointerEvents: 'none', marginBottom: 14 }}>
        <div className="mushy-skeleton" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="mushy-skeleton" style={{ width: '40%', height: 14, marginBottom: 6 }} />
          <div className="mushy-skeleton" style={{ width: '60%', height: 10 }} />
        </div>
      </div>

      {/* Skeleton Search */}
      <div className="mushy-skeleton" style={{ width: '100%', height: 44, borderRadius: 12, marginBottom: 14 }} />

      {/* Card Skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="buddy-card-compact" style={{ opacity: 1 - i * 0.18, borderStyle: 'solid', borderColor: 'rgba(15,15,18,0.03)', pointerEvents: 'none', marginBottom: 12 }}>
          <div className="buddy-card-main">
            {/* Circle avatar */}
            <div className="mushy-skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
            <div className="buddy-body-compact" style={{ flex: 1 }}>
              <div className="buddy-header-row" style={{ marginBottom: 6 }}>
                {/* Name */}
                <div className="mushy-skeleton" style={{ width: '35%', height: 14 }} />
                {/* Match percentage badge */}
                <div className="mushy-skeleton" style={{ width: 45, height: 16, borderRadius: 999 }} />
              </div>
              {/* Department & Facility */}
              <div className="mushy-skeleton" style={{ width: '55%', height: 10, marginBottom: 10 }} />
              {/* Available time */}
              <div className="mushy-skeleton" style={{ width: '70%', height: 10, marginBottom: 8 }} />
              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <div className="mushy-skeleton" style={{ width: 50, height: 16, borderRadius: 999 }} />
                <div className="mushy-skeleton" style={{ width: 65, height: 16, borderRadius: 999 }} />
                <div className="mushy-skeleton" style={{ width: 40, height: 16, borderRadius: 999 }} />
              </div>
            </div>
          </div>
          {/* Bottom buttons */}
          <div className="buddy-actions-compact" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(15,15,18,0.04)', marginTop: 12, paddingTop: 10 }}>
            <div className="mushy-skeleton" style={{ width: 30, height: 30, borderRadius: '50%' }} />
            <div className="mushy-skeleton" style={{ width: 90, height: 30, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
