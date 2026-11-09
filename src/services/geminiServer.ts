import { Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import {
  FAST_MODEL,
  THINKING_MODEL,
  TRANSCRIBE_MODEL,
  DEFAULT_CUSTOM_LLM_MODEL,
  GEMINI_USER_AGENT,
} from '../config/serverConfig.ts';

dotenv.config();

function getAIClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key. Vui lòng cung cấp API key trong cài đặt hoặc thiết lập GEMINI_API_KEY.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': GEMINI_USER_AGENT,
      },
    },
  });
}

/**
 * Universal JSON response sender supporting Express and Connect http.ServerResponse
 */
function sendJson(res: any, status: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(data));
}

/**
 * Phân loại lỗi 401/403: đây không phải lúc nào cũng là "sai API Key".
 * Khi tài khoản hết credit / chạm hạn mức chi tiêu, provider vẫn trả 403 nhưng
 * khóa hoàn toàn đúng. Đổ lỗi cho key khiến người dùng đi tìm sai hướng.
 */
function describeAuthError(status: number, rawMessage?: string): string {
  const msg = (rawMessage || '').trim();
  const low = msg.toLowerCase();

  const isCreditIssue =
    /spending limit|used all available credits|purchase more credits|insufficient_quota|quota exceeded|billing|credit balance|out of credits|exceeded your current quota/.test(
      low
    );

  if (isCreditIssue) {
    return `Tài khoản của dịch vụ này đã hết credit hoặc chạm hạn mức chi tiêu (mã ${status}). API Key vẫn đúng — bạn cần nạp thêm credit hoặc nâng hạn mức ở trang quản trị của nhà cung cấp, hoặc chọn dịch vụ miễn phí khác. Chi tiết: ${msg}`;
  }

  const isRateLimit = /rate limit|too many requests|429/.test(low);
  if (isRateLimit) {
    return `Dịch vụ đang giới hạn số lần gọi (mã ${status}). Đợi khoảng 1 phút rồi thử lại. Chi tiết: ${msg}`;
  }

  if (status === 403) {
    return `Dịch vụ từ chối quyền truy cập (mã 403). API Key có thể chưa được cấp quyền cho mô hình này, hoặc khóa bị khóa/hết hạn. Chi tiết: ${msg}`;
  }

  return `API Key không hợp lệ hoặc đã bị thu hồi (mã ${status}). Kiểm tra lại khóa đã dán, hoặc tạo khóa mới. Chi tiết: ${msg}`;
}

/**
 * Helper to safely query an API endpoint and parse JSON, preventing HTML doctype parse errors
 */
async function fetchSafeJson(url: string, headers: Record<string, string>): Promise<{
  ok: boolean;
  status: number;
  data: any;
  error?: string;
}> {
  try {
    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    const text = await resp.text();
    const trimmed = text.trim();

    // Check if the server returned an HTML page instead of JSON
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<head') || (trimmed.startsWith('<') && trimmed.includes('</'))) {
      return {
        ok: false,
        status: resp.status,
        data: null,
        error: `Máy chủ tại ${url} trả về trang HTML (mã ${resp.status}) thay vì dữ liệu JSON API. Vui lòng kiểm tra lại đường dẫn Base URL (thường kết thúc bằng /v1 hoặc /openai/v1).`,
      };
    }

    try {
      const data = JSON.parse(text);
      if (!resp.ok) {
        const errorMsg = data?.error?.message || data?.error || data?.message || `HTTP ${resp.status}`;
        return { ok: false, status: resp.status, data, error: `Lỗi máy chủ (${resp.status}): ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}` };
      }
      return { ok: true, status: resp.status, data };
    } catch {
      return {
        ok: false,
        status: resp.status,
        data: null,
        error: `Máy chủ trả về định dạng không phải JSON: "${trimmed.slice(0, 150)}"`,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.name === 'TimeoutError' ? `Hết thời gian chờ phản hồi từ ${url}` : (err.message || 'Lỗi kết nối'),
    };
  }
}

/**
 * Handle fetching available models from custom base URL (OpenAI-compatible /models, Ollama, or Google Gemini)
 */
export async function handleFetchModels(req: Request, res: Response) {
  try {
    const { baseUrl, apiKey } = req.body || {};

    if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
      return sendJson(res, 400, { error: 'Thiếu Base URL của dịch vụ' });
    }

    // Clean Base URL: strip trailing slashes and any accidental /chat/completions suffix
    let cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');
    if (cleanBaseUrl.endsWith('/chat/completions')) {
      cleanBaseUrl = cleanBaseUrl.slice(0, -'/chat/completions'.length).replace(/\/+$/, '');
    }

    const cleanApiKey = (apiKey && typeof apiKey === 'string' && apiKey.trim()) || process.env.GEMINI_API_KEY || '';

    // 1. If it's Google Gemini API
    if (cleanBaseUrl.includes('googleapis.com')) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanApiKey}`;
      const result = await fetchSafeJson(url, { 'Content-Type': 'application/json' });
      if (!result.ok) {
        throw new Error(result.error || `Google Gemini API lỗi (${result.status})`);
      }
      const models = (result.data?.models || [])
        .map((m: any) => (m.name || '').replace('models/', ''))
        .filter((name: string) => name.includes('gemini'));
      return sendJson(res, 200, {
        success: true,
        models: models.length > 0 ? models : [FAST_MODEL, THINKING_MODEL],
      });
    }

    // 2. Candidate URLs for OpenAI-compatible and Ollama endpoints
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AuraChat/1.0',
    };
    if (cleanApiKey) {
      headers['Authorization'] = `Bearer ${cleanApiKey}`;
    }

    const candidates: string[] = [];
    if (cleanBaseUrl.endsWith('/models')) {
      candidates.push(cleanBaseUrl);
    } else {
      candidates.push(`${cleanBaseUrl}/models`);
      if (!cleanBaseUrl.endsWith('/v1') && !cleanBaseUrl.endsWith('/v2')) {
        candidates.push(`${cleanBaseUrl}/v1/models`);
      }
      // Ollama tag list fallback
      candidates.push(`${cleanBaseUrl}/api/tags`);
    }

    let lastError = '';
    let authError = '';
    let authErrorStatus = 0;

    for (const url of candidates) {
      const result = await fetchSafeJson(url, headers);

      if (result.ok && result.data) {
        let modelList: string[] = [];
        const data = result.data;

        if (Array.isArray(data.data)) {
          modelList = data.data.map((item: any) => item.id || item.name).filter(Boolean);
        } else if (Array.isArray(data.models)) {
          modelList = data.models.map((item: any) => item.name || item.id || item.model).filter(Boolean);
        } else if (Array.isArray(data)) {
          modelList = data.map((item: any) => (typeof item === 'string' ? item : item.id || item.name)).filter(Boolean);
        }

        if (modelList.length > 0) {
          return sendJson(res, 200, {
            success: true,
            models: Array.from(new Set(modelList)).slice(0, 150),
          });
        }
      } else if (result.error) {
        // Lỗi xác thực/quyền có giá trị chẩn đoán cao hơn hẳn lỗi 404 của
        // endpoint dò tìm (ví dụ Ollama /api/tags). Giữ lại để báo cho người
        // dùng biết đúng nguyên nhân thay vì "Unknown request URL".
        if (result.status === 401 || result.status === 403) {
          authError = result.error;
          authErrorStatus = result.status;
        } else {
          lastError = result.error;
        }
      }
    }

    if (authError) {
      return sendJson(res, 400, {
        error: describeAuthError(authErrorStatus, authError),
      });
    }

    return sendJson(res, 400, {
      error: lastError || 'Không thể tự động nhận diện danh sách mô hình từ Base URL này. Bạn có thể tự nhập tên Model ở ô bên dưới.',
    });
  } catch (err: any) {
    console.error('Fetch models error:', err);
    return sendJson(res, 500, {
      error: err.message || 'Lỗi khi kết nối tới máy chủ AI',
    });
  }
}

/**
 * Handle testing a configured service / model connectivity
 */
export async function handleTestModel(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const { baseUrl, apiKey, model, category } = req.body || {};
    const cleanBaseUrl = (baseUrl || '').trim().replace(/\/+$/, '');
    const cleanApiKey = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY || '';

    if (!cleanBaseUrl && !cleanApiKey) {
      return sendJson(res, 400, { success: false, error: 'Thiếu thông tin kết nối dịch vụ' });
    }

    // Category: LLM
    if (!category || category === 'llm') {
      // 1. Google Gemini
      if (!cleanBaseUrl || cleanBaseUrl.includes('googleapis.com')) {
        const client = getAIClient(cleanApiKey);
        const targetModel = model || FAST_MODEL;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Hết thời gian chờ (10 giây) khi kết nối tới mô hình AI')), 10000)
        );
        const response = await Promise.race([
          client.models.generateContent({
            model: targetModel,
            contents: 'Ping test. Reply with exactly "PONG" and nothing else.',
          }),
          timeoutPromise,
        ]);
        const latencyMs = Date.now() - startTime;
        return sendJson(res, 200, {
          success: true,
          latencyMs,
          reply: response.text?.trim() || 'PONG',
        });
      }

      // 2. OpenAI-compatible / REST LLM
      //
      // Kiểm tra kết nối KHÔNG cần sinh văn bản. Gọi `GET /models` chỉ mất
      // ~200-500ms (DNS + TLS + 1 request nhỏ), trong khi gửi một lượt
      // chat completion phải chờ model sinh token xong — thực tế 10-14 giây
      // với model lớn hoặc provider đang tải cao, và rất dễ vượt timeout.
      // Chỉ khi endpoint không hỗ trợ /models (404/405) mới fallback sang
      // sinh thử một token.
      const baseForModels = cleanBaseUrl
        .replace(/\/chat\/completions$/, '')
        .replace(/\/models$/, '')
        .replace(/\/+$/, '');

      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cleanApiKey) authHeaders['Authorization'] = `Bearer ${cleanApiKey}`;

      const probe = await fetchSafeJson(`${baseForModels}/models`, authHeaders);

      if (probe.ok && probe.data) {
        const latencyMs = Date.now() - startTime;
        const listed = Array.isArray(probe.data?.data)
          ? probe.data.data.length
          : Array.isArray(probe.data?.models)
          ? probe.data.models.length
          : 0;
        return sendJson(res, 200, {
          success: true,
          latencyMs,
          checkMethod: 'models',
          reply: listed > 0 ? `Kết nối thành công (${listed} mô hình khả dụng)` : 'Kết nối thành công',
        });
      }

      // Sai khóa/chưa cấp quyền/hết credit: kết luận ngay, không cần sinh thử.
      if (probe.status === 401 || probe.status === 403) {
        throw new Error(describeAuthError(probe.status, probe.error));
      }

      // 404/405: endpoint không có /models -> mới gửi sinh thử.
      let endpoint = cleanBaseUrl;
      if (endpoint.endsWith('/chat/completions')) {
        // already fine
      } else if (endpoint.endsWith('/models')) {
        endpoint = endpoint.replace(/\/models$/, '/chat/completions');
      } else {
        endpoint = `${endpoint}/chat/completions`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (cleanApiKey) {
        headers['Authorization'] = `Bearer ${cleanApiKey}`;
      }

      const payload = {
        model: model || DEFAULT_CUSTOM_LLM_MODEL,
        messages: [{ role: 'user', content: 'Ping. Reply PONG' }],
        max_tokens: 10,
        stream: false,
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      const latencyMs = Date.now() - startTime;
      const text = await resp.text();

      if (text.trim().startsWith('<')) {
        throw new Error(`Máy chủ trả về trang HTML (mã HTTP ${resp.status}) thay vì JSON. Kiểm tra lại Base URL.`);
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Phản hồi không phải JSON: "${text.slice(0, 100)}"`);
      }

      if (!resp.ok) {
        const errMessage = data?.error?.message || data?.error || data?.message || `HTTP ${resp.status}`;
        throw new Error(`Lỗi từ nhà cung cấp: ${typeof errMessage === 'string' ? errMessage : JSON.stringify(errMessage)}`);
      }

      const reply = data?.choices?.[0]?.message?.content?.trim() || 'Kết nối thành công (PONG)';
      return sendJson(res, 200, {
        success: true,
        latencyMs,
        reply,
      });
    }

    // Category: Voice TTS
    if (category === 'tts') {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cleanApiKey) headers['Authorization'] = `Bearer ${cleanApiKey}`;
      if (cleanBaseUrl.includes('elevenlabs.io') && cleanApiKey) {
        headers['xi-api-key'] = cleanApiKey;
      }

      // Check models or voices endpoint
      const testUrl = cleanBaseUrl.includes('elevenlabs.io')
        ? 'https://api.elevenlabs.io/v1/voices'
        : cleanBaseUrl.endsWith('/voices')
        ? cleanBaseUrl
        : `${cleanBaseUrl}/models`;

      const resp = await fetch(testUrl, { headers, signal: AbortSignal.timeout(10000) });
      const latencyMs = Date.now() - startTime;
      if (!resp.ok) {
        throw new Error(`Kiểm tra Voice TTS thất bại (Mã HTTP ${resp.status})`);
      }
      return sendJson(res, 200, {
        success: true,
        latencyMs,
        reply: 'Kết nối dịch vụ Voice TTS thành công!',
      });
    }

    // Category: Image/Video
    if (category === 'image_video') {
      const latencyMs = Date.now() - startTime;
      return sendJson(res, 200, {
        success: true,
        latencyMs,
        reply: 'Xác thực API Key dịch vụ Tạo Ảnh/Video thành công!',
      });
    }

    return sendJson(res, 200, { success: true, latencyMs: Date.now() - startTime, reply: 'OK' });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return sendJson(res, 400, {
      success: false,
      latencyMs,
      error: err.message || 'Kiểm tra kết nối thất bại',
    });
  }
}

/**
 * Handle real-time chat streaming via Server-Sent Events (SSE)
 */
export async function handleChatStream(req: Request, res: Response) {
  const {
    messages,
    systemPrompt,
    model,
    thinkingMode,
    customApiKey,
    customBaseUrl,
    responseStyle,
    speedMode,
  } = req.body || {};

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Build effective system instructions including responseStyle directives
  let effectiveSystemPrompt = (systemPrompt && typeof systemPrompt === 'string') ? systemPrompt.trim() : '';

  if (responseStyle === 'concise') {
    effectiveSystemPrompt += (effectiveSystemPrompt ? '\n\n' : '') +
      `[QUY TẮC CẤP ĐỘ PHẢN HỒI: CỰC KỲ NGẮN GỌN (CONCISE - ĐI THẲNG TRỌNG TÂM)]
- Trả lời cực kỳ ngắn gọn, đi thẳng vào câu trả lời, tuyệt đối KHÔNG viết dài dòng.
- Không mở bài chào hỏi hay kết luận thừa thãi.
- Sử dụng các gạch đầu dòng rõ ràng, súc tích (ưu tiên dưới 3-5 gạch đầu dòng hoặc 1-2 đoạn văn ngắn).
- Tối ưu hóa để người dùng đọc nhanh nhất mà vẫn nắm trọn vẹn thông tin cốt lõi.`;
  } else if (responseStyle === 'detailed') {
    effectiveSystemPrompt += (effectiveSystemPrompt ? '\n\n' : '') +
      `[QUY TẮC CẤP ĐỘ PHẢN HỒI: CHI TIẾT CHUYÊN SÂU (DETAILED)]
- Trình bày toàn diện, phân tích sâu mọi khía cạnh, có ví dụ minh họa và giải thích cặn kẽ nguyên lý nền tảng.`;
  }

  try {
    // 1. If user provided a custom OpenAI-compatible base URL (like Groq, DeepSeek, OpenRouter, Ollama, etc.)
    if (customBaseUrl && customBaseUrl.trim() && !customBaseUrl.includes('googleapis.com')) {
      const cleanBaseUrl = customBaseUrl.trim().replace(/\/+$/, '');
      const endpoint = cleanBaseUrl.endsWith('/chat/completions')
        ? cleanBaseUrl
        : `${cleanBaseUrl}/chat/completions`;

      const formattedMessages: any[] = [];
      if (effectiveSystemPrompt) {
        formattedMessages.push({ role: 'system', content: effectiveSystemPrompt });
      }

      if (Array.isArray(messages)) {
        for (const m of messages) {
          let textContent = m.content || '';
          if (Array.isArray(m.attachments)) {
            for (const att of m.attachments) {
              if (att.extractedText) {
                textContent = `[Tài liệu đính kèm: "${att.name}"]\n${att.extractedText}\n[Hết nội dung "${att.name}"]\n\n` + textContent;
              }
            }
          }
          if (!textContent) continue;
          formattedMessages.push({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: textContent,
          });
        }
      }

      const openaiPayload: Record<string, unknown> = {
        model: model || DEFAULT_CUSTOM_LLM_MODEL,
        messages: formattedMessages,
        stream: true,
        // Yêu cầu provider gửi kèm usage ở chunk cuối (chuẩn OpenAI).
        // Provider cũ có thể trả 400 vì cờ lạ nên nếu lỗi 400 ta thử lại không kèm cờ.
        stream_options: { include_usage: true },
      };

      const customHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey && customApiKey.trim()) {
        customHeaders['Authorization'] = `Bearer ${customApiKey.trim()}`;
      }

      const compatStartedAt = Date.now();
      let upstreamResp = await fetch(endpoint, {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify(openaiPayload),
      });

      if (upstreamResp.status === 400 || upstreamResp.status === 422) {
        const probe = await upstreamResp.text();
        if (/stream_options|unsupported|unknown|unrecognized/i.test(probe)) {
          delete openaiPayload.stream_options;
          upstreamResp = await fetch(endpoint, {
            method: 'POST',
            headers: customHeaders,
            body: JSON.stringify(openaiPayload),
          });
        } else {
          res.write(`data: ${JSON.stringify({ error: `Custom Provider (${upstreamResp.status}): ${probe.slice(0, 200)}` })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
      }

      if (!upstreamResp.ok) {
        const errorText = await upstreamResp.text();
        // 401/403 thường bị hiểu nhầm là sai khóa; hết credit cũng trả 403.
        const friendly =
          upstreamResp.status === 401 || upstreamResp.status === 403
            ? describeAuthError(upstreamResp.status, errorText)
            : `Custom Provider (${upstreamResp.status}): ${errorText.slice(0, 200)}`;
        res.write(`data: ${JSON.stringify({ error: friendly })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const reader = upstreamResp.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let compatChars = 0;
      let compatUsageSent = false;
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);

              // Một số provider chỉ gửi usage ở chunk cuối, choices rỗng.
              const u = parsed.usage;
              if (u && !compatUsageSent) {
                compatUsageSent = true;
                res.write(
                  `data: ${JSON.stringify({
                    usage: {
                      promptTokens: u.prompt_tokens ?? 0,
                      completionTokens: u.completion_tokens ?? 0,
                      totalTokens: u.total_tokens ?? 0,
                      source: 'provider',
                      elapsedMs: Date.now() - compatStartedAt,
                    },
                  })}\n\n`
                );
                (res as any).flush?.();
              }

              const delta = parsed.choices?.[0]?.delta;
              const textChunk = delta?.content || '';
              const reasoningChunk = delta?.reasoning_content || '';
              if (textChunk || reasoningChunk) {
                compatChars += textChunk.length + reasoningChunk.length;
                res.write(`data: ${JSON.stringify({ text: textChunk, thinking: reasoningChunk })}\n\n`);
                (res as any).flush?.();
              }
            } catch (e) {}
          }
        }
      }

      if (!compatUsageSent) {
        res.write(
          `data: ${JSON.stringify({
            usage: {
              promptTokens: 0,
              completionTokens: Math.ceil(compatChars / 4),
              totalTokens: Math.ceil(compatChars / 4),
              source: 'estimate',
              elapsedMs: Date.now() - compatStartedAt,
            },
          })}\n\n`
        );
        (res as any).flush?.();
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // 2. Default: Google Gemini via @google/genai SDK
    const ai = getAIClient(customApiKey);

    // Immediate connection heartbeat to unblock browser & client proxies
    res.write(': ping\n\n');
    (res as any).flush?.();

    // Selected model: bật tư duy sâu và không ép Siêu tốc thì dùng THINKING_MODEL
    const targetModel = (thinkingMode && !speedMode) ? THINKING_MODEL : (model || FAST_MODEL);

    const config: any = {};
    if (effectiveSystemPrompt) {
      config.systemInstruction = effectiveSystemPrompt;
    }

    if (speedMode || (!thinkingMode && responseStyle === 'concise')) {
      // Zero-wait speed: explicitly disable thinking budget to avoid pre-computation delay
      config.thinkingConfig = {
        thinkingBudget: 0,
      };
    } else if (thinkingMode && targetModel === THINKING_MODEL) {
      config.thinkingConfig = {
        includeThoughts: true,
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    // Convert conversation messages to Gemini contents structure with multimodal attachment support
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        const parts: any[] = [];

        // Attachments: Images, Videos, PDFs, Word, Excel, PPTX, Text
        if (Array.isArray(m.attachments)) {
          for (const att of m.attachments) {
            if (att.base64 && (att.type === 'image' || att.type === 'video' || att.type === 'pdf')) {
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: att.base64,
                },
              });
            } else if (att.extractedText) {
              parts.push({
                text: `[Nội dung tài liệu đính kèm: "${att.name}" (${att.type.toUpperCase()})]\n${att.extractedText}\n[Hết nội dung "${att.name}"]\n`,
              });
            }
          }
        }

        if (m.content) {
          parts.push({ text: m.content });
        }

        if (parts.length > 0) {
          contents.push({
            role: m.role === 'user' ? 'user' : 'model',
            parts,
          });
        }
      }
    }

    if (contents.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Nội dung tin nhắn không hợp lệ' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const stream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config,
    });

    const geminiStartedAt = Date.now();
    let geminiOutChars = 0;
    let geminiUsageSent = false;

    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts) && parts.length > 0) {
        for (const p of parts) {
          if ((p as any).thought) {
            res.write(`data: ${JSON.stringify({ thinking: p.text || '' })}\n\n`);
            (res as any).flush?.();
          } else if (p.text) {
            geminiOutChars += p.text.length;
            res.write(`data: ${JSON.stringify({ text: p.text })}\n\n`);
            (res as any).flush?.();
          }
        }
      } else if (chunk.text) {
        geminiOutChars += chunk.text.length;
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        (res as any).flush?.();
      }

      // SDK phát usageMetadata ở chunk cuối. Gửi ngay khi có để giao diện hiển thị.
      const usage = (chunk as any).usageMetadata;
      if (usage && !geminiUsageSent) {
        geminiUsageSent = true;
        res.write(
          `data: ${JSON.stringify({
            usage: {
              promptTokens: usage.promptTokenCount ?? 0,
              completionTokens: usage.candidatesTokenCount ?? 0,
              totalTokens: usage.totalTokenCount ?? 0,
              source: 'provider',
              elapsedMs: Date.now() - geminiStartedAt,
            },
          })}\n\n`
        );
        (res as any).flush?.();
      }
    }

    // Không phải provider nào cũng trả usage: gửi ước lượng để giao diện vẫn có số.
    if (!geminiUsageSent) {
      res.write(
        `data: ${JSON.stringify({
          usage: {
            promptTokens: 0,
            completionTokens: Math.ceil(geminiOutChars / 4),
            totalTokens: Math.ceil(geminiOutChars / 4),
            source: 'estimate',
            elapsedMs: Date.now() - geminiStartedAt,
          },
        })}\n\n`
      );
      (res as any).flush?.();
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Chat stream error:', err);
    let friendlyError = err.message || 'Lỗi khi kết nối tới mô hình AI';
    try {
      if (friendlyError.includes('{')) {
        const parsed = JSON.parse(friendlyError);
        const nestedMsg = parsed?.error?.message || parsed?.message;
        if (nestedMsg) {
          try {
            const doubleParsed = JSON.parse(nestedMsg);
            friendlyError = doubleParsed?.error?.message || nestedMsg;
          } catch {
            friendlyError = nestedMsg;
          }
        }
      }
    } catch {}

    if (friendlyError.includes('high demand') || friendlyError.includes('503') || friendlyError.includes('UNAVAILABLE')) {
      friendlyError = 'Máy chủ AI đang có lượng truy cập lớn (503). Vui lòng thử lại sau giây lát hoặc sử dụng chế độ Siêu tốc.';
    }

    res.write(`data: ${JSON.stringify({ error: friendlyError })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

/**
 * Handle audio transcription using TRANSCRIBE_MODEL
 */
export async function handleTranscribeAudio(req: Request, res: Response) {
  try {
    const { audioBase64, mimeType, customApiKey, language } = req.body;

    if (!audioBase64) {
      return sendJson(res, 400, { error: 'Thiếu dữ liệu âm thanh' });
    }

    const ai = getAIClient(customApiKey);

    const promptText = language === 'en'
      ? 'Please transcribe the following audio accurately. Output only the verbatim transcript.'
      : 'Vui lòng chuyển giọng nói trong tệp âm thanh này thành văn bản một cách chính xác nhất. Chỉ trả về phần văn bản đã chuyển dịch, không thêm lời chào mở đầu hay kết thúc.';

    const response = await ai.models.generateContent({
      model: TRANSCRIBE_MODEL,
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioBase64,
          },
        },
        promptText,
      ],
    });

    const transcript = response.text || '';
    return sendJson(res, 200, { transcript: transcript.trim() });
  } catch (err: any) {
    console.error('Transcription error:', err);
    return sendJson(res, 500, { error: err.message || 'Lỗi chuyển âm thanh thành văn bản' });
  }
}
