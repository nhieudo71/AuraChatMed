import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Search,
  Sun,
  Moon,
  Sparkles,
  Cloud,
  CheckCircle2,
  LogOut,
  Edit2,
  Check,
  X,
  Key,
  Stethoscope,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ChatSession } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateSessionTitle: (id: string, newTitle: string) => void;
  user: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenSystemPrompt: () => void;
  onOpenAPIKeys: () => void;
  onOpenMedical: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUpdateSessionTitle,
  user,
  onGoogleSignIn,
  onSignOut,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenSystemPrompt,
  onOpenAPIKeys,
  onOpenMedical,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const handleSaveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateSessionTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 bg-stone-100/90 dark:bg-stone-900/95 border-r border-stone-200 dark:border-stone-800 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header: Brand & New Chat */}
        <div className="p-3.5 pb-2 border-b border-stone-200/70 dark:border-stone-800/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-xs">
                <Sparkles size={16} />
              </div>
              <span className="font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100">
                AuraChat AI
              </span>
            </div>
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              title="Đổi chủ đề sáng/tối"
              aria-label="Đổi chủ đề"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 shadow-xs text-xs font-semibold transition-all active:scale-98"
          >
            <Plus size={16} className="text-amber-500" />
            <span>Đoạn chat mới</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 pb-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-200/50 dark:bg-stone-800/50 border border-transparent focus:border-amber-500/50 text-stone-900 dark:text-stone-100 text-xs placeholder:text-stone-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có lịch sử chat'}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 font-medium'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <MessageSquare size={14} className={`shrink-0 ${isActive ? 'text-amber-500' : 'text-stone-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-white dark:bg-stone-800 px-1 py-0.5 rounded text-xs border border-amber-500 focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button
                        onClick={(e) => handleSaveEdit(session.id, e)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                        title="Lưu"
                        aria-label="Lưu tên"
                      >
                        <Check size={13} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartEdit(session, e)}
                          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                          title="Đổi tên"
                          aria-label="Đổi tên"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1 text-stone-400 hover:text-red-500"
                          title="Xóa"
                          aria-label="Xóa đoạn chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sync Status & Action shortcuts */}
        <div className="p-3 border-t border-stone-200/70 dark:border-stone-800/80 space-y-2">
          {/* PWA Install Button in Sidebar */}
          <div className="md:hidden">
            <PWAInstallButton variant="full" />
          </div>

          {/* Medical Education Suite */}
          <button
            onClick={() => {
              onOpenMedical();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Stethoscope size={14} className="text-emerald-500" />
              <span>Góc Ôn Thi Y Khoa</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
              MedEd
            </span>
          </button>

          <button
            onClick={() => {
              onOpenAPIKeys();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Key size={14} className="text-amber-500" />
              <span>Quản lý Khóa API</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
              100+ dịch vụ
            </span>
          </button>

          <button
            onClick={onOpenSystemPrompt}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-200/50 dark:bg-stone-800/40 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              <span>Chỉ dẫn hệ thống</span>
            </div>
            <span className="text-[10px] text-stone-400">Tùy biến</span>
          </button>

          {/* User Profile / Google Sign-in */}
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full shrink-0 border border-stone-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <Cloud size={10} />
                    <span>Firebase Sync</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
                  title="Cài đặt"
                  aria-label="Cài đặt"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={onGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-medium shadow-xs transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Đăng nhập đồng bộ</span>
              </button>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-stone-400">Lưu dữ liệu thiết bị</span>
                <button
                  onClick={onOpenSettings}
                  className="text-[11px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
                >
                  <Settings size={12} />
                  <span>Cài đặt</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
