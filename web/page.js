const app = require('../src/app')
config().then(boot)

async function config () {
  const html = document.documentElement
  const meta = document.createElement('meta')
  const icons = './src/node_modules/assets/images/favicon/'
  const font = 'https://fonts.googleapis.com/css?family=Nunito:300,400,700,900|Slackey&display=swap'
  html.setAttribute('lang', 'en')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', 'width=device-width,initial-scale=1.0')
  document.head.append(meta)
  document.head.insertAdjacentHTML('beforeend', `
    <link rel="apple-touch-icon" sizes="180x180" href="${icons}apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="${icons}favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="${icons}favicon-16x16.png">
    <link rel="manifest" href="${icons}site.webmanifest">
    <link href="${font}" rel="stylesheet" type="text/css">`)
  document.title = 'Playproject.io'
  document.body.removeAttribute('style')
  await document.fonts.ready
}

async function boot () {
  document.body.append(await app())
}
