document.addEventListener("DOMContentLoaded", function () {
  var currentPage = document.body.dataset.page;

  activateTabs(currentPage);
  activateCounters();
  activateToastButtons();

  if (currentPage === "live") {
    activateRowLinks();
    drawTrendChart("fraudTrendChart", [12, 18, 14, 26, 24, 31, 28, 36, 33, 41, 38, 46]);
    drawDonutChart("fraudSplitChart", 24579, 312);
    setupTransactionModal();
    setupLiveFilters();
    startLiveFeedUpdates();
  }

  if (currentPage === "settings") {
    setupSettingsActions();
  }
});

function activateTabs(currentPage) {
  var tabs = document.querySelectorAll(".tabs a");

  tabs.forEach(function (tab) {
    if (tab.dataset.tab === currentPage) {
      tab.classList.add("active");
      tab.setAttribute("aria-current", "page");
    }
  });
}

function activateCounters() {
  var counters = document.querySelectorAll(".counter");

  counters.forEach(function (counter) {
    var target = Number(counter.dataset.target);
    var duration = 1200;
    var startTime = null;

    function updateCounter(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      var progress = Math.min((timestamp - startTime) / duration, 1);
      var value = Math.floor(progress * target);
      counter.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(updateCounter);
  });
}

function activateToastButtons() {
  var toastButtons = document.querySelectorAll("[data-toast-message]");

  toastButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      showToast(button.dataset.toastMessage);
    });
  });
}

function activateRowLinks() {
  var rows = document.querySelectorAll(".clickable-row");

  rows.forEach(function (row) {
    makeRowAccessible(row);
  });
}

function makeRowAccessible(row) {
  row.setAttribute("tabindex", "0");
  row.setAttribute("role", "button");

  row.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      row.click();
    }
  });
}

function setupTransactionModal() {
  var rows = document.querySelectorAll(".clickable-row");
  var modal = document.getElementById("transactionModal");
  var closeButtons = document.querySelectorAll("[data-close-modal]");
  var openAiButton = document.getElementById("openAiAnalysis");
  var selectedLink = "ai.html";

  if (!modal) {
    return;
  }

  rows.forEach(function (row) {
    bindRowToModal(row);
  });

  closeButtons.forEach(function (button) {
    button.addEventListener("click", closeModal);
  });

  if (openAiButton) {
    openAiButton.addEventListener("click", function () {
      window.location.href = selectedLink;
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  function bindRowToModal(row) {
    row.addEventListener("click", function () {
      selectedLink = row.dataset.href || "ai.html";
      updateModalFields(row);
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    });
  }

  function updateModalFields(row) {
    document.getElementById("modalTxnId").textContent = row.dataset.txnId || "-";
    document.getElementById("modalSender").textContent = row.dataset.sender || "-";
    document.getElementById("modalAmount").textContent = row.dataset.amount || "-";
    document.getElementById("modalLocation").textContent = row.dataset.location || "-";
    document.getElementById("modalScore").textContent = row.dataset.score || "-";
    document.getElementById("modalRisk").textContent = row.dataset.risk || "-";
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
}

function setupLiveFilters() {
  var searchInput = document.getElementById("txnSearch");
  var riskFilter = document.getElementById("riskFilter");
  var locationFilter = document.getElementById("locationFilter");

  if (!searchInput || !riskFilter || !locationFilter) {
    return;
  }

  function applyFilters() {
    var query = searchInput.value.trim().toLowerCase();
    var riskValue = riskFilter.value;
    var locationValue = locationFilter.value;
    var rows = document.querySelectorAll("#transactionTableBody tr");

    rows.forEach(function (row) {
      var matchesQuery =
        row.dataset.sender.toLowerCase().indexOf(query) > -1 ||
        row.dataset.txnId.toLowerCase().indexOf(query) > -1;
      var matchesRisk =
        riskValue === "all" || row.dataset.risk.toLowerCase() === riskValue;
      var matchesLocation =
        locationValue === "all" || row.dataset.location.toLowerCase() === locationValue;

      row.classList.toggle("hidden-row", !(matchesQuery && matchesRisk && matchesLocation));
    });
  }

  searchInput.addEventListener("input", applyFilters);
  riskFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
}

function startLiveFeedUpdates() {
  var tableBody = document.getElementById("transactionTableBody");

  if (!tableBody) {
    return;
  }

  var senders = ["Ethan Cole", "Priya Nair", "Lucas Adams", "Zara Khan", "Mason Lee", "Ella Brown"];
  var locations = ["Amsterdam", "Mumbai", "Tokyo", "Chicago", "Madrid", "Hong Kong"];
  var nextId = 90315;

  setInterval(function () {
    var sender = pickRandom(senders);
    var location = pickRandom(locations);
    var score = randomNumber(12, 96);
    var amount = "$" + randomNumber(220, 14950).toLocaleString();
    var risk = getRiskFromScore(score);
    var row = document.createElement("tr");

    row.className = "clickable-row new-row";
    row.dataset.href = "ai.html";
    row.dataset.txnId = "TXN-" + nextId;
    row.dataset.sender = sender;
    row.dataset.amount = amount;
    row.dataset.location = location;
    row.dataset.score = String(score);
    row.dataset.risk = risk;

    row.innerHTML =
      "<td>TXN-" + nextId + "</td>" +
      "<td>" + sender + "</td>" +
      "<td>" + amount + "</td>" +
      "<td>" + location + "</td>" +
      "<td>" + score + "</td>" +
      "<td><span class=\"risk-badge " + risk.toLowerCase() + "\">" + risk + "</span></td>";

    makeRowAccessible(row);
    tableBody.insertBefore(row, tableBody.firstChild);
    nextId += 1;

    if (tableBody.children.length > 12) {
      tableBody.removeChild(tableBody.lastElementChild);
    }

    showToast("New " + risk + " risk transaction added to the live feed.");
  }, 5000);
}

function setupSettingsActions() {
  var form = document.getElementById("telegramForm");
  var sendTestAlertButton = document.getElementById("sendTestAlert");
  var retrainButton = document.getElementById("retrainModel");
  var toggles = document.querySelectorAll(".toggle-input");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      showToast("Telegram settings saved successfully.");
    });
  }

  if (sendTestAlertButton) {
    sendTestAlertButton.addEventListener("click", function () {
      showToast("Test alert sent to Telegram bot.");
    });
  }

  if (retrainButton) {
    retrainButton.addEventListener("click", function () {
      showToast("Model retraining job started.");
    });
  }

  toggles.forEach(function (toggle) {
    toggle.addEventListener("change", function () {
      showToast("Preference updated.");
    });
  });
}

function showToast(message) {
  var toast = document.getElementById("globalToast") || document.getElementById("settingsToast");

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}

function drawTrendChart(canvasId, values) {
  var canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.getContext) {
    return;
  }

  var context = canvas.getContext("2d");
  var width = canvas.width;
  var height = canvas.height;
  var padding = 34;
  var maxValue = Math.max.apply(null, values) + 10;
  var stepX = (width - padding * 2) / (values.length - 1);

  context.clearRect(0, 0, width, height);
  context.strokeStyle = "rgba(144, 169, 203, 0.18)";
  context.lineWidth = 1;

  for (var i = 0; i < 5; i += 1) {
    var y = padding + ((height - padding * 2) / 4) * i;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  context.beginPath();
  values.forEach(function (value, index) {
    var x = padding + stepX * index;
    var y = height - padding - (value / maxValue) * (height - padding * 2);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.strokeStyle = "#36f3ff";
  context.lineWidth = 3;
  context.shadowColor = "rgba(54, 243, 255, 0.4)";
  context.shadowBlur = 12;
  context.stroke();
  context.shadowBlur = 0;

  context.lineTo(width - padding, height - padding);
  context.lineTo(padding, height - padding);
  context.closePath();

  var gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(54, 243, 255, 0.28)");
  gradient.addColorStop(1, "rgba(54, 243, 255, 0)");
  context.fillStyle = gradient;
  context.fill();

  values.forEach(function (value, index) {
    var x = padding + stepX * index;
    var y = height - padding - (value / maxValue) * (height - padding * 2);
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fillStyle = "#3ea6ff";
    context.fill();
  });
}

function drawDonutChart(canvasId, safeValue, fraudValue) {
  var canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.getContext) {
    return;
  }

  var context = canvas.getContext("2d");
  var total = safeValue + fraudValue;
  var safeAngle = (safeValue / total) * Math.PI * 2;
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  var radius = 84;
  var innerRadius = 48;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.beginPath();
  context.arc(centerX, centerY, radius, -Math.PI / 2, safeAngle - Math.PI / 2);
  context.strokeStyle = "#49f5b0";
  context.lineWidth = radius - innerRadius;
  context.stroke();

  context.beginPath();
  context.arc(centerX, centerY, radius, safeAngle - Math.PI / 2, Math.PI * 1.5);
  context.strokeStyle = "#ff5a7c";
  context.lineWidth = radius - innerRadius;
  context.stroke();

  context.beginPath();
  context.fillStyle = "#edf6ff";
  context.font = "700 28px Space Grotesk";
  context.textAlign = "center";
  context.fillText("98.7%", centerX, centerY - 4);
  context.fillStyle = "#90a9cb";
  context.font = "500 14px Space Grotesk";
  context.fillText("safe ratio", centerX, centerY + 22);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRiskFromScore(score) {
  if (score >= 70) {
    return "High";
  }

  if (score >= 40) {
    return "Medium";
  }

  return "Low";
}
