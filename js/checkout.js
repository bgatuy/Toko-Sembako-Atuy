import { cart, getCartCalculations, renderCart } from './cart.js';
import { products, saveProductsData, renderProducts } from './product.js';
import { transactions } from './transaction.js';
import { appSettings } from './settings.js';
import { rupiah, getNumber, formatNumber, showAlert, showConfirm, generateReceiptHTML } from './helpers.js';
import { saveToStorage } from './storage.js';

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