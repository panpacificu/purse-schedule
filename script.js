const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwmHQTfTwkqe6MWzOVxJeGDWt8Dj3PCQtSMyiATs2UZOB_lNuVK9UdEXlF2eRI3vl6r/exec";

let schedules = [];

const tableBody = document.getElementById("scheduleTable");
const searchInput = document.getElementById("searchInput");
const campusFilter = document.getElementById("campusFilter");
const statusFilter = document.getElementById("statusFilter");

async function loadSchedules() {
  try {
    const response = await fetch(SHEET_API_URL);
    schedules = await response.json();

    renderDashboard(schedules);
    renderTable(schedules);

    document.getElementById("lastUpdated").textContent =
      "Last updated: " + new Date().toLocaleString("en-PH");
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">Unable to load schedules. Please check the Google Apps Script link.</td>
      </tr>
    `;
  }
}

function renderDashboard(data) {
  const scheduledItems = data.filter(item => item.Status === "Scheduled");
  const upcoming = getNextSchedule(scheduledItems);

  document.getElementById("totalCount").textContent = data.length;
  document.getElementById("scheduledCount").textContent =
    data.filter(item => item.Status === "Scheduled").length;
  document.getElementById("updateCount").textContent =
    data.filter(item => item.Status === "For Update").length;
  document.getElementById("completedCount").textContent =
    data.filter(item => item.Status === "Completed").length;

  if (upcoming) {
    document.getElementById("nextTown").textContent = upcoming.Town;
    document.getElementById("nextDate").textContent = formatDate(upcoming.Date);
    document.getElementById("nextCampus").textContent = upcoming.Campus;
    document.getElementById("nextStatus").textContent = upcoming.Status;
    document.getElementById("nextStatus").className =
      "status-badge " + getStatusClass(upcoming.Status);
    document.getElementById("nextRemarks").textContent =
      upcoming.Remarks || "No remarks added.";
  } else {
    document.getElementById("nextTown").textContent = "No upcoming schedule";
    document.getElementById("nextDate").textContent = "--";
    document.getElementById("nextCampus").textContent = "--";
    document.getElementById("nextStatus").textContent = "--";
    document.getElementById("nextStatus").className = "status-badge default-status";
    document.getElementById("nextRemarks").textContent =
      "Schedules are still for update.";
  }
}

function getNextSchedule(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items
    .map(item => ({
      ...item,
      parsedDate: new Date(item.Date)
    }))
    .filter(item => item.parsedDate >= today && !isNaN(item.parsedDate))
    .sort((a, b) => a.parsedDate - b.parsedDate)[0];
}

function renderTable(data) {
  const searchValue = searchInput.value.toLowerCase();
  const campusValue = campusFilter.value;
  const statusValue = statusFilter.value;

  const filteredData = data.filter(item => {
    const town = String(item.Town || "").toLowerCase();
    const campus = String(item.Campus || "");
    const status = String(item.Status || "");

    const matchesSearch = town.includes(searchValue);
    const matchesCampus = campusValue === "All" || campus === campusValue;
    const matchesStatus = statusValue === "All" || status === statusValue;

    return matchesSearch && matchesCampus && matchesStatus;
  });

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">No schedules found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredData.map(item => `
    <tr>
      <td><strong>${item.Town || "-"}</strong></td>
      <td>${item.Campus || "-"}</td>
      <td>${formatDate(item.Date)}</td>
      <td>
        <span class="status-badge ${getStatusClass(item.Status)}">
          ${item.Status || "For Update"}
        </span>
      </td>
      <td>${item.Remarks || "-"}</td>
    </tr>
  `).join("");
}

function formatDate(dateValue) {
  if (!dateValue || dateValue === "For Update") return "For Update";

  const date = new Date(dateValue);
  if (isNaN(date)) return dateValue;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Scheduled":
      return "scheduled";
    case "For Update":
      return "for-update";
    case "Completed":
      return "completed";
    case "Cancelled":
      return "cancelled";
    case "Rescheduled":
      return "rescheduled";
    default:
      return "default-status";
  }
}

function loadVisitorCounter() {
  fetch("https://api.countapi.xyz/hit/purse-dashboard-panpacificu/visits")
    .then(res => res.json())
    .then(res => {
      document.getElementById("visitorCount").innerText = res.value;
    })
    .catch(() => {
      document.getElementById("visitorCount").innerText = "--";
    });
}

searchInput.addEventListener("input", () => renderTable(schedules));
campusFilter.addEventListener("change", () => renderTable(schedules));
statusFilter.addEventListener("change", () => renderTable(schedules));

loadSchedules();
loadVisitorCounter();
