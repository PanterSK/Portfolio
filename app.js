/* =========================================================================
   Timotej Krist — Portfolio engine
   You do NOT need to edit this file. Edit content.js instead.
   ========================================================================= */
(function () {
  "use strict";

  // --- Elements ----------------------------------------------------------
  var srTrack        = document.getElementById("srTrack");
  var aboutOverlay   = document.getElementById("aboutOverlay");
  var aoClose        = document.getElementById("aoClose");
  var viewer         = document.getElementById("viewer");
  var vwName         = document.getElementById("vwName");
  var vwTitle        = document.getElementById("vwTitle");
  var vwClose        = document.getElementById("vwClose");
  var vwPrev         = document.getElementById("vwPrev");
  var vwNext         = document.getElementById("vwNext");
  var vwPrevLabel    = document.getElementById("vwPrevLabel");
  var vwNextLabel    = document.getElementById("vwNextLabel");
  var vwPrevThumb    = document.getElementById("vwPrevThumb");
  var vwNextThumb    = document.getElementById("vwNextThumb");
  var playerFrame    = document.getElementById("playerFrame");
  var creditsBtn     = document.getElementById("creditsBtn");
  var creditsOverlay = document.getElementById("creditsOverlay");
  var coClose        = document.getElementById("coClose");
  var coTitle        = document.getElementById("coTitle");
  var coList         = document.getElementById("coList");

  // --- State -------------------------------------------------------------
  var current      = 0;
  var player       = null;   // active Vimeo.Player

  // Marquee
  var marqueePos     = 0;
  var marqueeSpeed   = 0.6;
  var marqueePaused  = false; // true while viewer is open (full stop)
  var marqueeHovered = false; // true while cursor is over the track (slow down only)
  var oneSetWidth    = 0;

  // -----------------------------------------------------------------------
  // Site info (header / footer only — about content loads in openAbout)
  // -----------------------------------------------------------------------
  function applySiteInfo() {
    if (typeof SITE === "undefined") return;
    document.title = SITE.name + " — Videography";
    setText("siteName", SITE.name);
    setText("footName", SITE.name);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // -----------------------------------------------------------------------
  // About overlay
  // -----------------------------------------------------------------------
  function openAbout() {
    if (typeof SITE !== "undefined") {
      setText("aoName", SITE.name);
      setText("aoRole", SITE.role || "");
      setText("aoText", SITE.about || "");

      var list = document.getElementById("aoContacts");
      list.innerHTML = "";
      (SITE.contact || []).forEach(function (c) {
        var li = document.createElement("li");
        var a  = document.createElement("a");
        a.textContent = c.label;
        a.href = c.link;
        if (c.link.indexOf("mailto:") !== 0) { a.target = "_blank"; a.rel = "noopener"; }
        li.appendChild(a);
        list.appendChild(li);
      });
    }
    aboutOverlay.classList.add("open");
    aboutOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeAbout() {
    aboutOverlay.classList.remove("open");
    aboutOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // -----------------------------------------------------------------------
  // Showreel marquee
  // -----------------------------------------------------------------------
  function buildShowreel() {
    if (typeof PROJECTS === "undefined" || !PROJECTS.length) {
      srTrack.innerHTML =
        '<p style="color:var(--muted);padding:2rem;text-align:center">No projects yet — add some in content.js</p>';
      return;
    }
    // Two identical sets → seamless infinite loop
    PROJECTS.forEach(function (p, i) { srTrack.appendChild(makeCard(p, i)); });
    PROJECTS.forEach(function (p, i) { srTrack.appendChild(makeCard(p, i)); });

    sizeCards();

    srTrack.addEventListener("mouseenter", function () { marqueeHovered = true;  });
    srTrack.addEventListener("mouseleave", function () { marqueeHovered = false; });

    window.addEventListener("resize", sizeCards);
    requestAnimationFrame(marqueeTick);
  }

  function makeCard(p, index) {
    var card  = document.createElement("div");
    card.className = "reel-card";
    card.dataset.index = index;

    var inner = document.createElement("div");
    inner.className = "reel-inner";

    var img = document.createElement("img");
    img.className = "reel-thumb";
    img.src = thumbUrl(p);
    img.alt = p.title;
    inner.appendChild(img);

    var titleEl = document.createElement("div");
    titleEl.className = "reel-card-title";
    titleEl.textContent = p.title;
    inner.appendChild(titleEl);

    card.appendChild(inner);

    // Hover → play muted background preview
    card.addEventListener("mouseenter", function () {
      if (!inner.querySelector(".reel-preview")) {
        var iframe = document.createElement("iframe");
        iframe.className = "reel-preview";
        iframe.setAttribute("allow", "autoplay");
        iframe.src =
          "https://player.vimeo.com/video/" + encodeURIComponent(p.vimeoId) +
          "?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&dnt=1";
        inner.appendChild(iframe);
        setTimeout(function () {
          if (iframe.parentNode) card.classList.add("preview-ready");
        }, 350);
      }
    });

    card.addEventListener("mouseleave", function () {
      card.classList.remove("preview-ready");
      var prev = inner.querySelector(".reel-preview");
      if (prev) prev.remove();
    });

    card.addEventListener("click", function () { openViewer(index); });

    return card;
  }

  // Cards fill viewport height; on portrait mobile constrain to viewport width
  function sizeCards() {
    if (typeof PROJECTS === "undefined" || !PROJECTS.length) return;

    var hdrH  = parseInt(getCssVar("--hdr"), 10) || 48;
    var isMobile = window.innerWidth <= 640;
    var isLandscapeSmall = window.innerHeight <= 500;
    // match --sr-vpad from CSS
    var vPadUnit = isLandscapeSmall ? 12 : (isMobile ? 16 : Math.min(64, Math.max(32, window.innerHeight * 0.05)));
    var vPad = vPadUnit * 2;

    var cardH = Math.max(140, window.innerHeight - hdrH - vPad);
    var cardW = Math.round(cardH * 16 / 9);

    // On portrait mobile the height-driven width can exceed the viewport
    if (cardW > window.innerWidth) {
      cardW = window.innerWidth;
      cardH = Math.round(cardW * 9 / 16);
    }

    srTrack.querySelectorAll(".reel-card").forEach(function (c) {
      c.style.width  = cardW + "px";
      c.style.height = cardH + "px";
    });

    oneSetWidth  = cardW * PROJECTS.length;
    marqueeSpeed = Math.max(0.1, cardW / (28 * 60)); // ~28 s to cross one card
  }

  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name) || "48";
  }

  function marqueeTick() {
    if (!marqueePaused && oneSetWidth > 0) {
      // Hover slows to 12 % of normal speed; otherwise full speed
      var speed = marqueeHovered ? marqueeSpeed * 0.12 : marqueeSpeed;
      marqueePos -= speed;
      if (marqueePos <= -oneSetWidth) marqueePos += oneSetWidth;
      srTrack.style.transform = "translateX(" + marqueePos + "px)";
    }
    requestAnimationFrame(marqueeTick);
  }

  // -----------------------------------------------------------------------
  // Background preload — tiny 2×2 px muted iframes, one per video.
  // These autoplay silently at page load, populating the browser's CDN cache
  // so that clicking a card plays the video almost instantly.
  // -----------------------------------------------------------------------
  function createPreloadIframes() {
    if (typeof PROJECTS === "undefined") return;
    PROJECTS.forEach(function (p, i) {
      var iframe = document.createElement("iframe");
      iframe.className = "vimeo-preload-frame";
      // Stagger slightly so they each get their own 2 px slot
      iframe.style.right = (i * 3) + "px";
      iframe.setAttribute("allow", "autoplay");
      iframe.setAttribute("aria-hidden", "true");
      iframe.src =
        "https://player.vimeo.com/video/" + encodeURIComponent(p.vimeoId) +
        "?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&dnt=1";
      document.body.appendChild(iframe);
    });
  }

  // -----------------------------------------------------------------------
  // Hi-res thumbnails via Vimeo oEmbed (async — upgrades images when ready)
  // -----------------------------------------------------------------------
  function fetchHiResThumbs() {
    if (typeof PROJECTS === "undefined") return;
    PROJECTS.forEach(function (p, i) {
      if (p.thumbnail) return; // user-supplied thumbnail, leave it alone
      fetch(
        "https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F" +
        p.vimeoId + "&width=1920",
        { mode: "cors" }
      )
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var base = d && d.thumbnail_url;
          if (!base) return;

          // Try the highest available resolution from Vimeo's CDN
          var hiRes = base.replace(/_\d+x\d+/, "_1920x1080");
          p._hiResThumb = hiRes;

          document.querySelectorAll(
            ".reel-card[data-index=\"" + i + "\"] .reel-thumb"
          ).forEach(function (img) {
            // Fall back to oEmbed URL if 1920 doesn't exist on CDN
            img.onerror = function () { img.src = base; img.onerror = null; };
            img.src = hiRes;
          });
        })
        .catch(function () {});
    });
  }

  // -----------------------------------------------------------------------
  // Expanded viewer
  // -----------------------------------------------------------------------
  function openViewer(index) {
    var n = PROJECTS.length;
    current = ((index % n) + n) % n;
    var p = PROJECTS[current];

    marqueePaused = true;

    // Labels
    vwName.textContent  = (typeof SITE !== "undefined" ? SITE.name : "").toUpperCase();
    vwTitle.textContent = p.title.toUpperCase();

    var prevIdx = (current - 1 + n) % n;
    var nextIdx = (current + 1) % n;
    vwPrevLabel.textContent = PROJECTS[prevIdx].title;
    vwNextLabel.textContent = PROJECTS[nextIdx].title;
    vwPrevThumb.src = thumbUrl(PROJECTS[prevIdx]);
    vwNextThumb.src = thumbUrl(PROJECTS[nextIdx]);
    vwPrev.style.visibility = n > 1 ? "" : "hidden";
    vwNext.style.visibility = n > 1 ? "" : "hidden";

    // Credits
    creditsBtn.style.display = (p.credits && p.credits.length) ? "" : "none";
    creditsOverlay.hidden = true;
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

    // Build the player fresh each time — video data is warm in CDN cache
    destroyPlayer();
    playerFrame.innerHTML = "";
    viewer.classList.remove("is-paused");

    var holder = document.createElement("div");
    holder.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
    playerFrame.appendChild(holder);

    if (typeof Vimeo !== "undefined" && Vimeo.Player) {
      // Start muted=true so the browser allows autoplay, then unmute immediately
      // once the player is ready. This is the only reliable cross-browser pattern
      // for getting sound on a cross-origin Vimeo iframe triggered by a user click.
      player = new Vimeo.Player(holder, {
        id:         parseInt(p.vimeoId, 10),
        autoplay:   true,
        muted:      true,   // muted so the browser permits autoplay
        title:      false,
        byline:     false,
        portrait:   false,
        dnt:        true,
        responsive: false
      });
      player.on("pause", function () { viewer.classList.add("is-paused"); });
      player.on("play",  function () { viewer.classList.remove("is-paused"); });
      player.ready().then(function () {
        // Unmute + full volume as soon as the player is initialised
        player.setMuted(false);
        player.setVolume(1);
        player.setQuality("1080p").catch(function () {
          player.setQuality("720p").catch(function () {});
        });
      });
    } else {
      // Fallback: plain iframe if SDK failed to load
      var iframe = document.createElement("iframe");
      iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.src =
        "https://player.vimeo.com/video/" + encodeURIComponent(p.vimeoId) +
        "?autoplay=1&title=0&byline=0&portrait=0&dnt=1";
      iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;";
      holder.appendChild(iframe);
    }

    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function destroyPlayer() {
    if (player && typeof player.destroy === "function") {
      try { player.destroy(); } catch (e) {}
    }
    player = null;
  }

  function closeViewer() {
    destroyPlayer();
    playerFrame.innerHTML = "";
    viewer.classList.remove("open", "is-paused");
    viewer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    creditsOverlay.hidden = true;
    marqueePaused = false;
  }

  function viewerGoTo(index) {
    creditsOverlay.hidden = true;
    openViewer(index);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function thumbUrl(p) {
    return p._hiResThumb || p.thumbnail ||
      ("https://vumbnail.com/" + encodeURIComponent(p.vimeoId) + ".jpg");
  }

  // -----------------------------------------------------------------------
  // Event listeners
  // -----------------------------------------------------------------------

  // About overlay
  document.getElementById("aboutLink").addEventListener("click", function (e) {
    e.preventDefault();
    openAbout();
  });
  aoClose.addEventListener("click", closeAbout);
  aboutOverlay.addEventListener("click", function (e) {
    if (e.target === aboutOverlay) closeAbout(); // click outside content area
  });

  // Clicking the viewer background closes it.
  // Protected: video iframe, credits overlay, the tight safe-zone around title/credits.
  // .vw-nav panels have their own close handler (see below); buttons inside them navigate.
  viewer.addEventListener("click", function (e) {
    if (e.target.closest(".player-frame, .credits-overlay, .vw-bottom-safe, .vw-nav")) return;
    closeViewer();
  });

  // Viewer controls
  vwClose.addEventListener("click", closeViewer);

  // Whole nav panel → close viewer (go back to marquee)
  vwPrev.addEventListener("click", closeViewer);
  vwNext.addEventListener("click", closeViewer);

  // Arrow icon hit-area → navigate between projects (stops bubbling so panel doesn't also close)
  vwPrev.querySelector(".vw-nav-hit").addEventListener("click", function (e) {
    e.stopPropagation();
    viewerGoTo(current - 1);
  });
  vwNext.querySelector(".vw-nav-hit").addEventListener("click", function (e) {
    e.stopPropagation();
    viewerGoTo(current + 1);
  });
  creditsBtn.addEventListener("click", function () { creditsOverlay.hidden = false; });
  coClose.addEventListener("click",    function () { creditsOverlay.hidden = true;  });

  // Mobile audio unlock — iOS/Android block unmuted autoplay in cross-origin iframes
  // even with a user gesture. The first touch on the open viewer is itself a gesture;
  // we use it to call setMuted(false) which iOS accepts as a user-initiated action.
  viewer.addEventListener("touchstart", function () {
    if (player && viewer.classList.contains("open")) {
      player.setMuted(false).catch(function () {});
      player.setVolume(1).catch(function () {});
    }
  }, { passive: true });

  // Keyboard
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (viewer.classList.contains("open")) {
        if (!creditsOverlay.hidden) { creditsOverlay.hidden = true; return; }
        closeViewer();
      } else if (aboutOverlay.classList.contains("open")) {
        closeAbout();
      }
    }
    if (!viewer.classList.contains("open")) return;
    if (e.key === "ArrowLeft")  viewerGoTo(current - 1);
    if (e.key === "ArrowRight") viewerGoTo(current + 1);
  });

  // "Work" nav / logo close viewer + about
  document.querySelectorAll("[data-go-home]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (viewer.classList.contains("open"))      closeViewer();
      if (aboutOverlay.classList.contains("open")) closeAbout();
    });
  });

  // -----------------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------------
  applySiteInfo();
  buildShowreel();
  createPreloadIframes(); // kick off background buffering immediately
  fetchHiResThumbs();     // async — replaces vumbnail with hi-res CDN thumbnails
})();
