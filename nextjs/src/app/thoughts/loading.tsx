/** 思考页面加载状态 */
export default function ThoughtsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/20 border-t-accent-start rounded-full animate-spin" />
        <span className="text-sm text-[var(--text-secondary)]">加载中...</span>
      </div>
    </div>
  );
}
