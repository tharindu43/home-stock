import React, { useState, useEffect } from 'react';
import { FaFileDownload, FaFileAlt, FaBoxes, FaShoppingBasket, FaWallet, FaExclamationTriangle, FaChartBar, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { reportAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Report.css';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reportUrl, setReportUrl] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Form states
  const [expiryDays, setExpiryDays] = useState(7);
  const [budgetMonth, setBudgetMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [budgetYear, setBudgetYear] = useState(new Date().getFullYear());
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear());
  
  const handleGenerateReport = async (reportType) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setReportUrl(null);
      
      let response;
      
      switch (reportType) {
        case 'grocery':
          response = await reportAPI.generateGroceryReport('pdf');
          break;
        case 'inventory':
          response = await reportAPI.generateInventoryReport('pdf');
          break;
        case 'budget':
          response = await reportAPI.generateBudgetReport('pdf');
          break;
        case 'expiring-groceries':
          response = await reportAPI.generateExpiringGroceriesReport(expiryDays, 'pdf');
          break;
        case 'inventory-value':
          response = await reportAPI.generateInventoryValueReport('pdf');
          break;
        case 'monthly-budget':
          response = await reportAPI.generateMonthlyBudgetReport(budgetMonth, budgetYear, 'pdf');
          break;
        case 'annual-budget':
          response = await reportAPI.generateAnnualBudgetReport(annualYear, 'pdf');
          break;
        case 'user':
          response = await reportAPI.generateUserReport('pdf');
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      if (response.success) {
        setSuccess(`Report generated successfully!`);
        setReportUrl(response.reportUrl);
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      
      // Check if this is an authentication error
      if (err.response && err.response.status === 401) {
        setError('Authentication error. Please log out and log in again to refresh your session.');
      } else {
        setError('An error occurred while generating the report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (reportUrl) {
      try {
        // Create a direct link to the file
        const filename = reportUrl.includes('/') 
          ? reportUrl.split('/').pop() 
          : reportUrl;
        
        // Get the authentication token
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          return;
        }
        
        // Create an XMLHttpRequest to handle the download with authentication
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `http://localhost:5001/api/reports/download/${filename}`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.responseType = 'blob';
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            // Create a blob URL from the response
            const blob = new Blob([xhr.response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link to download the file
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
          } else {
            console.error('Error downloading file:', xhr.statusText);
            setError(`Failed to download the report: ${xhr.statusText}`);
          }
        };
        
        xhr.onerror = function() {
          console.error('Network error during download');
          setError('Network error during download. Please try again.');
        };
        
        xhr.send();
        
      } catch (error) {
        console.error('Error downloading report:', error);
        setError('Failed to download the report. Please try again.');
      }
    }
  };
  
  // Get current month and year for default values
  const currentDate = new Date();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate year options (5 years back, 5 years forward)
  const currentYear = currentDate.getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }
  
  return (
    <div className="report-container">
      <img src="https://via.placeholder.com/120x120.png?text=Homestock" alt="Homestock Logo" className="report-logo" />
      <h1 className="report-title">Reports</h1>
      
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Generating report...</p>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger mb-4" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-4" role="alert" aria-live="polite">
          {success}
          {reportUrl && (
            <div className="mt-2">
              <button className="btn btn-outline-success btn-sm" onClick={handleDownload}>
                <FaFileDownload className="me-2" />
                Download Report
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="row">
        {/* Basic Reports */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaFileAlt className="me-2" />
                Basic Reports
              </h5>
            </div>
            <div className="card-body">
              <p>Generate standard reports for your data.</p>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => handleGenerateReport('grocery')}
                  disabled={loading}
                >
                  <FaShoppingBasket className="me-2" />
                  Grocery Report
                </button>
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => handleGenerateReport('inventory')}
                  disabled={loading}
                >
                  <FaBoxes className="me-2" />
                  Inventory Report
                </button>
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => handleGenerateReport('budget')}
                  disabled={loading}
                >
                  <FaWallet className="me-2" />
                  Budget Report
                </button>
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => handleGenerateReport('user')}
                  disabled={loading}
                >
                  <FaUsers className="me-2" />
                  User Report
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Specialized Reports */}
        <div className="col-md-8">
          <div className="row">
            {/* Expiring Groceries Report */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">
                    <FaExclamationTriangle className="me-2" />
                    Expiring Groceries Report
                  </h5>
                </div>
                <div className="card-body">
                  <p>Generate a report of groceries expiring soon.</p>
                  <div className="mb-3">
                    <label htmlFor="expiryDays" className="form-label">Days until expiry</label>
                    <input 
                      type="number" 
                      className="form-control"
                      id="expiryDays"
                      min="1" 
                      max="30" 
                      value={expiryDays} 
                      onChange={(e) => setExpiryDays(e.target.value)}
                    />
                    <div className="form-text text-muted">
                      Show items expiring within this many days
                    </div>
                  </div>
                  <div className="d-grid">
                    <button 
                      className="btn btn-warning" 
                      onClick={() => handleGenerateReport('expiring-groceries')}
                      disabled={loading}
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Inventory Value Report */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <FaChartBar className="me-2" />
                    Inventory Value Report
                  </h5>
                </div>
                <div className="card-body">
                  <p>Generate a detailed report of your inventory value.</p>
                  <div className="d-grid">
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleGenerateReport('inventory-value')}
                      disabled={loading}
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monthly Budget Report */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <FaCalendarAlt className="me-2" />
                    Monthly Budget Report
                  </h5>
                </div>
                <div className="card-body">
                  <p>Generate a detailed monthly budget report.</p>
                  <div className="mb-3">
                    <label htmlFor="budgetMonth" className="form-label">Month</label>
                    <select 
                      className="form-select"
                      id="budgetMonth"
                      value={budgetMonth} 
                      onChange={(e) => setBudgetMonth(e.target.value)}
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="budgetYear" className="form-label">Year</label>
                    <select 
                      className="form-select"
                      id="budgetYear"
                      value={budgetYear} 
                      onChange={(e) => setBudgetYear(e.target.value)}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="d-grid">
                    <button 
                      className="btn btn-info" 
                      onClick={() => handleGenerateReport('monthly-budget')}
                      disabled={loading}
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Annual Budget Report */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-secondary text-white">
                  <h5 className="mb-0">
                    <FaChartBar className="me-2" />
                    Annual Budget Report
                  </h5>
                </div>
                <div className="card-body">
                  <p>Generate a yearly budget summary report.</p>
                  <div className="mb-3">
                    <label htmlFor="annualYear" className="form-label">Year</label>
                    <select 
                      className="form-select"
                      id="annualYear"
                      value={annualYear} 
                      onChange={(e) => setAnnualYear(e.target.value)}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="d-grid">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleGenerateReport('annual-budget')}
                      disabled={loading}
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
