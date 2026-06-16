export function getConnectTypeLabel(type) {
  switch (type) {
    case 'food': return 'Ăn uống 🍴';
    case 'sport': return 'Thể thao ⚽';
    case 'knowledge': return 'Tri thức 📖';
    case 'casual': return 'Tán gẫu 💬';
    case 'intro_meet': return 'Làm quen 🤝';
    default: return 'Kết nối';
  }
}

export function getConnectTypeTemplate(type) {
  switch (type) {
    case 'food': return 'Chào bạn, mình muốn rủ bạn ăn trưa/cafe để làm quen và trao đổi thêm nhé!';
    case 'sport': return 'Chào bạn, mình thấy bạn cũng thích thể thao, hôm nào chúng ta giao lưu nhé!';
    case 'knowledge': return 'Chào bạn, mình rất ấn tượng với profile của bạn và muốn kết nối trao đổi tri thức!';
    case 'casual': return 'Chào bạn, mình muốn kết nối làm quen trò chuyện nhẹ nhàng lúc rảnh.';
    case 'intro_meet': return 'Chào anh/chị, em là thành viên mới onboard. Em rất mong được kết nối và gặp anh/chị 1 buổi ngắn khoảng 15-30 phút để giao lưu, học hỏi kinh nghiệm làm việc và làm quen văn hóa công ty ạ!';
    default: return 'Chào bạn, mình muốn rủ bạn kết nối giao lưu!';
  }
}

export function parseMessageTemplate(template) {
  if (!template) return { text: '', time: '', location: '' };
  if (template.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(template);
      return {
        text: parsed.text || '',
        time: parsed.time ? new Date(parsed.time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '',
        location: parsed.location || ''
      };
    } catch (e) {
      // Fallback
    }
  }
  return { text: template, time: '', location: '' };
}

export function formatTime(isoString) {
  const date = new Date(isoString);
  return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
}

const EXPIRE_DAYS = 7;

export function isConnectionExpired(req) {
  if (!req || req.status !== 'pending') return false;
  const now = Date.now();

  // Nếu có thời gian hẹn trong message_template, quá hạn khi đã qua thời gian đó
  if (req.message_template) {
    try {
      const parsed = JSON.parse(req.message_template);
      if (parsed.time) {
        const scheduledTime = new Date(parsed.time).getTime();
        if (!isNaN(scheduledTime) && scheduledTime < now) return true;
      }
    } catch {
      // ignore parse error
    }
  }

  // Fallback: quá 7 ngày kể từ khi tạo
  const created = new Date(req.created_at).getTime();
  return !isNaN(created) && (now - created > EXPIRE_DAYS * 24 * 60 * 60 * 1000);
}

export function isInvitationExpired(inv, room) {
  if (!inv || inv.status !== 'pending') return false;
  const now = Date.now();

  // Với phòng đi chung, quá hạn khi scheduled_at đã qua
  if (room && !room.is_club && room.scheduled_at) {
    const scheduledTime = new Date(room.scheduled_at).getTime();
    if (!isNaN(scheduledTime) && scheduledTime < now) return true;
  }

  // Fallback: quá 7 ngày kể từ khi tạo
  const created = new Date(inv.created_at).getTime();
  return !isNaN(created) && (now - created > EXPIRE_DAYS * 24 * 60 * 60 * 1000);
}
export function formatName(name) {
  if (!name || typeof name !== 'string') return 'Đồng nghiệp';
  const trimmed = name.trim();
  if (trimmed === '.' || trimmed === '') return 'Đồng nghiệp';
  return trimmed;
}
