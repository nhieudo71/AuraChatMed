import React from 'react';
import {
  MessageSquarePlus,
  Key,
  FolderSync,
  Download,
  Settings,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

interface MobileBottomNavProps {
  onNewChat: () => void;
  onOpenMedical: () => void;
  onOpenAPIKeys: () => void;
  onOpenWorkspace: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onNewChat,
  onOpenMedical,
  onOpenAPIKeys,
  onOpenWorkspace,
  onOpenExport,
  onOpenSettings,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-3 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={onNewChat}
        className="flex flex-col items-center justify-center p-1 text-stone-600 dark:text-stone-300 hover:text-amber-500 active:scale-95 transition-all"
        title="Đoạn chat mới"
      >
        <div className="p-1 rounded-xl bg-amber-500/10 text-amber-500">
          <MessageSquarePlus size={18} />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Chat mới</span>
      </button>

      <button
        onClick={onOpenMedical}
        className="flex flex-col items-center justify-center p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 active:scale-95 transition-all"
        title="Góc Ôn Thi Y Khoa & Bệnh án ảo"
      >
        <div className="p-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Stethoscope size={18} />
        </div>
        <span className="text-[10px] font-bold mt-0.5">Y Khoa</span>
      </button>

      <button
        onClick={onOpenAPIKeys}
        className="flex flex-col items-center justify-center p-1 text-stone-600 dark:text-stone-300 hover:text-amber-500 active:scale-95 transition-all"
        title="Quản lý API Key & Dịch vụ"
      >
        <div className="p-1 rounded-xl text-stone-600 dark:text-stone-300">
          <Key size={18} />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Khóa API</span>
      </button>

      <button
        onClick={onOpenWorkspace}
        className="flex flex-col items-center justify-center p-1 text-stone-600 dark:text-stone-300 hover:text-blue-500 active:scale-95 transition-all"
        title="Google Workspace"
      >
        <div className="p-1 rounded-xl text-blue-500">
          <FolderSync size={18} />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Workspace</span>
      </button>

      <button
        onClick={onOpenExport}
        className="flex flex-col items-center justify-center p-1 text-stone-600 dark:text-stone-300 hover:text-amber-500 active:scale-95 transition-all"
        title="Xuất file"
      >
        <div className="p-1 rounded-xl text-stone-600 dark:text-stone-300">
          <Download size={18} />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Xuất file</span>
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center p-1 text-stone-600 dark:text-stone-300 hover:text-amber-500 active:scale-95 transition-all"
        title="Cài đặt"
      >
        <div className="p-1 rounded-xl text-stone-600 dark:text-stone-300">
          <Settings size={18} />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Cài đặt</span>
      </button>
    </nav>
  );
};
