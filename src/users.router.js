import {
  getAll,
  getOne,
  createOne,
  updateOne,
  validateUser,
  validatePartialUser,
} from './users.service.js';
import { isValidUUID } from './utils/isValidUUID.js';
import { parseRequestBody } from './utils/parseRequestBody.js';
import { sendJson, sendError, sendNoContent } from './utils/response.js';

/**
 * Extracts user ID from URL path
 * @param {string} url - Request URL
 * @returns {string|null} User ID or null
 */
const extractUserId = (url) => {
  const params = url.split('/').filter(Boolean);
  return params[2] || null;
};

/**
 * Validates user ID and returns user if exists
 * @param {string} id - User ID
 * @param {import('http').ServerResponse} res - Response object
 * @returns {Promise<Object|null>} User object or null if validation fails
 */
const validateAndGetUser = async (id, res) => {
  if (!isValidUUID(id)) {
    sendError(res, 400, 'Invalid id');
    return null;
  }

  const user = await getOne(id);
  if (!user) {
    sendError(res, 404, 'User not found');
    return null;
  }

  return user;
};

/**
 * Handles GET all users request
 */
const handleGetAllUsers = async (req, res) => {
  const users = await getAll();
  sendJson(res, 200, users);
};

/**
 * Handles GET single user request
 */
const handleGetUser = async (req, res, id) => {
  const user = await validateAndGetUser(id, res);
  if (user) {
    sendJson(res, 200, user);
  }
};

/**
 * Handles POST create user request
 */
const handleCreateUser = async (req, res) => {
  try {
    const newUser = await parseRequestBody(req);
    const errors = validateUser(newUser);
    
    if (errors.length) {
      sendError(res, 400, errors.join(', '));
      return;
    }

    const user = await createOne(newUser);
    sendJson(res, 201, user);
  } catch (error) {
    sendError(res, 400, 'User is invalid');
  }
};

/**
 * Handles PUT update user request
 */
const handleUpdateUser = async (req, res, id) => {
  const user = await validateAndGetUser(id, res);
  if (!user) return;

  try {
    const parsedUser = await parseRequestBody(req);
    const errors = validatePartialUser(parsedUser);
    
    if (errors.length) {
      sendError(res, 400, errors.join(', '));
      return;
    }

    const updatedUser = await updateOne(id, parsedUser);
    sendJson(res, 200, updatedUser);
  } catch (error) {
    sendError(res, 400, 'User is invalid');
  }
};

/**
 * Handles DELETE user request (soft delete)
 */
const handleDeleteUser = async (req, res, id) => {
  const user = await validateAndGetUser(id, res);
  if (!user) return;

  await updateOne(id, { isDeleted: true });
  sendNoContent(res);
};

/**
 * Main router for /api/users endpoints
 */
export const usersRouter = async (req, res) => {
  const id = extractUserId(req.url);
  const { method } = req;

  // Route to specific handlers
  if (method === 'GET' && !id) {
    return handleGetAllUsers(req, res);
  }

  if (method === 'GET' && id) {
    return handleGetUser(req, res, id);
  }

  if (method === 'POST' && !id) {
    return handleCreateUser(req, res);
  }

  if (method === 'PUT' && id) {
    return handleUpdateUser(req, res, id);
  }

  if (method === 'DELETE' && id) {
    return handleDeleteUser(req, res, id);
  }

  // No matching route
  sendError(res, 404, 'Route not found');
};
