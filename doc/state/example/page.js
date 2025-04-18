const STATE = require('../../../src/node_modules/STATE')
const statedb = STATE(__filename)
const io =require('io')
const { id, sdb, subs: [get] } = statedb(fallback_module)


/******************************************************************************
  PAGE
******************************************************************************/
const app = require('app')
const sheet = new CSSStyleSheet()
config().then(() => boot({ sid: '' }))

async function config () {
  const path = path => new URL(`../src/node_modules/${path}`, `file://${__dirname}`).href.slice(8)
  const html = document.documentElement
  const meta = document.createElement('meta')
	const appleTouch = `<link rel="apple-touch-icon" sizes="180x180" href="./src/node_modules/assets/images/favicon/apple-touch-icon.png">`
	const icon32 = `<link rel="icon" type="image/png" sizes="32x32" href="./src/node_modules/assets/images/favicon/favicon-32x32.png">`
	const icon16 = `<link rel="icon" type="image/png" sizes="16x16" href="./src/node_modules/assets/images/favicon/favicon-16x16.png">`
	const webmanifest = `<link rel="manifest" href="./src/node_modules/assets/images/favicon/site.webmanifest"></link>`
  const font = 'https://fonts.googleapis.com/css?family=Nunito:300,400,700,900|Slackey&display=swap'
	const loadFont = `<link href=${font} rel='stylesheet' type='text/css'>`
	html.setAttribute('lang', 'en')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', 'width=device-width,initial-scale=1.0')
  // @TODO: use font api and cache to avoid re-downloading the font data every time
  document.head.append(meta)
  document.head.innerHTML += appleTouch + icon16 + icon32 + webmanifest + loadFont
	document.adoptedStyleSheets = [sheet]
  await document.fonts.ready // @TODO: investigate why there is a FOUC
}
/******************************************************************************
  PAGE BOOT
******************************************************************************/
async function boot (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const on = {
    theme: inject,
    ...sdb.admin
  }
  const send = io(id, 'page', on)

  const subs = await sdb.watch(onbatch)

  const status = {}
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.body
  const shopts = { mode: 'closed' }
  const shadow = el.attachShadow(shopts)
	shadow.adoptedStyleSheets = [sheet]
  // ----------------------------------------
  // ELEMENTS
  // ----------------------------------------
  { // desktop
    shadow.append(await app(subs[0]))
  }
  // ----------------------------------------
  // INIT
  // ----------------------------------------

  return

  function onbatch(batch){
    for (const {type, data} of batch) {
      on[type] && on[type](data)
    }
  }
}
async function inject (data){
	sheet.replaceSync(data.join('\n'))
}


function fallback_module () { 
	return {
    _: { "app": { $: '', 0: override_app } },
    drive: {
      'theme/': {
        'style.css': {
          raw: `body { font-family: 'system-ui'; }`,
        }
      }, 'lang/': {}
    }
  }
  function override_app ([app]) {
    const data = app()
    data._.head.$._['foo>nav'].$._.menu[0] = ([menu, nav$menu]) => {
      const data = menu()
      // console.log(nav$menu([menu]))
      data.drive['lang/']['en-us.json'].raw = {
        links: ['custom', 'menu'],
        title: 'Custom'
      }
      return data
    }
    return data
  }
}