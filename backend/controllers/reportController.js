const Grocery = require('../models/Grocery');
const Inventory = require('../models/Inventory');
const Budget = require('../models/Budget');
const User = require('../models/User');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR'
  }).format(amount);
};

// @desc    Generate grocery report
// @route   GET /api/reports/groceries
// @access  Private
const generateGroceryReport = async (req, res) => {
  try {
    const { format } = req.query;
    const groceries = await Grocery.find({ user: req.user._id }).sort({ expiryDate: 1 });
    
    if (format === 'pdf') {
      // HTML-to-PDF via Puppeteer
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const filename = `grocery_report_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      // Build HTML with inline CSS
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Grocery Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>Grocery Report</h1><p>Generated on: ${formatDate(new Date())}</p></header>
        <table><thead><tr><th>#</th><th>Name</th><th>Category</th><th>Qty</th><th>Unit</th><th>Purchase</th><th>Expiry</th></tr></thead><tbody>
        ${groceries.map((item,i)=>`<tr><td>${i+1}</td><td>${item.name}</td><td>${item.category}</td><td>${item.quantity}</td><td>${item.unit}</td><td>${formatDate(item.purchaseDate)}</td><td>${formatDate(item.expiryDate)}</td></tr>`).join('')}
        </tbody></table></body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({success:true,message:'PDF report generated successfully',reportUrl:`/api/reports/download/${filename}`});
    }
    // Return JSON data
    res.json({
      success: true,
      data: groceries,
      summary: {
        totalItems: groceries.length,
        categories: groceries.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {}),
        expiringThisWeek: groceries.filter(item => {
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return new Date(item.expiryDate) > today && new Date(item.expiryDate) <= nextWeek;
        }).length
      }
    });
  } catch (error) {
    console.error('Error in generateGroceryReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate inventory report
// @route   GET /api/reports/inventory
// @access  Private
const generateInventoryReport = async (req, res) => {
  try {
    const { format } = req.query;
    const inventory = await Inventory.find({ user: req.user._id }).sort({ category: 1 });
    
    if (format === 'pdf') {
      // HTML-to-PDF via Puppeteer
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const filename = `inventory_report_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inventory Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>Inventory Report</h1><p>Generated on: ${formatDate(new Date())}</p></header>
        <table><thead><tr><th>#</th><th>Name</th><th>Category</th><th>Location</th><th>Value</th><th>Purchase Date</th></tr></thead><tbody>
        ${inventory.map((item,i)=>`<tr><td>${i+1}</td><td>${item.name}</td><td>${item.category}</td><td>${item.location}</td><td>${formatCurrency(item.value)}</td><td>${formatDate(item.purchaseDate)}</td></tr>`).join('')}
        </tbody></table></body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({success:true,message:'PDF report generated successfully',reportUrl:`/api/reports/download/${filename}`});
    }
    // Return JSON data
    res.json({
      success: true,
      data: inventory,
      summary: {
        totalItems: inventory.length,
        totalValue: inventory.reduce((sum, item) => sum + item.value, 0),
        categories: inventory.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {}),
        locations: inventory.reduce((acc, item) => {
          acc[item.location] = (acc[item.location] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error in generateInventoryReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate budget report
// @route   GET /api/reports/budget
// @access  Private
const generateBudgetReport = async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = { user: req.user._id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.date.$lte = new Date(endDate);
      }
    }
    
    const budget = await Budget.find(dateFilter).sort({ date: -1 });
    
    if (format === 'pdf') {
      // HTML-to-PDF via Puppeteer
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const filename = `budget_report_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const totalIncome = budget.filter(item=>item.type==='income').reduce((sum,item)=>sum+item.amount,0);
      const totalExpenses = budget.filter(item=>item.type==='expense').reduce((sum,item)=>sum+item.amount,0);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Budget Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>Budget Report</h1><p>Generated on: ${formatDate(new Date())}</p>
        ${startDate&&endDate?`<p>Period: ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}</p>`:startDate?`<p>Period: From ${formatDate(new Date(startDate))}</p>`:endDate?`<p>Period: Until ${formatDate(new Date(endDate))}</p>`:''}</header>
        <table><thead><tr><th>#</th><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead><tbody>
        ${budget.map((item,i)=>{const sign=item.type==='income'?'+':'-';return `<tr><td>${i+1}</td><td>${formatDate(item.date)}</td><td>${item.description}</td><td>${item.category}</td><td>${item.type}</td><td>${sign}${formatCurrency(item.amount)}</td></tr>`;}).join('')}
        </tbody></table>
        <h2>Summary</h2><p>Total Income: ${formatCurrency(totalIncome)}</p><p>Total Expenses: ${formatCurrency(totalExpenses)}</p><p>Balance: ${formatCurrency(totalIncome-totalExpenses)}</p>
      </body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({success:true,message:'PDF report generated successfully',reportUrl:`/api/reports/download/${filename}`});
    }
    // Return JSON data
    const totalIncome = budget
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
      
    const totalExpenses = budget
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    
    res.json({
      success: true,
      data: budget,
      summary: {
        totalTransactions: budget.length,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        incomeByCategory: budget
          .filter(item => item.type === 'income')
          .reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
          }, {}),
        expensesByCategory: budget
          .filter(item => item.type === 'expense')
          .reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
          }, {})
      }
    });
  } catch (error) {
    console.error('Error in generateBudgetReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate expiring groceries report
// @route   GET /api/reports/expiring-groceries
// @access  Private
const generateExpiringGroceriesReport = async (req, res) => {
  try {
    const { format, days = 7 } = req.query;
    
    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + parseInt(days));
    endDate.setHours(23, 59, 59, 999);
    
    // Find expiring groceries
    const expiringGroceries = await Grocery.find({
      user: req.user._id,
      expiryDate: { $gte: today, $lte: endDate }
    }).sort({ expiryDate: 1 });
    
    if (format === 'pdf') {
      // HTML-to-PDF via Puppeteer
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const filename = `expiring_groceries_report_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Expiring Groceries Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>Expiring Groceries Report</h1><p>Generated on: ${formatDate(new Date())}</p></header>
        <table><thead><tr><th>#</th><th>Name</th><th>Expiry Date</th><th>Days Left</th></tr></thead><tbody>
        ${expiringGroceries.map((item,i)=>`<tr><td>${i+1}</td><td>${item.name}</td><td>${formatDate(item.expiryDate)}</td><td>${Math.ceil((new Date(item.expiryDate)-new Date())/(1000*60*60*24))}</td></tr>`).join('')}
        </tbody></table></body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({ success:true, message:'PDF report generated successfully', reportUrl:`/api/reports/download/${filename}` });
    }
    // Return JSON data
    res.json({
      success: true,
      data: expiringGroceries,
      summary: {
        totalItems: expiringGroceries.length,
        categories: expiringGroceries.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {}),
        timeline: expiringGroceries.reduce((acc, item) => {
          const expiryDate = new Date(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 0) {
            acc['Today'] = (acc['Today'] || 0) + 1;
          } else if (daysUntilExpiry <= 2) {
            acc['1-2 days'] = (acc['1-2 days'] || 0) + 1;
          } else if (daysUntilExpiry <= 5) {
            acc['3-5 days'] = (acc['3-5 days'] || 0) + 1;
          } else if (daysUntilExpiry <= 7) {
            acc['6-7 days'] = (acc['6-7 days'] || 0) + 1;
          } else {
            acc['Over a week'] = (acc['Over a week'] || 0) + 1;
          }
          
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error in generateExpiringGroceriesReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate inventory value report
// @route   GET /api/reports/inventory-value
// @access  Private
const generateInventoryValueReport = async (req, res) => {
  try {
    const { format } = req.query;
    const inventory = await Inventory.find({ user: req.user._id }).sort({ value: -1 });

    if (format === 'pdf') {
      // HTML-to-PDF via Puppeteer
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const filename = `inventory_value_report_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const totalValue = inventory.reduce((sum,item)=>sum+item.value,0);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inventory Value Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>Inventory Value Report</h1><p>Generated on: ${formatDate(new Date())}</p></header>
        <p><strong>Summary:</strong> Total Items: ${inventory.length}, Total Value: ${formatCurrency(totalValue)}</p>
        <table><thead><tr><th>#</th><th>Name</th><th>Value</th><th>Category</th><th>Location</th></tr></thead><tbody>
        ${inventory.map((item,i)=>`<tr><td>${i+1}</td><td>${item.name}</td><td>${formatCurrency(item.value)}</td><td>${item.category}</td><td>${item.location}</td></tr>`).join('')}
        </tbody></table></body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({ success:true, message:'PDF report generated successfully', reportUrl:`/api/reports/download/${filename}` });
    }

    const summary = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => sum + item.value, 0),
      averageValue: inventory.length > 0
        ? inventory.reduce((sum, item) => sum + item.value, 0) / inventory.length
        : 0,
      valueByCategory: inventory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.value;
        return acc;
      }, {}),
      valueDistribution: inventory.reduce((acc, item) => {
        if (item.value < 50) {
          acc['Under $50'] = (acc['Under $50'] || 0) + 1;
        } else if (item.value < 100) {
          acc['$50 - $100'] = (acc['$50 - $100'] || 0) + 1;
        } else if (item.value < 500) {
          acc['$100 - $500'] = (acc['$100 - $500'] || 0) + 1;
        } else if (item.value < 1000) {
          acc['$500 - $1000'] = (acc['$500 - $1000'] || 0) + 1;
        } else {
          acc['Over $1000'] = (acc['Over $1000'] || 0) + 1;
        }
        return acc;
      }, {})
    };

    return res.json({ success: true, data: inventory, summary });
  } catch (error) {
    console.error('Error in generateInventoryValueReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate monthly budget report
// @route   GET /api/reports/monthly-budget
// @access  Private
const generateMonthlyBudgetReport = async (req, res) => {
  try {
    const { format, month, year } = req.query;
    
    // Default to current month and year if not provided
    const currentDate = new Date();
    const reportMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const reportYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Calculate start and end dates for the month
    const startDate = new Date(reportYear, reportMonth, 1);
    const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);
    
    // Find budget entries for the month
    const budgetEntries = await Budget.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Split into income and expenses
    const incomeEntries = budgetEntries.filter(entry => entry.type === 'income');
    const expenseEntries = budgetEntries.filter(entry => entry.type === 'expense');
    
    // Calculate totals
    const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpense = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const balance = totalIncome - totalExpense;
    
    if (format === 'pdf') {
      // HTML-to-PDF via Puppeteer
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const monthName = startDate.toLocaleString('default', { month: 'long' });
      const filename = `monthly_budget_report_${monthName}_${reportYear}_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Budget Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>Monthly Budget Report - ${monthName} ${reportYear}</h1><p>Generated on: ${formatDate(new Date())}</p></header>
        <table><thead><tr><th>#</th><th>Date</th><th>Description</th><th>Type</th><th>Category</th><th>Amount</th></tr></thead><tbody>
        ${budgetEntries.map((item,i)=>`<tr><td>${i+1}</td><td>${formatDate(item.date)}</td><td>${item.description}</td><td>${item.type}</td><td>${item.category}</td><td>${formatCurrency(item.amount)}</td></tr>`).join('')}
        </tbody></table>
        <h2>Summary</h2><p>Total Income: ${formatCurrency(totalIncome)}</p><p>Total Expense: ${formatCurrency(totalExpense)}</p><p>Balance: ${formatCurrency(balance)}</p>
      </body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({ success:true, message:'PDF report generated successfully', reportUrl:`/api/reports/download/${filename}` });
    }
    // Return JSON data
    res.json({
      success: true,
      data: {
        month: reportMonth + 1,
        year: reportYear,
        incomeEntries,
        expenseEntries
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
        expensesByCategory: expenseEntries.reduce((acc, entry) => {
          acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error in generateMonthlyBudgetReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate annual budget summary report
// @route   GET /api/reports/annual-budget
// @access  Private
const generateAnnualBudgetReport = async (req, res) => {
  try {
    const { format, year } = req.query;
    
    // Default to current year if not provided
    const reportYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Calculate start and end dates for the year
    const startDate = new Date(reportYear, 0, 1);
    const endDate = new Date(reportYear, 11, 31, 23, 59, 59, 999);
    
    // Find budget entries for the year
    const budgetEntries = await Budget.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Group by month
    const monthlyData = Array(12).fill().map(() => ({
      income: 0,
      expense: 0,
      balance: 0
    }));
    
    budgetEntries.forEach(entry => {
      const entryMonth = new Date(entry.date).getMonth();
      if (entry.type === 'income') {
        monthlyData[entryMonth].income += entry.amount;
      } else {
        monthlyData[entryMonth].expense += entry.amount;
      }
    });
    
    // Calculate balances
    monthlyData.forEach(month => {
      month.balance = month.income - month.expense;
    });
    
    // Calculate yearly totals
    const yearlyTotals = {
      income: monthlyData.reduce((sum, month) => sum + month.income, 0),
      expense: monthlyData.reduce((sum, month) => sum + month.expense, 0),
      balance: monthlyData.reduce((sum, month) => sum + month.balance, 0)
    };
    
    // Group expenses by category for the year
    const expensesByCategory = {};
    budgetEntries.forEach(entry => {
      if (entry.type === 'expense') {
        if (!expensesByCategory[entry.category]) {
          expensesByCategory[entry.category] = 0;
        }
        expensesByCategory[entry.category] += entry.amount;
      }
    });
    
    if (format === 'pdf') {
      // HTML-to-PDF via Puppeteer
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const filename = `annual_budget_report_${reportYear}_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Budget Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>Annual Budget Report - ${reportYear}</h1><p>Generated on: ${formatDate(new Date())}</p></header>
        <h2>Yearly Summary</h2><p>Total Income: ${formatCurrency(yearlyTotals.income)}</p><p>Total Expenses: ${formatCurrency(yearlyTotals.expense)}</p><p>Net Balance: ${formatCurrency(yearlyTotals.balance)}</p>
        <table><thead><tr><th>Category</th><th>Amount</th><th>% of Expense</th></tr></thead><tbody>
        ${Object.entries(expensesByCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>`<tr><td>${cat}</td><td>${formatCurrency(amt)}</td><td>${((amt/yearlyTotals.expense)*100).toFixed(1)}%</td></tr>`).join('')}
        </tbody></table>
        <h2>Monthly Breakdown</h2><table><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Balance</th></tr></thead><tbody>
        ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m,i)=>`<tr><td>${m}</td><td>${formatCurrency(monthlyData[i].income)}</td><td>${formatCurrency(monthlyData[i].expense)}</td><td>${formatCurrency(monthlyData[i].balance)}</td></tr>`).join('')}
        </tbody></table></body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({ success:true, message:'PDF report generated successfully', reportUrl:`/api/reports/download/${filename}` });
    }
    // Return JSON data
    res.json({
      success: true,
      data: {
        year: reportYear,
        monthlyData: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((name, index) => ({
          month: name,
          ...monthlyData[index]
        }))
      },
      summary: {
        yearlyTotals,
        expensesByCategory
      }
    });
  } catch (error) {
    console.error('Error in generateAnnualBudgetReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate user report
// @route   GET /api/reports/users
// @access  Private
const generateUserReport = async (req, res) => {
  try {
    const { format } = req.query;
    const users = await User.find().sort({ name: 1 });
    if (format === 'pdf') {
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const filename = `user_report_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>User Report</title><style>
        body{font-family:Arial,sans-serif;margin:20px}
        header{text-align:center;margin-bottom:20px}
        h1{color:#1b263b}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px}
        th{background:#3b82f6;color:#fff}
        tr:nth-child(even){background:#f7fafd}
      </style></head><body>
        <header><h1>User Report</h1><p>Generated on: ${formatDate(new Date())}</p></header>
        <table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th></tr></thead><tbody>
        ${users.map((u,i)=>`<tr><td>${i+1}</td><td>${u.name}</td><td>${u.email}</td><td>${u.phoneNumber}</td></tr>`).join('')}
        </tbody></table></body></html>`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html,{waitUntil:'networkidle0'});
      await page.pdf({path:filepath,format:'A4',printBackground:true});
      await browser.close();
      return res.json({ success:true, message:'PDF report generated successfully', reportUrl:`/api/reports/download/${filename}` });
    }
    res.json({ success:true, data: users });
  } catch (error) {
    console.error('Error in generateUserReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Download a generated report
// @route   GET /api/reports/download/:filename
// @access  Private
const downloadReport = (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '..', 'reports', filename);
    
    if (!fs.existsSync(filepath)) {
      console.error(`Report file not found: ${filepath}`);
      return res.status(404).json({ message: 'Report not found' });
    }
    
    console.log(`Sending file: ${filepath}`);
    
    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Stream the file instead of using res.download
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file', error: error.message });
      }
    });
  } catch (error) {
    console.error('Error in downloadReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  generateGroceryReport,
  generateInventoryReport,
  generateBudgetReport,
  generateExpiringGroceriesReport,
  generateInventoryValueReport,
  generateMonthlyBudgetReport,
  generateAnnualBudgetReport,
  generateUserReport,
  downloadReport
};
