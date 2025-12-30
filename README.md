# Nurse Management System

A full-stack web application for managing nurse records with CRUD operations, built with Node.js, Express, and SQLite.

![Nurse Management System](https://img.shields.io/badge/Node.js-v18+-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## Features

- ✅ **View All Nurses** - Display nurses in a responsive table
- ✅ **Add Nurse** - Create new nurse records via a pop-up modal
- ✅ **Edit Nurse** - Update existing nurse information
- ✅ **Delete Nurse** - Remove nurse records with confirmation
- ✅ **Sorting** - Click on table headers to sort by any column (Name, License Number, DOB, Age)
- ✅ **CSV Download** - Export all nurse data to CSV format
- ✅ **Async/Await & Promises** - Modern JavaScript patterns for API calls
- ✅ **Auto Age Calculation** - Automatically calculates age from Date of Birth

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (using better-sqlite3)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Features**: RESTful API, CORS enabled

## Nurse Entity Fields

| Field | Type | Description |
|-------|------|-------------|
| Name | String | Full name of the nurse |
| License Number | String | Unique nursing license number |
| DOB | Date | Date of birth |
| Age | Integer | Age in years |

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nursemanagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nurses` | Get all nurses |
| GET | `/api/nurses/:id` | Get a single nurse |
| POST | `/api/nurses` | Create a new nurse |
| PUT | `/api/nurses/:id` | Update a nurse |
| DELETE | `/api/nurses/:id` | Delete a nurse |

## Project Structure

```
nursemanagement/
├── server.js           # Express server and API routes
├── package.json        # Dependencies and scripts
├── nurses.db           # SQLite database (created on first run)
├── public/
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
└── README.md           # This file
```

## Code Highlights

### Async/Await Usage
```javascript
// Fetching nurses using async/await
async function fetchNurses() {
  try {
    const response = await fetch('/api/nurses');
    const result = await response.json();
    // Process data...
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Promise Usage
```javascript
// Delete operation using Promise
function deleteNurse(id) {
  const deletePromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`/api/nurses/${id}`, { method: 'DELETE' });
      const result = await response.json();
      result.success ? resolve(result) : reject(new Error(result.error));
    } catch (error) {
      reject(error);
    }
  });
  
  deletePromise
    .then(() => { /* success handling */ })
    .catch(error => { /* error handling */ });
}
```

### Sorting Implementation
```javascript
// Click on table headers to sort
function sortNurses(column, direction) {
  nurses.sort((a, b) => {
    let valueA = a[column];
    let valueB = b[column];
    // Compare and return sort order...
  });
}
```

## Screenshots

The application features:
- Modern dark theme UI with gradient accents
- Responsive design for mobile and desktop
- Animated table rows and smooth transitions
- Modal pop-ups for add/edit operations
- Toast notifications for user feedback

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Author

Created as a Nurse Management assignment demonstrating:
- SQL database operations
- CRUD functionality
- Modern JavaScript (async/await, Promises)
- Responsive web design
