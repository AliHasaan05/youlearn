/* ============================================================
   You Learn — Dashboard behaviour
   - Progressive enhancement of existing flat HTML
   - Active nav states, theme toggle
   - localStorage course progress + dynamic Start/Continue button
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Config ---------- */
  var NAV_ITEMS = [
    { href: "index.html", label: "All Courses", icon: "🏠" },
    { href: "development.html", label: "Programming & Software Development", icon: "💻" },
    { href: "ai.html", label: "Artificial Intelligence & Data Science", icon: "🤖" },
    { href: "csa.html", label: "Computer Systems & Architecture", icon: "🖥️" },
    { href: "dbms.html", label: "Database & Data Management", icon: "🗄️" },
    { href: "nc.html", label: "Networking & Cybersecurity", icon: "🛡️" },
    { href: "wamt.html", label: "Web & Mobile Technologies", icon: "📱" },
    { href: "et.html", label: "Emerging Technologies", icon: "🚀" },
    { href: "mt.html", label: "Mathematics & Theory", icon: "📐" },
    { href: "pge.html", label: "Professional & General Education", icon: "🎓" },
    { href: "contact.html", label: "Contact", icon: "✉️" }
  ];

  var STORAGE_KEY = "youlearn.progress.v1";
  var THEME_KEY = "youlearn.theme";

  /* ---------- Storage helpers ---------- */
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* storage unavailable — ignore */
    }
  }

  var progress = loadProgress();

  // Each entry: { started:bool, completed:bool, watched:int, total:int }
  function getEntry(id) {
    if (!progress[id]) {
      progress[id] = { started: false, completed: false, watched: 0, total: 0 };
    }
    return progress[id];
  }

  /* ---------- Small utilities ---------- */
  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function currentPage() {
    var path = location.pathname.split("/").pop();
    return path && path.length ? path : "index.html";
  }

  // Deterministic "random-ish" number from a string (stable per course title).
  function hashNum(str, min, max) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return min + (h % (max - min + 1));
  }

  function initials(title) {
    var words = title.replace(/[^\w\s]/g, "").trim().split(/\s+/);
    var a = words[0] ? words[0][0] : "Y";
    var b = words[1] ? words[1][0] : (words[0] && words[0][1]) || "L";
    return (a + b).toUpperCase();
  }

  function slug(str) {
    return str.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light";
    }
    applyTheme(saved);
  }

  /* ============================================================
     BUILD CHROME (navbar + sidebar + footer)
     ============================================================ */
  function buildNavbar() {
    var nav = el("header", "yl-navbar");
    nav.innerHTML =
      '<button class="yl-icon-btn yl-menu-toggle" id="ylMenuToggle" aria-label="Toggle menu">☰</button>' +
      '<a class="yl-brand" href="index.html">' +
        '<span class="yl-logo">▶</span><span>You<span class="accent">Learn</span></span>' +
      '</a>' +
      '<div class="yl-nav-spacer"></div>' +
      '<div class="yl-search"><input type="search" id="ylSearch" placeholder="Search courses..." aria-label="Search courses"></div>' +
      '<button class="yl-icon-btn" id="ylThemeToggle" aria-label="Toggle theme" title="Toggle theme">🌙</button>';
    return nav;
  }

  function buildSidebar() {
    var aside = el("aside", "yl-sidebar");
    var current = currentPage();
    var html = '<div class="yl-side-title">Categories</div><nav>';
    NAV_ITEMS.forEach(function (item) {
      var active = item.href === current ? " active" : "";
      html +=
        '<a class="' + active.trim() + '" href="' + item.href + '">' +
          '<span class="ic">' + item.icon + '</span>' +
          '<span class="lbl">' + item.label + '</span>' +
        '</a>';
    });
    html += "</nav>";
    aside.innerHTML = html;
    return aside;
  }

  function buildFooter() {
    var f = el("footer", "yl-footer");
    f.innerHTML =
      '<span>© ' + new Date().getFullYear() + ' You Learn — Track your learning journey.</span>' +
      '<span><a href="index.html">All Courses</a> · <a href="contact.html">Contact</a></span>';
    return f;
  }

  /* ============================================================
     STATS / CHART CARDS
     ============================================================ */
  function buildStats(cards) {
    var total = cards.length;
    var started = 0, completed = 0;
    cards.forEach(function (c) {
      var e = getEntry(c.id);
      if (e.completed) completed++;
      else if (e.started) started++;
    });
    var inProgress = started;
    var pct = total ? Math.round((completed / total) * 100) : 0;

    var wrap = el("section", "yl-stats");
    wrap.innerHTML =
      stat("📚", "Total Courses", total, "in this category") +
      stat("▶️", "In Progress", inProgress, "keep going") +
      stat("✅", "Completed", completed, pct + "% of category") +
      '<div class="yl-stat-card yl-chart-card">' +
        '<div class="yl-donut" style="--val:' + pct + '" data-label="' + pct + '%"></div>' +
        '<div>' +
          '<div class="yl-stat-label">Category Progress</div>' +
          '<div class="yl-stat-sub">' + completed + ' / ' + total + ' finished</div>' +
        '</div>' +
      '</div>';
    return wrap;

    function stat(ic, label, value, sub) {
      return '<div class="yl-stat-card">' +
        '<div class="yl-stat-top"><span class="yl-stat-label">' + label + '</span>' +
        '<span class="yl-stat-ic">' + ic + '</span></div>' +
        '<div class="yl-stat-value" data-stat="' + slug(label) + '">' + value + '</div>' +
        '<div class="yl-stat-sub">' + sub + '</div></div>';
    }
  }

  function refreshStats(statsEl, cards) {
    var fresh = buildStats(cards);
    statsEl.replaceWith(fresh);
    return fresh;
  }

  /* ============================================================
     COURSE CARDS (enhance existing raw <div> blocks)
     ============================================================ */
  function parseRawCards() {
    // Raw course blocks are top-level <div> with an <h2> and a playlist <a>.
    var raw = [];
    var divs = document.querySelectorAll("body > div");
    divs.forEach(function (d) {
      var h2 = d.querySelector("h2");
      var link = d.querySelector('a[href]');
      if (!h2 || !link) return;
      var title = h2.textContent.trim();
      var img = d.querySelector("img");
      raw.push({
        node: d,
        id: slug(title),
        title: title,
        href: link.getAttribute("href"),
        img: img ? img.getAttribute("src") : ""
      });
    });
    return raw;
  }

  function buildCard(course) {
    var entry = getEntry(course.id);
    if (!entry.total) entry.total = hashNum(course.title, 12, 48); // stable video count
    var author = "YouLearn · " + hashNum(course.title + "ch", 1, 9) + " playlists";
    var views = hashNum(course.title + "v", 10, 980);

    var card = el("article", "yl-card");
    card.dataset.id = course.id;
    card.dataset.title = course.title.toLowerCase();

    var hasImg = course.img && course.img.trim().length;
    var thumb =
      '<div class="yl-thumb">' +
        (hasImg
          ? '<img src="' + course.img + '" alt="' + course.title + '" loading="lazy">'
          : '<div class="yl-thumb-fallback">' + initials(course.title) + '</div>') +
        '<span class="yl-badge js-badge"></span>' +
      '</div>';

    var body =
      '<div class="yl-card-body">' +
        '<h3>' + course.title + '</h3>' +
        '<div class="yl-meta">' +
          '<span class="yl-avatar">' + initials(course.title) + '</span>' +
          '<span>' + author + '</span>' +
          '<span class="dot">•</span>' +
          '<span>' + entry.total + ' videos</span>' +
        '</div>' +
        '<div class="yl-progress">' +
          '<div class="yl-progress-top"><span class="js-prog-label"></span><span class="js-prog-pct"></span></div>' +
          '<div class="yl-progress-track"><div class="yl-progress-fill js-fill"></div></div>' +
        '</div>' +
        '<button class="yl-action js-action" type="button"></button>' +
        '<div class="yl-card-tools">' +
          '<button class="yl-tool js-watch" type="button" title="Mark one more video watched">+1 video</button>' +
          '<button class="yl-tool js-complete" type="button" title="Toggle completed">Mark complete</button>' +
          '<button class="yl-tool js-reset" type="button" title="Reset this course">Reset</button>' +
        '</div>' +
      '</div>';

    card.innerHTML = thumb + body;

    // Open playlist in a new tab when the primary action button is clicked.
    card.querySelector(".js-action").addEventListener("click", function () {
      markStarted(course.id);
      renderCardState(card, course);
      notifyProgressChanged();
      window.open(course.href, "_blank", "noopener");
    });

    // Manual: +1 video watched
    card.querySelector(".js-watch").addEventListener("click", function () {
      var e = getEntry(course.id);
      e.started = true;
      e.watched = Math.min(e.total, e.watched + 1);
      if (e.watched >= e.total) e.completed = true;
      saveProgress(progress);
      renderCardState(card, course);
      notifyProgressChanged();
    });

    // Manual: toggle completed
    card.querySelector(".js-complete").addEventListener("click", function () {
      var e = getEntry(course.id);
      e.completed = !e.completed;
      if (e.completed) {
        e.started = true;
        e.watched = e.total;
      } else {
        e.watched = Math.min(e.watched, e.total - 1);
        if (e.watched < 0) e.watched = 0;
      }
      saveProgress(progress);
      renderCardState(card, course);
      notifyProgressChanged();
    });

    // Manual: reset this course
    card.querySelector(".js-reset").addEventListener("click", function () {
      var e = getEntry(course.id);
      e.started = false;
      e.completed = false;
      e.watched = 0;
      saveProgress(progress);
      renderCardState(card, course);
      notifyProgressChanged();
    });

    renderCardState(card, course);
    return card;
  }

  function renderCardState(card, course) {
    var e = getEntry(course.id);
    var pct = e.total ? Math.round((e.watched / e.total) * 100) : 0;
    if (e.completed) pct = 100;

    card.dataset.started = e.started ? "true" : "false";
    card.dataset.completed = e.completed ? "true" : "false";

    var btn = card.querySelector(".js-action");
    if (e.completed) {
      btn.innerHTML = "✓ Review Playlist";
    } else if (e.started) {
      btn.innerHTML = "▶ Continue Learning";
    } else {
      btn.innerHTML = "▶ Start Playlist";
    }

    var badge = card.querySelector(".js-badge");
    if (e.completed) {
      badge.className = "yl-badge done js-badge";
      badge.textContent = "Completed";
    } else if (e.started) {
      badge.className = "yl-badge js-badge";
      badge.textContent = "In Progress";
    } else {
      badge.className = "yl-badge js-badge";
      badge.textContent = e.total + " videos";
    }

    card.querySelector(".js-fill").style.width = pct + "%";
    card.querySelector(".js-prog-label").textContent =
      e.completed ? "Finished" : e.started ? e.watched + " / " + e.total + " watched" : "Not started";
    card.querySelector(".js-prog-pct").textContent = pct + "%";

    var completeBtn = card.querySelector(".js-complete");
    if (completeBtn) {
      completeBtn.textContent = e.completed ? "Mark incomplete" : "Mark complete";
      completeBtn.classList.toggle("active", e.completed);
    }
  }

  // Dispatched whenever any course progress changes so stats can refresh.
  function notifyProgressChanged() {
    document.dispatchEvent(new CustomEvent("yl:progress"));
  }

  function markStarted(id) {
    var e = getEntry(id);
    if (!e.started) {
      e.started = true;
      if (e.watched < 1) e.watched = 1; // reflect at least one opened video
    }
    saveProgress(progress);
  }

  /* ============================================================
     PAGE TITLE / HEADER
     ============================================================ */
  function pageTitleFor(page) {
    var match = NAV_ITEMS.filter(function (n) { return n.href === page; })[0];
    return match ? match.label : "All Courses";
  }

  /* ============================================================
     BOOTSTRAP
     ============================================================ */
  function init() {
    initTheme();

    var page = currentPage();
    var raw = parseRawCards();

    // Remove the original flat nav links (the <a> siblings at top of body).
    document.querySelectorAll("body > a").forEach(function (a) { a.remove(); });

    // Detach raw course nodes; we rebuild them as cards.
    raw.forEach(function (c) { c.node.remove(); });

    // --- Assemble layout shell ---
    var navbar = buildNavbar();
    var shell = el("div", "yl-shell");
    var sidebar = buildSidebar();
    var backdrop = el("div", "yl-backdrop");
    var main = el("main", "yl-main");

    // Page header
    var customContent = document.querySelectorAll("[data-yl-content]");
    var hasCourses = raw.length > 0;

    var head = el("div", "yl-page-head");
    head.innerHTML =
      "<h1>" + pageTitleFor(page) + "</h1>" +
      "<p>" + (hasCourses
        ? "Browse playlists and track your progress. Your progress is saved on this device."
        : "We'd love to hear from you.") + "</p>";
    main.appendChild(head);

    var statsEl = null;
    var sectionTitle = null;
    var grid = null;
    var cardEls = [];

    if (hasCourses) {
      // Stats
      statsEl = buildStats(raw);
      main.appendChild(statsEl);

      // Section + grid
      sectionTitle = el("div", "yl-section-title",
        "<h2>Courses</h2><span class='count'>" + raw.length + " playlists</span>");
      main.appendChild(sectionTitle);

      grid = el("section", "yl-grid");
      raw.forEach(function (c) {
        var card = buildCard(c);
        cardEls.push(card);
        grid.appendChild(card);
      });
      main.appendChild(grid);
    }

    // Adopt any custom page content (e.g. the contact form) into <main>.
    customContent.forEach(function (node) {
      main.appendChild(node);
    });

    shell.appendChild(sidebar);
    shell.appendChild(backdrop);
    shell.appendChild(main);

    document.body.appendChild(navbar);
    document.body.appendChild(shell);
    document.body.appendChild(buildFooter());

    // Persist any newly assigned "total" counts.
    saveProgress(progress);

    /* ---------- Wire up interactions ---------- */

    // Theme toggle
    var themeBtn = document.getElementById("ylThemeToggle");
    function syncThemeIcon() {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      themeBtn.textContent = dark ? "☀️" : "🌙";
    }
    syncThemeIcon();
    themeBtn.addEventListener("click", function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      applyTheme(dark ? "light" : "dark");
      syncThemeIcon();
    });

    // Mobile sidebar toggle
    var menuBtn = document.getElementById("ylMenuToggle");
    menuBtn.addEventListener("click", function () {
      sidebar.classList.toggle("open");
      backdrop.classList.toggle("show");
    });
    backdrop.addEventListener("click", function () {
      sidebar.classList.remove("open");
      backdrop.classList.remove("show");
    });

    // Search filter (only meaningful on course pages)
    var search = document.getElementById("ylSearch");
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var visible = 0;
      cardEls.forEach(function (card) {
        var match = !q || card.dataset.title.indexOf(q) !== -1;
        card.style.display = match ? "" : "none";
        if (match) visible++;
      });
      if (sectionTitle) {
        sectionTitle.querySelector(".count").textContent = visible + " playlists";
      }
    });

    // Keep stats in sync whenever any course progress changes.
    document.addEventListener("yl:progress", function () {
      if (statsEl) statsEl = refreshStats(statsEl, raw);
    });

    // Contact form (present only on contact.html)
    initContactForm();
  }

  /* ============================================================
     CONTACT FORM
     ============================================================ */
  function initContactForm() {
    var form = document.getElementById("ylContactForm");
    if (!form) return;
    var note = document.getElementById("ylFormNote");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = form.querySelector("#cName");
      var email = form.querySelector("#cEmail");
      var message = form.querySelector("#cMessage");
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

      [name, email, message].forEach(function (f) { f.classList.remove("invalid"); });

      var errors = [];
      if (!name.value.trim()) { errors.push(name); }
      if (!emailOk) { errors.push(email); }
      if (!message.value.trim()) { errors.push(message); }

      if (errors.length) {
        errors.forEach(function (f) { f.classList.add("invalid"); });
        note.className = "yl-form-note err";
        note.textContent = "Please fill in all fields with a valid email.";
        return;
      }

      note.className = "yl-form-note ok";
      note.textContent = "Thanks, " + name.value.trim() + "! Your message has been recorded.";
      form.reset();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
