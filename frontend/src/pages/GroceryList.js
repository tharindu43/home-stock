import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { getGroceries, deleteGrocery } from '../utils/api';

const GroceryList = () => {
  const [groceries, setGroceries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchGroceries();
  }, []);

  const fetchGroceries = async () => {
    try {
      setLoading(true);
      const data = await getGroceries();
      setGroceries(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch groceries. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grocery item?')) {
      try {
        await deleteGrocery(id);
        setGroceries(groceries.filter(grocery => grocery._id !== id));
      } catch (err) {
        setError('Failed to delete grocery. Please try again.');
        console.error(err);
      }
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredGroceries = groceries.filter(grocery => 
    grocery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grocery.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedGroceries = [...filteredGroceries].sort((a, b) => {
    if (sortBy === 'expiryDate') {
      return sortOrder === 'asc' 
        ? new Date(a.expiryDate) - new Date(b.expiryDate)
        : new Date(b.expiryDate) - new Date(a.expiryDate);
    }
    
    if (sortBy === 'quantity') {
      return sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
    }
    
    const aValue = a[sortBy]?.toLowerCase() || '';
    const bValue = b[sortBy]?.toLowerCase() || '';
    
    return sortOrder === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring-soon';
    return 'valid';
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
    <div className="grocery-list-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Grocery List</h2>
        <Link to="/groceries/add" className="btn btn-primary">
          <FaPlus className="me-2" /> Add Grocery
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search groceries by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {sortedGroceries.length === 0 ? (
        <div className="alert alert-info">No groceries found. Add some groceries to get started!</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                  Quantity {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('expiryDate')} style={{ cursor: 'pointer' }}>
                  Expiry Date {sortBy === 'expiryDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroceries.map((grocery) => (
                <tr key={grocery._id}>
                  <td>{grocery.name}</td>
                  <td>{grocery.category}</td>
                  <td>{grocery.quantity} {grocery.unit}</td>
                  <td className={`expiry-${getExpiryStatus(grocery.expiryDate)}`}>
                    {formatDate(grocery.expiryDate)}
                  </td>
                  <td>

                    
                    <div className="btn-group">
                      <Link to={`/groceries/edit/${grocery._id}`} className="btn btn-sm btn-outline-primary">
                        <FaEdit />
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(grocery._id)}
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



export default GroceryList;
