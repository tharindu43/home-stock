import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import InventoryIcon from '@mui/icons-material/Inventory2';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import { useAuth } from '../../context/AuthContext';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 240;

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const collapsedWidth = theme.spacing(8);

  const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/' },
    { text: 'Groceries', icon: <ShoppingBasketIcon />, path: '/groceries' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Budget', icon: <WalletIcon />, path: '/budget' },
    { text: 'Reports', icon: <DescriptionIcon />, path: '/reports' },
    { text: 'User Management', icon: <PeopleIcon />, path: '/users' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? !collapsed : true}
      onClose={isMobile ? toggleSidebar : undefined}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? drawerWidth : (collapsed ? collapsedWidth : drawerWidth),
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? drawerWidth : (collapsed ? collapsedWidth : drawerWidth),
          boxSizing: 'border-box',
          background: '#212B36', // dark sidebar
          color: '#fff',
          borderRight: '2px solid #e0e0e0',
          boxShadow: '2px 0 8px 0 rgba(0,0,0,0.04)',
        },
      }}
    >
      <Toolbar disableGutters sx={{ justifyContent: 'center', alignItems: 'center', minHeight: 56, px: 1, py: 0 }}>
        {/* Logo or fallback icon */}
        <Avatar
          src="/logo192.png"
          alt="Homestock Logo"
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', mr: 1 }}
        >
          <HomeIcon />
        </Avatar>
        <Typography variant="h6" noWrap component="div" sx={{ color: '#fff', fontWeight: 700, ml: 1 }}>
          Homestock
        </Typography>
      </Toolbar>
      <Divider sx={{ my: 0 }} />
      <List disablePadding dense sx={{ p: 0, m: 0 }}>
        {menuItems.map(item => {
          const selected = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={selected}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  ...(selected && {
                    bgcolor: theme.palette.action.selected,
                    color: theme.palette.primary.main,
                  }),
                }}
              >
                <ListItemIcon sx={{ color: selected ? theme.palette.primary.main : 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
