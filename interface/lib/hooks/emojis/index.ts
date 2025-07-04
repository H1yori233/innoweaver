/**
 * 导出所有表情符号映射
 */

import { researchEmojis } from './research';
import { designEmojis } from './design';
import { techEmojis } from './tech';
import { humanEmojis } from './human';
import { generalEmojis } from './general';
import { innovationEmojis } from './innovation';

// 合并所有表情符号映射为一个对象
export const allEmojiMappings = {
  ...researchEmojis,
  ...designEmojis,
  ...techEmojis,
  ...humanEmojis,
  ...generalEmojis,
  ...innovationEmojis
};

// 将表情符号按类别分类，用于多样性权重计算
export const categoryEmojis: Record<string, string[]> = {
  research: Object.values(researchEmojis).filter((v, i, a) => a.indexOf(v) === i),
  design: Object.values(designEmojis).filter((v, i, a) => a.indexOf(v) === i),
  tech: Object.values(techEmojis).filter((v, i, a) => a.indexOf(v) === i),
  human: Object.values(humanEmojis).filter((v, i, a) => a.indexOf(v) === i),
  innovation: Object.values(innovationEmojis).filter((v, i, a) => a.indexOf(v) === i),
  // 从general中排除默认表情符号
  general: Object.entries(generalEmojis)
    .filter(([key]) => !key.startsWith('default-'))
    .map(([_, value]) => value)
    .filter((v, i, a) => a.indexOf(v) === i)
};

// 导出各个分类的表情符号映射
export {
  researchEmojis,
  designEmojis,
  techEmojis,
  humanEmojis,
  generalEmojis,
  innovationEmojis
}; 