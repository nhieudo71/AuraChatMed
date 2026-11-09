import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
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

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign in');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
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
          model: data.model || 'gemini-3.8-flash',
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
