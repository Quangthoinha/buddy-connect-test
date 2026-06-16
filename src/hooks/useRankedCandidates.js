import { useMemo } from 'react';
import { FLAT_TAGS, TAXONOMY } from '../lib/app/taxonomy.jsx';

export function useRankedCandidates({
  hasProfile,
  myProfile,
  myTags,
  mySkills,
  myGoals,
  members,
  allProfiles,
  allUserTags,
  interactionHistory,
  connectionRequests,
  connectionMeetings,
  fallbackEnabled,
  searchQuery,
  ctx
}) {
  const helperNewbieCounts = useMemo(() => {
    const counts = {};
    connectionRequests.forEach(req => {
      if (req.status === 'pending' || req.status === 'accepted') {
        const senderProfile = allProfiles[req.from_user_id];
        if (senderProfile && senderProfile.is_newbie) {
          counts[req.to_user_id] = (counts[req.to_user_id] || 0) + 1;
        }
      }
    });
    return counts;
  }, [connectionRequests, allProfiles]);

  const rankedCandidates = useMemo(() => {
    if (!hasProfile) return [];

    const myInterests = myTags || [];
    const q = searchQuery.trim().toLowerCase();

    return members
      .map(member => {
        const profile = allProfiles[member.user_id] || {};
        // Compliance: skip candidates who have not granted onboarding consent
        if (!profile.consent_granted_at) return null;

        const tags = allUserTags[member.user_id] || [];

        // Apply search query filter if present
        if (q) {
          const nameMatch = member.full_name?.toLowerCase().includes(q);
          const deptMatch = profile.department?.toLowerCase().includes(q);
          const facMatch = profile.facility?.toLowerCase().includes(q);

          const tagMatches = tags.some(code => {
            const tagObj = FLAT_TAGS.find(t => t.code === code);
            const tagName = tagObj?.name?.toLowerCase();
            const parentName = tagObj?.parent_name?.toLowerCase();
            return tagName?.includes(q) || parentName?.includes(q);
          });

          if (!nameMatch && !deptMatch && !facMatch && !tagMatches) {
            return null;
          }
        }

        // Check exact child tag overlap
        const exactMatches = myInterests.filter(code => tags.includes(code));
        const matchedChildObjects = exactMatches.map(code => FLAT_TAGS.find(t => t.code === code)).filter(Boolean);

        // Check parent tag overlap for fallback suggesting
        const myParentCodes = myInterests.map(code => FLAT_TAGS.find(t => t.code === code)?.parent_code).filter(Boolean);
        const memberParentCodes = tags.map(code => FLAT_TAGS.find(t => t.code === code)?.parent_code).filter(Boolean);
        const sharedParents = myParentCodes.filter(p => memberParentCodes.includes(p));

        // Check interaction history
        const hasInteracted = interactionHistory.some(h =>
          (h.user_id_1 === ctx.userId && h.user_id_2 === member.user_id) ||
          (h.user_id_1 === member.user_id && h.user_id_2 === ctx.userId)
        );

        // Priority calculation
        let priority = 3;
        let exactMatchCount = exactMatches.length;
        let isFallback = false;
        let fallbackParentLabel = '';

        if (exactMatchCount > 0) {
          const differentDept = profile.department !== myProfile.department;
          if (differentDept && !hasInteracted) {
            priority = 1;
          } else if (!differentDept && !hasInteracted) {
            priority = 2;
          }
        } else if (fallbackEnabled && sharedParents.length > 0) {
          isFallback = true;
          const matchedParentObj = TAXONOMY.find(p => p.parent_code === sharedParents[0]);
          fallbackParentLabel = matchedParentObj ? matchedParentObj.parent_name : '';
        }

        if (exactMatchCount === 0 && !isFallback) return null;

        let matchScore = 30;
        matchScore += exactMatchCount * 25;
        matchScore += sharedParents.length * 10;
        if (profile.facility === myProfile.facility) matchScore += 15;

        const commonSkills = (mySkills || []).filter(s =>
          (profile.skills || []).map(sk => sk.toLowerCase()).includes(s.toLowerCase())
        );
        matchScore += commonSkills.length * 10;

        const commonGoals = (myGoals || []).filter(g =>
          (profile.career_goals || []).map(gk => gk.toLowerCase()).includes(g.toLowerCase())
        );
        matchScore += commonGoals.length * 10;

        if (myProfile.is_newbie && profile.is_buddy_helper) {
          matchScore += 30;
        }

        const commonConnectTypes = (myProfile.connect_types || []).filter(ct => (profile.connect_types || []).includes(ct));
        if (commonConnectTypes.length > 0) {
          matchScore += 15;
        }

        const myShare = myProfile.share_skills || [];
        const myLearn = myProfile.learn_skills || [];
        const theirShare = profile.share_skills || [];
        const theirLearn = profile.learn_skills || [];
        const hasKnowledgeOverlap =
          myShare.some(s => theirLearn.includes(s)) ||
          myLearn.some(s => theirShare.includes(s));
        if (hasKnowledgeOverlap) {
          matchScore += 20;
        }

        const pendingNewbies = helperNewbieCounts[member.user_id] || 0;
        if (profile.is_buddy_helper && pendingNewbies >= 3) {
          matchScore -= 15;
        }

        if (matchScore > 100) matchScore = 100;
        if (matchScore < 0) matchScore = 0;

        return {
          member,
          profile,
          tags,
          exactMatches: matchedChildObjects,
          sharedParents,
          priority,
          isFallback,
          fallbackParentLabel,
          matchScore,
          hasInteracted
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.matchScore - a.matchScore;
      });
  }, [members, allProfiles, allUserTags, myTags, myProfile, mySkills, myGoals, interactionHistory, fallbackEnabled, hasProfile, searchQuery, helperNewbieCounts, ctx.userId]);

  const newbiePrimaryBuddy = useMemo(() => {
    if (!hasProfile || !myProfile.is_newbie) return null;
    const candidates = rankedCandidates.filter(c => {
      const isHelper = c.profile.is_buddy_helper;
      const hasConsent = c.profile.consent_granted_at;
      const pendingNewbies = helperNewbieCounts[c.member.user_id] || 0;
      return isHelper && hasConsent && pendingNewbies < 3;
    });
    return candidates.length > 0 ? candidates[0] : null;
  }, [rankedCandidates, myProfile, hasProfile, helperNewbieCounts]);

  const hasConnectedPrimaryBuddy = useMemo(() => {
    if (!newbiePrimaryBuddy) return false;
    return connectionRequests.some(r =>
      ((r.from_user_id === ctx.userId && r.to_user_id === newbiePrimaryBuddy.member.user_id) ||
       (r.from_user_id === newbiePrimaryBuddy.member.user_id && r.to_user_id === ctx.userId))
    );
  }, [connectionRequests, newbiePrimaryBuddy, ctx.userId]);

  const hasMetPrimaryBuddy = useMemo(() => {
    return connectionMeetings.some(m => {
      if (m.status !== 'confirmed') return false;
      const req = connectionRequests.find(r => r.id === m.request_id);
      return req && (req.from_user_id === ctx.userId || req.to_user_id === ctx.userId) && (
        (newbiePrimaryBuddy && (req.from_user_id === newbiePrimaryBuddy.member.user_id || req.to_user_id === newbiePrimaryBuddy.member.user_id))
      );
    });
  }, [connectionMeetings, connectionRequests, newbiePrimaryBuddy, ctx.userId]);

  return {
    rankedCandidates,
    helperNewbieCounts,
    newbiePrimaryBuddy,
    hasConnectedPrimaryBuddy,
    hasMetPrimaryBuddy
  };
}
