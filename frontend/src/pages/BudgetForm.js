import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { getBudgetEntry, createBudgetEntry, updateBudgetEntry } from '../utils/api';
import { validateBudgetEntry } from '../utils/validation';

const BudgetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    description: '',
    amount: '',
    date: '',
    notes: ''
  });
  

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Define category options based on type
  const categoryOptions = {
    income: [
      'Salary',
      'Freelance',
      'Investments',
      'Gifts',
      'Refunds',
      'Other Income'
      
    ],
    expense: [
      'Groceries',
      'Housing',
      'Utilities',
      'Transportation',
      'Healthcare',
      'Insurance',
      'Dining Out',
      'Entertainment',
      'Shopping',
      'Personal Care',
      'Education',
      'Debt Payments',
      'Savings',
      'Gifts & Donations',
      'Other Expenses'
    ]
  };

  useEffect(() => {
    if (isEditMode) {
      fetchBudgetEntry();
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        ...formData,
        date: today
      });
    }
  }, [id]);

  const fetchBudgetEntry = async () => {
    try {
      setLoading(true);
      const data = await getBudgetEntry(id);
      
      // Format date for form input
      const date = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
      
      setFormData({
        ...data,
        date
      });
    } catch (err) {
      setSubmitError('Failed to fetch budget entry. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type' && value !== formData.type) {
      // Reset category when type changes
      setFormData({ 
        ...formData, 
        [name]: value,
        category: '' 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateBudgetEntry(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setLoading(true);
      setSubmitError(null);
      
      if (isEditMode) {
        await updateBudgetEntry(id, formData);
      } else {
        await createBudgetEntry(formData);
      }
      
      navigate('/budget');
    } catch (err) {
      setSubmitError('Failed to save budget entry. Please try again.');
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
    <div className="budget-form-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEditMode ? 'Edit Budget Entry' : 'Add New Budget Entry'}</h2>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/budget')}
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
                <label htmlFor="type" className="form-label">Type *</label>
                <div className="d-flex">
                  <div className="form-check me-4">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="typeExpense"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="typeExpense">
                      Expense
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="typeIncome"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="typeIncome">
                      Income
                    </label>
                  </div>
                </div>
                {errors.type && <div className="text-danger small mt-1">{errors.type}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="date" className="form-label">Date *</label>
                <input
                  type="date"
                  className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
                {errors.date && <div className="invalid-feedback">{errors.date}</div>}
              </div>
            </div>

            <div className="row">
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
                  {categoryOptions[formData.type].map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="amount" className="form-label">Amount (LKR) *</label>
                <input
                  type="number"
                  className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                />
                {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description *</label>
              <input
                type="text"
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the transaction"
              />
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
                placeholder="Optional additional notes about this transaction"
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
                    <FaSave className="me-2" /> Save Budget Entry
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

export default BudgetForm;
