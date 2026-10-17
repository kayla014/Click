(function () {
  "use strict";

  var STORAGE_KEY = "clickSpeedBest";

  var clickBtn = document.getElementById("clickBtn");
  var remainingEl = document.getElementById("remaining");
  var timeEl = document.getElementById("time");
  var cpsEl = document.getElementById("cps");
  var progressBar = document.getElementById("progressBar");
  var resultBox = document.getElementById("result");
  var resultTitle = document.getElementById("resultTitle");
  var resultText = document.getElementById("resultText");
  var bestList = document.getElementById("bestList");
  var customInput = document.getElementById("customTarget");
  var targetBtns = document.querySelectorAll(".target-btn");

  var target = 25;
  var count = 0;
  var startTime = 0;
  var running = false;
  var finished = false;
  var rafId = null;

  // ---------- storage ----------
  function loadBest() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveBest(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // storage not available, ignore
    }
  }

  function renderBest() {
    var best = loadBest();
    var keys = Object.keys(best).map(Number).sort(function (a, b) { return a - b; });
    bestList.innerHTML = "";
    if (!keys.length) {
      var li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No times yet. Go set one!";
      bestList.appendChild(li);
      return;
    }
    keys.forEach(function (k) {
      var li = document.createElement("li");
      var a = document.createElement("span");
      var b = document.createElement("span");
      a.textContent = k + " clicks";
      b.textContent = best[k].toFixed(3) + "s";
      li.appendChild(a);
      li.appendChild(b);
      bestList.appendChild(li);
    });
  }

  // ---------- game ----------
  function updateDisplay(elapsed) {
    remainingEl.textContent = Math.max(target - count, 0);
    timeEl.textContent = elapsed.toFixed(3) + "s";
    cpsEl.textContent = elapsed > 0 ? (count / elapsed).toFixed(1) : "0.0";
    progressBar.style.width = Math.min((count / target) * 100, 100) + "%";
  }

  function tick() {
    if (!running) return;
    updateDisplay((performance.now() - startTime) / 1000);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    running = false;
    finished = false;
    count = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    clickBtn.disabled = false;
    clickBtn.textContent = "CLICK!";
    resultBox.hidden = true;
    updateDisplay(0);
  }

  function finish() {
    var elapsed = (performance.now() - startTime) / 1000;
    running = false;
    finished = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    updateDisplay(elapsed);
    clickBtn.disabled = true;
    clickBtn.textContent = "DONE";

    var best = loadBest();
    var previous = best[target];
    var isRecord = previous === undefined || elapsed < previous;
    if (isRecord) {
      best[target] = elapsed;
      saveBest(best);
    }

    resultTitle.textContent = isRecord ? "New best time!" : "Finished!";
    resultText.textContent =
      target + " clicks in " + elapsed.toFixed(3) + "s (" +
      (target / elapsed).toFixed(1) + " clicks per second)." +
      (isRecord || previous === undefined ? "" : " Your best is " + previous.toFixed(3) + "s.");
    resultBox.hidden = false;
    renderBest();
  }

  function registerClick() {
    if (finished) return;
    if (!running) {
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(tick);
    }
    count++;
    if (count >= target) {
      finish();
    } else {
      updateDisplay((performance.now() - startTime) / 1000);
    }
  }

  function setTarget(n) {
    target = n;
    reset();
  }

  // ---------- events ----------
  clickBtn.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    registerClick();
  });

  clickBtn.addEventListener("click", function (e) { e.preventDefault(); });

  document.addEventListener("keydown", function (e) {
    if (e.code !== "Space") return;
    var tag = e.target.tagName;
    if (tag === "INPUT") return;
    if (tag === "BUTTON" && e.target !== clickBtn) return;
    e.preventDefault();
    if (e.repeat) return;
    clickBtn.classList.add("pressed");
    registerClick();
  });

  document.addEventListener("keyup", function (e) {
    if (e.code === "Space") clickBtn.classList.remove("pressed");
  });

  targetBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      targetBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      customInput.classList.remove("active");
      customInput.value = "";
      setTarget(parseInt(btn.dataset.target, 10));
    });
  });

  customInput.addEventListener("input", function () {
    var n = parseInt(customInput.value, 10);
    if (!n || n < 1) return;
    n = Math.min(n, 1000);
    targetBtns.forEach(function (b) { b.classList.remove("active"); });
    customInput.classList.add("active");
    setTarget(n);
  });

  document.getElementById("again").addEventListener("click", reset);
  document.getElementById("reset").addEventListener("click", reset);

  document.getElementById("clearBest").addEventListener("click", function () {
    saveBest({});
    renderBest();
  });

  // ---------- init ----------
  reset();
  renderBest();
})();
