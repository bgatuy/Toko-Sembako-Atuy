import { getFromStorage, saveToStorage } from './storage.js';
import { rupiah, formatNumber, getNumber, showAlert, showConfirm } from './helpers.js';
import { appSettings } from './settings.js';
import { addToCart, renderCart, cart } from './cart.js';

export let products = getFromStorage('products') || [
  { id: 1, name: 'Beras Premium', price: 14000, capitalPrice: 12000, image: 'beras.jpg', stock: 100, category: 'Sembako', unit: 'Kg', unitBig: 'Karung 5kg', conversion: 5, priceBig: 65000 },
  { id: 2, name: 'Gula Pasir', price: 15000, capitalPrice: 13500, image: 'gula.jpg', stock: 50, category: 'Sembako', unit: 'Kg' },
  { id: 3, name: 'Minyak Goreng', price: 18000, capitalPrice: 16000, image: 'minyak.jpg', stock: 24, category: 'Sembako', unit: 'Liter' },
  { id: 4, name: 'Telur Ayam', price: 2000, capitalPrice: 1800, image: 'telur.jpg', stock: 300, category: 'Sembako', unit: 'Butir', unitBig: 'Rak', conversion: 30, priceBig: 58000 }
];

export function saveProductsData() {
  saveToStorage('products', products);
}

let currentCategory = 'Semua';

export function renderCategories() {
  const container = document.getElementById('categoryFilters')
  if (!container) return

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

export function filterCategory(cat) {
  currentCategory = cat
  renderCategories()
  renderProducts()
}

export function renderProducts() {
  const productGrid = document.getElementById('productGrid')
  const searchInput = document.getElementById('search')
  if (!productGrid) return

  productGrid.innerHTML = ''
  const term = searchInput ? searchInput.value.toLowerCase() : ''

  const LOW_STOCK_LIMIT = appSettings.lowStockLimit || 10;
  products.filter(p => {
    const matchName = p.name.toLowerCase().includes(term)
    const matchCat = currentCategory === 'Semua' || (p.category || 'Lainnya') === currentCategory
    return matchName && matchCat
  }).forEach(p => {
    const el = document.createElement('div')
    el.className = 'bg-white rounded-2xl shadow-soft p-4 cursor-pointer'

    let imgSrc = ''
    if (p.image) {
      // Cek apakah gambar adalah Base64 (hasil upload) atau path file biasa (bawaan)
      if (p.image.startsWith('data:')) imgSrc = p.image
      else imgSrc = `assets/images/${p.image}`
    }

    const imgHtml = imgSrc
      ? `<img src="${imgSrc}" class="h-28 w-full object-contain bg-gray-50 rounded-xl mb-3" alt="${p.name}">`
      : `<div class="h-28 bg-gray-200 rounded-xl mb-3 flex items-center justify-center"><i data-lucide="image" class="text-gray-400"></i></div>`

    let stockHtml = '';
    if (p.stock === 0) {
      stockHtml = `<span class="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">Habis</span>`;
    } else if (p.stock <= LOW_STOCK_LIMIT) {
      stockHtml = `<span class="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded animate-pulse">Stok: ${Number(p.stock).toLocaleString('id-ID')} (Menipis)</span>`;
    } else {
      stockHtml = `<span class="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Stok: ${Number(p.stock).toLocaleString('id-ID')}</span>`;
    }

    const unitLabel = p.unit ? `<span class="text-[10px] text-gray-400">/${p.unit}</span>` : ''

    el.innerHTML = `
      ${imgHtml}
      <div class="text-sm font-medium">${p.name}</div>
      <div class="flex justify-between items-center mt-1"><div class="text-xs text-gray-500">${rupiah(p.price)} ${unitLabel}</div>${stockHtml}</div>
    `
    if (p.stock > 0) {
      if ((p.unitBig && p.conversion > 1) || (p.unitMedium && p.conversionMedium > 1)) el.onclick = () => openUnitSelection(p)
      else el.onclick = () => addToCart(p)
    }
    else el.classList.add('opacity-60', 'cursor-not-allowed')

    productGrid.appendChild(el)
  })
  if (window.lucide) window.lucide.createIcons()
}

export function openUnitSelection(product) {
  const modal = document.getElementById('unitSelectionModal')
  document.getElementById('unitSelectProductName').textContent = product.name
  
  const btnBase = document.getElementById('btnSelectBase')
  document.getElementById('labelUnitBase').textContent = product.unit || 'Pcs'
  document.getElementById('priceUnitBase').textContent = rupiah(product.price)
  btnBase.onclick = () => {
    addToCart(product, 'base')
    closeUnitSelection()
  }

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

  const btnBig = document.getElementById('btnSelectBig')
  document.getElementById('labelUnitBig').textContent = product.unitBig || 'Dus'
  document.getElementById('priceUnitBig').textContent = rupiah(product.priceBig || product.price * product.conversion)

  btnBig.onclick = () => {
    addToCart(product, 'big')
    closeUnitSelection()
  }

  modal.classList.remove('hidden')
}

export function closeUnitSelection() {
  document.getElementById('unitSelectionModal').classList.add('hidden')
}

export function renderProductManagement() {
  const tbody = document.getElementById('productTableBody')
  const prodSearchInput = document.getElementById('prodSearch')
  const prodSortInput = document.getElementById('prodSort')
  
  if (!tbody) return
  tbody.innerHTML = ''
  const term = prodSearchInput ? prodSearchInput.value.toLowerCase() : ''
  const sortType = prodSortInput ? prodSortInput.value : ''

  let filtered = products.filter(p => p.name.toLowerCase().includes(term))

  if (sortType === 'stock_asc') filtered.sort((a, b) => a.stock - b.stock)
  else if (sortType === 'price_asc') filtered.sort((a, b) => a.price - b.price)
  else if (sortType === 'price_desc') filtered.sort((a, b) => b.price - a.price)
  else filtered.sort((a, b) => a.id - b.id)
  
  const LOW_STOCK_LIMIT = appSettings.lowStockLimit || 10;
  filtered.forEach(p => {
    let stockDisplay = `<span class="text-gray-600">${p.stock}</span>`;
    if (p.stock === 0) {
      stockDisplay = `<span class="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold">Habis</span>`;
    } else if (p.stock <= LOW_STOCK_LIMIT) {
      stockDisplay = `<span class="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-xs font-bold animate-pulse">${p.stock} (Menipis)</span>`;
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
  if (window.lucide) window.lucide.createIcons()
}

export function openProductModal(id = null) {
  const modal = document.getElementById('productModal')
  const title = document.getElementById('modalTitle')
  const idInput = document.getElementById('prodId')
  const wholesaleGroup = document.getElementById('wholesaleInputGroup')
  const wholesaleChevron = document.getElementById('wholesaleChevron')
  const previewContainer = document.getElementById('prodImagePreviewContainer')
  const previewImg = document.getElementById('prodImagePreview')
  const imageInput = document.getElementById('prodImage')

  modal.classList.remove('hidden')
  
  if (id) {
    const p = products.find(x => x.id === id)
    title.textContent = 'Edit Produk'
    idInput.value = p.id
    document.getElementById('prodName').value = p.name
    document.getElementById('prodCategory').value = p.category || ''
    imageInput.value = '' // Reset input file
    document.getElementById('prodStock').value = p.stock
    document.getElementById('prodCapitalPrice').value = formatNumber(p.capitalPrice || 0)
    document.getElementById('prodPrice').value = formatNumber(p.price)
    document.getElementById('prodUnit').value = p.unit || 'Pcs'
    document.getElementById('prodUnitBig').value = p.unitBig || ''
    document.getElementById('prodConversion').value = p.conversion || ''
    document.getElementById('prodPriceBig').value = p.priceBig ? formatNumber(p.priceBig) : ''
    document.getElementById('prodCapitalPriceBig').value = (p.capitalPrice && p.conversion) ? formatNumber(p.capitalPrice * p.conversion) : ''
    document.getElementById('prodUnitMedium').value = p.unitMedium || ''
    document.getElementById('prodConversionMedium').value = p.conversionMedium || ''
    document.getElementById('prodPriceMedium').value = p.priceMedium ? formatNumber(p.priceMedium) : ''
    document.getElementById('prodCapitalPriceMedium').value = p.capitalPriceMedium ? formatNumber(p.capitalPriceMedium) : ''
    
    // Setup Preview Gambar
    if (p.image) {
      previewImg.src = p.image.startsWith('data:') ? p.image : `assets/images/${p.image}`
      previewContainer.classList.remove('hidden')
      previewContainer.classList.add('flex')
    } else {
      previewImg.src = ''
      previewContainer.classList.add('hidden')
      previewContainer.classList.remove('flex')
    }

    if (p.unitBig || (p.conversion && p.conversion > 1) || p.unitMedium) {
      wholesaleGroup.classList.remove('hidden')
      wholesaleChevron.classList.add('rotate-180')
    } else {
      wholesaleGroup.classList.add('hidden')
      wholesaleChevron.classList.remove('rotate-180')
    }
  } else {
    title.textContent = 'Tambah Produk'
    idInput.value = ''
    document.getElementById('prodName').value = ''
    document.getElementById('prodCategory').value = ''
    imageInput.value = ''
    document.getElementById('prodStock').value = ''
    document.getElementById('prodCapitalPrice').value = ''
    document.getElementById('prodPrice').value = ''
    document.getElementById('prodUnit').value = ''
    document.getElementById('prodUnitBig').value = ''
    document.getElementById('prodConversion').value = ''
    document.getElementById('prodPriceBig').value = ''
    document.getElementById('prodCapitalPriceBig').value = ''
    document.getElementById('prodUnitMedium').value = ''
    document.getElementById('prodConversionMedium').value = ''
    document.getElementById('prodPriceMedium').value = ''
    document.getElementById('prodCapitalPriceMedium').value = ''
    document.getElementById('wholesalePriceInfo').classList.add('hidden')
    document.getElementById('wholesalePriceInfoMedium').classList.add('hidden')
    
    previewImg.src = ''
    previewContainer.classList.add('hidden')
    previewContainer.classList.remove('flex')
    
    wholesaleGroup.classList.add('hidden')
    wholesaleChevron.classList.remove('rotate-180')
  }
  document.getElementById('prodName').focus()
}

export function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden')
}

export function handleProductImageUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = function(e) {
      document.getElementById('prodImagePreview').src = e.target.result
      const container = document.getElementById('prodImagePreviewContainer')
      container.classList.remove('hidden')
      container.classList.add('flex')
    }
    reader.readAsDataURL(input.files[0])
  }
}

export function removeProductImage() {
  document.getElementById('prodImage').value = ''
  const container = document.getElementById('prodImagePreviewContainer')
  container.classList.add('hidden')
  container.classList.remove('flex')
  document.getElementById('prodImagePreview').src = ''
}

export function toggleWholesale() {
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

export function saveProduct() {
  const id = document.getElementById('prodId').value
  const name = document.getElementById('prodName').value
  const category = document.getElementById('prodCategory').value || 'Lainnya'
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

  // Handle Image Logic
  const imageInput = document.getElementById('prodImage')
  const previewContainer = document.getElementById('prodImagePreviewContainer')
  const file = imageInput.files[0]

  const finishSave = (imageData) => {
    if (id) {
      const p = products.find(x => x.id == id)
      if (p) {
        p.name = name
        p.category = category
        p.image = imageData
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
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1
      products.push({ id: newId, name, category, price, capitalPrice, image: imageData, stock, unit, unitBig, conversion, priceBig, unitMedium, conversionMedium, priceMedium, capitalPriceMedium })
    }

    saveProductsData()
    closeProductModal()
    renderProductManagement()
    renderCategories()
    renderProducts()
  }

  if (file) {
    // Jika ada file baru diupload
    const reader = new FileReader()
    reader.onload = (e) => finishSave(e.target.result)
    reader.readAsDataURL(file)
  } else {
    // Jika tidak ada file baru
    let finalImage = ''
    if (id && !previewContainer.classList.contains('hidden')) {
      // Jika edit dan preview masih ada, gunakan gambar lama
      const p = products.find(x => x.id == id)
      if (p) finalImage = p.image
    }
    // Jika preview hidden, berarti gambar dihapus atau memang kosong -> finalImage = ''
    finishSave(finalImage)
  }
}

export function openStockModal(id) {
  const p = products.find(x => x.id === id)
  if (!p) return
  
  document.getElementById('stockProdId').value = p.id
  document.getElementById('stockCurrent').textContent = p.stock
  document.getElementById('stockType').value = 'add'
  document.getElementById('stockAmount').value = ''
  
  document.getElementById('stockModal').classList.remove('hidden')
  document.getElementById('stockAmount').focus()
}

export function closeStockModal() {
  document.getElementById('stockModal').classList.add('hidden')
}

export function saveStock() {
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

export function deleteProduct(id) {
  showConfirm('Yakin ingin menghapus produk ini?', () => {
    const idx = products.findIndex(p => p.id === id)
    if (idx !== -1) {
      products.splice(idx, 1)
      saveProductsData()
      
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