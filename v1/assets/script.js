
const tabs = document.querySelectorAll('.tab')
// console.log(tabs)

// Navbar active class toggle
tabs.forEach(
    (tab) => {
        tab.addEventListener("click", ()=> {
            tabs.forEach( (t)=> {t.classList.remove('active')})
            tab.classList.add('active')
        })
    }
)
