import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaUser } from 'react-icons/fa';
import { getUser, createUser, updateUser } from '../utils/api';
import { validateUser } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isEditMode = !!id;
  const isCurrentUser = isEditMode && currentUser && id === currentUser._id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
   
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await getUser(id);
      
      // Don't include password in edit form
      setFormData({
        name: data.name || '',
        email: data.email || '',
        password: '',
        confirmPassword: '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (err) {
      setSubmitError('Failed to fetch user. Please try again.');
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
    
    // Different validation for create vs update
    const validationErrors = validateUser(formData, isEditMode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setLoading(true);
      setSubmitError(null);
      
      if (isEditMode) {
        // Only include password if it was provided
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
          delete updateData.confirmPassword;
        }
        
        await updateUser(id, updateData);
        
        // If user updated their own profile, update auth context
        if (isCurrentUser) {
          // The backend will handle not returning the password
          // We'll let the auth context handle refreshing the user data
        }
      } else {
        await createUser(formData);
      }
      
      navigate('/users');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save user. Please try again.');
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
    <div className="user-form-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          {isEditMode 
            ? (isCurrentUser ? 'Edit Your Profile' : 'Edit User') 
            : 'Add New User'}
        </h2>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/users')}
        >
          <FaArrowLeft className="me-2" /> Back to Users
        </button>
      </div>

      {submitError && <div className="alert alert-danger">{submitError}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-4 text-center">
              <div className="user-avatar mx-auto mb-3">
                <FaUser size={48} />
              </div>
              {isCurrentUser && (
                <div className="badge bg-info">This is your account</div>
              )}
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="name" className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">Email Address *</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="password" className="form-label">
                  {isEditMode ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  {isEditMode ? 'Confirm New Password' : 'Confirm Password *'}
                </label>
                <input
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="address" className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address (optional)"
                />
              </div>
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
                    <FaSave className="me-2" /> {isEditMode ? 'Update User' : 'Create User'}
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

export default UserForm;
