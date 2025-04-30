import { useState, useEffect } from 'react';

interface ProgressDisplayProps {
  progress: number;
  stageEmoji: string;
  stageDescription: string;
  statusMessage: string;
}

const ProgressDisplay = ({ 
  progress, 
  stageEmoji, 
  stageDescription, 
  statusMessage 
}: ProgressDisplayProps) => {
  return (
    <div className="flex-none p-6 mt-2 flex flex-col items-center justify-center border-b border-secondary/30">
      {/* 更大的emoji并添加更平滑的浮动动画效果 */}
      <div 
        className="text-6xl mb-6 emoji-float"
        style={{ 
          textShadow: '0 0 15px rgba(255, 255, 255, 0.4)',
        }}
      >
        {stageEmoji}
      </div>

      {/* 更突出的描述文本 */}
      <h2 className="text-2xl font-bold mb-8 text-text-secondary text-center transition-all">
        {stageDescription}
      </h2>

      {/* 自定义进度条 */}
      <div className="w-full max-w-2xl mb-4 relative h-4 bg-gray-200/20 rounded-full overflow-hidden">
        {/* 背景闪光效果 */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-30"
          style={{
            animation: 'gradient-shift 3s ease infinite',
            backgroundSize: '200% 200%',
          }}
        />
        
        {/* 进度条填充 */}
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out rounded-full relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          {/* 闪光效果 */}
          <div 
            className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-white/30 skew-x-[-20deg]"
            style={{
              animation: 'shine 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <div className="flex justify-between w-full max-w-2xl">
        <p className="text-sm text-gray-400"> </p>
        <p className="text-sm font-bold text-indigo-400">{`${Math.round(progress)}%`}</p>
      </div>

      {/* 添加全局样式 */}
      <style jsx global>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) skew-x(-20deg); }
          100% { transform: translateX(200%) skew-x(-20deg); }
        }
        
        @keyframes float {
          0% { 
            transform: translateY(0px) rotate(0deg); 
            filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.4));
          }
          25% {
            transform: translateY(-15px) rotate(-5deg);
            filter: drop-shadow(0 25px 15px rgba(0, 0, 0, 0.2));
          }
          50% {
            transform: translateY(-20px) rotate(0deg);
            filter: drop-shadow(0 30px 15px rgba(0, 0, 0, 0.2));
          }
          75% {
            transform: translateY(-15px) rotate(5deg);
            filter: drop-shadow(0 25px 15px rgba(0, 0, 0, 0.2));
          }
          100% { 
            transform: translateY(0px) rotate(0deg);
            filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.4));
          }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .emoji-float {
          animation: float 4s ease-in-out infinite, pulse 2s ease-in-out infinite;
          transform-origin: center;
          display: inline-block;
          position: relative;
          z-index: 1;
        }
        
        /* 添加轻微发光效果 */
        .emoji-float::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 80%;
          height: 80%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, rgba(79, 70, 229, 0) 70%);
          transform: translate(-50%, -50%);
          z-index: -1;
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ProgressDisplay; 