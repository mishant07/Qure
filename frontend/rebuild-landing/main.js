/* ============================================================
   Intelligence Designed To Evolve — interactions
   1. Count-up stats (easeOutCubic, once via IntersectionObserver)
   2. Mobile menu (burger toggle, close on overlay/Escape/link/resize)
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- 1. Count-up stats ---------------- */

  var nums = Array.prototype.slice.call(
    document.querySelectorAll(".stat .num")
  );

  var easeOutCubic = function (t) {
    return 1 - Math.pow(1 - t, 3);
  };

  var format = function (value, decimals) {
    return value.toFixed(decimals);
  };

  var countUp = function (el, index) {
    var target = parseFloat(el.dataset.target);
    var decimals = parseInt(el.dataset.decimals, 10);
    var duration = 1500 + index * 80;
    var offset = 480 + index * 90;

    setTimeout(function () {
      var start = null;
      var tick = function (now) {
        if (start === null) start = now;
        var progress = Math.min((now - start) / duration, 1);
        el.textContent = format(target * easeOutCubic(progress), decimals);
        if (progress < 1) {
          window.requestAnimationFrame(tick);
        }
      };
      window.requestAnimationFrame(tick);
    }, offset);
  };

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          countUp(entry.target, nums.indexOf(entry.target));
        });
      },
      { threshold: 0.25 }
    );
    nums.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    nums.forEach(function (el) {
      el.textContent = format(
        parseFloat(el.dataset.target),
        parseInt(el.dataset.decimals, 10)
      );
    });
  }

  /* ---------------- 2. Mobile menu ---------------- */

  var burger = document.querySelector(".burger");
  var overlay = document.querySelector(".menu-overlay");
  var sheet = document.querySelector(".menu");

  var openMenu = function () {
    document.body.classList.add("menu-open");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
    overlay.hidden = false;
    sheet.hidden = false;
  };

  var closeMenu = function () {
    document.body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    overlay.hidden = true;
    sheet.hidden = true;
  };

  burger.addEventListener("click", function () {
    if (document.body.classList.contains("menu-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Esc") {
      closeMenu();
    }
  });

  Array.prototype.slice
    .call(sheet.querySelectorAll("a"))
    .forEach(function (link) {
      link.addEventListener("click", function () {
        setTimeout(closeMenu, 340);
      });
    });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 720) {
      closeMenu();
    }
  });
})();