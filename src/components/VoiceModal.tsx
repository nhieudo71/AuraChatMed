import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, X, Check, RefreshCw } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReady: (text: string) => void;
  customApiKey?: string;
  language?: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onTranscriptReady,
  customApiKey,
  language = 'vi',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
      setTranscript('');
      setError(null);
      setRecordDuration(0);
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioProcess(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setError('Không thể truy cập microphone. Vui lòng cho phép quyền truy cập micro trong trình duyệt.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAudioProcess = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: 'audio/webm',
            customApiKey,
            language,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Lỗi nhận diện giọng nói');
        }

        setTranscript(data.transcript || 'Không nhận diện được giọng nói.');
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Lỗi khi gửi dữ liệu giọng nói lên server');
      setIsTranscribing(false);
    }
  };

  const handleApply = () => {
    if (transcript) {
      onTranscriptReady(transcript);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Nhận diện giọng nói AI
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Được hỗ trợ bởi mô hình chuyên sâu <span className="font-semibold text-amber-500">gemini-3.5-transcribe</span>
          </p>
        </div>

        {/* Visualizer & Recording status */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <div className="absolute w-28 h-28 rounded-full bg-red-500/20 animate-ping" />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            >
              {isRecording ? <Square size={28} /> : <Mic size={32} />}
            </button>
          </div>

          <div className="mt-4 text-center">
            {isRecording ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-red-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Đang ghi âm: {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
              </span>
            ) : isTranscribing ? (
              <span className="inline-flex items-center gap-2 text-sm text-amber-500">
                <Loader2 size={16} className="animate-spin" />
                AI đang xử lý và chuyển thành văn bản...
              </span>
            ) : (
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Nhấn vào micro để bắt đầu nói
              </span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Transcript preview */}
        {transcript && (
          <div className="space-y-2 mb-4">
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              Kết quả văn bản:
            </label>
            <div className="p-3.5 max-h-36 overflow-y-auto rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
              {transcript}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {transcript && (
            <button
              onClick={startRecording}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <RefreshCw size={14} />
              Ghi lại
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Hủy
          </button>
          {transcript && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
            >
              <Check size={14} />
              Chèn vào tin nhắn
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
