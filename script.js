const quote = "The quick brown fox jumps over the lazy dog.";
const quoteElement = document.getElementById("quote");
const inputElement = document.getElementById("input");
const resultElement = document.getElementById("result");
const timerElement = document.getElementById("timer");

let startTime = null;
let ended = false;


inputElement.addEventListener("input", ()=> {
    const input = inputElement.value;

    if(!startTime && input.length > 0) {
        startTime = new Date();
        startTimer();
        
    }

    function startTimer() {
        timerID = setInterval(()=>{
            const timeStamp = new Date();
            const timePassed = Math.floor((timeStamp-startTime) / 1000);
            const secunde = timePassed % 60;
            const minute = Math.floor(timePassed / 60);

            timerElement.textContent = `${minute.toString().padStart(2,'0')}:${secunde.toString().padStart(2,'0')}`
        },1000);
    }

    function stopTimer() {
        clearInterval(timerID);
    }

    if(input === quote) {
        if(!ended){
            ended = true;
            const endTime = new Date();
            const timeTaken = (endTime - startTime) / 1000;

            const words = quote.split(" ").length;
            const wpm = Math.round((words/timeTaken) * 60);

            resultElement.textContent = `wpm: ${wpm}`;

            inputElement.disabled = true;
            stopTimer();    

        }
    }
});