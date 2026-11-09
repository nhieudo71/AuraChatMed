import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FAST_MODEL } from '../config/appConfig';
import { ChatSession, ChatMessage } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid,
      email: currentAuth?.email,
      emailVerified: currentAuth?.emailVerified,
      isAnonymous: currentAuth?.isAnonymous,
      tenantId: currentAuth?.tenantId,
      providerInfo: currentAuth?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Cấu hình Firebase.
 *
 * `firebase-applet-config.json` do Google AI Studio sinh ra và bị ràng buộc với
 * sandbox của nền tảng (project, appId, databaseId). Để tách dự án ra chạy độc
 * lập, mỗi trường dưới đây có thể ghi đè bằng biến môi trường `VITE_FIREBASE_*`;
 * nếu không đặt thì dùng giá trị trong file JSON như cũ.
 */
const envAny = (): Record<string, string | undefined> =>
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? ((import.meta as any).env as Record<string, string | undefined>)
    : {};

const pickEnv = (key: string, fallback: string): string => {
  const value = envAny()[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
};

export const resolvedFirebaseConfig = {
  projectId: pickEnv('VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId),
  appId: pickEnv('VITE_FIREBASE_APP_ID', firebaseConfig.appId),
  apiKey: pickEnv('VITE_FIREBASE_API_KEY', firebaseConfig.apiKey),
  authDomain: pickEnv('VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain),
  storageBucket: pickEnv('VITE_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket),
  messagingSenderId: pickEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId),
  measurementId: pickEnv('VITE_FIREBASE_MEASUREMENT_ID', firebaseConfig.measurementId),
};

/** Database ID của Firestore; rỗng nghĩa là dùng database mặc định `(default)`. */
export const firestoreDatabaseId = pickEnv(
  'VITE_FIREBASE_FIRESTORE_DATABASE_ID',
  firebaseConfig.firestoreDatabaseId
);

// Initialize Firebase
export const app = initializeApp(resolvedFirebaseConfig);
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

/**
 * Giữ phiên đăng nhập qua các lần mở lại trình duyệt và trên nhiều thiết bị.
 * `browserLocalPersistence` là chế độ mặc định nhưng bị một số trình duyệt
 * (chế độ riêng tư, chặn storage bên thứ ba) âm thầm hạ xuống chỉ-trong-phiên,
 * khiến người dùng bị đăng xuất sau mỗi lần đóng tab. Đặt tường minh để biết
 * ngay nếu môi trường không hỗ trợ.
 */
export const authPersistenceReady: Promise<void> = setPersistence(
  auth,
  browserLocalPersistence
).catch((err) => {
  console.warn('Không đặt được persistence lâu dài cho đăng nhập:', err);
});

/** Lỗi cần chuyển sang redirect thay vì popup. */
function shouldFallbackToRedirect(err: any): boolean {
  const code = String(err?.code || '');
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/operation-not-supported-in-this-environment' ||
    // Một số trình duyệt di động không cấp window.opener cho popup.
    code === 'auth/web-storage-unsupported'
  );
}

// Configure Google Auth Provider with Google Workspace Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/documents');
googleProvider.addScope('https://www.googleapis.com/auth/presentations');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');
googleProvider.addScope('https://www.googleapis.com/auth/forms.body');

// In-memory access token cache (CRITICAL: Do NOT store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Test Firestore Connection on Boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline or connecting.');
    }
    return false;
  }
}

// Sign-in with Google
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    await authPersistenceReady;

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign in');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    // Popup bị chặn là chuyện thường trên di động và trình duyệt chặn quảng
    // cáo. Chuyển sang redirect để người dùng vẫn đăng nhập được.
    if (shouldFallbackToRedirect(err)) {
      console.warn('Popup bị chặn, chuyển sang đăng nhập bằng redirect:', err?.code);
      await signInWithRedirect(auth, googleProvider);
      // Trang sẽ được điều hướng đi; promise này không trả về giá trị.
      return await new Promise<never>(() => {});
    }

    console.error('Google Sign-In Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Hoàn tất đăng nhập khi quay về từ redirect.
 * Trả về true nếu vừa xử lý xong một lượt redirect (đã đăng nhập).
 */
export async function completeRedirectSignIn(): Promise<boolean> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return false;

    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken ?? null;
    return true;
  } catch (err) {
    console.error('Không hoàn tất được đăng nhập redirect:', err);
    return false;
  }
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
}

export function subscribeAuth(
  onUserChanged: (user: User | null, token: string | null) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    onUserChanged(user, cachedAccessToken);
  });
}

// ================= Firestore Service Helpers =================

export async function saveSession(session: ChatSession): Promise<void> {
  const path = `sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'sessions', session.id), {
      userId: session.userId,
      title: session.title,
      systemPrompt: session.systemPrompt || '',
      model: session.model,
      thinkingLevel: session.thinkingLevel || 'MEDIUM',
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteSessionFromFirestore(sessionId: string): Promise<void> {
  const path = `sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeUserSessions(
  userId: string,
  onUpdate: (sessions: ChatSession[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatSession[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          userId: data.userId,
          title: data.title,
          systemPrompt: data.systemPrompt,
          model: data.model || FAST_MODEL,
          thinkingLevel: data.thinkingLevel || 'MEDIUM',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      onUpdate(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'sessions');
    }
  );
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  const path = `sessions/${message.sessionId}/messages/${message.id}`;
  try {
    await setDoc(doc(db, 'sessions', message.sessionId, 'messages', message.id), {
      sessionId: message.sessionId,
      userId: message.userId,
      role: message.role,
      content: message.content,
      thinkingContent: message.thinkingContent || '',
      createdAt: message.createdAt,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeSessionMessages(
  sessionId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, 'sessions', sessionId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          sessionId: data.sessionId,
          userId: data.userId,
          role: data.role,
          content: data.content,
          thinkingContent: data.thinkingContent,
          createdAt: data.createdAt,
        });
      });
      onUpdate(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `sessions/${sessionId}/messages`);
    }
  );
}
