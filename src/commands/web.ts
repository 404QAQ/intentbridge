import { spawn, ChildProcess } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let webServerProcess: ChildProcess | null = null;
let viteProcess: ChildProcess | null = null;

export async function webStartCommand(options: { port?: string; dev?: boolean }) {
  const port = options.port || '9528';
  const isDev = options.dev !== false; // Default to dev mode

  const webServerPath = join(__dirname, '..', '..', '..', 'web-server');
  const webFrontendPath = join(__dirname, '..', '..', '..', 'web');

  // Check if web-server directory exists
  if (!existsSync(webServerPath)) {
    console.error('Error: web-server directory not found.');
    console.error('Please make sure the web-server is built.');
    process.exit(1);
  }

  console.log('Starting IntentBridge Web Dashboard...\n');

  // Start backend API server
  console.log(`Starting API server on port ${port}...`);
  webServerProcess = spawn('npm', ['start'], {
    cwd: webServerPath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      WEB_SERVER_PORT: port,
      INTENTBRIDGE_DIR: join(process.cwd(), '.intentbridge'),
    },
  });

  webServerProcess.on('error', (error) => {
    console.error('Failed to start web server:', error);
    cleanup();
    process.exit(1);
  });

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start frontend dev server (if in dev mode)
  if (isDev) {
    console.log('Starting frontend dev server...');
    viteProcess = spawn('npm', ['run', 'dev'], {
      cwd: webFrontendPath,
      stdio: 'inherit',
      shell: true,
    });

    viteProcess.on('error', (error) => {
      console.error('Failed to start frontend server:', error);
      cleanup();
      process.exit(1);
    });
  }

  console.log('\n✅ Web Dashboard is running!\n');
  console.log(`📊 Dashboard: http://localhost:3000`);
  console.log(`📡 API Server: http://localhost:${port}/api`);
  console.log(`\nPress Ctrl+C to stop.\n`);

  // Handle cleanup on exit
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

export function webStopCommand() {
  console.log('Stopping Web Dashboard...');
  cleanup();
  console.log('Web Dashboard stopped.');
}

function cleanup() {
  if (webServerProcess) {
    webServerProcess.kill();
    webServerProcess = null;
  }

  if (viteProcess) {
    viteProcess.kill();
    viteProcess = null;
  }
}
