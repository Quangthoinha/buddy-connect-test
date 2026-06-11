import { createClient } from '@supabase/supabase-js';
import { verifyRequest } from './_verify.js';
import config from '../mushy.config.json' with { type: 'json' };

const SUPABASE_URL = config.supabase.url;
const ANON_KEY = config.supabase.anonKey;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ctx = await verifyRequest(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { userId, workspaceId } = req.body;
    if (!userId || !workspaceId) {
      return res.status(400).json({ error: 'Missing userId or workspaceId' });
    }

    const client = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${ctx.token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Fetch current user profile
    const { data: currentUser, error: meErr } = await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (meErr || !currentUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // 2. Fetch all profiles in workspace
    const { data: allProfs, error: profsErr } = await client
      .from('user_profiles')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (profsErr || !allProfs) {
      return res.status(500).json({ error: 'Failed to fetch profiles' });
    }

    const others = allProfs.filter(p => p.user_id !== userId);
    const profMap = {};
    allProfs.forEach(p => { profMap[p.user_id] = p; });

    // 3. Fetch all user tags
    const { data: allUserTags } = await client
      .from('user_tags')
      .select('*')
      .eq('workspace_id', workspaceId);

    const tagsMap = {};
    if (allUserTags) {
      allUserTags.forEach(t => {
        if (!tagsMap[t.user_id]) tagsMap[t.user_id] = [];
        tagsMap[t.user_id].push(t.child_code);
      });
    }

    // 4. Fetch connection requests for overload checks
    const { data: activeRequests } = await client
      .from('connection_requests')
      .select('from_user_id, to_user_id, status')
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'accepted']);

    // Calculate pending/accepted newbie connections count for each buddy helper
    const helperNewbieCounts = {};
    if (activeRequests) {
      activeRequests.forEach(req => {
        const sender = profMap[req.from_user_id];
        if (sender && sender.is_newbie) {
          helperNewbieCounts[req.to_user_id] = (helperNewbieCounts[req.to_user_id] || 0) + 1;
        }
      });
    }

    // 5. Server-side ranking with base MVP matching + expansion boosters
    const matches = others.map(other => {
      let score = 30; // base weight
      const reasons = [];

      // D1: Tags (Chung sở thích)
      const myTags = tagsMap[userId] || [];
      const theirTags = tagsMap[other.user_id] || [];
      const commonTags = myTags.filter(t => theirTags.includes(t));
      if (commonTags.length > 0) {
        score += commonTags.length * 25;
        reasons.push(`Chung ${commonTags.length} sở thích`);
      }

      // D2: Facility (Địa điểm làm việc)
      if (currentUser.facility && currentUser.facility === other.facility) {
        score += 15;
        reasons.push('Cùng địa điểm làm việc');
      }

      // D3: Skills (Kỹ năng)
      const mySkills = currentUser.skills || [];
      const theirSkills = other.skills || [];
      const commonSkills = mySkills.filter(s => theirSkills.includes(s));
      if (commonSkills.length > 0) {
        score += commonSkills.length * 10;
        reasons.push(`Chung ${commonSkills.length} kỹ năng`);
      }

      // D4: Career Goals (Mục tiêu nghề nghiệp)
      const myGoals = currentUser.career_goals || [];
      const theirGoals = other.career_goals || [];
      const commonGoals = myGoals.filter(g => theirGoals.includes(g));
      if (commonGoals.length > 0) {
        score += commonGoals.length * 10;
        reasons.push(`Chung ${commonGoals.length} mục tiêu`);
      }

      // D5: Department (Phòng ban trực tiếp)
      if (currentUser.department && currentUser.department === other.department) {
        score += 10;
        reasons.push('Cùng phòng ban');
      }

      // BOOSTER 1: Newbie Buddy Helper Boost (+30)
      if (currentUser.is_newbie && other.is_buddy_helper) {
        score += 30;
        reasons.push('Buddy hỗ trợ người mới 🤝');
      }

      // BOOSTER 2: Connect Type Priority Boost (+15)
      const myConnectTypes = currentUser.connect_types || [];
      const theirConnectTypes = other.connect_types || [];
      const commonConnectTypes = myConnectTypes.filter(ct => theirConnectTypes.includes(ct));
      if (commonConnectTypes.length > 0) {
        score += 15;
        reasons.push('Trùng ưu tiên kết nối');
      }

      // BOOSTER 3: Knowledge Boost (+20)
      const myShare = currentUser.share_skills || [];
      const myLearn = currentUser.learn_skills || [];
      const theirShare = other.share_skills || [];
      const theirLearn = other.learn_skills || [];
      const hasKnowledgeOverlap = 
        myShare.some(s => theirLearn.includes(s)) || 
        myLearn.some(s => theirShare.includes(s));

      if (hasKnowledgeOverlap) {
        score += 20;
        reasons.push('Giao thoa chia sẻ tri thức 📖');
      }

      // PENALTY: Overload penalty (-15) if candidate is helper and supports >= 3 newbies
      const pendingNewbies = helperNewbieCounts[other.user_id] || 0;
      if (other.is_buddy_helper && pendingNewbies >= 3) {
        score -= 15;
        reasons.push('Buddy đang quá tải cuộc hẹn');
      }

      return {
        ...other,
        score: Math.max(0, Math.min(score, 100)),
        match_reasons: reasons
      };
    });

    matches.sort((a, b) => b.score - a.score);

    return res.status(200).json(matches);
  } catch (err) {
    console.error('Match API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
