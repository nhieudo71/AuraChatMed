import { AI_SERVICES_CATALOG, AIServiceInfo } from '../data/apiServicesCatalog';
import type { CustomProviderConfig } from '../types';
import { encryptApiKey } from '../utils/crypto';

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
}

/**
 * Đọc tệp .env thành danh sách cặp khóa–giá trị.
 *
 * Xử lý các dạng thực tế hay gặp: dòng `export KEY=...` copy từ shell, giá trị
 * bọc trong nháy đơn/kép, chú thích cuối dòng, dấu `=` nằm trong giá trị
 * (base64 thường có), và ký tự xuống dòng CRLF của Windows.
 */
export function parseEnvFile(text: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const withoutExport = line.replace(/^export\s+/i, '');
    const eq = withoutExport.indexOf('=');
    if (eq <= 0) return;

    const key = withoutExport.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(key)) return;

    let value = withoutExport.slice(eq + 1).trim();

    // Giá trị trong nháy: lấy nguyên phần bên trong, giữ cả dấu cách.
    if (value.startsWith('"') || value.startsWith("'")) {
      const quote = value[0];
      const closing = value.lastIndexOf(quote);
      value = closing > 0 ? value.slice(1, closing) : value.slice(1);
    } else {
      // Không có nháy: cắt chú thích cuối dòng.
      const hash = value.indexOf(' #');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }

    value = value.trim();
    if (!value) return;

    entries.push({ key, value, line: index + 1 });
  });

  return entries;
}

/**
 * Bảng ánh xạ tên biến môi trường → id dịch vụ trong danh mục.
 *
 * Vì sao cần bảng thủ công: mỗi nhà cung cấp đặt tên biến một kiểu
 * (`GEMINI_API_KEY`, `GOOGLE_API_KEY`, `HF_TOKEN`...), không suy ra được từ
 * tên dịch vụ. Những biến không có trong bảng sẽ được đoán theo tiền tố.
 */
const ENV_VAR_TO_SERVICE: Record<string, string> = {
  GEMINI_API_KEY: 'google-gemini',
  GOOGLE_API_KEY: 'google-gemini',
  GOOGLE_GENERATIVE_AI_API_KEY: 'google-gemini',
  GOOGLE_GENAI_API_KEY: 'google-gemini',
  GROQ_API_KEY: 'groq',
  OPENROUTER_API_KEY: 'openrouter',
  DEEPSEEK_API_KEY: 'deepseek',
  OPENAI_API_KEY: 'openai',
  ANTHROPIC_API_KEY: 'anthropic',
  CLAUDE_API_KEY: 'anthropic',
  TOGETHER_API_KEY: 'together-ai',
  TOGETHERAI_API_KEY: 'together-ai',
  MISTRAL_API_KEY: 'mistral-ai',
  CEREBRAS_API_KEY: 'cerebras',
  SAMBANOVA_API_KEY: 'sambanova',
  PERPLEXITY_API_KEY: 'perplexity',
  PPLX_API_KEY: 'perplexity',
  XAI_API_KEY: 'xai-grok',
  GROK_API_KEY: 'xai-grok',
  COHERE_API_KEY: 'cohere',
  FIREWORKS_API_KEY: 'fireworks-ai',
  SILICONFLOW_API_KEY: 'siliconflow',
  HUGGINGFACE_API_KEY: 'huggingface-serverless',
  HF_TOKEN: 'huggingface-serverless',
  NOVITA_API_KEY: 'novita-ai',
  HYPERBOLIC_API_KEY: 'hyperbolic',
  DEEPINFRA_API_KEY: 'deepinfra',
  AI21_API_KEY: 'ai21-labs',
  MOONSHOT_API_KEY: 'moonshot-ai',
  ZHIPU_API_KEY: 'zhipu-glm',
  ZHIPUAI_API_KEY: 'zhipu-glm',
  DASHSCOPE_API_KEY: 'qwen-dashscope',
  QWEN_API_KEY: 'qwen-dashscope',
  MINIMAX_API_KEY: 'minimax-abab',
  ANYSCALE_API_KEY: 'anyscale',
  LEPTON_API_KEY: 'lepton-ai',
  GITHUB_TOKEN: 'github-models',
  AZURE_OPENAI_API_KEY: 'azure-ai-inference',
  AZURE_INFERENCE_KEY: 'azure-ai-inference',
  VERCEL_AI_GATEWAY_KEY: 'vercel-ai-gateway',
  REQUESTY_API_KEY: 'requesty-router',
  PORTKEY_API_KEY: 'portkey-gateway',
  HELICONE_API_KEY: 'helicone-proxy',
  // Font chữ / giọng nói / ảnh
  ELEVENLABS_API_KEY: 'elevenlabs',
  ELEVEN_LABS_API_KEY: 'elevenlabs',
  PLAYHT_API_KEY: 'playht',
  DEEPGRAM_API_KEY: 'deepgram',
  CARTESIA_API_KEY: 'cartesia',
  FAL_KEY: 'fal-ai',
  FAL_API_KEY: 'fal-ai',
  REPLICATE_API_TOKEN: 'replicate',
  STABILITY_API_KEY: 'stability-ai',
  LEONARDO_API_KEY: 'leonardo-ai',
  IDEOGRAM_API_KEY: 'ideogram-ai',
  RUNWAY_API_KEY: 'runway-ml',
  LUMA_API_KEY: 'luma-dream-machine',
  // Các cổng miễn phí
  LLM7_API_KEY: 'llm7',
  SEALION_API_KEY: 'sea-lion',
  SEA_LION_API_KEY: 'sea-lion',
  LONG_CAT_API_KEY: 'longcat',
  LONGCAT_API_KEY: 'longcat',
  ROUTEWAY_API_KEY: 'routeway',
  ELECTRONHUB_API_KEY: 'electronhub',
  TYPHOON_API_KEY: 'typhoon-ai',
  OPENTYPHOON_API_KEY: 'typhoon-ai',
  LLMTR_API_KEY: 'llmtr',
  SPEKA_API_KEY: 'speka-ai',
  PLUGSKY_API_KEY: 'plugsky',
  BLOCKRUN_API_KEY: 'blockrun',
  FREE_AI_API_KEY: 'free-ai',
  AMD_RADEON_API_KEY: 'amd-radeon',
};

/** Biến không phải khóa API dù có đuôi giống — bỏ qua để không tạo rác. */
const IGNORED_VAR_PATTERN =
  /(_BASE_URL|_ENDPOINT|_URL|_MODEL|_MODELS|_HOST|_PORT|_REGION|_ORG|_ORG_ID|_PROJECT|_PROJECT_ID|_TIMEOUT|_VERSION|_ENABLED|_DEBUG)$/i;

/** baseUrl còn chỗ trống ({account_id}, your-workspace...) thì không dùng được. */
export function isUsableBaseUrl(url: string): boolean {
  return Boolean(url) && !url.includes('{') && !/your-|YOUR_/.test(url);
}

/** Chuẩn hóa tên dịch vụ thành tiền tố biến môi trường để dò. */
function serviceToEnvPrefix(id: string): string {
  return id.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

export interface ImportCandidate {
  serviceId: string;
  name: string;
  category: 'llm' | 'tts' | 'image_video';
  baseUrl: string;
  apiKey: string;
  models: string[];
  selectedModel: string;
  envKey: string;
}

export interface ImportPlan {
  candidates: ImportCandidate[];
  /** Biến có tên lạ, không khớp dịch vụ nào trong danh mục. */
  unknown: EnvEntry[];
  /** Biến khớp dịch vụ nhưng không dùng được (thiếu Base URL, biến cấu hình). */
  skipped: { entry: EnvEntry; reason: string }[];
}

/**
 * Đọc nội dung .env và lập kế hoạch nhập — KHÔNG ghi gì cả.
 * Người dùng xem trước danh sách rồi mới xác nhận, tránh ghi đè nhầm cấu hình.
 */
export function planEnvImport(text: string): ImportPlan {
  const entries = parseEnvFile(text);

  const byId = new Map<string, AIServiceInfo>();
  const byEnvPrefix = new Map<string, AIServiceInfo>();
  for (const service of AI_SERVICES_CATALOG) {
    byId.set(service.id, service);
    byEnvPrefix.set(serviceToEnvPrefix(service.id), service);
  }

  const candidates: ImportCandidate[] = [];
  const unknown: EnvEntry[] = [];
  const skipped: { entry: EnvEntry; reason: string }[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (IGNORED_VAR_PATTERN.test(entry.key)) {
      skipped.push({ entry, reason: 'Biến cấu hình, không phải API Key' });
      continue;
    }

    // 1. Bảng ánh xạ thủ công
    let serviceId = ENV_VAR_TO_SERVICE[entry.key];

    // 2. Đoán theo tiền tố: FOO_API_KEY / FOO_KEY / FOO_TOKEN → dịch vụ "foo"
    if (!serviceId) {
      const prefix = entry.key.replace(/_(API_)?(KEY|TOKEN)$/i, '');
      if (prefix !== entry.key) {
        serviceId = byEnvPrefix.get(prefix.toUpperCase().replace(/[^A-Z0-9]+/g, '_'))?.id || '';
      }
    }

    if (!serviceId) {
      unknown.push(entry);
      continue;
    }

    const service = byId.get(serviceId);
    if (!service) {
      unknown.push(entry);
      continue;
    }

    if (seen.has(service.id)) {
      skipped.push({ entry, reason: `Đã có khóa khác cho ${service.name} ở trên` });
      continue;
    }

    if (!isUsableBaseUrl(service.baseUrl)) {
      skipped.push({
        entry,
        reason: `Base URL của ${service.name} cần điền tay (${service.baseUrl})`,
      });
      continue;
    }

    seen.add(service.id);
    candidates.push({
      serviceId: service.id,
      name: service.name,
      category: service.category,
      baseUrl: service.baseUrl,
      apiKey: entry.value,
      models: service.models,
      selectedModel: service.defaultModel || service.models[0] || 'default-model',
      envKey: entry.key,
    });
  }

  return { candidates, unknown, skipped };
}

/**
 * Chuyển kế hoạch thành cấu hình provider và mã hóa khóa.
 *
 * Mã hóa AES-GCM trước khi ghi, đúng như luồng thêm tay, để khóa không nằm
 * dạng thô trong localStorage.
 */
export async function buildProvidersFromPlan(
  plan: ImportPlan,
  selectedServiceIds: string[]
): Promise<CustomProviderConfig[]> {
  const now = new Date().toISOString();
  const result: CustomProviderConfig[] = [];

  for (const candidate of plan.candidates) {
    if (!selectedServiceIds.includes(candidate.serviceId)) continue;

    result.push({
      id: `prov_${candidate.serviceId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: candidate.name,
      category: candidate.category,
      baseUrl: candidate.baseUrl,
      apiKey: await encryptApiKey(candidate.apiKey),
      models: candidate.models.length ? candidate.models : [candidate.selectedModel],
      selectedModel: candidate.selectedModel,
      updatedAt: now,
    });
  }

  return result;
}
