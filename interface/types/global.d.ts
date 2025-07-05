// 全局类型声明文件

// 删除react相关声明，使用官方类型

// Next.js 导航
declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => Promise<void>;
  };
  
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

// React Icons
declare module 'react-icons/fa' {
  import { IconType } from 'react';
  export const FaArrowCircleUp: IconType;
  export const FaPaperclip: IconType;
  export const FaRedo: IconType;
  export const FaFileAlt: IconType;
  export const FaFileWord: IconType;
  export const FaFileExcel: IconType;
  export const FaFilePdf: IconType;
  export const FaFileCode: IconType;
  export const FaTimes: IconType;
}

// React Dropzone
declare module 'react-dropzone' {
  import { ComponentType } from 'react';
  
  interface DropzoneOptions {
    onDrop?: (acceptedFiles: File[], rejectedFiles: any[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    maxFiles?: number;
    onDropRejected?: (fileRejections: any[]) => void;
  }
  
  interface DropzoneState {
    getRootProps: (props?: any) => any;
    getInputProps: (props?: any) => any;
  }
  
  export function useDropzone(options?: DropzoneOptions): DropzoneState;
}

// React Textarea Autosize
declare module 'react-textarea-autosize' {
  import { ComponentType, TextareaHTMLAttributes } from 'react';
  
  interface TextareaAutosizeProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    minRows?: number;
    maxRows?: number;
    cacheMeasurements?: boolean;
    onHeightChange?: (height: number) => void;
  }
  
  const TextareaAutosize: ComponentType<TextareaAutosizeProps>;
  export default TextareaAutosize;
}

// Material-UI
declare module '@mui/material/CircularProgress' {
  import { ComponentType } from 'react';
  
  interface CircularProgressProps {
    size?: number | string;
    className?: string;
    [key: string]: any;
  }
  
  const CircularProgress: ComponentType<CircularProgressProps>;
  export default CircularProgress;
}

// Framer Motion
declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
}

// React Resizable Panels
declare module 'react-resizable-panels' {
  export const Panel: any;
  export const PanelGroup: any;
  export const PanelResizeHandle: any;
}

// JSON5
declare module 'json5' {
  export function parse(text: string, reviver?: (key: any, value: any) => any): any;
  export function stringify(value: any, replacer?: any, space?: string | number): string;
}

// Microsoft Fetch Event Source
declare module '@microsoft/fetch-event-source' {
  export function fetchEventSource(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      signal?: AbortSignal;
      onopen?: (response: Response) => void;
      onmessage?: (event: MessageEvent<any>) => void;
      onclose?: () => void;
      onerror?: (error: Error) => void;
      openWhenHidden?: boolean;
    }
  ): Promise<void>;
}

// Node.js types
declare namespace NodeJS {
  interface Timeout {
    ref(): Timeout;
    unref(): Timeout;
  }
  
  interface Timer {
    ref(): Timer;
    unref(): Timer;
  }
  
  type TimerOrTimeout = Timeout | Timer;
}

// MessageEvent 扩展
interface MessageEvent<T = any> {
  event?: string;
  data?: T;
} 