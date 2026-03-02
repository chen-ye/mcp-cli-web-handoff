import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { ensureDaemonRunning, sendPayloadToDaemon, type ClientDependencies } from '../../mcp-server/src/client';
import { EventEmitter } from 'events';

test.describe('mcp-client unit tests', () => {
  let deps: ClientDependencies;
  let mockWs: any;

  test.beforeEach(() => {
    mockWs = new EventEmitter();
    mockWs.close = sinon.stub();
    mockWs.send = sinon.stub();

    deps = {
      WebSocket: sinon.stub().returns(mockWs) as any,
      spawn: sinon.stub().returns({ unref: sinon.stub() }) as any,
      readFileSync: sinon.stub().returns('mock-token'),
    };
  });

  test.describe('ensureDaemonRunning', () => {
    test('should resolve token if daemon is already running', async () => {
      const promise = ensureDaemonRunning(deps);
      
      // Simulate connection success
      mockWs.emit('open');

      const token = await promise;
      expect(token).toBe('mock-token');
      expect(mockWs.close.calledOnce).toBe(true);
    });

    test('should spawn daemon if connection is refused', async () => {
      const promise = ensureDaemonRunning(deps);
      
      // Simulate connection failure
      mockWs.emit('error', { code: 'ECONNREFUSED' });

      // The function uses setTimeout(..., 500)
      // In Playwright tests we wait
      const token = await promise;
      
      expect(token).toBe('mock-token');
      expect((deps.spawn as sinon.SinonStub).calledOnce).toBe(true);
    });
  });

  test.describe('sendPayloadToDaemon', () => {
    test('should send payload and resolve when connected', async () => {
      const payload = { prompt: 'test', projectPath: '/path' };
      const promise = sendPayloadToDaemon(payload, deps);
      
      mockWs.emit('open');

      await promise;
      
      expect(mockWs.send.calledOnce).toBe(true);
      const sentData = JSON.parse(mockWs.send.getCall(0).args[0]);
      expect(sentData).toEqual({ type: 'payload', data: payload });
      expect(mockWs.close.calledOnce).toBe(true);
    });
  });
});
