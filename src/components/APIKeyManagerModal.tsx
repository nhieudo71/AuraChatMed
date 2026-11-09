import React, { useState, useRef } from 'react';
import {
  X,
  Key,
  Search,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  Check,
  Trash2,
  Sparkles,
  Bot,
  Mic,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
  Pencil,
  Plus,
  Zap,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { CustomProviderConfig, UserPreferences } from '../types';
import { AI_SERVICES_CATALOG, AIServiceInfo } from '../data/apiServicesCatalog';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';
import { createBackupPayload, parseApiKeysBackup, downloadBackupFile } from '../utils/backupUtils';

interface APIKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: CustomProviderConfig[];
  onSaveProviders: (updated: CustomProviderConfig[]) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (pref: Partial<UserPreferences>) => void;
}

export const APIKeyManagerModal: React.FC<APIKeyManagerModalProps> = ({
  isOpen,
  onClose,
  providers,
  onSaveProviders,
  preferences,
  onUpdatePreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'llm' | 'tts' | 'image_video'>('llm');
  const [subView, setSubView] = useState<'my_keys' | 'catalog'>('my_keys');

  // New Provider Form
  const [providerName, setProviderName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit Provider State
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBaseUrl, setEditBaseUrl] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editShowKey, setEditShowKey] = useState(false);
  const [editModels, setEditModels] = useState<string[]>([]);
  const [editSelectedModel, setEditSelectedModel] = useState('');
  const [isFetchingEditModels, setIsFetchingEditModels] = useState(false);
  const [editFetchError, setEditFetchError] = useState<string | null>(null);

  // Add Custom Model inline on a provider
  const [addingModelProviderId, setAddingModelProviderId] = useState<string | null>(null);
  const [newModelInput, setNewModelInput] = useState('');

  // Testing Model state & Latency results
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; latencyMs?: number; reply?: string; error?: string }>
  >({});

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Catalog search & filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTierFilter, setCatalogTierFilter] = useState<'all' | 'free' | 'freemium' | 'paid'>('all');

  // Backup & Restore
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Filtered catalog
  const filteredCatalog = AI_SERVICES_CATALOG.filter((item) => {
    const matchesCategory = item.category === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.baseUrl.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesTier = catalogTierFilter === 'all' || item.tier === catalogTierFilter;
    return matchesCategory && matchesSearch && matchesTier;
  });

  const handleApplyCatalogPreset = (preset: AIServiceInfo) => {
    setProviderName(preset.name);
    setBaseUrl(preset.baseUrl);
    setFetchedModels(preset.models);
    setSelectedModel(preset.defaultModel || preset.models[0] || '');
    setSubView('my_keys');
  };

  /**
   * Helper to fetch models with robust HTML-detection guarding against Unexpected token '<'
   */
  const requestModelsFromServer = async (targetBaseUrl: string, targetKey: string) => {
    let cleanBaseUrl = targetBaseUrl.trim().replace(/\/+$/, '');
    if (cleanBaseUrl.endsWith('/chat/completions')) {
      cleanBaseUrl = cleanBaseUrl.slice(0, -'/chat/completions'.length).replace(/\/+$/, '');
    }

    const resp = await fetch('/api/models/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: cleanBaseUrl,
        apiKey: targetKey.trim(),
      }),
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE') || text.includes('<html')) {
        throw new Error(
          `Máy chủ tại ${cleanBaseUrl} trả về trang Web HTML thay vì API JSON (HTTP ${resp.status}). Vui lòng kiểm tra lại Base URL.`
        );
      }
      throw new Error(`Phản hồi không phải định dạng JSON: ${text.slice(0, 100)}`);
    }

    if (!resp.ok) {
      throw new Error(data.error || `Lỗi máy chủ (${resp.status})`);
    }

    if (Array.isArray(data.models) && data.models.length > 0) {
      return data.models as string[];
    }
    throw new Error('Không tìm thấy danh sách mô hình trả về từ endpoint');
  };

  const handleFetchModels = async () => {
    if (!baseUrl.trim()) {
      setFetchError('Vui lòng nhập Base URL trước khi lấy danh sách model');
      return;
    }

    setIsFetchingModels(true);
    setFetchError(null);

    try {
      const models = await requestModelsFromServer(baseUrl, apiKey);
      setFetchedModels(models);
      setSelectedModel(models[0]);
    } catch (err: any) {
      console.error('Fetch models error:', err);
      setFetchError(err.message || 'Lỗi kết nối tới endpoint mô hình');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!providerName.trim() || !baseUrl.trim()) {
      setFetchError('Vui lòng nhập tên nhà cung cấp và Base URL');
      return;
    }

    try {
      const encKey = apiKey.trim() ? await encryptApiKey(apiKey.trim()) : '';
      const newProvider: CustomProviderConfig = {
        id: 'prov_' + Date.now(),
        name: providerName.trim(),
        category: activeTab,
        baseUrl: baseUrl.trim(),
        apiKey: encKey,
        models: fetchedModels.length > 0 ? fetchedModels : [selectedModel || 'default-model'],
        selectedModel: selectedModel.trim() || fetchedModels[0] || 'default-model',
        updatedAt: new Date().toISOString(),
      };

      const updated = [...providers.filter((p) => p.name !== newProvider.name), newProvider];
      onSaveProviders(updated);

      // Auto-activate if LLM
      if (activeTab === 'llm') {
        onUpdatePreferences({ activeProviderId: newProvider.id });
      }

      setSaveSuccess(true);
      setProviderName('');
      setBaseUrl('');
      setApiKey('');
      setFetchedModels([]);
      setSelectedModel('');
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error('Error saving provider:', err);
      setFetchError('Lỗi mã hóa khóa API');
    }
  };

  // Start Editing a Provider
  const handleStartEdit = async (prov: CustomProviderConfig) => {
    setEditingProviderId(prov.id);
    setEditName(prov.name);
    setEditBaseUrl(prov.baseUrl);
    setEditModels(prov.models || []);
    setEditSelectedModel(prov.selectedModel || prov.models?.[0] || '');
    setEditFetchError(null);
    setEditApiKey(''); // Let user keep existing unless changed
    setEditShowKey(false);
  };

  const handleFetchEditModels = async () => {
    if (!editBaseUrl.trim()) {
      setEditFetchError('Vui lòng nhập Base URL');
      return;
    }
    setIsFetchingEditModels(true);
    setEditFetchError(null);

    try {
      let keyToUse = editApiKey.trim();
      if (!keyToUse) {
        // Try decrypting existing key
        const existing = providers.find((p) => p.id === editingProviderId);
        if (existing?.apiKey) {
          keyToUse = await decryptApiKey(existing.apiKey);
        }
      }
      const models = await requestModelsFromServer(editBaseUrl, keyToUse);
      setEditModels(models);
      if (!models.includes(editSelectedModel)) {
        setEditSelectedModel(models[0]);
      }
    } catch (err: any) {
      setEditFetchError(err.message || 'Lỗi khi lấy danh sách model');
    } finally {
      setIsFetchingEditModels(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const existing = providers.find((p) => p.id === id);
    if (!existing) return;

    try {
      let finalKey = existing.apiKey;
      if (editApiKey.trim()) {
        finalKey = await encryptApiKey(editApiKey.trim());
      }

      const updatedList = providers.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            name: editName.trim() || p.name,
            baseUrl: editBaseUrl.trim() || p.baseUrl,
            apiKey: finalKey,
            models: editModels.length > 0 ? editModels : p.models,
            selectedModel: editSelectedModel.trim() || p.selectedModel,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      onSaveProviders(updatedList);
      setEditingProviderId(null);
    } catch (err: any) {
      setEditFetchError('Lỗi cập nhật cấu hình: ' + err.message);
    }
  };

  // Add Custom Model to a Provider
  const handleAddCustomModelToProvider = (providerId: string) => {
    if (!newModelInput.trim()) return;
    const modelToAdd = newModelInput.trim();

    const updated = providers.map((p) => {
      if (p.id === providerId) {
        const currentModels = p.models || [];
        const newModels = currentModels.includes(modelToAdd) ? currentModels : [...currentModels, modelToAdd];
        return {
          ...p,
          models: newModels,
          selectedModel: modelToAdd,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    onSaveProviders(updated);
    setNewModelInput('');
    setAddingModelProviderId(null);
  };

  // Test Model Connectivity & Latency
  const handleTestProvider = async (prov?: CustomProviderConfig, isDefaultGemini = false) => {
    const targetId = isDefaultGemini ? 'default_gemini' : prov?.id || 'unknown';
    setTestingProviderId(targetId);

    try {
      let cleanApiKey = '';
      let cleanBaseUrl = '';
      let testModel = 'gemini-3.8-flash';
      let category = 'llm';

      if (isDefaultGemini) {
        testModel = 'gemini-3.8-flash';
        category = 'llm';
      } else if (prov) {
        category = prov.category;
        cleanBaseUrl = prov.baseUrl;
        testModel = prov.selectedModel;
        if (prov.apiKey) {
          cleanApiKey = await decryptApiKey(prov.apiKey);
        }
      }

      const resp = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: cleanBaseUrl,
          apiKey: cleanApiKey,
          model: testModel,
          category,
        }),
      });

      const text = await resp.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Máy chủ trả về dữ liệu không hợp lệ: ${text.slice(0, 100)}`);
      }

      if (!resp.ok || !data.success) {
        setTestResults((prev) => ({
          ...prev,
          [targetId]: {
            success: false,
            latencyMs: data.latencyMs,
            error: data.error || 'Kiểm tra thất bại',
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [targetId]: {
            success: true,
            latencyMs: data.latencyMs,
            reply: data.reply || 'PONG (Kết nối thành công)',
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [targetId]: {
          success: false,
          error: err.message || 'Lỗi mạng khi kiểm tra kết nối',
        },
      }));
    } finally {
      setTestingProviderId(null);
    }
  };

  // Delete Provider
  const handleDeleteProvider = (id: string) => {
    const updated = providers.filter((p) => p.id !== id);
    onSaveProviders(updated);

    if (preferences.activeProviderId === id) {
      onUpdatePreferences({ activeProviderId: undefined });
    }
    if (preferences.activeTtsProviderId === id) {
      onUpdatePreferences({ activeTtsProviderId: undefined });
    }
    if (preferences.activeImageProviderId === id) {
      onUpdatePreferences({ activeImageProviderId: undefined });
    }
    setDeleteConfirmId(null);
  };

  // Switch default provider for LLM, TTS, or Image
  const handleSetDefaultProvider = (providerId?: string) => {
    if (activeTab === 'llm') {
      onUpdatePreferences({ activeProviderId: providerId });
    } else if (activeTab === 'tts') {
      onUpdatePreferences({ activeTtsProviderId: providerId });
    } else if (activeTab === 'image_video') {
      onUpdatePreferences({ activeImageProviderId: providerId });
    }
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const payload = createBackupPayload(providers, preferences);
    downloadBackupFile(payload);
    setBackupMsg({ type: 'success', text: 'Đã tải tệp sao lưu aurachat_api_keys_backup.json về máy tính!' });
    setTimeout(() => setBackupMsg(null), 3500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backup = parseApiKeysBackup(text);

        onSaveProviders(backup.providers);
        if (backup.userPreferences) {
          onUpdatePreferences(backup.userPreferences);
        }

        setBackupMsg({ type: 'success', text: `Khôi phục thành công ${backup.providers.length} dịch vụ API!` });
        setTimeout(() => setBackupMsg(null), 3500);
      } catch (err: any) {
        setBackupMsg({ type: 'error', text: err.message || 'Lỗi đọc tệp sao lưu' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentCategoryProviders = providers.filter((p) => p.category === activeTab);
  const isDefaultGeminiActive =
    activeTab === 'llm' && (!preferences.activeProviderId || preferences.activeProviderId === 'default');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Quản lý Đa Dịch Vụ Khóa API</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  AES-256 mã hóa
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Chỉnh sửa, Test kết nối, Thêm model, Đặt làm mặc định & 100+ Gợi ý dịch vụ AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs: LLM | TTS | Image/Video */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-1 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/60 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('llm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'llm'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Bot size={14} />
              <span>LLM & Chat ({providers.filter((p) => p.category === 'llm').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tts'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Mic size={14} />
              <span>Voice TTS ({providers.filter((p) => p.category === 'tts').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('image_video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'image_video'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <ImageIcon size={14} />
              <span>Tạo Ảnh/Video ({providers.filter((p) => p.category === 'image_video').length})</span>
            </button>
          </div>

          {/* SubView toggle: My Keys vs 100+ Catalog */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-stone-200/60 dark:bg-stone-800 text-xs">
            <button
              onClick={() => setSubView('my_keys')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                subView === 'my_keys'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500'
              }`}
            >
              Khóa & Dịch vụ ({currentCategoryProviders.length})
            </button>
            <button
              onClick={() => setSubView('catalog')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                subView === 'catalog'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500'
              }`}
            >
              <Sparkles size={12} className="text-amber-500" />
              <span>Gợi ý 100+ Dịch vụ</span>
            </button>
          </div>
        </div>

        {/* Backup Feedback message banner */}
        {backupMsg && (
          <div
            className={`mx-4 sm:mx-5 mt-2.5 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              backupMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300'
            }`}
          >
            {backupMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{backupMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {subView === 'my_keys' ? (
            <div className="space-y-6">
              {/* Default Gemini Card for LLM tab */}
              {activeTab === 'llm' && (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isDefaultGeminiActive
                      ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <Zap size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          <span>Google Gemini (Tích hợp hệ thống)</span>
                          {isDefaultGeminiActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-semibold">
                              Đang dùng làm mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          Mô hình tốc độ cao gemini-3.8-flash & mô hình suy luận chuyên sâu gemini-4-argon
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        onClick={() => handleTestProvider(undefined, true)}
                        disabled={testingProviderId === 'default_gemini'}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                        title="Kiểm tra ping kết nối tới Google Gemini"
                      >
                        <Activity
                          size={12}
                          className={testingProviderId === 'default_gemini' ? 'animate-spin text-amber-500' : 'text-stone-400'}
                        />
                        <span>{testingProviderId === 'default_gemini' ? 'Đang test...' : 'Test kết nối'}</span>
                      </button>

                      {!isDefaultGeminiActive && (
                        <button
                          onClick={() => handleSetDefaultProvider('default')}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                        >
                          <RotateCcw size={12} />
                          <span>Đặt làm mặc định</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Test latency badge for default Gemini */}
                  {testResults['default_gemini'] && (
                    <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-[11px] flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                          testResults['default_gemini'].success
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {testResults['default_gemini'].success
                          ? `⚡ ${testResults['default_gemini'].latencyMs}ms (Thành công)`
                          : '✕ Thất bại'}
                      </span>
                      <span className="text-stone-600 dark:text-stone-400 truncate">
                        {testResults['default_gemini'].reply || testResults['default_gemini'].error}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Add New Provider Form */}
              <div className="p-4 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-500" />
                    Thêm dịch vụ mới ({activeTab.toUpperCase()})
                  </h4>
                  <button
                    onClick={() => setSubView('catalog')}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Xem danh mục 100+ dịch vụ có sẵn</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Tên dịch vụ:
                    </label>
                    <input
                      type="text"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      placeholder="Ví dụ: Groq Cloud, DeepSeek, OpenRouter, ElevenLabs..."
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Base URL (Tương thích OpenAI / REST API):
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.groq.com/openai/v1 hoặc http://localhost:11434/v1"
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-semibold text-stone-700 dark:text-stone-300">
                    Khóa API Key:
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-... hoặc gsk_... (Được mã hóa AES-GCM an toàn)"
                      className="w-full p-2.5 pr-9 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Model selection & Auto Fetch Models button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 text-xs">
                  <div className="flex-1">
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Chọn hoặc nhập Model ID:
                    </label>
                    {fetchedModels.length > 0 ? (
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
                      >
                        {fetchedModels.map((m, idx) => (
                          <option key={idx} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        placeholder="Nhập tên model (ví dụ: llama-3.3-70b-versatile, deepseek-chat...)"
                        className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
                      />
                    )}
                  </div>

                  <button
                    onClick={handleFetchModels}
                    disabled={isFetchingModels || !baseUrl.trim()}
                    className="sm:self-end flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
                    title="Tự động gọi endpoint /models để tải danh sách model"
                  >
                    <RefreshCw size={13} className={isFetchingModels ? 'animate-spin text-amber-500' : ''} />
                    <span>{isFetchingModels ? 'Đang lấy model...' : 'Lấy Model tự động'}</span>
                  </button>
                </div>

                {/* Error alert */}
                {fetchError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{fetchError}</span>
                  </div>
                )}

                {/* Save button */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleSaveProvider}
                    disabled={!providerName.trim() || !baseUrl.trim()}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer ${
                      saveSuccess ? 'bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {saveSuccess ? <Check size={14} /> : <CheckCircle2 size={14} />}
                    <span>{saveSuccess ? 'Đã lưu & Áp dụng thành công!' : 'Lưu dịch vụ này'}</span>
                  </button>
                </div>
              </div>

              {/* List of Configured Providers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Dịch vụ đã cấu hình ({currentCategoryProviders.length})
                  </h4>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Tùy chọn Chỉnh sửa, Test kết nối, Thêm model & Đổi mặc định
                  </span>
                </div>

                {currentCategoryProviders.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-400 text-xs">
                    Chưa có cấu hình dịch vụ {activeTab.toUpperCase()} nào được thêm. Hãy thêm dịch vụ ở khung trên hoặc áp dụng từ danh mục gợi ý!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentCategoryProviders.map((prov) => {
                      const isDefaultActive =
                        activeTab === 'llm'
                          ? preferences.activeProviderId === prov.id
                          : activeTab === 'tts'
                          ? preferences.activeTtsProviderId === prov.id
                          : preferences.activeImageProviderId === prov.id;

                      const isEditing = editingProviderId === prov.id;
                      const testInfo = testResults[prov.id];
                      const isTesting = testingProviderId === prov.id;
                      const isAddingModel = addingModelProviderId === prov.id;

                      return (
                        <div
                          key={prov.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDefaultActive
                              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                          }`}
                        >
                          {/* ================= EDIT MODE ================= */}
                          {isEditing ? (
                            <div className="space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                                <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                  <Pencil size={13} className="text-amber-500" />
                                  Chỉnh sửa dịch vụ: {prov.name}
                                </span>
                                <button
                                  onClick={() => setEditingProviderId(null)}
                                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs"
                                >
                                  Hủy
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1">
                                    Tên dịch vụ:
                                  </label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1">
                                    Base URL:
                                  </label>
                                  <input
                                    type="text"
                                    value={editBaseUrl}
                                    onChange={(e) => setEditBaseUrl(e.target.value)}
                                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1">
                                  Cập nhật API Key mới (bỏ trống nếu giữ nguyên khóa đã lưu):
                                </label>
                                <div className="relative">
                                  <input
                                    type={editShowKey ? 'text' : 'password'}
                                    value={editApiKey}
                                    onChange={(e) => setEditApiKey(e.target.value)}
                                    placeholder="•••••••••••• (Đang dùng khóa đã mã hóa)"
                                    className="w-full p-2 pr-8 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditShowKey(!editShowKey)}
                                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                                  >
                                    {editShowKey ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="flex-1">
                                  <label className="block font-medium text-stone-600 dark:text-stone-400 mb-1">
                                    Model mặc định:
                                  </label>
                                  {editModels.length > 0 ? (
                                    <select
                                      value={editSelectedModel}
                                      onChange={(e) => setEditSelectedModel(e.target.value)}
                                      className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
                                    >
                                      {editModels.map((m, idx) => (
                                        <option key={idx} value={m}>
                                          {m}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={editSelectedModel}
                                      onChange={(e) => setEditSelectedModel(e.target.value)}
                                      className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
                                    />
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={handleFetchEditModels}
                                  disabled={isFetchingEditModels || !editBaseUrl.trim()}
                                  className="sm:self-end flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs disabled:opacity-50"
                                >
                                  <RefreshCw size={12} className={isFetchingEditModels ? 'animate-spin text-amber-500' : ''} />
                                  <span>{isFetchingEditModels ? 'Đang lấy...' : 'Lấy Model lại'}</span>
                                </button>
                              </div>

                              {editFetchError && (
                                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                                  <AlertCircle size={13} className="shrink-0" />
                                  <span>{editFetchError}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingProviderId(null)}
                                  className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(prov.id)}
                                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
                                >
                                  Lưu thay đổi
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ================= NORMAL VIEW MODE ================= */
                            <div>
                              {/* Header & Badges */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                      {prov.name}
                                    </span>
                                    {isDefaultActive ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-semibold">
                                        Đang dùng làm mặc định
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                                        {prov.category.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-stone-400 truncate max-w-sm mt-0.5">
                                    {prov.baseUrl}
                                  </div>
                                </div>

                                {/* Quick Model Switcher Dropdown */}
                                <div className="flex items-center gap-1.5">
                                  {prov.models && prov.models.length > 1 ? (
                                    <select
                                      value={prov.selectedModel}
                                      onChange={(e) => {
                                        const newSelected = e.target.value;
                                        const updatedList = providers.map((p) =>
                                          p.id === prov.id ? { ...p, selectedModel: newSelected } : p
                                        );
                                        onSaveProviders(updatedList);
                                      }}
                                      className="p-1 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-medium"
                                      title="Chọn model hoạt động"
                                    >
                                      {prov.models.map((m, idx) => (
                                        <option key={idx} value={m}>
                                          {m}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg">
                                      {prov.selectedModel || 'Mặc định'}
                                    </span>
                                  )}

                                  {/* Add model button */}
                                  <button
                                    onClick={() => {
                                      setAddingModelProviderId(isAddingModel ? null : prov.id);
                                      setNewModelInput('');
                                    }}
                                    className="p-1 text-stone-500 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                    title="Thêm model ID tùy chỉnh"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Inline Add Model Input Form */}
                              {isAddingModel && (
                                <div className="p-2.5 my-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center gap-2 animate-in fade-in">
                                  <input
                                    type="text"
                                    value={newModelInput}
                                    onChange={(e) => setNewModelInput(e.target.value)}
                                    placeholder="Nhập tên model ID mới (vd: deepseek-reasoner, llama-3.3-70b...)"
                                    className="flex-1 p-1.5 px-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddCustomModelToProvider(prov.id);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleAddCustomModelToProvider(prov.id)}
                                    disabled={!newModelInput.trim()}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                                  >
                                    Thêm
                                  </button>
                                  <button
                                    onClick={() => setAddingModelProviderId(null)}
                                    className="px-2 py-1.5 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              )}

                              {/* Test Result Display */}
                              {testInfo && (
                                <div className="mt-2 mb-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 text-[11px] flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold shrink-0 ${
                                        testInfo.success
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                      }`}
                                    >
                                      {testInfo.success ? `⚡ ${testInfo.latencyMs}ms (Thành công)` : '✕ Thất bại'}
                                    </span>
                                    <span className="text-stone-600 dark:text-stone-300 truncate">
                                      {testInfo.reply || testInfo.error}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-stone-100 dark:border-stone-800 text-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Test Model button */}
                                  <button
                                    onClick={() => handleTestProvider(prov, false)}
                                    disabled={isTesting}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors cursor-pointer"
                                    title="Kiểm tra kết nối và độ trễ phản hồi của model"
                                  >
                                    <Activity
                                      size={12}
                                      className={isTesting ? 'animate-spin text-amber-500' : 'text-stone-400'}
                                    />
                                    <span>{isTesting ? 'Đang test...' : 'Test kết nối'}</span>
                                  </button>

                                  {/* Edit button */}
                                  <button
                                    onClick={() => handleStartEdit(prov)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors cursor-pointer"
                                    title="Chỉnh sửa thông tin dịch vụ này"
                                  >
                                    <Pencil size={12} className="text-stone-400" />
                                    <span>Chỉnh sửa</span>
                                  </button>

                                  {/* Set as default button */}
                                  {!isDefaultActive && (
                                    <button
                                      onClick={() => handleSetDefaultProvider(prov.id)}
                                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white font-medium transition-colors cursor-pointer border border-amber-500/20"
                                      title="Đặt dịch vụ này làm mặc định khi tạo mới hoặc chat"
                                    >
                                      Đặt làm mặc định
                                    </button>
                                  )}
                                </div>

                                {/* Delete button with confirm */}
                                <div>
                                  {deleteConfirmId === prov.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in">
                                      <span className="text-[10px] text-red-500 font-semibold">Xóa vĩnh viễn?</span>
                                      <button
                                        onClick={() => handleDeleteProvider(prov.id)}
                                        className="px-2 py-0.5 rounded-lg bg-red-600 text-white font-semibold text-[10px]"
                                      >
                                        Đồng ý
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-1.5 py-0.5 rounded-lg text-stone-400 hover:text-stone-600 text-[10px]"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmId(prov.id)}
                                      className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                      title="Xóa dịch vụ này"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================= 100+ CATALOG VIEW ================= */
            <div className="space-y-4">
              {/* Search & Tier filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Tìm kiếm trong danh mục 100+ dịch vụ AI..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-transparent focus:border-amber-500 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'free', label: 'Hoàn toàn Free' },
                    { id: 'freemium', label: 'Có gói Free / Trial' },
                    { id: 'paid', label: 'Trả phí' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setCatalogTierFilter(filter.id as any)}
                      className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap text-xs transition-colors cursor-pointer ${
                        catalogTierFilter === filter.id
                          ? 'bg-amber-500 text-white font-medium shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Catalog Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500/40 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            item.tier === 'free'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : item.tier === 'freemium'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20'
                          }`}
                        >
                          {item.tierLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mb-2">
                        {item.description}
                      </p>

                      <div className="text-[10px] font-mono text-stone-400 bg-stone-50 dark:bg-stone-800/60 p-1.5 rounded-lg truncate mb-2">
                        {item.baseUrl}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                      <a
                        href={item.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>Nhận API Key</span>
                        <ExternalLink size={10} />
                      </a>

                      <button
                        onClick={() => handleApplyCatalogPreset(item)}
                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <Check size={12} />
                        <span>Áp dụng cấu hình</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Backup & Restore Buttons */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Backup / Restore */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportBackup}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors cursor-pointer"
              title="Sao lưu toàn bộ khóa API và cấu hình về máy tính"
            >
              <Download size={13} />
              <span>Sao lưu về máy</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors cursor-pointer"
              title="Khôi phục danh sách khóa API từ tệp json"
            >
              <Upload size={13} />
              <span>Khôi phục tệp</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
