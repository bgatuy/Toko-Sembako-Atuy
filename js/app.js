// Load products from LocalStorage or use default
let products = JSON.parse(localStorage.getItem('products')) || [
  { id: 1, name: 'Beras Premium', price: 14000, capitalPrice: 12000, image: 'beras.jpg', stock: 100, category: 'Sembako', unit: 'Kg', unitBig: 'Karung 5kg', conversion: 5, priceBig: 65000 },
  { id: 2, name: 'Gula Pasir', price: 15000, capitalPrice: 13500, image: 'gula.jpg', stock: 50, category: 'Sembako', unit: 'Kg' },
  { id: 3, name: 'Minyak Goreng', price: 18000, capitalPrice: 16000, image: 'minyak.jpg', stock: 24, category: 'Sembako', unit: 'Liter' },
  { id: 4, name: 'Telur Ayam', price: 2000, capitalPrice: 1800, image: 'telur.jpg', stock: 300, category: 'Sembako', unit: 'Butir', unitBig: 'Rak', conversion: 30, priceBig: 58000 }
]

// Helper to save products
function saveProductsData() { localStorage.setItem('products', JSON.stringify(products)) }

const cart = {}

const productGrid = document.getElementById('productGrid')
const cartItems = document.getElementById('cartItems')
const totalPriceEl = document.getElementById('totalPrice')
const changeAmountEl = document.getElementById('changeAmount')
const cartSubtotalEl = document.getElementById('cartSubtotal')
const cartDiscountEl = document.getElementById('cartDiscount')
const discountInput = document.getElementById('discountInput')
const discountType = document.getElementById('discountType')
const cartCountEl = document.getElementById('cartCount')
const cashInput = document.getElementById('cashInput')
const searchInput = document.getElementById('search')
const prodSearchInput = document.getElementById('prodSearch')
const prodSortInput = document.getElementById('prodSort')

function rupiah(num) {
  return 'Rp ' + (Number(num) || 0).toLocaleString('id-ID')
}

function getNumber(str) {
  if (typeof str === 'number') return str
  return Number(str.replace(/\./g, '') || 0)
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function getYMD(timestamp) {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/* PRODUCTS */
let currentCategory = 'Semua'

function renderCategories() {
  const container = document.getElementById('categoryFilters')
  if (!container) return

  // Ambil daftar kategori unik dari produk yang ada
  const categories = ['Semua', ...new Set(products.map(p => p.category || 'Lainnya').filter(c => c))]
  
  container.innerHTML = categories.map(cat => `
    <button onclick="filterCategory('${cat}')" 
      class="px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap border ${
        currentCategory === cat 
        ? 'bg-primary text-white border-primary shadow-lg shadow-cyan-500/30' 
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }">
      ${cat}
    </button>
  `).join('')
}

function filterCategory(cat) {
  currentCategory = cat
  renderCategories()
  renderProducts()
}

function renderProducts() {
  productGrid.innerHTML = ''
  const term = searchInput.value.toLowerCase()

  products.filter(p => {
    const matchName = p.name.toLowerCase().includes(term)
    const matchCat = currentCategory === 'Semua' || (p.category || 'Lainnya') === currentCategory
    return matchName && matchCat
  }).forEach(p => {
    const el = document.createElement('div')
    el.className = 'bg-white rounded-2xl shadow-soft p-4 cursor-pointer'
    
    // Cek apakah ada nama file gambar, jika tidak pakai placeholder
    const imgHtml = p.image 
      ? `<img src="assets/images/${p.image}" class="h-28 w-full object-contain bg-gray-50 rounded-xl mb-3" alt="${p.name}">`
      : `<div class="h-28 bg-gray-200 rounded-xl mb-3 flex items-center justify-center"><i data-lucide="image" class="text-gray-400"></i></div>`
    
    // Stock Badge
    const stockHtml = p.stock > 0 
      ? `<span class="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Stok: ${Number(p.stock).toLocaleString('id-ID')}</span>`
      : `<span class="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">Habis</span>`

    // Label Satuan
    const unitLabel = p.unit ? `<span class="text-[10px] text-gray-400">/${p.unit}</span>` : ''

    el.innerHTML = `
      ${imgHtml}
      <div class="text-sm font-medium">${p.name}</div>
      <div class="flex justify-between items-center mt-1"><div class="text-xs text-gray-500">${rupiah(p.price)} ${unitLabel}</div>${stockHtml}</div>
    `
    if (p.stock > 0) {
      // Jika punya satuan besar, buka popup pilihan. Jika tidak, langsung masuk keranjang.
      if ((p.unitBig && p.conversion > 1) || (p.unitMedium && p.conversionMedium > 1)) el.onclick = () => openUnitSelection(p)
      else el.onclick = () => addToCart(p)
    }
    else el.classList.add('opacity-60', 'cursor-not-allowed')
    
    productGrid.appendChild(el)
  })
  lucide.createIcons()
}

/* UNIT SELECTION MODAL */
function openUnitSelection(product) {
  const modal = document.getElementById('unitSelectionModal')
  document.getElementById('unitSelectProductName').textContent = product.name
  
  // Setup Tombol Eceran
  const btnBase = document.getElementById('btnSelectBase')
  document.getElementById('labelUnitBase').textContent = product.unit || 'Pcs'
  document.getElementById('priceUnitBase').textContent = rupiah(product.price)
  btnBase.onclick = () => {
    addToCart(product, 'base')
    closeUnitSelection()
  }

  // Setup Tombol Medium
  const btnMedium = document.getElementById('btnSelectMedium')
  if (product.unitMedium && product.conversionMedium > 1) {
    btnMedium.classList.remove('hidden')
    btnMedium.classList.add('flex')
    document.getElementById('labelUnitMedium').textContent = product.unitMedium
    document.getElementById('priceUnitMedium').textContent = rupiah(product.priceMedium || (product.price * product.conversionMedium))
    btnMedium.onclick = () => {
      addToCart(product, 'medium')
      closeUnitSelection()
    }
  } else {
    btnMedium.classList.add('hidden')
    btnMedium.classList.remove('flex')
  }

  // Setup Tombol Grosir
  const btnBig = document.getElementById('btnSelectBig')
  document.getElementById('labelUnitBig').textContent = product.unitBig || 'Dus'
  document.getElementById('priceUnitBig').textContent = rupiah(product.priceBig || product.price * product.conversion)

  btnBig.onclick = () => {
    addToCart(product, 'big')
    closeUnitSelection()
  }

  modal.classList.remove('hidden')
}

function closeUnitSelection() {
  document.getElementById('unitSelectionModal').classList.add('hidden')
}

/* CART */
function addToCart(product, unitType = 'base') {
  // Buat ID unik untuk keranjang: "IDProduk-TipeSatuan" (contoh: "1-base" atau "1-big")
  const cartKey = `${product.id}-${unitType}`
  
  // Tentukan harga dan konversi berdasarkan tipe satuan
  const isBig = unitType === 'big'
  const isMedium = unitType === 'medium'
  
  let price = product.price
  let capitalPrice = product.capitalPrice
  let conversion = 1
  let unitName = product.unit || 'Pcs'

  if (isBig) {
    price = product.priceBig || (product.price * (product.conversion || 1))
    capitalPrice = product.capitalPriceBig || (product.capitalPrice * (product.conversion || 1))
    conversion = product.conversion || 1
    unitName = product.unitBig || 'Dus'
  } else if (isMedium) {
    price = product.priceMedium || (product.price * (product.conversionMedium || 1))
    capitalPrice = product.capitalPriceMedium || (product.capitalPrice * (product.conversionMedium || 1))
    conversion = product.conversionMedium || 1
    unitName = product.unitMedium || 'Grosir'
  }

  const displayName = `${product.name} (${unitName})`

  // Cek Stok (Stok di database selalu dalam satuan dasar)
  const currentCartItem = cart[cartKey]
  const currentQtyInCart = currentCartItem ? currentCartItem.qty : 0
  const requiredStock = (currentQtyInCart + 1) * conversion
  
  // Kita perlu cek total stok yang terpakai untuk produk ini (gabungan ecer + grosir di keranjang)
  // Tapi untuk simplifikasi, kita cek per item dulu atau cek global
  // Cek global stok produk
  let totalStockUsed = 0
  Object.values(cart).forEach(item => {
    if (item.id === product.id) {
      totalStockUsed += item.qty * (item.conversion || 1)
    }
  })
  
  if ((totalStockUsed + conversion) > product.stock) return showAlert('Stok tidak mencukupi!')
  
  if (!cart[cartKey]) {
    cart[cartKey] = { 
      ...product, 
      cartKey: cartKey, // Simpan key unik
      name: displayName, // Nama tampilan beda
      price: price,      // Harga beda
      capitalPrice: capitalPrice, // Simpan HPP sesuai satuan
      qty: 0, 
      conversion: conversion, // Simpan faktor pengali stok
      unitType: unitType
    }
  }
  
  cart[cartKey].qty++
  renderCart()
}

function updateQty(cartKey, delta) {
  // cartKey sekarang string (misal "1-base"), bukan integer ID
  if (delta > 0) {
    const item = cart[cartKey]
    // Cek stok lagi saat tambah qty
    const product = products.find(p => p.id === item.id)
    
    let totalStockUsed = 0
    Object.values(cart).forEach(c => {
      if (c.id === item.id) {
        totalStockUsed += c.qty * (c.conversion || 1)
      }
    })

    if ((totalStockUsed + item.conversion) > product.stock) return showAlert('Stok maksimal tercapai!')
  }
  
  cart[cartKey].qty += delta
  if (cart[cartKey].qty <= 0) delete cart[cartKey]
  renderCart()
}

function getCartCalculations() {
  const subtotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0)
  const discVal = getNumber(discountInput.value)
  const type = discountType.value
  
  let discount = 0
  if (type === 'percent') {
    // Batasi maksimal 100%
    const pct = Math.min(discVal, 100)
    discount = subtotal * (pct / 100)
  } else {
    discount = discVal
  }
  
  // Diskon tidak boleh melebihi subtotal
  discount = Math.min(discount, subtotal)
  
  return {
    subtotal,
    discount,
    total: subtotal - discount
  }
}

function renderCart() {
  cartItems.innerHTML = ''
  let count = 0

  Object.values(cart).forEach(item => {
    count += item.qty

    const el = document.createElement('div')
    el.className = 'bg-gray-50 rounded-xl p-3 flex justify-between items-center'
    el.innerHTML = `
      <div>
        <div class="text-sm font-medium">${item.name}</div>
        <div class="text-xs text-gray-500">${rupiah(item.price)}</div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="updateQty('${item.cartKey}', -1)" class="w-7 h-7 bg-gray-200 rounded-full">-</button>
        <div class="w-7 h-7 bg-white rounded-lg shadow flex items-center justify-center text-sm">${item.qty}</div>
        <button onclick="updateQty('${item.cartKey}', 1)" class="w-7 h-7 bg-gray-200 rounded-full">+</button>
      </div>
    `
    cartItems.appendChild(el)
  })

  cartCountEl.textContent = count
  updateCartTotals()
}

function updateCartTotals() {
  const calc = getCartCalculations()
  
  cartSubtotalEl.textContent = rupiah(calc.subtotal)
  cartDiscountEl.textContent = '- ' + rupiah(calc.discount)
  totalPriceEl.textContent = rupiah(calc.total)
  
  updateChange()
}

/* CASH */
let currentPaymentMethod = 'cash'

function setPaymentMethod(method) {
  currentPaymentMethod = method
  
  // Update Tampilan Tombol
  const methods = ['cash', 'qris', 'transfer']
  methods.forEach(m => {
    const btn = document.getElementById(`btn-pm-${m}`)
    if (m === method) {
      btn.className = 'bg-primary text-white border border-primary rounded-lg py-2 text-xs font-bold transition'
    } else {
      btn.className = 'bg-white text-gray-500 border border-gray-200 rounded-lg py-2 text-xs font-bold hover:bg-gray-50 transition'
    }
  })

  // Toggle Input Cash
  const sec = document.getElementById('cashSection')
  if (method === 'cash') sec.classList.remove('hidden')
  else sec.classList.add('hidden')
  
  updateChange()
}

function addCash(amount) {
  const current = getNumber(cashInput.value)
  cashInput.value = formatNumber(current + amount)
  updateChange()
}

function updateChange() {
  const { total } = getCartCalculations()
  
  if (currentPaymentMethod === 'cash') {
    const cash = getNumber(cashInput.value)
    const change = cash - total
    changeAmountEl.textContent = rupiah(change > 0 ? change : 0)
  } else {
    // Jika Non-Tunai, kembalian 0
    changeAmountEl.textContent = rupiah(0)
  }
}

/* CHECKOUT */
function checkout() {
  if (Object.keys(cart).length === 0) return showAlert('Keranjang kosong')

  const { total } = getCartCalculations()
  
  // Validasi hanya jika Tunai
  if (currentPaymentMethod === 'cash') {
    const cash = getNumber(cashInput.value)
    if (cash < total) return showAlert('Nominal pembayaran kurang!')
  }

  openModal()
}

function openModal() {
  const receiptItems = document.getElementById('receiptItems')
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
  // Jika non-tunai, anggap uang pas (sesuai total)
  const cashVal = currentPaymentMethod === 'cash' ? getNumber(cashInput.value) : calc.total
  
  document.getElementById('rMethod').textContent = currentPaymentMethod.toUpperCase()
  document.getElementById('rSubtotal').textContent = rupiah(calc.subtotal)
  document.getElementById('rDiscount').textContent = '- ' + rupiah(calc.discount)
  document.getElementById('rTotal').textContent = rupiah(calc.total)
  document.getElementById('rCash').textContent = rupiah(cashVal)
  document.getElementById('rChange').textContent = rupiah(currentPaymentMethod === 'cash' ? Math.max(cashVal - calc.total, 0) : 0)

  document.getElementById('receiptModal').classList.remove('hidden')
}

function generateReceiptHTML(data) {
  const items = data.items || []
  const methodLabel = data.paymentMethod ? data.paymentMethod.toUpperCase() : 'TUNAI'
  
  const itemsHtml = items.map(item => `
    <div style="margin-bottom: 5px;">
      <div class="row" style="margin-bottom: 2px;">
        <span style="flex:1;">${item.name}</span>
        <span>${rupiah(item.total)}</span>
      </div>
      <div style="font-size: 9px; color: #000;">${item.qty} x ${rupiah(item.price)}</div>
    </div>
  `).join('')

  // Menggunakan logo SVG (Ikon Toko) agar lebih stabil dan tajam saat diprint
  const logoHtml = `<div style="display: flex; justify-content: center; margin-bottom: 5px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
  </div>`

  const paperSize = '48mm'
  const fontSize = '10px'
  const padding = '2mm'

  return `
    <html>
      <head>
        <title>Struk - ${appSettings.storeName}</title>
        <style>
          @page { margin: 0; size: auto; }
          html, body { margin: 0; padding: 0; }
          body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #000; font-size: ${fontSize}; line-height: 1.2; }
          .receipt { width: ${paperSize}; padding: ${padding}; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 10px; }
          .store-name { font-weight: bold; font-size: 16px; margin-bottom: 4px; }
          .store-address { color: #000; font-size: 11px; margin-bottom: 8px; }
          .meta { color: #000; font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .items { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 15px; }
          .totals { font-size: ${fontSize}; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .total-row { font-weight: bold; font-size: 14px; margin-top: 8px; border-top: 1px dashed #000; padding-top: 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #000; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${logoHtml}
            <div class="store-name">${appSettings.storeName}</div>
            <div class="store-address">${appSettings.storeAddress}</div>
            <div class="meta">
              <div>${data.date}</div>
              <div>ID: #${Date.now().toString().slice(-6)}</div>
            </div>
          </div>
          <div class="items">${itemsHtml}</div>
          <div class="totals">
            <div class="row" style="color: #000;"><span>Subtotal:</span> <span>${rupiah(data.subtotal)}</span></div>
            <div class="row"><span>Diskon:</span> <span>-${rupiah(data.discount)}</span></div>
            <div class="row" style="font-weight:bold;"><span>Total:</span> <span>${rupiah(data.total)}</span></div>
            <div class="row"><span>Metode:</span> <span>${methodLabel}</span></div>
            ${(data.paymentMethod === 'cash' || !data.paymentMethod) ? `<div class="row"><span>Tunai:</span> <span>${rupiah(data.cash)}</span></div>` : ''}
            ${(data.paymentMethod === 'cash' || !data.paymentMethod) && data.change ? `<div class="row"><span>Kembali:</span> <span>${rupiah(data.change)}</span></div>` : ''}
          </div>
          <div style="text-align:center; margin-top:20px; font-size:12px;">Terima Kasih!</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
    </html>
  `
}

function cancelTransaction() {
  document.getElementById('receiptModal').classList.add('hidden')
}

function processCheckout() {
  // Simpan Transaksi ke History
  if (Object.keys(cart).length === 0) {
    document.getElementById('receiptModal').classList.add('hidden')
    return
  }

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
  
  // Kurangi Stok
  Object.values(cart).forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.id)
    if (product) {
      // Kurangi stok berdasarkan konversi (misal beli 1 Dus, kurangi 24 stok)
      product.stock -= (cartItem.qty * (cartItem.conversion || 1))
    }
  })
  saveProductsData()
  renderProducts() // Refresh grid untuk update tampilan stok

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
  localStorage.setItem('transactions', JSON.stringify(transactions))

  document.getElementById('receiptModal').classList.add('hidden')
  Object.keys(cart).forEach(k => delete cart[k])
  cashInput.value = ''
  discountInput.value = ''
  setPaymentMethod('cash') // Reset ke Tunai setelah transaksi
  renderCart()

  // Tampilkan Konfirmasi Cetak
  showConfirm(
    'Transaksi berhasil! Cetak struk?', 
    () => printReceiptData(transactionData),
    'Cetak',
    'Tidak'
  )
}

function printReceiptData(data) {
  const html = generateReceiptHTML({
    date: data.date,
    items: data.itemsDetails,
    paymentMethod: data.paymentMethod,
    subtotal: data.subtotal,
    discount: data.discount,
    total: data.total,
    cash: data.cash,
    change: data.change
  })
  
  const win = window.open('', '', 'width=400,height=600')
  if (win) {
    win.document.write(html)
    win.document.close()
  } else {
    alert('Pop-up diblokir. Izinkan pop-up untuk mencetak.')
  }
}

/* NAVIGATION */
function switchView(viewName) {
  const views = ['pos', 'products', 'stats', 'history', 'settings']
  
  views.forEach(v => {
    const el = document.getElementById('view-' + v)
    const btn = document.getElementById('btn-' + v)
    
    if (v === viewName) {
      el.classList.remove('hidden')
      btn.classList.replace('bg-white/20', 'bg-white/30')
      if (v === 'products') renderProductManagement()
      if (v === 'stats') renderStats()
      if (v === 'history') renderHistory()
      if (v === 'settings') renderSettings()
    } else {
      el.classList.add('hidden')
      btn.classList.replace('bg-white/30', 'bg-white/20')
    }
  })
}

/* STATS (CHART.JS) */
let salesChart = null
let transactions = JSON.parse(localStorage.getItem('transactions') || '[]')
let currentPage = 1
const itemsPerPage = 5

function clearStatsFilter() {
  document.getElementById('startDate').value = ''
  document.getElementById('endDate').value = ''
  renderStats()
}

function setStatsRange(range) {
  const end = new Date()
  const start = new Date()
  
  if (range === '7days') {
    start.setDate(end.getDate() - 6)
  } else if (range === 'thisMonth') {
    start.setDate(1)
  } else if (range === 'lastMonth') {
    start.setMonth(start.getMonth() - 1)
    start.setDate(1)
    end.setDate(1)
    end.setDate(0) // Set ke tanggal terakhir bulan sebelumnya
  }
  
  document.getElementById('startDate').value = getYMD(start)
  document.getElementById('endDate').value = getYMD(end)
  renderStats()
}

function clearHistoryFilter() {
  document.getElementById('historyStartDate').value = ''
  document.getElementById('historyEndDate').value = ''
  document.getElementById('historyPaymentMethod').value = ''
  renderHistory(true)
}

function renderStats() {
  const ctx = document.getElementById('salesChart').getContext('2d')
  const startDate = document.getElementById('startDate').value
  const endDate = document.getElementById('endDate').value
  
  // --- DASHBOARD SUMMARY CALCULATION ---
  const today = getYMD(Date.now())
  const todayTrans = transactions.filter(t => getYMD(t.timestamp) === today)
  const todayRevenue = todayTrans.reduce((sum, t) => sum + t.total, 0)
  
  // Hitung Laba Bersih (Total - Modal - Diskon)
  const todayProfit = todayTrans.reduce((sum, t) => {
    const cost = t.itemsDetails ? t.itemsDetails.reduce((c, i) => c + ((i.capitalPrice || 0) * i.qty), 0) : 0
    return sum + (t.total - cost)
  }, 0)
  
  document.getElementById('statTodayRevenue').textContent = rupiah(todayRevenue)
  document.getElementById('statTodayProfit').textContent = rupiah(todayProfit)
  document.getElementById('statTodayCount').textContent = todayTrans.length
  document.getElementById('statTotalProducts').textContent = products.length
  // -------------------------------------

  let filteredTransactions = transactions

  if (startDate || endDate) {
    filteredTransactions = transactions.filter(t => {
      const tDate = getYMD(t.timestamp)
      if (startDate && tDate < startDate) return false
      if (endDate && tDate > endDate) return false
      return true
    })
  }
  
  // Hapus chart lama jika ada agar tidak menumpuk
  if (salesChart) salesChart.destroy()

  let labels = []
  let data = []

  if (startDate || endDate) {
    // Jika difilter, tampilkan data berdasarkan tanggal yang ada di hasil filter
    const grouped = {}
    filteredTransactions.forEach(t => {
      const d = getYMD(t.timestamp)
      grouped[d] = (grouped[d] || 0) + t.total
    })
    
    const sortedKeys = Object.keys(grouped).sort()
    labels = sortedKeys.map(k => {
      const parts = k.split('-')
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    })
    data = sortedKeys.map(k => grouped[k])
  } else {
    // Default: Data Real (7 Hari Terakhir)
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('id-ID')
      labels.push(dateStr)
      
      const dayTotal = transactions
        .filter(t => new Date(t.timestamp).toLocaleDateString('id-ID') === dateStr)
        .reduce((sum, t) => sum + t.total, 0)
      data.push(dayTotal)
    }
  }

  salesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pendapatan',
        data: data,
        backgroundColor: '#06b6d4',
        borderRadius: 6,
        barThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
        x: { grid: { display: false } }
      }
    }
  })
}

function renderHistory(resetPage = false) {
  if (resetPage) currentPage = 1
  const startDate = document.getElementById('historyStartDate').value
  const endDate = document.getElementById('historyEndDate').value
  const method = document.getElementById('historyPaymentMethod').value
  
  let filteredTransactions = transactions

  if (startDate || endDate || method) {
    filteredTransactions = transactions.filter(t => {
      const tDate = getYMD(t.timestamp)
      if (startDate && tDate < startDate) return false
      if (endDate && tDate > endDate) return false
      if (method && (t.paymentMethod || 'cash') !== method) return false
      return true
    })
  }
  
  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1
  if (currentPage > totalPages) currentPage = totalPages
  if (currentPage < 1) currentPage = 1
  
  const start = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredTransactions.slice(start, start + itemsPerPage)
  
  document.getElementById('pageInfo').textContent = `Halaman ${currentPage} dari ${totalPages}`
  document.getElementById('btnPrev').disabled = currentPage === 1
  document.getElementById('btnNext').disabled = currentPage === totalPages

  // Render Tabel History
  const tbody = document.getElementById('transactionTableBody')
  tbody.innerHTML = ''
  paginatedData.forEach(t => {
    const discountInfo = t.discount > 0 ? `<div class="text-xs text-green-600">Potongan ${rupiah(t.discount)}</div>` : ''
    const methodLabel = (t.paymentMethod || 'cash').toUpperCase()
    const tr = document.createElement('tr')
    tr.className = 'even:bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer'
    tr.onclick = () => showTransactionDetail(t.id)
    tr.innerHTML = `
      <td class="p-4 text-gray-500">
        <div>${t.date}</div>
        <div class="text-xs font-bold text-gray-400 mt-1">${methodLabel}</div>
      </td>
      <td class="p-4 text-gray-800">${t.items}</td>
      <td class="p-4 text-right font-medium">
        <div>${rupiah(t.total)}</div>
        ${discountInfo}
      </td>
    `
    tbody.appendChild(tr)
  })
}

let currentDetailId = null

function showTransactionDetail(id) {
  currentDetailId = id
  const t = transactions.find(x => x.id === id)
  if (!t) return

  document.getElementById('detailId').textContent = '#' + t.id
  document.getElementById('detailDate').textContent = t.date
  
  // Format items list
  let itemsHtml = ''
  if (t.itemsDetails) {
    itemsHtml = t.itemsDetails.map(item => `
      <div class="mb-2">
        <div class="flex justify-between text-gray-800">
          <span>${item.name}</span>
          <span>${rupiah(item.total)}</span>
        </div>
        <div class="text-xs text-gray-800">${item.qty} x ${rupiah(item.price)}</div>
      </div>
    `).join('')
  } else {
    itemsHtml = t.items.split(', ').map(item => `
      <div class="flex justify-between"><span>${item}</span></div>
    `).join('')
  }
  document.getElementById('detailItems').innerHTML = itemsHtml

  const methodLabel = t.paymentMethod ? t.paymentMethod.toUpperCase() : 'TUNAI'
  document.getElementById('detailMethod').textContent = methodLabel
  document.getElementById('detailSubtotal').textContent = rupiah(t.subtotal || t.total)
  document.getElementById('detailDiscount').textContent = '- ' + rupiah(t.discount || 0)
  document.getElementById('detailTotal').textContent = rupiah(t.total)

  document.getElementById('transactionDetailModal').classList.remove('hidden')
  lucide.createIcons()
}

function printTransactionDetail() {
  const t = transactions.find(x => x.id === currentDetailId)
  if (!t) return

  const items = t.itemsDetails || []
  
  const html = generateReceiptHTML({
    date: t.date,
    items,
    paymentMethod: t.paymentMethod,
    subtotal: t.subtotal || t.total,
    discount: t.discount || 0,
    total: t.total
  })
  
  const win = window.open('', '', 'width=400,height=600')
  if (win) {
    win.document.write(html)
    win.document.close()
  } else {
    alert('Pop-up diblokir. Izinkan pop-up untuk mencetak.')
  }
}

function closeTransactionDetailModal() {
  document.getElementById('transactionDetailModal').classList.add('hidden')
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--
    renderHistory()
  }
}

function nextPage() {
  currentPage++
  renderHistory()
}

function resetHistory() {
  if (transactions.length === 0) return showAlert('Riwayat transaksi sudah kosong.')
  
  showConfirm('Yakin ingin menghapus semua riwayat transaksi?', () => {
    transactions = []
    localStorage.removeItem('transactions')
    renderHistory()
    renderStats() // Update chart juga jika perlu
    showAlert('Riwayat transaksi berhasil dihapus.')
  })
}

function exportToExcel() {
  const startDate = document.getElementById('historyStartDate').value
  const endDate = document.getElementById('historyEndDate').value
  const method = document.getElementById('historyPaymentMethod').value
  
  let data = transactions

  // Filter data sesuai input user (sama dengan logika renderHistory)
  if (startDate || endDate || method) {
    data = transactions.filter(t => {
      const tDate = getYMD(t.timestamp)
      if (startDate && tDate < startDate) return false
      if (endDate && tDate > endDate) return false
      if (method && (t.paymentMethod || 'cash') !== method) return false
      return true
    })
  }

  if (data.length === 0) return showAlert('Tidak ada data untuk diexport')

  // Header CSV (Gunakan delimiter ; agar kompatibel dengan Excel format Indonesia)
  let csvContent = "Tanggal;ID Transaksi;Item;Metode;Subtotal;Diskon;Total;Modal;Laba\n"

  data.forEach(t => {
    const capital = t.itemsDetails ? t.itemsDetails.reduce((sum, i) => sum + ((i.capitalPrice || 0) * i.qty), 0) : 0
    const profit = t.total - capital
    const items = `"${t.items.replace(/"/g, '""')}"` // Escape double quotes untuk format CSV
    
    csvContent += `${t.date};'${t.id};${items};${(t.paymentMethod || 'cash').toUpperCase()};${t.subtotal};${t.discount};${t.total};${capital};${profit}\n`
  })

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Laporan_Penjualan_${getYMD(Date.now())}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/* SETTINGS */
let appSettings = {
  storeName: 'Toko Sembako',
  storeAddress: 'Cabang Utama'
}

function loadSettings() {
  const saved = localStorage.getItem('appSettings')
  if (saved) appSettings = JSON.parse(saved)
  if (document.getElementById('sidebarStoreName')) document.getElementById('sidebarStoreName').textContent = appSettings.storeName
}

function renderSettings() {
  document.getElementById('settingStoreName').value = appSettings.storeName
  document.getElementById('settingStoreAddress').value = appSettings.storeAddress
}

function saveSettings() {
  const name = document.getElementById('settingStoreName').value
  const address = document.getElementById('settingStoreAddress').value
  if (!name) return showAlert('Nama toko wajib diisi')
  
  appSettings = { storeName: name, storeAddress: address }
  localStorage.setItem('appSettings', JSON.stringify(appSettings))
  if (document.getElementById('sidebarStoreName')) document.getElementById('sidebarStoreName').textContent = name
  showAlert('Pengaturan berhasil disimpan')
}

/* PRODUCT MANAGEMENT (CRUD) */
function renderProductManagement() {
  const tbody = document.getElementById('productTableBody')
  tbody.innerHTML = ''
  const term = prodSearchInput.value.toLowerCase()
  const sortType = prodSortInput.value

  // 1. Filter Pencarian
  let filtered = products.filter(p => p.name.toLowerCase().includes(term))

  // 2. Sorting
  if (sortType === 'stock_asc') filtered.sort((a, b) => a.stock - b.stock)
  else if (sortType === 'price_asc') filtered.sort((a, b) => a.price - b.price)
  else if (sortType === 'price_desc') filtered.sort((a, b) => b.price - a.price)
  else filtered.sort((a, b) => a.id - b.id) // Default by ID
  
  filtered.forEach(p => {
    // 3. Indikator Stok
    let stockDisplay = `<span class="text-gray-600">${p.stock}</span>`
    if (p.stock === 0) {
      stockDisplay = `<span class="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold">Habis</span>`
    } else if (p.stock <= 5) {
      stockDisplay = `<span class="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-xs font-bold">${p.stock} (Menipis)</span>`
    }

    const tr = document.createElement('tr')
    tr.className = 'even:bg-gray-50 hover:bg-gray-100 transition-colors'
    tr.innerHTML = `
      <td class="p-4 text-gray-500">#${p.id}</td>
      <td class="p-4 font-medium text-gray-800">${p.name}</td>
      <td class="p-4 text-gray-600"><span class="bg-gray-100 px-2 py-1 rounded text-xs">${p.category || '-'}</span></td>
      <td class="p-4 text-gray-500">${rupiah(p.capitalPrice || 0)}</td>
      <td class="p-4 text-gray-600">${rupiah(p.price)}</td>
      <td class="p-4">${stockDisplay}</td>
      <td class="p-4 text-right">
        <div class="flex justify-end gap-2">
          <button onclick="openStockModal(${p.id})" class="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition" title="Atur Stok"><i data-lucide="layers" class="w-4 h-4"></i></button>
          <button onclick="openProductModal(${p.id})" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Edit"><i data-lucide="pencil" class="w-4 h-4"></i></button>
          <button onclick="deleteProduct(${p.id})" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
      </td>
    `
    tbody.appendChild(tr)
  })
  lucide.createIcons()
}

function openProductModal(id = null) {
  const modal = document.getElementById('productModal')
  const title = document.getElementById('modalTitle')
  const nameInput = document.getElementById('prodName')
  const categoryInput = document.getElementById('prodCategory')
  const imageInput = document.getElementById('prodImage')
  const stockInput = document.getElementById('prodStock')
  const capitalPriceInput = document.getElementById('prodCapitalPrice')
  const priceInput = document.getElementById('prodPrice')
  const unitInput = document.getElementById('prodUnit')
  const unitBigInput = document.getElementById('prodUnitBig')
  const conversionInput = document.getElementById('prodConversion')
  const priceBigInput = document.getElementById('prodPriceBig')
  const capitalPriceBigInput = document.getElementById('prodCapitalPriceBig')
  const unitMediumInput = document.getElementById('prodUnitMedium')
  const conversionMediumInput = document.getElementById('prodConversionMedium')
  const priceMediumInput = document.getElementById('prodPriceMedium')
  const capitalPriceMediumInput = document.getElementById('prodCapitalPriceMedium')
  const idInput = document.getElementById('prodId')
  const wholesaleGroup = document.getElementById('wholesaleInputGroup')
  const wholesaleChevron = document.getElementById('wholesaleChevron')

  modal.classList.remove('hidden')
  
  if (id) {
    // Edit Mode
    const p = products.find(x => x.id === id)
    title.textContent = 'Edit Produk'
    idInput.value = p.id
    nameInput.value = p.name
    categoryInput.value = p.category || ''
    imageInput.value = p.image || ''
    stockInput.value = p.stock
    capitalPriceInput.value = formatNumber(p.capitalPrice || 0)
    priceInput.value = formatNumber(p.price)
    unitInput.value = p.unit || 'Pcs'
    unitBigInput.value = p.unitBig || ''
    conversionInput.value = p.conversion || ''
    priceBigInput.value = p.priceBig ? formatNumber(p.priceBig) : ''
    capitalPriceBigInput.value = (p.capitalPrice && p.conversion) ? formatNumber(p.capitalPrice * p.conversion) : ''
    unitMediumInput.value = p.unitMedium || ''
    conversionMediumInput.value = p.conversionMedium || ''
    priceMediumInput.value = p.priceMedium ? formatNumber(p.priceMedium) : ''
    capitalPriceMediumInput.value = p.capitalPriceMedium ? formatNumber(p.capitalPriceMedium) : ''
    
    // Auto expand jika produk memiliki fitur grosir
    if (p.unitBig || (p.conversion && p.conversion > 1) || p.unitMedium) {
      wholesaleGroup.classList.remove('hidden')
      wholesaleChevron.classList.add('rotate-180')
    } else {
      wholesaleGroup.classList.add('hidden')
      wholesaleChevron.classList.remove('rotate-180')
    }
  } else {
    // Create Mode
    title.textContent = 'Tambah Produk'
    idInput.value = ''
    nameInput.value = ''
    categoryInput.value = ''
    imageInput.value = ''
    stockInput.value = ''
    capitalPriceInput.value = ''
    priceInput.value = ''
    unitInput.value = ''
    unitBigInput.value = ''
    conversionInput.value = ''
    priceBigInput.value = ''
    capitalPriceBigInput.value = ''
    unitMediumInput.value = ''
    conversionMediumInput.value = ''
    priceMediumInput.value = ''
    capitalPriceMediumInput.value = ''
    document.getElementById('wholesalePriceInfo').classList.add('hidden')
    document.getElementById('wholesalePriceInfoMedium').classList.add('hidden')
    
    wholesaleGroup.classList.add('hidden')
    wholesaleChevron.classList.remove('rotate-180')
  }
  nameInput.focus()
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden')
}

function toggleWholesale() {
  const group = document.getElementById('wholesaleInputGroup')
  const chevron = document.getElementById('wholesaleChevron')
  
  if (group.classList.contains('hidden')) {
    group.classList.remove('hidden')
    chevron.classList.add('rotate-180')
  } else {
    group.classList.add('hidden')
    chevron.classList.remove('rotate-180')
  }
}

function saveProduct() {
  const id = document.getElementById('prodId').value
  const name = document.getElementById('prodName').value
  const category = document.getElementById('prodCategory').value || 'Lainnya'
  const image = document.getElementById('prodImage').value
  const stock = Number(document.getElementById('prodStock').value)
  const capitalPrice = getNumber(document.getElementById('prodCapitalPrice').value)
  const price = getNumber(document.getElementById('prodPrice').value)
  const unit = document.getElementById('prodUnit').value
  const unitBig = document.getElementById('prodUnitBig').value
  const conversion = Number(document.getElementById('prodConversion').value)
  const priceBig = getNumber(document.getElementById('prodPriceBig').value)
  const unitMedium = document.getElementById('prodUnitMedium').value
  const conversionMedium = Number(document.getElementById('prodConversionMedium').value)
  const priceMedium = getNumber(document.getElementById('prodPriceMedium').value)
  const capitalPriceMedium = getNumber(document.getElementById('prodCapitalPriceMedium').value)

  if (!name || !price) return showAlert('Mohon lengkapi nama, stok, dan harga')

  if (id) {
    // Update existing
    const p = products.find(x => x.id == id)
    if (p) {
      p.name = name
      p.category = category
      p.image = image
      p.stock = stock
      p.capitalPrice = capitalPrice
      p.price = price
      p.unit = unit
      p.unitBig = unitBig
      p.conversion = conversion
      p.priceBig = priceBig
      p.unitMedium = unitMedium
      p.conversionMedium = conversionMedium
      p.priceMedium = priceMedium
      p.capitalPriceMedium = capitalPriceMedium
    }
  } else {
    // Create new
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1
    products.push({ id: newId, name, category, price, capitalPrice, image, stock, unit, unitBig, conversion, priceBig, unitMedium, conversionMedium, priceMedium, capitalPriceMedium })
  }

  saveProductsData()
  closeProductModal()
  renderProductManagement()
  renderCategories() // Update list kategori jika ada kategori baru
  renderProducts() // Refresh POS grid
}

function openStockModal(id) {
  const p = products.find(x => x.id === id)
  if (!p) return
  
  document.getElementById('stockProdId').value = p.id
  document.getElementById('stockCurrent').textContent = p.stock
  document.getElementById('stockType').value = 'add'
  document.getElementById('stockAmount').value = ''
  
  document.getElementById('stockModal').classList.remove('hidden')
  document.getElementById('stockAmount').focus()
}

function closeStockModal() {
  document.getElementById('stockModal').classList.add('hidden')
}

function saveStock() {
  const id = Number(document.getElementById('stockProdId').value)
  const type = document.getElementById('stockType').value
  const amount = Number(document.getElementById('stockAmount').value)
  
  if (amount < 0) return showAlert('Jumlah tidak boleh negatif')
  if (!amount && type !== 'set' && amount !== 0) return showAlert('Masukkan jumlah')

  const p = products.find(x => x.id === id)
  if (p) {
    if (type === 'add') p.stock += amount
    else if (type === 'subtract') p.stock = Math.max(0, p.stock - amount)
    else if (type === 'set') p.stock = amount
    
    saveProductsData()
    renderProductManagement()
    renderProducts()
    showAlert('Stok berhasil diperbarui')
    closeStockModal()
  }
}

function deleteProduct(id) {
  showConfirm('Yakin ingin menghapus produk ini?', () => {
    const idx = products.findIndex(p => p.id === id)
    if (idx !== -1) {
      products.splice(idx, 1)
      saveProductsData()
      
      // Karena key keranjang sekarang string (misal "1-base"), kita harus loop
      Object.keys(cart).forEach(key => {
        if (cart[key].id === id) delete cart[key]
      })
      renderCart()
      
      renderProductManagement()
      renderCategories()
      renderProducts()
    }
  })
}

/* INIT */
function setupCurrencyInput(el) {
  el.addEventListener('input', function() {
    const val = this.value.replace(/\D/g, '')
    this.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    if (this.id === 'cashInput') updateChange()
  })
}

setupCurrencyInput(cashInput)
setupCurrencyInput(document.getElementById('prodPrice'))
setupCurrencyInput(document.getElementById('prodCapitalPrice'))
setupCurrencyInput(document.getElementById('prodPriceBig'))
setupCurrencyInput(document.getElementById('prodCapitalPriceBig'))
setupCurrencyInput(document.getElementById('prodPriceMedium'))
setupCurrencyInput(document.getElementById('prodCapitalPriceMedium'))
setupCurrencyInput(discountInput)
discountInput.addEventListener('input', updateCartTotals)
discountType.addEventListener('change', updateCartTotals)
searchInput.addEventListener('input', renderProducts)
prodSearchInput.addEventListener('input', renderProductManagement)
prodSortInput.addEventListener('change', renderProductManagement)
loadSettings()
renderCategories()
renderProducts()
renderCart()

// Logic Sinkronisasi Harga Modal (Eceran <-> Grosir)
const elCapBase = document.getElementById('prodCapitalPrice')
const elCapMedium = document.getElementById('prodCapitalPriceMedium')
const elConvMedium = document.getElementById('prodConversionMedium')
const elCapBig = document.getElementById('prodCapitalPriceBig')
const elConvBig = document.getElementById('prodConversion')

function syncCapitalPrice(source) {
  const base = getNumber(elCapBase.value)
  const medium = getNumber(elCapMedium.value)
  const big = getNumber(elCapBig.value)
  const convMedium = Number(elConvMedium.value) || 1
  const convBig = Number(elConvBig.value) || 1

  if (source === 'base') {
    // Ubah Eceran -> Update Menengah & Besar
    elCapMedium.value = formatNumber(base * convMedium)
    elCapBig.value = formatNumber(base * convBig)
  } 
  else if (source === 'medium') {
    // Reverse sync dimatikan agar Anda bisa input HPP Menengah manual (misal lebih murah)
    // tanpa mengubah HPP Eceran secara otomatis.
  }
  else if (source === 'big') {
    // Reverse sync dimatikan agar Anda bisa input HPP Besar manual.
  }
  else if (source === 'convMedium') {
    // Ubah Konversi Menengah -> Update Harga Menengah
    elCapMedium.value = formatNumber(base * convMedium)
  }
  else if (source === 'convBig') {
    // Ubah Konversi Besar -> Update Harga Besar
    elCapBig.value = formatNumber(base * convBig)
  }
}

// Logic Sinkronisasi Harga Jual (Otomatis isi jika kosong saat konversi diinput)
const elPriceBase = document.getElementById('prodPrice')
const elPriceMedium = document.getElementById('prodPriceMedium')
const elPriceBig = document.getElementById('prodPriceBig')

function syncSellingPrice(source) {
  const base = getNumber(elPriceBase.value)
  const convMedium = Number(elConvMedium.value) || 1
  const convBig = Number(elConvBig.value) || 1

  if (source === 'convMedium') {
    // Update otomatis saat konversi berubah
    elPriceMedium.value = formatNumber(base * convMedium)
  } else if (source === 'convBig') {
    // Update otomatis saat konversi berubah
    elPriceBig.value = formatNumber(base * convBig)
  }
}

elCapBase.addEventListener('input', () => syncCapitalPrice('base'))
elCapMedium.addEventListener('input', () => syncCapitalPrice('medium'))
elCapBig.addEventListener('input', () => syncCapitalPrice('big'))

// Event Listener untuk Konversi (Trigger HPP, Harga Jual, dan Info)
elConvMedium.addEventListener('input', () => {
  syncCapitalPrice('convMedium')
  syncSellingPrice('convMedium')
  updateWholesaleInfo()
})
elConvBig.addEventListener('input', () => {
  syncCapitalPrice('convBig')
  syncSellingPrice('convBig')
  updateWholesaleInfo()
})

// Logic Info Selisih Harga Jual (Eceran vs Grosir)
function updateWholesaleInfo() {
  const price = getNumber(elPriceBase.value)
  
  // Helper untuk update info
  const updateInfo = (convEl, priceEl, infoElId) => {
    const conv = Number(convEl.value)
    const pVal = getNumber(priceEl.value)
    const infoEl = document.getElementById(infoElId)
    
    if (price > 0 && conv > 1 && pVal > 0) {
      const normal = price * conv
      const diff = normal - pVal
      if (diff > 0) {
        infoEl.innerHTML = `✅ Lebih hemat <b>${rupiah(diff)}</b> dibanding eceran`
        infoEl.className = 'text-[10px] text-green-600 mt-1'
        infoEl.classList.remove('hidden')
      } else if (diff < 0) {
        infoEl.innerHTML = `⚠️ Lebih mahal <b>${rupiah(Math.abs(diff))}</b> dibanding eceran`
        infoEl.className = 'text-[10px] text-orange-500 mt-1'
        infoEl.classList.remove('hidden')
      } else infoEl.classList.add('hidden')
    } else infoEl.classList.add('hidden')
  }

  updateInfo(elConvMedium, elPriceMedium, 'wholesalePriceInfoMedium')
  updateInfo(elConvBig, elPriceBig, 'wholesalePriceInfo')
}

elPriceBase.addEventListener('input', updateWholesaleInfo)
elPriceMedium.addEventListener('input', updateWholesaleInfo)
elPriceBig.addEventListener('input', updateWholesaleInfo)

/* CUSTOM CONFIRM MODAL */
let pendingConfirmAction = null

function showConfirm(message, action, yesLabel = 'Ya, Hapus', noLabel = 'Batal') {
  document.getElementById('confirmMessage').textContent = message
  document.getElementById('confirmYesBtn').textContent = yesLabel
  document.getElementById('confirmCancelBtn').textContent = noLabel
  document.getElementById('confirmModal').classList.remove('hidden')
  pendingConfirmAction = action
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.add('hidden')
  pendingConfirmAction = null
}

function confirmAction() {
  try {
    if (pendingConfirmAction) pendingConfirmAction()
  } catch (e) {
    console.error(e)
  }
  closeConfirmModal()
}

/* CUSTOM ALERT MODAL */
function showAlert(message) {
  const modal = document.getElementById('alertModal')
  const iconBg = document.getElementById('alertIconBg')
  const icon = document.getElementById('alertIcon')
  const title = document.getElementById('alertTitle')
  const msgEl = document.getElementById('alertMessage')
  
  msgEl.textContent = message
  
  // Auto-styling berdasarkan isi pesan
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('berhasil') || lowerMsg.includes('sukses')) {
    iconBg.className = 'w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4'
    icon.setAttribute('data-lucide', 'check-circle')
    title.textContent = 'Berhasil'
  } else if (lowerMsg.includes('gagal') || lowerMsg.includes('kurang') || lowerMsg.includes('kosong') || lowerMsg.includes('wajib') || lowerMsg.includes('mohon')) {
    iconBg.className = 'w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4'
    icon.setAttribute('data-lucide', 'alert-circle')
    title.textContent = 'Perhatian'
  } else {
    iconBg.className = 'w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4'
    icon.setAttribute('data-lucide', 'info')
    title.textContent = 'Info'
  }
  
  lucide.createIcons()
  modal.classList.remove('hidden')
}

function closeAlertModal() {
  document.getElementById('alertModal').classList.add('hidden')
}

/* UNIT INFO MODAL */
function openUnitInfo() {
  document.getElementById('unitInfoModal').classList.remove('hidden')
}

function closeUnitInfo() {
  document.getElementById('unitInfoModal').classList.add('hidden')
}

// Inisialisasi ikon Lucide untuk elemen statis (Sidebar, dll)
lucide.createIcons()
