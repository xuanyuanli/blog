// 根据环境选择合适的API实现
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

let api: any;

if (isTauri) {
  // 在Tauri环境中使用真实API  
  import('./api').then(module => {
    api = module.api;
  });
} else {
  // 在开发环境中使用模拟API
  import('./api.mock').then(module => {
    api = module.api;
  });
}

// 如果还没加载完成，先使用模拟API作为默认值
if (!api) {
  const mockModule = await import('./api.mock');
  api = mockModule.api;
}

export { api };
export default api;