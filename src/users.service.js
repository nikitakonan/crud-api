import { randomUUID } from 'node:crypto';

/**
 * In-memory user storage
 * @type {Array<{id: string, username: string, age: number, hobbies: string[], isDeleted?: boolean}>}
 */
const _mockUsers = [
  {
    id: randomUUID(),
    username: 'Leanne Graham',
    age: 100,
    hobbies: ['Volleyball'],
  },
  {
    id: randomUUID(),
    username: 'Ervin Howell',
    age: 100,
    hobbies: ['Robots', 'Maths'],
  },
  { id: randomUUID(), username: 'Clementine Bauch', age: 100, hobbies: [] },
];

/**
 * Validates partial user data for updates
 * @param {Partial<{username: string, age: number, hobbies: string[]}>} user - Partial user data
 * @returns {string[]} Array of validation error messages
 */
export const validatePartialUser = (user) => {
  const errors = [];

  if (user.username !== undefined) {
    if (typeof user.username !== 'string') {
      errors.push('Username must be a string');
    } else if (user.username.trim() === '') {
      errors.push('Username cannot be empty');
    }
  }

  if (user.age !== undefined) {
    if (typeof user.age !== 'number' || Number.isNaN(user.age)) {
      errors.push('Age must be a valid number');
    } else if (user.age < 0) {
      errors.push('Age must be positive');
    }
  }

  if (user.hobbies !== undefined) {
    if (!Array.isArray(user.hobbies)) {
      errors.push('Hobbies must be an array');
    } else if (user.hobbies.some((hobby) => typeof hobby !== 'string')) {
      errors.push('All hobbies must be strings');
    }
  }

  return errors;
};

/**
 * Validates complete user data for creation
 * @param {{username: string, age: number, hobbies: string[]}} user - User data
 * @returns {string[]} Array of validation error messages
 */
export const validateUser = (user) => {
  const errors = [];

  // Validate username
  if (!user.username) {
    errors.push('Username is required');
  } else if (typeof user.username !== 'string') {
    errors.push('Username must be a string');
  } else if (user.username.trim() === '') {
    errors.push('Username cannot be empty');
  }

  // Validate age
  if (user.age === undefined || user.age === null) {
    errors.push('Age is required');
  } else if (typeof user.age !== 'number' || Number.isNaN(user.age)) {
    errors.push('Age must be a valid number');
  } else if (user.age < 0) {
    errors.push('Age must be positive');
  }

  // Validate hobbies
  if (!user.hobbies) {
    errors.push('Hobbies are required');
  } else if (!Array.isArray(user.hobbies)) {
    errors.push('Hobbies must be an array');
  } else if (user.hobbies.some((hobby) => typeof hobby !== 'string')) {
    errors.push('All hobbies must be strings');
  }

  return errors;
};

/**
 * Gets active (non-deleted) users
 * @returns {Array<{id: string, username: string, age: number, hobbies: string[]}>}
 */
const getActiveUsers = () =>
  _mockUsers
    .filter((user) => !user.isDeleted)
    .map(({ isDeleted, ...rest }) => rest);

/**
 * Retrieves all active users
 * @returns {Promise<Array<{id: string, username: string, age: number, hobbies: string[]}>>}
 */
export const getAll = async () => {
  return getActiveUsers();
};

/**
 * Retrieves a single user by ID
 * @param {string} id - User ID
 * @returns {Promise<{id: string, username: string, age: number, hobbies: string[]}|undefined>}
 */
export const getOne = async (id) => {
  return getActiveUsers().find((user) => user.id === id);
};

/**
 * Creates a new user
 * @param {{username: string, age: number, hobbies: string[]}} user - User data
 * @returns {Promise<{id: string, username: string, age: number, hobbies: string[]}>}
 */
export const createOne = async (user) => {
  const newUser = { id: randomUUID(), ...user };
  _mockUsers.push(newUser);
  return newUser;
};

/**
 * Updates an existing user
 * @param {string} id - User ID
 * @param {Partial<{username: string, age: number, hobbies: string[], isDeleted: boolean}>} userData - Data to update
 * @returns {Promise<{id: string, username: string, age: number, hobbies: string[]}>}
 * @throws {Error} If user not found
 */
export const updateOne = async (id, userData) => {
  const index = _mockUsers.findIndex((user) => user.id === id);
  
  if (index === -1) {
    throw new Error('User not found');
  }

  _mockUsers[index] = { ..._mockUsers[index], ...userData };
  
  // Return user without isDeleted flag if it's a soft delete
  const { isDeleted, ...rest } = _mockUsers[index];
  return userData.isDeleted ? _mockUsers[index] : rest;
};
