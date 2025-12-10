
// Relationstypen (Anzeige-Labels auf Deutsch)
const REL_LABELS = {
  triggers: "löst unmittelbar aus",
  enables: "ermöglicht / bereitet vor",
  implies: "legt nahe / spricht dafür"
};

// Levels mit anspruchsvoller, aber klarer deutscher Sprache
const levels = [
  {
    id: "L1",
    title: "Laborvorfall",
    end_state:
      "Ein leitender Biologe wird leblos auf dem Laborboden aufgefunden. Um ihn herum liegen zerbrochene Glasgefäße und eine verschüttete, nahezu farblose Lösung. Eine Kollegin kniet neben ihm und hält seine Hand.",
    meta:
      "Ort: Forschungslabor · Zeit: später Abend · Wetter: klar · Zugang: nur via Keycard für autorisierte Personen",
    hint:
      "Konzentriere dich auf Sicherheitsverstösse (Protokoll, Schutzausrüstung, Neutralisationsbad) und die klare Zugangslage. Externe Personen sind faktisch ausgeschlossen. Überlege dir, was die Instabilität des Mediums auslöst und warum der Schaden so schwer ist.",
    clues: [
      "An einer Petrischale hängt ein Zettel: »Medium-7 – nicht schütteln! Nur unter der Sicherheitsbank testen.«",
      "Das Keycard-Protokoll zeigt nur drei Personen: Technikerin (18:59), Leitender Biologe (19:12), Senior-Kollege (21:07). Keine weiteren Einträge.",
      "Im Sicherheitsordner ist eine Seite markiert: »Reaktive Medien nie in der Nähe offener Flammen umfüllen; Neutralisationsbad muss bereitstehen.«",
      "Der Bunsenbrenner ist abgedreht, aber noch deutlich warm.",
      "Ein Schutzhandschuh fehlt; die Augendusche ist unbenutzt; das Neutralisationsbad ist verschlossen."
    ],
    causes: [
      "Das reaktive Medium wurde in der Nähe der Labortischkante geschüttelt (klarer Verstoss gegen die Warnhinweise).",
      "Es war kein Neutralisationsbad vorbereitet, obwohl dies vorgeschrieben wäre.",
      "Restwärme des Bunsenbrenners hat die Stabilität des Mediums zusätzlich herabgesetzt.",
      "Der Biologe hantierte ohne vollständige Schutzausrüstung (fehlender Handschuh, fehlende Schutzbrille).",
      "Nur autorisiertes Laborpersonal war an diesem Abend im Labor anwesend.",
      "Der Senior-Kollege betrat das Labor erst, nachdem der kritische Zwischenfall bereits im Gang war.",
      "Der Behälter mit dem Medium rutschte aufgrund von Vibrationen von der Tischkante.",
      "Der Biologe stand unter hohem Zeitdruck und wollte die Versuchsergebnisse zu schnell validieren.",
      "Es gab keinen Eingriff durch eine unbekannte Aussenseiter-Person.",
      "Eine unbekannte Aussenseiter-Person betrat unerkannt das Labor und manipulierte das Medium." // verbotene Ursache
    ],
    validateChain(chain) {
      const messages = [];
      let ok = true;

      // 1) Keine Aussenseiter-Person als Ursache
      const hasOutsider = chain.some(step =>
        step.text.toLowerCase().includes("aussenseiter-person betrat")
      );
      if (hasOutsider) {
        messages.push([
          "bad",
          "Zugangsregel verletzt: Eine unbekannte Aussenseiter-Person kann den Vorfall nicht verursacht haben – das Keycard-Protokoll schliesst dies aus."
        ]);
        ok = false;
      } else {
        messages.push([
          "good",
          "Zugangsregel erfüllt: Deine Kette verzichtet auf eine externe Aussenseiter-Person."
        ]);
      }

      // 2) Mindestens ein Sicherheits-/Protokollverstoss
      const hasProtocol = chain.some(step =>
        step.text.toLowerCase().includes("verstoss") ||
        step.text.toLowerCase().includes("neutralisationsbad") ||
        step.text.toLowerCase().includes("schutzausrüstung") ||
        step.text.toLowerCase().includes("bunsenbrenner")
      );
      if (!hasProtocol) {
        messages.push([
          "bad",
          "Sicherheitsregel verletzt: In deiner Kette fehlt ein klarer Verstoss gegen das Labor- oder Sicherheitsprotokoll."
        ]);
        ok = false;
      } else {
        messages.push([
          "good",
          "Sicherheitsregel erfüllt: Mindestens ein gravierender Protokollverstoss ist in deiner Kette enthalten."
        ]);
      }

      // 3) Senior-Kollege darf nicht Wurzel-Ursache ganz am Anfang sein
      if (chain.length > 0) {
        const root = chain[chain.length - 1];
        if (root.text.toLowerCase().includes("senior-kollege")) {
          messages.push([
            "bad",
            "Zeitlogik verletzt: Der Senior-Kollege kam erst nach Beginn des Zwischenfalls und kann deshalb nicht die Wurzel-Ursache deiner Kette sein."
          ]);
          ok = false;
        } else {
          messages.push([
            "good",
            "Zeitlogik erfüllt: Die Wurzel-Ursache ist nicht der Senior-Kollege."
          ]);
        }
      }

      // 4) Redundanzprüfung
      const seen = new Set();
      let redundant = 0;
      chain.forEach(step => {
        const key = step.text.toLowerCase().trim();
        if (seen.has(key)) redundant++;
        seen.add(key);
      });
      if (redundant > 0) {
        messages.push([
          "bad",
          `Qualität: Deine Kette enthält ${redundant} doppelt vorkommende(n) Schritt(e). Formuliere sparsamer und vermeide Wiederholungen.`
        ]);
        ok = false;
      } else {
        messages.push([
          "good",
          "Qualität: Keine exakt doppelten Schritte – deine Kette ist in diesem Punkt sparsam formuliert."
        ]);
      }

      // 5) Minimale Kettenlänge
      if (chain.length < 2) {
        messages.push([
          "warn",
          "Die Kette ist sehr kurz. Für eine tragfähige Erklärung brauchst du in der Regel mindestens zwei bis drei klar verknüpfte Ursachen."
        ]);
        ok = false;
      }

      return { ok, messages };
    }
  },
  {
    id: "L2",
    title: "Gerichtstreppe",
    end_state:
      "Der Kopf einer öffentlichen Statue liegt zerschmettert auf den Stufen vor dem Gerichtsgebäude. An einem Sockel sind deutliche Schmauch- und Brandspuren zu erkennen. Einsatzkräfte sperren den Platz weiträumig ab.",
    meta:
      "Ort: Platz vor dem Gerichtsgebäude · Zeit: früher Morgen · Passantendichte: gering · Videoüberwachung: teilweise ausser Betrieb",
    hint:
      "Verknüpfe die Wartungsarbeiten an der Videoüberwachung mit der Platzierung der Ladung. Der Strassenhändler meldet den Vorfall früh, ist aber zeitlich klar als Beobachter einzuordnen – nicht als Ausgangspunkt der Kausalkette.",
    clues: [
      "Das Zerstörungsmuster passt zu einer kleinen, gerichteten Sprengladung, die unter einem Überhang angebracht wurde.",
      "Der erste Notruf geht um 06:58 von einer Strassenhändlerin ein, der zweite um 07:03 von einer Polizistin auf Routinepatrouille.",
      "Zwei Überwachungskameras sind wegen geplanter Wartungsarbeiten offline; der daraus entstehende Blindbereich umfasst den Sockel der Statue.",
      "In der Nähe finden sich Flugblätter zu einer Abendveranstaltung mit dem Titel: »Wahrheit und Institutionen«."
    ],
    causes: [
      "Eine kleine Sprengladung wurde unter dem Überhang der Statue angebracht und detoniert.",
      "Die Platzierung der Ladung wurde bewusst auf den CCTV-Blindbereich abgestimmt.",
      "Geplante Wartungsarbeiten an den Kameras führten unbeabsichtigt zu einem Überwachungsloch.",
      "Die Strassenhändlerin bemerkte die Explosion als erste und löste den Notruf aus.",
      "Die Aktion war symbolisch gegen staatliche Institutionen gerichtet (Motiv).",
      "Die Strassenhändlerin brachte selbst die Sprengladung an und täuschte anschliessend den Notruf vor." // verbotene Wurzel
    ],
    validateChain(chain) {
      const messages = [];
      let ok = true;

      // 1) Strassenhändlerin darf nicht Wurzel-Ursache sein
      if (chain.length > 0) {
        const root = chain[chain.length - 1];
        if (root.text.toLowerCase().includes("strassenhändlerin brachte selbst")) {
          messages.push([
            "bad",
            "Rollenlogik verletzt: Die Strassenhändlerin ist als erste Meldende eine Beobachterin und kann nicht als Wurzel-Ursache der Kette gesetzt werden."
          ]);
          ok = false;
        } else {
          messages.push([
            "good",
            "Rollenlogik erfüllt: Die Wurzel-Ursache deiner Kette ist nicht die Strassenhändlerin."
          ]);
        }
      }

      // 2) CCTV-/Wartungselement muss vorkommen
      const hasSurveillance = chain.some(step =>
        step.text.toLowerCase().includes("blindbereich") ||
        step.text.toLowerCase().includes("überwachungsloch") ||
        step.text.toLowerCase().includes("kameras")
      );
      if (!hasSurveillance) {
        messages.push([
          "bad",
          "Überwachungsregel verletzt: Mindestens ein Schritt deiner Kette muss auf Wartung bzw. CCTV-Blindbereich Bezug nehmen."
        ]);
        ok = false;
      } else {
        messages.push([
          "good",
          "Überwachungsregel erfüllt: Der CCTV-Blindbereich bzw. die Wartung ist in deiner Kette berücksichtigt."
        ]);
      }

      // 3) Redundanzprüfung
      const seen = new Set();
      let redundant = 0;
      chain.forEach(step => {
        const key = step.text.toLowerCase().trim();
        if (seen.has(key)) redundant++;
        seen.add(key);
      });
      if (redundant > 0) {
        messages.push([
          "bad",
          `Qualität: Deine Kette enthält ${redundant} doppelt vorkommende(n) Schritt(e). Versuche, die Erklärung mit weniger, aber prägnanteren Schritten zu formulieren.`
        ]);
        ok = false;
      } else {
        messages.push([
          "good",
          "Qualität: Keine exakt doppelten Schritte in deiner Kette."
        ]);
      }

      // 4) Minimale Kettenlänge
      if (chain.length < 2) {
        messages.push([
          "warn",
          "Die Kette ist sehr kurz. Baue mindestens zwei bis drei sinnvoll verknüpfte Ursachen ein, damit eine plausible Erklärung entsteht."
        ]);
        ok = false;
      }

      return { ok, messages };
    }
  }
];

let currentLevel = null;
let chain = [];

// UI-Initialisierung
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
    "Art der Beziehung auswählen:\n" +
    "1 = löst unmittelbar aus (TRIGGERS) – unmittelbarer Auslöser\n" +
    "2 = ermöglicht / bereitet vor (ENABLES) – schafft Bedingungen\n" +
    "3 = legt nahe / spricht dafür (IMPLIES) – Indiz, kein direkter Auslöser",
    "1"
  );
  if (!relChoice) return;

  let rel = null;
  if (relChoice === "1") rel = "triggers";
  else if (relChoice === "2") rel = "enables";
  else if (relChoice === "3") rel = "implies";

  if (!rel) {
    alert("Ungültige Eingabe – der Schritt wird nicht hinzugefügt.");
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

    // Entfernen-Button
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

    li.appendChild(span);
    li.appendChild(txt);
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
    li.textContent = "🎉 Deine Kette erfüllt alle zentralen Regeln dieses Levels. Du hast eine schlüssige Rückwärtsrekonstruktion gefunden.";
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
