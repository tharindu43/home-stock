import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { getInventoryItem, createInventoryItem, updateInventoryItem } from '../utils/api';
import { validateInventoryItem } from '../utils/validation';

const InventoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    description: '',
    value: '',
    purchaseDate: '',
    warranty: '',
    serialNumber: '',
    condition: 'Good',
    notes: ''
  });


  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchInventoryItem();
    } else {
      // Set default dates for new items
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        ...formData,
        purchaseDate: today
      });
    }
  }, [id]);


  
  const fetchInventoryItem = async () => {
    try {
      setLoading(true);
      const data = await getInventoryItem(id);
      
      // Format dates for form inputs
      const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '';
      const warranty = data.warranty ? new Date(data.warranty).toISOString().split('T')[0] : '';
      
      setFormData({
        ...data,
        purchaseDate,
        warranty
      });
    } catch (err) {
      setSubmitError('Failed to fetch inventory item. Please try again.');
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
    const validationErrors = validateInventoryItem(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setLoading(true);
      setSubmitError(null);
      
      if (isEditMode) {
        await updateInventoryItem(id, formData);
      } else {
        await createInventoryItem(formData);
      }
      
      navigate('/inventory');
    } catch (err) {
      setSubmitError('Failed to save inventory item. Please try again.');
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
    <div className="inventory-form-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/inventory')}
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
                  placeholder="Enter item name"
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
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Books">Books</option>
                  <option value="Tools">Tools</option>
                  <option value="Sports">Sports & Recreation</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Art">Art & Collectibles</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="location" className="form-label">Location *</label>
                <input
                  type="text"
                  className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Where is this item stored?"
                />
                {errors.location && <div className="invalid-feedback">{errors.location}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="value" className="form-label">Value ($) *</label>
                <input
                  type="number"
                  className={`form-control ${errors.value ? 'is-invalid' : ''}`}
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="Item value in USD"
                />
                {errors.value && <div className="invalid-feedback">{errors.value}</div>}
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
                <label htmlFor="warranty" className="form-label">Warranty Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="warranty"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="serialNumber" className="form-label">Serial Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="Optional serial number"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="condition" className="form-label">Condition *</label>
                <select
                  className={`form-select ${errors.condition ? 'is-invalid' : ''}`}
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
                {errors.condition && <div className="invalid-feedback">{errors.condition}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                placeholder="Brief description of the item"
              ></textarea>
              {errors.description && <div className="invalid-feedback">{errors.description}</div>}
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
                placeholder="Optional additional notes about this item"
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
                    <FaSave className="me-2" /> Save Inventory Item
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

export default InventoryForm;
