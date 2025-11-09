import { randomUUID } from 'node:crypto';

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

export const validatePartialUser = (user) => {
  const errors = [];

  if (user.username && typeof user.username !== 'string') {
    errors.push('Username must be a string');
  }

  if (typeof user.age !== 'undefined' && typeof user.age !== 'number') {
    errors.push('Age must be a number');
  }

  if (user.hobbies) {
    if (!Array.isArray(user.hobbies)) {
      errors.push('Hobbies must be an array');
    } else if (user.hobbies.some((hobby) => typeof hobby !== 'string')) {
      errors.push('Hobby must be a string');
    }
  }

  return errors;
};

export const validateUser = (user) => {
  const errors = [];

  if (!user.username) {
    errors.push('Username is required');
  } else if (typeof user.username !== 'string') {
    errors.push('Username must be a string');
  }

  if (typeof user.age !== 'number') {
    errors.push('Age must be a number');
  } else if (Number.isNaN(user.age)) {
    errors.push('Age must be a number');
  }

  if (!Array.isArray(user.hobbies)) {
    errors.push('Hobbies are required');
  } else {
    const hasInvalidHobby = user.hobbies.some(
      (hobby) => typeof hobby !== 'string'
    );
    if (hasInvalidHobby) {
      errors.push('Hobby must be a string');
    }
  }

  return errors;
};

const getUsers = () =>
  _mockUsers
    .filter((user) => !user.isDeleted)
    .map(({ isDeleted, ...rest }) => ({ ...rest }));

export const getAll = async () => {
  return Promise.resolve(getUsers());
};

export const getOne = async (id) => {
  return Promise.resolve(getUsers().find((user) => user.id === id));
};

export const createOne = async (user) => {
  const newUser = { id: randomUUID(), ...user };
  _mockUsers.push(newUser);
  return Promise.resolve(newUser);
};

export const updateOne = async (id, user) => {
  const index = _mockUsers.findIndex((user) => user.id === id);
  if (index === -1) {
    return Promise.reject(new Error('User not found'));
  }
  _mockUsers[index] = { ..._mockUsers[index], ...user };
  return Promise.resolve(_mockUsers[index]);
};
