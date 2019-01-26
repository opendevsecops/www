const geoPattern = require('geopattern')

document.addEventListener('DOMContentLoaded', () => {
    Array.from(document.querySelectorAll('.geopattern')).forEach((element) => {
        const seed = element.dataset.seed || Math.random().toString(32).slice(2)

        if (process.env.NODE_ENV !== 'production') {
            console.log(`geopattern seed:`, seed)
        }

        const color = element.dataset.color || undefined
        const baseColor = element.dataset.baseColor || undefined

        element.style.backgroundImage = geoPattern.generate(seed, { color, baseColor }).toDataUrl()
    })
})
