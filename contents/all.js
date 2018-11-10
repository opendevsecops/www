const crypto = require('crypto')
const identicon = require('identicon.js')

document.addEventListener('DOMContentLoaded', (event) => {
    for (const img of document.querySelectorAll('img.identity-icon')) {
        let background

        if (img.dataset.background) {
            background = JSON.parse(img.dataset.background)
        }

        const seed = crypto.createHmac('sha256', img.dataset.seed).digest('hex')
        const icon = new identicon(seed, {size: 512, background: background})
        const data = icon.toString()

        img.src = `data:image/png;base64,${data}`
    }
})
