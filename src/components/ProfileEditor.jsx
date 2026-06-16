import React from 'react';
import { bridge } from '../lib/bridge.js';
import { TAXONOMY, highlightSearchText } from '../lib/app/taxonomy.jsx';

const AVAILABLE_TIMES = ['Giờ ăn trưa', 'Chiều sau giờ làm', 'Cuối tuần', 'Tối ngày thường'];
const SKILL_OPTIONS = ['JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 'Design', 'Marketing', 'Sales', 'Data Analysis', 'Public Speaking'];
const GOAL_OPTIONS = ['Tìm mentor', 'Trở thành mentor', 'Học công nghệ mới', 'Mở rộng network', 'Luyện kỹ năng mềm', 'Chuyển hướng nghề nghiệp'];
const CONNECT_TYPE_OPTIONS = [
  { code: 'food', label: '🍴 Ăn uống / Cafe' },
  { code: 'sport', label: '⚽ Thể thao' },
  { code: 'knowledge', label: '📖 Tri thức' },
  { code: 'casual', label: '💬 Tán gẫu' }
];

export default function ProfileEditor({
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
  onSave,
  onCancel,
  showCancel = false
}) {
  const filteredAccordionTaxonomy = React.useMemo(() => {
    if (!searchQuery.trim()) return TAXONOMY;
    const query = searchQuery.toLowerCase().trim();
    return TAXONOMY.map(parent => {
      const matchedChildren = parent.children.filter(c => c.name.toLowerCase().includes(query));
      if (matchedChildren.length > 0 || parent.parent_name.toLowerCase().includes(query)) {
        return {
          ...parent,
          children: matchedChildren.length > 0 ? matchedChildren : parent.children,
          isAutoExpanded: true
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  const toggleParentAccordion = (code) => {
    setExpandedParents(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleSelectTag = (code) => {
    bridge.haptic('light');
    setMyTags(prev => prev.includes(code) ? prev.filter(t => t !== code) : [...prev, code]);
  };

  const toggleAvailableTime = (time) => {
    setMyProfile(prev => ({
      ...prev,
      available_times: prev.available_times.includes(time)
        ? prev.available_times.filter(t => t !== time)
        : [...prev.available_times, time]
    }));
  };

  const toggleSkill = (skill, setter, current) => {
    bridge.haptic('light');
    setter(current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill]);
  };

  const toggleProfileArray = (key, value) => {
    bridge.haptic('light');
    setMyProfile(prev => {
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter(x => x !== value) : [...current, value]
      };
    });
  };

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <label className="mushy-label">Phòng ban trực thuộc (Department)</label>
        <input
          type="text"
          className="mushy-input"
          placeholder="Vd: Kỹ thuật (R&D), Kinh doanh, Nhân sự..."
          value={myProfile.department}
          onChange={(e) => setMyProfile(prev => ({ ...prev, department: e.target.value }))}
          required
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="mushy-label">Cơ sở làm việc (Facility)</label>
        <input
          type="text"
          className="mushy-input"
          placeholder="Vd: Cơ sở Hà Nội - Keangnam, Cơ sở Landmark 81..."
          value={myProfile.facility}
          onChange={(e) => setMyProfile(prev => ({ ...prev, facility: e.target.value }))}
          required
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label className="mushy-label">Khung giờ rảnh thông thường (Multi-select)</label>
        <div className="chips-container" style={{ marginTop: 6 }}>
          {AVAILABLE_TIMES.map(time => {
            const isSelected = myProfile.available_times.includes(time);
            return (
              <span
                key={time}
                className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                onClick={() => toggleAvailableTime(time)}
              >
                ⏰ {time}
              </span>
            );
          })}
        </div>
      </div>

      <ChipGroup
        title="Kỹ năng chuyên môn (Skills)"
        subtitle="Chọn các kỹ năng bạn có — dùng để match với người cùng chuyên môn"
        options={SKILL_OPTIONS}
        selected={mySkills}
        onToggle={(skill) => toggleSkill(skill, setMySkills, mySkills)}
        unselectedStyle={{ background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.2)', color: '#06B6D4' }}
        icon="🛠"
      />

      <ChipGroup
        title="Mục tiêu nghề nghiệp (Career Goals)"
        subtitle="Chọn mục tiêu bạn đang hướng tới — giúp kết nối với người cùng chí hướng"
        options={GOAL_OPTIONS}
        selected={myGoals}
        onToggle={(goal) => toggleSkill(goal, setMyGoals, myGoals)}
        unselectedStyle={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.2)', color: '#A855F7' }}
        icon="🎯"
      />

      <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
        <label className="mushy-label">Vai trò thành viên (User Roles)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
            <input
              type="checkbox"
              style={{ accentColor: 'var(--brand)' }}
              checked={!!myProfile.is_newbie}
              onChange={(e) => setMyProfile(prev => ({ ...prev, is_newbie: e.target.checked }))}
            />
            <span>Tôi là nhân viên mới (Intern / Onboard tuần đầu) 👶</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
            <input
              type="checkbox"
              style={{ accentColor: 'var(--brand)' }}
              checked={!!myProfile.is_buddy_helper}
              onChange={(e) => setMyProfile(prev => ({ ...prev, is_buddy_helper: e.target.checked }))}
            />
            <span>Tôi sẵn sàng hỗ trợ người mới làm quen môi trường 🤝</span>
          </label>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
        <label className="mushy-label">Ưu tiên hình thức kết nối (Connect Types)</label>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 8px' }}>Chọn các hoạt động bạn muốn giao lưu cùng đồng nghiệp</p>
        <div className="chips-container">
          {CONNECT_TYPE_OPTIONS.map(ct => {
            const isSelected = (myProfile.connect_types || []).includes(ct.code);
            return (
              <span
                key={ct.code}
                className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                onClick={() => toggleProfileArray('connect_types', ct.code)}
              >
                {ct.label}
              </span>
            );
          })}
        </div>
      </div>

      <ChipGroup
        title="Kỹ năng tôi có thể chia sẻ (Share Skills)"
        subtitle="Chọn kỹ năng bạn tự tin hướng dẫn, trao đổi cho đồng nghiệp"
        options={SKILL_OPTIONS}
        selected={myProfile.share_skills || []}
        onToggle={(skill) => toggleProfileArray('share_skills', skill)}
        unselectedStyle={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)', color: '#10B981' }}
        icon="📖"
      />

      <ChipGroup
        title="Kỹ năng tôi muốn học hỏi (Learn Skills)"
        subtitle="Chọn kỹ năng bạn đang muốn tìm hiểu hoặc cải thiện"
        options={SKILL_OPTIONS}
        selected={myProfile.learn_skills || []}
        onToggle={(skill) => toggleProfileArray('learn_skills', skill)}
        unselectedStyle={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)', color: '#D97706' }}
        icon="🎓"
      />

      <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Hệ thống thẻ sở thích (Tag Taxonomy - Accordion & Lọc Nhanh)</h4>
        <div className="search-box-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="mushy-input search-input"
            placeholder="Gõ từ khóa để lọc nhanh 200 Child Tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          {filteredAccordionTaxonomy.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>Không tìm thấy thẻ sở thích phù hợp.</p>
          ) : (
            filteredAccordionTaxonomy.map(parent => {
              const isOpen = expandedParents[parent.parent_code] || parent.isAutoExpanded;
              return (
                <div key={parent.parent_code} className="accordion-item">
                  <div
                    className="accordion-header"
                    onClick={() => toggleParentAccordion(parent.parent_code)}
                  >
                    <span>{highlightSearchText(parent.parent_name, searchQuery)}</span>
                    <span className={`accordion-icon ${isOpen ? 'accordion-icon--open' : ''}`}>▼</span>
                  </div>
                  {isOpen && (
                    <div className="accordion-content">
                      <div className="chips-container">
                        {parent.children.map(c => {
                          const isSelected = myTags.includes(c.code);
                          return (
                            <span
                              key={c.code}
                              className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
                              onClick={() => toggleSelectTag(c.code)}
                            >
                              {highlightSearchText(c.name, searchQuery)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="form-actions" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 14, marginTop: 14 }}>
        <button
          type="button"
          className="mushy-btn mushy-btn--primary mushy-btn--block"
          onClick={onSave}
        >
          Lưu hồ sơ Connect 🍄
        </button>
        {showCancel && (
          <button
            type="button"
            className="mushy-btn mushy-btn--ghost mushy-btn--block"
            style={{ marginTop: 12 }}
            onClick={onCancel}
          >
            Hủy
          </button>
        )}
      </div>
    </>
  );
}

function ChipGroup({ title, subtitle, options, selected, onToggle, unselectedStyle, icon }) {
  return (
    <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18, marginTop: 18 }}>
      <label className="mushy-label">{title}</label>
      {subtitle && <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 8px' }}>{subtitle}</p>}
      <div className="chips-container">
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <span
              key={option}
              className={`selectable-chip ${isSelected ? 'selectable-chip--selected' : ''}`}
              style={isSelected ? {} : unselectedStyle}
              onClick={() => onToggle(option)}
            >
              {icon ? `${icon} ${option}` : option}
            </span>
          );
        })}
      </div>
    </div>
  );
}
