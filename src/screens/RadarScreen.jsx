import React from 'react';
import { bridge } from '../lib/bridge.js';
import { getAvatarGradient } from '../lib/app/avatar.js';
import { buildMatchReason } from '../lib/app/matching.js';
import NewbieRoadmap from '../components/NewbieRoadmap.jsx';
import { formatName } from '../lib/app/connect.js';

const RADAR_PAGE_SIZE = 10;

export default function RadarScreen({
  hasProfile,
  myProfile,
  mySkills,
  myGoals,
  myTags,
  searchQuery,
  fallbackEnabled,
  scope,
  rankedCandidates,
  newbiePrimaryBuddy,
  hasConnectedPrimaryBuddy,
  hasMetPrimaryBuddy,
  serverMatchReasons,
  radarPage,
  onSearchChange,
  onToggleFallback,
  onOpenProfile,
  onOpenInvite,
  onOpenConnectSheet,
  onScheduleMeetWithBuddy,
  onPageChange
}) {
  const totalPages = Math.ceil(rankedCandidates.length / RADAR_PAGE_SIZE);
  const paginatedCandidates = rankedCandidates.slice((radarPage - 1) * RADAR_PAGE_SIZE, radarPage * RADAR_PAGE_SIZE);

  return (
    <div className="tab-pane animated-fade-in">
      {!hasProfile ? (
        <section className="mushy-card" style={{ textAlign: 'center', padding: '30px 18px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛰️</div>
          <h3 className="mushy-section-title" style={{ justifyContent: 'center' }}>Chưa thiết lập hồ sơ Connect</h3>
          <p className="mushy-section-sub">
            Nhập phòng ban, cơ sở và các thẻ sở thích dạng Accordion để khởi động radar xếp hạng ưu tiên chéo cực đỉnh nào!
          </p>
          <button className="mushy-btn mushy-btn--primary" onClick={() => { bridge.haptic('light'); onOpenProfile?.(); }}>
            Tạo Hồ Sơ Ngay
          </button>
        </section>
      ) : (
        <>
          <div className="compact-radar-header">
            <div className="radar-pulse-wrapper">
              <div className="radar-pulse-dot"></div>
              <div className="radar-pulse-ring"></div>
            </div>
            <div className="radar-text-wrapper">
              <h4 className="compact-radar-title">Connect Radar đang quét...</h4>
              <p className="compact-radar-sub">
                Khớp chéo sở thích trong tổ chức <strong>{scope.label}</strong>
              </p>
            </div>
            <div className="compact-radar-action">
              <label className="fallback-toggle-label" title="Cho phép gợi ý bộ môn cùng nhóm khi thiếu người">
                <input
                  type="checkbox"
                  checked={fallbackEnabled}
                  onChange={(e) => onToggleFallback?.(e.target.checked)}
                  className="fallback-checkbox-hidden"
                />
                <span className={`fallback-toggle-btn ${fallbackEnabled ? 'active' : ''}`}>
                  {fallbackEnabled ? '💡 Gợi ý bật' : '💡 Gợi ý tắt'}
                </span>
              </label>
            </div>
          </div>

          <div className="search-box-container" style={{ marginBottom: 14 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="mushy-input search-input"
              placeholder="Tìm đồng nghiệp theo tên, phòng ban, sở thích..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            )}
          </div>

          <NewbieRoadmap
            myProfile={myProfile}
            hasProfile={hasProfile}
            mySkills={mySkills}
            myTags={myTags}
            hasConnectedPrimaryBuddy={hasConnectedPrimaryBuddy}
            hasMetPrimaryBuddy={hasMetPrimaryBuddy}
            newbiePrimaryBuddy={newbiePrimaryBuddy}
            onSetupProfile={onOpenProfile}
            onScheduleMeetWithBuddy={onScheduleMeetWithBuddy}
          />

          {newbiePrimaryBuddy && <PrimaryBuddyCard buddy={newbiePrimaryBuddy} onScheduleMeet={() => onScheduleMeetWithBuddy?.(newbiePrimaryBuddy.member.user_id)} />}

          {rankedCandidates.length > 0 && (
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10, textAlign: 'right' }}>
              Tìm thấy <strong>{rankedCandidates.length}</strong> đồng nghiệp phù hợp
            </p>
          )}

          {rankedCandidates.length === 0 ? (
            <div className="mushy-empty-state animated-fade-in">
              <div className="mushy-empty-icon">🛰️</div>
              <h4 className="mushy-empty-title">Radar chưa quét thấy ai</h4>
              <p className="mushy-empty-desc">Không tìm thấy đồng nghiệp nào trùng thẻ sở thích với bạn. Hãy thử đổi sở thích hoặc chia sẻ workspace nhé!</p>
            </div>
          ) : (
            <>
              {paginatedCandidates.map((candidate) => (
                <BuddyCard
                  key={candidate.member.user_id}
                  candidate={candidate}
                  myProfile={myProfile}
                  mySkills={mySkills}
                  myGoals={myGoals}
                  serverReasons={serverMatchReasons[candidate.member.user_id]}
                  onOpenInvite={() => onOpenInvite?.(candidate.member.user_id, 'food')}
                  onOpenConnectSheet={() => onOpenConnectSheet?.(candidate.member)}
                />
              ))}

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 10 }}>
                  <button
                    type="button"
                    className="mushy-btn mushy-btn--ghost"
                    disabled={radarPage === 1}
                    onClick={() => { bridge.haptic('light'); onPageChange?.(Math.max(1, radarPage - 1)); }}
                    style={{ padding: '6px 14px', minHeight: 34, height: 34, fontSize: 12.5 }}
                  >
                    ◀ Trước
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    Trang {radarPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="mushy-btn mushy-btn--ghost"
                    disabled={radarPage === totalPages}
                    onClick={() => { bridge.haptic('light'); onPageChange?.(Math.min(totalPages, radarPage + 1)); }}
                    style={{ padding: '6px 14px', minHeight: 34, height: 34, fontSize: 12.5 }}
                  >
                    Sau ▶
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function PrimaryBuddyCard({ buddy, onScheduleMeet }) {
  const { member, profile, matchScore } = buddy;
  return (
    <section className="mushy-card newbie-buddy-card" style={{
      background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      border: '1.5px solid #FCD34D',
      borderRadius: '20px',
      padding: '16px 20px',
      marginBottom: '16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          color: '#D97706',
          background: '#FEF3C7',
          padding: '3px 8px',
          borderRadius: '8px',
          border: '1px solid #FCD34D',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          🌟 Buddy cho tuần đầu
        </span>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#D97706' }}>
          {matchScore}% Match
        </span>
      </div>

      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: getAvatarGradient(formatName(member).charAt(0)),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#fff',
          boxShadow: '0 4px 10px rgba(217, 119, 6, 0.15)',
          flexShrink: 0
        }}>
          {formatName(member).charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: '#1F2937' }}>
            {formatName(member)}
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#4B5563' }}>
            🏢 {profile.department} · 📍 {profile.facility}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#D97706', fontStyle: 'italic' }}>
            💡 Sẵn sàng hướng dẫn bạn làm quen môi trường làm việc mới!
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid rgba(245, 158, 11, 0.15)', paddingTop: '12px' }}>
        <button
          className="mushy-btn mushy-btn--primary"
          style={{
            flex: 1,
            minHeight: '34px',
            height: '34px',
            fontSize: '12.5px',
            background: '#D97706',
            borderColor: '#D97706',
            color: '#fff',
            fontWeight: '800'
          }}
          onClick={() => { bridge.haptic('light'); onScheduleMeet?.(); }}
        >
          📅 Đặt lịch làm quen tuần đầu
        </button>
      </div>
    </section>
  );
}

function BuddyCard({ candidate, myProfile, mySkills, myGoals, serverReasons, onOpenInvite, onOpenConnectSheet }) {
  const { member, profile, tags, exactMatches, sharedParents, priority, isFallback, fallbackParentLabel, matchScore, hasInteracted } = candidate;

  const clientReason = buildMatchReason({
    myProfile,
    mySkills,
    myGoals,
    member,
    profile,
    exactMatches,
    sharedParents,
    hasInteracted
  });
  const displayReason = serverReasons?.length > 0 ? serverReasons.join(' · ') : clientReason;

  const myShare = myProfile.share_skills || [];
  const myLearn = myProfile.learn_skills || [];
  const theirShare = profile.share_skills || [];
  const theirLearn = profile.learn_skills || [];
  const commonLearnSkills = myLearn.filter(s => theirShare.includes(s));
  const commonShareSkills = myShare.filter(s => theirLearn.includes(s));

  return (
    <section
      className="buddy-card-compact"
      style={{ cursor: 'pointer' }}
      onClick={onOpenInvite}
    >
      <div className="buddy-card-main">
        <div className="buddy-avatar-compact">
          <span>{formatName(member).charAt(0)}</span>
        </div>

        <div className="buddy-body-compact">
          <div className="buddy-header-row">
            <h4 className="buddy-name-compact">{formatName(member)}</h4>
            <span className={`buddy-match-badge ${matchScore >= 80 ? 'buddy-match-badge--premium' : ''}`}>
              {matchScore >= 80 ? '✨ ' : ''}{matchScore}% Match
            </span>
          </div>

          <div className="buddy-meta-row">
            <span className="buddy-dept">{profile.department || 'Phòng ban'}</span>
            <span className="buddy-dot-separator">·</span>
            <span className="buddy-facility">{profile.facility || 'Cơ sở'}</span>
          </div>

          {displayReason && <p className="buddy-reason-text">💡 {displayReason}</p>}

          <p className="buddy-time-text">
            🕒 Rảnh: {profile.available_times?.join(', ') || 'Chưa cập nhật'}
          </p>

          <div className="buddy-labels-row">
            {priority === 1 ? (
              <span className="buddy-status-pill priority-high">🔥 Khác phòng ban</span>
            ) : priority === 2 ? (
              <span className="buddy-status-pill priority-same">👥 Cùng phòng ban</span>
            ) : hasInteracted ? (
              <span className="buddy-status-pill priority-interacted">⇆ Đã tương tác</span>
            ) : isFallback ? (
              <span className="buddy-status-pill priority-fallback">💡 Gợi ý nhóm {fallbackParentLabel}</span>
            ) : null}

            {exactMatches.slice(0, 3).map(tag => (
              <span
                key={tag.code}
                className="buddy-tag-compact"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); bridge.haptic('light'); onOpenInvite?.(); }}
                title={`Rủ nhanh ${formatName(member)} cùng chơi ${tag.name}`}
              >
                ❤️ {tag.name}
              </span>
            ))}
          </div>

          {(commonLearnSkills.length > 0 || commonShareSkills.length > 0) && (
            <div className="buddy-labels-row" style={{ marginTop: 6, gap: '4px' }}>
              {commonLearnSkills.map(s => (
                <span key={`learn-${s}`} className="buddy-status-pill priority-fallback" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', color: '#10B981', fontSize: '10.5px', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  📖 Muốn học: {s} (họ chia sẻ)
                </span>
              ))}
              {commonShareSkills.map(s => (
                <span key={`share-${s}`} className="buddy-status-pill priority-fallback" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', color: '#D97706', fontSize: '10.5px', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  🎓 Có thể dạy: {s} (họ muốn học)
                </span>
              ))}
            </div>
          )}

          {profile.skills?.length > 0 && (
            <div className="buddy-labels-row" style={{ marginTop: 4 }}>
              {profile.skills.slice(0, 3).map(s => (
                <span key={s} className="buddy-tag-compact buddy-tag-skill">🛠 {s}</span>
              ))}
            </div>
          )}

          {profile.career_goals?.length > 0 && (
            <p className="buddy-time-text" style={{ color: '#A855F7' }}>
              🎯 {profile.career_goals.slice(0, 2).join(' · ')}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              className="mushy-btn"
              style={{
                fontSize: '11.5px',
                fontWeight: '800',
                padding: '4px 14px',
                background: 'rgba(230, 57, 70, 0.08)',
                color: 'var(--brand)',
                border: '1px solid rgba(230, 57, 70, 0.15)',
                borderRadius: '12px',
                minHeight: '28px',
                height: '28px',
                cursor: 'pointer'
              }}
              onClick={(e) => { e.stopPropagation(); bridge.haptic('light'); onOpenConnectSheet?.(); }}
            >
              🤝 Gửi lời mời
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
