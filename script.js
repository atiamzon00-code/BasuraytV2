(function () {

  function $id(id) {
    return document.getElementById(id);
  }

  // USER STATE
  let username = "";
  let totalPoints = 0;
  let scores = JSON.parse(localStorage.getItem("scores")) || {};

  // ===== PREMIUM SYSTEM (PER USER) =====
  function loadPremiumState() {
    window.hasPaidPremium = localStorage.getItem("hasPaidPremium_" + username) === "true";
    window.isPremiumActive = localStorage.getItem("isPremiumActive_" + username) === "true";
  }

  function savePremiumState() {
    localStorage.setItem("hasPaidPremium_" + username, window.hasPaidPremium);
    localStorage.setItem("isPremiumActive_" + username, window.isPremiumActive);
  }

  // CAMERA
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      $id("camera").srcObject = stream;
    } catch (e) {
      alert("Camera access required.");
    }
  }

  function stopCamera() {
    let stream = $id("camera").srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  // SPEECH
  function speak(text) {
    try {
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    } catch (e) {}
  }

  // EMOJIS (SLOWER)
  function spawnEmojis(symbol) {
    for (let i = 0; i < 10; i++) {
      const emoji = document.createElement("div");
      emoji.textContent = symbol;
      emoji.style.position = "fixed";
      emoji.style.left = Math.random() * window.innerWidth + "px";
      emoji.style.top = Math.random() * window.innerHeight + "px";
      emoji.style.fontSize = "30px";
      emoji.style.zIndex = 5000;
      emoji.style.transition = "transform 2s ease-out, opacity 2s ease-out";

      document.body.appendChild(emoji);

      setTimeout(() => {
        emoji.style.transform = "translateY(-150px)";
        emoji.style.opacity = 0;
      }, 200);

      setTimeout(() => emoji.remove(), 2500);
    }
  }

  // SCANNING
  function handleScanClick() {
    const types = ["nonbiodegradable", "biodegradable", "recyclable"];
    const type = types[Math.floor(Math.random() * types.length)];

    const earned = window.isPremiumActive ? 2 : 1;
    totalPoints += earned;

    showRandomTip(type);


    let emoji = "♻️";
    if (type === "nonbiodegradable") emoji = "😡";
    if (type === "biodegradable") emoji = "🙂";

    spawnEmojis(emoji);
    speak(type);

    scores[username] = totalPoints;
    localStorage.setItem("scores", JSON.stringify(scores));

    updateScoreboard();
    updateWasteTrack(type);
  }
// ===== TIP OF THE DAY =====
const tips = {
  biodegradable: [
    "Enriches the soil: Decomposition adds nutrients.",
    "Helps maintain healthy ecosystems.",
    "Supports composting: Turn biodegradable waste into fertilizer.",
    "Reduces pollution: Less biodegradable waste in landfills."
  ],
  nonbiodegradable: [
    "Avoid burning plastic — it releases toxic chemicals.",
    "Reuse containers instead of throwing them away.",
    "Reduce: Choose products with less packaging.",
    "Nonbiodegradable waste can take hundreds of years to decompose."
  ],
  recyclable: [
    "Rinse recyclables before throwing to avoid contamination.",
    "Recycling saves energy and resources.",
    "Recycled materials can be used in art and DIY projects.",
    "Separate paper, plastic, and metal for better recycling efficiency."
  ]
};

function showRandomTip(type) {
  const tipElement = $id("tip");

  if (!tipElement) return; 

  const list = tips[type];
  if (!list) return;

  const tip = list[Math.floor(Math.random() * list.length)];
  tipElement.textContent = tip;
}

  // SCOREBOARD
  function updateScoreboard() {
    const list = $id("score-list");
    list.innerHTML = "";

    Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .forEach(([user, pts], i) => {
        const li = document.createElement("li");
        li.textContent = `#${i + 1} ${user}: ${pts}`;
        if (user === username) li.style.color = "#27ae60";
        list.appendChild(li);
      });
  }

  // WASTE TRACK
  function updateWasteTrack(item) {
    const list = $id("waste-list");
    const li = document.createElement("li");
    li.textContent = item;
    list.prepend(li);
  }

  // ===== PREMIUM SYSTEM UI =====
  function setupPremiumSystem() {
    const activateBtn = $id("activate-premium");
    const statusText = $id("premium-status");
    const modal = $id("payment-modal");
    const closePaymentBtn = $id("close-payment");
    const confirmPayBtn = $id("confirm-pay-btn");
    const processingMsg = $id("payment-status");

    function updatePremiumUI() {
      if (!window.hasPaidPremium) {
        statusText.textContent = "Premium: OFF";
        statusText.style.color = "#2ecc71";
        activateBtn.textContent = "🔓 Unlock for ₱49";
        return;
      }

      if (window.isPremiumActive) {
        statusText.textContent = "Premium: ACTIVE 💎";
        statusText.style.color = "#f1c40f";
        activateBtn.textContent = "🔒 Deactivate Premium";
      } else {
        statusText.textContent = "Premium: INACTIVE (Paid)";
        statusText.style.color = "#e67e22";
        activateBtn.textContent = "🔓 Activate Premium";
      }
    }

    updatePremiumUI();

    activateBtn.addEventListener("click", () => {

      if (!username) {
        alert("You must log in first!");
        return;
      }

      if (!window.hasPaidPremium) {
        modal.classList.add("active");
        return;
      }

      window.isPremiumActive = !window.isPremiumActive;
      savePremiumState();
      updatePremiumUI();
    });

    closePaymentBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    confirmPayBtn.addEventListener("click", () => {

      confirmPayBtn.textContent = "Processing...";
      confirmPayBtn.disabled = true;
      processingMsg.style.display = "block";

      setTimeout(() => {
        window.hasPaidPremium = true;
        window.isPremiumActive = true;

        savePremiumState();

        spawnEmojis("💎");
        speak("Payment successful!");
        alert("Payment successful! Premium activated.");

        modal.classList.remove("active");

        confirmPayBtn.textContent = "Pay ₱49.00 Now";
        confirmPayBtn.disabled = false;
        processingMsg.style.display = "none";

        updatePremiumUI();
      }, 2000);
    });
  }

  // ===== INITIALIZATION =====
  document.addEventListener("DOMContentLoaded", () => {

    // LOGIN
    $id("login-btn").addEventListener("click", () => {
      const input = $id("username");

      if (input.value.trim() === "") {
        alert("Enter username.");
        return;
      }

      username = input.value.trim();
      loadPremiumState();

      $id("login-section").style.display = "none";
      $id("camera-section").style.display = "block";

      if (!scores[username]) scores[username] = 0;
      totalPoints = scores[username];

      startCamera();
      updateScoreboard();
    });

    // SCAN & RESET
    $id("capture").addEventListener("click", handleScanClick);

    $id("reset").addEventListener("click", () => {
      scores[username] = 0;
      totalPoints = 0;
      localStorage.setItem("scores", JSON.stringify(scores));
      updateScoreboard();
      $id("result").textContent = "Points Reset";
    });

    // SIDEBARS (OPTION A)
    const toggles = {
      "toggle-scoreboard": "scoreboard",
      "toggle-howto": "howto",
      "toggle-wastetrack": "wastetrack",
      "toggle-premium": "premium"
    };

    for (const [btnId, panelId] of Object.entries(toggles)) {
      const btn = $id(btnId);
      const panel = $id(panelId);

      btn.addEventListener("click", () => {

        if (panelId !== "premium" && !username) {
          alert("You must log in first!");
          return;
        }

        panel.classList.add("visible");
      });

      panel.querySelector(".close-btn").addEventListener("click", () => {
        panel.classList.remove("visible");
      });
    }

    // ===== LOGOUT WITH LAYOUT RESET FIX =====
    $id("logout-btn").addEventListener("click", () => {

      if (!username) {
        alert("No user is logged in.");
        return;
      }

      stopCamera();

      username = "";
      totalPoints = 0;

      // RESET LAYOUT FIX (Prevents login layout distortion)
      const app = document.querySelector(".app");
      app.style.transform = "scale(1)";
      app.style.padding = "2rem";
      app.style.display = "flex";
      app.style.flexDirection = "column";
      app.style.alignItems = "center";
      app.style.justifyContent = "center";

      $id("camera-section").style.display = "none";
      $id("login-section").style.display = "flex";

      $id("username").value = "";
      $id("password").value = "";

      alert("Logged out successfully.");
    });

    setupPremiumSystem();
  });

})();
