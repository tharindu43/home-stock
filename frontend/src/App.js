import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import GroceryList from './pages/GroceryList';
import GroceryForm from './pages/GroceryForm';
import InventoryList from './pages/InventoryList';
import InventoryForm from './pages/InventoryForm';
import BudgetList from './pages/BudgetList';
import BudgetForm from './pages/BudgetForm';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const App = () => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useTheme();
  const drawerWidth = 240;
  const collapsedWidth = theme.spacing(8);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {user ? (
        <>
          <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 0,
              transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              marginLeft: { xs: 0, md: sidebarCollapsed ? collapsedWidth : `${drawerWidth}px` },
            }}
          >
            <Navbar toggleSidebar={toggleSidebar} />
            <Box sx={{ p: 2 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/groceries" element={<GroceryList />} />
                <Route path="/groceries/add" element={<GroceryForm />} />
                <Route path="/groceries/edit/:id" element={<GroceryForm />} />
                <Route path="/inventory" element={<InventoryList />} />
                <Route path="/inventory/add" element={<InventoryForm />} />
                <Route path="/inventory/edit/:id" element={<InventoryForm />} />
                <Route path="/budget" element={<BudgetList />} />
                <Route path="/budget/add" element={<BudgetForm />} />
                <Route path="/budget/edit/:id" element={<BudgetForm />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<UserList />} />
                <Route path="/users/add" element={<UserForm />} />
                <Route path="/users/edit/:id" element={<UserForm />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Box>
          </Box>
        </>
      ) : (
        <div className="auth-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}
    </Box>
  );
};

export default App;
