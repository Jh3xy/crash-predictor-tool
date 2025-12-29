
// Grab Elements
const themeBtn = document.querySelector('.theme-btn')
const body = document.body

const days = document.getElementById("days")
const hours = document.getElementById("hours")
const minutes = document.getElementById("minutes")
const seconds = document.getElementById("seconds")


// Use setInterval to add live ticking to updateCountdown every one second (1000)

// Theme toggle
themeBtn.addEventListener("click", ()=>{
    body.classList.toggle('dark')
    themeBtn.classList.add('active')
})

//The function is first called before the interval so its starts immediately page loads
updateCountdown()

const timer = setInterval(updateCountdown, 100);
// Countdown Timer
function updateCountdown() {
    const targetDate = new Date("2026-01-20")
    const currentDate = targetDate - new Date() //milliseonds left till the target Date

    const timeDivs = document.querySelectorAll(".num")
    if (currentDate <= 0) {
        timeDivs.forEach(
            (timeDiv)=>{timeDiv.classList.add('flicker-5')}
        )
        console.log(timeDivs)
        //Stop timer
        clearInterval(timer)
        return 
    }

    let totalSeconds = Math.floor(currentDate / 1000) // 1000 milliseconds make a second
    let totalMinutes = Math.floor(totalSeconds / 60) // 60 Seconds make 1 minute
    let totalHours = Math.floor(totalMinutes / 60) // 60 minutes make one hour
    let totalDays = Math.floor(totalHours / 24)

    // Take thier remainders and use to display inside clock
    let displaySeconds = totalSeconds % 60
    let displayMinutes = totalMinutes % 60
    let displayHours = totalHours % 24
    let displayDays = totalDays

    // The one line if statement - Tenerary Operator ensures that is e.g displaySeconds < 10 it adds a zero infront to keep it uniform
    days.innerText = (displayDays < 10) ? `0${displayDays}` : displayDays
    hours.innerText = (displayHours < 10) ? `0${displayHours}` : displayHours
    minutes.innerText = (displayMinutes < 10) ? `0${displayMinutes}` : displayMinutes
    seconds.innerText = (displaySeconds < 10) ? `0${displaySeconds}` : displaySeconds
    
}


