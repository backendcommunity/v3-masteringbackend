// lib/playground-demo-script.ts
// Deterministic, frontend-only demo data for the playground walkthrough.
// No database calls, no executor service — all responses are static.

export const DEMO_STARTER_FILES: Array<{ name: string; content: string }> = [
  {
    name: "package.json",
    content: `{
  "name": "hello-api-sample",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node test.js"
  },
  "dependencies": {}
}`,
  },
  {
    name: "index.js",
    content: `const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello, World!' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
});`,
  },
];

export const DEMO_TERMINAL_LOGS: Array<{ step: string; log: string; delay: number }> = [
  // "run-server" step: server startup logs
  { step: "run-server", log: "$ npm start", delay: 0 },
  { step: "run-server", log: "", delay: 50 },
  { step: "run-server", log: "> hello-api-sample@1.0.0 start", delay: 100 },
  { step: "run-server", log: "> node index.js", delay: 120 },
  { step: "run-server", log: "", delay: 150 },
  { step: "run-server", log: "Server running at http://localhost:3000/", delay: 200 },

  // "run-test" step: test execution logs
  { step: "run-test", log: "$ npm test", delay: 500 },
  { step: "run-test", log: "", delay: 550 },
  { step: "run-test", log: "> hello-api-sample@1.0.0 test", delay: 600 },
  { step: "run-test", log: "> node test.js", delay: 620 },
  { step: "run-test", log: "", delay: 650 },
  { step: "run-test", log: "Testing GET /api/hello...", delay: 700 },
  { step: "run-test", log: "✓ Status code: 200", delay: 800 },
  { step: "run-test", log: "✓ Response format: JSON", delay: 900 },
  { step: "run-test", log: "✓ Message field present", delay: 950 },
  { step: "run-test", log: "", delay: 1000 },
  { step: "run-test", log: "All tests passed!", delay: 1100 },
];

export const DEMO_TEST_RESULT: { pass: boolean; message: string; scoreEarned: number } = {
  pass: true,
  message: "All 3 tests passed. HTTP server correctly responds to GET /api/hello with 200 status and valid JSON.",
  scoreEarned: 10,
};

export const DEMO_FILE_STATES: Record<string, Record<string, string>> = {
  initial: {
    "package.json": `{
  "name": "hello-api-sample",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node test.js"
  },
  "dependencies": {}
}`,
    "index.js": `const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello, World!' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
});`,
  },
  "after-run-server": {
    "package.json": `{
  "name": "hello-api-sample",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node test.js"
  },
  "dependencies": {}
}`,
    "index.js": `const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello, World!' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
});`,
  },
};
