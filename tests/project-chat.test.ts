import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

describe('Project Chat Feature', () => {
  let serverProcess: ChildProcess;
  const serverUrl = 'http://localhost:9528';

  beforeAll((done) => {
    // Start the server
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../../../web-server'),
      stdio: 'pipe',
      shell: true,
    });

    // Wait for server to start
    setTimeout(done, 3000);
  });

  afterAll((done) => {
    // Stop the server
    if (serverProcess) {
      serverProcess.kill();
    }
    setTimeout(done, 1000);
  });

  test('Health check endpoint should work', async () => {
    const response = await request(serverUrl)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('Demo status endpoint should return demo mode', async () => {
    const response = await request(serverUrl)
      .get('/api/projects/test-project/demo')
      .expect(200);

    expect(response.body).toHaveProperty('demoMode');
    expect(response.body).toHaveProperty('message');
  });

  test('Get project status should return status object', async () => {
    const response = await request(serverUrl)
      .get('/api/projects/test-project/status')
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toHaveProperty('projectId');
    expect(response.body.status).toHaveProperty('status');
    expect(response.body.status).toHaveProperty('logs');
  });

  test('Get conversation history should return messages array', async () => {
    const response = await request(serverUrl)
      .get('/api/projects/test-project/conversations')
      .expect(200);

    expect(response.body).toHaveProperty('messages');
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.messages)).toBe(true);
  });

  test('Clear conversation should work', async () => {
    const response = await request(serverUrl)
      .delete('/api/projects/test-project/conversations')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
