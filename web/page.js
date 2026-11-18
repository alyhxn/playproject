const STATE = require('STATE')
const statedb = STATE(__filename)
statedb.admin()
const { sdb } = statedb(defaults)
const { drive } = sdb
const app = require('../src/app')
const sheet = new CSSStyleSheet()
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
  document.adoptedStyleSheets = [sheet]
  await document.fonts.ready
}

async function boot () {
  const on = {
    style: inject
  }
  const [opts] = await sdb.watch(onbatch)
  const el = document.body
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.adoptedStyleSheets = [sheet]
  shadow.append(await app(opts))

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail (data, type) { console.warn('page: invalid batch', { cause: { data, type } }) }
}
function inject (data) { sheet.replaceSync(data.join('\n')) }

function defaults () {
  // every dataset of app has to be mapped to a dataset of the page
  const datasets = [
    'style', 'content', 'count', 'devkit',
    'commands', 'icons', 'scroll', 'actions', 'hardcons', 'files', 'highlight',
    'active_tab', 'entries', 'runtime', 'mode', 'flags', 'keybinds', 'undo',
    'focused', 'temp_actions', 'temp_quick_actions', 'prefs', 'variables',
    'data', 'docs_style', 'docs'
  ]
  const mapping = {}
  const drive = {}
  for (const name of datasets) {
    mapping[name] = name
    drive[`${name}/`] = {}
  }
  drive['style/'] = {
    'demo.css': { $ref: '../src/node_modules/css/default/demo.css' }
  }
  return {
    _: {
      '../src/app': { $: '', 0: '', mapping }
    },
    drive
  }
}
