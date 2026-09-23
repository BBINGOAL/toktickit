# TokTickIT

ToktickIT is a Full-Stack Starter application for CPE 334 Software Engineering.
- **Lab 1:** Project Foundation (Hello World, DB Setup, Basic APIs)
- **Lab 2:** Requester Ticketing MVP with UI Foundation (Ticket Creation, My Tickets, Attachments, E2E Testing)
- **Lab 3:** Cookie authentication, first-login password change, role-based access, IT Staff queue/operations, public comments/internal notes, and Administrator user management.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Bootstrap
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (via Docker) + Prisma
- **Testing:** Vitest (Frontend), Supertest (Backend), Playwright (E2E)

---

## Repository Structure

```text
toktickit/
├── client/                 # React frontend application
├── server/                 # Express backend application
│   ├── prisma/             # Database schema and seeds
│   ├── src/                # Backend source code
│   └── tests/              # Supertest API tests (lab-01, lab-02, lab-03)
├── e2e/                    # Playwright End-to-End tests
│   ├── lab-02/
│   └── lab-03/
├── docs/
│   ├── lab-01/             # Lab 1 submission documents
│   ├── lab-02/             # Lab 2 submission documents
│   └── lab-03/             # Lab 3 specification, UI spec, tests, AI use, reviews
├── artifacts/              # Screenshots and visual evidence
│   └── lab-02/
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

# Seed a NEW development database with references and demo users
npx prisma db seed

# Start the backend development server (runs on http://localhost:4000)
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

### End-to-End Tests (Playwright)
Ensure both the frontend and backend servers are running locally before executing E2E tests.
```bash
cd e2e
npm install
npx playwright test
```


## Lab 3 accounts and documents

For a newly seeded development database, demo accounts are:
Requester `jennifer.anderson@kmutt.ac.th`, IT Staff `it1@kmutt.ac.th`,
Administrator `admin@kmutt.ac.th`; initial password `password123`.
Change the initial password when prompted. These credentials are for local demos only.
Never reseed a database containing work merely to restore passwords.

See [specification](docs/lab-03/specification.md), [UI specification](docs/lab-03/ui-spec.md),
[test evidence](docs/lab-03/tests.md), [AI use](docs/lab-03/ai-use.md), and [reviews](docs/lab-03/reviewer.md).

## Reproducible isolated verification (PowerShell)

Use a new database name beginning with `toktickit_lab3_verify_`.
The example below creates a separate database; it does not reset `localdb`.
Run setup once, with Docker PostgreSQL healthy.

```powershell
docker exec local-postgres createdb -U postgres toktickit_lab3_verify_local
$env:DATABASE_URL='postgresql://postgres:password@127.0.0.1:5434/toktickit_lab3_verify_local'
cd server
npx prisma migrate deploy
npx prisma db seed
npm test
npm run dev
```

Keep the API terminal open. In another terminal, start `npm run dev` in `client`
(port 5173). In a third terminal, from the repository root:

```powershell
$env:DATABASE_URL='postgresql://postgres:password@127.0.0.1:5434/toktickit_lab3_verify_local'
cd e2e
npx playwright test --workers=1
```

The API and E2E process must use the same test database. E2E creates disposable accounts
and tickets and cleans up its own data. It rejects non-test database names.
Screenshots are saved under `report-assets/lab3-e2e/`.
The two tests in `e2e/tests/example.spec.ts` are Playwright website examples, not application coverage.
Run `npx playwright test lab-02 lab-03 --workers=1` for application-only tests.
