/**
 * emoji-utils.ts
 * 工具函数，用于根据文本内容选择相关表情符号
 * 基于 Emojinize 论文 (https://arxiv.org/abs/2403.03857) 的思路优化
 */

import { allEmojiMappings, categoryEmojis } from './hooks/emojis';
import { logger } from '@/lib/logger';

// 常见英文停用词列表
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'now'
]);

/**
 * 提取文本中的关键词
 * @param text 需要分析的文本
 * @returns 关键词数组
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // 将文本转为小写并分词
  const words = text.toLowerCase()
    .replace(/[^\w\s\-]/g, ' ')  // 替换非单词字符为空格
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));  // 过滤停用词
  
  return words;
}

/**
 * 根据文本内容选择最相关的表情符号
 * @param text 需要分析的文本
 * @returns 相关的表情符号，如果没有匹配则返回默认表情符号
 */
export function getEmojiForText(text: string): string {
  if (!text) return '📄'; // 默认表情符号
  
  // 提取关键词
  const keywords = extractKeywords(text);
  if (keywords.length === 0) {
    return defaultEmojiByLength(text);
  }
  
  // 存储每个表情符号的分数和来源
  type EmojiScore = { score: number, sources: Set<string> };
  const emojiScores: Record<string, EmojiScore> = {};
  
  // 优先匹配完整短语
  const lowerText = text.toLowerCase();
  for (const [keyword, emoji] of Object.entries(allEmojiMappings)) {
    // 跳过特殊关键词
    if (keyword.startsWith('default-')) continue;
    
    if (lowerText.includes(keyword.toLowerCase())) {
      // 根据关键词长度给表情符号打分（更长的关键词得分更高）
      const score = Math.pow(keyword.length, 1.5); // 使用幂函数增加长关键词的权重
      
      if (!emojiScores[emoji]) {
        emojiScores[emoji] = { score: 0, sources: new Set() };
      }
      
      emojiScores[emoji].score += score;
      emojiScores[emoji].sources.add(keyword);
    }
  }
  
  // 对于单个关键词进行匹配（如果没有完整短语匹配）
  if (Object.keys(emojiScores).length === 0) {
    for (const keyword of keywords) {
      let matched = false;
      
      for (const [dictKeyword, emoji] of Object.entries(allEmojiMappings)) {
        // 跳过特殊关键词
        if (dictKeyword.startsWith('default-')) continue;
        
        if (dictKeyword.toLowerCase().includes(keyword) || 
            keyword.includes(dictKeyword.toLowerCase())) {
          // 使用余弦相似度的思想，匹配程度越高分数越高
          const similarityScore = Math.min(keyword.length, dictKeyword.length) / 
                                 Math.max(keyword.length, dictKeyword.length);
          const score = similarityScore * Math.pow(keyword.length, 1.2);
          
          if (!emojiScores[emoji]) {
            emojiScores[emoji] = { score: 0, sources: new Set() };
          }
          
          emojiScores[emoji].score += score;
          emojiScores[emoji].sources.add(keyword);
          matched = true;
        }
      }
      
      // 如果关键词没有匹配到任何表情，尝试使用词根匹配
      if (!matched && keyword.length > 4) {
        const stem = keyword.substring(0, Math.ceil(keyword.length * 0.7)); // 简单词根提取
        
        for (const [dictKeyword, emoji] of Object.entries(allEmojiMappings)) {
          // 跳过特殊关键词
          if (dictKeyword.startsWith('default-')) continue;
          
          if (dictKeyword.toLowerCase().includes(stem) || 
              stem.includes(dictKeyword.toLowerCase())) {
            const stemScore = 0.7 * Math.min(stem.length, dictKeyword.length) / 
                             Math.max(stem.length, dictKeyword.length);
            
            if (!emojiScores[emoji]) {
              emojiScores[emoji] = { score: 0, sources: new Set() };
            }
            
            emojiScores[emoji].score += stemScore;
            emojiScores[emoji].sources.add(keyword + "(stem)");
          }
        }
      }
    }
  }
  
  // 应用类别多样性加权
  applyDiversityWeights(emojiScores);
  
  // 如果找到匹配的表情符号
  if (Object.keys(emojiScores).length > 0) {
    // 获取得分最高的表情符号
    const topEmojis = Object.entries(emojiScores)
      .sort((a, b) => b[1].score - a[1].score);
    
    // 记录匹配结果，帮助调试
    logger.log(`文本 "${text}" 匹配结果:`, 
      topEmojis.slice(0, 3).map(([emoji, data]) => 
        `${emoji} (分数: ${data.score.toFixed(2)}, 来源: ${Array.from(data.sources).join(', ')})`
      ).join(', ')
    );
    
    return topEmojis[0][0];
  }
  
  return defaultEmojiByLength(text);
}

/**
 * 应用类别多样性权重，避免过多相似表情符号
 */
function applyDiversityWeights(emojiScores: Record<string, { score: number, sources: Set<string> }>): void {
  // 识别属于同一类别的表情符号
  const categoryCount: Record<string, number> = {};
  
  for (const [emoji] of Object.entries(emojiScores)) {
    for (const [category, emojis] of Object.entries(categoryEmojis)) {
      // 使用类型断言确保 TypeScript 知道这是一个字符串数组
      const emojiArray = emojis as string[];
      if (emojiArray.includes(emoji)) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    }
  }
  
  // 对于过度代表的类别，减少其权重
  for (const [emoji, data] of Object.entries(emojiScores)) {
    for (const [category, emojis] of Object.entries(categoryEmojis)) {
      // 使用类型断言确保 TypeScript 知道这是一个字符串数组
      const emojiArray = emojis as string[];
      if (emojiArray.includes(emoji) && categoryCount[category] > 1) {
        // 应用多样性惩罚因子
        data.score = data.score / Math.sqrt(categoryCount[category]);
      }
    }
  }
}

/**
 * 根据文本长度返回默认表情符号
 */
function defaultEmojiByLength(text: string): string {
  if (text.length < 10) return allEmojiMappings['default-short'] || '📝'; // 短文本
  if (text.length < 20) return allEmojiMappings['default-medium'] || '📄'; // 中等长度文本
  return allEmojiMappings['default-long'] || '📃'; // 长文本
}

/**
 * 获取与标题相关的大型表情符号，适合作为背景或主要显示元素
 * @param title 标题文本
 * @returns 表情符号字符串
 */
export function getLargeEmojiForTitle(title: string): string {
  return getEmojiForText(title);
} 