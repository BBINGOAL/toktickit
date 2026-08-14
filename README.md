# TokTickIT

ToktickIT is the lab 1 of CPE 334 Software Engineering ,a Full-Stack Hello World Starter application.
It demonstrates a complete vertical slice proving that every layer of the tech stack works well.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Bootstrap
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (via Docker) + Prisma
- **Testing:** Vitest + Supertest

---

## Repository Structure

```text
toktickit/
├── client/                 # React frontend application
├── server/                 # Express backend application
│   ├── prisma/             # Database schema and seeds
│   ├── src/                # Backend source code
│   └── tests/              # Supertest API tests
│       └── lab-01/
├── docs/
│   └── lab-01/             # Lab submission documents
│       ├── ai_use.md
│       └── reviewer.md
├── .gitignore
└── README.md
```

---

## Setup Instructions

### 1. Start the Database (Docker)
We use Docker to run a local PostgreSQL database.
```bash
# Start the PostgreSQL container in the background
docker compose up -d

# Verify it's running and healthy
docker ps
```

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Make sure DATABASE_URL in .env points to the docker container (e.g., postgres://postgres:password@localhost:5434/localdb)

# Run Prisma migrations to create tables
npx prisma migrate dev

# Seed the database with initial categories
npx prisma db seed

# Start the backend development server (runs on http://localhost:3000)
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd client

# Install dependencies
npm install

# Start the frontend development server (runs on http://localhost:5173)
npm run dev
```

---

## Running Tests

The project includes automated tests for both the frontend and backend.

### Backend Tests (Supertest)
Ensure your Docker database is running before executing backend tests.
```bash
cd server
npm test
```

### Frontend Tests (Vitest)
```bash
cd client
npm test
```
