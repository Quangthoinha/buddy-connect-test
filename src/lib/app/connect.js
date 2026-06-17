const MESSAGE_TEMPLATES = {
  food: [
    'Chào {{to}}, mình là {{from}}. Hay là chúng mình tranh thủ ăn trưa hoặc uống cafe một buổi để làm quen nhé?',
    'Hi {{to}}, {{from}} đây. Mình muốn rủ bạn đi ăn trưa/cafe để trò chuyện và tìm hiểu nhau hơn. Bạn có rảnh không?',
    '{{to}} ơi, {{from}} đây. Mình đang tìm người ăn trưa cùng, bạn có muốn join để làm quen không?'
  ],
  sport: [
    'Chào {{to}}, mình là {{from}}. Mình thấy bạn cũng thích thể thao, hôm nào chúng ta giao lưu nhé?',
    'Hi {{to}}, {{from}} đây. Mình muốn tìm người tập cùng môn bạn thích. Cùng lên lịch một buổi nhé?',
    '{{to}} ơi, {{from}} đây. Mình thấy chúng ta có chung đam mê thể thao, cùng tập một buổi được không?'
  ],
  knowledge: [
    'Chào {{to}}, mình là {{from}}. Mình rất ấn tượng với profile của bạn và muốn kết nối để trao đổi tri thức. Bạn có sẵn lòng không?',
    'Hi {{to}}, {{from}} đây. Mình thấy có vài chỗ chúng ta có thể học hỏi lẫn nhau. Gặp nhau trao đổi một buổi nhé?',
    '{{to}} ơi, {{from}} đây. Mình muốn xin góc nhìn của bạn về một số chủ đề chuyên môn. Bạn có thể dành chút thời gian không?'
  ],
  casual: [
    'Chào {{to}}, mình là {{from}}. Mình muốn kết nối làm quen và trò chuyện nhẹ nhàng lúc rảnh. Bạn có rảnh không?',
    'Hi {{to}}, {{from}} đây. Mình thấy chúng ta có vài điểm chung nên rất muốn làm quen. Bạn có hứng trò chuyện không?',
    '{{to}} ơi, {{from}} đây. Mình muốn làm quen bạn, cùng trò chuyện chút khi nào rảnh nhé?'
  ],
  intro_meet: [
    'Chào {{to}}, em là {{from}}. Em là thành viên mới onboard, em rất mong được kết nối và gặp anh/chị 1 buổi ngắn 15-30 phút để giao lưu, học hỏi kinh nghiệm làm việc và làm quen văn hóa công ty ạ!',
    'Chào {{to}}, em là {{from}}. Em vừa gia nhập team, em muốn xin anh/chị một buổi gặp gỡ ngắn để làm quen và được chỉ bảo thêm. Anh/chị có thuận tiện không ạ?',
    'Chào {{to}}, em là {{from}}. Em đang trong giai đoạn làm quen công ty, em rất mong anh/chị dành chút thời gian gặp gỡ để em học hỏi. Em cảm ơn ạ!'
  ]
};

function pickTemplate(templates) {
  if (!templates || templates.length === 0) return null;
  return templates[Math.floor(Math.random() * templates.length)];
}

function fillTemplate(template, fromName = 'Mình', toName = 'bạn') {
  if (!template) return '';
  return template
    .replace(/\{\{from\}\}/g, fromName || 'Mình')
    .replace(/\{\{to\}\}/g, toName || 'bạn');
}

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

export function getConnectTypeTemplate(type, fromName, toName) {
  const templates = MESSAGE_TEMPLATES[type] || MESSAGE_TEMPLATES.casual;
  return fillTemplate(pickTemplate(templates), fromName, toName);
}

export function generateIcebreakerMessage(type = 'casual', fromName, toName) {
  return getConnectTypeTemplate(type, fromName, toName);
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
export function formatName(name, memberObj = null) {
  const member = (name && typeof name === 'object') ? name : memberObj;
  if (member) {
    const n = member.full_name;
    if (n && typeof n === 'string') {
      const trimmed = n.trim();
      if (trimmed !== '.' && trimmed !== '') return trimmed;
    }
    const email = member.work_email || member.personal_email;
    if (email && typeof email === 'string' && email.includes('@')) {
      return email.split('@')[0];
    }
  }

  if (typeof name === 'string') {
    const trimmed = name.trim();
    if (trimmed !== '.' && trimmed !== '') return trimmed;
  }

  return 'Đồng nghiệp';
}
