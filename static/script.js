// fetch and render expenses, create pie chart
let chart = null;

async function fetchExpenses() {
  const res = await fetch("/api/expenses");
  const data = await res.json();
  renderList(data);
  renderChart(data);
}

function renderList(data) {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";
  data.forEach(exp => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-left">
        <strong>${escapeHtml(exp.category)}</strong>
        <div class="date">${exp.date}</div>
      </div>
      <div class="item-right">
        <span class="amount">${exp.amount.toFixed(2)}</span>
        <button class="del-btn" data-id="${exp.id}">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.querySelectorAll(".del-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      fetchExpenses();
    });
  });
}

function renderChart(data) {
  // group by category
  const groups = {};
  data.forEach(e => {
    groups[e.category] = (groups[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(groups);
  const values = Object.values(groups);

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// helper to escape user input when injecting HTML
function escapeHtml(str){
  if (!str) return "";
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'", "&#039;");
}

document.getElementById("addBtn").addEventListener("click", async () => {
  const category = document.getElementById("category").value.trim();
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;

  const errorDiv = document.getElementById("error");
  errorDiv.textContent = "";

  if (!category || !amount) {
    errorDiv.textContent = "Category and amount are required.";
    return;
  }

  const payload = { category, amount: parseFloat(amount), date: date || null };

  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const data = await res.json();
    errorDiv.textContent = data.error || "Failed to add.";
    return;
  }

  document.getElementById("category").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("date").value = "";
  fetchExpenses();
});

// initial load
fetchExpenses();