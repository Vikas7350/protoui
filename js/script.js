document.addEventListener("DOMContentLoaded", function () {
  var currentPage = document.body.dataset.page;
  var tabs = document.querySelectorAll(".tabs a");
  var rows = document.querySelectorAll(".clickable-row");

  tabs.forEach(function (tab) {
    if (tab.dataset.tab === currentPage) {
      tab.classList.add("active");
      tab.setAttribute("aria-current", "page");
    }
  });

  rows.forEach(function (row) {
    row.addEventListener("click", function () {
      var target = row.dataset.href;
      if (target) {
        window.location.href = target;
      }
    });

    row.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        row.click();
      }
    });

    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "link");
  });
});
