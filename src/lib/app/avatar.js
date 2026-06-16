// Deterministic avatar gradient generator based on name initials
export function getAvatarGradient(char) {
  const gradients = [
    'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', // Coral sunset
    'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)', // Indigo cyan
    'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Emerald mint
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber gold
    'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', // Pink purple
    'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)', // Teal sky
    'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'  // Violet indigo
  ];
  if (!char) return gradients[0];
  const code = char.charCodeAt(0);
  return gradients[code % gradients.length];
}
