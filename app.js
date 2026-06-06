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
  var vwPrevLabel      = document.getElementById("vwPrevLabel");
  var vwNextLabel      = document.getElementById("vwNextLabel");
  var vwPrevThumb      = document.getElementById("vwPrevThumb");
  var vwNextThumb      = document.getElementById("vwNextThumb");
  var vwPrevThumbWrap  = document.getElementById("vwPrevThumbWrap");
  var vwNextThumbWrap  = document.getElementById("vwNextThumbWrap");
  var playerFrame    = document.getElementById("playerFrame");
  var vwClickToggle    = document.getElementById("vwClickToggle");
  var vwControls       = document.getElementById("vwControls");
  var vwcPlay          = document.getElementById("vwcPlay");
  var vwcTime          = document.getElementById("vwcTime");
  var vwcProgress      = document.getElementById("vwcProgress");
  var vwcProgressFill  = document.getElementById("vwcProgressFill");
  var vwcProgressHandle= document.getElementById("vwcProgressHandle");
  var vwcMute          = document.getElementById("vwcMute");
  var vwcVolume        = document.getElementById("vwcVolume");
  var vwcFullscreen    = document.getElementById("vwcFullscreen");
  var srFfPrev       = document.getElementById("srFfPrev");
  var srFfNext       = document.getElementById("srFfNext");
  var creditsBtn     = document.getElementById("creditsBtn");
  var creditsOverlay = document.getElementById("creditsOverlay");
  var coClose        = document.getElementById("coClose");
  var coTitle        = document.getElementById("coTitle");
  var coList         = document.getElementById("coList");

  // --- State -------------------------------------------------------------
  var current      = 0;
  var player       = null;   // active Vimeo.Player
  var playerDuration = 0;
  var isScrubbing    = false;

  // Marquee
  var marqueePos     = 0;
  var marqueeSpeed   = 0.6;
  var marqueePaused  = false; // true while viewer is open (full stop)
  var marqueeHovered = false; // true while cursor is over the track (slow down only)
  var marqueeFf      = 0;     // fast-forward multiplier: -1 rewind, 0 normal, +1 forward
  var oneSetWidth    = 0;
  var isDragging     = false; // true once gesture is locked to horizontal
  var dragStartX     = 0;
  var dragStartY     = 0;
  var dragStartPos   = 0;
  var dragLocked     = null; // null = undecided | 'h' = horizontal | 'v' = vertical

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

    // Touch drag — finger-scroll the showreel; auto-scroll resumes on release.
    // Direction is locked after the first ~4 px of movement so that a vertical
    // page-scroll never moves the reel, and a horizontal reel-drag never scrolls
    // the page at the same time.
    var srWrap = srTrack.parentElement;
    srWrap.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      isDragging   = false;   // wait for direction lock before engaging
      dragLocked   = null;
      dragStartX   = e.touches[0].clientX;
      dragStartY   = e.touches[0].clientY;
      dragStartPos = marqueePos;
    }, { passive: true });
    srWrap.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - dragStartX;
      var dy = e.touches[0].clientY - dragStartY;

      // Decide direction once movement exceeds the threshold
      if (!dragLocked) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return; // not enough movement yet
        dragLocked = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
        if (dragLocked === 'h') isDragging = true;
      }

      if (dragLocked === 'v') return; // vertical — let the browser scroll the page

      // Horizontal reel drag: block page scroll and move the track
      e.preventDefault();
      marqueePos = dragStartPos + dx;
      while (marqueePos > 0)             marqueePos -= oneSetWidth;
      while (marqueePos <= -oneSetWidth) marqueePos += oneSetWidth;
      srTrack.style.transform = "translateX(" + marqueePos + "px)";
    }, { passive: false }); // passive:false required to call preventDefault
    function endReelDrag() { isDragging = false; dragLocked = null; }
    srWrap.addEventListener("touchend",    endReelDrag);
    srWrap.addEventListener("touchcancel", endReelDrag);

    // Only resize cards when the viewport WIDTH changes (real resize or orientation
    // change). On mobile, the browser URL bar collapsing only changes the HEIGHT —
    // firing sizeCards() on that causes the layout to jump / flicker on every scroll.
    var _prevResizeWidth = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth !== _prevResizeWidth) {
        _prevResizeWidth = window.innerWidth;
        sizeCards();
      }
    });
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

    // Hover → play muted background preview.
    // The iframe + player are created once (lazily, on first hover) and kept
    // alive — later hovers just resume an already-warm player, so playback
    // appears instantly with no reload delay or gray flash. The thumbnail
    // only fades out once the preview is actually *playing*, never on a guess-timer.
    var previewIframe = null;
    var previewPlayer = null;
    var previewReady  = false;

    function ensurePreview() {
      if (previewIframe) return;
      previewIframe = document.createElement("iframe");
      previewIframe.className = "reel-preview";
      previewIframe.setAttribute("allow", "autoplay");
      previewIframe.src =
        "https://player.vimeo.com/video/" + encodeURIComponent(p.vimeoId) +
        "?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&dnt=1";
      inner.appendChild(previewIframe);

      if (typeof Vimeo !== "undefined" && Vimeo.Player) {
        previewPlayer = new Vimeo.Player(previewIframe);
        previewPlayer.on("playing", function () {
          previewReady = true;
          if (card.matches(":hover")) card.classList.add("preview-ready");
        });
      } else {
        // No SDK to confirm playback — fall back to a short guess-timer
        previewIframe.addEventListener("load", function () {
          setTimeout(function () {
            previewReady = true;
            if (card.matches(":hover")) card.classList.add("preview-ready");
          }, 250);
        });
      }
    }

    card.addEventListener("mouseenter", function () {
      ensurePreview();
      if (previewPlayer) previewPlayer.play().catch(function () {});
      // Already loaded once before — resuming is instant, no need to wait again
      if (previewReady) card.classList.add("preview-ready");
    });

    card.addEventListener("mouseleave", function () {
      card.classList.remove("preview-ready");
      if (previewPlayer) previewPlayer.pause().catch(function () {});
    });

    card.addEventListener("click", function () { openViewer(index); });

    return card;
  }

  // Cards fill viewport height.
  // Portrait mobile: cards are sized by HEIGHT and may be wider than the screen —
  // the sr-wrap overflow:hidden clips the sides, giving tall cinematic thumbnails.
  // All other layouts: constrain width to the viewport so cards don't overflow.
  function sizeCards() {
    if (typeof PROJECTS === "undefined" || !PROJECTS.length) return;

    var hdrH  = parseInt(getCssVar("--hdr"), 10) || 48;
    var isMobile = window.innerWidth <= 640;
    var isLandscapeSmall = window.innerHeight <= 500;
    var isPortrait = window.innerHeight > window.innerWidth; // phone held upright
    // match --sr-vpad from CSS
    var vPadUnit = isLandscapeSmall ? 12 : (isMobile ? 16 : Math.min(64, Math.max(32, window.innerHeight * 0.05)));
    var vPad = vPadUnit * 2;

    var cardH = Math.max(140, window.innerHeight - hdrH - vPad);
    // Desktop: 20% smaller than full height. Mobile: 50% smaller (0.4 = half of 0.8).
    cardH = Math.round(cardH * (isMobile ? 0.4 : 0.8));
    var cardW = Math.round(cardH * 16 / 9);

    // On portrait mobile we intentionally let the card be wider than the screen —
    // the horizontal overflow is clipped by .sr-wrap (overflow:hidden) and the
    // marquee scrolls it correctly. This gives a full-height thumbnail feel.
    // On all other layouts, cap width to the viewport.
    if (cardW > window.innerWidth && !isPortrait) {
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
    if (!marqueePaused && !isDragging && oneSetWidth > 0) {
      var speed;
      if (marqueeFf !== 0) {
        // Fast-forward / rewind hot-zones — ~6× normal speed, either direction
        speed = marqueeFf * marqueeSpeed * 6;
      } else {
        // Hover slows to 12 % of normal speed; otherwise full speed
        speed = marqueeHovered ? marqueeSpeed * 0.12 : marqueeSpeed;
      }
      marqueePos -= speed;
      if (marqueePos > 0) marqueePos -= oneSetWidth;
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
    setNavPreview(vwPrevThumbWrap, vwPrevThumb, PROJECTS[prevIdx]);
    setNavPreview(vwNextThumbWrap, vwNextThumb, PROJECTS[nextIdx]);
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
    vwControls.style.display = "";
    vwClickToggle.style.display = "";
    resetPlayerControls();

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
        controls:   false,  // we render our own playhead / volume / fullscreen UI
        dnt:        true,
        responsive: false
      });
      player.on("pause", function () { viewer.classList.add("is-paused"); });
      player.on("play",  function () { viewer.classList.remove("is-paused"); });
      bindPlayerControls(player);
      player.ready().then(function () {
        // Unmute + full volume as soon as the player is initialised
        player.setMuted(false);
        player.setVolume(1);
        vwcMute.textContent = "♪";
        vwcVolume.value = 1;
        player.setQuality("1080p").catch(function () {
          player.setQuality("720p").catch(function () {});
        });
      });
    } else {
      // Fallback: plain iframe if SDK failed to load — no API access, so hide our
      // custom controls and let Vimeo's native bar show instead.
      vwControls.style.display = "none";
      vwClickToggle.style.display = "none";
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

  // Creates/replaces a muted looping background preview iframe inside a nav-thumb-wrap,
  // crossfading over the static thumbnail once the video actually starts playing.
  function setNavPreview(wrap, imgEl, p) {
    var old = wrap.querySelector(".vw-nav-preview");
    if (old) old.remove();
    wrap.classList.remove("preview-ready");
    imgEl.src = thumbUrl(p);
    // No live previews on mobile — thumb-wrap is hidden anyway and iframes waste data.
    if (window.innerWidth <= 640) return;

    var iframe = document.createElement("iframe");
    iframe.className = "vw-nav-preview";
    iframe.setAttribute("allow", "autoplay");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.src =
      "https://player.vimeo.com/video/" + encodeURIComponent(p.vimeoId) +
      "?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&dnt=1";
    wrap.appendChild(iframe);

    if (typeof Vimeo !== "undefined" && Vimeo.Player) {
      var pv = new Vimeo.Player(iframe);
      pv.on("playing", function () { wrap.classList.add("preview-ready"); });
    } else {
      iframe.addEventListener("load", function () {
        setTimeout(function () { wrap.classList.add("preview-ready"); }, 300);
      });
    }
  }

  function destroyPlayer() {
    if (player && typeof player.destroy === "function") {
      try { player.destroy(); } catch (e) {}
    }
    player = null;
  }

  // -----------------------------------------------------------------------
  // Custom player controls (play/pause, playhead, volume, fullscreen)
  // -----------------------------------------------------------------------
  function formatTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function resetPlayerControls() {
    playerDuration = 0;
    isScrubbing = false;
    vwcPlay.textContent = "▶";
    vwcProgressFill.style.width = "0%";
    vwcProgressHandle.style.left = "0%";
    vwcTime.textContent = "0:00 / 0:00";
    vwcMute.textContent = "♪";
    vwcVolume.value = 1;
  }

  function setProgress(frac) {
    frac = Math.min(1, Math.max(0, frac));
    vwcProgressFill.style.width  = (frac * 100) + "%";
    vwcProgressHandle.style.left = (frac * 100) + "%";
  }

  function scrubFromEvent(e) {
    var rect = vwcProgress.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return Math.min(1, Math.max(0, rect.width ? x / rect.width : 0));
  }

  // Bound once — these always act on whatever `player` currently is.
  function initPlayerControlEvents() {
    function togglePlay() {
      if (!player) return;
      player.getPaused().then(function (paused) {
        if (paused) player.play(); else player.pause();
      });
    }

    vwcPlay.addEventListener("click", togglePlay);

    // Click anywhere in the middle of the video to play/pause
    vwClickToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePlay();
    });

    function startScrub(e) {
      if (!player || !playerDuration) return;
      isScrubbing = true;
      var frac = scrubFromEvent(e);
      setProgress(frac);
      player.setCurrentTime(frac * playerDuration);
    }
    function moveScrub(e) {
      if (!isScrubbing) return;
      var frac = scrubFromEvent(e);
      setProgress(frac);
      player.setCurrentTime(frac * playerDuration);
    }
    function endScrub() { isScrubbing = false; }

    vwcProgress.addEventListener("pointerdown", function (e) {
      startScrub(e);
      vwcProgress.setPointerCapture(e.pointerId);
    });
    vwcProgress.addEventListener("pointermove", moveScrub);
    vwcProgress.addEventListener("pointerup",     endScrub);
    vwcProgress.addEventListener("pointercancel", endScrub);

    vwcMute.addEventListener("click", function () {
      if (!player) return;
      player.getMuted().then(function (muted) {
        var next = !muted;
        player.setMuted(next);
        vwcMute.textContent = next ? "✕" : "♪";
      });
    });

    vwcVolume.addEventListener("input", function () {
      if (!player) return;
      var v = parseFloat(vwcVolume.value);
      player.setVolume(v);
      var muted = v <= 0;
      player.setMuted(muted);
      vwcMute.textContent = muted ? "✕" : "♪";
    });

    vwcFullscreen.addEventListener("click", function (e) {
      e.stopPropagation();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (viewer.requestFullscreen) {
        viewer.requestFullscreen();
      }
    });

    // Prevent clicks on the controls bar from bubbling to the viewer
    // (which would otherwise close it / trigger nav panels).
    vwControls.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  // Bound fresh for each new Vimeo.Player instance.
  function bindPlayerControls(p) {
    resetPlayerControls();

    p.getDuration().then(function (d) {
      playerDuration = d;
      vwcTime.textContent = "0:00 / " + formatTime(d);
    });

    p.on("timeupdate", function (data) {
      if (!playerDuration) playerDuration = data.duration;
      if (!isScrubbing) setProgress(data.percent);
      vwcTime.textContent = formatTime(data.seconds) + " / " + formatTime(data.duration);
    });

    p.on("play",  function () { vwcPlay.textContent = "❚❚"; });
    p.on("pause", function () { vwcPlay.textContent = "▶";  });

    p.on("volumechange", function (data) {
      vwcVolume.value = data.volume;
    });
  }

  function closeViewer() {
    // Exit fullscreen first — on mobile, staying in fullscreen while closing the viewer
    // locks the user on a blank fullscreen page with no way to interact.
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    }
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

  // Desktop: clicking the nav panel background (outside hit area) closes viewer.
  // Mobile (portrait or landscape): entire nav always navigates — only X closes.
  function isMobileViewport() {
    return window.innerWidth <= 640 || window.innerHeight <= 500;
  }
  vwPrev.addEventListener("click", function () {
    if (isMobileViewport()) { viewerGoTo(current - 1); } else { closeViewer(); }
  });
  vwNext.addEventListener("click", function () {
    if (isMobileViewport()) { viewerGoTo(current + 1); } else { closeViewer(); }
  });

  // Arrow icon hit-area → navigate between projects (stops bubbling so panel doesn't also close)
  vwPrev.querySelector(".vw-nav-hit").addEventListener("click", function (e) {
    e.stopPropagation();
    viewerGoTo(current - 1);
  });
  vwNext.querySelector(".vw-nav-hit").addEventListener("click", function (e) {
    e.stopPropagation();
    viewerGoTo(current + 1);
  });
  // Showreel fast-forward / rewind — mouse (desktop) + touch (mobile)
  srFfNext.addEventListener("mouseenter",  function ()  { marqueeFf =  1; });
  srFfNext.addEventListener("mouseleave",  function ()  { marqueeFf =  0; });
  srFfPrev.addEventListener("mouseenter",  function ()  { marqueeFf = -1; });
  srFfPrev.addEventListener("mouseleave",  function ()  { marqueeFf =  0; });
  srFfNext.addEventListener("touchstart",  function (e) { e.preventDefault(); marqueeFf =  1; }, { passive: false });
  srFfNext.addEventListener("touchend",    function ()  { marqueeFf =  0; });
  srFfNext.addEventListener("touchcancel", function ()  { marqueeFf =  0; });
  srFfPrev.addEventListener("touchstart",  function (e) { e.preventDefault(); marqueeFf = -1; }, { passive: false });
  srFfPrev.addEventListener("touchend",    function ()  { marqueeFf =  0; });
  srFfPrev.addEventListener("touchcancel", function ()  { marqueeFf =  0; });

  creditsBtn.addEventListener("click", function () { creditsOverlay.hidden = false; });
  coClose.addEventListener("click",    function () { creditsOverlay.hidden = true;  });

  // Mobile audio unlock — iOS/Android block unmuted autoplay in cross-origin iframes
  // even with a user gesture. The first touch on the open viewer is itself a gesture;
  // we use it to call setMuted(false) which iOS accepts as a user-initiated action.
  // Skip if the touch is on the controls bar — those buttons manage mute/volume
  // themselves, and unconditionally unmuting here fights with the mute-toggle click.
  viewer.addEventListener("touchstart", function (e) {
    if (!player || !viewer.classList.contains("open")) return;
    if (e.target.closest("#vwControls")) return;
    player.setMuted(false).catch(function () {});
    player.setVolume(1).catch(function () {});
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
  initPlayerControlEvents();
  buildShowreel();
  createPreloadIframes(); // kick off background buffering immediately
  fetchHiResThumbs();     // async — replaces vumbnail with hi-res CDN thumbnails
})();
