import { cart, getCartCalculations, renderCart } from './cart.js';
import { products, saveProductsData, renderProducts } from './product.js';
import { transactions } from './transaction.js';
import { appSettings } from './settings.js';
import { rupiah, getNumber, formatNumber, showAlert, showConfirm, generateReceiptHTML } from './helpers.js';
import { getFromStorage, saveToStorage } from './storage.js';

let currentPaymentMethod = 'cash';

export function setPaymentMethod(method) {
  currentPaymentMethod = method
  
  const methods = ['cash', 'qris', 'transfer']
  methods.forEach(m => {
    const btn = document.getElementById(`btn-pm-${m}`)
    if (m === method) {
      btn.className = 'bg-primary text-white border border-primary rounded-lg py-2 text-xs font-bold transition'
    } else {
      btn.className = 'bg-white text-gray-500 border border-gray-200 rounded-lg py-2 text-xs font-bold hover:bg-gray-50 transition'
    }
  })

  const sec = document.getElementById('cashSection')
  if (method === 'cash') sec.classList.remove('hidden')
  else sec.classList.add('hidden')
  
  updateChange()
}

export function addCash(amount) {
  const cashInput = document.getElementById('cashInput')
  const current = getNumber(cashInput.value)
  cashInput.value = formatNumber(current + amount)
  updateChange()
}

export function updateChange() {
  const changeAmountEl = document.getElementById('changeAmount')
  const cashInput = document.getElementById('cashInput')
  const { total } = getCartCalculations()
  
  if (currentPaymentMethod === 'cash') {
    const cash = getNumber(cashInput.value)
    const change = cash - total
    changeAmountEl.textContent = rupiah(change > 0 ? change : 0)
  } else {
    changeAmountEl.textContent = rupiah(0)
  }
}

export function checkout() {
  if (Object.keys(cart).length === 0) return showAlert('Keranjang kosong')

  const { total } = getCartCalculations()
  
  if (currentPaymentMethod === 'cash') {
    const cashInput = document.getElementById('cashInput')
    const cash = getNumber(cashInput.value)
    if (cash < total) return showAlert('Nominal pembayaran kurang!')
  }

  openModal()
}

export function openModal() {
  const receiptItems = document.getElementById('receiptItems')
  const cashInput = document.getElementById('cashInput')
  receiptItems.innerHTML = ''

  document.getElementById('receiptStoreName').textContent = appSettings.storeName
  document.getElementById('receiptStoreAddress').textContent = appSettings.storeAddress

  Object.values(cart).forEach(item => {
    receiptItems.innerHTML += `
      <div class="mb-2">
        <div class="flex justify-between text-gray-800">
          <span>${item.name}</span>
          <span>${rupiah(item.price * item.qty)}</span>
        </div>
        <div class="text-xs text-gray-800">${item.qty} x ${rupiah(item.price)}</div>
      </div>
    `
  })

  const calc = getCartCalculations()
  const cashVal = currentPaymentMethod === 'cash' ? getNumber(cashInput.value) : calc.total
  
  document.getElementById('rMethod').textContent = currentPaymentMethod.toUpperCase()
  document.getElementById('rSubtotal').textContent = rupiah(calc.subtotal)
  document.getElementById('rDiscount').textContent = '- ' + rupiah(calc.discount)
  document.getElementById('rTotal').textContent = rupiah(calc.total)
  document.getElementById('rCash').textContent = rupiah(cashVal)
  document.getElementById('rChange').textContent = rupiah(currentPaymentMethod === 'cash' ? Math.max(cashVal - calc.total, 0) : 0)

  document.getElementById('receiptModal').classList.remove('hidden')
}

export function cancelTransaction() {
  document.getElementById('receiptModal').classList.add('hidden')
}

export function processCheckout() {
  if (Object.keys(cart).length === 0) {
    document.getElementById('receiptModal').classList.add('hidden')
    return
  }

  const cashInput = document.getElementById('cashInput')
  const discountInput = document.getElementById('discountInput')
  const { subtotal, discount, total } = getCartCalculations()
  const cash = currentPaymentMethod === 'cash' ? getNumber(cashInput.value) : total
  const change = currentPaymentMethod === 'cash' ? Math.max(cash - total, 0) : 0
  const items = Object.values(cart).map(i => `${i.name} x${i.qty}`).join(', ')
  const itemsDetails = Object.values(cart).map(i => ({
    name: i.name,
    qty: i.qty,
    price: i.price,
    capitalPrice: i.capitalPrice || 0,
    total: i.price * i.qty
  }))
  
  Object.values(cart).forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.id)
    if (product) {
      product.stock -= (cartItem.qty * (cartItem.conversion || 1))
    }
  })
  saveProductsData()
  renderProducts()

  const transactionData = {
    id: Date.now(),
    timestamp: Date.now(),
    date: new Date().toLocaleString('id-ID'),
    subtotal,
    discount,
    total,
    paymentMethod: currentPaymentMethod,
    cash,
    change,
    items,
    itemsDetails
  }

  transactions.unshift(transactionData)
  saveToStorage('transactions', transactions)

  document.getElementById('receiptModal').classList.add('hidden')
  Object.keys(cart).forEach(k => delete cart[k])
  cashInput.value = ''
  discountInput.value = ''
  setPaymentMethod('cash')
  renderCart()

  showConfirm(
    'Transaksi berhasil! Cetak struk?', 
    () => printReceiptData(transactionData),
    'Cetak',
    'Tidak'
  )
}

export function printReceiptData(data) {
  const html = generateReceiptHTML({
    date: data.date,
    items: data.itemsDetails,
    paymentMethod: data.paymentMethod,
    subtotal: data.subtotal,
    discount: data.discount,
    total: data.total,
    cash: data.cash,
    change: data.change
  }, appSettings)
  
  const win = window.open('', '', 'width=400,height=600')
  if (win) {
    win.document.write(html)
    win.document.close()
  } else {
    alert('Pop-up diblokir. Izinkan pop-up untuk mencetak.')
  }
}

// --- FITUR HOLD TRANSAKSI ---

export function holdTransaction() {
  if (Object.keys(cart).length === 0) return showAlert('Keranjang kosong');
  
  const held = getFromStorage('held_transactions') || [];
  const newHold = {
    id: Date.now(),
    date: new Date().toLocaleString('id-ID'),
    items: JSON.parse(JSON.stringify(cart)), // Deep copy cart
    total: getCartCalculations().total
  };
  
  held.push(newHold);
  saveToStorage('held_transactions', held);
  
  // Clear cart
  Object.keys(cart).forEach(k => delete cart[k]);
  renderCart();
  updateHeldBadge();
  showAlert('Transaksi berhasil disimpan sementara');
}

export function showHeldTransactions() {
  const held = getFromStorage('held_transactions') || [];
  const list = document.getElementById('heldTransactionsList');
  if (!list) return;
  
  list.innerHTML = '';
  
  if (held.length === 0) {
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-gray-400">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="folder-open" class="w-8 h-8 text-gray-300"></i>
        </div>
        <p class="text-sm font-medium">Tidak ada transaksi tersimpan</p>
      </div>
    `;
  } else {
    held.forEach(t => {
      const totalItems = Object.values(t.items).reduce((acc, item) => acc + item.qty, 0);
      const itemsHtml = Object.values(t.items).map(i => `
        <div class="flex justify-between items-center py-1 border-b border-dashed border-gray-200 last:border-0">
          <span class="text-gray-900 truncate pr-2">${i.name}</span>
          <span class="text-gray-900 shrink-0">x${i.qty}</span>
        </div>
      `).join('');
      
      const el = document.createElement('div');
      el.className = 'bg-white border border-gray-200 rounded-xl p-3 hover:border-primary/50 transition-all shadow-sm';
      
      el.innerHTML = `
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-3">
            <div class="bg-orange-50 text-orange-600 p-2 rounded-lg shrink-0">
              <i data-lucide="clock" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="font-bold text-gray-800 text-sm">${rupiah(t.total)}</div>
              <div class="text-[10px] text-gray-400">${t.date}</div>
            </div>
          </div>
          <div class="flex gap-2">
             <button onclick="restoreHeldTransaction(${t.id})" class="w-10 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors" title="Pulihkan">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            </button>
            <button onclick="removeHeldTransaction(${t.id})" class="w-10 h-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Hapus">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div class="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider border-b border-gray-200 pb-1">${totalItems} Item</div>
          <div class="text-xs space-y-0.5 max-h-32 overflow-y-auto">
            ${itemsHtml}
          </div>
        </div>
      `;
      list.appendChild(el);
    });
  }
  
  document.getElementById('heldTransactionsModal').classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

export function closeHeldTransactionsModal() {
  document.getElementById('heldTransactionsModal').classList.add('hidden');
}

export function restoreHeldTransaction(id) {
  if (Object.keys(cart).length > 0) {
    showConfirm('Keranjang saat ini tidak kosong. Timpa dengan transaksi tersimpan?', () => performRestore(id), 'Timpa', 'Batal');
  } else {
    performRestore(id);
  }
}

function performRestore(id) {
  const held = getFromStorage('held_transactions') || [];
  const t = held.find(x => x.id === id);
  if (!t) return;
  
  Object.keys(cart).forEach(k => delete cart[k]); // Clear current
  Object.assign(cart, t.items); // Restore items
  
  const newHeld = held.filter(x => x.id !== id); // Remove from storage
  saveToStorage('held_transactions', newHeld);
  
  renderCart();
  updateHeldBadge();
  closeHeldTransactionsModal();
  showAlert('Transaksi dipulihkan');
}

export function removeHeldTransaction(id) {
  showConfirm('Hapus transaksi tersimpan ini?', () => {
    const held = getFromStorage('held_transactions') || [];
    const newHeld = held.filter(x => x.id !== id);
    saveToStorage('held_transactions', newHeld);
    showHeldTransactions(); // Refresh list
    updateHeldBadge();
  });
}

export function updateHeldBadge() {
  const held = getFromStorage('held_transactions') || [];
  const badge = document.getElementById('heldCount');
  if (badge) {
    badge.textContent = held.length;
    if (held.length > 0) {
      badge.classList.remove('hidden');
      badge.classList.add('flex');
    } else {
      badge.classList.add('hidden');
      badge.classList.remove('flex');
    }
  }
}

// Expose to window for HTML onclick events
window.holdTransaction = holdTransaction;
window.showHeldTransactions = showHeldTransactions;
window.closeHeldTransactionsModal = closeHeldTransactionsModal;
window.restoreHeldTransaction = restoreHeldTransaction;
window.removeHeldTransaction = removeHeldTransaction;

// Init badge on load
document.addEventListener('DOMContentLoaded', updateHeldBadge);
setTimeout(updateHeldBadge, 500); // Fallback