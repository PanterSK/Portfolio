/* =========================================================================
   Timotej Krist — Portfolio engine
   You do NOT need to edit this file. Edit content.js instead.
   ========================================================================= */
(function () {
  "use strict";

  // --- Elements ----------------------------------------------------------
  const srTrack        = document.getElementById("srTrack");
  const srTitle        = document.getElementById("srTitle");
  const srSub          = document.getElementById("srSub");
  const viewer         = document.getElementById("viewer");
  const vwName         = document.getElementById("vwName");
  const vwTitle        = document.getElementById("vwTitle");
  const vwClose        = document.getElementById("vwClose");
  const vwPrev         = document.getElementById("vwPrev");
  const vwNext         = document.getElementById("vwNext");
  const vwPrevLabel    = document.getElementById("vwPrevLabel");
  const vwNextLabel    = document.getElementById("vwNextLabel");
  const playerFrame    = document.getElementById("playerFrame");
  const vwPrevThumb    = document.getElementById("vwPrevThumb");
  const vwNextThumb    = document.getElementById("vwNextThumb");
  const creditsBtn     = document.getElementById("creditsBtn");
  const creditsOverlay = document.getElementById("creditsOverlay");
  const coClose        = document.getElementById("coClose");
  const coTitle        = document.getElementById("coTitle");
  const coList         = document.getElementById("coList");

  let current     = 0;
  let viewerIframe = null;
  const viewerIframes = {};

  // Marquee state
  let marqueePos    = 0;
  let marqueeSpeed  = 1;      // px per frame (recalculated in sizeCards)
  let marqueeRAF    = null;
  let marqueePaused = false;
  let cardSetWidth  = 0;      // total width of one set of n cards

  // -----------------------------------------------------------------------
  // Site info
  // -----------------------------------------------------------------------
  function applySiteInfo() {
    if (typeof SITE === "undefined") return;
    document.title = SITE.name + " — Videography";
    setText("siteName", SITE.name);
    setText("footName", SITE.name);
    setText("aboutText", SITE.about || "");

    const list = document.getElementById("contactList");
    list.innerHTML = "";
    (SITE.contact || []).forEach(function (c) {
      const li = document.createElement("li");
      const a  = document.createElement("a");
      a.textContent = c.label;
      a.href = c.link;
      if (!c.link.startsWith("mailto:")) { a.target = "_blank"; a.rel = "noopener"; }
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // -----------------------------------------------------------------------
  // Showreel marquee
  // -----------------------------------------------------------------------
  function buildShowreel() {
    if (typeof PROJECTS === "undefined" || !PROJECTS.length) {
      srTrack.innerHTML = '<p style="color:var(--muted);padding:2rem;text-align:center">No projects yet — add some in content.js</p>';
      return;
    }

    // Original set + one duplicate for seamless looping
    PROJECTS.forEach(function (p, i) { srTrack.appendChild(makeCard(p, i, false)); });
    PROJECTS.forEach(function (p, i) { srTrack.appendChild(makeCard(p, i, true));  });

    sizeCards();
    startMarquee();

    srTrack.addEventListener("mouseenter", function () { marqueePaused = true;  });
    srTrack.addEventListener("mouseleave", function () { marqueePaused = false; });

    window.addEventListener("resize", sizeCards);
    updateInfo(0);
  }

  function makeCard(p, index, isClone) {
    var card  = document.createElement("div");
    card.className = "reel-card";
    card.dataset.index = index;
    if (isClone) card.setAttribute("aria-hidden", "true");

    var inner = document.createElement("div");
    inner.className = "reel-inner";

    var img = document.createElement("img");
    img.className = "reel-thumb";
    img.src = thumbUrl(p);
    img.alt = p.title;
    inner.appendChild(img);

    // Title overlay (shown on hover via CSS)
    var titleEl = document.createElement("div");
    titleEl.className = "reel-card-title";
    titleEl.textContent = p.title;
    inner.appendChild(titleEl);

    card.appendChild(inner);

    // Hover → inject muted preview iframe; leave → remove it
    card.addEventListener("mouseenter", function () {
      var iframe = document.createElement("iframe");
      iframe.className = "reel-preview";
      iframe.setAttribute("allow", "autoplay");
      iframe.src =
        "https://player.vimeo.com/video/" + encodeURIComponent(p.vimeoId) +
        "?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&dnt=1";
      inner.appendChild(iframe);
      setTimeout(function () { if (iframe.parentNode) card.classList.add("preview-ready"); }, 300);
      updateInfo(index);
    });

    card.addEventListener("mouseleave", function () {
      card.classList.remove("preview-ready");
      var existing = inner.querySelector(".reel-preview");
      if (existing) existing.remove();
    });

    card.addEventListener("click", function () { openViewer(index); });

    return card;
  }

  // Size every card to fill the showreel section height and derive width from 16:9
  function sizeCards() {
    var section = document.getElementById("showreel");
    var infoH   = 80; // approximate height of sr-info strip
    var cardH   = Math.max(180, section.offsetHeight - infoH);
    var cardW   = Math.round(cardH * 16 / 9);

    document.querySelectorAll(".reel-card").forEach(function (c) {
      c.style.width  = cardW + "px";
      c.style.height = cardH + "px";
    });

    cardSetWidth = cardW * PROJECTS.length;
    // Aim for ~14 s to scroll one card width past
    marqueeSpeed = cardW / (14 * 60);
  }

  // -----------------------------------------------------------------------
  // RAF marquee — pixel-perfect seamless loop
  // -----------------------------------------------------------------------
  function startMarquee() {
    if (marqueeRAF) cancelAnimationFrame(marqueeRAF);
    function tick() {
      if (!marqueePaused && cardSetWidth > 0) {
        marqueePos -= marqueeSpeed;
        if (marqueePos <= -cardSetWidth) marqueePos += cardSetWidth;
        srTrack.style.transform = "translateX(" + marqueePos + "px)";
      }
      marqueeRAF = requestAnimationFrame(tick);
    }
    marqueeRAF = requestAnimationFrame(tick);
  }

  function updateInfo(index) {
    var p = PROJECTS[index];
    srTitle.textContent = p.title.toUpperCase();
    var dir = (p.credits || []).find(function (c) { return /direct/i.test(c.role); });
    srSub.textContent = dir
      ? "Directed by " + dir.name
      : [p.type, p.year].filter(Boolean).join(" · ");
  }

  // -----------------------------------------------------------------------
  // Viewer preloading — all iframes created at startup so playback is instant
  // -----------------------------------------------------------------------
  function initViewerPreloads() {
    PROJECTS.forEach(function (p, i) {
      var iframe = document.createElement("iframe");
      iframe.className = "vw-iframe";
      iframe.dataset.index = i;
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      // autoplay=0 — we trigger play via postMessage when the viewer opens
      iframe.src =
        "https://player.vimeo.com/video/" + encodeURIComponent(p.vimeoId) +
        "?autoplay=0&title=0&byline=0&portrait=0&dnt=1";
      playerFrame.appendChild(iframe);
      viewerIframes[i] = iframe;
    });
  }

  // -----------------------------------------------------------------------
  // Expanded viewer
  // -----------------------------------------------------------------------
  function openViewer(index) {
    current = index;
    var p = PROJECTS[index];
    var n = PROJECTS.length;

    marqueePaused = true;

    vwName.textContent  = (typeof SITE !== "undefined" ? SITE.name : "").toUpperCase();
    vwTitle.textContent = p.title.toUpperCase();

    var prevIdx = (index - 1 + n) % n;
    var nextIdx = (index + 1) % n;
    vwPrevLabel.textContent = PROJECTS[prevIdx].title;
    vwNextLabel.textContent = PROJECTS[nextIdx].title;
    vwPrev.style.visibility = n > 1 ? "" : "hidden";
    vwNext.style.visibility = n > 1 ? "" : "hidden";

    creditsBtn.style.display = (p.credits && p.credits.length) ? "" : "none";
    creditsOverlay.hidden = true;
    viewer.classList.remove("credits-open");

    coTitle.textContent = p.title.toUpperCase();
    coList.innerHTML = "";
    (p.credits || []).forEach(function (c) {
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = c.role;
      dd.textContent = c.name;
      coList.appendChild(dt);
      coList.appendChild(dd);
    });

    vwPrevThumb.src = thumbUrl(PROJECTS[prevIdx]);
    vwNextThumb.src = thumbUrl(PROJECTS[nextIdx]);

    // Deactivate all iframes, activate the selected one and trigger play
    Object.keys(viewerIframes).forEach(function (k) {
      viewerIframes[k].classList.remove("is-active");
    });
    viewerIframe = viewerIframes[index];
    viewerIframe.classList.add("is-active");
    viewerIframe.contentWindow.postMessage(
      JSON.stringify({ method: "play" }), "https://player.vimeo.com"
    );

    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeViewer() {
    if (viewerIframe) {
      viewerIframe.classList.remove("is-active");
      viewerIframe.contentWindow.postMessage(
        JSON.stringify({ method: "pause" }), "https://player.vimeo.com"
      );
    }
    viewerIframe = null;
    viewer.classList.remove("open", "is-paused");
    viewer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    creditsOverlay.hidden = true;
    marqueePaused = false;
  }

  function viewerGoTo(index) {
    creditsOverlay.hidden = true;
    openViewer(((index % PROJECTS.length) + PROJECTS.length) % PROJECTS.length);
  }

  vwClose.addEventListener("click", closeViewer);
  vwPrev.addEventListener("click",  function () { viewerGoTo(current - 1); });
  vwNext.addEventListener("click",  function () { viewerGoTo(current + 1); });

  creditsBtn.addEventListener("click", function () { creditsOverlay.hidden = false; });
  coClose.addEventListener("click",    function () { creditsOverlay.hidden = true;  });

  document.addEventListener("keydown", function (e) {
    if (viewer.classList.contains("open")) {
      if (e.key === "Escape") {
        if (!creditsOverlay.hidden) { creditsOverlay.hidden = true; }
        else { closeViewer(); }
      }
      if (e.key === "ArrowLeft")  viewerGoTo(current - 1);
      if (e.key === "ArrowRight") viewerGoTo(current + 1);
    }
  });

  // Vimeo postMessage: register for pause/play on each iframe when ready;
  // update is-paused class on the active viewer iframe's events
  window.addEventListener("message", function (e) {
    if (!String(e.origin).includes("vimeo.com")) return;
    var data;
    try { data = JSON.parse(e.data); } catch (_) { return; }

    if (data.event === "ready") {
      // Register pause/play listeners on whichever iframe just became ready
      e.source.postMessage(JSON.stringify({ method: "addEventListener", value: "pause" }), "https://player.vimeo.com");
      e.source.postMessage(JSON.stringify({ method: "addEventListener", value: "play"  }), "https://player.vimeo.com");
    }
    if (viewerIframe && e.source === viewerIframe.contentWindow) {
      if (data.event === "pause") viewer.classList.add("is-paused");
      if (data.event === "play")  viewer.classList.remove("is-paused");
    }
  });

  document.querySelectorAll("[data-go-home]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (viewer.classList.contains("open")) closeViewer();
    });
  });

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function thumbUrl(p) {
    return p.thumbnail || ("https://vumbnail.com/" + encodeURIComponent(p.vimeoId) + ".jpg");
  }

  // -----------------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------------
  applySiteInfo();
  initViewerPreloads();
  buildShowreel();
})();
