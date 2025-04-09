let ladders = [];
let currentLadder = 0;
let currentStep = 0;
let wrongAttempts = 0;
let revealedIndices = new Set();

window.onload = async () => {
    if (!localStorage.getItem("howToSeen")) {
        document.getElementById("how-to-play").style.display = "flex";
      } else {
        document.getElementById("how-to-play").style.display = "none";
      }

  const res = await fetch("/api/ladders");
  ladders = await res.json();
  currentLadder = Math.floor(Math.random() * (ladders.length - 1));
  console.log(currentLadder);
  buildGame();
};

function buildGame() {
    const game = document.getElementById("game");
    const ladder = ladders[currentLadder];

    ladder.forEach((entry, i) => {
      const row = document.createElement("div");
      row.className = "word-row";
      row.dataset.index = i;

      for (let j = 0; j < entry.word.length; j++) {
        const box = document.createElement("input");
        box.className = "letter-box";
        box.maxLength = 1;
        box.dataset.pos = j;
        box.disabled = true;
        row.appendChild(box);
      }

      game.appendChild(row);
    });

    // Wait for all rows to be in DOM, then record their static center positions
    requestAnimationFrame(() => {
      const rows = document.querySelectorAll(".word-row");
      rows.forEach(row => {
        const center = row.offsetTop + row.offsetHeight / 2;
        row.dataset.center = center;
      });

      activateRow(0); // now it uses correct static center
      updateDefinition();
    });
  }

  function activateRow(index) {
    wrongAttempts = 0;
    revealedIndices = new Set();
    const rows = document.querySelectorAll(".word-row");
    const row = rows[index];
    const game = document.getElementById("game");
    const viewport = document.getElementById("viewport");

    rows.forEach(r => r.classList.remove("active"));
    row.classList.add("active");

    const centerTarget = viewport.offsetHeight / 2;
    const rowCenter = parseFloat(row.dataset.center); // use stored center

    const shift = centerTarget - rowCenter;
    game.style.transform = `translateY(${shift}px)`;
    //game.classList.remove("bounce");
    //void game.offsetWidth; // reflow
    //game.classList.add("bounce");

    const boxes = row.querySelectorAll("input");
    boxes.forEach((box, i) => {
      box.disabled = false;

      box.addEventListener("input", () => {
        box.value = box.value.toLowerCase();
        if (box.value.length > 0 && i < boxes.length - 1) {
          boxes[i + 1].focus();
        }
        checkRow(boxes, index);
      });

      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && i > 0) {
          boxes[i - 1].focus();
        }
      });
    });

    boxes[0].focus();
  }

function checkRow(boxes, index) {
  const guess = Array.from(boxes).map(b => b.value.toLowerCase()).join("");
  const actual = ladders[currentLadder][index].word.toLowerCase();

  if (guess.length === actual.length) {
    if (guess === actual) {
      boxes.forEach((b, i) => {
        setTimeout(() => {
            playSound("correct-sound");
          b.classList.add("correct", "wave");
        }, i * 100);
      });

      setTimeout(() => {
        if (index + 1 < ladders[currentLadder].length) {
          currentStep++;
          activateRow(currentStep);
          updateDefinition();
        } else {
            launchConfetti();
            showWinScreen();
        }
      }, 800);
    } else {
      boxes.forEach(b => b.classList.add("shake"));
      setTimeout(() => {
        playSound("wrong-sound");
        wrongAttempts++;

        const actual = ladders[currentLadder][index].word.toLowerCase();
        const boxes = document.querySelectorAll('.word-row')[index].querySelectorAll("input");

        let prev = "";
        if (index > 0) {
          prev = ladders[currentLadder][index - 1].word.toLowerCase();
        } else {
          // Fallback: use actual word and mark the last letter as changing
          prev = actual.substring(0, actual.length - 1) + "_";
        }

        const changeIndex = getChangingLetterIndex(prev, actual);

        const currentLocked = new Set();
        boxes.forEach((b, i) => {
          if (b.classList.contains("locked")) {
            currentLocked.add(i);
          }
        });

        // Reveal one new correct letter not including the change index
        // Find eligible unrevealed hint indices (not the changing one)
        const eligible = [];

        for (let i = 0; i < actual.length; i++)
        {
            if (i !== changeIndex && !currentLocked.has(i) && prev[i] === actual[i])
            {
                eligible.push(i);
            }
        }


        // Pick one at random to reveal
        const nextHintIndex = eligible.length > 0
        ? eligible[Math.floor(Math.random() * eligible.length)]
        : null;


        let firstEditable = null;

        boxes.forEach((box, i) => {
          box.classList.remove("shake");

          if (i === nextHintIndex) {
            box.value = actual[i];
            box.classList.add("locked");
            box.disabled = true;
          } else if (box.classList.contains("locked")) {
            box.value = actual[i];
            box.disabled = true;
          } else {
            box.value = "";
            box.classList.remove("locked");
            box.disabled = false;

            // Auto-move to the first unlocked one
            if (firstEditable === null) {
              firstEditable = i;
            }
          }

          // 👇 Automatically skip locked boxes while typing
          box.addEventListener("input", () => {
            if (box.value.length === 1) {
              for (let j = i + 1; j < boxes.length; j++) {
                if (!boxes[j].disabled) {
                  boxes[j].focus();
                  break;
                }
              }
            }
          });

          box.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !box.value && i > 0) {
              for (let j = i - 1; j >= 0; j--) {
                if (!boxes[j].disabled) {
                  boxes[j].focus();
                  break;
                }
              }
            }
          });
        });

        // Focus first editable input
        if (firstEditable !== null) {
          boxes[firstEditable].focus();
        }
      }, 400);
    }
  }
}

function updateDefinition() {
  const def = ladders[currentLadder][currentStep]?.definition || "No definition.";
  document.getElementById("definition-box").innerText = def;
}

function getChangingLetterIndex(w1, w2) {
    if (w1.length !== w2.length) return -1;
    for (let i = 0; i < w1.length; i++) {
      if (w1[i] !== w2[i]) return i;
    }
    return -1;
  }


function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  function launchConfetti() {
    confetti({
        particleCount: 50,
        origin: { x: 0, y: 1 },
        angle: 60,
        spread: 55,
        startVelocity: 45
      });

      confetti({
        particleCount: 50,
        origin: { x: 1, y: 1 },
        angle: 120,
        spread: 55,
        startVelocity: 45
      });
  }

  function replayGame() {
    location.reload();
  }


  function showWinScreen() {
    const screen = document.getElementById("win-screen");
    screen.style.opacity = "1";
    screen.style.pointerEvents = "auto";
  }


  function closeHowToPlay() {
    const popup = document.getElementById("how-to-play");
    popup.style.opacity = "0";
    setTimeout(() => {
      popup.style.display = "none";
    }, 300);

    // Save flag in localStorage
    localStorage.setItem("howToSeen", "true");
  }