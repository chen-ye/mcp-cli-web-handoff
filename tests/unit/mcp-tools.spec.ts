import { test, expect } from '@playwright/test';
import sinon from 'sinon';
import { delegateWebResearchSchema, handleDelegateWebResearch, handleGetResearchResult, type ToolDependencies } from '../../mcp-server/src/tools';

test.describe('mcp-tools unit tests', () => {
  let deps: ToolDependencies;
  let mockZip: any;

  test.beforeEach(() => {
    mockZip = {
      addFile: sinon.stub(),
      toBuffer: sinon.stub().returns(Buffer.from('mock-zip-buffer')),
    };

    deps = {
      ensureDaemonRunning: sinon.stub().resolves('mock-token'),
      sendPayloadToDaemon: sinon.stub().resolves(),
      waitForResult: sinon.stub().resolves('final research data'),
      existsSync: sinon.stub().returns(true),
      readFileSync: sinon.stub().returns(Buffer.from('file content')),
      Zip: sinon.stub().returns(mockZip) as any,
    };
  });

  test('should validate the input schema', () => {
    const result = delegateWebResearchSchema.safeParse({ prompt: 'test' });
    expect(result.success).toBe(true);
  });

  test('should fail validation if more than 10 context_files are provided', () => {
    const result = delegateWebResearchSchema.safeParse({ 
      prompt: 'test', 
      context_files: Array.from({ length: 11 }, (_, i) => `file${i}.txt`) 
    });
    expect(result.success).toBe(false);
  });

  test('should return a success message with handoff_id when handled', async () => {
    const response = await handleDelegateWebResearch({ prompt: 'test' }, deps);
    
    expect(response.content[0].text).toContain('Research task delegated to browser with ID');
    expect(response.content[0].text).toContain('get_research_result');
    expect(response.isError).toBeFalsy();
    expect((deps.sendPayloadToDaemon as sinon.SinonStub).calledOnce).toBe(true);
  });

  test('should return the research result from get_research_result', async () => {
    (deps.waitForResult as sinon.SinonStub).resolves('final research data');
    
    const response = await handleGetResearchResult({ handoff_id: 'mock-id' }, deps);
    
    expect(response.content[0].text).toBe('final research data');
    expect(response.isError).toBeFalsy();
    expect((deps.waitForResult as sinon.SinonStub).calledWith('mock-id')).toBe(true);
  });

  test('should read files and create a zip buffer when context_files are provided', async () => {
    const response = await handleDelegateWebResearch({ 
      prompt: 'test',
      context_files: ['file1.txt', 'file2.txt']
    }, deps);

    expect(deps.Zip as any).toHaveBeenCalled;
    expect(mockZip.addFile.calledTwice).toBe(true);
    expect(mockZip.toBuffer.calledOnce).toBe(true);
    
    const sentPayload = (deps.sendPayloadToDaemon as sinon.SinonStub).getCall(0).args[0];
    expect(sentPayload.zipData).toBe(Buffer.from('mock-zip-buffer').toString('base64'));
    expect(sentPayload.handoff_id).toBeTruthy();
  });

  test('should ignore missing files when creating a zip buffer', async () => {
    (deps.existsSync as sinon.SinonStub).callsFake((path) => path === 'file1.txt');

    await handleDelegateWebResearch({ 
      prompt: 'test',
      context_files: ['file1.txt', 'missing.txt']
    }, deps);

    expect(mockZip.addFile.calledOnce).toBe(true);
  });
});
