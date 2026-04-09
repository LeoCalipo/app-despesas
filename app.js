// State variables
let fixedValue = 0;
let expenses = []; // Array of objects: { id, desc, val }

// DOM Elements
const setupScreen = document.getElementById('setupScreen');
const mainScreen = document.getElementById('mainScreen');
const initialValueInput = document.getElementById('initialValueInput');
const btnSetInitialValue = document.getElementById('btnSetInitialValue');

const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const fixedValueDisplay = document.getElementById('fixedValueDisplay');

const expenseDescInput = document.getElementById('expenseDescInput');
const expenseValueInput = document.getElementById('expenseValueInput');
const btnAddExpense = document.getElementById('btnAddExpense');

const expensesList = document.getElementById('expensesList');
const btnResetApp = document.getElementById('btnResetApp');

// Format function
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Initialization and Data Loading
function init() {
  const savedFixed = localStorage.getItem('fixedValue');
  const savedExpenses = localStorage.getItem('expenses');

  if (savedFixed) {
    fixedValue = parseFloat(savedFixed);
    if (savedExpenses) {
      expenses = JSON.parse(savedExpenses);
    }
    showMainScreen();
    updateUI();
  } else {
    // Show setup screen
    setupScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
  }
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
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.val, 0);
  const currentBalance = fixedValue - totalExpenses;

  fixedValueDisplay.textContent = formatCurrency(fixedValue);
  currentBalanceDisplay.textContent = formatCurrency(currentBalance);

  // Render List
  expensesList.innerHTML = '';
  if (expenses.length === 0) {
    expensesList.innerHTML = '<li style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 20px;">Nenhum desconto ainda.</li>';
  } else {
    expenses.forEach(exp => {
      const li = document.createElement('li');
      li.className = 'expense-item';
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'expense-info';
      
      const descSpan = document.createElement('span');
      descSpan.className = 'expense-desc';
      descSpan.textContent = exp.desc || 'Sem Descrição';
      
      const valSpan = document.createElement('span');
      valSpan.className = 'expense-val';
      valSpan.textContent = '- ' + formatCurrency(exp.val);
      
      infoDiv.appendChild(descSpan);
      infoDiv.appendChild(valSpan);
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.innerHTML = '✕';
      delBtn.onclick = () => deleteExpense(exp.id);
      
      li.appendChild(infoDiv);
      li.appendChild(delBtn);
      
      expensesList.appendChild(li);
    });
  }
}

// Events
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

btnAddExpense.addEventListener('click', () => {
  const val = parseFloat(expenseValueInput.value);
  const desc = expenseDescInput.value.trim();
  
  if (isNaN(val) || val <= 0) {
    alert('Por favor, insira um valor de desconto válido.');
    return;
  }
  
  const newExpense = {
    id: Date.now().toString(),
    desc: desc,
    val: val
  };
  
  // Add to beginning of the array so it shows at the top
  expenses.unshift(newExpense);
  saveData();
  updateUI();
  
  // clear inputs
  expenseDescInput.value = '';
  expenseValueInput.value = '';
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
    
    // back to setup
    mainScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
  }
});

// Start app
init();
