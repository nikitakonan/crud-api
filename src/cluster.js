import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import { createServer, request } from 'node:http';
import { config } from 'dotenv';

// Load environment variables
config();

const BASE_PORT = parseInt(process.env.PORT || '4000', 10);
const NUM_WORKERS = availableParallelism() - 1;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${NUM_WORKERS} workers`);

  const workers = [];
  let currentWorkerIndex = 0;

  // Fork workers
  for (let i = 0; i < NUM_WORKERS; i++) {
    const workerPort = BASE_PORT + i + 1;
    const worker = cluster.fork({
      PORT: workerPort,
      WORKER_ID: i + 1,
    });
    workers.push({ worker, port: workerPort });
    console.log(`Worker ${worker.process.pid} started on port ${workerPort}`);

    // Listen for state change messages from workers
    worker.on('message', (message) => {
      if (!message || !message.type) return;

      // Broadcast state changes to all other workers
      switch (message.type) {
        case 'CREATE_USER':
          broadcastToWorkers(workers, worker, 'SYNC_CREATE', message.data);
          break;
        case 'UPDATE_USER':
          broadcastToWorkers(workers, worker, 'SYNC_UPDATE', message.data);
          break;
        case 'DELETE_USER':
          broadcastToWorkers(workers, worker, 'SYNC_DELETE', message.data);
          break;
      }
    });
  }

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code})`);
    console.log('Starting a new worker...');
    
    // Find and replace the dead worker
    const index = workers.findIndex((w) => w.worker === worker);
    if (index !== -1) {
      const workerPort = workers[index].port;
      const newWorker = cluster.fork({
        PORT: workerPort,
        WORKER_ID: index + 1,
      });
      workers[index] = { worker: newWorker, port: workerPort };
      console.log(`New worker ${newWorker.process.pid} started on port ${workerPort}`);

      // Set up message listener for the new worker
      newWorker.on('message', (message) => {
        if (!message || !message.type) return;

        switch (message.type) {
          case 'CREATE_USER':
            broadcastToWorkers(workers, newWorker, 'SYNC_CREATE', message.data);
            break;
          case 'UPDATE_USER':
            broadcastToWorkers(workers, newWorker, 'SYNC_UPDATE', message.data);
            break;
          case 'DELETE_USER':
            broadcastToWorkers(workers, newWorker, 'SYNC_DELETE', message.data);
            break;
        }
      });
    }
  });

  // Wait for all workers to be online before starting load balancer
  let onlineWorkers = 0;
  const checkAllWorkersOnline = () => {
    onlineWorkers++;
    if (onlineWorkers === NUM_WORKERS) {
      startLoadBalancer(workers);
    }
  };

  workers.forEach(({ worker }) => {
    worker.once('online', checkAllWorkersOnline);
  });
} else {
  // Worker process - import and run the main application
  import('./index.js');
}

/**
 * Starts the load balancer server
 * @param {Array<{worker: import('cluster').Worker, port: number}>} workers - Array of worker info
 */
function startLoadBalancer(workers) {
  let currentWorkerIndex = 0;

  const loadBalancer = createServer((req, res) => {
    // Get current worker using round-robin
    const targetWorker = workers[currentWorkerIndex];
    const targetPort = targetWorker.port;

    // Move to next worker for next request
    currentWorkerIndex = (currentWorkerIndex + 1) % workers.length;

    // Collect request body
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Prepare options for proxying
      const options = {
        hostname: 'localhost',
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };

      // Forward request to worker
      const proxyReq = createProxyRequest(options, body, res);

      proxyReq.on('error', (error) => {
        console.error(`Error proxying to worker on port ${targetPort}:`, error.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Bad Gateway' }));
      });

      proxyReq.end();
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Bad Request' }));
    });
  });

  loadBalancer.listen(BASE_PORT, () => {
    console.log(`\nLoad balancer listening on port ${BASE_PORT}`);
    console.log(`Distributing requests across ${NUM_WORKERS} workers (ports ${BASE_PORT + 1}-${BASE_PORT + NUM_WORKERS})`);
    console.log(`API available at http://localhost:${BASE_PORT}/api\n`);
  });

  loadBalancer.on('error', (error) => {
    console.error('Load balancer error:', error);
    process.exit(1);
  });
}

/**
 * Creates a proxy request to forward to a worker
 * @param {import('http').RequestOptions} options - Request options
 * @param {string} body - Request body
 * @param {import('http').ServerResponse} clientRes - Client response object
 * @returns {import('http').ClientRequest}
 */
function createProxyRequest(options, body, clientRes) {
  const proxyReq = request(options, (proxyRes) => {
    // Forward status code and headers
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe response back to client
    proxyRes.pipe(clientRes);
  });

  // Write body if present
  if (body) {
    proxyReq.write(body);
  }

  return proxyReq;
}

/**
 * Broadcasts a message to all workers except the sender
 * @param {Array<{worker: import('cluster').Worker, port: number}>} workers - Array of workers
 * @param {import('cluster').Worker} senderWorker - The worker that sent the original message
 * @param {string} type - Message type to broadcast
 * @param {Object} data - Data to broadcast
 */
function broadcastToWorkers(workers, senderWorker, type, data) {
  workers.forEach(({ worker }) => {
    // Don't send back to the worker that initiated the change
    if (worker !== senderWorker && worker.isConnected()) {
      worker.send({ type, data });
    }
  });
}
