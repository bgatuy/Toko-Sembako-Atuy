import { getFromStorage, saveToStorage } from './storage.js';
import { rupiah, getYMD, showAlert, showConfirm, generateReceiptHTML } from './helpers.js';
import { appSettings } from './settings.js';

export let transactions = getFromStorage('transactions') || [];
let currentPage = 1;
const itemsPerPage = 5;

export function renderHistory(resetPage = false) {
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
  
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1
  if (currentPage > totalPages) currentPage = totalPages
  if (currentPage < 1) currentPage = 1
  
  const start = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredTransactions.slice(start, start + itemsPerPage)
  
  document.getElementById('pageInfo').textContent = `Halaman ${currentPage} dari ${totalPages}`
  document.getElementById('btnPrev').disabled = currentPage === 1
  document.getElementById('btnNext').disabled = currentPage === totalPages

  const tbody = document.getElementById('transactionTableBody')
  if (!tbody) return
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

export function showTransactionDetail(id) {
  currentDetailId = id
  const t = transactions.find(x => x.id === id)
  if (!t) return

  document.getElementById('detailId').textContent = '#' + t.id
  document.getElementById('detailDate').textContent = t.date
  
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
  if (window.lucide) window.lucide.createIcons()
}

export function printTransactionDetail() {
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
  }, appSettings)
  
  const win = window.open('', '', 'width=400,height=600')
  if (win) {
    win.document.write(html)
    win.document.close()
  } else {
    alert('Pop-up diblokir. Izinkan pop-up untuk mencetak.')
  }
}

export function closeTransactionDetailModal() {
  document.getElementById('transactionDetailModal').classList.add('hidden')
}

export function prevPage() {
  if (currentPage > 1) {
    currentPage--
    renderHistory()
  }
}

export function nextPage() {
  currentPage++
  renderHistory()
}

export function resetHistory() {
  if (transactions.length === 0) return showAlert('Riwayat transaksi sudah kosong.')
  
  showConfirm('Yakin ingin menghapus semua riwayat transaksi?', () => {
    transactions.length = 0 // Clear array
    saveToStorage('transactions', transactions)
    renderHistory()
    if (window.renderStats) window.renderStats()
    showAlert('Riwayat transaksi berhasil dihapus.')
  })
}

export function exportToExcel() {
  const startDate = document.getElementById('historyStartDate').value
  const endDate = document.getElementById('historyEndDate').value
  const method = document.getElementById('historyPaymentMethod').value
  
  let data = transactions

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

  let csvContent = "Tanggal;ID Transaksi;Item;Metode;Subtotal;Diskon;Total;Modal;Laba\n"

  data.forEach(t => {
    const capital = t.itemsDetails ? t.itemsDetails.reduce((sum, i) => sum + ((i.capitalPrice || 0) * i.qty), 0) : 0
    const profit = t.total - capital
    const items = `"${t.items.replace(/"/g, '""')}"`
    
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

export function clearHistoryFilter() {
  document.getElementById('historyStartDate').value = ''
  document.getElementById('historyEndDate').value = ''
  document.getElementById('historyPaymentMethod').value = ''
  renderHistory(true)
}