import React from 'react';
import ProfileEditor from '../components/ProfileEditor.jsx';

export default function ProfileScreen({
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
  return (
    <div className="tab-pane animated-fade-in">
      <div className="compact-tab-header">
        <div className="radar-pulse-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, width: 24, height: 24 }}>
          ⚙️
        </div>
        <div className="radar-text-wrapper" style={{ flex: 1 }}>
          <h4 className="compact-radar-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>Hồ sơ Connect</h4>
          <p className="compact-radar-sub" style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Điền thông tin và chọn sở thích để radar kết nối hoạt động</p>
        </div>
      </div>

      <section className="mushy-card">
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
          onSave={onSave}
        />
      </section>
    </div>
  );
}
