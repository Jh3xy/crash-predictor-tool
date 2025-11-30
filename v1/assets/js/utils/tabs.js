
// Event for handler for showing active tabs
export function listenForTabs(targetElem) {
    targetElem.forEach(
        target =>{
            target.addEventListener('click', ()=>{
                targetElem.forEach(
                    t => { t.classList.remove('active')}
                )
                target.classList.add('active')
            })
        }
    )
    console.log('🔗 Tab Event Listener attached')
}


