import { TAXONOMY } from './taxonomy.jsx';

export function buildMatchReason({
  myProfile,
  mySkills,
  myGoals,
  member,
  profile,
  exactMatches,
  sharedParents,
  hasInteracted
}) {
  const parts = [];

  if (exactMatches.length > 0) {
    parts.push(`đều thích ${exactMatches[0].name}`);
  } else if (sharedParents.length > 0) {
    const parentObj = TAXONOMY.find(p => p.parent_code === sharedParents[0]);
    if (parentObj) parts.push(`đều quan tâm nhóm ${parentObj.parent_name}`);
  }

  const mySkillSet = new Set(mySkills);
  const commonSkills = (profile.skills || []).filter(s => mySkillSet.has(s));
  if (commonSkills.length > 0 && parts.length === 0) {
    parts.push(`đều có kỹ năng ${commonSkills[0]}`);
  }

  const myGoalSet = new Set(myGoals);
  const commonGoals = (profile.career_goals || []).filter(g => myGoalSet.has(g));
  if (commonGoals.length > 0 && parts.length === 0) {
    parts.push(`đều hướng tới "${commonGoals[0]}"`);
  }

  if (!hasInteracted && parts.length > 0) parts.push('chưa từng tương tác');
  if (profile.facility && profile.facility === myProfile.facility) {
    parts.push(`cùng cơ sở ${myProfile.facility}`);
  }

  if (parts.length === 0) return null;
  return `Bạn và ${member.full_name} ${parts.join(' và ')}.`;
}
