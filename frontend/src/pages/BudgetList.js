import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import { getBudgetEntries, deleteBudgetEntry } from '../utils/api';

const BudgetList = () => {
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  useEffect(() => {
    fetchBudgetEntries();
  }, []);

  const fetchBudgetEntries = async () => {
    try {
      setLoading(true);
      const data = await getBudgetEntries();
      setBudgetEntries(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch budget entries. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget entry?')) {
      try {
        await deleteBudgetEntry(id);
        setBudgetEntries(budgetEntries.filter(entry => entry._id !== id));
      } catch (err) {
        setError('Failed to delete budget entry. Please try again.');
        console.error(err);
      }
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get unique years and months for filtering
  const years = [...new Set(budgetEntries.map(entry => new Date(entry.date).getFullYear()))].sort((a, b) => b - a);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Filter entries
  const filteredEntries = budgetEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const entryMonth = entryDate.getMonth() + 1;
    const entryYear = entryDate.getFullYear();
    
    // Filter by type
    if (filterType !== 'all' && entry.type !== filterType) {
      return false;
    }
    
    // Filter by month
    if (filterMonth !== 'all' && entryMonth !== parseInt(filterMonth)) {
      return false;
    }
    
    // Filter by year
    if (filterYear !== 'all' && entryYear !== parseInt(filterYear)) {
      return false;
    }
    
    // Filter by search term
    return (
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    
    if (sortBy === 'amount') {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    
    const aValue = a[sortBy]?.toLowerCase() || '';
    const bValue = b[sortBy]?.toLowerCase() || '';
    
    return sortOrder === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Calculate totals
  const totalIncome = filteredEntries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalExpense = filteredEntries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const balance = totalIncome - totalExpense;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-list-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Budget Entries</h2>
        <Link to="/budget/add" className="btn btn-primary">
          <FaPlus className="me-2" /> Add Entry
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-4 mb-3 mb-md-0">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Total Income</h5>
              <h3 className="card-text">{formatCurrency(totalIncome)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3 mb-md-0">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h5 className="card-title">Total Expenses</h5>
              <h3 className="card-text">{formatCurrency(totalExpense)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card ${balance >= 0 ? 'bg-info' : 'bg-warning'} text-white`}>
            <div className="card-body">
              <h5 className="card-title">Balance</h5>
              <h3 className="card-text">{formatCurrency(balance)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by description or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex">
                <div className="input-group me-2">
                  <span className="input-group-text">
                    <FaFilter />
                  </span>
                  <select
                    className="form-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <select
                  className="form-select me-2"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="all">All Months</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="all">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="alert alert-info">No budget entries found. Add some entries to get started!</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                  Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                  Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => (
                <tr key={entry._id} className={entry.type === 'income' ? 'table-success' : 'table-danger'}>
                  <td>{formatDate(entry.date)}</td>
                  <td className="text-capitalize">{entry.type}</td>
                  <td>{entry.category}</td>
                  <td>{entry.description}</td>
                  <td>{formatCurrency(entry.amount)}</td>
                  <td>
                    <div className="btn-group">
                      <Link to={`/budget/edit/${entry._id}`} className="btn btn-sm btn-outline-primary">
                        <FaEdit />
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(entry._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BudgetList;
