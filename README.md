# Nurse Management System

A full-stack web application for managing nurse records built with Node.js and React.js.

## Features

- ✅ **View All Nurses** - Display all nurses in a beautiful, responsive table
- ✅ **Add Nurse** - Add new nurse records via a modal popup
- ✅ **Edit Nurse** - Edit existing nurse records
- ✅ **Delete Nurse** - Remove nurse records
- ✅ **Sorting** - Click on table headers to sort by any column (Name, License, DOB, Age)
- ✅ **Download Data** - Export data as CSV or XLSX format
- ✅ **Auto Age Calculation** - Age is auto-calculated when DOB is entered

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database (using better-sqlite3)
- RESTful API with CRUD operations
- Uses **async/await** and **Promises** for asynchronous operations

### Frontend
- **React.js 18** with Vite
- Modern CSS with CSS variables
- **xlsx** library for Excel export
- Responsive design

## Project Structure

```
nursemanagement/
├── backend/
│   ├── package.json
│   └── server.js          # Express server with SQLite
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server** (Terminal 1)
   ```bash
   cd backend
   npm start
   ```
   The API server will run on `http://localhost:5000`

2. **Start the Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   The React app will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nurses` | Get all nurses |
| GET | `/api/nurses/:id` | Get a single nurse |
| POST | `/api/nurses` | Create a new nurse |
| PUT | `/api/nurses/:id` | Update a nurse |
| DELETE | `/api/nurses/:id` | Delete a nurse |

## Nurse Entity Fields

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Auto-generated primary key |
| name | TEXT | Nurse's full name |
| license_number | TEXT | Unique license number |
| dob | TEXT | Date of birth (YYYY-MM-DD) |
| age | INTEGER | Age in years |

## Async/Await & Promises Usage

The application demonstrates both async/await and Promises:

### Backend (`server.js`)
- Uses `asyncQuery` helper function that wraps database operations in Promises
- All API endpoints use `async/await` for handling requests

### Frontend (`App.jsx`)
- `createNurse` uses traditional Promise `.then()/.catch()` syntax
- `fetchNurses`, `updateNurse`, `deleteNurse` use async/await
- Custom hook `useNursesApi` demonstrates both patterns

## Screenshots

The application features:
- Dark theme with teal accents
- Responsive table with sortable columns
- Modal popup for adding/editing nurses
- Toast notifications for feedback
- Empty state when no data exists

