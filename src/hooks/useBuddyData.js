import { useEffect, useState } from 'react';
import { getContext } from '../lib/context.js';
import { db } from '../lib/supabase.js';
import { listMembers, getProfiles } from '../lib/members.js';
import { subscribeToTable } from '../lib/realtime.js';

const EMPTY_PROFILE = {
  department: '',
  facility: '',
  available_times: [],
  share_skills: [],
  learn_skills: [],
  connect_types: [],
  is_newbie: false,
  is_buddy_helper: false,
  consent_granted_at: null,
};

export function useBuddyData() {
  const ctx = getContext();

  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [myProfile, setMyProfile] = useState({ ...EMPTY_PROFILE });
  const [myTags, setMyTags] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [myGoals, setMyGoals] = useState([]);

  const [members, setMembers] = useState([]);
  const [allProfiles, setAllProfiles] = useState({});
  const [allUserTags, setAllUserTags] = useState({});
  const [interactionHistory, setInteractionHistory] = useState([]);

  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connectionMeetings, setConnectionMeetings] = useState([]);
  const [myPoints, setMyPoints] = useState({ points: 0, confirmed_1to1_count: 0, helper_badge_level: null });
  const [allPoints, setAllPoints] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const activeWs = ctx?.workspaceId;

  async function loadConnectionData() {
    if (!activeWs) return { requests: [], meetings: [], rms: [], invs: [] };
    try {
      const { data: requests, error: reqErr } = await db
        .from('connection_requests')
        .select('*')
        .eq('workspace_id', activeWs)
        .or(`from_user_id.eq.${ctx.userId},to_user_id.eq.${ctx.userId}`)
        .order('created_at', { ascending: false });
      if (reqErr) console.error('Error fetching connection requests:', reqErr);
      else setConnectionRequests(requests || []);

      const { data: meetings, error: meetErr } = await db
        .from('connection_meetings')
        .select('*')
        .eq('workspace_id', activeWs)
        .order('created_at', { ascending: false });
      if (meetErr) console.error('Error fetching connection meetings:', meetErr);
      else setConnectionMeetings(meetings || []);

      const { data: pts, error: ptsErr } = await db
        .from('connection_points')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', ctx.userId)
        .maybeSingle();
      if (ptsErr) console.error('Error fetching user connection points:', ptsErr);
      else if (pts) {
        setMyPoints({
          points: pts.points || 0,
          confirmed_1to1_count: pts.confirmed_1to1_count || 0,
          helper_badge_level: pts.helper_badge_level || null
        });
      } else {
        setMyPoints({ points: 0, confirmed_1to1_count: 0, helper_badge_level: null });
      }

      const { data: allPts, error: allPtsErr } = await db
        .from('connection_points')
        .select('*')
        .eq('workspace_id', activeWs)
        .order('points', { ascending: false });
      if (allPtsErr) console.error('Error fetching leaderboard points:', allPtsErr);
      else setAllPoints(allPts || []);

      const { data: rms, error: rmsErr } = await db
        .from('rooms')
        .select('*')
        .eq('workspace_id', activeWs)
        .order('created_at', { ascending: false });
      if (rmsErr) console.error('Error fetching rooms:', rmsErr);
      else setRooms(rms || []);

      const { data: invs, error: invsErr } = await db
        .from('invitations')
        .select('*')
        .eq('workspace_id', activeWs)
        .order('created_at', { ascending: false });
      if (invsErr) console.error('Error fetching invitations:', invsErr);
      else setInvitations(invs || []);

      return {
        requests: requests || [],
        meetings: meetings || [],
        rms: rms || [],
        invs: invs || []
      };
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Connection:', err);
      return { requests: [], meetings: [], rms: [], invs: [] };
    }
  }

  async function loadData(silent = false) {
    if (!activeWs) return;
    if (!silent) setLoading(true);
    try {
      // 1. Fetch current user profile
      const { data: prof, error: profErr } = await db
        .from('user_profiles')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', ctx.userId)
        .maybeSingle();

      if (profErr) throw profErr;

      if (prof) {
        setMyProfile({
          department: prof.department === 'Chưa cập nhật' ? '' : (prof.department || ''),
          facility: prof.facility === 'Chưa cập nhật' ? '' : (prof.facility || ''),
          available_times: prof.available_times || [],
          share_skills: prof.share_skills || [],
          learn_skills: prof.learn_skills || [],
          connect_types: prof.connect_types || [],
          is_newbie: !!prof.is_newbie,
          is_buddy_helper: !!prof.is_buddy_helper,
          consent_granted_at: prof.consent_granted_at || null,
        });
        setMySkills(prof.skills || []);
        setMyGoals(prof.career_goals || []);
        setHasProfile(true);
      } else {
        setHasProfile(false);
        setMyProfile({ ...EMPTY_PROFILE });
        setMySkills([]);
        setMyGoals([]);
      }

      const { data: myTagsData } = await db
        .from('user_tags')
        .select('child_code')
        .eq('workspace_id', activeWs)
        .eq('user_id', ctx.userId);
      setMyTags((myTagsData || []).map(t => t.child_code));

      // 2. Fetch workspace members
      const workspaceMembers = await listMembers(activeWs);

      // 3. Fetch all profiles & tags in workspace to build match registry
      const { data: allProfs } = await db
        .from('user_profiles')
        .select('*')
        .eq('workspace_id', activeWs);
      const profMap = {};
      if (allProfs) {
        allProfs.forEach(p => { profMap[p.user_id] = p; });
      }
      setAllProfiles(profMap);

      const { data: allTags } = await db
        .from('user_tags')
        .select('*')
        .eq('workspace_id', activeWs);
      const tagsMap = {};
      if (allTags) {
        allTags.forEach(t => {
          if (!tagsMap[t.user_id]) tagsMap[t.user_id] = [];
          tagsMap[t.user_id].push(t.child_code);
        });
      }
      setAllUserTags(tagsMap);

      // 4. Fetch interaction history
      const { data: history } = await db
        .from('interaction_history')
        .select('*')
        .eq('workspace_id', activeWs);
      setInteractionHistory(history || []);

      // 5. Load Connection Data & Resolve profiles for all participants
      const connData = await loadConnectionData();

      // Collect all user IDs involved in connections to make sure their names are displayed
      const extraUserIds = new Set();
      connData.requests.forEach(r => {
        extraUserIds.add(r.from_user_id);
        extraUserIds.add(r.to_user_id);
      });
      connData.rms.forEach(r => {
        extraUserIds.add(r.host_id);
      });
      connData.invs.forEach(i => {
        extraUserIds.add(i.receiver_id);
      });
      extraUserIds.delete(ctx.userId);

      const existingIds = new Set(workspaceMembers.map(m => m.user_id));
      const missingIds = [...extraUserIds].filter(id => !existingIds.has(id));

      let extraMembers = [];
      if (missingIds.length > 0) {
        try {
          const extraProfiles = await getProfiles(missingIds);
          extraMembers = missingIds.map(id => ({
            user_id: id,
            role: 'member',
            full_name: extraProfiles[id]?.full_name ?? null,
            avatar_url: extraProfiles[id]?.avatar_url ?? null,
            work_phone: extraProfiles[id]?.work_phone ?? null,
            work_email: extraProfiles[id]?.work_email ?? null,
            personal_email: extraProfiles[id]?.personal_email ?? null,
          }));
        } catch (extraErr) {
          console.warn('Lỗi lấy thông tin extra members:', extraErr);
        }
      }

      setMembers([...workspaceMembers, ...extraMembers].filter(m => m.user_id !== ctx.userId));
    } catch (err) {
      console.error('Lỗi tải dữ liệu Connect:', err);
    } finally {
      setLoading(false);
    }
  }

  // Initial load + workspace change
  useEffect(() => {
    if (activeWs) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWs]);

  // Real-time subscriptions
  useEffect(() => {
    if (!activeWs) return;
    const unsubConnReqs = subscribeToTable('connection_requests', activeWs, () => loadConnectionData());
    const unsubConnMeets = subscribeToTable('connection_meetings', activeWs, () => loadConnectionData());
    const unsubConnPoints = subscribeToTable('connection_points', activeWs, () => loadConnectionData());
    const unsubRooms = subscribeToTable('rooms', activeWs, () => loadConnectionData());
    const unsubInvs = subscribeToTable('invitations', activeWs, () => loadConnectionData());

    return () => {
      unsubConnReqs();
      unsubConnMeets();
      unsubConnPoints();
      unsubRooms();
      unsubInvs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWs]);

  return {
    loading,
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
    myPoints,
    allPoints,
    rooms,
    invitations,
    loadData,
    loadConnectionData,
    // Expose setters for components that mutate state directly
    setLoading,
    setHasProfile,
    setMyProfile,
    setMyTags,
    setMySkills,
    setMyGoals,
    setMembers,
    setAllProfiles,
    setAllUserTags,
    setInteractionHistory,
    setConnectionRequests,
    setConnectionMeetings,
    setMyPoints,
    setAllPoints,
    setRooms,
    setInvitations,
  };
}
