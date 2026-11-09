/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  testConnection,
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  subscribeUserSessions,
  subscribeSessionMessages,
  saveSession,
  deleteSessionFromFirestore,
  saveMessage,
} from './lib/firebase';
import { ChatSession, ChatMessage, UserPreferences, CustomProviderConfig } from './types';
import { generateChatTitle } from './utils/chatUtils';
import { decryptApiKey } from './utils/crypto';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { SystemPromptModal } from './components/SystemPromptModal';
import { ExportModal } from './components/ExportModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { SettingsModal } from './components/SettingsModal';
import { VoiceModal } from './components/VoiceModal';
import { APIKeyManagerModal } from './components/APIKeyManagerModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MedicalExamModal } from './components/medical/MedicalExamModal';

const LOCAL_STORAGE_SESSIONS = 'aurachat_sessions_v1';
const LOCAL_STORAGE_MESSAGES = 'aurachat_messages_v1';
const LOCAL_STORAGE_PREFS = 'aurachat_prefs_v1';
const LOCAL_STORAGE_KEY_VAULT = 'aurachat_encrypted_key_v1';
const LOCAL_STORAGE_PROVIDERS = 'aurachat_custom_providers_v1';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // App sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingThinking, setStreamingThinking] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);

  // Modals
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAPIKeysOpen, setIsAPIKeysOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);

  // Custom API providers (LLM, TTS, Image/Video)
  const [providers, setProviders] = useState<CustomProviderConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROVIDERS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const handleSaveProviders = (updated: CustomProviderConfig[]) => {
    setProviders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROVIDERS, JSON.stringify(updated));
    }
  };

  // User preferences & Encrypted Key
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PREFS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      theme: 'system',
      language: 'vi',
      ttsAutoPlay: false,
    };
  });

  const activeCustomProvider = preferences.activeProviderId && preferences.activeProviderId !== 'default'
    ? providers.find((p) => p.id === preferences.activeProviderId)
    : undefined;

  const [encryptedApiKey, setEncryptedApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_KEY_VAULT) || '';
    }
    return '';
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Initial boot: Test Firebase connection and subscribe to auth
  useEffect(() => {
    testConnection();

    const unsubscribe = subscribeAuth((currentUser, token) => {
      setUser(currentUser);
      setAccessToken(token);
    });

    return () => unsubscribe();
  }, []);

  // 2. Manage Theme (Light / Dark / System)
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      preferences.theme === 'dark' ||
      (preferences.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem(LOCAL_STORAGE_PREFS, JSON.stringify(preferences));
  }, [preferences]);

  // 3. Load or Sync Sessions
  useEffect(() => {
    if (user) {
      // Load and sync from Firestore
      const unsubscribe = subscribeUserSessions(user.uid, (remoteSessions) => {
        setSessions(remoteSessions);
        if (remoteSessions.length > 0 && !activeSessionId) {
          setActiveSessionId(remoteSessions[0].id);
        }
      });
      return () => unsubscribe();
    } else {
      // Local storage fallback for seamless instant offline / demo usage
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSIONS);
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setSessions(list);
          if (list.length > 0 && !activeSessionId) {
            setActiveSessionId(list[0].id);
          }
        } catch (e) {}
      } else {
        // Initialize with default session
        const initialSession: ChatSession = {
          id: 'session_' + Date.now(),
          userId: 'local_user',
          title: 'Cuộc trò chuyện mới',
          model: 'gemini-3.8-flash',
          thinkingLevel: 'MEDIUM',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions([initialSession]);
        setActiveSessionId(initialSession.id);
      }
    }
  }, [user]);

  // Persist sessions locally when not logged in
  useEffect(() => {
    if (!user && sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  // 4. Load or Sync Messages for Active Session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    if (user) {
      const unsubscribe = subscribeSessionMessages(activeSessionId, (remoteMessages) => {
        setMessages(remoteMessages);
      });
      return () => unsubscribe();
    } else {
      const allSaved = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
      if (allSaved) {
        try {
          const parsed = JSON.parse(allSaved);
          setMessages(parsed[activeSessionId] || []);
        } catch (e) {}
      } else {
        setMessages([]);
      }
    }
  }, [activeSessionId, user]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Update session thinking mode when active session changes
  useEffect(() => {
    if (activeSession) {
      setThinkingMode(activeSession.model === 'gemini-4-argon');
    }
  }, [activeSessionId]);

  // Handlers
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      userId: user ? user.uid : 'local_user',
      title: 'Cuộc trò chuyện mới',
      model: thinkingMode ? 'gemini-4-argon' : 'gemini-3.8-flash',
      thinkingLevel: thinkingMode ? 'HIGH' : 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);

    if (user) {
      saveSession(newSession);
    }
  };

  const handleStartMedicalChat = (systemPrompt: string, starterMessage?: string) => {
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      userId: user ? user.uid : 'local_user',
      title: 'Hội chẩn Y Khoa & Ôn thi',
      model: 'gemini-4-argon', // High thinking model for medical Socratic reasoning
      thinkingLevel: 'HIGH',
      systemPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setThinkingMode(true);

    if (user) {
      saveSession(newSession);
    }

    if (starterMessage) {
      setInput(starterMessage);
    }
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);

    if (activeSessionId === id) {
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }

    if (user) {
      deleteSessionFromFirestore(id);
    } else {
      const allSaved = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
      if (allSaved) {
        try {
          const parsed = JSON.parse(allSaved);
          delete parsed[id];
          localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(parsed));
        } catch (e) {}
      }
    }
  };

  const handleUpdateSessionTitle = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    );

    const s = sessions.find((item) => item.id === id);
    if (s && user) {
      saveSession({ ...s, title: newTitle, updatedAt: new Date().toISOString() });
    }
  };

  const handleSaveSystemPrompt = (prompt: string) => {
    if (!activeSessionId) return;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, systemPrompt: prompt, updatedAt: new Date().toISOString() }
          : s
      )
    );

    if (activeSession && user) {
      saveSession({
        ...activeSession,
        systemPrompt: prompt,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleToggleThinkingMode = () => {
    const nextVal = !thinkingMode;
    setThinkingMode(nextVal);

    if (activeSessionId) {
      const targetModel = nextVal ? 'gemini-4-argon' : 'gemini-3.8-flash';
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, model: targetModel, thinkingLevel: nextVal ? 'HIGH' : 'MEDIUM' }
            : s
        )
      );
    }
  };

  // Send Message with Real-Time SSE Streaming
  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isStreaming) return;

    let currentSessionId = activeSessionId;
    let isBrandNew = false;

    // Create session if none exists
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: 'session_' + Date.now(),
        userId: user ? user.uid : 'local_user',
        title: generateChatTitle(promptText),
        model: thinkingMode ? 'gemini-4-argon' : 'gemini-3.8-flash',
        thinkingLevel: thinkingMode ? 'HIGH' : 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
      isBrandNew = true;
      if (user) saveSession(newSession);
    } else if (messages.length === 0) {
      // First message in existing session -> update title
      const newTitle = generateChatTitle(promptText);
      handleUpdateSessionTitle(currentSessionId, newTitle);
    }

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_user',
      sessionId: currentSessionId,
      userId: user ? user.uid : 'local_user',
      role: 'user',
      content: promptText,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    // Persist user message
    if (user) {
      saveMessage(userMessage);
    } else {
      const allSaved = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
      const parsed = allSaved ? JSON.parse(allSaved) : {};
      parsed[currentSessionId] = updatedMessages;
      localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(parsed));
    }

    // Prepare streaming
    setIsStreaming(true);
    setStreamingMessage('');
    setStreamingThinking('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Decrypt custom API key if configured (either custom provider or vault key)
      let decryptedKey = '';
      let targetBaseUrl = '';
      let targetModel = thinkingMode ? 'gemini-4-argon' : 'gemini-3.8-flash';

      if (activeCustomProvider && activeCustomProvider.category === 'llm') {
        if (activeCustomProvider.apiKey) {
          decryptedKey = await decryptApiKey(activeCustomProvider.apiKey);
        }
        targetBaseUrl = activeCustomProvider.baseUrl;
        targetModel = activeCustomProvider.selectedModel || 'gpt-4o';
      } else if (encryptedApiKey) {
        decryptedKey = await decryptApiKey(encryptedApiKey);
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: activeSession?.systemPrompt || '',
          model: targetModel,
          thinkingMode,
          customApiKey: decryptedKey,
          customBaseUrl: targetBaseUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi kết nối tới máy chủ AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let accumulatedThinking = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                accumulatedText += `\n[Lỗi: ${data.error}]`;
                setStreamingMessage(accumulatedText);
              } else if (data.text) {
                accumulatedText += data.text;
                setStreamingMessage(accumulatedText);
              } else if (data.thinking) {
                accumulatedThinking += data.thinking;
                setStreamingThinking(accumulatedThinking);
              }
            } catch (e) {}
          }
        }
      }

      // Finish streaming and persist model response
      const modelMessage: ChatMessage = {
        id: 'msg_' + Date.now() + '_model',
        sessionId: currentSessionId,
        userId: user ? user.uid : 'local_user',
        role: 'model',
        content: accumulatedText || 'Xin lỗi, không nhận được phản hồi từ mô hình.',
        thinkingContent: accumulatedThinking || undefined,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, modelMessage];
      setMessages(finalMessages);

      if (user) {
        saveMessage(modelMessage);
      } else {
        const allSaved = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
        const parsed = allSaved ? JSON.parse(allSaved) : {};
        parsed[currentSessionId] = finalMessages;
        localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(parsed));
      }

      // Auto play TTS if enabled
      if (preferences.ttsAutoPlay && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(accumulatedText);
        if (preferences.ttsVoice) {
          const voices = window.speechSynthesis.getVoices();
          const matched = voices.find((v) => v.name === preferences.ttsVoice);
          if (matched) utterance.voice = matched;
        }
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        const errorMessage: ChatMessage = {
          id: 'msg_' + Date.now() + '_error',
          sessionId: currentSessionId,
          userId: user ? user.uid : 'local_user',
          role: 'model',
          content: `⚠️ Đã có sự cố khi kết nối tới mô hình AI: ${err.message || 'Lỗi không xác định'}. Vui lòng thử lại.`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
      setStreamingThinking('');
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSaveEncryptedApiKey = (encKey: string) => {
    setEncryptedApiKey(encKey);
    localStorage.setItem(LOCAL_STORAGE_KEY_VAULT, encKey);
  };

  const handleUpdatePreferences = (partial: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onUpdateSessionTitle={handleUpdateSessionTitle}
        user={user}
        onGoogleSignIn={signInWithGoogle}
        onSignOut={signOutUser}
        theme={preferences.theme}
        onToggleTheme={() =>
          handleUpdatePreferences({
            theme: preferences.theme === 'dark' ? 'light' : 'dark',
          })
        }
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSystemPrompt={() => setIsSystemPromptOpen(true)}
        onOpenAPIKeys={() => setIsAPIKeysOpen(true)}
        onOpenMedical={() => setIsMedicalModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          title={activeSession?.title || 'Cuộc trò chuyện mới'}
          thinkingMode={thinkingMode}
          onToggleThinkingMode={handleToggleThinkingMode}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenWorkspace={() => setIsWorkspaceOpen(true)}
          onOpenAPIKeys={() => setIsAPIKeysOpen(true)}
          onOpenMedical={() => setIsMedicalModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeProviderName={activeCustomProvider ? activeCustomProvider.name : undefined}
        />

        {/* Chat message scroll view */}
        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          streamingMessage={streamingMessage}
          streamingThinking={streamingThinking}
          onSelectStarterPrompt={(prompt) => handleSendMessage(prompt)}
          systemPrompt={activeSession?.systemPrompt}
          ttsVoice={preferences.ttsVoice}
          activeModelName={
            activeCustomProvider
              ? `${activeCustomProvider.name} (${activeCustomProvider.selectedModel})`
              : thinkingMode
              ? 'gemini-4-argon'
              : 'gemini-3.8-flash'
          }
        />

        {/* Input Bar */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          thinkingMode={thinkingMode}
          onToggleThinkingMode={handleToggleThinkingMode}
          onOpenVoiceModal={() => setIsVoiceOpen(true)}
          onOpenSystemPrompt={() => setIsSystemPromptOpen(true)}
          hasSystemPrompt={!!(activeSession?.systemPrompt && activeSession.systemPrompt.trim())}
        />

        {/* Mobile-first Bottom Navigation Bar (Hidden on sm screens and up) */}
        <MobileBottomNav
          onNewChat={handleNewChat}
          onOpenMedical={() => setIsMedicalModalOpen(true)}
          onOpenAPIKeys={() => setIsAPIKeysOpen(true)}
          onOpenWorkspace={() => setIsWorkspaceOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Modals */}
      <SystemPromptModal
        isOpen={isSystemPromptOpen}
        onClose={() => setIsSystemPromptOpen(false)}
        currentPrompt={activeSession?.systemPrompt}
        onSavePrompt={handleSaveSystemPrompt}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={activeSession?.title || 'Cuoc_tro_chuyen'}
        messages={messages}
        systemPrompt={activeSession?.systemPrompt}
      />

      <WorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        title={activeSession?.title || 'AuraChat_Export'}
        messages={messages}
        systemPrompt={activeSession?.systemPrompt}
        accessToken={accessToken}
        onSignInRequired={signInWithGoogle}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        onSaveEncryptedApiKey={handleSaveEncryptedApiKey}
        savedEncryptedApiKey={encryptedApiKey}
      />

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTranscriptReady={(transcript) => setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))}
        customApiKey={encryptedApiKey ? undefined : undefined}
        language={preferences.language}
      />

      {/* Multi-Service API Key Manager & 100+ Catalog Modal */}
      <APIKeyManagerModal
        isOpen={isAPIKeysOpen}
        onClose={() => setIsAPIKeysOpen(false)}
        providers={providers}
        onSaveProviders={handleSaveProviders}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* Medical Student Education Suite (MCQs, Clinical Cases, Calculators, Flashcards) */}
      <MedicalExamModal
        isOpen={isMedicalModalOpen}
        onClose={() => setIsMedicalModalOpen(false)}
        onStartMedicalChat={handleStartMedicalChat}
      />
    </div>
  );
}
