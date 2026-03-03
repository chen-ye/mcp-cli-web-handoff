import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { ensureDaemonRunning, sendPayloadToDaemon, waitForResult, type ClientDependencies } from '../../mcp-server/src/client';
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

      const token = await promise;
      
      expect(token).toBe('mock-token');
      const spawnStub = deps.spawn as sinon.SinonStub;
      expect(spawnStub.calledOnce).toBe(true);
      expect(spawnStub.getCall(0).args[2].stdio).not.toEqual('ignore');
    });
  });

  test.describe('sendPayloadToDaemon', () => {
    test('should send payload and resolve immediately', async () => {
      const payload = { handoff_id: 'id', prompt: 'test', projectPath: '/path' };
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
      mockWs.emit('message', JSON.stringify({ type: 'response', handoff_id: 'my-id', data: 'research results' }));

      const result = await promise;
      
      expect(result).toBe('research results');
      expect(mockWs.close.calledOnce).toBe(true);
    });

    test('should reject if timeout occurs', async () => {
      // Pass a very short timeout
      const promise = waitForResult('my-id', deps, 10);
      
      mockWs.emit('open');

      await expect(promise).rejects.toThrow('Timeout waiting for research response from browser.');
    });
  });
});
