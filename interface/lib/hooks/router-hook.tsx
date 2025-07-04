import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

const useRouterHook = () => {
  const router = useRouter();

  // 跳转到主页
  const goToHome = () => {
    router.push('/');
  };

  // 跳转到登录页面
  const goToLogin = () => {
    router.push('/user/login');
  };

  // 跳转到注册页面
  const goToRegister = () => {
    router.push('/user/register');
  };

  // 跳转到用户收藏列表
  const goToFavList = () => {
    router.push(`/user/favlist`);
  };

  // 跳转到用户历史记录页面
  const goToHistory = () => {
    router.push(`/user/history`);
  };

  // 根据用户类型跳转到开发者模式
  const goToDeveloperPage = (userType: string | null) => {
    if (userType === 'developer') {
      router.push(`/user/developer`);
    }
  };

  const goToSolution = (id: string | null) => {
    if (id) {
      window.open(`/solution/${id}`);
    }
  };

  const goToGallery = () => {
    router.push('/gallery');
  }

  const goToPapers = () => {
    router.push('/paper')
  }

  const refreshPage = () => {
    logger.log("refresh");
    // router.refresh();
    // router.replace(router.asPath);
    window.location.reload();
  };

  return {
    routes:
    {
      goToHome,
      goToLogin,
      goToRegister,
      goToFavList,
      goToHistory,
      goToDeveloperPage,
      goToSolution,
      goToGallery,
      goToPapers,
      refreshPage,
    }
  };
};

export default useRouterHook;
