# CRUD API

A simple CRUD API built with Node.js that supports horizontal scaling with load balancing.

## Features

- RESTful API for user management (Create, Read, Update, Delete)
- In-memory data storage
- Horizontal scaling with Node.js Cluster API
- Load balancing with Round-robin algorithm
- State synchronization across worker processes via IPC

## Requirements

- Node.js 24.x.x (24.10.0 or higher)

## Installation

```bash
npm install
```

## Configuration

Set the PORT in `.env` file (default: 4000):

```
PORT=4000
```

## Usage

### Single Instance Mode

Run a single instance of the application:

```bash
# Development mode with auto-reload
npm run start:dev

# Production mode
npm run start:prod
```

The server will run on `http://localhost:4000` (or the PORT specified in .env)

### Multi-Instance Mode (Horizontal Scaling)

Run multiple instances with load balancing:

```bash
npm run start:multi
```

This will:
- Start a load balancer on port `4000`
- Start N-1 workers (where N = available CPU parallelism)
- Workers run on ports `4001`, `4002`, `4003`, etc.
- Distribute requests using Round-robin algorithm
- Maintain consistent state across all workers via IPC

**Example with 8-core system:**
- Load balancer: `http://localhost:4000/api`
- Worker 1: `http://localhost:4001/api`
- Worker 2: `http://localhost:4002/api`
- Worker 3: `http://localhost:4003/api`
- ... up to Worker 7: `http://localhost:4007/api`

## API Endpoints

### Get all users
```bash
GET /api/users
```

### Get user by ID
```bash
GET /api/users/:id
```

### Create user
```bash
POST /api/users
Content-Type: application/json

{
  "username": "John Doe",
  "age": 30,
  "hobbies": ["reading", "coding"]
}
```

### Update user
```bash
PUT /api/users/:id
Content-Type: application/json

{
  "username": "John Updated",
  "age": 31,
  "hobbies": ["reading", "coding", "gaming"]
}
```

### Delete user
```bash
DELETE /api/users/:id
```

## State Synchronization

When running in multi-instance mode, all CRUD operations are synchronized across workers:

1. **CREATE**: User created on worker 1 is immediately visible on all other workers
2. **UPDATE**: User updated on worker 2 is immediately visible on all other workers
3. **DELETE**: User deleted on worker 3 returns 404 on all other workers

This ensures consistent state regardless of which worker handles the request.

## Testing

### Test Cluster State Synchronization
```bash
./test-cluster.sh
```

### Comprehensive Tests
```bash
./test-comprehensive.sh
```

## Architecture

### Single Instance Mode
```
Client → Server (PORT) → In-memory DB
```

### Multi-Instance Mode
```
Client → Load Balancer (PORT)
           ↓ (Round-robin)
           ├→ Worker 1 (PORT+1) ←→ IPC ←→ Master
           ├→ Worker 2 (PORT+2) ←→ IPC ←→ Master
           ├→ Worker 3 (PORT+3) ←→ IPC ←→ Master
           └→ Worker N (PORT+N) ←→ IPC ←→ Master
```

State changes flow:
1. Worker performs CRUD operation
2. Worker sends state change to Master via IPC
3. Master broadcasts change to all other workers
4. All workers update their in-memory state

## Technical Stack

- Node.js built-in modules only:
  - `node:http` - HTTP server
  - `node:cluster` - Multi-process clustering
  - `node:os` - System information
  - `node:crypto` - UUID generation
- `dotenv` - Environment configuration
- `nodemon` - Development auto-reload

## License

ISC
