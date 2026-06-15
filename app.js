// State variables
let fixedValue = 0;
let expenses = []; // Array of objects: { id, desc, val, type: 'expense'|'income', category, date }
let currentType = 'expense';
let categoryChart = null;

// DOM Elements
const setupScreen = document.getElementById('setupScreen');
const mainScreen = document.getElementById('mainScreen');
const initialValueInput = document.getElementById('initialValueInput');
const btnSetInitialValue = document.getElementById('btnSetInitialValue');

const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const fixedValueDisplay = document.getElementById('fixedValueDisplay');

const expenseDescInput = document.getElementById('expenseDescInput');
const expenseValueInput = document.getElementById('expenseValueInput');
const expenseCategoryInput = document.getElementById('expenseCategoryInput');
const transactionDateInput = document.getElementById('transactionDateInput');
const btnAddExpense = document.getElementById('btnAddExpense');

const btnTypeExpense = document.getElementById('btnTypeExpense');
const btnTypeIncome = document.getElementById('btnTypeIncome');

const statsCard = document.getElementById('statsCard');
const totalIncomeDisplay = document.getElementById('totalIncomeDisplay');
const totalExpensesDisplay = document.getElementById('totalExpensesDisplay');

const expensesList = document.getElementById('expensesList');
const btnResetApp = document.getElementById('btnResetApp');

// Category colors map
const categoryColors = {
  'Carro': '#f87171',
  'Mercado': '#fbbf24',
  'Padaria': '#a3e635',
  'Farmacia': '#22d3ee',
  'Cerveja': '#60a5fa',
  'Alimentação': '#34d399',
  'Café': '#c084fc',
  'Compras': '#f472b6',
  'Outros': '#94a3b8'
};

// Format function
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

// Initialization and Data Loading
function init() {
  const savedFixed = localStorage.getItem('fixedValue');
  const savedExpenses = localStorage.getItem('expenses');

  // Set default date input to today
  resetDateInput();

  if (savedFixed) {
    fixedValue = parseFloat(savedFixed);
    if (savedExpenses) {
      expenses = JSON.parse(savedExpenses);
      // Data normalization for retrocompatibility
      expenses = expenses.map(item => {
        return {
          id: item.id || Date.now().toString() + Math.random(),
          desc: item.desc || '',
          val: parseFloat(item.val) || 0,
          type: item.type || 'expense',
          category: item.category || 'Outros',
          date: item.date || new Date().toISOString().split('T')[0]
        };
      });
    }
    showMainScreen();
    updateUI();
  } else {
    // Show setup screen
    setupScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
  }
}

function resetDateInput() {
  transactionDateInput.value = new Date().toISOString().split('T')[0];
}

// Save to LocalStorage
function saveData() {
  localStorage.setItem('fixedValue', fixedValue);
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Show main
function showMainScreen() {
  setupScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
}

// Calculate and Update UI
function updateUI() {
  const totalExpenses = expenses.reduce((acc, curr) => curr.type === 'expense' ? acc + curr.val : acc, 0);
  const totalIncome = expenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.val : acc, 0);
  const currentBalance = fixedValue + totalIncome - totalExpenses;

  fixedValueDisplay.textContent = formatCurrency(fixedValue);
  currentBalanceDisplay.textContent = formatCurrency(currentBalance);
  
  totalIncomeDisplay.textContent = formatCurrency(totalIncome);
  totalExpensesDisplay.textContent = formatCurrency(totalExpenses);

  // Render List
  expensesList.innerHTML = '';
  if (expenses.length === 0) {
    expensesList.innerHTML = '<li style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;">Nenhuma transação ainda.</li>';
  } else {
    expenses.forEach(exp => {
      const li = document.createElement('li');
      li.className = 'expense-item';
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'expense-info';
      
      // Row 1: Description and Value
      const descRow = document.createElement('div');
      descRow.className = 'expense-desc-row';
      
      const descSpan = document.createElement('span');
      descSpan.className = 'expense-desc';
      descSpan.textContent = exp.desc || (exp.type === 'expense' ? 'Despesa' : 'Crédito');
      
      const valSpan = document.createElement('span');
      valSpan.className = `expense-val ${exp.type}`;
      valSpan.textContent = (exp.type === 'expense' ? '- ' : '+ ') + formatCurrency(exp.val);
      
      descRow.appendChild(descSpan);
      descRow.appendChild(valSpan);
      
      // Row 2: Date and Category badge
      const metaRow = document.createElement('div');
      metaRow.className = 'expense-meta-row';
      
      const dateSpan = document.createElement('span');
      dateSpan.className = 'expense-date';
      dateSpan.textContent = formatDate(exp.date);
      
      metaRow.appendChild(dateSpan);
      
      if (exp.type === 'expense') {
        const catBadge = document.createElement('span');
        catBadge.className = 'expense-category-badge';
        catBadge.textContent = exp.category;
        catBadge.style.borderLeft = `3px solid ${categoryColors[exp.category] || '#94a3b8'}`;
        metaRow.appendChild(catBadge);
      }
      
      infoDiv.appendChild(descRow);
      infoDiv.appendChild(metaRow);
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.innerHTML = '✕';
      delBtn.onclick = () => deleteExpense(exp.id);
      
      li.appendChild(infoDiv);
      li.appendChild(delBtn);
      
      expensesList.appendChild(li);
    });
  }

  // Update chart
  updateChart();
}

// Chart Logic
function updateChart() {
  const expenseList = expenses.filter(exp => exp.type === 'expense');

  if (expenseList.length === 0) {
    statsCard.classList.add('hidden');
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    return;
  }

  statsCard.classList.remove('hidden');

  // Aggregate values by category
  const categoryTotals = {};
  expenseList.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.val;
  });

  const labels = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);
  const backgroundColors = labels.map(label => categoryColors[label] || '#94a3b8');

  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  if (categoryChart) {
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = dataValues;
    categoryChart.data.datasets[0].backgroundColor = backgroundColors;
    categoryChart.update();
  } else {
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: '#1e293b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f8fafc',
              font: {
                family: 'Outfit',
                size: 11
              }
            }
          }
        }
      }
    });
  }
}

// Setup Event Listeners
btnSetInitialValue.addEventListener('click', () => {
  const val = parseFloat(initialValueInput.value);
  if (isNaN(val) || val <= 0) {
    alert('Por favor, insira um valor inicial válido.');
    return;
  }
  fixedValue = val;
  saveData();
  showMainScreen();
  updateUI();
});

// Type toggle action
btnTypeExpense.addEventListener('click', () => {
  currentType = 'expense';
  btnTypeExpense.classList.add('active');
  btnTypeIncome.classList.remove('active');
  expenseCategoryInput.style.display = 'block';
});

btnTypeIncome.addEventListener('click', () => {
  currentType = 'income';
  btnTypeIncome.classList.add('active');
  btnTypeExpense.classList.remove('active');
  expenseCategoryInput.style.display = 'none';
});

// Add transaction action
btnAddExpense.addEventListener('click', () => {
  const val = parseFloat(expenseValueInput.value);
  const desc = expenseDescInput.value.trim();
  const date = transactionDateInput.value;
  const category = currentType === 'expense' ? expenseCategoryInput.value : '';
  
  if (isNaN(val) || val <= 0) {
    alert('Por favor, insira um valor válido.');
    return;
  }
  if (!date) {
    alert('Por favor, selecione uma data.');
    return;
  }
  
  const newTransaction = {
    id: Date.now().toString(),
    desc: desc,
    val: val,
    type: currentType,
    category: category,
    date: date
  };
  
  // Add to array, sort by date descending
  expenses.push(newTransaction);
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  saveData();
  updateUI();
  
  // clear inputs
  expenseDescInput.value = '';
  expenseValueInput.value = '';
  resetDateInput();
});

function deleteExpense(id) {
  expenses = expenses.filter(exp => exp.id !== id);
  saveData();
  updateUI();
}

btnResetApp.addEventListener('click', () => {
  if(confirm('Tem certeza? Isso apagará todo o histórico e valor inicial permanentemente.')) {
    localStorage.removeItem('fixedValue');
    localStorage.removeItem('expenses');
    fixedValue = 0;
    expenses = [];
    initialValueInput.value = '';
    
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    
    // back to setup
    mainScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
  }
});

// Start app
init();
