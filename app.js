(() => {
  if (window.__COTTAGE_APP_BOOTED__) {
    return;
  }
  window.__COTTAGE_APP_BOOTED__ = true;

  const state = {
    tab: "start",
    search: "",
    filter: "All",
    calendarYear: new Date().getFullYear()
  };

  const STORAGE_KEYS = {
    textSize: "cottage-large-text",
    checks: "cottage-checklist-state",
    eventsCache: "cottage-events-cache-v2",
    calendarCache: "cottage-calendar-cache-v1"
  };

  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  const contentArea = document.getElementById("contentArea");
  const filterChips = document.getElementById("filterChips");
  const searchInput = document.getElementById("searchInput");
  const searchKeyboardToggle = document.getElementById("searchKeyboardToggle");
  const searchKeyboard = document.getElementById("searchKeyboard");
  const searchKeys = Array.from(document.querySelectorAll(".search-key"));
  const searchStatus = document.getElementById("searchStatus");
  const clockNode = document.getElementById("clock");
  const dateNode = document.getElementById("todayDate");
  const contentReviewedNode = document.getElementById("contentReviewed");
  const textSizeToggle = document.getElementById("textSizeToggle");
  const detailDialog = document.getElementById("detailDialog");
  const dialogTitle = document.getElementById("dialogTitle");
  const dialogBody = document.getElementById("dialogBody");
  const closeDialog = document.getElementById("closeDialog");
  const eventsState = {
    loaded: false,
    loading: false,
    items: [],
    lastUpdated: null,
    error: ""
  };
  const calendarState = {
    loaded: false,
    loading: false,
    items: [],
    lastUpdated: null,
    error: "",
    sourceStatuses: []
  };

  const checklistState = loadChecklistState();
  let lastDialogTrigger = null;

  initClock();
  bindEvents();
  initSearchKeyboard();
  hydrateTextSize();
  initEventAutoRefresh();
  initCalendarAutoRefresh();
  render();

  if ("serviceWorker" in navigator && "register" in navigator.serviceWorker) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        // App still works without service worker.
      });
    });
  }

  function bindEvents() {
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        selectTab(btn.dataset.tab);
      });
    });

    searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      renderCards();
    });

    textSizeToggle.addEventListener("click", () => {
      const hasLargeText = document.body.classList.toggle("large-text");
      localStorage.setItem(STORAGE_KEYS.textSize, String(hasLargeText));
      textSizeToggle.textContent = `Large Text: ${hasLargeText ? "On" : "Off"}`;
    });

    if (closeDialog) {
      closeDialog.addEventListener("click", () => {
        if (typeof detailDialog?.close === "function") {
          detailDialog.close();
          lastDialogTrigger?.focus?.();
        }
      });
    }

    if (detailDialog) {
      detailDialog.addEventListener("click", (event) => {
        if (typeof detailDialog.close !== "function") {
          return;
        }

        const rect = detailDialog.getBoundingClientRect();
        const clickedInDialog =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!clickedInDialog) {
          detailDialog.close();
          lastDialogTrigger?.focus?.();
        }
      });
    }
  }

  function initSearchKeyboard() {
    if (!searchInput || !searchKeyboard || !searchKeyboardToggle || !searchKeys.length) {
      return;
    }

    const setKeyboardLock = () => {};

    const showKeyboard = () => {
      searchKeyboard.hidden = false;
      searchKeyboard.setAttribute("aria-hidden", "false");
      searchKeyboardToggle.setAttribute("aria-expanded", "true");
    };

    const hideKeyboard = () => {
      searchKeyboard.hidden = true;
      searchKeyboard.setAttribute("aria-hidden", "true");
      searchKeyboardToggle.setAttribute("aria-expanded", "false");
    };

    const toggleKeyboard = () => {
      if (searchKeyboard.hidden) {
        setKeyboardLock(false);
        showKeyboard();
        searchInput.focus();
        return;
      }
      hideKeyboard();
      setKeyboardLock(true);
      searchInput.blur();
    };

    const commitSearch = () => {
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    };

    hideKeyboard();
    searchKeyboardToggle.addEventListener("click", toggleKeyboard);

    searchKeys.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        const key = button.dataset.key;

        if (action === "done") {
          hideKeyboard();
          setKeyboardLock(true);
          searchInput.blur();
          return;
        }

        if (action === "backspace") {
          searchInput.value = searchInput.value.slice(0, -1);
          commitSearch();
          return;
        }

        if (action === "clear") {
          searchInput.value = "";
          commitSearch();
          return;
        }

        if (action === "space") {
          searchInput.value += " ";
          commitSearch();
          return;
        }

        if (key) {
          searchInput.value += key;
          commitSearch();
        }
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target === searchInput || searchInput.contains(target) || searchKeyboard.contains(target)) {
        return;
      }

      if (target === searchKeyboardToggle || searchKeyboardToggle.contains(target)) {
        return;
      }

      hideKeyboard();
      setKeyboardLock(true);
      searchInput.blur();
    });
  }

  function initClock() {
    const updateTime = () => {
      const now = new Date();
      clockNode.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      dateNode.textContent = now.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
    };

    updateTime();
    setInterval(updateTime, 1000 * 20);
    if (contentReviewedNode) {
      const reviewed = window.COTTAGE_DATA?.content?.lastReviewed;
      contentReviewedNode.textContent = reviewed ? formatShortDate(reviewed) : "Not set";
    }
  }

  function initEventAutoRefresh() {
    const refreshMs = window.COTTAGE_DATA.events.refreshMinutes * 60 * 1000;
    setInterval(() => {
      if (state.tab === "events") {
        void loadEvents(true);
      }
    }, refreshMs);
  }

  function initCalendarAutoRefresh() {
    const refreshMinutes = Number(window.COTTAGE_DATA?.calendar?.refreshMinutes || 30);
    const refreshMs = Math.max(5, refreshMinutes) * 60 * 1000;
    setInterval(() => {
      if (state.tab === "calendar") {
        void loadCalendars(true);
      }
    }, refreshMs);
  }

  function hydrateTextSize() {
    const largeText = localStorage.getItem(STORAGE_KEYS.textSize) === "true";
    document.body.classList.toggle("large-text", largeText);
    textSizeToggle.textContent = `Large Text: ${largeText ? "On" : "Off"}`;
  }

  function setActiveTab() {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === state.tab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(isActive));
      btn.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  }

  function selectTab(tab, nextFilter = "All") {
    state.tab = tab;
    state.search = "";
    state.filter = nextFilter;
    if (searchInput) {
      searchInput.value = "";
    }
    setActiveTab();
    render();
  }

  function render() {
    setActiveTab();
    renderFilterChips();
    renderCards();
  }

  function renderFilterChips() {
    const categories = getCategoriesForTab(state.tab);
    if (!categories.length) {
      filterChips.innerHTML = "";
      filterChips.hidden = true;
      return;
    }

    filterChips.hidden = false;
    const values = ["All", ...categories];
    filterChips.innerHTML = "";

    values.forEach((value) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip ${value === state.filter ? "active" : ""}`;
      chip.textContent = value;
      chip.addEventListener("click", () => {
        state.filter = value;
        renderCards();
        renderFilterChips();
      });
      filterChips.appendChild(chip);
    });
  }

  function getCategoriesForTab(tab) {
    if (tab === "start") {
      return [];
    }
    if (tab === "essentials") {
      return organizeItemsByCategory(window.COTTAGE_DATA.essentials || [], "category", "title").map((group) => group.category);
    }
    if (tab === "events") {
      return ["Live Feed", "Local Source", "County Source"];
    }
    if (tab === "businesses") {
      return organizeItemsByCategory(window.COTTAGE_DATA.businesses, "category", "name").map((group) => group.category);
    }
    if (tab === "rules") {
      return organizeItemsByCategory(window.COTTAGE_DATA.rules, "category", "title").map((group) => group.category);
    }
    if (tab === "tips") {
      return organizeItemsByCategory(window.COTTAGE_DATA.tips, "category", "title").map((group) => group.category);
    }
    if (tab === "calendar") {
      return unique((window.COTTAGE_DATA.calendar?.sources || []).map((source) => source.name).filter(Boolean));
    }
    return ["Arrival", "Departure"];
  }

  function renderCards() {
    contentArea.innerHTML = "";

    if (state.tab === "start") {
      renderStartHereCards();
      announceSearchResults();
      return;
    }

    if (state.tab === "essentials") {
      renderEssentialsCards();
      announceSearchResults();
      return;
    }

    if (state.tab === "events") {
      renderEventCards();
      announceSearchResults();
      return;
    }

    if (state.tab === "businesses") {
      renderBusinessCards();
      announceSearchResults();
      return;
    }

    if (state.tab === "rules") {
      renderRuleCards();
      announceSearchResults();
      return;
    }

    if (state.tab === "tips") {
      renderTipCards();
      announceSearchResults();
      return;
    }

    if (state.tab === "calendar") {
      renderCalendarCards();
      announceSearchResults();
      return;
    }

    renderChecklistCards();
    announceSearchResults();
  }

  function announceSearchResults() {
    if (!searchStatus) {
      return;
    }

    const count = contentArea.querySelectorAll(".card").length;
    searchStatus.textContent = state.search
      ? `${count} result${count === 1 ? "" : "s"} in ${getTabLabel(state.tab)}`
      : `Showing ${getTabLabel(state.tab)}`;
  }

  function getTabLabel(tab) {
    const button = tabButtons.find((item) => item.dataset.tab === tab);
    return button?.textContent?.trim() || "this section";
  }

  function renderStartHereCards() {
    const host = window.COTTAGE_DATA.host || {};
    const property = window.COTTAGE_DATA.property || {};
    const wifiTip = window.COTTAGE_DATA.tips.find((item) => item.id === "wifi-access");
    const waterTip = window.COTTAGE_DATA.tips.find((item) => item.id === "water");
    const trashTip = window.COTTAGE_DATA.tips.find((item) => item.id === "trash");
    const topBusinesses = getBusinessesByIds((window.COTTAGE_DATA.businessHighlights?.[0]?.businessIds) || []);

    const heroBlock = document.createElement("section");
    heroBlock.className = "start-here-hero";

    const heroTop = document.createElement("div");
    heroTop.className = "start-here-hero-top";

    const heroCopy = document.createElement("div");
    heroCopy.className = "start-here-hero-copy";

    const heroEyebrow = document.createElement("span");
    heroEyebrow.className = "start-here-hero-eyebrow";
    heroEyebrow.textContent = "Guest Quick Start";

    const heroTitle = document.createElement("h2");
    heroTitle.textContent = property.name || "Welcome to the cottage";

    const heroSummary = document.createElement("p");
    heroSummary.textContent = host.directBookingNote || "Use this page first for the fastest answers during your stay.";

    const heroActionRow = document.createElement("div");
    heroActionRow.className = "start-here-hero-actions";
    heroActionRow.append(
      makeButton("Essentials", () => selectTab("essentials"), "primary"),
      makeButton("Calendar", () => selectTab("calendar")),
      makeButton("Need help?", () => selectTab("essentials", "Support"))
    );

    const quickContactRow = document.createElement("div");
    quickContactRow.className = "start-here-quick-contact-row";
    quickContactRow.append(
      makeAnchor("Call Host", `tel:${toDialablePhone(host.phone || "")}`),
      makeAnchor("Email Host", `mailto:${host.email || ""}`),
      makeButton("Emergency", () => window.open("tel:911", "_self"), "primary"),
      makeButton("Property Info", () => selectTab("essentials", "Property"))
    );

    heroCopy.append(heroEyebrow, heroTitle, heroSummary, heroActionRow, quickContactRow);

    const heroStats = document.createElement("div");
    heroStats.className = "start-here-hero-stats";

    const stats = [
      { label: "Check-in", value: property.checkIn || "3:00 PM" },
      { label: "Check-out", value: property.checkOut || "10:00 AM" },
      { label: "Host", value: host.name || "Rick" }
    ];

    stats.forEach((stat) => {
      const item = document.createElement("div");
      item.className = "start-here-stat";
      const label = document.createElement("span");
      label.textContent = stat.label;
      const value = document.createElement("strong");
      value.textContent = stat.value;
      item.append(label, value);
      heroStats.appendChild(item);
    });

    const heroPanel = document.createElement("div");
    heroPanel.className = "start-here-hero-panel";

    const panelTitle = document.createElement("strong");
    panelTitle.textContent = "Quick Essentials";

    const panelList = document.createElement("div");
    panelList.className = "start-here-hero-panel-list";

    const panelItems = [
      { label: "Address", value: property.address || "64 Woodstock Ave, Long Point, ON" },
      { label: "Emergency", value: "Call 911 for fire, medical, or police emergencies." },
      { label: "Pump", value: "If water pressure drops, check the pump switch in the utility closet." },
      { label: "Host", value: host.phone || "519 427 9922" }
    ];

    panelItems.forEach((item) => {
      const row = document.createElement("div");
      row.className = "start-here-hero-panel-item";

      const label = document.createElement("span");
      label.textContent = item.label;

      const value = document.createElement("p");
      value.textContent = item.value;

      row.append(label, value);
      panelList.appendChild(row);
    });

    heroPanel.append(panelTitle, panelList);

    heroTop.append(heroCopy, heroStats, heroPanel);
    heroBlock.appendChild(heroTop);
    renderSpotifyPlayer();

    const featuredHighlight = window.COTTAGE_DATA.businessHighlights?.[0];
    const featuredBusinesses = getBusinessesByIds(featuredHighlight?.businessIds || []);

    if (featuredBusinesses.length) {
      const featuredSection = document.createElement("section");
      featuredSection.className = "start-here-featured-strip";
      const featuredTints = [
        "linear-gradient(150deg, rgba(94, 60, 22, 0.30), rgba(20, 26, 22, 0.10))",
        "linear-gradient(150deg, rgba(24, 77, 66, 0.30), rgba(20, 26, 22, 0.10))",
        "linear-gradient(150deg, rgba(133, 70, 28, 0.30), rgba(20, 26, 22, 0.10))"
      ];

      const featuredHeader = document.createElement("div");
      featuredHeader.className = "start-here-featured-header";

      const featuredEyebrow = document.createElement("span");
      featuredEyebrow.className = "start-here-featured-eyebrow";
      featuredEyebrow.textContent = "Featured Picks";

      const featuredTitle = document.createElement("h3");
      featuredTitle.textContent = featuredHighlight?.title || "Top Local Picks";

      const featuredSummary = document.createElement("p");
      featuredSummary.textContent = featuredHighlight?.summary || "A few good first options close to the cottage.";

      featuredHeader.append(featuredEyebrow, featuredTitle, featuredSummary);

      const featuredGrid = document.createElement("div");
      featuredGrid.className = "start-here-featured-grid";

      featuredBusinesses.slice(0, 3).forEach((item, index) => {
        const card = document.createElement("article");
        card.className = `start-here-featured-card start-here-featured-card-${index + 1}`;
        if (index === 0) {
          card.classList.add("is-featured-lead");
        }

        const image = document.createElement("div");
        image.className = "start-here-featured-image";
        image.style.backgroundColor = "#1b1712";
        image.style.backgroundImage = `${featuredTints[index % featuredTints.length]}, url('assets/logo.jpg')`;
        image.style.backgroundSize = "cover, cover";
        image.style.backgroundPosition = index === 0 ? "center 28%, center center" : "center center, center center";
        image.style.backgroundRepeat = "no-repeat, no-repeat";

        const overlay = document.createElement("div");
        overlay.className = "start-here-featured-overlay";

        const tag = document.createElement("span");
        tag.textContent = item.category;

        const title = document.createElement("h4");
        title.textContent = item.name;

        const meta = document.createElement("div");
        meta.className = "start-here-featured-meta";

        const distance = document.createElement("span");
        distance.textContent = item.distance;

        const hours = document.createElement("span");
        hours.textContent = item.hours;

        meta.append(distance, hours);

        const summary = document.createElement("p");
        summary.textContent = item.notes || `${item.distance} | ${item.hours}`;

        const actions = document.createElement("div");
        actions.className = "start-here-featured-actions";
        actions.append(
          makeButton("Details", () =>
            openDetails(item.name, {
              paragraphs: [item.notes],
              fields: [
                { label: "Address", value: item.address },
                { label: "Hours", value: item.hours }
              ]
            }), "primary"
          )
        );

        if (hasMappableAddress(item.address)) {
          actions.append(makeAnchor("Map", `https://maps.google.com/?q=${encodeURIComponent(item.address)}`));
        }

        overlay.append(tag, title, meta, summary, actions);
        card.append(image, overlay);
        featuredGrid.appendChild(card);
      });

      featuredSection.append(featuredHeader, featuredGrid);
      contentArea.appendChild(featuredSection);
    }

    const startCards = [
      {
        tag: "Welcome",
        title: property.name || "Start With The Basics",
        summary: `${property.address || "Long Point cottage stay"} | Check-in after ${property.checkIn || "3:00 PM"} | Check-out before ${property.checkOut || "10:00 AM"}`,
        actions: [makeButton("Open Essentials", () => selectTab("essentials"), "primary")]
      },
      {
        tag: "Book Direct",
        title: "Save On Platform Fees",
        summary: host.directBookingNote || "Contact the host directly for future stays.",
        actions: [
          makeAnchor("Call Host", `tel:${toDialablePhone(host.phone || "")}`),
          makeAnchor("Email Host", `mailto:${host.email || ""}`)
        ].filter(Boolean)
      },
      {
        tag: "Wi-Fi",
        title: wifiTip?.title || "Wi-Fi Access",
        summary: wifiTip?.summary || "Connect to the cottage Wi-Fi network.",
        actions: [makeButton("View Wi-Fi Tip", () => selectTab("tips", "Wi-Fi"), "primary")]
      },
      {
        tag: "Arrival",
        title: "Arrival Checklist",
        summary: `${window.COTTAGE_DATA.checklists.arrival.length} quick tasks to get settled smoothly.`,
        actions: [makeButton("Open Arrival Tasks", () => selectTab("checklist", "Arrival"), "primary")]
      },
      {
        tag: "Rules",
        title: "Most Important House Rules",
        summary: "Quiet hours, fire pit safety, smoking policy, and pet courtesy.",
        actions: [makeButton("Review Rules", () => selectTab("rules"), "primary")]
      },
      {
        tag: "Need Help?",
        title: "Common Cottage Help",
        summary: waterTip?.summary || "Check the most useful utility and house tips first.",
        actions: [
          makeButton("Helpful Tips", () => selectTab("tips"), "primary"),
          makeButton("Open Essentials", () => selectTab("essentials", "Support"))
        ]
      },
      {
        tag: "Departure",
        title: "Before You Leave",
        summary: trashTip?.summary || "Departure reminders for garbage, towels, dishes, and lock-up.",
        actions: [makeButton("Open Departure Tasks", () => selectTab("checklist", "Departure"), "primary")]
      }
    ];

    startCards.forEach((item) => {
      const card = makeCard({ tag: item.tag, title: item.title, summary: item.summary });
      card.querySelector(".card-actions").append(...item.actions);
      contentArea.appendChild(card);
    });

    contentArea.prepend(heroBlock);

    if (topBusinesses.length) {
      const groupBlock = document.createElement("div");
      groupBlock.className = "group-block start-here-group";

      const heading = document.createElement("h4");
      heading.className = "group-heading";
      heading.textContent = "Top Local Picks";

      const intro = document.createElement("p");
      intro.className = "start-here-intro";
      intro.textContent = "A few good first options if you want something easy nearby.";

      const cardsArea = document.createElement("div");
      cardsArea.className = "group-cards";

      topBusinesses.forEach((item) => {
        const card = makeCard({
          tag: item.category,
          title: item.name,
          summary: `${item.distance} | ${item.hours}`
        });

        card.querySelector(".card-actions").append(
          makeButton("Details", () =>
            openDetails(item.name, {
              paragraphs: [item.notes],
              fields: [
                { label: "Address", value: item.address },
                { label: "Hours", value: item.hours }
              ]
            }), "primary"
          )
        );

        if (hasMappableAddress(item.address)) {
          card.querySelector(".card-actions").append(
            makeAnchor("Map", `https://maps.google.com/?q=${encodeURIComponent(item.address)}`)
          );
        }

        cardsArea.appendChild(card);
      });

      const footerAction = makeButton("Browse All Businesses", () => selectTab("businesses"), "primary");
      const footerRow = document.createElement("div");
      footerRow.className = "start-here-footer";
      footerRow.appendChild(footerAction);

      groupBlock.append(heading, intro, cardsArea, footerRow);
      contentArea.appendChild(groupBlock);
    }
  }

  function renderSpotifyPlayer() {
    const spotify = window.COTTAGE_DATA.spotify || {};
    const playlistUrl = typeof spotify.playlistUrl === "string" ? spotify.playlistUrl.trim() : "";
    const speakers = Array.isArray(spotify.speakers) ? spotify.speakers.filter(Boolean) : [];
    const isConfigured = /^https:\/\/open\.spotify\.com\/(playlist|album)\//i.test(playlistUrl);
    const block = document.createElement("section");
    block.className = "spotify-block";

    const header = document.createElement("div");
    header.className = "spotify-header";

    const eyebrow = document.createElement("span");
    eyebrow.className = "spotify-eyebrow";
    eyebrow.textContent = "Cottage Soundtrack";

    const title = document.createElement("h3");
    title.textContent = "Play music around the cottage";

    const summary = document.createElement("p");
    summary.textContent = isConfigured
      ? "Choose a room, then open the playlist in Spotify to play it on that speaker."
      : "Add the cottage Spotify playlist in private configuration to turn on the player.";
    header.append(eyebrow, title, summary);

    if (!isConfigured) {
      block.append(header);
      contentArea.appendChild(block);
      return;
    }

    const embed = document.createElement("iframe");
    embed.className = "spotify-embed";
    embed.title = "Cottage Spotify playlist";
    const embedUrl = playlistUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
    embed.src = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}utm_source=cottage-info`;
    embed.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    embed.loading = "lazy";

    const controls = document.createElement("div");
    controls.className = "spotify-controls";

    const controlsTitle = document.createElement("strong");
    controlsTitle.textContent = "Send playback to";
    controls.appendChild(controlsTitle);

    const selectedSpeakerKey = "cottage-spotify-speaker";
    const savedSpeaker = localStorage.getItem(selectedSpeakerKey) || speakers[0] || "";
    const status = document.createElement("p");
    status.className = "spotify-speaker-status";

    const addSpeakerButton = (speaker) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "spotify-speaker";
      button.textContent = speaker;
      button.setAttribute("aria-pressed", String(speaker === savedSpeaker));
      button.addEventListener("click", () => {
        localStorage.setItem(selectedSpeakerKey, speaker);
        controls.querySelectorAll(".spotify-speaker").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });
        status.textContent = `${speaker} selected. Connecting to Spotify...`;
        if (spotify.apiEndpoint) {
          fetch(`${spotify.apiEndpoint}?action=transfer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceName: speaker })
          })
            .then((response) => response.json().then((result) => ({ ok: response.ok, result })))
            .then(({ ok, result }) => {
              status.textContent = ok
                ? `${speaker} is ready. Use the Spotify player to start music.`
                : (result.error || `${speaker} is not available right now.`);
            })
            .catch(() => {
              status.textContent = `${speaker} selected. Open Spotify Connect to finish connecting.`;
            });
        }
      });
      controls.appendChild(button);
    };

    speakers.forEach(addSpeakerButton);

    if (spotify.apiEndpoint) {
      fetch(`${spotify.apiEndpoint}?action=devices`)
        .then((response) => response.json().then((result) => ({ ok: response.ok, result })))
        .then(({ ok, result }) => {
          if (!ok || !Array.isArray(result.devices) || !result.devices.length) {
            return;
          }
          controls.querySelectorAll(".spotify-speaker").forEach((button) => button.remove());
          result.devices.forEach((device) => addSpeakerButton(device.name));
          status.textContent = `${result.devices.length} available Spotify speaker${result.devices.length === 1 ? "" : "s"} found.`;
        })
        .catch(() => {});
    }

    status.textContent = savedSpeaker
      ? `${savedSpeaker} selected. Choose a speaker to connect it through Spotify.`
      : "Choose a speaker, then open Spotify Connect on your phone.";

    const openSpotify = makeAnchor("Open in Spotify", playlistUrl, "primary");
    openSpotify.target = "_blank";
    openSpotify.rel = "noopener noreferrer";
    controls.append(status, openSpotify);
    block.append(header, embed, controls);
    contentArea.appendChild(block);
  }

  function renderEssentialsCards() {
    const items = filterItems(window.COTTAGE_DATA.essentials || [], ["title", "summary", "details", "category"]);

    if (!items.length) {
      renderEmptyState("No essentials match your search.");
      return;
    }

    const groupedItems = organizeItemsByCategory(items, "category", "title");
    groupedItems.forEach(({ category, items: categoryItems }) => {
      const groupBlock = document.createElement("div");
      groupBlock.className = "group-block";

      const heading = document.createElement("h4");
      heading.className = "group-heading";
      heading.textContent = category;

      const cardsArea = document.createElement("div");
      cardsArea.className = "group-cards";

      categoryItems.forEach((item) => {
        const card = makeCard({
          tag: item.category,
          title: item.title,
          summary: item.summary
        });

        const actions = [makeButton("Read More", () => openDetails(item.title, { paragraphs: [item.details] }), "primary")];

        if (item.id === "property-location") {
          actions.push(makeAnchor("Map", `https://maps.google.com/?q=${encodeURIComponent(window.COTTAGE_DATA.property?.address || item.summary)}`));
        }

        if (item.id === "host-help") {
          const host = window.COTTAGE_DATA.host || {};
          if (host.phone) {
            actions.push(makeAnchor("Call", `tel:${toDialablePhone(host.phone)}`));
          }
          if (host.email) {
            actions.push(makeAnchor("Email", `mailto:${host.email}`));
          }
        }

        if (item.id === "departure-basics") {
          actions.push(makeButton("Departure Checklist", () => selectTab("checklist", "Departure")));
        }

        card.querySelector(".card-actions").append(...actions);
        cardsArea.appendChild(card);
      });

      groupBlock.append(heading, cardsArea);
      contentArea.appendChild(groupBlock);
    });
  }

  function renderCalendarCards() {
    contentArea.innerHTML = "";

    const now = startOfDay(new Date());
    const currentYear = now.getFullYear();
    const year = Number(state.calendarYear) || currentYear;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    if (!calendarState.loaded && !calendarState.loading) {
      void loadCalendars();
      renderEmptyState("Loading Airbnb and VRBO calendar feeds...");
      return;
    }

    if (calendarState.loading) {
      renderEmptyState("Loading Airbnb and VRBO calendar feeds...");
      return;
    }

    if (calendarState.error) {
      if (!calendarState.items.length) {
        renderCalendarStatusCard();
        renderEmptyState(calendarState.error);
        return;
      }

      renderCalendarStatusCard();
      renderEmptyState(`${calendarState.error} Showing last saved calendar data.`);
    }

    if (calendarState.sourceStatuses.length) {
      renderCalendarStatusCard();
    }

    const filtered = calendarState.items.filter(matchesCalendarFilterAndSearch);
    const daySourceMap = buildBlockedDaySourceMap(filtered, yearStart, yearEnd);

    const yearCard = document.createElement("article");
    yearCard.className = "card calendar-month-card";

    const yearTitle = document.createElement("h3");
    yearTitle.textContent = `Availability ${year}`;

    const yearSummary = document.createElement("p");
    yearSummary.textContent = `${daySourceMap.size} blocked day${daySourceMap.size === 1 ? "" : "s"} across all months.`;

    const legend = createCalendarLegend();

    const yearGrid = document.createElement("div");
    yearGrid.className = "calendar-year-grid";

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const monthAnchor = new Date(year, monthIndex, 1);
      const monthBlockedDays = countBlockedDaysInMonth(daySourceMap, year, monthIndex);

      const monthPanel = document.createElement("section");
      monthPanel.className = "calendar-month-panel";

      const monthTitle = document.createElement("h4");
      monthTitle.textContent = monthAnchor.toLocaleDateString([], { month: "long" });

      const monthSummary = document.createElement("p");
      monthSummary.className = "calendar-month-summary";
      monthSummary.textContent = `${monthBlockedDays} blocked day${monthBlockedDays === 1 ? "" : "s"}`;

      const calendarGrid = createMonthGrid(monthAnchor, daySourceMap);
      monthPanel.append(monthTitle, monthSummary, calendarGrid);
      yearGrid.appendChild(monthPanel);
    }

    yearCard.append(yearTitle, yearSummary, legend, yearGrid);
    contentArea.appendChild(yearCard);
  }

  function renderCalendarStatusCard() {
    const statusCard = makeCard({
      tag: "Calendar Feed",
      title: "Calendar Source Status",
      summary: calendarState.lastUpdated
        ? `Last updated ${formatDateTime(calendarState.lastUpdated)}`
        : "Live status for each booking source."
    });

    const statusList = document.createElement("div");
    statusList.className = "calendar-source-status-list";

    const statuses = calendarState.sourceStatuses.length
      ? calendarState.sourceStatuses
      : [{ name: "Calendar", ok: false, message: "No source status available yet." }];

    statuses.forEach((status) => {
      const row = document.createElement("div");
      row.className = `calendar-source-status ${status.ok ? "is-ok" : "is-error"}`;

      const name = document.createElement("strong");
      name.textContent = status.name;

      const detail = document.createElement("span");
      detail.textContent = status.ok ? "Loaded" : status.message || "Failed";

      row.append(name, detail);
      statusList.appendChild(row);
    });

    statusCard.insertBefore(statusList, statusCard.querySelector(".card-actions"));
    statusCard.querySelector(".card-actions").append(
      makeButton("Refresh Now", () => {
        void loadCalendars(true);
      }, "primary")
    );
    contentArea.appendChild(statusCard);
  }

  function createCalendarLegend() {
    const legend = document.createElement("div");
    legend.className = "calendar-legend";

    const entries = [
      { key: "airbnb", label: "Airbnb" },
      { key: "vrbo", label: "VRBO" },
      { key: "mixed", label: "Both" },
      { key: "today", label: "Today" }
    ];

    entries.forEach((entry) => {
      const item = document.createElement("span");
      item.className = `calendar-legend-item calendar-legend-${entry.key}`;
      item.textContent = entry.label;
      legend.appendChild(item);
    });

    return legend;
  }

  function countBlockedDaysInMonth(daySourceMap, year, monthIndex) {
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
    let count = 0;

    daySourceMap.forEach((_, dateKey) => {
      if (String(dateKey).startsWith(monthKey)) {
        count += 1;
      }
    });

    return count;
  }

  function renderEventCards() {
    contentArea.innerHTML = "";

    const sourceCard = makeCard({
      tag: "Live Feed",
      title: "Local Events Feed",
      summary: eventsState.lastUpdated
        ? `Showing next ${window.COTTAGE_DATA.events.upcomingWindowDays} days | Auto-refresh every ${window.COTTAGE_DATA.events.refreshMinutes} minutes | Last updated ${formatDateTime(eventsState.lastUpdated)}`
        : `Showing next ${window.COTTAGE_DATA.events.upcomingWindowDays} days | Auto-refresh every ${window.COTTAGE_DATA.events.refreshMinutes} minutes`
    });

    const sourceActions = sourceCard.querySelector(".card-actions");
    sourceActions.append(
      makeButton("Refresh Now", () => {
        void loadEvents(true);
      }, "primary")
    );

    window.COTTAGE_DATA.events.liveFeeds.forEach((feed) => {
      sourceActions.append(makeAnchor(feed.name, feed.url));
    });

    contentArea.appendChild(sourceCard);

    if (!eventsState.loaded && !eventsState.loading) {
      void loadEvents();
      return;
    }

    if (eventsState.loading) {
      renderEmptyState("Loading current local events...");
    }

    const sourceLinks = window.COTTAGE_DATA.events.sourceLinks.filter((source) =>
      matchesEventFilterAndSearch({
        category: source.category,
        title: source.name,
        summary: source.note
      })
    );

    sourceLinks.forEach((source) => {
      const card = makeCard({
        tag: source.category,
        title: source.name,
        summary: source.note
      });
      card.querySelector(".card-actions").append(makeAnchor("Open Events", source.url));
      contentArea.appendChild(card);
    });

    const liveItems = eventsState.items.filter((item) =>
      matchesEventFilterAndSearch({
        category: "Live Feed",
        title: item.title,
        summary: `${item.source} | ${item.when}`
      })
    );

    liveItems.forEach((item) => {
      const card = makeCard({
        tag: "Live Feed",
        title: item.title,
        summary: `${item.when} | ${item.source}`
      });
      card.querySelector(".card-actions").append(makeAnchor("Read Update", item.url));
      contentArea.appendChild(card);
    });

    if (!eventsState.loading && !sourceLinks.length && !liveItems.length) {
      renderEmptyState("No events match your current filter or search.");
    }

    if (eventsState.error && !eventsState.loading) {
      renderEmptyState(eventsState.error);
    }
  }

  function renderBusinessCards() {
    const items = filterItems(window.COTTAGE_DATA.businesses, ["name", "notes", "category", "address"]);

    if (!items.length) {
      renderEmptyState("No businesses match your search.");
      return;
    }

    if (state.filter === "All" && !state.search) {
      renderBusinessHighlights();
    }

    const groupedItems = organizeItemsByCategory(items, "category", "name");
    groupedItems.forEach(({ category, items: categoryItems }) => {
      const groupBlock = document.createElement("div");
      groupBlock.className = "group-block";

      const heading = document.createElement("h4");
      heading.className = "group-heading";
      heading.textContent = category;

      const cardsArea = document.createElement("div");
      cardsArea.className = "group-cards";

      categoryItems.forEach((item) => {
        const card = makeCard({
          tag: item.category,
          title: item.name,
          summary: `${item.distance} | ${item.hours}`
        });

        const verificationIssues = getBusinessVerificationIssues(item);
        if (verificationIssues.length) {
          const verifyNote = document.createElement("p");
          verifyNote.className = "card-verify-note";
          verifyNote.textContent = `Verify: ${verificationIssues.join(" | ")}`;
          card.querySelector(".card-actions").before(verifyNote);
        }

        const actions = [
          makeButton("Details", () =>
            openDetails(item.name, {
              paragraphs: [item.notes],
              fields: [
                { label: "Address", value: item.address },
                { label: "Hours", value: item.hours }
              ]
            }), "primary"
          )
        ];

        if (hasDialablePhone(item.phone)) {
          actions.push(makeAnchor("Call", `tel:${toDialablePhone(item.phone)}`));
        }

        if (hasMappableAddress(item.address)) {
          actions.push(makeAnchor("Map", `https://maps.google.com/?q=${encodeURIComponent(item.address)}`));
        }

        card.querySelector(".card-actions").append(...actions);
        cardsArea.appendChild(card);
      });

      groupBlock.append(heading, cardsArea);
      contentArea.appendChild(groupBlock);
    });
  }

  function renderBusinessHighlights() {
    const highlights = window.COTTAGE_DATA.businessHighlights || [];
    highlights.forEach((highlight) => {
      const businesses = getBusinessesByIds(highlight.businessIds || []);
      if (!businesses.length) {
        return;
      }

      const groupBlock = document.createElement("div");
      groupBlock.className = "group-block business-highlight-block";

      const heading = document.createElement("h4");
      heading.className = "group-heading";
      heading.textContent = highlight.title;

      const intro = document.createElement("p");
      intro.className = "start-here-intro";
      intro.textContent = highlight.summary;

      const cardsArea = document.createElement("div");
      cardsArea.className = "group-cards";

      businesses.forEach((item) => {
        const card = makeCard({
          tag: item.category,
          title: item.name,
          summary: `${item.distance} | ${item.hours}`
        });

        card.querySelector(".card-actions").append(
          makeButton("Details", () =>
            openDetails(item.name, {
              paragraphs: [item.notes],
              fields: [
                { label: "Address", value: item.address },
                { label: "Hours", value: item.hours }
              ]
            }), "primary"
          )
        );

        if (hasMappableAddress(item.address)) {
          card.querySelector(".card-actions").append(
            makeAnchor("Map", `https://maps.google.com/?q=${encodeURIComponent(item.address)}`)
          );
        }

        cardsArea.appendChild(card);
      });

      groupBlock.append(heading, intro, cardsArea);
      contentArea.appendChild(groupBlock);
    });
  }

  function renderRuleCards() {
    const items = filterItems(window.COTTAGE_DATA.rules, ["title", "summary", "details", "category"]);

    if (!items.length) {
      renderEmptyState("No rules match your search.");
      return;
    }

    const groupedItems = organizeItemsByCategory(items, "category", "title");
    groupedItems.forEach(({ category, items: categoryItems }) => {
      const groupBlock = document.createElement("div");
      groupBlock.className = "group-block";

      const heading = document.createElement("h4");
      heading.className = "group-heading";
      heading.textContent = category;

      const cardsArea = document.createElement("div");
      cardsArea.className = "group-cards";

      categoryItems.forEach((item) => {
        const card = makeCard({
          tag: item.category,
          title: item.title,
          summary: item.summary
        });

        card.querySelector(".card-actions").append(
          makeButton("Read More", () => openDetails(item.title, { paragraphs: [item.details] }), "primary")
        );

        cardsArea.appendChild(card);
      });

      groupBlock.append(heading, cardsArea);
      contentArea.appendChild(groupBlock);
    });
  }

  function renderTipCards() {
    const items = filterItems(window.COTTAGE_DATA.tips, ["title", "summary", "details", "category"]);

    if (!items.length) {
      renderEmptyState("No tips match your search.");
      return;
    }

    const groupedItems = organizeItemsByCategory(items, "category", "title");
    groupedItems.forEach(({ category, items: categoryItems }) => {
      const groupBlock = document.createElement("div");
      groupBlock.className = "group-block";

      const heading = document.createElement("h4");
      heading.className = "group-heading";
      heading.textContent = category;

      const cardsArea = document.createElement("div");
      cardsArea.className = "group-cards";

      categoryItems.forEach((item) => {
        const card = makeCard({
          tag: item.category,
          title: item.title,
          summary: item.summary
        });

        card.querySelector(".card-actions").append(
          makeButton("Read More", () => openDetails(item.title, { paragraphs: [item.details] }), "primary")
        );

        cardsArea.appendChild(card);
      });

      groupBlock.append(heading, cardsArea);
      contentArea.appendChild(groupBlock);
    });
  }

  function renderChecklistCards() {
    const groups = [
      { key: "arrival", title: "Arrival Checklist", tag: "Arrival", items: window.COTTAGE_DATA.checklists.arrival },
      { key: "departure", title: "Departure Checklist", tag: "Departure", items: window.COTTAGE_DATA.checklists.departure }
    ];

    const visibleGroups = groups.filter((group) => {
      const byFilter = state.filter === "All" || state.filter.toLowerCase() === group.tag.toLowerCase();
      const bySearch = !state.search || group.title.toLowerCase().includes(state.search);
      return byFilter && bySearch;
    });

    if (!visibleGroups.length) {
      renderEmptyState("No checklists match your search.");
      return;
    }

    visibleGroups.forEach((group) => {
      const card = makeCard({ tag: group.tag, title: group.title, summary: "Tap to check tasks." });
      const list = document.createElement("div");
      list.className = "checklist";

      group.items.forEach((task, index) => {
        const id = `${group.key}-${index}`;
        const row = document.createElement("label");
        row.className = "checklist-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(checklistState[id]);
        checkbox.addEventListener("change", () => {
          checklistState[id] = checkbox.checked;
          localStorage.setItem(STORAGE_KEYS.checks, JSON.stringify(checklistState));
        });

        const text = document.createElement("span");
        text.textContent = task;

        row.append(checkbox, text);
        list.appendChild(row);
      });

      const resetBtn = makeButton("Reset", () => {
        Object.keys(checklistState)
          .filter((key) => key.startsWith(group.key + "-"))
          .forEach((key) => delete checklistState[key]);
        localStorage.setItem(STORAGE_KEYS.checks, JSON.stringify(checklistState));
        renderChecklistCards();
      });

      card.appendChild(list);
      card.querySelector(".card-actions").append(resetBtn);
      contentArea.appendChild(card);
    });
  }

  async function loadEvents(forceRefresh = false) {
    if (eventsState.loading) {
      return;
    }

    const cache = readEventsCache();
    const maxAgeMs = window.COTTAGE_DATA.events.refreshMinutes * 60 * 1000;
    const isCacheFresh =
      cache &&
      typeof cache.fetchedAt === "string" &&
      Date.now() - new Date(cache.fetchedAt).getTime() < maxAgeMs;

    if (!forceRefresh && isCacheFresh) {
      eventsState.items = cache.items;
      eventsState.lastUpdated = cache.fetchedAt;
      eventsState.loaded = true;
      eventsState.error = "";
      if (state.tab === "events") {
        renderEventCards();
      }
      return;
    }

    eventsState.loading = true;
    eventsState.error = "";
    if (state.tab === "events") {
      renderEventCards();
    }

    try {
      const feedResults = await Promise.allSettled(
        window.COTTAGE_DATA.events.liveFeeds.map(async (feed) => {
          const response = await fetch(feed.url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`Failed to fetch ${feed.name}.`);
          }
          const data = await response.json();
          return { feed, data };
        })
      );

      const feedResponses = feedResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      if (!feedResponses.length) {
        throw new Error("No event feeds were available.");
      }

      const combined = feedResponses
        .flatMap(({ feed, data }) => {
          const rawItems = Array.isArray(data?.items) ? data.items : [];
          return rawItems.map((entry, index) => {
            const rawTitle = entry?.title || "Local Event";
            return {
              id: `live-${feed.name}-${index}-${entry?.link || rawTitle}`,
              title: sanitizeHtml(rawTitle),
              url: entry?.link || feed.url,
              when: formatDate(entry?.pubDate),
              sortDate: entry?.pubDate || "",
              source: feed.name
            };
          });
        })
        .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const windowEnd = new Date(startOfToday);
      windowEnd.setDate(windowEnd.getDate() + Number(window.COTTAGE_DATA.events.upcomingWindowDays || 60));

      const inWindow = combined.filter((item) => {
        const parsed = new Date(item.sortDate);
        return !Number.isNaN(parsed.getTime()) && parsed >= startOfToday && parsed <= windowEnd;
      });

      const items = inWindow
        .slice(0, 12)
        .map(({ sortDate, ...item }) => item);

      eventsState.items = items;
      eventsState.lastUpdated = new Date().toISOString();
      eventsState.loaded = true;
      writeEventsCache({ fetchedAt: eventsState.lastUpdated, items });
    } catch {
      eventsState.error = "Live feed is temporarily unavailable. Use the local source cards below for current events.";
      if (cache?.items?.length) {
        eventsState.items = cache.items;
        eventsState.lastUpdated = cache.fetchedAt;
        eventsState.loaded = true;
      }
    } finally {
      eventsState.loading = false;
      if (state.tab === "events") {
        renderEventCards();
      }
    }
  }

  async function loadCalendars(forceRefresh = false) {
    if (calendarState.loading) {
      return;
    }

    const config = window.COTTAGE_DATA.calendar || {};
    const refreshMinutes = Number(config.refreshMinutes || 30);
    const maxAgeMs = Math.max(5, refreshMinutes) * 60 * 1000;
    const cache = readCalendarCache();
    const isCacheFresh =
      cache &&
      typeof cache.fetchedAt === "string" &&
      Date.now() - new Date(cache.fetchedAt).getTime() < maxAgeMs;

    if (!forceRefresh && isCacheFresh) {
      calendarState.items = cache.items.map(reviveCalendarItem);
      calendarState.lastUpdated = cache.fetchedAt;
      calendarState.loaded = true;
      calendarState.error = "";
      calendarState.sourceStatuses = buildCalendarSourceStatuses(config.sources || [], true, "Loaded from saved cache.");
      if (state.tab === "calendar") {
        renderCalendarCards();
      }
      return;
    }

    calendarState.loading = true;
    calendarState.error = "";
    calendarState.sourceStatuses = [];
    if (state.tab === "calendar") {
      renderCalendarCards();
    }

    try {
      const response = await fetch(`renterscottage/api.php?refresh=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Calendar proxy request failed.");
      }

      const data = await response.json();
      calendarState.sourceStatuses = (data.sources || []).map((source) => ({
        name: source.source || "Calendar",
        ok: Boolean(source.ok),
        message: source.ok
          ? `${(source.events || []).length} event${(source.events || []).length === 1 ? "" : "s"} loaded.`
          : "Feed failed to load."
      }));

      const loadedEvents = (data.sources || [])
        .flatMap((source) => (source.events || []).map((event) => ({
          source: source.source || "Calendar",
          summary: event.summary || "Reserved",
          start: new Date(event.start),
          end: new Date(event.end)
        })))
        .filter((item) => item.start instanceof Date && item.end instanceof Date && item.end.getTime() > item.start.getTime())
        .sort((left, right) => left.start.getTime() - right.start.getTime());

      if (!loadedEvents.length) {
        throw new Error("No calendar events were loaded.");
      }

      calendarState.items = loadedEvents;
      calendarState.lastUpdated = new Date().toISOString();
      calendarState.loaded = true;

      writeCalendarCache({
        fetchedAt: calendarState.lastUpdated,
        items: loadedEvents.map((item) => ({
          source: item.source,
          summary: item.summary,
          start: item.start.toISOString(),
          end: item.end.toISOString()
        }))
      });
    } catch {
      calendarState.error = "Calendar feeds are temporarily unavailable. Check iCal URLs or try refresh.";
      if (cache?.items?.length) {
        calendarState.items = cache.items.map(reviveCalendarItem);
        calendarState.lastUpdated = cache.fetchedAt;
        calendarState.loaded = true;
      }
    } finally {
      calendarState.loading = false;
      if (state.tab === "calendar") {
        renderCalendarCards();
      }
    }
  }

  function filterItems(items, fields) {
    return items.filter((item) => {
      const byFilter = state.filter === "All" || String(item.category).toLowerCase() === state.filter.toLowerCase();
      if (!byFilter) {
        return false;
      }

      if (!state.search) {
        return true;
      }

      return fields.some((field) => String(item[field]).toLowerCase().includes(state.search));
    });
  }

  function organizeItemsByCategory(items, categoryField = "category", titleField = "title") {
    const buckets = new Map();

    items.forEach((item) => {
      const category = String(item?.[categoryField] || "General").trim() || "General";
      if (!buckets.has(category)) {
        buckets.set(category, []);
      }
      buckets.get(category).push(item);
    });

    return Array.from(buckets.entries())
      .map(([category, entries]) => ({
        category,
        items: entries.slice().sort((left, right) => {
          const leftLabel = String(left?.[titleField] || left?.name || "").trim().toLowerCase();
          const rightLabel = String(right?.[titleField] || right?.name || "").trim().toLowerCase();
          return leftLabel.localeCompare(rightLabel);
        })
      }))
      .sort((left, right) => left.category.localeCompare(right.category, undefined, { sensitivity: "base" }));
  }

  function matchesEventFilterAndSearch(item) {
    const byFilter = state.filter === "All" || String(item.category).toLowerCase() === state.filter.toLowerCase();
    if (!byFilter) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    const haystack = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
    return haystack.includes(state.search);
  }

  function matchesCalendarFilterAndSearch(item) {
    const byFilter = state.filter === "All" || String(item.source).toLowerCase() === state.filter.toLowerCase();
    if (!byFilter) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    const summary = String(item.summary || "").toLowerCase();
    const source = String(item.source || "").toLowerCase();
    const range = formatRange(item.start, item.end).toLowerCase();
    const haystack = `${summary} ${source} ${range}`;
    return haystack.includes(state.search);
  }

  function makeCard({ tag, title, summary }) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <span class="card-tag">${escapeHtml(tag)}</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(summary)}</p>
      <div class="card-actions"></div>
    `;
    return card;
  }

  function makeButton(label, onClick, typeClass = "") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `action-btn ${typeClass}`.trim();
    btn.textContent = label;
    btn.addEventListener("click", () => {
      lastDialogTrigger = btn;
      onClick(btn);
    });
    return btn;
  }

  function makeAnchor(label, href) {
    const link = document.createElement("a");
    link.className = "action-btn";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  function renderEmptyState(message) {
    const block = document.createElement("div");
    block.className = "empty-state";
    block.textContent = message;
    contentArea.appendChild(block);
  }

  function openDetails(title, content = {}) {
    if (dialogTitle) {
      dialogTitle.textContent = title;
    }
    if (dialogBody) {
      dialogBody.textContent = "";

      const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
      paragraphs.forEach((entry) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = String(entry || "");
        dialogBody.appendChild(paragraph);
      });

      const fields = Array.isArray(content.fields) ? content.fields : [];
      fields.forEach((field) => {
        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = `${String(field?.label || "Detail")}: `;
        paragraph.append(strong, document.createTextNode(String(field?.value || "")));
        dialogBody.appendChild(paragraph);
      });
    }
    if (detailDialog && typeof detailDialog.showModal === "function") {
      detailDialog.showModal();
      requestAnimationFrame(() => dialogTitle?.focus?.());
    }
  }

  function formatShortDate(value) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? "Not set"
      : parsed.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function getBusinessesByIds(ids) {
    return (ids || [])
      .map((id) => window.COTTAGE_DATA.businesses.find((item) => item.id === id))
      .filter(Boolean);
  }

  function hasDialablePhone(phone) {
    return toDialablePhone(phone).length >= 10;
  }

  function toDialablePhone(phone) {
    return String(phone || "").replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  }

  function hasMappableAddress(address) {
    const value = String(address || "").trim().toLowerCase();
    return Boolean(value) && !value.includes("not confirmed") && !value.includes("unknown");
  }

  function getBusinessVerificationIssues(item) {
    const phone = String(item?.phone || "").trim().toLowerCase();
    const hours = String(item?.hours || "").trim().toLowerCase();
    const address = String(item?.address || "").trim().toLowerCase();

    const issues = [];

    const phoneUncertain = !hasDialablePhone(item?.phone) || phone.includes("not listed") || phone.includes("unknown");
    const hoursUncertain =
      hours.includes("call for hours") ||
      hours.includes("hours not listed") ||
      hours.includes("check current listing");
    const addressUncertain = address.includes("not confirmed") || address.includes("unknown");

    if (phoneUncertain) {
      issues.push("Phone not verified");
    }
    if (hoursUncertain) {
      issues.push("Hours not verified");
    }
    if (addressUncertain) {
      issues.push("Address not verified");
    }

    // Keep badges focused on materially uncertain listings.
    if ((phoneUncertain && hoursUncertain) || (hoursUncertain && addressUncertain)) {
      return issues;
    }

    return [];
  }

  function formatDate(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Date not available";
    }
    return parsed.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function formatDateTime(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "unknown time";
    }
    return parsed.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function sanitizeHtml(value) {
    const parser = document.createElement("div");
    parser.innerHTML = String(value);
    return parser.textContent || parser.innerText || "Local Update";
  }

  function readEventsCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.eventsCache);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function readCalendarCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.calendarCache);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeCalendarCache(value) {
    localStorage.setItem(STORAGE_KEYS.calendarCache, JSON.stringify(value));
  }

  function writeEventsCache(value) {
    localStorage.setItem(STORAGE_KEYS.eventsCache, JSON.stringify(value));
  }

  function loadChecklistState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.checks);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function reviveCalendarItem(item) {
    return {
      source: item.source,
      summary: item.summary,
      start: new Date(item.start),
      end: new Date(item.end)
    };
  }

  function buildCalendarSourceStatuses(sources, ok, message) {
    return (sources || []).map((source) => ({
      name: source?.name || "Calendar",
      ok,
      message
    }));
  }

  async function fetchCalendarText(url, strategies) {
    const attempts = [
      { type: "direct", url },
      ...strategies
        .filter((strategy) => strategy !== "direct")
        .map((strategy) => ({
          type: "proxy",
          url: String(strategy).replace("{{url}}", encodeURIComponent(url)).replace("{{rawUrl}}", url)
        }))
    ];

    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, { cache: "no-store" });
        if (!response.ok) {
          continue;
        }
        const text = await response.text();
        if (text.includes("BEGIN:VCALENDAR")) {
          return text;
        }
      } catch {
        // Try next strategy.
      }
    }

    throw new Error("Unable to load calendar feed.");
  }

  function parseIcsEvents(icsText) {
    const unfolded = String(icsText || "").replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);
    const events = [];
    let current = null;

    lines.forEach((line) => {
      if (line === "BEGIN:VEVENT") {
        current = {};
        return;
      }

      if (line === "END:VEVENT") {
        if (!current?.dtstart) {
          current = null;
          return;
        }

        const start = parseIcsDate(current.dtstart);
        const end = parseIcsDate(current.dtend) || addDays(start, 1);
        if (start && end && end.getTime() > start.getTime()) {
          events.push({
            start,
            end,
            summary: current.summary || "Reserved"
          });
        }

        current = null;
        return;
      }

      if (!current) {
        return;
      }

      if (line.startsWith("DTSTART")) {
        current.dtstart = extractIcsValue(line);
      } else if (line.startsWith("DTEND")) {
        current.dtend = extractIcsValue(line);
      } else if (line.startsWith("SUMMARY")) {
        current.summary = extractIcsValue(line);
      }
    });

    return events;
  }

  function extractIcsValue(line) {
    const splitIndex = line.indexOf(":");
    if (splitIndex === -1) {
      return "";
    }
    return line.slice(splitIndex + 1).trim();
  }

  function parseIcsDate(value) {
    const input = String(value || "").trim();
    if (!input) {
      return null;
    }

    if (/^\d{8}$/.test(input)) {
      const year = Number(input.slice(0, 4));
      const month = Number(input.slice(4, 6)) - 1;
      const day = Number(input.slice(6, 8));
      return new Date(year, month, day);
    }

    const withTime = input.replace("Z", "");
    if (/^\d{8}T\d{6}$/.test(withTime)) {
      const year = Number(withTime.slice(0, 4));
      const month = Number(withTime.slice(4, 6)) - 1;
      const day = Number(withTime.slice(6, 8));
      const hour = Number(withTime.slice(9, 11));
      const minute = Number(withTime.slice(11, 13));
      const second = Number(withTime.slice(13, 15));
      // Treat iCal booking times as calendar-local values to avoid timezone
      // shifts that can move blocked days backward in the month grid.
      return new Date(year, month, day, hour, minute, second);
    }

    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function createMonthGrid(anchorDate, daySourceMap) {
    const wrapper = document.createElement("div");
    wrapper.className = "calendar-grid-wrap";

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((label) => {
      const cell = document.createElement("div");
      cell.className = "calendar-cell calendar-cell-head";
      cell.textContent = label;
      grid.appendChild(cell);
    });

    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
    const startWeekday = monthStart.getDay();

    for (let i = 0; i < startWeekday; i += 1) {
      const empty = document.createElement("div");
      empty.className = "calendar-cell calendar-cell-empty";
      grid.appendChild(empty);
    }

    const todayKey = toDateKey(new Date());

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), day);
      const key = toDateKey(date);
      const daySources = daySourceMap.get(key);
      const cell = document.createElement("div");
      cell.className = "calendar-cell";

      if (daySources?.size) {
        cell.classList.add("calendar-cell-blocked");
        if (daySources.size > 1) {
          cell.classList.add("calendar-cell-mixed");
        } else if (daySources.has("airbnb")) {
          cell.classList.add("calendar-cell-airbnb");
        } else if (daySources.has("vrbo")) {
          cell.classList.add("calendar-cell-vrbo");
        } else {
          cell.classList.add("calendar-cell-other");
        }
      }
      if (key === todayKey) {
        cell.classList.add("calendar-cell-today");
      }

      cell.textContent = String(day);
      grid.appendChild(cell);
    }

    wrapper.appendChild(grid);
    return wrapper;
  }

  function normalizeCalendarSourceName(sourceName) {
    const value = String(sourceName || "").trim().toLowerCase();
    if (value.includes("airbnb")) {
      return "airbnb";
    }
    if (value.includes("vrbo") || value.includes("verbo")) {
      return "vrbo";
    }
    return "other";
  }

  function buildBlockedDaySourceMap(items, windowStart, windowEnd) {
    const blockedBySource = new Map();
    const startLimit = startOfDay(windowStart);
    const endLimit = startOfDay(windowEnd);

    items.forEach((item) => {
      const sourceKey = normalizeCalendarSourceName(item.source);
      let cursor = startOfDay(item.start);
      const endExclusive = startOfDay(item.end);
      while (cursor.getTime() < endExclusive.getTime()) {
        if (cursor.getTime() >= startLimit.getTime() && cursor.getTime() <= endLimit.getTime()) {
          const key = toDateKey(cursor);
          if (!blockedBySource.has(key)) {
            blockedBySource.set(key, new Set());
          }
          blockedBySource.get(key).add(sourceKey);
        }
        cursor = addDays(cursor, 1);
      }
    });

    return blockedBySource;
  }

  function toDateKey(value) {
    const date = startOfDay(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatRange(start, endExclusive) {
    const startDay = startOfDay(start);
    const checkoutDay = startOfDay(endExclusive);
    const endDay = addDays(checkoutDay, -1);

    const startLabel = startDay.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    const endLabel = endDay.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    if (startDay.getTime() === endDay.getTime()) {
      return startLabel;
    }
    return `${startLabel} - ${endLabel}`;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
})();
