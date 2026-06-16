import React, { useEffect, useMemo, useState } from 'react';
import { getContext } from './lib/context.js';
import { bridge } from './lib/bridge.js';
import { db } from './lib/supabase.js';
import {
  useActiveScope,
  useDefaultScopeInitializer,
  useIsAnyWorkspaceAdmin,
  generateShareCode,
  redeemShareCode,
  listShareGrants,
  revokeShareGrant,
} from './lib/sharing.js';
import { useDialog } from './components/Dialog.jsx';
import { mushyApi } from './lib/mushy-api.js';
import { TAXONOMY } from './lib/app/taxonomy.jsx';
import { getConnectTypeLabel, getConnectTypeTemplate } from './lib/app/connect.js';

// Hooks
import { useBuddyData } from './hooks/useBuddyData.js';
import { useRankedCandidates } from './hooks/useRankedCandidates.js';

// Screens
import RadarScreen from './screens/RadarScreen.jsx';
import InboxScreen from './screens/InboxScreen.jsx';
import ConnectionsScreen from './screens/ConnectionsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';

// Components
import ScopeSwitcher from './components/ScopeSwitcher.jsx';
import SkeletonScreen from './components/SkeletonScreen.jsx';
import QuickConnectSheet from './components/QuickConnectSheet.jsx';
import InviteModal from './components/InviteModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import SharingModal from './components/SharingModal.jsx';
import ChatModal from './components/ChatModal.jsx';
import ShareManageModal from './components/ShareManageModal.jsx';

import './App.css';

export default function App() {
  const dialog = useDialog();
  const ctx = useMemo(() => getContext(), []);
  const scope = useActiveScope();
  const isAnyAdmin = useIsAnyWorkspaceAdmin();
  useDefaultScopeInitializer();

  // Navigation
  const [activeTab, setActiveTab] = useState('radar');

  // Data (profiles, members, connections, points...)
  const data = useBuddyData();

  // Consent gate
  const [consentGranted, setConsentGranted] = useState(() => {
    try {
      const activeWs = scope?.workspaceId || ctx?.workspaceId;
      const user = ctx?.userId;
      if (typeof localStorage !== 'undefined' && user && activeWs) {
        const stored = localStorage.getItem(`mushy.consentGranted.${activeWs}.${user}`);
        return stored === 'true';
      }
    } catch (e) {
      // ignore
    }
    return false;
  });
  const [consentCheckbox, setConsentCheckbox] = useState(false);

  // Search / filter / accordion
  const [searchQuery, setSearchQuery] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [expandedParents, setExpandedParents] = useState({});
  const [radarPage, setRadarPage] = useState(1);

  // Modals
  const [showConnectSheet, setShowConnectSheet] = useState(false);
  const [selectedConnectBuddy, setSelectedConnectBuddy] = useState(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSelectedUserIds, setInviteSelectedUserIds] = useState([]);
  const [inviteType, setInviteType] = useState('food');
  const [inviteTime, setInviteTime] = useState('');
  const [inviteLocation, setInviteLocation] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);

  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showShareManageModal, setShowShareManageModal] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [shareGrants, setShareGrants] = useState([]);
  const [loadingGrants, setLoadingGrants] = useState(false);

  const [activeChatConnection, setActiveChatConnection] = useState(null);

  // AI
  const [serverMatchReasons, setServerMatchReasons] = useState({});
  const [icebreakerMsg, setIcebreakerMsg] = useState('');
  const [loadingIcebreaker, setLoadingIcebreaker] = useState(false);

  // Reset pagination when filters / scope change
  useEffect(() => {
    setRadarPage(1);
  }, [searchQuery, fallbackEnabled, scope?.workspaceId]);

  // Reset icebreaker when switching buddy
  useEffect(() => {
    setIcebreakerMsg('');
  }, [selectedConnectBuddy]);

  // Compute ranked candidates
  const {
    rankedCandidates,
    helperNewbieCounts,
    newbiePrimaryBuddy,
    hasConnectedPrimaryBuddy,
    hasMetPrimaryBuddy
  } = useRankedCandidates({
    hasProfile: data.hasProfile,
    myProfile: data.myProfile,
    myTags: data.myTags,
    mySkills: data.mySkills,
    myGoals: data.myGoals,
    members: data.members,
    allProfiles: data.allProfiles,
    allUserTags: data.allUserTags,
    interactionHistory: data.interactionHistory,
    connectionRequests: data.connectionRequests,
    connectionMeetings: data.connectionMeetings,
    fallbackEnabled,
    searchQuery,
    ctx
  });

  // Load server-side match reasons (non-blocking)
  async function loadServerMatchReasons() {
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
          'X-Workspace-Id': scope.workspaceId,
          'X-Home-Workspace-Id': ctx.workspaceId,
        },
        body: JSON.stringify({ userId: ctx.userId, workspaceId: scope.workspaceId }),
      });
      if (!res.ok) return;
      const result = await res.json();
      const reasonMap = {};
      (Array.isArray(result) ? result : []).forEach(d => {
        if (d.user_id && d.match_reasons) reasonMap[d.user_id] = d.match_reasons;
      });
      setServerMatchReasons(reasonMap);
    } catch (e) {
      console.warn('[match-api] unavailable, using client-side reasons');
    }
  }

  useEffect(() => {
    if (data.hasProfile && scope?.workspaceId) {
      loadServerMatchReasons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.hasProfile, scope?.workspaceId, data.myTags]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    if (!data.myProfile.department.trim() || !data.myProfile.facility.trim()) {
      return dialog.error('Thiếu thông tin', 'Vui lòng nhập đầy đủ Phòng ban và Cơ sở làm việc!');
    }

    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;

      // Auto-seed tags taxonomy if missing
      try {
        const { error: checkTagsErr, count } = await db
          .from('tags')
          .select('child_code', { count: 'exact', head: true })
          .eq('workspace_id', activeWs);

        if (checkTagsErr) throw checkTagsErr;

        if (count === null || count < 200) {
          const tagsToInsert = [];
          TAXONOMY.forEach(parent => {
            parent.children.forEach(child => {
              tagsToInsert.push({
                workspace_id: activeWs,
                parent_code: parent.parent_code,
                parent_name: parent.parent_name,
                child_code: child.code,
                name: child.name
              });
            });
          });
          const { error: seedErr } = await db.from('tags').upsert(tagsToInsert, { onConflict: 'workspace_id,child_code' });
          if (seedErr) throw seedErr;
        }
      } catch (checkErr) {
        throw new Error(`Không thể đồng bộ danh mục thẻ sở thích vào Database: ${checkErr.message}`);
      }

      // Upsert profile
      const { error: profErr } = await db.from('user_profiles').upsert({
        user_id: ctx.userId,
        workspace_id: activeWs,
        department: data.myProfile.department.trim(),
        facility: data.myProfile.facility.trim(),
        available_times: data.myProfile.available_times,
        skills: data.mySkills,
        career_goals: data.myGoals,
        share_skills: data.myProfile.share_skills || [],
        learn_skills: data.myProfile.learn_skills || [],
        connect_types: data.myProfile.connect_types || [],
        is_newbie: !!data.myProfile.is_newbie,
        is_buddy_helper: !!data.myProfile.is_buddy_helper,
        updated_at: new Date().toISOString()
      });
      if (profErr) throw profErr;

      // Update user_tags
      await db.from('user_tags').delete().eq('workspace_id', activeWs).eq('user_id', ctx.userId);
      if (data.myTags.length > 0) {
        const tagsPayload = data.myTags.map(code => ({
          workspace_id: activeWs,
          user_id: ctx.userId,
          child_code: code
        }));
        const { error: tagsErr } = await db.from('user_tags').insert(tagsPayload);
        if (tagsErr) throw tagsErr;
      }

      data.setHasProfile(true);
      setShowProfileModal(false);
      await dialog.success('Đã lưu hồ sơ!', 'Thông tin kết nối của bạn đã được cập nhật thành công.');
      data.loadData(true);
    } catch (e) {
      dialog.error('Lỗi lưu hồ sơ', e.message);
    }
  };

  const handleGrantConsent = async () => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      const consentTime = new Date().toISOString();

      const { data: existingProf } = await db
        .from('user_profiles')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', ctx.userId)
        .maybeSingle();

      if (existingProf) {
        const { error: consentErr } = await db
          .from('user_profiles')
          .update({ consent_granted_at: consentTime, updated_at: consentTime })
          .eq('workspace_id', activeWs)
          .eq('user_id', ctx.userId);
        if (consentErr) throw consentErr;
      } else {
        const { error: consentErr } = await db
          .from('user_profiles')
          .insert({
            user_id: ctx.userId,
            workspace_id: activeWs,
            consent_granted_at: consentTime,
            updated_at: consentTime,
            department: 'Chưa cập nhật',
            facility: 'Chưa cập nhật',
            available_times: [],
            share_skills: [],
            learn_skills: [],
            connect_types: [],
            is_newbie: false,
            is_buddy_helper: false,
          });
        if (consentErr) throw consentErr;
      }

      setConsentGranted(true);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`mushy.consentGranted.${activeWs}.${ctx.userId}`, 'true');
        }
      } catch (e) {
        // ignore
      }
      data.setMyProfile(prev => ({ ...prev, consent_granted_at: consentTime }));
      await dialog.success('Xác nhận thành công!', 'Bạn đã đồng ý với các điều khoản chia sẻ dữ liệu và kết nối.');

      if (!existingProf || !existingProf.department || existingProf.department === 'Chưa cập nhật' || !existingProf.facility || existingProf.facility === 'Chưa cập nhật') {
        setShowProfileModal(true);
      }
      data.loadData();
    } catch (e) {
      dialog.error('Lỗi xác nhận', e.message);
    }
  };

  const openInviteFor = (userId, type = 'food') => {
    bridge.haptic('light');
    setInviteSelectedUserIds(userId ? [userId] : []);
    setInviteType(type);
    setInviteTime('');
    setInviteLocation('');
    setInviteMessage(getConnectTypeTemplate(type));
    setShowInviteModal(true);
  };

  const openInviteForIntroMeet = (userId) => {
    bridge.haptic('light');
    setInviteSelectedUserIds(userId ? [userId] : []);
    setInviteType('intro_meet');
    setInviteTime('');
    setInviteLocation('');
    setInviteMessage(getConnectTypeTemplate('intro_meet'));
    setShowInviteModal(true);
  };

  const handleSendGroupInvitation = async () => {
    if (inviteSelectedUserIds.length === 0) {
      return dialog.error('Thiếu thông tin', 'Vui lòng chọn ít nhất một đồng nghiệp để gửi lời mời.');
    }
    if (!inviteTime) {
      return dialog.error('Thiếu thông tin', 'Vui lòng chọn thời gian hẹn.');
    }
    if (!inviteLocation.trim()) {
      return dialog.error('Thiếu thông tin', 'Vui lòng nhập địa điểm hẹn.');
    }

    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      const messageTemplateJson = JSON.stringify({
        text: inviteMessage || getConnectTypeTemplate(inviteType),
        time: inviteTime,
        location: inviteLocation.trim()
      });

      let successCount = 0;
      let existingCount = 0;

      for (const buddyId of inviteSelectedUserIds) {
        const { data: existing } = await db
          .from('connection_requests')
          .select('*')
          .eq('workspace_id', activeWs)
          .eq('from_user_id', ctx.userId)
          .eq('to_user_id', buddyId)
          .eq('action_type', inviteType)
          .eq('status', 'pending')
          .maybeSingle();

        if (existing) {
          existingCount++;
          continue;
        }

        const { error: insertErr } = await db
          .from('connection_requests')
          .insert({
            workspace_id: activeWs,
            from_user_id: ctx.userId,
            to_user_id: buddyId,
            action_type: inviteType,
            status: 'pending',
            message_template: messageTemplateJson,
            chat_messages: JSON.stringify([]),
            created_at: new Date().toISOString()
          });

        if (!insertErr) {
          successCount++;
          try {
            const typeLabel = getConnectTypeLabel(inviteType);
            await mushyApi.push({
              workspaceId: activeWs,
              appSlug: 'buddy-connect',
              userIds: [buddyId],
              title: '⚡ Lời mời kết nối mới!',
              body: `${ctx.userFullName || 'Một đồng nghiệp'} đã gửi lời mời kết nối "${typeLabel}" tới bạn. Mở app để xem ngay!`,
            });
          } catch (pushErr) {
            console.warn('Lỗi push notification:', pushErr);
          }
        }
      }

      if (successCount > 0) {
        await dialog.success('Đã gửi yêu cầu!', `Đã gửi thành công ${successCount} lời mời kết nối.`);
        setShowInviteModal(false);
        setInviteSelectedUserIds([]);
        setInviteTime('');
        setInviteLocation('');
        setInviteMessage('');
        data.loadConnectionData();
      } else if (existingCount > 0) {
        dialog.error('Yêu cầu đã tồn tại', 'Tất cả các đồng nghiệp được chọn đã có lời mời chờ phản hồi từ bạn.');
      }
    } catch (e) {
      dialog.error('Lỗi gửi yêu cầu', e.message);
    }
  };

  const handleSendConnectionRequest = async (buddyId, actionType, messageTemplate) => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      const { data: existing } = await db
        .from('connection_requests')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('from_user_id', ctx.userId)
        .eq('to_user_id', buddyId)
        .eq('action_type', actionType)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return dialog.error('Yêu cầu đã tồn tại', `Bạn đã gửi một yêu cầu kết nối "${getConnectTypeLabel(actionType)}" tới đồng nghiệp này và đang chờ phản hồi.`);
      }

      const { data: newReq, error: insertErr } = await db
        .from('connection_requests')
        .insert({
          workspace_id: activeWs,
          from_user_id: ctx.userId,
          to_user_id: buddyId,
          action_type: actionType,
          status: 'pending',
          message_template: messageTemplate || '',
          chat_messages: JSON.stringify([]),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      try {
        const typeLabel = getConnectTypeLabel(actionType);
        await mushyApi.push({
          workspaceId: activeWs,
          appSlug: 'buddy-connect',
          userIds: [buddyId],
          title: '⚡ Lời mời kết nối mới!',
          body: `${ctx.userFullName || 'Một đồng nghiệp'} đã gửi lời mời kết nối "${typeLabel}" tới bạn. Mở app để xem ngay!`,
        });
      } catch (pushErr) {
        console.warn('Lỗi push notification:', pushErr);
      }

      await dialog.success('Đã gửi yêu cầu!', 'Lời mời kết nối của bạn đã được gửi thành công.');
      setShowConnectSheet(false);
      setSelectedConnectBuddy(null);
      data.loadConnectionData();
    } catch (e) {
      dialog.error('Lỗi gửi yêu cầu', e.message);
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      const now = new Date().toISOString();

      const { data: updatedReq, error: updateErr } = await db
        .from('connection_requests')
        .update({ status, resolved_at: now })
        .eq('id', requestId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      if (status === 'accepted') {
        const { error: meetErr } = await db
          .from('connection_meetings')
          .insert({
            workspace_id: activeWs,
            request_id: requestId,
            from_confirmed: false,
            to_confirmed: false,
            points_awarded: 0,
            status: 'pending_confirmation',
            created_at: now
          });
        if (meetErr) throw meetErr;

        try {
          await mushyApi.push({
            workspaceId: activeWs,
            appSlug: 'buddy-connect',
            userIds: [updatedReq.from_user_id],
            title: '🎉 Lời mời đã được chấp nhận!',
            body: `${ctx.userFullName || 'Đồng nghiệp'} đã đồng ý kết nối với bạn. Hãy lên lịch gặp mặt ngoài đời nhé!`,
          });
        } catch (pushErr) {
          console.warn('Lỗi push notification:', pushErr);
        }

        await dialog.success('Đã chấp nhận!', 'Bạn đã đồng ý kết nối. Cuộc gặp mặt đã được lập lịch xác nhận.');
      } else {
        await dialog.info('Đã từ chối', 'Bạn đã từ chối yêu cầu kết nối.');
      }

      data.loadConnectionData();
    } catch (e) {
      dialog.error('Lỗi phản hồi yêu cầu', e.message);
    }
  };

  const awardConnectionPoints = async (userId, pointsToAdd) => {
    const activeWs = scope.workspaceId;
    if (!activeWs) return;

    try {
      const { data: existing } = await db
        .from('connection_points')
        .select('*')
        .eq('workspace_id', activeWs)
        .eq('user_id', userId)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing) {
        const newPoints = (existing.points || 0) + pointsToAdd;
        const newCount = (existing.confirmed_1to1_count || 0) + 1;
        let badge = null;
        if (newPoints >= 100) badge = 'gold';
        else if (newPoints >= 60) badge = 'silver';
        else if (newPoints >= 30) badge = 'bronze';

        await db
          .from('connection_points')
          .update({ points: newPoints, confirmed_1to1_count: newCount, helper_badge_level: badge, updated_at: now })
          .eq('workspace_id', activeWs)
          .eq('user_id', userId);
      } else {
        let badge = null;
        if (pointsToAdd >= 100) badge = 'gold';
        else if (pointsToAdd >= 60) badge = 'silver';
        else if (pointsToAdd >= 30) badge = 'bronze';

        await db
          .from('connection_points')
          .insert({
            workspace_id: activeWs,
            user_id: userId,
            points: pointsToAdd,
            confirmed_1to1_count: 1,
            group_activity_count: 0,
            helper_badge_level: badge,
            updated_at: now
          });
      }
    } catch (err) {
      console.error('Error awarding connection points:', err);
    }
  };

  const handleConfirmMeeting = async (meetingId, isConfirmed) => {
    try {
      bridge.haptic('medium');
      const activeWs = scope.workspaceId;
      if (!activeWs) return;

      const { data: meeting, error: meetErr } = await db
        .from('connection_meetings')
        .select('*, request:connection_requests(*)')
        .eq('id', meetingId)
        .single();

      if (meetErr || !meeting) {
        throw new Error('Không tìm thấy bản ghi cuộc gặp.');
      }

      const request = meeting.request;
      if (!request) {
        throw new Error('Không tìm thấy yêu cầu kết nối liên quan.');
      }

      const isFrom = ctx.userId === request.from_user_id;
      const isTo = ctx.userId === request.to_user_id;

      if (!isFrom && !isTo) {
        throw new Error('Bạn không tham gia vào cuộc kết nối này.');
      }

      const updates = {};
      if (isConfirmed === 'confirmed') {
        if (isFrom) updates.from_confirmed = true;
        if (isTo) updates.to_confirmed = true;

        const bothConfirmed = (isFrom && meeting.to_confirmed) || (isTo && meeting.from_confirmed);
        if (bothConfirmed) {
          updates.status = 'confirmed';
          updates.confirmed_at = new Date().toISOString();
          const pointsToAward = request.action_type === 'intro_meet' ? 15 : 10;
          updates.points_awarded = pointsToAward;

          await awardConnectionPoints(request.from_user_id, pointsToAward);
          await awardConnectionPoints(request.to_user_id, pointsToAward);
        } else {
          updates.status = 'pending_confirmation';
        }
      } else if (isConfirmed === 'skipped') {
        updates.status = 'skipped';
      }

      const { error: updateErr } = await db
        .from('connection_meetings')
        .update(updates)
        .eq('id', meetingId);

      if (updateErr) throw updateErr;

      if (updates.status === 'confirmed') {
        const points = request.action_type === 'intro_meet' ? 15 : 10;
        await dialog.success('Tuyệt vời! 🎉', `Cuộc gặp mặt đã được xác nhận từ cả hai phía. Mỗi bạn được cộng ${points} điểm kết nối.`);
      } else if (isConfirmed === 'confirmed') {
        await dialog.success('Đã xác nhận!', 'Đã ghi nhận xác nhận từ phía bạn. Đang chờ đồng nghiệp xác nhận.');
      } else {
        await dialog.info('Đã hủy cuộc gặp', 'Trạng thái cuộc gặp được cập nhật thành Bỏ qua.');
      }

      data.loadConnectionData();
    } catch (e) {
      dialog.error('Lỗi xác nhận cuộc gặp', e.message);
    }
  };

  const handleSendChatMessage = async (requestId, content) => {
    if (!content.trim()) return;
    const req = data.connectionRequests.find(r => r.id === requestId);
    if (!req) return;

    const currentMessages = [];
    try {
      const parsed = JSON.parse(req.chat_messages);
      if (Array.isArray(parsed)) currentMessages.push(...parsed);
    } catch { /* ignore */ }

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: ctx.userId,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...currentMessages, newMessage];

    try {
      await db
        .from('connection_requests')
        .update({ chat_messages: JSON.stringify(updatedMessages) })
        .eq('id', requestId);
    } catch (e) {
      console.error('Failed to send buddy chat message:', e);
    }
  };

  // ─── Sharing Modal Handlers ──────────────────────────────────────────────

  const handleOpenSharing = async () => {
    setShowSharingModal(true);
    setLoadingGrants(true);
    setGeneratedCode(null);
    try {
      const grants = await listShareGrants();
      setShareGrants(grants);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrants(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      bridge.haptic('light');
      const codeData = await generateShareCode({ expiresHours: 24 });
      setGeneratedCode(codeData);
      const grants = await listShareGrants();
      setShareGrants(grants);
    } catch (err) {
      dialog.error('Lỗi tạo mã', err.message);
    }
  };

  const handleRedeemCode = async () => {
    if (!shareCodeInput.trim()) return;
    try {
      bridge.haptic('light');
      await redeemShareCode({ code: shareCodeInput.trim().toUpperCase() });
      setShareCodeInput('');
      await dialog.success('Kết nối thành công!', 'Đã mở rộng phạm vi kết nối với workspace chia sẻ.');
      const grants = await listShareGrants();
      setShareGrants(grants);
      data.loadData();
    } catch (err) {
      dialog.error('Lỗi redeem', err.message);
    }
  };

  const handleRevokeGrant = async (grantId) => {
    const ok = await dialog.confirm('Hủy kết nối chia sẻ này?', 'Hai bên sẽ không còn nhìn thấy thông tin của nhau nữa.', {
      danger: true,
      confirmLabel: 'Hủy kết nối',
      cancelLabel: 'Bỏ qua',
    });
    if (!ok) return;

    try {
      bridge.haptic('medium');
      await revokeShareGrant(grantId);
      const grants = await listShareGrants();
      setShareGrants(grants);
      data.loadData();
    } catch (err) {
      dialog.error('Lỗi hủy chia sẻ', err.message);
    }
  };

  // ─── AI Icebreaker ─────────────────────────────────────────────────────────

  const handleGetIcebreaker = async () => {
    if (!selectedConnectBuddy) return;
    const toProfile = data.allProfiles[selectedConnectBuddy.user_id] || {};
    setLoadingIcebreaker(true);
    try {
      const res = await fetch('/api/icebreaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
          'X-Workspace-Id': scope.workspaceId,
          'X-Home-Workspace-Id': ctx.workspaceId,
        },
        body: JSON.stringify({
          fromUser: {
            full_name: data.members.find(m => m.user_id === ctx.userId)?.full_name || 'Tôi',
            tags: data.myTags,
            career_goals: data.myGoals,
          },
          toUser: {
            full_name: selectedConnectBuddy.full_name,
            tags: data.allUserTags[selectedConnectBuddy.user_id] || [],
            career_goals: toProfile.career_goals || [],
          },
        }),
      });
      if (res.status === 429) {
        return dialog.error('Hết quota AI', 'Bạn đã dùng hết 10 lần gợi ý AI hôm nay. Hãy thử lại vào ngày mai!');
      }
      const result = await res.json();
      if (result.message) setIcebreakerMsg(result.message);
    } catch (e) {
      console.warn('[icebreaker] failed:', e);
      setIcebreakerMsg(`Chào ${selectedConnectBuddy.full_name}, mình thấy chúng ta có vài điểm chung và muốn kết nối! Bạn có rảnh không?`);
    } finally {
      setLoadingIcebreaker(false);
    }
  };

  // ─── Reset Profile ─────────────────────────────────────────────────────────

  const handleResetProfile = async () => {
    const ok = await dialog.confirm(
      'Đặt lại hồ sơ & Thoát?',
      'Thao tác này sẽ xoá sạch hồ sơ, sở thích, điểm số và các yêu cầu kết nối của bạn để trải nghiệm lại như người dùng mới từ đầu. Ứng dụng sẽ tự động đóng sau khi hoàn tất.',
      { danger: true, confirmLabel: 'Xác nhận đặt lại & Thoát', cancelLabel: 'Hủy' }
    );
    if (!ok) return;

    try {
      const activeWs = scope.workspaceId;

      await db.from('user_profiles').delete().eq('workspace_id', activeWs).eq('user_id', ctx.userId);
      await db.from('user_tags').delete().eq('workspace_id', activeWs).eq('user_id', ctx.userId);
      await db.from('connection_points').delete().eq('workspace_id', activeWs).eq('user_id', ctx.userId);
      await db.from('connection_requests').delete().eq('workspace_id', activeWs).eq('from_user_id', ctx.userId);

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`mushy.consentGranted.${activeWs}.${ctx.userId}`);
      }

      setConsentGranted(false);
      setConsentCheckbox(false);
      data.setHasProfile(false);
      data.setMyProfile({
        department: '',
        facility: '',
        available_times: [],
        share_skills: [],
        learn_skills: [],
        connect_types: [],
        is_newbie: false,
        is_buddy_helper: false,
        consent_granted_at: null,
      });
      data.setMyTags([]);
      data.setMySkills([]);
      data.setMyGoals([]);

      await dialog.success('Đã đặt lại!', 'Hồ sơ đã được dọn sạch. Ứng dụng sẽ tự đóng ngay bây giờ.');
      await bridge.closeMiniApp();
    } catch (err) {
      dialog.error('Lỗi đặt lại', err.message);
    }
  };

  // ─── Render gates ────────────────────────────────────────────────────────

  if (ctx.isMissingContext) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFF0F2 0%, #FFE5E9 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 77, 109, 0.15)',
          borderRadius: '24px',
          padding: '40px 30px',
          maxWidth: '420px',
          boxShadow: '0 15px 35px rgba(255, 77, 109, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '56px', marginBottom: '20px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}>📱</span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px', letterSpacing: '-0.3px' }}>
            Mở trong Mushy Super App
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', margin: '0 0 28px' }}>
            Bạn đang truy cập bản build trực tiếp trên Vercel. Để trải nghiệm và kiểm thử đầy đủ các tính năng kết nối, <strong>vui lòng mở ứng dụng này bằng ứng ứng di động Mushy của bạn</strong>.
          </p>
          <div style={{
            fontSize: '12px',
            color: '#FF4D6D',
            background: 'rgba(255, 77, 109, 0.06)',
            border: '1px solid rgba(255, 77, 109, 0.12)',
            borderRadius: '12px',
            padding: '12px 18px',
            fontWeight: '600',
            width: '100%',
            boxSizing: 'border-box',
            lineHeight: '1.4'
          }}>
            ℹ️ Yêu cầu môi trường Mushy Super App Shell
          </div>
        </div>
      </div>
    );
  }

  if (!consentGranted) {
    if (data.loading) {
      return (
        <div className="mushy-page">
          <SkeletonScreen />
        </div>
      );
    }
    return (
      <div className="consent-screen animated-fade-in" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFF0F2 0%, #FFE5E9 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 77, 109, 0.15)',
          borderRadius: '24px',
          padding: '32px 24px',
          maxWidth: '400px',
          boxShadow: '0 15px 35px rgba(255, 77, 109, 0.08)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>🤝🍄</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px' }}>
            Chào mừng bạn đến với Connect!
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.6', margin: '0 0 20px', textAlign: 'left' }}>
            Để hỗ trợ bạn kết nối với đúng các đồng nghiệp có cùng sở thích, cùng cơ sở và phòng ban, hệ thống cần xử lý thông tin hồ sơ của bạn.
          </p>
          <div style={{
            background: 'rgba(15, 15, 18, 0.02)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '14px',
            fontSize: '12px',
            textAlign: 'left',
            color: 'var(--ink)',
            marginBottom: '20px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>Thông tin sẽ được thu thập:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
              <li>Thông tin phòng ban & cơ sở làm việc</li>
              <li>Sở thích cá nhân & kỹ năng chia sẻ/học hỏi</li>
              <li>Lịch sử tương tác và gặp mặt nội bộ</li>
            </ul>
          </div>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            marginBottom: '24px',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              style={{ marginTop: '3px', accentColor: 'var(--brand)' }}
              checked={consentCheckbox}
              onChange={(e) => setConsentCheckbox(e.target.checked)}
            />
            <span style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: '1.4' }}>
              Tôi đồng ý cung cấp thông tin profile và cho phép hệ thống gợi ý buddy phù hợp, nhận lời mời kết nối nội bộ.
            </span>
          </label>
          <button
            className="mushy-btn mushy-btn--primary mushy-btn--block"
            style={{ minHeight: '44px', fontWeight: 700 }}
            disabled={!consentCheckbox}
            onClick={handleGrantConsent}
          >
            Đồng ý và tiếp tục 🚀
          </button>
        </div>
      </div>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────────────────

  return (
    <div className="mushy-page">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <span className="brand-icon">🍄</span>
          <div>
            <h1 className="brand-name">Mushy Connect</h1>
            <p className="brand-tagline">Tự tạo phòng hẹn nhanh đi chill & thể thao</p>
          </div>
        </div>
        <ScopeSwitcher onManageGrants={() => setShowShareManageModal(true)} />
      </header>

      {/* Tabs */}
      <nav className="tab-navigation tab-navigation-bottom" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <TabButton active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} icon="🛰️" label="Radar" />
        <TabButton active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} icon="📥" label="Lời Mời" badge={data.connectionRequests.filter(r => r.to_user_id === ctx.userId && r.status === 'pending').length} />
        <TabButton active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} icon="🤝" label="Kết Nối" badge={
          data.connectionMeetings.filter(m => m.status === 'pending_confirmation' &&
            ((data.connectionRequests.find(r => r.id === m.request_id)?.from_user_id === ctx.userId && !m.from_confirmed) ||
             (data.connectionRequests.find(r => r.id === m.request_id)?.to_user_id === ctx.userId && !m.to_confirmed))
          ).length
        } />
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon="⚙️" label="Hồ Sơ" />
      </nav>

      {data.loading ? (
        <SkeletonScreen />
      ) : (
        <>
          {activeTab === 'radar' && (
            <RadarScreen
              hasProfile={data.hasProfile}
              myProfile={data.myProfile}
              mySkills={data.mySkills}
              myGoals={data.myGoals}
              searchQuery={searchQuery}
              fallbackEnabled={fallbackEnabled}
              scope={scope}
              rankedCandidates={rankedCandidates}
              newbiePrimaryBuddy={newbiePrimaryBuddy}
              hasConnectedPrimaryBuddy={hasConnectedPrimaryBuddy}
              hasMetPrimaryBuddy={hasMetPrimaryBuddy}
              serverMatchReasons={serverMatchReasons}
              radarPage={radarPage}
              onSearchChange={setSearchQuery}
              onToggleFallback={setFallbackEnabled}
              onOpenProfile={() => setShowProfileModal(true)}
              onOpenInvite={openInviteFor}
              onOpenConnectSheet={(member) => { setSelectedConnectBuddy(member); setShowConnectSheet(true); }}
              onScheduleMeetWithBuddy={openInviteForIntroMeet}
              onPageChange={setRadarPage}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxScreen
              connectionRequests={data.connectionRequests}
              members={data.members}
              allProfiles={data.allProfiles}
              ctx={ctx}
              onRespond={handleRespondRequest}
            />
          )}

          {activeTab === 'connections' && (
            <ConnectionsScreen
              myPoints={data.myPoints}
              myProfile={data.myProfile}
              connectionMeetings={data.connectionMeetings}
              connectionRequests={data.connectionRequests}
              members={data.members}
              allProfiles={data.allProfiles}
              allPoints={data.allPoints}
              ctx={ctx}
              helperNewbieCounts={helperNewbieCounts}
              onConfirmMeeting={handleConfirmMeeting}
              onOpenChat={setActiveChatConnection}
              onOpenInvite={() => openInviteFor()}
              onOpenSharing={handleOpenSharing}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              myProfile={data.myProfile}
              setMyProfile={data.setMyProfile}
              mySkills={data.mySkills}
              setMySkills={data.setMySkills}
              myGoals={data.myGoals}
              setMyGoals={data.setMyGoals}
              myTags={data.myTags}
              setMyTags={data.setMyTags}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              expandedParents={expandedParents}
              setExpandedParents={setExpandedParents}
              onSave={handleSaveProfile}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showConnectSheet && selectedConnectBuddy && (
        <QuickConnectSheet
          buddy={selectedConnectBuddy}
          myProfile={data.myProfile}
          allProfiles={data.allProfiles}
          onClose={() => { setShowConnectSheet(false); setSelectedConnectBuddy(null); }}
          onSendRequest={(buddyId, type) => handleSendConnectionRequest(buddyId, type, getConnectTypeTemplate(type))}
          icebreakerMsg={icebreakerMsg}
          loadingIcebreaker={loadingIcebreaker}
          onGetIcebreaker={handleGetIcebreaker}
        />
      )}

      {showInviteModal && (
        <InviteModal
          members={data.members}
          selectedUserIds={inviteSelectedUserIds}
          setSelectedUserIds={setInviteSelectedUserIds}
          inviteType={inviteType}
          setInviteType={setInviteType}
          inviteTime={inviteTime}
          setInviteTime={setInviteTime}
          inviteLocation={inviteLocation}
          setInviteLocation={setInviteLocation}
          inviteMessage={inviteMessage}
          setInviteMessage={setInviteMessage}
          onSend={handleSendGroupInvitation}
          onClose={() => {
            setShowInviteModal(false);
            setInviteSelectedUserIds([]);
            setInviteTime('');
            setInviteLocation('');
            setInviteMessage('');
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          myProfile={data.myProfile}
          setMyProfile={data.setMyProfile}
          mySkills={data.mySkills}
          setMySkills={data.setMySkills}
          myGoals={data.myGoals}
          setMyGoals={data.setMyGoals}
          myTags={data.myTags}
          setMyTags={data.setMyTags}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          expandedParents={expandedParents}
          setExpandedParents={setExpandedParents}
          onSave={handleSaveProfile}
        />
      )}

      {activeTab === 'profile' && (
        <div className="form-actions" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="mushy-btn mushy-btn--ghost mushy-btn--block"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', fontWeight: 'bold' }}
            onClick={handleResetProfile}
          >
            🔄 Đặt lại hồ sơ & Thoát
          </button>
        </div>
      )}

      {showSharingModal && (
        <SharingModal
          open={showSharingModal}
          onClose={() => setShowSharingModal(false)}
          isAnyAdmin={isAnyAdmin}
          shareCodeInput={shareCodeInput}
          setShareCodeInput={setShareCodeInput}
          generatedCode={generatedCode}
          onGenerateCode={handleGenerateCode}
          onRedeemCode={handleRedeemCode}
          shareGrants={shareGrants}
          onRevokeGrant={handleRevokeGrant}
          loadingGrants={loadingGrants}
        />
      )}

      {showShareManageModal && (
        <ShareManageModal open={showShareManageModal} onClose={() => setShowShareManageModal(false)} />
      )}

      {activeChatConnection && (
        <ChatModal
          connection={activeChatConnection}
          members={data.members}
          ctx={ctx}
          onClose={() => setActiveChatConnection(null)}
          onSend={handleSendChatMessage}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }) {
  return (
    <button
      className={`nav-tab-btn ${active ? 'nav-tab-btn--active' : ''}`}
      onClick={onClick}
    >
      <span style={{ position: 'relative', display: 'inline-block' }}>
        {icon}
        {badge > 0 && (
          <span className="notification-dot" style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--brand)',
            border: '1.5px solid #fff',
            boxShadow: '0 1px 3px rgba(230, 57, 70, 0.3)'
          }} />
        )}
      </span>
      {label}
    </button>
  );
}
