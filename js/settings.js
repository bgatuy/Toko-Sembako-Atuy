import { getFromStorage, saveToStorage } from './storage.js';
import { showAlert } from './helpers.js';

export let appSettings = {
  storeName: 'Toko Sembako',
  storeAddress: 'Cabang Utama',
  lowStockLimit: 10,
  receiptHeader: '',
  receiptFooter: '',
  receiptLogo: ''
}

export function loadSettings() {
  const saved = getFromStorage('appSettings')
  if (saved) appSettings = { ...appSettings, ...saved }
  if (document.getElementById('sidebarStoreName')) document.getElementById('sidebarStoreName').textContent = appSettings.storeName
}

export function renderSettings() {
  const logoPreview = document.getElementById('settingLogoPreview');
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');
  const logoInput = document.getElementById('settingReceiptLogo');
  
  if (logoPreview) {
    if (appSettings.receiptLogo) {
      logoPreview.src = appSettings.receiptLogo;
      logoPreview.style.display = '';
      if (btnRemoveLogo) btnRemoveLogo.style.display = '';
    } else {
      logoPreview.src = '';
      logoPreview.style.display = 'none';
      if (btnRemoveLogo) btnRemoveLogo.style.display = 'none';
    }
  }

  if (logoInput) {
    logoInput.onchange = function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
          if (logoPreview) {
            logoPreview.src = ev.target.result;
            logoPreview.style.display = '';
            if (btnRemoveLogo) btnRemoveLogo.style.display = '';
          }
        }
        reader.readAsDataURL(file);
      }
    }
  }

  if (btnRemoveLogo) {
    btnRemoveLogo.onclick = function() {
      appSettings.receiptLogo = '';
      saveToStorage('appSettings', appSettings);
      if (logoPreview) {
        logoPreview.src = '';
        logoPreview.style.display = 'none';
      }
      if (btnRemoveLogo) btnRemoveLogo.style.display = 'none';
      if (logoInput) logoInput.value = '';
    }
  }

  document.getElementById('settingStoreName').value = appSettings.storeName
  document.getElementById('settingStoreAddress').value = appSettings.storeAddress
  if (document.getElementById('settingLowStockLimit')) document.getElementById('settingLowStockLimit').value = appSettings.lowStockLimit || 10
  if (document.getElementById('settingReceiptHeader')) document.getElementById('settingReceiptHeader').value = appSettings.receiptHeader || ''
  if (document.getElementById('settingReceiptFooter')) document.getElementById('settingReceiptFooter').value = appSettings.receiptFooter || ''
  if (document.getElementById('settingReceiptLogo')) document.getElementById('settingReceiptLogo').value = ''
}

export function saveSettings() {
  const name = document.getElementById('settingStoreName').value
  const address = document.getElementById('settingStoreAddress').value
  const lowStockLimit = parseInt(document.getElementById('settingLowStockLimit').value) || 1
  const receiptFooter = document.getElementById('settingReceiptFooter').value
  const logoInput = document.getElementById('settingReceiptLogo')
  
  if (!name) return showAlert('Nama toko wajib diisi')

  function finishSave(logoData) {
    appSettings = {
      storeName: name,
      storeAddress: address,
      lowStockLimit,
      receiptFooter,
      receiptLogo: logoData !== undefined ? logoData : (appSettings.receiptLogo || '')
    }
    saveToStorage('appSettings', appSettings)
    if (document.getElementById('sidebarStoreName')) document.getElementById('sidebarStoreName').textContent = name
    showAlert('Pengaturan berhasil disimpan')
  }

  if (logoInput && logoInput.files && logoInput.files[0]) {
    const reader = new FileReader()
    reader.onload = function(e) {
      finishSave(e.target.result)
    }
    reader.readAsDataURL(logoInput.files[0])
  } else {
    finishSave()
  }
}