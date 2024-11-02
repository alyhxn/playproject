/******************************************************************************
  STATE
******************************************************************************/
const STATE = require('STATE')
const name = 'index'
const statedb = STATE(__filename)
const shopts = { mode: 'closed' }
// ----------------------------------------
const { sdb, subs: [get], sub_modules } = statedb(fallback)
function fallback () { 
  return {
    0: {
      subs: [2, 3]
    },
    2: {
      type: "theme_widget"
    },
    3: {
      type: "topnav"
    },
    1: {
      subs: [4, 5],
      inputs: ["index.css"]
    },
    "index.css": {
      $ref: new URL('src/node_modules/css/default/index.css', location).href
    },
    4: {
      type: 2
    },
    5: {
      type: 3,
      fallback: {0: fallback_topnav}
    }
  } 
}
  function fallback_topnav (data) {
    data['topnav.json'].data.links.push({
      "id": "index",
      "text": "Index",
      "url": "index"
    })
    return data
  }
/******************************************************************************
  MAKE_PAGE COMPONENT
******************************************************************************/
const IO = require('io')
const modules = {
 [sub_modules['theme_widget']] : require('theme_widget'),
 [sub_modules['topnav']] : require('topnav'),
//  header : require('header'),
//  datdot : require('datdot'),
//  editor : require('editor'),
//  smartcontract_codes : require('smartcontract_codes'),
//  supporters : require('supporters'),
//  our_contributors : require('our_contributors'),
//  footer : require('footer'),
}
module.exports = index

async function index (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const { id, sdb } = await get(opts.sid) // hub is "parent's" io "id" to send/receive messages
  const on = {
    jump,
    css: inject,
  }
  
  const send = await IO(id, name, on)
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.createElement('div')
  const shadow = el.attachShadow(shopts)
  shadow.innerHTML = `
  <div id="top" class='wrap'></div>
  <style></style>`
  const style = shadow.querySelector('style')
  const main = shadow.querySelector('div')

  const subs = await sdb.watch(onbatch)
  
  console.log(subs, modules)
  main.append(...await Promise.all(
    subs.map(async ({sid, type}) => {
      const el = document.createElement('div')
      el.name = type
      const shadow = el.attachShadow(shopts)
      shadow.append(await modules[type]({ sid, hub: [id] }))
      return el
  })))
  return el
  
  function onbatch(batch) {
    for (const {type, data} of batch) {
      on[type](data)
    }  
  }
  async function jump ({ data }) {
    main.querySelector('#'+data).scrollIntoView({ behavior: 'smooth'})
  }
  async function inject (data){
    style.innerHTML = data.join('\n')
  }
}

