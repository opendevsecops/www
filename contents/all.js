const crypto = require('crypto')
const identicon = require('identicon.js')

document.addEventListener('DOMContentLoaded', (event) => {
    for (const img of document.querySelectorAll('img.identity-icon')) {
        const seed = crypto.createHmac('sha256', img.dataset.seed).digest('hex')
        const icon = new identicon(seed, {size: 512, background: [0, 0, 0, 0]})
        const data = icon.toString()

        img.src = `data:image/png;base64,${data}`
    }
})
