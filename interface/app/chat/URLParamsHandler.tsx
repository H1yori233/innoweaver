import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface URLParamsHandlerProps {
  setSelectedMode: (mode: string) => void;
  setSelectedIds: (ids: string[]) => void;
}

/**
 * 处理URL参数的组件
 * 注意：目前主组件中已经直接处理URL参数，此组件作为备用
 */
const URLParamsHandler = ({ setSelectedMode, setSelectedIds }: URLParamsHandlerProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const ids = searchParams.get('ids');

    if (mode) {
      setSelectedMode(mode);
    }
    if (ids) {
      setSelectedIds(ids.split(','));
    }
  }, [searchParams, setSelectedMode, setSelectedIds]);

  return null;
};

export default URLParamsHandler; 