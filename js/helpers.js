export function rupiah(num) {
  return "Rp " + (Number(num) || 0).toLocaleString("id-ID");
}

export function getNumber(str) {
  if (typeof str === "number") return str;
  return Number(str.replace(/\./g, "") || 0);
}

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function getYMD(timestamp) {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function setupCurrencyInput(el, callback) {
  el.addEventListener("input", function () {
    const val = this.value.replace(/\D/g, "");
    this.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (callback) callback();
  });
}

// UI Helpers
export function showAlert(message) {
  const modal = document.getElementById("alertModal");
  const iconBg = document.getElementById("alertIconBg");
  const icon = document.getElementById("alertIcon");
  const title = document.getElementById("alertTitle");
  const msgEl = document.getElementById("alertMessage");

  msgEl.textContent = message;

  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("berhasil") || lowerMsg.includes("sukses")) {
    iconBg.className =
      "w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4";
    icon.setAttribute("data-lucide", "check-circle");
    title.textContent = "Berhasil";
  } else if (
    lowerMsg.includes("gagal") ||
    lowerMsg.includes("kurang") ||
    lowerMsg.includes("kosong") ||
    lowerMsg.includes("wajib") ||
    lowerMsg.includes("mohon")
  ) {
    iconBg.className =
      "w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4";
    icon.setAttribute("data-lucide", "alert-circle");
    title.textContent = "Perhatian";
  } else {
    iconBg.className =
      "w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4";
    icon.setAttribute("data-lucide", "info");
    title.textContent = "Info";
  }

  if (window.lucide) window.lucide.createIcons();
  modal.classList.remove("hidden");
}

export function closeAlertModal() {
  document.getElementById("alertModal").classList.add("hidden");
}

let pendingConfirmAction = null;
export function showConfirm(
  message,
  action,
  yesLabel = "Ya, Hapus",
  noLabel = "Batal",
) {
  document.getElementById("confirmMessage").textContent = message;
  document.getElementById("confirmYesBtn").textContent = yesLabel;
  document.getElementById("confirmCancelBtn").textContent = noLabel;
  document.getElementById("confirmModal").classList.remove("hidden");
  pendingConfirmAction = action;
}

export function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
  pendingConfirmAction = null;
}

export function confirmAction() {
  try {
    if (pendingConfirmAction) pendingConfirmAction();
  } catch (e) {
    console.error(e);
  }
  closeConfirmModal();
}

export function openUnitInfo() {
  document.getElementById("unitInfoModal").classList.remove("hidden");
}

export function closeUnitInfo() {
  document.getElementById("unitInfoModal").classList.add("hidden");
}

export function generateReceiptHTML(data, settings) {
  const items = data.items || [];
  const methodLabel = data.paymentMethod
    ? data.paymentMethod.toUpperCase()
    : "TUNAI";

  const itemsHtml = items
    .map(
      (item) => `
    <div style="margin-bottom: 5px;">
      <div class="row" style="margin-bottom: 2px;">
        <span style="flex:1;">${item.name}</span>
        <span>${rupiah(item.total)}</span>
      </div>
      <div style="font-size: 9px; color: #000;">${item.qty} x ${rupiah(item.price)}</div>
    </div>
  `,
    )
    .join("");

  let logoHtml = "";
  if (settings.receiptLogo) {
    logoHtml = `<div style="display: flex; justify-content: center; margin-bottom: 5px;"><img src="${settings.receiptLogo}" style="max-width:48px;max-height:48px;" /></div>`;
  } else {
    logoHtml = `<div style="display: flex; justify-content: center; margin-bottom: 5px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
    </div>`;
  }

  const paperSize = "48mm";
  const fontSize = "10px";
  const padding = "2mm";

  return `
    <html>
      <head>
        <title>Struk - ${settings.storeName}</title>
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
            <div class="store-name">${settings.storeName}</div>
            <div class="store-address">${settings.storeAddress}</div>
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
            ${data.paymentMethod === "cash" || !data.paymentMethod ? `<div class="row"><span>Tunai:</span> <span>${rupiah(data.cash)}</span></div>` : ""}
            ${(data.paymentMethod === "cash" || !data.paymentMethod) && data.change ? `<div class="row"><span>Kembali:</span> <span>${rupiah(data.change)}</span></div>` : ""}
          </div>
          <div style="text-align:center; margin-top:20px; font-size:12px;">${settings.receiptFooter || "Terima Kasih!"}</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
    </html>
  `;
}
