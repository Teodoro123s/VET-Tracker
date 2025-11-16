import CryptoJS from 'crypto-js';

export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
}

export function hashPassword(password: string, salt?: string): { passwordHash: string; salt: string } {
  const userSalt = salt || generateSalt();
  const passwordHash = CryptoJS.SHA256(password + userSalt).toString();
  return { passwordHash, salt: userSalt };
}

export function verifyPassword(password: string, passwordHash: string, salt: string): boolean {
  const newHash = CryptoJS.SHA256(password + salt).toString();
  return newHash === passwordHash;
}