import { products } from './product.js';
import { rupiah, getNumber, showAlert } from './helpers.js';

export const cart = {};

export function addToCart(product, unitType = 'base') {
  const cartKey = `${product.id}-${unitType}`
  
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

  const currentCartItem = cart[cartKey]
  const currentQtyInCart = currentCartItem ? currentCartItem.qty : 0
  
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
      cartKey: cartKey,
      name: displayName,
      price: price,
      capitalPrice: capitalPrice,
      qty: 0, 
      conversion: conversion,
      unitType: unitType
    }
  }
  
  cart[cartKey].qty++
  renderCart()
}

export function updateQty(cartKey, delta) {
  if (delta > 0) {
    const item = cart[cartKey]
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

export function getCartCalculations() {
  const discountInput = document.getElementById('discountInput')
  const discountType = document.getElementById('discountType')
  
  const subtotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0)
  const discVal = discountInput ? getNumber(discountInput.value) : 0
  const type = discountType ? discountType.value : 'nominal'
  
  let discount = 0
  if (type === 'percent') {
    const pct = Math.min(discVal, 100)
    discount = subtotal * (pct / 100)
  } else {
    discount = discVal
  }
  
  discount = Math.min(discount, subtotal)
  
  return {
    subtotal,
    discount,
    total: subtotal - discount
  }
}

export function renderCart() {
  const cartItems = document.getElementById('cartItems')
  const cartCountEl = document.getElementById('cartCount')
  if (!cartItems) return

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

  if (cartCountEl) cartCountEl.textContent = count
  updateCartTotals()
}

export function updateCartTotals() {
  const cartSubtotalEl = document.getElementById('cartSubtotal')
  const cartDiscountEl = document.getElementById('cartDiscount')
  const totalPriceEl = document.getElementById('totalPrice')
  
  const calc = getCartCalculations()
  
  if (cartSubtotalEl) cartSubtotalEl.textContent = rupiah(calc.subtotal)
  if (cartDiscountEl) cartDiscountEl.textContent = '- ' + rupiah(calc.discount)
  if (totalPriceEl) totalPriceEl.textContent = rupiah(calc.total)
  
  if (window.updateChange) window.updateChange()
}