import type { ThemeId } from '../domain/types';
import type { IconName } from './components/Icons';

export const THEME_INFO: Record<ThemeId, { icon: IconName; name: string; blurb: string }> = {
  calm: { icon: 'leaf', name: '평온한 주', blurb: '가벼운 퀘스트 위주의 한 주. 경험치 ×1.0' },
  normal: { icon: 'shield', name: '보통의 주', blurb: '쉬움~보통 퀘스트. 경험치 ×1.3' },
  challenge: { icon: 'flame', name: '도전의 주', blurb: '어려운 퀘스트가 늘어나요. 경험치 ×1.6' },
  hell: { icon: 'skull', name: '지옥의 주', blurb: '가장 어려운 한 주. 경험치 ×2.0' },
};
