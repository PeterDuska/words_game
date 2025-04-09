let currentWord = "cold";
let nextWord = "";
let definition = "";

window.onload = async () => {
  await getNewWord();
};

async function getNewWord() {
  const res = await fetch("/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current: currentWord })
  });
  const data = await res.json();
  if (data.word) {
    nextWord = data.word;
    document.getElementById("definition").innerText = data.definition;
    document.getElementById("guess").value = "";
    document.getElementById("feedback").innerText = "";
  } else {
    document.getElementById("definition").innerText = "No more words!";
  }
}

async function submitGuess() {
  const guess = document.getElementById("guess").value;
  if (!guess) return;
  const res = await fetch("/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guess: guess, actual: nextWord })
  });
  const data = await res.json();
  if (data.correct) {
    currentWord = nextWord;
    document.getElementById("feedback").style.color = "lightgreen";
    document.getElementById("feedback").innerText = "Correct!";
    await getNewWord();
  } else {
    document.getElementById("feedback").innerText = "Try again.";
  }
}
