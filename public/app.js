// API Base URL
const API_URL = '/api/nurses';

// State
let nurses = [];
let currentSortColumn = null;
let sortDirection = 'asc';
let editingNurseId = null;

// DOM Elements
const nursesTableBody = document.getElementById('nursesTableBody');
const loadingOverlay = document.getElementById('loadingOverlay');
const emptyState = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
const nurseForm = document.getElementById('nurseForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const totalNursesEl = document.getElementById('totalNurses');
const avgAgeEl = document.getElementById('avgAge');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchNurses();
  setupEventListeners();
  setupSorting();
});

// Setup Event Listeners
function setupEventListeners() {
  // Add Nurse Button
  document.getElementById('addNurseBtn').addEventListener('click', () => openModal());
  
  // Modal Close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  
  // Form Submit
  nurseForm.addEventListener('submit', handleFormSubmit);
  
  // Download Button
  document.getElementById('downloadBtn').addEventListener('click', downloadCSV);
  
  // Delete Modal
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === deleteModalOverlay) closeDeleteModal();
  });
  
  // Auto-calculate age from DOB
  document.getElementById('nurseDob').addEventListener('change', (e) => {
    const dob = new Date(e.target.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    document.getElementById('nurseAge').value = age > 0 ? age : '';
  });
}

// Setup Sorting
function setupSorting() {
  const sortableHeaders = document.querySelectorAll('.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      
      // Remove sorted class from all headers
      sortableHeaders.forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Toggle direction if same column, otherwise default to asc
      if (currentSortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortDirection = 'asc';
      }
      
      currentSortColumn = column;
      header.classList.add(`sorted-${sortDirection}`);
      
      sortNurses(column, sortDirection);
      renderTable();
    });
  });
}

// Fetch Nurses from API using async/await
async function fetchNurses() {
  showLoading(true);
  
  try {
    // Using fetch with async/await
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      nurses = result.data;
      updateStats();
      renderTable();
    } else {
      throw new Error(result.error || 'Failed to fetch nurses');
    }
  } catch (error) {
    console.error('Error fetching nurses:', error);
    showToast('Failed to load nurses. Please try again.', 'error');
  } finally {
    showLoading(false);
  }
}

// Sort Nurses
function sortNurses(column, direction) {
  nurses.sort((a, b) => {
    let valueA = a[column];
    let valueB = b[column];
    
    // Handle different types
    if (column === 'age') {
      valueA = parseInt(valueA);
      valueB = parseInt(valueB);
    } else if (column === 'dob') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    } else {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Render Table
function renderTable() {
  if (nurses.length === 0) {
    nursesTableBody.innerHTML = '';
    emptyState.style.display = 'block';
    document.querySelector('.table-wrapper').style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  document.querySelector('.table-wrapper').style.display = 'block';
  
  nursesTableBody.innerHTML = nurses.map(nurse => `
    <tr data-id="${nurse.id}">
      <td><span class="nurse-name">${escapeHtml(nurse.name)}</span></td>
      <td><span class="license-badge">${escapeHtml(nurse.license_number)}</span></td>
      <td>${formatDate(nurse.dob)}</td>
      <td><span class="age-badge">${nurse.age}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" onclick="editNurse(${nurse.id})" title="Edit">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button class="btn-icon delete" onclick="confirmDelete(${nurse.id})" title="Delete">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Update Stats
function updateStats() {
  totalNursesEl.textContent = nurses.length;
  
  if (nurses.length > 0) {
    const avgAge = Math.round(nurses.reduce((sum, n) => sum + n.age, 0) / nurses.length);
    avgAgeEl.textContent = avgAge;
  } else {
    avgAgeEl.textContent = '0';
  }
}

// Open Modal
function openModal(nurse = null) {
  editingNurseId = nurse ? nurse.id : null;
  
  if (nurse) {
    modalTitle.textContent = 'Edit Nurse';
    submitBtn.querySelector('.btn-text').textContent = 'Update Nurse';
    
    document.getElementById('nurseId').value = nurse.id;
    document.getElementById('nurseName').value = nurse.name;
    document.getElementById('licenseNumber').value = nurse.license_number;
    document.getElementById('nurseDob').value = nurse.dob;
    document.getElementById('nurseAge').value = nurse.age;
  } else {
    modalTitle.textContent = 'Add New Nurse';
    submitBtn.querySelector('.btn-text').textContent = 'Add Nurse';
    nurseForm.reset();
  }
  
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Focus first input
  setTimeout(() => {
    document.getElementById('nurseName').focus();
  }, 100);
}

// Close Modal
function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  nurseForm.reset();
  editingNurseId = null;
}

// Edit Nurse
function editNurse(id) {
  const nurse = nurses.find(n => n.id === id);
  if (nurse) {
    openModal(nurse);
  }
}

// Delete confirmation
let nurseToDelete = null;

function confirmDelete(id) {
  nurseToDelete = id;
  deleteModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  document.getElementById('confirmDeleteBtn').onclick = () => deleteNurse(id);
}

function closeDeleteModal() {
  deleteModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  nurseToDelete = null;
}

// Delete Nurse using Promise
function deleteNurse(id) {
  const deletePromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        resolve(result);
      } else {
        reject(new Error(result.error));
      }
    } catch (error) {
      reject(error);
    }
  });
  
  deletePromise
    .then(() => {
      // Remove from local state
      nurses = nurses.filter(n => n.id !== id);
      updateStats();
      renderTable();
      closeDeleteModal();
      showToast('Nurse deleted successfully', 'success');
    })
    .catch(error => {
      console.error('Error deleting nurse:', error);
      showToast('Failed to delete nurse. Please try again.', 'error');
      closeDeleteModal();
    });
}

// Handle Form Submit using async/await
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('nurseName').value.trim(),
    license_number: document.getElementById('licenseNumber').value.trim(),
    dob: document.getElementById('nurseDob').value,
    age: parseInt(document.getElementById('nurseAge').value)
  };
  
  // Validation
  if (!formData.name || !formData.license_number || !formData.dob || !formData.age) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  setLoading(true);
  
  try {
    const url = editingNurseId ? `${API_URL}/${editingNurseId}` : API_URL;
    const method = editingNurseId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (editingNurseId) {
        // Update in local state
        const index = nurses.findIndex(n => n.id === editingNurseId);
        if (index !== -1) {
          nurses[index] = result.data;
        }
        showToast('Nurse updated successfully', 'success');
      } else {
        // Add to local state
        nurses.unshift(result.data);
        showToast('Nurse added successfully', 'success');
      }
      
      updateStats();
      renderTable();
      closeModal();
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error saving nurse:', error);
    showToast(error.message || 'Failed to save nurse. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
}

// Download CSV
function downloadCSV() {
  if (nurses.length === 0) {
    showToast('No data to download', 'error');
    return;
  }
  
  // Create CSV content
  const headers = ['Name', 'License Number', 'Date of Birth', 'Age'];
  const rows = nurses.map(nurse => [
    `"${nurse.name}"`,
    `"${nurse.license_number}"`,
    `"${formatDate(nurse.dob)}"`,
    nurse.age
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create download using Promise
  const downloadPromise = new Promise((resolve) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `nurses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    resolve();
  });
  
  downloadPromise.then(() => {
    showToast('CSV downloaded successfully', 'success');
  });
}

// Show/Hide Loading
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

// Set button loading state
function setLoading(loading) {
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  
  if (loading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    submitBtn.disabled = true;
  } else {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    submitBtn.disabled = false;
  }
}

// Show Toast
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Utility Functions
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.editNurse = editNurse;
window.confirmDelete = confirmDelete;
window.openModal = openModal;

