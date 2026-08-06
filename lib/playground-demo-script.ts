// lib/playground-demo-script.ts
// Deterministic, frontend-only demo data for the playground walkthrough.
// No database calls, no executor service — all responses are static.

export const DEMO_STARTER_FILES: Array<{ name: string; content: string }> = [
  {
    name: "package.json",
    content: `{
  "name": "api-starter",
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
  { step: "run-server", log: "> api-starter@1.0.0 start", delay: 100 },
  { step: "run-server", log: "> node index.js", delay: 120 },
  { step: "run-server", log: "", delay: 150 },
  { step: "run-server", log: "Server running at http://localhost:3000/", delay: 200 },

  // "run-test" step: test execution logs
  { step: "run-test", log: "$ npm test", delay: 500 },
  { step: "run-test", log: "", delay: 550 },
  { step: "run-test", log: "> api-starter@1.0.0 test", delay: 600 },
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

export const DEMO_TASKS = [
  {
    id: "demo-task-1",
    title: "Create your first file",
    description: "Create a file named `index.js` in the project root. Use the file tree's New file button, name it `index.js`, and save.",
    required: true,
    mb: 5,
  },
  {
    id: "demo-task-2",
    title: "Run a test",
    description: "Make `GET /api/hello` return 200 with a JSON body like { message: 'Hello API' }. Click Run test.",
    required: true,
    mb: 10,
    apiSpec: {
      method: "GET",
      path: "/api/hello",
      expectedStatus: 200,
      expectedBody: { message: "Hello, World!" },
    },
  },
  {
    id: "demo-task-3",
    title: "Run the server & preview",
    description: "Boot the server and open the live preview to see your API respond.",
    required: true,
    mb: 5,
  },
  {
    id: "demo-task-4",
    title: "Add error handling",
    description: "Add proper error handling for invalid routes.",
    required: false,
    mb: 3,
  },
  {
    id: "demo-task-5",
    title: "Deploy to production",
    description: "Ship your API to a live server.",
    required: false,
    mb: 20,
  },
];

export const DEMO_FRONTEND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello API Demo</title>
  <style>
    body { font-family: sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #13AECE; }
    .response { background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 20px; font-family: monospace; }
    button { background: #13AECE; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0e1f33; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello API Demo</h1>
    <p>This is a live preview of your API.</p>
    <button onclick="testAPI()">Test API</button>
    <div id="response" class="response" style="display:none;"></div>
  </div>
  <script>
    async function testAPI() {
      const response = await fetch('/api/hello');
      const data = await response.json();
      document.getElementById('response').style.display = 'block';
      document.getElementById('response').innerHTML = '<strong>Response:</strong><br>' + JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>`;
