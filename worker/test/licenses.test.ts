import { describe, expect, it } from 'vitest';
import { classifyActivation } from '../src/licenses';

describe('license device binding', () => {
  const existing = {
    status: 'active',
    installationId: 'installation-old-123456',
    machineHash: 'machine-hash-that-is-stable-for-the-same-computer',
  };

  it('authenticates an existing installation instead of rotating its secret', () => {
    expect(classifyActivation(existing, {
      installationId: existing.installationId,
      machineHash: existing.machineHash,
    })).toBe('authenticate');
  });

  it('allows a new installation identifier on the same physical machine', () => {
    expect(classifyActivation(existing, {
      installationId: 'installation-new-654321',
      machineHash: existing.machineHash,
    })).toBe('reactivate_same_machine');
  });

  it('rejects a different physical machine and revoked devices', () => {
    expect(classifyActivation(existing, {
      installationId: 'installation-new-654321',
      machineHash: 'different-machine-hash-with-enough-characters',
    })).toBe('reject');
    expect(classifyActivation({ ...existing, status: 'revoked' }, {
      installationId: 'installation-new-654321',
      machineHash: existing.machineHash,
    })).toBe('reject');
  });
});
