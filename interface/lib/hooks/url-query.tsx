export interface QueryParams {
  page?: number;
  query?: string;
  [key: string]: string | number | undefined;
}

export class URLQueryManager {
  private router: any;
  private basePath: string;

  constructor(router: any, basePath: string) {
    this.router = router;
    this.basePath = basePath;
  }

  /**
   * 构建查询字符串，自动过滤空值
   */
  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // 对于页码，如果是1则不添加到URL中（默认值）
        if (key === 'page' && value === 1) {
          return;
        }
        searchParams.set(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * 更新URL参数
   */
  updateQuery(params: QueryParams, replace: boolean = false): void {
    const queryString = this.buildQueryString(params);
    const newUrl = `${this.basePath}${queryString}`;
    
    if (replace) {
      this.router.replace(newUrl);
    } else {
      this.router.push(newUrl);
    }
  }

  /**
   * 解析当前URL参数
   */
  static parseSearchParams(searchParams: URLSearchParams): QueryParams {
    const page = searchParams.get('page');
    const query = searchParams.get('query');

    return {
      page: page ? Math.max(1, parseInt(page, 10)) : 1,
      query: query ? decodeURIComponent(query) : '',
    };
  }

  /**
   * 更新单个参数
   */
  updateSingleParam(key: string, value: string | number | undefined, currentParams: QueryParams): void {
    const newParams = { ...currentParams };
    
    if (value === undefined || value === null || value === '') {
      delete newParams[key];
    } else {
      newParams[key] = value;
    }

    // 如果更新的不是页码参数，则重置页码为1
    if (key !== 'page') {
      newParams.page = 1;
    }

    this.updateQuery(newParams);
  }

  /**
   * 重置所有参数
   */
  resetQuery(): void {
    this.router.push(this.basePath);
  }

  /**
   * 获取干净的URL（用于分享等场景）
   */
  getCleanUrl(params: QueryParams): string {
    const queryString = this.buildQueryString(params);
    return `${this.basePath}${queryString}`;
  }
}

/**
 * Hook for URL query management
 */
export const useURLQuery = (router: any, basePath: string) => {
  return new URLQueryManager(router, basePath);
}; 