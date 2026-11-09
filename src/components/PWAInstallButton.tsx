import React, { useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as PWA standalone, suppress
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop standard install
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-xs transition-all active:scale-95 ${
          variant === 'compact' ? 'px-2.5 py-1.5 text-xs' : 'w-full justify-center px-4 py-2.5 text-sm'
        } ${className}`}
        title="Cài đặt ứng dụng AuraChat về màn hình chính"
      >
        <Download size={14} />
        <span>Cài đặt PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium transition-all ${
            variant === 'compact' ? 'px-2.5 py-1.5 text-xs' : 'w-full justify-center px-4 py-2.5 text-sm'
          } ${className}`}
          title="Cài đặt trên iPhone/iPad"
        >
          <Smartphone size={14} />
          <span>Cài trên iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-5 shadow-2xl border border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3.5 right-3.5 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Smartphone size={18} />
                </div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Cài đặt AuraChat trên iOS
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/50 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-500">1.</span>
                  <span>
                    Mở trang web trong trình duyệt <strong>Safari</strong> trên iPhone hoặc iPad.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-500">2.</span>
                  <span className="flex items-center gap-1 flex-wrap">
                    Nhấn vào biểu tượng <strong>Chia sẻ</strong> <Share size={12} className="inline text-blue-500" /> ở thanh công cụ dưới cùng.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-500">3.</span>
                  <span>
                    Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-stone-900 dark:bg-stone-100 py-2 text-xs font-semibold text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // Fallback for desktop/browsers where prompt is not yet triggered: show friendly custom in-app guide modal
  return (
    <>
      <button
        onClick={() => setShowHelpGuide(true)}
        className={`flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/40 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-all ${
          variant === 'compact' ? 'px-2 py-1.5 text-xs' : 'w-full justify-center px-4 py-2 text-xs'
        } ${className}`}
        title="Cài đặt PWA ứng dụng"
      >
        <Download size={13} />
        <span>Cài PWA</span>
      </button>

      {showHelpGuide && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-5 shadow-2xl border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setShowHelpGuide(false)}
              className="absolute top-3.5 right-3.5 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Download size={18} />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Cài đặt AuraChat PWA
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/50 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-500">1.</span>
                <span>
                  Trên Chrome, Edge hoặc Cốc Cốc, nhấn vào biểu tượng <strong>Cài đặt (Install)</strong> ở góc phải thanh địa chỉ URL.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-500">2.</span>
                <span>
                  Hoặc mở Menu trình duyệt <strong>(⋮)</strong> và chọn <strong>Cài đặt AuraChat</strong> hoặc <strong>Thêm vào màn hình chính</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-500">3.</span>
                <span>
                  Ứng dụng sẽ hoạt động độc lập như app native với biểu tượng riêng trên máy tính và điện thoại.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHelpGuide(false)}
              className="mt-4 w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-2 text-xs font-semibold text-white transition-opacity shadow-xs"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
