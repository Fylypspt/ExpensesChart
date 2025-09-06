let chart = null
let categoryColors = {}

async function fetchExpenses(month = null) {
  let url = "/api/expenses"
  if (month) url += `?month=${month}`
  const res = await fetch(url)
  const data = await res.json()
  renderList(data)
  renderChart(data)
  renderTotal(data)
}

function getColor(category) {
  if (!categoryColors[category]) {
    categoryColors[category] = `hsl(${Object.keys(categoryColors).length * 50 % 360},70%,60%)`
  }
  return categoryColors[category]
}

function renderList(data) {
  const list = document.getElementById("expenseList")
  list.innerHTML = ""
  data.forEach(exp => {
    const li = document.createElement("li")
    li.style.borderLeft = `6px solid ${getColor(exp.category)}`
    li.innerHTML = `
      <div class="item-left">
        <strong>${escapeHtml(exp.category)}</strong>
        <div class="date">${exp.date}</div>
      </div>
      <div class="item-right">
        <span class="amount">${exp.amount.toFixed(2)}</span>
        <button class="edit-btn" data-id="${exp.id}">Edit</button>
        <button class="del-btn" data-id="${exp.id}">Delete</button>
      </div>
    `
    list.appendChild(li)
  })
  document.querySelectorAll(".del-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id
      await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      fetchExpenses(document.getElementById("monthFilter").value)
    })
  })
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id
      const newCategory = prompt("New category:")
      const newAmount = prompt("New amount:")
      const newDate = prompt("New date (YYYY-MM-DD):")
      if (!newCategory && !newAmount && !newDate) return
      await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory, amount: newAmount, date: newDate })
      })
      fetchExpenses(document.getElementById("monthFilter").value)
    })
  })
}

function renderChart(data) {
  const groups = {}
  data.forEach(e => {
    groups[e.category] = (groups[e.category] || 0) + e.amount
  })
  const labels = Object.keys(groups)
  const values = Object.values(groups)
  const colors = labels.map(l => getColor(l))
  const ctx = document.getElementById("expenseChart").getContext("2d")
  if (chart) {
    chart.data.labels = labels
    chart.data.datasets[0].data = values
    chart.data.datasets[0].backgroundColor = colors
    chart.update()
    return
  }
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  })
}

function renderTotal(data) {
  const total = data.reduce((sum, e) => sum + e.amount, 0)
  document.getElementById("totalDisplay").textContent = `Total: ${total.toFixed(2)}`
}

function escapeHtml(str){
  if (!str) return ""
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'", "&#039;")
}

document.getElementById("addBtn").addEventListener("click", async () => {
  const category = document.getElementById("category").value.trim()
  const amount = document.getElementById("amount").value
  const date = document.getElementById("date").value
  const errorDiv = document.getElementById("error")
  errorDiv.textContent = ""
  if (!category || !amount) {
    errorDiv.textContent = "Category and amount are required."
    return
  }
  const payload = { category, amount: parseFloat(amount), date: date || null }
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const data = await res.json()
    errorDiv.textContent = data.error || "Failed to add."
    return
  }
  document.getElementById("category").value = ""
  document.getElementById("amount").value = ""
  document.getElementById("date").value = ""
  fetchExpenses(document.getElementById("monthFilter").value)
})

document.getElementById("filterBtn").addEventListener("click", () => {
  const month = document.getElementById("monthFilter").value
  fetchExpenses(month)
})

document.getElementById("clearFilterBtn").addEventListener("click", () => {
  document.getElementById("monthFilter").value = ""
  fetchExpenses()
})

fetchExpenses()