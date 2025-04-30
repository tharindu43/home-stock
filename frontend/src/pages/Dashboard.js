import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBasket, FaBoxes, FaWallet, FaExclamationTriangle } from 'react-icons/fa';
import { groceryAPI, inventoryAPI, budgetAPI } from '../utils/api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    groceries: { totalCount: 0, expiringCount: 0 },
    inventory: { totalCount: 0, totalValue: 0 },
    budget: { income: 0, expense: 0, balance: 0 },
  });
  const [expiringGroceries, setExpiringGroceries] = useState([]);
  const [groceryCategoryData, setGroceryCategoryData] = useState({ labels: [], data: [] });
  const [budgetData, setBudgetData] = useState({ labels: [], income: [], expense: [] });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch grocery stats and expiring groceries
        const groceryStatsRes = await groceryAPI.getGroceryStats();
        const expiringGroceriesRes = await groceryAPI.getExpiringGroceries();
        
        // Fetch inventory stats
        const inventoryStatsRes = await inventoryAPI.getInventoryStats();
        
        // Fetch budget stats
        const budgetStatsRes = await budgetAPI.getBudgetStats();
        
        console.log('Grocery Stats:', groceryStatsRes);
        console.log('Inventory Stats:', inventoryStatsRes);
        console.log('Budget Stats:', budgetStatsRes);
        
        // Set stats data
        setStats({
          groceries: {
            totalCount: groceryStatsRes.totalCount || 0,
            expiringCount: groceryStatsRes.expiringCount || 0,
          },
          inventory: {
            totalCount: inventoryStatsRes.totalCount || 0,
            totalValue: inventoryStatsRes.valueStats?.totalValue || 0,
          },
          budget: {
            income: budgetStatsRes.income?.total || 0,
            expense: budgetStatsRes.expense?.total || 0,
            balance: budgetStatsRes.balance || 0,
          },
        });
        
        // Set expiring groceries
        setExpiringGroceries(expiringGroceriesRes || []);
        
        // Prepare grocery category chart data
        const categoryStats = groceryStatsRes.categoryStats || [];
        setGroceryCategoryData({
          labels: categoryStats.map(cat => cat._id),
          data: categoryStats.map(cat => cat.count),
        });
        
        // Prepare budget chart data
        const monthlySummary = budgetStatsRes.monthlySummary || [];
        const months = [];
        const incomeData = [];
        const expenseData = [];
        
        // Group by month and year
        const monthlyData = {};
        monthlySummary.forEach(item => {
          const monthYear = `${item._id.year}-${item._id.month}`;
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { income: 0, expense: 0 };
          }
          
          if (item._id.type === 'income') {
            monthlyData[monthYear].income = item.total;
          } else {
            monthlyData[monthYear].expense = item.total;
          }
        });
        
        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyData).sort();
        
        // Format month names and prepare data arrays
        sortedMonths.forEach(monthYear => {
          const [year, month] = monthYear.split('-');
          const date = new Date(year, month - 1);
          months.push(date.toLocaleString('default', { month: 'short' }) + ' ' + year);
          incomeData.push(monthlyData[monthYear].income);
          expenseData.push(monthlyData[monthYear].expense);
        });
        
        setBudgetData({
          labels: months,
          income: incomeData,
          expense: expenseData,
        });
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Chart configurations
  const groceryCategoryChartData = {
    labels: groceryCategoryData.labels,
    datasets: [
      {
        label: 'Items by Category',
        data: groceryCategoryData.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const budgetChartData = {
    labels: budgetData.labels,
    datasets: [
      {
        label: 'Income',
        data: budgetData.income,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: budgetData.expense,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="mb-4">Dashboard</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <h5 className="card-title">
                <FaShoppingBasket className="me-2" />
                Groceries
              </h5>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="card-text mb-1">Total Items</p>
                  <h3>{stats.groceries.totalCount}</h3>
                </div>
                <div>
                  <p className="card-text mb-1 text-warning">Expiring Soon</p>
                  <h3 className="text-warning">{stats.groceries.expiringCount}</h3>
                </div>
              </div>
              <Link to="/groceries" className="btn btn-sm btn-outline-primary mt-3">View All</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card h-100 border-success">
            <div className="card-body">
              <h5 className="card-title">
                <FaBoxes className="me-2" />
                Inventory
              </h5>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="card-text mb-1">Total Items</p>
                  <h3>{stats.inventory.totalCount}</h3>
                </div>
                <div>
                  <p className="card-text mb-1">Total Value</p>
                  <h3>${stats.inventory.totalValue.toFixed(2)}</h3>
                </div>
              </div>
              <Link to="/inventory" className="btn btn-sm btn-outline-success mt-3">View All</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card h-100 border-info">
            <div className="card-body">
              <h5 className="card-title">
                <FaWallet className="me-2" />
                Budget
              </h5>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="card-text mb-1 text-success">Income</p>
                  <h3 className="text-success">${stats.budget.income.toFixed(2)}</h3>
                </div>
                <div>
                  <p className="card-text mb-1 text-danger">Expenses</p>
                  <h3 className="text-danger">${stats.budget.expense.toFixed(2)}</h3>
                </div>
              </div>
              <div className="mt-2">
                <p className="card-text mb-1">Balance</p>
                <h3 className={stats.budget.balance >= 0 ? 'text-success' : 'text-danger'}>
                  ${stats.budget.balance.toFixed(2)}
                </h3>
              </div>
              <Link to="/budget" className="btn btn-sm btn-outline-info mt-3">View All</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Grocery Categories</h5>
              <div className="chart-container" style={{ height: '300px' }}>
                {groceryCategoryData.labels.length > 0 ? (
                  <Pie data={groceryCategoryChartData} options={{ maintainAspectRatio: false }} />
                ) : (
                  <div className="text-center text-muted my-5">No grocery data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Income vs Expenses</h5>
              <div className="chart-container" style={{ height: '300px' }}>
                {budgetData.labels.length > 0 ? (
                  <Bar data={budgetChartData} options={{ maintainAspectRatio: false }} />
                ) : (
                  <div className="text-center text-muted my-5">No budget data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expiring Groceries */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <FaExclamationTriangle className="me-2 text-warning" />
                Expiring Groceries
              </h5>
              
              {expiringGroceries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Expiry Date</th>
                        <th>Days Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringGroceries.map(item => {
                        const expiryDate = new Date(item.expiryDate);
                        const today = new Date();
                        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <tr key={item._id}>
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.quantity} {item.unit}</td>
                            <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                            <td className={daysLeft <= 3 ? 'text-danger' : 'text-warning'}>
                              {daysLeft} days
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted my-3">No groceries expiring soon</div>
              )}
              
              <Link to="/groceries/add" className="btn btn-primary mt-3">Add Grocery Item</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
