const STATE = require('STATE')
const statedb = STATE(__filename)
statedb.admin()
const { sdb, id } = statedb(defaults)
const { drive } = sdb
const net = require('net_helper')
const DOCS = require('DOCS')
const docs_admin = DOCS(__filename)().admin

const topnav = require('topnav')
const header = require('header')
const footer = require('footer')
const theme_widget = require('theme_widget')
// site sections, in page order
const sections = { topnav, header, footer }

module.exports = app

async function app () {
  const on = {
    style: inject,
    devkit: show_devkit
  }
  const el = document.createElement('div')
  const shadow = el.attachShadow({ mode: 'closed' })
  shadow.innerHTML = `
  <div class="wrap site"></div>
  <aside class="devkit"></aside>
  <button class="devkit-toggle">devkit</button>`
  const sheet = new CSSStyleSheet()
  shadow.adoptedStyleSheets = [sheet]
  document.adoptedStyleSheets = [sheet]
  const site = shadow.querySelector('.site')
  const devkit = shadow.querySelector('.devkit')
  const toggle = shadow.querySelector('.devkit-toggle')
  toggle.onclick = ontoggle_click
  const status = { devkit_open: false }

  const { io, _ } = net(id)
  io.on = { theme_widget: io_theme_widget() }
  for (const name of Object.keys(sections)) io.on[name] = io_section(name)

  const subs = await sdb.watch(onbatch)

  for (const [name, make] of Object.entries(sections)) {
    const sub = find_sub(name)
    if (!sub) { console.error(`app: no sub found for "${name}"`); continue }
    site.append(await make({ ...sub }, io.invite(name, { app: id })))
  }
  const devkit_sub = find_sub('theme_widget')
  if (devkit_sub) devkit.append(await theme_widget({ ...devkit_sub }, io.invite('theme_widget', { up: id })))
  else console.error('app: no sub found for "theme_widget", devkit will not render')

  return el

  // subs are found by type, not by position, so a different order from STATE can't mix them up
  function find_sub (name) { return subs.find(sub => sub.type && sub.type.endsWith(`>${name}`)) }

  async function onbatch (batch) {
    for (const { type, paths } of batch) {
      const data = await Promise.all(paths.map(path => drive.get(path).then(file => file.raw)))
      const func = on[type] || fail
      func(data, type)
    }
  }
  function fail (data, type) { console.warn('app: invalid batch', { cause: { data, type } }) }
  function inject (data) { sheet.replaceSync(data.join('\n')) }
  function show_devkit ([state]) {
    const { open } = typeof state === 'string' ? JSON.parse(state) : state
    status.devkit_open = open
    el.classList.toggle('devkit-open', open)
    toggle.textContent = open ? 'close devkit' : 'devkit'
  }
  function ontoggle_click () {
    drive.put('devkit/state.json', { open: !status.devkit_open })
  }

  function io_section (name) {
    return function onmessage_from_section (msg) {
      const handlers = { jump }
      const handler = handlers[msg.type] || fail_message
      handler(msg)
    }
  }
  function jump (msg) {
    const { to } = msg.data
    if (to === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!sections[to]) return console.info(`app: section "${to}" is not on the page yet`)
    _[to]('scroll', { cause: msg.head })
  }

  function io_theme_widget () {
    return function onmessage_from_devkit (msg) {
      const handlers = {
        set_docs_mode: msg => docs_admin.set_docs_mode(msg.data.active),
        set_doc_display_handler: msg => docs_admin.set_doc_display_handler(msg.data.callback),
        focused_app_changed: send_actions
      }
      const handler = handlers[msg.type] || fail_message
      handler(msg)
    }
  }
  function send_actions (msg) {
    const actions = get_actions(msg.data.sid)
    const refs = { cause: msg.head }
    _.theme_widget('update_actions_for_app', refs, actions)
    _.theme_widget('update_quick_actions_for_app', refs, actions)
    _.theme_widget('update_steps_wizard_for_app', refs, actions)
  }
  // DOCS throws for a sid without registered actions (DOCS/index.js:45), the site sections have none yet
  function get_actions (sid) {
    try { return docs_admin.get_actions(sid) } catch (e) { return [] }
  }
  function fail_message (msg) { console.warn('app: unhandled message', msg) }
}

function defaults () {
  const section = {
    $: '',
    0: '',
    mapping: { style: 'style', content: 'content' }
  }
  const devkit_datasets = [
    'commands', 'icons', 'scroll', 'actions', 'hardcons', 'files', 'highlight',
    'active_tab', 'entries', 'runtime', 'mode', 'flags', 'keybinds', 'undo',
    'focused', 'temp_actions', 'temp_quick_actions', 'prefs', 'variables',
    'data', 'docs_style', 'docs'
  ]
  const mapping = { style: 'style' }
  const drive = {
    'style/': {
      'demo.css': { $ref: 'node_modules/css/default/demo.css' },
      'app.css': { $ref: 'node_modules/css/default/app.css' },
      'devkit.css': { $ref: 'node_modules/css/default/devkit.css' }
    },
    'content/': {},
    // tabs inside devkit maps a "count" dataset up to the root
    'count/': {},
    'devkit/': {
      'state.json': { raw: { open: true } }
    }
  }
  for (const name of devkit_datasets) {
    mapping[name] = name
    drive[`${name}/`] = {}
  }
  return {
    _: {
      net_helper: 0,
      DOCS: 0,
      topnav: section,
      header: section,
      footer: section,
      theme_widget: { $: '', 0: '', mapping }
    },
    drive
  }
}
