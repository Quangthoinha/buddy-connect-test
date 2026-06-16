import React from 'react';
import ProfileEditor from './ProfileEditor.jsx';

export default function ProfileModal({
  open,
  onClose,
  myProfile,
  setMyProfile,
  mySkills,
  setMySkills,
  myGoals,
  setMyGoals,
  myTags,
  setMyTags,
  searchQuery,
  setSearchQuery,
  expandedParents,
  setExpandedParents,
  onSave
}) {
  if (!open) return null;

  return (
    <div className="modal-scrim dialog-scrim animated-fade-in" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 500, textAlign: 'left', display: 'flex', flexDirection: 'column', maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
          <h3 className="dialog-title" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚙️</span> Thiết lập Hồ sơ Connect
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          <p className="mushy-section-sub" style={{ margin: '0 0 16px' }}>
            Điền các thông tin hành chính chéo và chọn tối đa 200 thẻ sở thích được thiết kế dạng Accordion thả xuống tiện lợi.
          </p>

          <ProfileEditor
            myProfile={myProfile}
            setMyProfile={setMyProfile}
            mySkills={mySkills}
            setMySkills={setMySkills}
            myGoals={myGoals}
            setMyGoals={setMyGoals}
            myTags={myTags}
            setMyTags={setMyTags}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedParents={expandedParents}
            setExpandedParents={setExpandedParents}
            onSave={() => { onSave?.(); onClose?.(); }}
            onCancel={onClose}
            showCancel
          />
        </div>
      </div>
    </div>
  );
}
