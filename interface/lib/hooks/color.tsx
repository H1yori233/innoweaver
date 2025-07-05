import tinycolor from 'tinycolor2';
import { useEffect, useState } from 'react';

function colorLerp(color1: number, color2: number, weight: number): number {
    return color1 * weight + color2 * (1 - weight);
}

// 为浅色主题定义的颜色调色板 - 折中方案，既不太鲜艳也不太淡
const lightColorPalette: string[] = [
    '#3B75DD', // 中等蓝色
    '#7952B3', // 中等紫色
    '#E64980', // 中等粉色
    '#20B486', // 中等绿色
    '#F59F00', // 中等橙色
    '#4DABF7', // 中等青蓝色
    '#E67C73', // 中等红色
    '#36B5A2', // 中等青色
    '#9775FA'  // 中等紫罗兰色
];

// 为深色主题定义的颜色调色板 - 折中方案，既不太鲜艳也不太淡
const darkColorPalette: string[] = [
    '#4D89E8', // 中等亮蓝色
    '#9775FA', // 中等亮紫色
    '#F06595', // 中等亮粉色
    '#38D9A9', // 中等亮绿色
    '#FFB84D', // 中等亮橙色
    '#74C0FC', // 中等亮青蓝色
    '#FA5252', // 中等亮红色
    '#3BC9DB', // 中等亮青色
    '#B197FC'  // 中等亮紫罗兰色
];

// 颜色饱和度和亮度调整函数
function adjustColorForTheme(color: string, isDarkTheme: boolean): string {
    const colorObj = tinycolor(color);
    
    if (isDarkTheme) {
        // 深色主题下，适度增加亮度，适度调整饱和度
        return colorObj.brighten(3).saturate(5).toString();
    } else {
        // 浅色主题下，适度降低亮度，适度调整饱和度
        return colorObj.darken(3).saturate(5).toString();
    }
}

export function GetColor(index: number, scale: number): string {
    // 检测当前主题
    const isDarkTheme = document.documentElement.classList.contains('dark');
    
    // 根据主题选择调色板
    const colorPalette = isDarkTheme ? darkColorPalette : lightColorPalette;
    
    // 获取主题文本颜色
    const themeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-primary')
        .trim() || (isDarkTheme ? '#FFFFFF' : '#1F2937');
    
    // 获取主题背景颜色
    const themeBgColor = isDarkTheme ? '#171717' : '#F9FAFB';
    
    // 选择基础颜色并根据主题调整
    const baseColor = adjustColorForTheme(colorPalette[index % colorPalette.length], isDarkTheme);
    
    // 混合颜色，使其更符合主题
    // 适度混合比例，既不太鲜艳也不太淡
    const mixRatio = isDarkTheme ? scale * 0.2 : scale * 0.3;
    const mixedColor = tinycolor.mix(baseColor, themeBgColor, mixRatio).toHexString();
    
    // 调整透明度，使其与背景更协调
    const alpha = isDarkTheme ? 0.9 : 0.85;
    const adjustedColor = tinycolor(mixedColor).setAlpha(alpha).toRgbString();
    
    return adjustedColor;
}

// 创建一个React Hook来监听主题变化
export function useThemeColor(index: number, scale: number) {
    const [color, setColor] = useState<string>('#000000');
    
    useEffect(() => {
        // 初始设置颜色
        setColor(GetColor(index, scale));
        
        // 创建一个MutationObserver来监听主题变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === 'attributes' && 
                    mutation.attributeName === 'class'
                ) {
                    setColor(GetColor(index, scale));
                }
            });
        });
        
        // 开始观察document.documentElement的class属性变化
        observer.observe(document.documentElement, { attributes: true });
        
        // 清理函数
        return () => observer.disconnect();
    }, [index, scale]);
    
    return color;
}
