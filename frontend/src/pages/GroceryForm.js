import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { getGrocery, createGrocery, updateGrocery } from '../utils/api';
import { validateGroceryItem } from '../utils/validation';

const GroceryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    unit: 'pcs',
    purchaseDate: '',
    expiryDate: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchGroceryItem();
    } else {
      // Set default dates for new items
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      setFormData({
        ...formData,
        purchaseDate: today,
        expiryDate: nextMonth.toISOString().split('T')[0]
      });
    }
  }, [id]);

  const fetchGroceryItem = async () => {
    try {
      setLoading(true);
      const data = await getGrocery(id);
      
      // Format dates for form inputs
      const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '';
      const expiryDate = data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : '';
      
      setFormData({
        ...data,
        purchaseDate,
        expiryDate
      });
    } catch (err) {
      setSubmitError('Failed to fetch grocery item. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateGroceryItem(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setLoading(true);
      setSubmitError(null);
      
      if (isEditMode) {
        await updateGrocery(id, formData);
      } else {
        await createGrocery(formData);
      }
      
      navigate('/groceries');
    } catch (err) {
      setSubmitError('Failed to save grocery item. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grocery-form-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEditMode ? 'Edit Grocery Item' : 'Add New Grocery Item'}</h2>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/groceries')}
        >
          <FaArrowLeft className="me-2" /> Back to List
        </button>
      </div>

      {submitError && <div className="alert alert-danger">{submitError}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="name" className="form-label">Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter grocery name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="category" className="form-label">Category *</label>
                <select
                  className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Meat">Meat</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Canned Goods">Canned Goods</option>
                  <option value="Frozen Foods">Frozen Foods</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="quantity" className="form-label">Quantity *</label>
                <input
                  type="number"
                  className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                />
                {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="unit" className="form-label">Unit *</label>
                <select
                  className={`form-select ${errors.unit ? 'is-invalid' : ''}`}
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="l">Liters (l)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="bottle">Bottle</option>
                  <option value="can">Can</option>
                </select>
                {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="purchaseDate" className="form-label">Purchase Date *</label>
                <input
                  type="date"
                  className={`form-control ${errors.purchaseDate ? 'is-invalid' : ''}`}
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
                {errors.purchaseDate && <div className="invalid-feedback">{errors.purchaseDate}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="expiryDate" className="form-label">Expiry Date *</label>
                <input
                  type="date"
                  className={`form-control ${errors.expiryDate ? 'is-invalid' : ''}`}
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
                {errors.expiryDate && <div className="invalid-feedback">{errors.expiryDate}</div>}
              </div>
            </div>
            

            <div className="mb-3">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                className="form-control"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Optional notes about this grocery item"
              ></textarea>
            </div>

            <div className="d-grid">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> Save Grocery Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroceryForm;
