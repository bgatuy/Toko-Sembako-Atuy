import * as Helpers from './helpers.js';
import * as Storage from './storage.js';
import * as Settings from './settings.js';
import * as Product from './product.js';
import * as Cart from './cart.js';
import * as Checkout from './checkout.js';
import * as Transaction from './transaction.js';
import * as Stats from './stats.js';

// Expose functions to window for HTML onclick handlers
Object.assign(window, Helpers);
Object.assign(window, Storage);
Object.assign(window, Settings);
Object.assign(window, Product);
Object.assign(window, Cart);
Object.assign(window, Checkout);
Object.assign(window, Transaction);
Object.assign(window, Stats);

// Navigation
window.switchView = function(viewName) {
  const views = ['pos', 'products', 'stats', 'history', 'settings']
  
  views.forEach(v => {
    const el = document.getElementById('view-' + v)
    const btn = document.getElementById('btn-' + v)
    
    if (v === viewName) {
      el.classList.remove('hidden')
      btn.classList.replace('bg-white/20', 'bg-white/30')
      if (v === 'products') Product.renderProductManagement()
      if (v === 'stats') Stats.renderStats()
      if (v === 'history') Transaction.renderHistory()
      if (v === 'settings') Settings.renderSettings()
    } else {
      el.classList.add('hidden')
      btn.classList.replace('bg-white/30', 'bg-white/20')
    }
  })
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const cashInput = document.getElementById('cashInput')
  const discountInput = document.getElementById('discountInput')
  const discountType = document.getElementById('discountType')
  const searchInput = document.getElementById('search')
  const prodSearchInput = document.getElementById('prodSearch')
  const prodSortInput = document.getElementById('prodSort')

  if (cashInput) Helpers.setupCurrencyInput(cashInput, Checkout.updateChange)
  if (document.getElementById('prodPrice')) Helpers.setupCurrencyInput(document.getElementById('prodPrice'))
  if (document.getElementById('prodCapitalPrice')) Helpers.setupCurrencyInput(document.getElementById('prodCapitalPrice'))
  if (document.getElementById('prodPriceBig')) Helpers.setupCurrencyInput(document.getElementById('prodPriceBig'))
  if (document.getElementById('prodCapitalPriceBig')) Helpers.setupCurrencyInput(document.getElementById('prodCapitalPriceBig'))
  if (document.getElementById('prodPriceMedium')) Helpers.setupCurrencyInput(document.getElementById('prodPriceMedium'))
  if (document.getElementById('prodCapitalPriceMedium')) Helpers.setupCurrencyInput(document.getElementById('prodCapitalPriceMedium'))
  
  if (discountInput) {
    Helpers.setupCurrencyInput(discountInput)
    discountInput.addEventListener('input', Cart.updateCartTotals)
  }
  if (discountType) discountType.addEventListener('change', Cart.updateCartTotals)
  if (searchInput) searchInput.addEventListener('input', Product.renderProducts)
  if (prodSearchInput) prodSearchInput.addEventListener('input', Product.renderProductManagement)
  if (prodSortInput) prodSortInput.addEventListener('change', Product.renderProductManagement)

  // Sync Logic for Product Form
  const elCapBase = document.getElementById('prodCapitalPrice')
  const elCapMedium = document.getElementById('prodCapitalPriceMedium')
  const elConvMedium = document.getElementById('prodConversionMedium')
  const elCapBig = document.getElementById('prodCapitalPriceBig')
  const elConvBig = document.getElementById('prodConversion')
  const elPriceBase = document.getElementById('prodPrice')
  const elPriceMedium = document.getElementById('prodPriceMedium')
  const elPriceBig = document.getElementById('prodPriceBig')

  function syncCapitalPrice(source) {
    const base = Helpers.getNumber(elCapBase.value)
    const convMedium = Number(elConvMedium.value) || 1
    const convBig = Number(elConvBig.value) || 1

    if (source === 'base') {
      elCapMedium.value = Helpers.formatNumber(base * convMedium)
      elCapBig.value = Helpers.formatNumber(base * convBig)
    } else if (source === 'convMedium') {
      elCapMedium.value = Helpers.formatNumber(base * convMedium)
    } else if (source === 'convBig') {
      elCapBig.value = Helpers.formatNumber(base * convBig)
    }
  }

  function syncSellingPrice(source) {
    const base = Helpers.getNumber(elPriceBase.value)
    const convMedium = Number(elConvMedium.value) || 1
    const convBig = Number(elConvBig.value) || 1

    if (source === 'convMedium') {
      elPriceMedium.value = Helpers.formatNumber(base * convMedium)
    } else if (source === 'convBig') {
      elPriceBig.value = Helpers.formatNumber(base * convBig)
    }
  }

  function updateWholesaleInfo() {
    const price = Helpers.getNumber(elPriceBase.value)
    
    const updateInfo = (convEl, priceEl, infoElId) => {
      const conv = Number(convEl.value)
      const pVal = Helpers.getNumber(priceEl.value)
      const infoEl = document.getElementById(infoElId)
      
      if (price > 0 && conv > 1 && pVal > 0) {
        const normal = price * conv
        const diff = normal - pVal
        if (diff > 0) {
          infoEl.innerHTML = `✅ Lebih hemat <b>${Helpers.rupiah(diff)}</b> dibanding eceran`
          infoEl.className = 'text-[10px] text-green-600 mt-1'
          infoEl.classList.remove('hidden')
        } else if (diff < 0) {
          infoEl.innerHTML = `⚠️ Lebih mahal <b>${Helpers.rupiah(Math.abs(diff))}</b> dibanding eceran`
          infoEl.className = 'text-[10px] text-orange-500 mt-1'
          infoEl.classList.remove('hidden')
        } else infoEl.classList.add('hidden')
      } else infoEl.classList.add('hidden')
    }

    updateInfo(elConvMedium, elPriceMedium, 'wholesalePriceInfoMedium')
    updateInfo(elConvBig, elPriceBig, 'wholesalePriceInfo')
  }

  if (elCapBase) elCapBase.addEventListener('input', () => syncCapitalPrice('base'))
  if (elCapMedium) elCapMedium.addEventListener('input', () => syncCapitalPrice('medium'))
  if (elCapBig) elCapBig.addEventListener('input', () => syncCapitalPrice('big'))
  
  if (elConvMedium) elConvMedium.addEventListener('input', () => {
    syncCapitalPrice('convMedium')
    syncSellingPrice('convMedium')
    updateWholesaleInfo()
  })
  if (elConvBig) elConvBig.addEventListener('input', () => {
    syncCapitalPrice('convBig')
    syncSellingPrice('convBig')
    updateWholesaleInfo()
  })

  if (elPriceBase) elPriceBase.addEventListener('input', updateWholesaleInfo)
  if (elPriceMedium) elPriceMedium.addEventListener('input', updateWholesaleInfo)
  if (elPriceBig) elPriceBig.addEventListener('input', updateWholesaleInfo)

  // Initial Load
  Settings.loadSettings()
  Product.renderCategories()
  Product.renderProducts()
  Cart.renderCart()
  if (window.lucide) window.lucide.createIcons()
});
