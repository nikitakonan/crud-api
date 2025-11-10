import { config } from 'dotenv';
import { createServer } from 'node:http';
import { usersRouter } from './users.router.js';

config();

const server = createServer(async (req, res) => {
  console.log(req.url);

  try {
    if (/^\/api\/users/.test(req.url)) {
      return await usersRouter(req, res);
    }

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Not found' }));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(500);
    res.end(JSON.stringify({ message: error.message }));
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server running at PORT ${process.env.PORT}`);
});
