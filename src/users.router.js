import {
  getAll,
  getOne,
  createOne,
  updateOne,
  validateUser,
  validatePartialUser,
} from './users.service.js';
import { isValidUUID } from './utils/isValidUUID.js';

export const usersRouter = async (req, res) => {
  const params = req.url.split('/').filter(Boolean);
  console.log(params);
  const id = params[2];

  if (req.method === 'DELETE' && id) {
    if (!isValidUUID(id)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid id' }));
      return;
    }

    const exists = await getOne(id);
    if (!exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }

    await updateOne(id, { isDeleted: true });
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'PUT' && id) {
    if (!isValidUUID(id)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid id' }));
      return;
    }

    const exists = await getOne(id);
    if (!exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }

    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      let parsedUser = null;
      try {
        parsedUser = JSON.parse(body);
        const errors = validatePartialUser(parsedUser);
        if (errors.length) {
          throw new Error(errors.join(', '));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User is invalid' }));
        return;
      }

      const user = await updateOne(id, { ...parsedUser });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    });
  }

  if (req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      let newUser = null;
      try {
        newUser = JSON.parse(body);
        const errors = validateUser(newUser);
        if (errors.length) {
          throw new Error(errors.join(', '));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User is invalid' }));
        return;
      }
      const user = await createOne({ ...newUser });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    });
    return;
  }

  if (req.method === 'GET' && id) {
    if (!isValidUUID(id)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid id' }));
      return;
    }
    const user = await getOne(id);

    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
    return;
  }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const users = await getAll();
    res.end(JSON.stringify(users));
    return;
  }
};
