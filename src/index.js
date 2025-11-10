import { config } from 'dotenv';
import { createServer } from 'node:http';
import { usersRouter } from './users.router.js';
import { sendError } from './utils/response.js';

// Load environment variables
config();

/**
 * Main request handler
 * @param {import('http').IncomingMessage} req - Incoming request
 * @param {import('http').ServerResponse} res - Server response
 */
const requestHandler = async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  try {
    // Route to users API
    if (/^\/api\/users/.test(req.url)) {
      return await usersRouter(req, res);
    }

    // 404 for unmatched routes
    sendError(res, 404, 'Not found');
  } catch (error) {
    console.error('Server error:', error);
    sendError(res, 500, error.message || 'Internal server error');
  }
};

// Create and start server
const server = createServer(requestHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
