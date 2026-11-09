import { CustomProviderConfig, UserPreferences, APIBackupPayload } from '../types';

/**
 * Validates and parses imported backup JSON payload.
 */
export function parseApiKeysBackup(jsonString: string): APIBackupPayload {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Tệp sao lưu không đúng định dạng JSON hợp lệ.');
  }

  if (!parsed || parsed.app !== 'AuraChat') {
    throw new Error('Tệp sao lưu không phải định dạng hợp lệ của AuraChat AI.');
  }

  if (!Array.isArray(parsed.providers)) {
    throw new Error('Dữ liệu nhà cung cấp API không đúng cấu trúc.');
  }

  return {
    app: 'AuraChat',
    version: parsed.version || 1,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    providers: parsed.providers,
    userPreferences: parsed.userPreferences,
  };
}

/**
 * Creates formatted backup payload object.
 */
export function createBackupPayload(
  providers: CustomProviderConfig[],
  userPreferences?: Partial<UserPreferences>
): APIBackupPayload {
  return {
    app: 'AuraChat',
    version: 1,
    exportedAt: new Date().toISOString(),
    providers,
    userPreferences,
  };
}

/**
 * Triggers file download in the browser.
 */
export function downloadBackupFile(payload: APIBackupPayload, filename?: string) {
  const jsonContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = filename || `aurachat_api_keys_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
