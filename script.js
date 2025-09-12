const quotes = [
    "The quick brown fox jumps over the lazy dog.",
    "JavaScript is fun but tricky.",
    "Typing fast takes practice."
];

const quoteElement = document.getElementById("quote");
const resultElement = document.getElementById("result");
const timerElement = document.getElementById("timer");
const resetBtn = document.getElementById("reset");
const nextBtn = document.getElementById("next");    

let startTime = null;
let ended = false;
let currentQuoteIndex = 0;
let timerID;
let currentCharIndex = 0;

textRender(quotes[currentQuoteIndex]);

resetBtn.addEventListener("click", () => {
    resetTest();
    resetBtn.blur()
});
nextBtn.addEventListener("click", () => {
    nextTest();
    nextBtn.blur()
});

function resetTest() {
    stopTimer(timerID);
    startTime = null;
    ended = false;
    timerElement.textContent = '00:00';
    currentCharIndex = 0;
    resultElement.textContent = "";

    const spans = quoteElement.querySelectorAll("span");
    spans.forEach(span => span.classList.remove("correct", "incorrect", "active"))
    spans[currentCharIndex].classList.add("active")
}

function nextTest() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
    textRender(quotes[currentQuoteIndex]);
    resetTest();
}

function startTimer() {
    timerID = setInterval(() => {
        const timeStamp = new Date();
        const timePassed = Math.floor((timeStamp - startTime) / 1000);
        const seconds = timePassed % 60;
        const minutes = Math.floor(timePassed / 60);
        timerElement.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerID);
}

function textRender(quote) {
    quoteElement.innerHTML = "";

    const fragment = document.createDocumentFragment();

    Array.from(quote).forEach(char => {
        const span = document.createElement("span");
        span.textContent = char;
        fragment.appendChild(span)
    });

    quoteElement.appendChild(fragment);

    currentCharIndex = 0;
    quoteElement.querySelector("span").classList.add("active");
}

document.addEventListener("keydown", (e) => {
    if(ended) return;

    const spans = quoteElement.querySelectorAll("span");

    if (!startTime) {
        startTime = new Date();
        startTimer();
    }

    if(e.key === "Backspace") {
        if(currentCharIndex > 0) {
            spans[currentCharIndex].classList.remove("active");
            currentCharIndex --;
            spans[currentCharIndex].classList.remove("correct", "incorrect");
            spans[currentCharIndex].classList.add("active");
        }
        return;
    }

    const expectedChar = spans[currentCharIndex].innerText;
    const typedChar = e.key;

    if(typedChar.length === 1) {
        if(typedChar === expectedChar) {
            spans[currentCharIndex].classList.add("correct");
        }
        else {
            spans[currentCharIndex].classList.add("incorrect");
        }
        spans[currentCharIndex].classList.remove("active");
        currentCharIndex ++;
        if (currentCharIndex < spans.length) {
            spans[currentCharIndex].classList.add("active");
        }
        
    }

    if (currentCharIndex >= spans.length) {
        if (!ended) {
            ended = true;
            const endTime = new Date();
            const timeTaken = (endTime - startTime) / 1000;

            const words = quotes[currentQuoteIndex].split(" ").length;
            const wpm = Math.round((words / timeTaken) * 60);

            resultElement.textContent = `WPM: ${wpm}`;
            stopTimer();
        }
    }
});
