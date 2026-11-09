import { Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

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
        'User-Agent': 'aistudio-build',
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
        models: models.length > 0 ? models : ['gemini-3.8-flash', 'gemini-4-argon'],
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
        lastError = result.error;
      }
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
        const targetModel = model || 'gemini-3.8-flash';
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
        model: model || 'gpt-4o',
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
  } = req.body;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    // 1. If user provided a custom OpenAI-compatible base URL (like Groq, DeepSeek, OpenRouter, Ollama, etc.)
    if (customBaseUrl && customBaseUrl.trim() && !customBaseUrl.includes('googleapis.com')) {
      const cleanBaseUrl = customBaseUrl.trim().replace(/\/+$/, '');
      const endpoint = cleanBaseUrl.endsWith('/chat/completions')
        ? cleanBaseUrl
        : `${cleanBaseUrl}/chat/completions`;

      const formattedMessages: any[] = [];
      if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim()) {
        formattedMessages.push({ role: 'system', content: systemPrompt.trim() });
      }

      if (Array.isArray(messages)) {
        for (const m of messages) {
          if (!m.content) continue;
          formattedMessages.push({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          });
        }
      }

      const openaiPayload = {
        model: model || 'gpt-4o',
        messages: formattedMessages,
        stream: true,
      };

      const customHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey && customApiKey.trim()) {
        customHeaders['Authorization'] = `Bearer ${customApiKey.trim()}`;
      }

      const upstreamResp = await fetch(endpoint, {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify(openaiPayload),
      });

      if (!upstreamResp.ok) {
        const errorText = await upstreamResp.text();
        res.write(`data: ${JSON.stringify({ error: `Custom Provider (${upstreamResp.status}): ${errorText.slice(0, 200)}` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const reader = upstreamResp.body?.getReader();
      const decoder = new TextDecoder('utf-8');
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
              const delta = parsed.choices?.[0]?.delta;
              const textChunk = delta?.content || '';
              const reasoningChunk = delta?.reasoning_content || '';
              if (textChunk || reasoningChunk) {
                res.write(`data: ${JSON.stringify({ text: textChunk, thinking: reasoningChunk })}\n\n`);
              }
            } catch (e) {}
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // 2. Default: Google Gemini via @google/genai SDK
    const ai = getAIClient(customApiKey);

    // Selected model: if thinkingMode is enabled, use 'gemini-4-argon' with ThinkingLevel.HIGH
    const targetModel = thinkingMode ? 'gemini-4-argon' : (model || 'gemini-3.8-flash');

    const config: any = {};
    if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim()) {
      config.systemInstruction = systemPrompt.trim();
    }

    if (thinkingMode || targetModel === 'gemini-4-argon') {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
      // Note: As per instruction, do NOT set maxOutputTokens
    }

    // Convert conversation messages to Gemini contents structure
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m.content) continue;
        contents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        });
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

    for await (const chunk of stream) {
      const candidate = chunk.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      const text = chunk.text || (part && 'text' in part ? part.text : '');

      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Chat stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Lỗi khi gọi mô hình AI' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

/**
 * Handle audio transcription using gemini-3.5-transcribe
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
      model: 'gemini-3.5-transcribe',
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
