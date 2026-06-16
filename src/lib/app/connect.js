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
