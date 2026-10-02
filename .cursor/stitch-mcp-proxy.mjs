#!/usr/bin/env node
// Stdio proxy for Stitch MCP. Cursor silently drops Stitch's ~287 KB
// tools/list response, so strip each tool's outputSchema before forwarding.
import { createInterface } from 'node:readline';

const STITCH_URL = 'https://stitch.googleapis.com/mcp';
const API_KEY = process.env.STITCH_API_KEY;

if (!API_KEY) {
  process.stderr.write('STITCH_API_KEY env var is required\n');
  process.exit(1);
}

let sessionId;

function parseEventStream(text) {
  return text
    .split(/\r?\n\r?\n/)
    .map(event =>
      event
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trimStart())
        .join('\n'),
    )
    .filter(Boolean)
    .map(data => JSON.parse(data));
}

async function postToStitch(message) {
  const response = await fetch(STITCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'X-Goog-Api-Key': API_KEY,
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify(message),
  });

  const nextSessionId = response.headers.get('mcp-session-id');
  if (nextSessionId) {
    sessionId = nextSessionId;
  }

  const text = await response.text();
  if (!text.trim()) {
    return [];
  }
  if (!response.ok && !text.trim().startsWith('{')) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const parsed = contentType.includes('text/event-stream')
    ? parseEventStream(text)
    : JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function stripOutputSchema(message) {
  if (Array.isArray(message?.result?.tools)) {
    for (const tool of message.result.tools) {
      delete tool.outputSchema;
    }
  }
  return message;
}

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

async function handle(line) {
  if (!line.trim()) {
    return;
  }

  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  try {
    const replies = await postToStitch(message);
    if (message.id === undefined) {
      return;
    }
    for (const reply of replies) {
      send(message.method === 'tools/list' ? stripOutputSchema(reply) : reply);
    }
  } catch (error) {
    process.stderr.write(`stitch proxy: ${error.message}\n`);
    if (message.id !== undefined) {
      send({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32603, message: error.message },
      });
    }
  }
}

createInterface({ input: process.stdin }).on('line', handle);
