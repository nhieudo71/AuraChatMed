import { FAST_MODEL, THINKING_MODEL, TRANSCRIBE_MODEL } from '../config/appConfig';
import { EXTRA_AI_SERVICES } from './apiServicesCatalogExtra';

export interface AIServiceInfo {
  id: string;
  name: string;
  category: 'llm' | 'tts' | 'image_video';
  tier: 'free' | 'freemium' | 'paid';
  tierLabel: string;
  baseUrl: string;
  authHeaderPrefix?: string;
  docsUrl: string;
  defaultModel: string;
  models: string[];
  description: string;
  /**
   * `false` khi dịch vụ KHÔNG dùng chuẩn OpenAI (/chat/completions).
   * Ví dụ AI Horde dùng API hàng đợi riêng: gọi `/chat/completions` sẽ trả 404
   * HTML. Giao diện dựa vào cờ này để cảnh báo thay vì để người dùng gặp lỗi
   * khó hiểu. Bỏ trống = `true` (mặc định coi là tương thích).
   */
  openAiCompatible?: boolean;
}

const CORE_AI_SERVICES: AIServiceInfo[] = [
  // ================= 1. LLM & CHAT REASONING SERVICES =================
  {
    id: 'google-gemini',
    name: 'Google Gemini AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Miễn phí + Trả phí',
    baseUrl: 'https://generativelanguage.googleapis.com',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    defaultModel: FAST_MODEL,
    models: [FAST_MODEL, THINKING_MODEL, 'gemini-3.1-flash-lite', TRANSCRIBE_MODEL],
    description: 'Mô hình siêu việt của Google với độ chính xác cao, context window 1M+ token và tốc độ truyền phát cực nhanh.'
  },
  {
    id: 'groq',
    name: 'Groq LPUs',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Miễn phí tốc độ siêu tốc',
    baseUrl: 'https://api.groq.com/openai/v1',
    docsUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    description: 'Bộ tăng tốc LPU cho tốc độ suy luận nhanh nhất thế giới (~500 tokens/s), miễn phí hàng chục nghìn token mỗi ngày.'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Nhiều model Free & Trả phí',
    baseUrl: 'https://openrouter.ai/api/v1',
    docsUrl: 'https://openrouter.ai/keys',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    models: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-r1:free',
      'google/gemini-2.0-flash-exp:free',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o'
    ],
    description: 'Cổng kết nối thống nhất hơn 200 mô hình AI lớn nhỏ. Cung cấp sẵn nhiều mô hình Llama, DeepSeek và Gemini hoàn toàn miễn phí.'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Giá siêu rẻ + Free credits',
    baseUrl: 'https://api.deepseek.com',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    description: 'Mô hình tư duy DeepSeek-R1 và V3 với khả năng lập trình, toán học và suy luận tương đương o1 với chi phí rẻ hơn 95%.'
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o / o1)',
    category: 'llm',
    tier: 'paid',
    tierLabel: 'Trả phí theo lượt dùng',
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini'],
    description: 'Mô hình chuẩn mực ngành công nghệ AI từ OpenAI, hỗ trợ đa phương thức và khả năng suy luận logic xuất sắc.'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'llm',
    tier: 'paid',
    tierLabel: 'Trả phí',
    baseUrl: 'https://api.anthropic.com/v1',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    description: 'Mô hình văn phong xuất sắc, viết code chính xác nhất hiện nay và khả năng tư duy bảo mật cao.'
  },
  {
    id: 'together-ai',
    name: 'Together AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng $5-25 credit dùng thử',
    baseUrl: 'https://api.together.xyz/v1',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'deepseek-ai/DeepSeek-R1', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
    description: 'Nền tảng Cloud mã nguồn mở siêu tốc độ với giá thành tối ưu cho Llama 3.3, DeepSeek R1 và Qwen.'
  },
  {
    id: 'mistral-ai',
    name: 'Mistral AI (La Plateforme)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Có gói Free Experiment',
    baseUrl: 'https://api.mistral.ai/v1',
    docsUrl: 'https://console.mistral.ai/api-keys',
    defaultModel: 'mistral-large-latest',
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest', 'pixtral-12b-2409'],
    description: 'Công ty AI hàng đầu châu Âu với mô hình Mistral Large và Codestral chuyên code cực kỳ mạnh mẽ.'
  },
  {
    id: 'cerebras',
    name: 'Cerebras Inference',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Miễn phí tốc độ cao (1M tokens/ngày)',
    baseUrl: 'https://api.cerebras.ai/v1',
    docsUrl: 'https://cloud.cerebras.ai/platform',
    defaultModel: 'llama3.1-70b',
    models: ['llama3.1-70b', 'llama3.1-8b'],
    description: 'Siêu chip bán dẫn Wafer-Scale cho tốc độ 2000+ tokens/giây, hỗ trợ miễn phí 1 triệu token mỗi ngày.'
  },
  {
    id: 'sambanova',
    name: 'SambaNova Cloud',
    category: 'llm',
    tier: 'free',
    tierLabel: '100% Miễn phí (Beta Developer)',
    baseUrl: 'https://api.sambanova.ai/v1',
    docsUrl: 'https://cloud.sambanova.ai',
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
    models: ['Meta-Llama-3.3-70B-Instruct', 'DeepSeek-R1', 'Qwen2.5-Coder-32B-Instruct'],
    description: 'Nền tảng tăng tốc AI miễn phí cung cấp Llama 3.3 70B, DeepSeek R1 với tốc độ hàng trăm token/giây không tốn phí.'
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI Search API',
    category: 'llm',
    tier: 'paid',
    tierLabel: 'Trả phí',
    baseUrl: 'https://api.perplexity.ai',
    docsUrl: 'https://www.perplexity.ai/settings/api',
    defaultModel: 'sonar-pro',
    models: ['sonar-pro', 'sonar', 'sonar-reasoning'],
    description: 'API tìm kiếm tri thức với dữ liệu thời gian thực từ web và trích dẫn nguồn uy tín.'
  },
  {
    id: 'xai-grok',
    name: 'xAI (Grok)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng $25 credit hàng tháng',
    baseUrl: 'https://api.x.ai/v1',
    docsUrl: 'https://console.x.ai',
    defaultModel: 'grok-2-latest',
    models: ['grok-2-latest', 'grok-2-vision-latest', 'grok-beta'],
    description: 'Mô hình AI của Elon Musk với khả năng suy luận sắc bén, hiểu biết thời gian thực và phân tích hình ảnh.'
  },
  {
    id: 'cohere',
    name: 'Cohere Command R+',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Trial Key miễn phí',
    baseUrl: 'https://api.cohere.com/v2',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    defaultModel: 'command-r-plus-08-2024',
    models: ['command-r-plus-08-2024', 'command-r-08-2024', 'embed-multilingual-v3.0'],
    description: 'Chuyên gia cho doanh nghiệp trong tác vụ RAG, tìm kiếm tương đồng ngữ nghĩa và xử lý dữ liệu phức tạp.'
  },
  {
    id: 'fireworks-ai',
    name: 'Fireworks AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng $1 credit dùng thử',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    docsUrl: 'https://fireworks.ai/account/api-keys',
    defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    models: ['accounts/fireworks/models/llama-v3p3-70b-instruct', 'accounts/fireworks/models/deepseek-r1', 'accounts/fireworks/models/qwen2p5-coder-32b-instruct'],
    description: 'Dịch vụ hosting mô hình AI độ trễ thấp, phục vụ inference chuyên nghiệp.'
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow (SiliconCloud)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng 20M tokens miễn phí',
    baseUrl: 'https://api.siliconflow.cn/v1',
    docsUrl: 'https://cloud.siliconflow.cn',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
    description: 'Nhà cung cấp đám mây AI với nhiều mô hình Qwen, DeepSeek và FLUX miễn phí.'
  },
  {
    id: 'cloudflare-workers-ai',
    name: 'Cloudflare Workers AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Miễn phí 10,000 neurons/ngày',
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1',
    docsUrl: 'https://developers.cloudflare.com/workers-ai',
    defaultModel: '@cf/meta/llama-3.3-70b-instruct',
    models: ['@cf/meta/llama-3.3-70b-instruct', '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', '@cf/mistral/mistral-7b-instruct-v0.1'],
    description: 'Mạng lưới AI biên toàn cầu của Cloudflare cho phép chạy mô hình miễn phí mỗi ngày.'
  },
  {
    id: 'huggingface-serverless',
    name: 'Hugging Face Inference API',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Miễn phí có giới hạn rate limit',
    baseUrl: 'https://api-inference.huggingface.co/v1',
    docsUrl: 'https://huggingface.co/settings/tokens',
    defaultModel: 'meta-llama/Llama-3.2-3B-Instruct',
    models: ['meta-llama/Llama-3.2-3B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3', 'Qwen/Qwen2.5-7B-Instruct'],
    description: 'Kho lưu trữ mã nguồn mở lớn nhất thế giới, hỗ trợ gọi API miễn phí hàng nghìn mô hình cộng đồng.'
  },
  {
    id: 'ollama-local',
    name: 'Ollama (Local API)',
    category: 'llm',
    tier: 'free',
    tierLabel: '100% Miễn phí & Offline',
    baseUrl: 'http://localhost:11434/v1',
    docsUrl: 'https://ollama.com',
    defaultModel: 'llama3.3',
    models: ['llama3.3', 'deepseek-r1:8b', 'qwen2.5-coder', 'mistral'],
    description: 'Chạy AI trực tiếp trên máy tính cá nhân của bạn, không gửi dữ liệu ra ngoài, hoàn toàn riêng tư và miễn phí.'
  },
  {
    id: 'vllm-local',
    name: 'vLLM / LM Studio Local',
    category: 'llm',
    tier: 'free',
    tierLabel: '100% Miễn phí cá nhân',
    baseUrl: 'http://localhost:1234/v1',
    docsUrl: 'https://lmstudio.ai',
    defaultModel: 'local-model',
    models: ['local-model'],
    description: 'Giao diện chạy mô hình AI cục bộ chuẩn OpenAI API trên máy Mac/Windows/Linux.'
  },
  {
    id: 'novita-ai',
    name: 'Novita AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng $0.5 dùng thử + Giá rẻ',
    baseUrl: 'https://api.novita.ai/v3/openai',
    docsUrl: 'https://novita.ai/dashboard/key',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    models: ['meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1', 'qwen/qwen-2.5-72b-instruct'],
    description: 'Dịch vụ suy luận GPU hiệu suất cao với bảng giá cạnh tranh cho cả LLM và tạo ảnh.'
  },
  {
    id: 'hyperbolic',
    name: 'Hyperbolic AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng $10 credit',
    baseUrl: 'https://api.hyperbolic.xyz/v1',
    docsUrl: 'https://app.hyperbolic.xyz',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
    models: ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
    description: 'Đám mây AI phi tập trung cung cấp GPU H100 giá cực rẻ và suy luận DeepSeek R1 nhanh chóng.'
  },
  {
    id: 'deepinfra',
    name: 'DeepInfra',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng credit dùng thử + Thanh toán theo token',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    docsUrl: 'https://deepinfra.com/dash/api_keys',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    models: ['meta-llama/Meta-Llama-3.1-70B-Instruct', 'deepseek-ai/DeepSeek-R1', 'google/gemma-2-27b-it'],
    description: 'Hạ tầng máy chủ cho mô hình mã nguồn mở với thời gian khởi động tức thì và chi phí tối thiểu.'
  },
  {
    id: 'ai21-labs',
    name: 'AI21 Labs (Jamba 1.5)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng credit dùng thử',
    baseUrl: 'https://api.ai21.com/studio/v1',
    docsUrl: 'https://studio.ai21.com/account/api-key',
    defaultModel: 'jamba-1.5-large',
    models: ['jamba-1.5-large', 'jamba-1.5-mini'],
    description: 'Kiến trúc lai Transformer-Mamba đột phá xử lý context 256K token siêu nhanh.'
  },
  {
    id: 'moonshot-ai',
    name: 'Moonshot AI (Kimi)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng 15 tệ credit',
    baseUrl: 'https://api.moonshot.cn/v1',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    defaultModel: 'moonshot-v1-128k',
    models: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
    description: 'Mô hình ngữ cảnh siêu dài hàng đầu châu Á với khả năng xử lý tài liệu lớn ấn tượng.'
  },
  {
    id: 'zhipu-glm',
    name: 'Zhipu AI (GLM-4)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng 25 triệu tokens miễn phí',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    docsUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    defaultModel: 'glm-4-plus',
    models: ['glm-4-plus', 'glm-4-flash', 'glm-4-long'],
    description: 'Hệ thống mô hình GLM-4 của Đại học Thanh Hoa với bản GLM-4-Flash hoàn toàn miễn phí cho mọi tác vụ.'
  },
  {
    id: 'qwen-dashscope',
    name: 'Alibaba Cloud (Qwen DashScope)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Miễn phí hàng triệu token',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    docsUrl: 'https://www.alibabacloud.com/help/en/model-studio',
    defaultModel: 'qwen-max',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen2.5-coder-32b-instruct'],
    description: 'Mô hình Qwen 2.5 dẫn đầu các bảng xếp hạng toán học và coding mã nguồn mở toàn cầu.'
  },
  {
    id: 'minimax-abab',
    name: 'MiniMax AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Có gói dùng thử',
    baseUrl: 'https://api.minimax.chat/v1',
    docsUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    defaultModel: 'abab6.5s-chat',
    models: ['abab6.5s-chat', 'abab6.5t-chat'],
    description: 'Công ty AI nổi tiếng với mô hình MoE Abab 6.5 và giọng nói nhân tạo đỉnh cao.'
  },
  {
    id: '01-ai-yi',
    name: '01.AI (Yi Models)',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng credit dùng thử',
    baseUrl: 'https://api.01.ai/v1',
    docsUrl: 'https://platform.01.ai',
    defaultModel: 'yi-lightning',
    models: ['yi-lightning', 'yi-large', 'yi-medium'],
    description: 'Mô hình Yi do tiến sĩ Kai-Fu Lee sáng lập với tốc độ suy luận nhanh và văn phong tự nhiên.'
  },
  {
    id: 'anyscale',
    name: 'Anyscale Endpoints',
    category: 'llm',
    tier: 'paid',
    tierLabel: 'Trả phí',
    baseUrl: 'https://api.endpoints.anyscale.com/v1',
    docsUrl: 'https://app.endpoints.anyscale.com/credentials',
    defaultModel: 'meta-llama/Meta-Llama-3-70B-Instruct',
    models: ['meta-llama/Meta-Llama-3-70B-Instruct'],
    description: 'Được sáng lập bởi đội ngũ phát triển thư viện phân tán Ray, tối ưu cho hạ tầng AI quy mô lớn.'
  },
  {
    id: 'lepton-ai',
    name: 'Lepton AI',
    category: 'llm',
    tier: 'freemium',
    tierLabel: 'Tặng $10 credit',
    baseUrl: 'https://api.lepton.ai/v1',
    docsUrl: 'https://dashboard.lepton.ai',
    defaultModel: 'llama3-1-70b',
    models: ['llama3-1-70b', 'deepseek-r1'],
    description: 'Nền tảng triển khai mô hình AI nhẹ và cực nhanh của cựu giám đốc kỹ thuật Alibaba Cloud.'
  },

  // ================= 2. TEXT-TO-SPEECH (TTS) & VOICE SERVICES =================
  {
    id: 'elevenlabs',
    name: 'ElevenLabs Speech AI',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Miễn phí 10,000 ký tự/tháng',
    baseUrl: 'https://api.elevenlabs.io/v1',
    docsUrl: 'https://elevenlabs.io/app/api-keys',
    defaultModel: 'eleven_multilingual_v2',
    models: ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_monolingual_v1'],
    description: 'Dịch vụ giọng đọc chân thực và biểu cảm cảm xúc số 1 thế giới với hỗ trợ tiếng Việt và hơn 30 thứ tiếng.'
  },
  {
    id: 'playht',
    name: 'PlayHT Voice AI',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Miễn phí 12,500 ký tự dùng thử',
    baseUrl: 'https://api.play.ht/api/v2',
    docsUrl: 'https://play.ht/studio/api-access',
    defaultModel: 'Play3.0-mini',
    models: ['Play3.0-mini', 'PlayHT2.0-turbo'],
    description: 'Giọng đọc AI chuyên nghiệp cho podcast, sách nói và video với độ trễ thấp dưới 300ms.'
  },
  {
    id: 'openai-tts',
    name: 'OpenAI Audio TTS',
    category: 'tts',
    tier: 'paid',
    tierLabel: 'Trả phí theo ký tự ($0.015/1K chars)',
    baseUrl: 'https://api.openai.com/v1/audio/speech',
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'tts-1',
    models: ['tts-1', 'tts-1-hd'],
    description: 'Chuyển văn bản thành giọng đọc tự nhiên với các giọng Alloy, Echo, Fable, Onyx, Nova, Shimmer.'
  },
  {
    id: 'deepgram',
    name: 'Deepgram Aura TTS & Nova-2 STT',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Tặng $200 credit dùng thử',
    baseUrl: 'https://api.deepgram.com/v1',
    docsUrl: 'https://console.deepgram.com',
    defaultModel: 'aura-asteria-en',
    models: ['aura-asteria-en', 'aura-luna-en', 'nova-2'],
    description: 'Chuyển đổi âm thanh thời gian thực cực nhanh với chi phí thấp và API streaming WebSocket.'
  },
  {
    id: 'cartesia',
    name: 'Cartesia Sonic',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Dùng thử miễn phí',
    baseUrl: 'https://api.cartesia.ai/v1',
    docsUrl: 'https://play.cartesia.ai',
    defaultModel: 'sonic-english',
    models: ['sonic-english', 'sonic-multilingual'],
    description: 'Mô hình State Space Model cho giọng nói phản hồi siêu tốc dưới 100ms.'
  },
  {
    id: 'azure-speech',
    name: 'Microsoft Azure Speech Service',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Miễn phí 500,000 ký tự/tháng',
    baseUrl: 'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
    docsUrl: 'https://portal.azure.com',
    defaultModel: 'vi-VN-HoaiMyNeural',
    models: ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'],
    description: 'Giọng đọc Neural chất lượng phát thanh quốc gia hỗ trợ tiếng Việt chuẩn xác từng ngữ điệu.'
  },
  {
    id: 'google-cloud-tts',
    name: 'Google Cloud Text-to-Speech',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Miễn phí 4 triệu ký tự/tháng',
    baseUrl: 'https://texttospeech.googleapis.com/v1',
    docsUrl: 'https://console.cloud.google.com',
    defaultModel: 'vi-VN-Wavenet-A',
    models: ['vi-VN-Wavenet-A', 'vi-VN-Wavenet-B', 'vi-VN-Neural2-A', 'vi-VN-Standard-A'],
    description: 'Công nghệ WaveNet & Neural2 hàng đầu của Google với gói miễn phí hàng tháng cực kỳ rộng rãi.'
  },
  {
    id: 'neets-ai',
    name: 'Neets AI',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Rất rẻ + Gói miễn phí',
    baseUrl: 'https://api.neets.ai/v1/tts',
    docsUrl: 'https://neets.ai',
    defaultModel: 'ar-diff-50k',
    models: ['ar-diff-50k', 'vits'],
    description: 'Giải pháp tạo giọng nói AI với giá thành chỉ $1 cho 1 triệu ký tự.'
  },
  {
    id: 'resemble-ai',
    name: 'Resemble AI',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Dùng thử miễn phí',
    baseUrl: 'https://app.resemble.ai/api/v2',
    docsUrl: 'https://app.resemble.ai',
    defaultModel: 'resemble-v2',
    models: ['resemble-v2'],
    description: 'Nền tảng nhân bản giọng nói và tổng hợp giọng nói đa cảm xúc với tính năng phát hiện deepfake.'
  },
  {
    id: 'murf-ai',
    name: 'Murf AI',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Miễn phí 10 phút tạo audio',
    baseUrl: 'https://api.murf.ai/v1/speech/generate',
    docsUrl: 'https://murf.ai/api',
    defaultModel: 'GEN2',
    models: ['GEN2'],
    description: 'Studio tạo giọng nói AI chuyên nghiệp cho các khóa học trực tuyến, thuyết minh video và quảng cáo.'
  },
  {
    id: 'fish-audio',
    name: 'Fish Audio',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Miễn phí hàng ngày',
    baseUrl: 'https://api.fish.audio/v1/tts',
    docsUrl: 'https://fish.audio',
    defaultModel: 'speech-1.5',
    models: ['speech-1.5'],
    description: 'Cộng đồng nhân bản giọng nói mã nguồn mở với hàng ngàn giọng anime, người nổi tiếng và đa ngôn ngữ.'
  },
  {
    id: 'lovo-ai',
    name: 'Lovo Genny API',
    category: 'tts',
    tier: 'freemium',
    tierLabel: '14 ngày dùng thử Pro',
    baseUrl: 'https://api.genny.lovo.ai/api/v1',
    docsUrl: 'https://genny.lovo.ai',
    defaultModel: 'lovo-v1',
    models: ['lovo-v1'],
    description: 'Kho hơn 500 giọng nói đa dạng cảm xúc cho nhà sáng tạo nội dung YouTube và TikTok.'
  },
  {
    id: 'hume-ai',
    name: 'Hume AI (EVI Voice)',
    category: 'tts',
    tier: 'freemium',
    tierLabel: 'Tặng $10 credit dùng thử',
    baseUrl: 'https://api.hume.ai/v0/evi/chat',
    docsUrl: 'https://beta.hume.ai',
    defaultModel: 'evi-2',
    models: ['evi-2'],
    description: 'Mô hình thấu cảm cảm xúc đầu tiên trên thế giới, điều chỉnh ngữ điệu theo tâm trạng người đối thoại.'
  },

  // ================= 3. IMAGE & VIDEO AI SERVICES =================
  {
    id: 'fal-ai',
    name: 'Fal.ai (FLUX / SD)',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Tặng credit dùng thử + Cực nhanh',
    baseUrl: 'https://queue.fal.run',
    docsUrl: 'https://fal.ai/dashboard/keys',
    defaultModel: 'fal-ai/flux/schnell',
    models: ['fal-ai/flux/schnell', 'fal-ai/flux/dev', 'fal-ai/flux-pro', 'fal-ai/kling-video/v1/standard'],
    description: 'Nền tảng inference GPU chạy mô hình FLUX.1 và tạo video Kling siêu tốc với độ trễ thấp nhất.'
  },
  {
    id: 'stability-ai',
    name: 'Stability AI (Stable Diffusion 3.5)',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Tặng 25 credits miễn phí',
    baseUrl: 'https://api.stability.ai/v2beta/stable-image/generate',
    docsUrl: 'https://platform.stability.ai/account/keys',
    defaultModel: 'sd3.5-large',
    models: ['sd3.5-large', 'sd3.5-medium', 'core', 'ultra'],
    description: 'Nhà phát triển của Stable Diffusion với các mô hình tạo ảnh nghệ thuật, render chữ và vector sắc nét.'
  },
  {
    id: 'replicate',
    name: 'Replicate',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Thanh toán theo giây sử dụng GPU',
    baseUrl: 'https://api.replicate.com/v1',
    docsUrl: 'https://replicate.com/account/api-tokens',
    defaultModel: 'black-forest-labs/flux-schnell',
    models: ['black-forest-labs/flux-schnell', 'black-forest-labs/flux-dev', 'minimax/video-01', 'lucataco/animate-diff'],
    description: 'Chạy hàng chục ngàn mô hình AI mã nguồn mở với một dòng lệnh và thanh toán theo từng giây.'
  },
  {
    id: 'leonardo-ai',
    name: 'Leonardo.ai API',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: '150 tokens miễn phí mỗi ngày',
    baseUrl: 'https://cloud.leonardo.ai/api/rest/v1',
    docsUrl: 'https://app.leonardo.ai/api-access',
    defaultModel: 'phoenix',
    models: ['phoenix', 'kino-xl', 'vision-xl'],
    description: 'Nền tảng đồ họa tạo hình ảnh chuyên biệt cho Game Assets, Anime, Concept Art và 3D Textures.'
  },
  {
    id: 'ideogram-ai',
    name: 'Ideogram AI API',
    category: 'image_video',
    tier: 'paid',
    tierLabel: 'Trả phí',
    baseUrl: 'https://api.ideogram.ai/generate',
    docsUrl: 'https://ideogram.ai/manage-api',
    defaultModel: 'V_2',
    models: ['V_2', 'V_2_TURBO'],
    description: 'Mô hình tạo ảnh vẽ typography và chữ tiếng Anh/tiếng Việt trong ảnh đẹp và chuẩn xác nhất.'
  },
  {
    id: 'openai-dalle3',
    name: 'OpenAI DALL-E 3',
    category: 'image_video',
    tier: 'paid',
    tierLabel: 'Trả phí theo ảnh ($0.04/ảnh)',
    baseUrl: 'https://api.openai.com/v1/images/generations',
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'dall-e-3',
    models: ['dall-e-3', 'dall-e-2'],
    description: 'Tạo hình ảnh từ mô tả chi tiết, liên kết mượt mà với câu lệnh tự nhiên của ChatGPT.'
  },
  {
    id: 'runway-ml',
    name: 'Runway Gen-3 Alpha API',
    category: 'image_video',
    tier: 'paid',
    tierLabel: 'Trả phí',
    baseUrl: 'https://api.runwayml.com/v1',
    docsUrl: 'https://runwayml.com',
    defaultModel: 'gen3a_turbo',
    models: ['gen3a_turbo'],
    description: 'Mô hình tạo video điện ảnh Hollywood đỉnh cao với điều khiển góc máy camera và chuyển động vật lý.'
  },
  {
    id: 'luma-dream-machine',
    name: 'Luma AI (Dream Machine API)',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Dùng thử 30 lượt/tháng',
    baseUrl: 'https://api.lumalabs.ai/dream-machine/v1',
    docsUrl: 'https://lumalabs.ai/dream-machine/api',
    defaultModel: 'ray-1-6',
    models: ['ray-1-6', 'ray-2'],
    description: 'Tạo video sống động chân thực với camera mượt mà từ hình ảnh tĩnh hoặc câu lệnh mô tả.'
  },
  {
    id: 'kling-ai',
    name: 'Kling AI Video (Kuaishou)',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: '66 credits miễn phí hàng ngày',
    baseUrl: 'https://api.klingai.com/v1',
    docsUrl: 'https://klingai.com',
    defaultModel: 'kling-v1-5',
    models: ['kling-v1-5', 'kling-v1'],
    description: 'Mô hình tạo video chân thực đến 1080p dài 2 phút với chuyển động người và vật lý sống động.'
  },
  {
    id: 'pika-labs',
    name: 'Pika API',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: '30 credits miễn phí ban đầu',
    baseUrl: 'https://api.pika.art/v1',
    docsUrl: 'https://pika.art',
    defaultModel: 'pika-2.0',
    models: ['pika-2.0', 'pika-1.5'],
    description: 'Nền tảng video AI với các hiệu ứng đặc biệt như làm tan chảy, thổi phồng và chuyển động điện ảnh.'
  },
  {
    id: 'hailuo-minimax-video',
    name: 'MiniMax Video-01 (Hailuo)',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Miễn phí tạo video trên web',
    baseUrl: 'https://api.minimax.chat/v1/video_generation',
    docsUrl: 'https://hailuoai.video',
    defaultModel: 'video-01',
    models: ['video-01'],
    description: 'Mô hình video cinematic chân thực, chuyển động mượt mà và biểu cảm khuôn mặt tự nhiên xuất sắc.'
  },
  {
    id: 'recraft-ai',
    name: 'Recraft AI',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Miễn phí 50 credits/ngày',
    baseUrl: 'https://external.api.recraft.ai/v1',
    docsUrl: 'https://www.recraft.ai',
    defaultModel: 'recraftv3',
    models: ['recraftv3', 'vector'],
    description: 'Chuyên gia thiết kế đồ họa tạo file SVG Vector, Icon 3D và minh họa thương hiệu.'
  },
  {
    id: 'clipdrop-api',
    name: 'Clipdrop by Jasper/Stability',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Miễn phí 100 requests/ngày (tools)',
    baseUrl: 'https://clipdrop-api.co',
    docsUrl: 'https://clipdrop.co/apis',
    defaultModel: 'cleanup',
    models: ['cleanup', 'remove-background', 'replace-background', 'text-to-image'],
    description: 'Bộ công cụ xử lý ảnh nhanh: xóa vật thể, tách nền, nâng cao độ phân giải và thay đổi ánh sáng.'
  },
  {
    id: 'photoroom-api',
    name: 'Photoroom API',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Dùng thử miễn phí',
    baseUrl: 'https://sdk.photoroom.com/v1',
    docsUrl: 'https://www.photoroom.com/api',
    defaultModel: 'background-removal',
    models: ['background-removal', 'ai-background'],
    description: 'Tách nền sản phẩm thương mại điện tử chuẩn xác từng sợi tóc trong tích tắc.'
  },
  {
    id: 'getimg-ai',
    name: 'Getimg.ai API',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: '100 ảnh miễn phí mỗi tháng',
    baseUrl: 'https://api.getimg.ai/v1',
    docsUrl: 'https://getimg.ai/tools/api',
    defaultModel: 'flux-schnell',
    models: ['flux-schnell', 'essential-v2', 'stable-diffusion-xl'],
    description: 'Bộ công cụ tạo ảnh, outpainting, inpainting và mở rộng khung hình với API đơn giản.'
  },
  {
    id: 'civitai-api',
    name: 'Civitai Inference API',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Hệ thống Buzz miễn phí hàng ngày',
    baseUrl: 'https://orchestration.civitai.com/v1',
    docsUrl: 'https://civitai.com/models',
    defaultModel: 'civitai-lora-sdxl',
    models: ['civitai-lora-sdxl', 'flux-lora'],
    description: 'Cộng đồng lớn nhất chia sẻ hàng trăm nghìn checkpoint LoRA, Style và Anime cho SD/FLUX.'
  },
  {
    id: 'goapi-midjourney',
    name: 'GoAPI (Midjourney Proxy)',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Có bản dùng thử',
    baseUrl: 'https://api.goapi.ai/api/v1',
    docsUrl: 'https://goapi.ai',
    defaultModel: 'midjourney-v6',
    models: ['midjourney-v6', 'niji-v6'],
    description: 'API proxy cho phép tích hợp Midjourney v6 và Niji v6 vào ứng dụng của riêng bạn.'
  },
  {
    id: 'krea-ai',
    name: 'Krea AI Realtime',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Miễn phí tạo thời gian thực',
    baseUrl: 'https://api.krea.ai',
    docsUrl: 'https://www.krea.ai',
    defaultModel: 'krea-realtime',
    models: ['krea-realtime', 'enhancer-v2'],
    description: 'Vẽ đến đâu tạo ảnh AI chân thực đến đó trong thời gian thực (Realtime Latent Diffusion).'
  },
  {
    id: 'remove-bg',
    name: 'Remove.bg API',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: '1 credit HD miễn phí + Xem trước không giới hạn',
    baseUrl: 'https://api.remove.bg/v1.0',
    docsUrl: 'https://www.remove.bg/api',
    defaultModel: 'auto',
    models: ['auto'],
    description: 'Giải pháp tách phông nền kinh điển hàng đầu cho ảnh chân dung và sản phẩm.'
  },
  {
    id: 'deepai',
    name: 'DeepAI Image API',
    category: 'image_video',
    tier: 'freemium',
    tierLabel: 'Miễn phí cơ bản',
    baseUrl: 'https://api.deepai.org/api',
    docsUrl: 'https://deepai.org',
    defaultModel: 'text2img',
    models: ['text2img', 'colorizer'],
    description: 'Các API tiện ích hình ảnh: phục chế ảnh cũ trắng đen, biến ảnh thành tranh vẽ và tạo ảnh AI.'
  }
];

/**
 * Danh mục đầy đủ: các dịch vụ cốt lõi (CORE_AI_SERVICES) cộng danh mục mở
 * rộng (EXTRA_AI_SERVICES). Lọc trùng theo `id` để một dịch vụ xuất hiện ở cả
 * hai nơi không bị nhân đôi trong giao diện.
 */
export const AI_SERVICES_CATALOG: AIServiceInfo[] = (() => {
  const seen = new Set<string>();
  const merged: AIServiceInfo[] = [];

  for (const service of [...CORE_AI_SERVICES, ...EXTRA_AI_SERVICES]) {
    if (seen.has(service.id)) continue;
    seen.add(service.id);
    merged.push(service);
  }

  return merged;
})();
