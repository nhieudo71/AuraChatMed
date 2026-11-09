import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptApiKey, decryptApiKey } from './crypto';

test('encryptApiKey and decryptApiKey roundtrip correctly', async () => {
  const secretKey = 'AIzaSyDemoKeyTest1234567890';
  const passphrase = 'MySuperPassphrase!';

  const encrypted = await encryptApiKey(secretKey, passphrase);
  assert.ok(encrypted.length > 20);
  assert.notEqual(encrypted, secretKey);

  const decrypted = await decryptApiKey(encrypted, passphrase);
  assert.equal(decrypted, secretKey);

  // Decryption with wrong passphrase should fail or return wrong text
  const wrongDecrypted = await decryptApiKey(encrypted, 'WrongPassphrase');
  assert.equal(wrongDecrypted, '');
});
