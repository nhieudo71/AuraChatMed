import React from 'react';
import {
  Menu,
  Download,
  Brain,
  Zap,
  FolderSync,
  Key,
  Stethoscope,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onToggleSidebar: () => void;
  title: string;
  thinkingMode: boolean;
  onToggleThinkingMode: () => void;
  onOpenExport: () => void;
  onOpenWorkspace: () => void;
  onOpenAPIKeys: () => void;
  onOpenMedical: () => void;
  onOpenSettings: () => void;
  activeProviderName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  title,
  thinkingMode,
  onToggleThinkingMode,
  onOpenExport,
  onOpenWorkspace,
  onOpenAPIKeys,
  onOpenMedical,
  onOpenSettings,
  activeProviderName,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/60">
      {/* Left side */}
      <div className="flex items-center gap-2 overflow-hidden max-w-[50%]">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors shrink-0"
          title="Mở thanh bên lịch sử"
          aria-label="Mở menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
            {title || 'Cuộc trò chuyện mới'}
          </span>
          {activeProviderName && (
            <span className="hidden lg:inline text-[13px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
              {activeProviderName}
            </span>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* PWA Install Button */}
        <PWAInstallButton variant="compact" />

        {/* Model quick switcher badge */}
        <button
          onClick={onToggleThinkingMode}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            thinkingMode
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800 border border-transparent'
          }`}
          title={thinkingMode ? 'Đang dùng Gemini 4 Argon (Tư duy cao)' : 'Đang dùng Gemini 3.8 Flash (Tốc độ cao)'}
        >
          {thinkingMode ? (
            <>
              <Brain size={14} className="text-amber-500" />
              <span className="hidden sm:inline">Argon Thinking</span>
              <span className="sm:hidden">Argon</span>
            </>
          ) : (
            <>
              <Zap size={14} className="text-amber-500" />
              <span className="hidden sm:inline">Gemini 3.8 Flash</span>
              <span className="sm:hidden">Flash</span>
            </>
          )}
        </button>

        {/* Medical Education Suite Button */}
        <button
          onClick={onOpenMedical}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
          title="Không gian học tập & Luyện thi Y Khoa chuyên sâu"
        >
          <Stethoscope size={13} className="text-emerald-500" />
          <span className="hidden sm:inline">Y Khoa</span>
        </button>

        {/* API Services Button */}
        <button
          onClick={onOpenAPIKeys}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors"
          title="Quản lý đa dịch vụ API Key & 100+ Gợi ý"
        >
          <Key size={13} className="text-amber-500" />
          <span className="hidden md:inline">Khóa API</span>
        </button>

        {/* Workspace export button */}
        <button
          onClick={onOpenWorkspace}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 transition-colors"
          title="Đồng bộ Google Workspace (Sheets, Docs, Slides, Calendar, Tasks, Forms)"
        >
          <FolderSync size={14} />
          <span className="hidden lg:inline">Workspace</span>
        </button>

        {/* Export chat button */}
        <button
          onClick={onOpenExport}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          title="Xuất cuộc hội thoại ra PDF, Word, Excel, PPTX, Markdown"
        >
          <Download size={14} />
          <span className="hidden lg:inline">Xuất</span>
        </button>
      </div>
    </header>
  );
};
