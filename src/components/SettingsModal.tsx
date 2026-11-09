import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  Volume2,
  Globe,
  Trash2,
  Lock,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserPreferences } from '../types';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (pref: Partial<UserPreferences>) => void;
  onSaveEncryptedApiKey: (encrypted: string) => void;
  savedEncryptedApiKey?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onSaveEncryptedApiKey,
  savedEncryptedApiKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [keySavedStatus, setKeySavedStatus] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      const encrypted = await encryptApiKey(apiKeyInput.trim(), passphrase);
      onSaveEncryptedApiKey(encrypted);
      onUpdatePreferences({ hasCustomApiKey: true });
      setKeySavedStatus(true);
      setApiKeyInput('');
      setPassphrase('');
      setTimeout(() => setKeySavedStatus(false), 2000);
    } catch (err) {
      console.error('Error encrypting key:', err);
    }
  };

  const handleRemoveKey = () => {
    onSaveEncryptedApiKey('');
    onUpdatePreferences({ hasCustomApiKey: false });
    setApiKeyInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <ShieldCheck size={22} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Cài đặt ứng dụng & Bảo mật
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Tùy chỉnh giao diện, giọng đọc và mã hóa khóa API an toàn
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs">
          {/* Section 1: Appearance & Theme */}
          <div className="space-y-2">
            <label className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Sun size={14} className="text-amber-500" />
              Chủ đề giao diện:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Sáng', icon: Sun },
                { id: 'dark', label: 'Tối', icon: Moon },
                { id: 'system', label: 'Hệ thống', icon: Laptop },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = preferences.theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onUpdatePreferences({ theme: item.id as any })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Language */}
          <div className="space-y-2">
            <label className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Globe size={14} className="text-blue-500" />
              Ngôn ngữ giao diện & dịch thuật:
            </label>
            <select
              value={preferences.language}
              onChange={(e) => onUpdatePreferences({ language: e.target.value as any })}
              className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            >
              <option value="vi">Tiếng Việt (Mặc định)</option>
              <option value="en">English (US)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="ko">한국어 (Korean)</option>
              <option value="zh">中文 (Chinese)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
            </select>
          </div>

          {/* Section 3: Text-to-Speech */}
          <div className="space-y-3 p-3.5 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Volume2 size={14} className="text-emerald-500" />
                Giọng đọc phản hồi (Text-to-Speech):
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] text-stone-500">Tự động đọc tin nhắn AI:</span>
                <input
                  type="checkbox"
                  checked={preferences.ttsAutoPlay || false}
                  onChange={(e) => onUpdatePreferences({ ttsAutoPlay: e.target.checked })}
                  className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                />
              </label>
            </div>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Chọn giọng đọc hệ thống:</label>
              <select
                value={preferences.ttsVoice || ''}
                onChange={(e) => onUpdatePreferences({ ttsVoice: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
              >
                <option value="">-- Mặc định hệ thống theo ngôn ngữ --</option>
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Advanced API Key Vault with AES-GCM Local Encryption */}
          <div className="space-y-3 p-4 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Key size={15} className="text-amber-500" />
              <label className="font-semibold text-stone-800 dark:text-stone-200">
                Khóa Gemini API tùy chỉnh (Người dùng nâng cao)
              </label>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Khóa API của bạn được mã hóa cục bộ bằng thuật toán <span className="font-medium text-stone-700 dark:text-stone-300">AES-GCM 256-bit</span> thông qua Web Crypto API. Khóa không bao giờ được lưu dưới dạng văn bản thô.
            </p>

            {savedEncryptedApiKey ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Lock size={14} />
                  <span>Đã lưu trữ an toàn khóa API cá nhân của bạn.</span>
                </div>
                <button
                  onClick={handleRemoveKey}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 text-[11px] font-medium transition-colors"
                >
                  <Trash2 size={12} />
                  Xóa khóa
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-2.5 pr-9 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Mật khẩu bảo vệ khóa (tùy chọn, tăng cường bảo mật)..."
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-stone-400">
                    Bỏ trống để sử dụng khóa mặc định được hệ thống cung cấp.
                  </span>
                  <button
                    onClick={handleSaveKey}
                    disabled={!apiKeyInput.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium shadow-sm disabled:opacity-40 transition-all"
                  >
                    {keySavedStatus ? <Check size={13} /> : <Lock size={13} />}
                    <span>{keySavedStatus ? 'Đã mã hóa & Lưu!' : 'Mã hóa & Lưu'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-5 mt-6 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl transition-colors shadow-sm"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
