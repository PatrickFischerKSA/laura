
const REL_LABELS = {
  triggers: "löst direkt aus (TRIGGERS)",
  enables: "ermöglicht (ENABLES)",
  implies: "spricht dafür (IMPLIES)"
};

const levels = [
  {
    id: "L1",
    title: "Lab incident",
    end_state: "A biologist is found dead on the lab floor, surrounded by broken glassware and a spilled translucent solution. A colleague kneels beside him, holding his hand.",
    meta: "Location: research lab • Time: late evening • Weather: clear • Access: restricted keycard",
    hint: "Fokussiere auf Sicherheitsverstösse + Zugangsdaten. Outsiders sind ausgeschlossen.",
    clues: [
      "Petri dish note: 'do not agitate'.",
      "Keycard log: victim 19:12, colleague 21:07, technician 18:59. No outsiders.",
      "Safety binder: neutralization bath must be ready; no reactive medium near flame."
    ],
    causes: [
      "Reactive medium was agitated near bench edge (protocol breach)",
      "No neutralization bath was prepared (protocol breach)",
      "Residual heat from Bunsen burner altered medium stability (protocol breach)",
      "Victim mishandled without proper PPE (protocol breach)",
      "Only authorized staff present this evening (access constraint)",
      "Colleague arrived after incident onset (time constraint)",
      "Container slid off due to vibration (physics)",
      "Victim rushed experimental validation (human factor)",
      "No outsider intervention plausible (access)",
      "Unknown outsider entered the lab unnoticed (forbidden)"
    ],
    validateChain(chain) {
      const messages = [];
      let good = true;

      const hasOutsider = chain.some(step =>
        step.text.toLowerCase().includes("outsider entered")
      );
      if (hasOutsider) {
        messages.push(["bad", "Constraint: Outsiders sind durch das Zugangslog ausgeschlossen. Entferne 'Unknown outsider entered the lab unnoticed'."]);
        good = false;
      } else {
        messages.push(["good", "Constraint erfüllt: Keine Outsider-Ursache in deiner Kette."]);
      }

      const hasProtocol = chain.some(step =>
        step.text.toLowerCase().includes("protocol breach") ||
        step.text.toLowerCase().includes("neutralization bath") ||
        step.text.toLowerCase().includes("ppe") ||
        step.text.toLowerCase().includes("bunsen")
      );
      if (!hasProtocol) {
        messages.push(["bad", "Constraint: Mindestens ein Sicherheits-/Protokollverstoss muss vorkommen."]);
        good = false;
      } else {
        messages.push(["good", "Constraint erfüllt: Protokollverstoss vorhanden."]);
      }

      if (chain.length > 0) {
        const root = chain[chain.length - 1];
        if (root.text.toLowerCase().includes("colleague")) {
          messages.push(["bad", "Constraint: Die Kollegin/der Kollege darf nicht als Wurzel-Ursache ganz am Anfang stehen."]);
          good = false;
        } else {
          messages.push(["good", "Constraint erfüllt: Wurzel-Ursache ist nicht die Kollegin/der Kollege."]);
        }
      }

      const seen = new Set();
      let redundant = 0;
      chain.forEach(step => {
        const key = step.text.toLowerCase().trim();
        if (seen.has(key)) redundant++;
        seen.add(key);
      });
      if (redundant > 0) {
        messages.push(["bad", `Qualität: Deine Kette enthält ${redundant} doppelte(n) Schritt(e).`]);
        good = false;
      } else {
        messages.push(["good", "Qualität: Keine exakt doppelten Schritte gefunden."]);
      }

      if (chain.length < 2) {
        messages.push(["warn", "Die Kette ist sehr kurz – füge 2–4 Schritte hinzu, um eine echte Erklärung zu haben."]);
        good = false;
      }

      return { ok: good, messages };
    }
  },
  {
    id: "L2",
    title: "Court steps",
    end_state: "A public statue's head lies shattered; scorch marks on a nearby plinth; emergency services cordon the square.",
    meta: "Location: civic square • Time: early morning • Crowd: sparse • CCTV: partial coverage",
    hint: "Verknüpfe Wartung & CCTV-Blindspot mit der Platzierung der Ladung. Vendor ist nur Beobachter*in.",
    clues: [
      "Damage pattern fits a small charge under the overhang.",
      "First emergency call: 06:58 vendor, second: 07:03 officer.",
      "Two CCTV cameras offline due to maintenance; blind spot at statue base."
    ],
    causes: [
      "Small charge placed under overhang (trigger)",
      "Placement timed for CCTV blind spot (access)",
      "Maintenance created coverage gap (unwitting)",
      "Vendor noticed blast first; not origin (bystander)",
      "Symbolic link to upcoming event (motive)",
      "Vendor planted the charge (forbidden root)"
    ],
    validateChain(chain) {
      const messages = [];
      let good = true;

      if (chain.length > 0) {
        const root = chain[chain.length - 1];
        if (root.text.toLowerCase().includes("vendor planted")) {
          messages.push(["bad", "Constraint: Der Vendor ist Bystander und darf nicht Wurzel-Ursache sein."]);
          good = false;
        } else {
          messages.push(["good", "Constraint erfüllt: Vendor ist nicht Wurzel-Ursache."]);
        }
      }

      const hasBlindspot = chain.some(step =>
        step.text.toLowerCase().includes("blind spot") ||
        step.text.toLowerCase().includes("maintenance created coverage gap")
      );
      if (!hasBlindspot) {
        messages.push(["bad", "Constraint: Mindestens ein Schritt muss den CCTV-Blindspot/Wartung erwähnen."]);
        good = false;
      } else {
        messages.push(["good", "Constraint erfüllt: CCTV/Wartung ist in der Kette vorhanden."]);
      }

      const seen = new Set();
      let redundant = 0;
      chain.forEach(step => {
        const key = step.text.toLowerCase().trim();
        if (seen.has(key)) redundant++;
        seen.add(key);
      });
      if (redundant > 0) {
        messages.push(["bad", `Qualität: Deine Kette enthält ${redundant} doppelte(n) Schritt(e).`]);
        good = false;
      } else {
        messages.push(["good", "Qualität: Keine exakt doppelten Schritte gefunden."]);
      }

      if (chain.length < 2) {
        messages.push(["warn", "Die Kette ist sehr kurz – füge 2–4 Schritte hinzu, um eine echte Erklärung zu haben."]);
        good = false;
      }

      return { ok: good, messages };
    }
  }
];

let currentLevel = null;
let chain = [];

function initLevelSelect() {
  const select = document.getElementById("levelSelect");
  levels.forEach((lvl, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${idx + 1} – ${lvl.title}`;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    loadLevel(parseInt(select.value, 10));
  });
  loadLevel(0);
}

function loadLevel(idx) {
  currentLevel = levels[idx];
  chain = [];
  renderLevel();
  renderChain();
  clearFeedback();
}

function renderLevel() {
  if (!currentLevel) return;
  document.getElementById("endState").textContent = currentLevel.end_state;
  document.getElementById("endStateShort").textContent = currentLevel.end_state;
  document.getElementById("metaInfo").textContent = currentLevel.meta;
  document.getElementById("hintText").textContent = "";

  const clueList = document.getElementById("clueList");
  clueList.innerHTML = "";
  currentLevel.clues.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    clueList.appendChild(li);
  });

  const causeList = document.getElementById("causeList");
  causeList.innerHTML = "";
  currentLevel.causes.forEach(cause => {
    const li = document.createElement("li");
    li.textContent = cause;
    li.addEventListener("click", () => addStep(cause));
    causeList.appendChild(li);
  });
}

function addStep(causeText) {
  const relChoice = window.prompt(
    "Art der Beziehung wählen:\n1 = löst direkt aus (TRIGGERS)\n2 = ermöglicht (ENABLES)\n3 = spricht dafür (IMPLIES)",
    "1"
  );
  if (!relChoice) return;

  let rel = null;
  if (relChoice === "1") rel = "triggers";
  else if (relChoice === "2") rel = "enables";
  else if (relChoice === "3") rel = "implies";

  if (!rel) {
    alert("Ungültige Eingabe, Schritt wird nicht hinzugefügt.");
    return;
  }

  chain.push({ text: causeText, rel });
  renderChain();
  clearFeedback();
}

function renderChain() {
  const ul = document.getElementById("chainList");
  ul.innerHTML = "";
  chain.forEach((step, idx) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.classList.add("chain-rel");
    span.classList.add("rel-" + step.rel);
    span.textContent = REL_LABELS[step.rel] || step.rel;
    const txt = document.createElement("span");
    txt.textContent = step.text;
    li.appendChild(span);
    li.appendChild(txt);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.className = "secondary";
    removeBtn.style.marginLeft = "8px";
    removeBtn.style.padding = "0 8px";
    removeBtn.style.fontSize = "0.8rem";
    removeBtn.onclick = () => {
      chain.splice(idx, 1);
      renderChain();
      clearFeedback();
    };
    li.appendChild(removeBtn);

    ul.appendChild(li);
  });
}

function clearFeedback() {
  document.getElementById("feedbackList").innerHTML = "";
}

function validate() {
  if (!currentLevel) return;
  const res = currentLevel.validateChain(chain);
  const ul = document.getElementById("feedbackList");
  ul.innerHTML = "";

  res.messages.forEach(([kind, msg]) => {
    const li = document.createElement("li");
    let prefix = "";
    if (kind === "good") prefix = "✔ ";
    else if (kind === "bad") prefix = "✖ ";
    else if (kind === "warn") prefix = "⚠ ";
    li.textContent = prefix + msg;
    ul.appendChild(li);
  });

  if (res.ok) {
    const li = document.createElement("li");
    li.textContent = "🎉 Deine Kette erfüllt alle Constraints dieses Levels!";
    ul.appendChild(li);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLevelSelect();

  document.getElementById("validateBtn").addEventListener("click", validate);
  document.getElementById("clearChain").addEventListener("click", () => {
    chain = [];
    renderChain();
    clearFeedback();
  });
  document.getElementById("hintBtn").addEventListener("click", () => {
    if (currentLevel) {
      document.getElementById("hintText").textContent = currentLevel.hint;
    }
  });
});
