import { EventEmitter } from 'node:events';
import { expect, test } from '@playwright/test';
import sinon from 'sinon';
import {
  type ClientDependencies,
  copyToClipboard,
  ensureDaemonRunning,
  sendPayloadToDaemon,
  waitForResult,
} from '../../mcp-server/src/client';

test.describe('mcp-client unit tests', () => {
  let deps: ClientDependencies;
  // biome-ignore lint/suspicious/noExplicitAny: mocking WebSocket
  let mockWs: any;

  test.beforeEach(() => {
    mockWs = new EventEmitter();
    mockWs.send = sinon.stub();
    mockWs.close = sinon.stub();

    deps = {
      // biome-ignore lint/suspicious/noExplicitAny: mocking constructor
      WebSocket: sinon.stub().returns(mockWs) as any,
      // biome-ignore lint/suspicious/noExplicitAny: mocking child process
      spawn: sinon.stub().returns({ unref: sinon.stub() }) as any,
      execSync: sinon.stub(),
      readFileSync: sinon.stub().returns('mock-token'),
    };
  });

  test.describe('copyToClipboard', () => {
    test('should use pbcopy on darwin', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      copyToClipboard('test-token', deps);
      expect(
        (deps.execSync as sinon.SinonStub).calledWith('pbcopy', {
          input: 'test-token',
        }),
      ).toBe(true);
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should use clip on win32', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      copyToClipboard('test-token', deps);
      expect(
        (deps.execSync as sinon.SinonStub).calledWith('clip', {
          input: 'test-token',
        }),
      ).toBe(true);
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should use xclip on linux', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });
      copyToClipboard('test-token', deps);
      expect(
        (deps.execSync as sinon.SinonStub).calledWith(
          'xclip -selection clipboard',
          { input: 'test-token' },
        ),
      ).toBe(true);
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  test.describe('ensureDaemonRunning', () => {
    test('should resolve token and copy to clipboard if daemon is already running', async () => {
      const promise = ensureDaemonRunning(deps);

      // Simulate connection success
      mockWs.emit('open');

      const token = await promise;
      expect(token).toBe('mock-token');
      expect(mockWs.close.calledOnce).toBe(true);
      expect((deps.execSync as sinon.SinonStub).called).toBe(true);
    });

    test('should spawn daemon, resolve token, and copy to clipboard if connection is refused', async () => {
      const promise = ensureDaemonRunning(deps);

      // Simulate connection failure
      mockWs.emit('error', { code: 'ECONNREFUSED' });

      const token = await promise;

      expect(token).toBe('mock-token');
      const spawnStub = deps.spawn as sinon.SinonStub;
      expect(spawnStub.calledOnce).toBe(true);
      expect(spawnStub.getCall(0).args[2].stdio).not.toEqual('ignore');
      expect((deps.execSync as sinon.SinonStub).called).toBe(true);
    });
  });

  test.describe('sendPayloadToDaemon', () => {
    test('should send payload and resolve immediately', async () => {
      const payload = {
        handoff_id: 'id',
        prompt: 'test',
        projectPath: '/path',
      };
      const promise = sendPayloadToDaemon(payload, deps);

      mockWs.emit('open');

      await promise;

      expect(mockWs.send.calledOnce).toBe(true);
      const sentData = JSON.parse(mockWs.send.getCall(0).args[0]);
      expect(sentData).toEqual({ type: 'payload', data: payload });
      expect(mockWs.close.calledOnce).toBe(true);
    });
  });

  test.describe('waitForResult', () => {
    test('should resolve with response data when received', async () => {
      const promise = waitForResult('my-id', deps);

      mockWs.emit('open');

      // Simulate daemon sending back the response
      mockWs.emit(
        'message',
        JSON.stringify({
          type: 'response',
          handoff_id: 'my-id',
          data: 'research results',
        }),
      );

      const result = await promise;

      expect(result).toBe('research results');
      expect(mockWs.close.calledOnce).toBe(true);
    });

    test('should reject if timeout occurs', async () => {
      // Pass a very short timeout
      const promise = waitForResult('my-id', deps, 10);

      mockWs.emit('open');

      await expect(promise).rejects.toThrow(
        'Timeout waiting for research response from browser.',
      );
    });
  });
});
