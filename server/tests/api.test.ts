import test from 'node:test';
import assert from 'node:assert/strict';



process.env.RUN_SERVER = 'false';
process.env.NODE_ENV = 'production';
process.env.GEMINI_API_KEY = '';

const { createApp } = await import('../../server.ts');

let server: ReturnType<Awaited<ReturnType<typeof createApp>>['listen']>;

test('API integration setup', async () => {
  const app = await createApp();

  server = app.listen(0, '127.0.0.1');

  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });
});

function getBaseUrl(): string {
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Test server is not listening');
  }

  return `http://127.0.0.1:${address.port}`;
}

test('GET /api/health returns 200 and service status', async () => {
  const response = await fetch(`${getBaseUrl()}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'github-profile-auditor');
});

test('invalid GitHub username returns 400 JSON error', async () => {
  const response = await fetch(
    `${getBaseUrl()}/api/audit/invalid%20username`
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.equal(body.statusCode, 400);
  assert.equal(typeof body.error, 'string');
});

test('undefined API route returns 404 JSON error', async () => {
  const response = await fetch(`${getBaseUrl()}/api/does-not-exist`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.code, 'NOT_FOUND');
  assert.equal(body.statusCode, 404);
});

test('nonexistent GitHub user returns controlled 404', async () => {
  const response = await fetch(
    `${getBaseUrl()}/api/audit/this-user-does-not-exist-938472`
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.code, 'USER_NOT_FOUND');
  assert.equal(body.statusCode, 404);
});

test.after(() => {
  server?.close();
});