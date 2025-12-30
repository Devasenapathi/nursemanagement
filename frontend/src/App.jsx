import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';

// API base URL
const API_URL = '/api/nurses';

// Custom hook for debouncing - delays execution until user stops typing
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear the timer if value changes before delay completes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for API calls with async/await and promises
const useNursesApi = () => {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all nurses using async/await
  const fetchNurses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch nurses');
      }
      const data = await response.json();
      setNurses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create nurse using promises
  const createNurse = (nurseData) => {
    return new Promise((resolve, reject) => {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nurseData),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data.error || 'Failed to create nurse');
            });
          }
          return response.json();
        })
        .then((newNurse) => {
          setNurses((prev) => [newNurse, ...prev]);
          resolve(newNurse);
        })
        .catch(reject);
    });
  };

  // Update nurse using async/await
  const updateNurse = async (id, nurseData) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nurseData),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update nurse');
    }

    const updatedNurse = await response.json();
    setNurses((prev) =>
      prev.map((nurse) => (nurse.id === id ? updatedNurse : nurse))
    );
    return updatedNurse;
  };

  // Delete nurse using async/await
  const deleteNurse = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete nurse');
    }

    setNurses((prev) => prev.filter((nurse) => nurse.id !== id));
  };

  return {
    nurses,
    setNurses,
    loading,
    error,
    fetchNurses,
    createNurse,
    updateNurse,
    deleteNurse,
  };
};

// Modal Component
const NurseModal = ({ isOpen, onClose, nurse, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    dob: '',
    age: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (nurse) {
      setFormData({
        name: nurse.name,
        license_number: nurse.license_number,
        dob: nurse.dob,
        age: nurse.age.toString(),
      });
    } else {
      setFormData({ name: '', license_number: '', dob: '', age: '' });
    }
    setFormError('');
  }, [nurse, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-calculate age when DOB changes
    if (name === 'dob' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData((prev) => ({ ...prev, age: age.toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.license_number || !formData.dob || !formData.age) {
      setFormError('All fields are required');
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{nurse ? '✏️ Edit Nurse' : '➕ Add New Nurse'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {formError && <div className="error-message">⚠️ {formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter nurse's full name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="license_number">License Number</label>
              <input
                type="text"
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                placeholder="e.g., RN-123456"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Auto-calculated from DOB"
                min="18"
                max="100"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : nurse ? 'Update Nurse' : 'Add Nurse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Toast Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  );
};

// Main App Component
function App() {
  const {
    nurses,
    setNurses,
    loading,
    error,
    fetchNurses,
    createNurse,
    updateNurse,
    deleteNurse,
  } = useNursesApi();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Apply debounce to search term - waits 300ms after user stops typing
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchNurses();
  }, [fetchNurses]);

  // Filter nurses based on debounced search term
  const filteredNurses = nurses.filter((nurse) => {
    if (!debouncedSearchTerm) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      nurse.name.toLowerCase().includes(searchLower) ||
      nurse.license_number.toLowerCase().includes(searchLower) ||
      nurse.dob.includes(searchLower) ||
      nurse.age.toString().includes(searchLower)
    );
  });

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedNurses = [...nurses].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle numeric sorting for age
      if (key === 'age') {
        aVal = parseInt(aVal);
        bVal = parseInt(bVal);
      } else {
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setNurses(sortedNurses);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Modal handlers
  const openAddModal = () => {
    setEditingNurse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (nurse) => {
    setEditingNurse(nurse);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNurse(null);
  };

  // Save handler (create or update)
  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      if (editingNurse) {
        await updateNurse(editingNurse.id, formData);
        setToast({ message: 'Nurse updated successfully!', type: 'success' });
      } else {
        await createNurse(formData);
        setToast({ message: 'Nurse added successfully!', type: 'success' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async (nurse) => {
    if (window.confirm(`Are you sure you want to delete ${nurse.name}?`)) {
      try {
        await deleteNurse(nurse.id);
        setToast({ message: 'Nurse deleted successfully!', type: 'success' });
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      }
    }
  };

  // Download functionality using xlsx library (downloads filtered results)
  const downloadAsXLSX = () => {
    const data = filteredNurses.map((nurse) => ({
      Name: nurse.name,
      'License Number': nurse.license_number,
      'Date of Birth': nurse.dob,
      Age: nurse.age,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nurses');
    XLSX.writeFile(workbook, 'nurses_data.xlsx');
    setToast({ message: 'Downloaded as XLSX!', type: 'success' });
  };

  const downloadAsCSV = () => {
    const headers = ['Name', 'License Number', 'Date of Birth', 'Age'];
    const rows = filteredNurses.map((nurse) =>
      [nurse.name, nurse.license_number, nurse.dob, nurse.age].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nurses_data.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Downloaded as CSV!', type: 'success' });
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>Nurse Management</h1>
        <p>Manage your nursing staff records efficiently</p>
      </header>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="stats">
          <span className="stats-count">{filteredNurses.length}</span>
          <span> of {nurses.length} Nurse{nurses.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, license, DOB, or age..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="search-clear" 
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className="action-buttons">
          <button className="btn" onClick={downloadAsCSV} disabled={filteredNurses.length === 0}>
            📥 CSV
          </button>
          <button className="btn" onClick={downloadAsXLSX} disabled={filteredNurses.length === 0}>
            📊 XLSX
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            ➕ Add Nurse
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button className="btn btn-secondary btn-small" onClick={fetchNurses} style={{ marginLeft: '12px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading nurses...</span>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="table-container">
          {nurses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👩‍⚕️</div>
              <h3>No nurses registered yet</h3>
              <p>Get started by adding your first nurse to the system</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                ➕ Add First Nurse
              </button>
            </div>
          ) : filteredNurses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No results found</h3>
              <p>No nurses match "{debouncedSearchTerm}"</p>
              <button className="btn" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            </div>
          ) : (
            <table className="nurses-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className={sortConfig.key === 'name' ? 'sorted' : ''}
                  >
                    Name
                    <span className="sort-icon">{getSortIcon('name')}</span>
                  </th>
                  <th
                    onClick={() => handleSort('license_number')}
                    className={sortConfig.key === 'license_number' ? 'sorted' : ''}
                  >
                    License Number
                    <span className="sort-icon">{getSortIcon('license_number')}</span>
                  </th>
                  <th
                    onClick={() => handleSort('dob')}
                    className={sortConfig.key === 'dob' ? 'sorted' : ''}
                  >
                    Date of Birth
                    <span className="sort-icon">{getSortIcon('dob')}</span>
                  </th>
                  <th
                    onClick={() => handleSort('age')}
                    className={sortConfig.key === 'age' ? 'sorted' : ''}
                  >
                    Age
                    <span className="sort-icon">{getSortIcon('age')}</span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNurses.map((nurse, index) => (
                  <tr key={nurse.id} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="name-cell">{nurse.name}</td>
                    <td>
                      <span className="license-cell">{nurse.license_number}</span>
                    </td>
                    <td className="dob-cell">{formatDate(nurse.dob)}</td>
                    <td className="age-cell">{nurse.age}</td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-small"
                        onClick={() => openEditModal(nurse)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(nurse)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal */}
      <NurseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        nurse={editingNurse}
        onSave={handleSave}
        isLoading={isSaving}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;

