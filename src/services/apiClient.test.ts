import { describe, it, expect, beforeEach } from 'vitest';
import { setTokens, getAccessToken, getRefreshToken, clearTokens } from './apiClient';

describe('apiClient token management', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('stores access and refresh tokens', () => {
    setTokens('access-token-123', 'refresh-token-456');

    expect(getAccessToken()).toBe('access-token-123');
    expect(getRefreshToken()).toBe('refresh-token-456');
  });

  it('clears tokens', () => {
    setTokens('access-token-123', 'refresh-token-456');
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('returns null for tokens before they are set', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
