# Security Specification

## 1. Data Invariants
- `UserProfile` must be owned by the authenticated user (`userId == request.auth.uid`).
- `ChatSession` must be owned by the authenticated user (`userId == request.auth.uid`).
- `ChatMessage` in `/sessions/{sessionId}/messages/{messageId}` must have `userId == request.auth.uid` AND its parent session must exist and be owned by the authenticated user.
- Any update must preserve immutable fields (`userId`, `createdAt`, `sessionId`).
- Strict key validation and size boundaries must prevent ghost fields and resource exhaustion.

## 2. The Dirty Dozen Payloads
1. Create UserProfile with spoofed `userId` ("victim_uid") when authenticated as "attacker_uid".
2. Create UserProfile without required `createdAt` field.
3. Update UserProfile modifying immutable `userId`.
4. Create ChatSession with title exceeding maxLength (201+ chars).
5. Create ChatSession with spoofed `userId`.
6. Read ChatSession owned by another user.
7. List ChatSessions without filtering by authenticated user's `userId`.
8. Create ChatMessage referencing non-existent or foreign `sessionId`.
9. Create ChatMessage with role "admin" (not in allowed enum ["user", "model", "system"]).
10. Update ChatMessage with payload exceeding allowed keys.
11. Delete ChatSession owned by another user.
12. Attempt unauthenticated read or write to any collection.
