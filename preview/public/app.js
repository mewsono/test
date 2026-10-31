// Interactions for the design preview. Everything here is a design-behaviour
// stand-in — it mirrors what the Compose build will actually do.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ── toast ─────────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}

/* ── segmented chrome toggle ───────────────────────────── */
const stage = $(".stage");
$$("#chromeToggle button").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$("#chromeToggle button").forEach((b) => b.classList.toggle("on", b === btn));
    stage.classList.toggle("bare", btn.dataset.chrome === "bare");
  });
});

/* ── jump to screen ────────────────────────────────────── */
function jump(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
$$("[data-jump]").forEach((b) => b.addEventListener("click", () => jump(b.dataset.jump)));

/* in-app nav: same-device tab changes */
$$("[data-goto]").forEach((b) =>
  b.addEventListener("click", () => {
    const target = b.dataset.goto;
    if (target === "discover") jump("screen-discover");
    if (target === "home") jump("screen-home");
  })
);
$$("[data-open]").forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault();
    jump("screen-artwork");
  })
);
$$("[data-back]").forEach((b) =>
  b.addEventListener("click", () => jump("screen-home"))
);

/* ── likes ─────────────────────────────────────────────── */
$$("[data-like]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const on = btn.classList.toggle("on");
    toast(on ? "Liked · 12.4k → 12.5k" : "Like removed");
  });
});

/* ── follow ────────────────────────────────────────────── */
$$("[data-follow]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isSmall = btn.classList.contains("follow--sm");
    const stateClass = isSmall ? "is-following" : "on";
    const on = btn.classList.toggle(stateClass);
    btn.textContent = on ? "Following" : "Follow";
    const who =
      btn.closest(".artist, .artist-card")
        ?.querySelector(".artist__name, .artist-card__name")?.textContent ?? "artist";
    toast(`@${who.replace(/^@/, "")} · ${btn.textContent}`);
  });
});

/* ── filter chips ──────────────────────────────────────── */
$$("#homeChips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    $$("#homeChips .chip").forEach((c) => c.classList.toggle("on", c === chip));
    toast(`Filter · ${chip.textContent}`);
  });
});

/* ── discover search ──────────────────────────────────── */
const search = $(".search input");
if (search) {
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && search.value.trim()) {
      toast(`Searching “${search.value.trim()}”`);
    }
  });
}

/* ── generic tap feedback ─────────────────────────────── */
$$("[data-say]").forEach((el) => {
  el.addEventListener("click", (e) => {
    if (el.tagName === "A") e.preventDefault();
    toast(el.dataset.say);
  });
});

/* ── reset ─────────────────────────────────────────────── */
$("#resetBtn").addEventListener("click", () => {
  $$(".on").forEach((el) => {
    if (el.closest("#chromeToggle") || el.closest("#homeChips") || el.classList.contains("navbtn")) return;
    el.classList.remove("on");
  });
  $$(".is-following").forEach((el) => el.classList.remove("is-following"));
  $$("[data-follow]").forEach((b) => (b.textContent = "Follow"));
  $$("#homeChips .chip").forEach((c, i) => c.classList.toggle("on", i === 0));
  $$(".home__scroll, .artwork__scroll, .discover__scroll").forEach((s) => (s.scrollTop = 0));
  if (search) search.value = "";
  toast("Design reset");
});

/* subtle parallax on the hero art while the reel scrolls */
const heroArt = $(".hero__art");
const reel = $("#reel");
if (reel && heroArt && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  reel.addEventListener("scroll", () => {
    const y = Math.min(reel.scrollTop * 0.06, 14);
    heroArt.style.transform = `translateY(${y}px) scale(1.04)`;
  });
}
