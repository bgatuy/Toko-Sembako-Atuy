import { transactions } from "./transaction.js";
import { products } from "./product.js";
import { rupiah, getYMD } from "./helpers.js";

let salesChart = null;

export function clearStatsFilter() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  renderStats();
}

export function setStatsRange(range) {
  const end = new Date();
  const start = new Date();

  if (range === "7days") {
    start.setDate(end.getDate() - 6);
  } else if (range === "thisMonth") {
    start.setDate(1);
  } else if (range === "lastMonth") {
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    end.setDate(1);
    end.setDate(0);
  }

  document.getElementById("startDate").value = getYMD(start);
  document.getElementById("endDate").value = getYMD(end);
  renderStats();
}

export function renderStats() {
  const ctx = document.getElementById("salesChart").getContext("2d");
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  const today = getYMD(Date.now());
  const todayTrans = transactions.filter((t) => getYMD(t.timestamp) === today);
  const todayRevenue = todayTrans.reduce((sum, t) => sum + t.total, 0);

  const todayProfit = todayTrans.reduce((sum, t) => {
    const cost = t.itemsDetails
      ? t.itemsDetails.reduce((c, i) => c + (i.capitalPrice || 0) * i.qty, 0)
      : 0;
    return sum + (t.total - cost);
  }, 0);

  document.getElementById("statTodayRevenue").textContent =
    rupiah(todayRevenue);
  document.getElementById("statTodayProfit").textContent = rupiah(todayProfit);
  document.getElementById("statTodayCount").textContent = todayTrans.length;
  document.getElementById("statTotalProducts").textContent = products.length;

  let filteredTransactions = transactions;

  if (startDate || endDate) {
    filteredTransactions = transactions.filter((t) => {
      const tDate = getYMD(t.timestamp);
      if (startDate && tDate < startDate) return false;
      if (endDate && tDate > endDate) return false;
      return true;
    });
  }

  if (salesChart) salesChart.destroy();

  let labels = [];
  let data = [];

  if (startDate || endDate) {
    const grouped = {};
    filteredTransactions.forEach((t) => {
      const d = getYMD(t.timestamp);
      grouped[d] = (grouped[d] || 0) + t.total;
    });

    const sortedKeys = Object.keys(grouped).sort();
    labels = sortedKeys.map((k) => {
      const parts = k.split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    });
    data = sortedKeys.map((k) => grouped[k]);
  } else {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID");
      labels.push(dateStr);

      const dayTotal = transactions
        .filter(
          (t) => new Date(t.timestamp).toLocaleDateString("id-ID") === dateStr,
        )
        .reduce((sum, t) => sum + t.total, 0);
      data.push(dayTotal);
    }
  }

  salesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pendapatan",
          data: data,
          backgroundColor: "#06b6d4",
          borderRadius: 6,
          barThickness: 40,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
        x: { grid: { display: false } },
      },
    },
  });
}
