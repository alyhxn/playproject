(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){

// ------------------------------------------
// Rellax.js
// Buttery smooth parallax library
// Copyright (c) 2016 Moe Amaya (@moeamaya)
// MIT license
//
// Thanks to Paraxify.js and Jaime Cabllero
// for parallax concepts
// ------------------------------------------

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.Rellax = factory();
  }
}(typeof window !== "undefined" ? window : global, function () {
  var Rellax = function(el, options){
    "use strict";

    var self = Object.create(Rellax.prototype);

    var posY = 0;
    var screenY = 0;
    var posX = 0;
    var screenX = 0;
    var blocks = [];
    var pause = true;

    // check what requestAnimationFrame to use, and if
    // it's not supported, use the onscroll event
    var loop = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      function(callback){ return setTimeout(callback, 1000 / 60); };

    // store the id for later use
    var loopId = null;

    // Test via a getter in the options object to see if the passive property is accessed
    var supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function() {
          supportsPassive = true;
        }
      });
      window.addEventListener("testPassive", null, opts);
      window.removeEventListener("testPassive", null, opts);
    } catch (e) {}

    // check what cancelAnimation method to use
    var clearLoop = window.cancelAnimationFrame || window.mozCancelAnimationFrame || clearTimeout;

    // check which transform property to use
    var transformProp = window.transformProp || (function(){
        var testEl = document.createElement('div');
        if (testEl.style.transform === null) {
          var vendors = ['Webkit', 'Moz', 'ms'];
          for (var vendor in vendors) {
            if (testEl.style[ vendors[vendor] + 'Transform' ] !== undefined) {
              return vendors[vendor] + 'Transform';
            }
          }
        }
        return 'transform';
      })();

    // Default Settings
    self.options = {
      speed: -2,
	    verticalSpeed: null,
	    horizontalSpeed: null,
      breakpoints: [576, 768, 1201],
      center: false,
      wrapper: null,
      relativeToWrapper: false,
      round: true,
      vertical: true,
      horizontal: false,
      verticalScrollAxis: "y",
      horizontalScrollAxis: "x",
      callback: function() {},
    };

    // User defined options (might have more in the future)
    if (options){
      Object.keys(options).forEach(function(key){
        self.options[key] = options[key];
      });
    }

    function validateCustomBreakpoints () {
      if (self.options.breakpoints.length === 3 && Array.isArray(self.options.breakpoints)) {
        var isAscending = true;
        var isNumerical = true;
        var lastVal;
        self.options.breakpoints.forEach(function (i) {
          if (typeof i !== 'number') isNumerical = false;
          if (lastVal !== null) {
            if (i < lastVal) isAscending = false;
          }
          lastVal = i;
        });
        if (isAscending && isNumerical) return;
      }
      // revert defaults if set incorrectly
      self.options.breakpoints = [576, 768, 1201];
      console.warn("Rellax: You must pass an array of 3 numbers in ascending order to the breakpoints option. Defaults reverted");
    }

    if (options && options.breakpoints) {
      validateCustomBreakpoints();
    }

    // By default, rellax class
    if (!el) {
      el = '.rellax';
    }

    // check if el is a className or a node
    var elements = typeof el === 'string' ? document.querySelectorAll(el) : [el];

    // Now query selector
    if (elements.length > 0) {
      self.elems = elements;
    }

    // The elements don't exist
    else {
      console.warn("Rellax: The elements you're trying to select don't exist.");
      return;
    }

    // Has a wrapper and it exists
    if (self.options.wrapper) {
      if (!self.options.wrapper.nodeType) {
        var wrapper = document.querySelector(self.options.wrapper);

        if (wrapper) {
          self.options.wrapper = wrapper;
        } else {
          console.warn("Rellax: The wrapper you're trying to use doesn't exist.");
          return;
        }
      }
    }

    // set a placeholder for the current breakpoint
    var currentBreakpoint;

    // helper to determine current breakpoint
    var getCurrentBreakpoint = function (w) {
      var bp = self.options.breakpoints;
      if (w < bp[0]) return 'xs';
      if (w >= bp[0] && w < bp[1]) return 'sm';
      if (w >= bp[1] && w < bp[2]) return 'md';
      return 'lg';
    };

    // Get and cache initial position of all elements
    var cacheBlocks = function() {
      for (var i = 0; i < self.elems.length; i++){
        var block = createBlock(self.elems[i]);
        blocks.push(block);
      }
    };


    // Let's kick this script off
    // Build array for cached element values
    var init = function() {
      for (var i = 0; i < blocks.length; i++){
        self.elems[i].style.cssText = blocks[i].style;
      }

      blocks = [];

      screenY = window.innerHeight;
      screenX = window.innerWidth;
      currentBreakpoint = getCurrentBreakpoint(screenX);

      setPosition();

      cacheBlocks();

      animate();

      // If paused, unpause and set listener for window resizing events
      if (pause) {
        window.addEventListener('resize', init);
        pause = false;
        // Start the loop
        update();
      }
    };

    // We want to cache the parallax blocks'
    // values: base, top, height, speed
    // el: is dom object, return: el cache values
    var createBlock = function(el) {
      var dataPercentage = el.getAttribute( 'data-rellax-percentage' );
      var dataSpeed = el.getAttribute( 'data-rellax-speed' );
      var dataXsSpeed = el.getAttribute( 'data-rellax-xs-speed' );
      var dataMobileSpeed = el.getAttribute( 'data-rellax-mobile-speed' );
      var dataTabletSpeed = el.getAttribute( 'data-rellax-tablet-speed' );
      var dataDesktopSpeed = el.getAttribute( 'data-rellax-desktop-speed' );
      var dataVerticalSpeed = el.getAttribute('data-rellax-vertical-speed');
      var dataHorizontalSpeed = el.getAttribute('data-rellax-horizontal-speed');
      var dataVericalScrollAxis = el.getAttribute('data-rellax-vertical-scroll-axis');
      var dataHorizontalScrollAxis = el.getAttribute('data-rellax-horizontal-scroll-axis');
      var dataZindex = el.getAttribute( 'data-rellax-zindex' ) || 0;
      var dataMin = el.getAttribute( 'data-rellax-min' );
      var dataMax = el.getAttribute( 'data-rellax-max' );
      var dataMinX = el.getAttribute('data-rellax-min-x');
      var dataMaxX = el.getAttribute('data-rellax-max-x');
      var dataMinY = el.getAttribute('data-rellax-min-y');
      var dataMaxY = el.getAttribute('data-rellax-max-y');
      var mapBreakpoints;
      var breakpoints = true;

      if (!dataXsSpeed && !dataMobileSpeed && !dataTabletSpeed && !dataDesktopSpeed) {
        breakpoints = false;
      } else {
        mapBreakpoints = {
          'xs': dataXsSpeed,
          'sm': dataMobileSpeed,
          'md': dataTabletSpeed,
          'lg': dataDesktopSpeed
        };
      }

      // initializing at scrollY = 0 (top of browser), scrollX = 0 (left of browser)
      // ensures elements are positioned based on HTML layout.
      //
      // If the element has the percentage attribute, the posY and posX needs to be
      // the current scroll position's value, so that the elements are still positioned based on HTML layout
      var wrapperPosY = self.options.wrapper ? self.options.wrapper.scrollTop : (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
      // If the option relativeToWrapper is true, use the wrappers offset to top, subtracted from the current page scroll.
      if (self.options.relativeToWrapper) {
        var scrollPosY = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
        wrapperPosY = scrollPosY - self.options.wrapper.offsetTop;
      }
      var posY = self.options.vertical ? ( dataPercentage || self.options.center ? wrapperPosY : 0 ) : 0;
      var posX = self.options.horizontal ? ( dataPercentage || self.options.center ? self.options.wrapper ? self.options.wrapper.scrollLeft : (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft) : 0 ) : 0;

      var blockTop = posY + el.getBoundingClientRect().top;
      var blockHeight = el.clientHeight || el.offsetHeight || el.scrollHeight;

      var blockLeft = posX + el.getBoundingClientRect().left;
      var blockWidth = el.clientWidth || el.offsetWidth || el.scrollWidth;

      // apparently parallax equation everyone uses
      var percentageY = dataPercentage ? dataPercentage : (posY - blockTop + screenY) / (blockHeight + screenY);
      var percentageX = dataPercentage ? dataPercentage : (posX - blockLeft + screenX) / (blockWidth + screenX);
      if(self.options.center){ percentageX = 0.5; percentageY = 0.5; }

      // Optional individual block speed as data attr, otherwise global speed
      var speed = (breakpoints && mapBreakpoints[currentBreakpoint] !== null) ? Number(mapBreakpoints[currentBreakpoint]) : (dataSpeed ? dataSpeed : self.options.speed);
      var verticalSpeed = dataVerticalSpeed ? dataVerticalSpeed : self.options.verticalSpeed;
      var horizontalSpeed = dataHorizontalSpeed ? dataHorizontalSpeed : self.options.horizontalSpeed;

      // Optional individual block movement axis direction as data attr, otherwise gobal movement direction
      var verticalScrollAxis = dataVericalScrollAxis ? dataVericalScrollAxis : self.options.verticalScrollAxis;
      var horizontalScrollAxis = dataHorizontalScrollAxis ? dataHorizontalScrollAxis : self.options.horizontalScrollAxis;

      var bases = updatePosition(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed);

      // ~~Store non-translate3d transforms~~
      // Store inline styles and extract transforms
      var style = el.style.cssText;
      var transform = '';

      // Check if there's an inline styled transform
      var searchResult = /transform\s*:/i.exec(style);
      if (searchResult) {
        // Get the index of the transform
        var index = searchResult.index;

        // Trim the style to the transform point and get the following semi-colon index
        var trimmedStyle = style.slice(index);
        var delimiter = trimmedStyle.indexOf(';');

        // Remove "transform" string and save the attribute
        if (delimiter) {
          transform = " " + trimmedStyle.slice(11, delimiter).replace(/\s/g,'');
        } else {
          transform = " " + trimmedStyle.slice(11).replace(/\s/g,'');
        }
      }

      return {
        baseX: bases.x,
        baseY: bases.y,
        top: blockTop,
        left: blockLeft,
        height: blockHeight,
        width: blockWidth,
        speed: speed,
        verticalSpeed: verticalSpeed,
        horizontalSpeed: horizontalSpeed,
        verticalScrollAxis: verticalScrollAxis,
        horizontalScrollAxis: horizontalScrollAxis,
        style: style,
        transform: transform,
        zindex: dataZindex,
        min: dataMin,
        max: dataMax,
        minX: dataMinX,
        maxX: dataMaxX,
        minY: dataMinY,
        maxY: dataMaxY
      };
    };

    // set scroll position (posY, posX)
    // side effect method is not ideal, but okay for now
    // returns true if the scroll changed, false if nothing happened
    var setPosition = function() {
      var oldY = posY;
      var oldX = posX;

      posY = self.options.wrapper ? self.options.wrapper.scrollTop : (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
      posX = self.options.wrapper ? self.options.wrapper.scrollLeft : (document.documentElement || document.body.parentNode || document.body).scrollLeft || window.pageXOffset;
      // If option relativeToWrapper is true, use relative wrapper value instead.
      if (self.options.relativeToWrapper) {
        var scrollPosY = (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
        posY = scrollPosY - self.options.wrapper.offsetTop;
      }


      if (oldY != posY && self.options.vertical) {
        // scroll changed, return true
        return true;
      }

      if (oldX != posX && self.options.horizontal) {
        // scroll changed, return true
        return true;
      }

      // scroll did not change
      return false;
    };

    // Ahh a pure function, gets new transform value
    // based on scrollPosition and speed
    // Allow for decimal pixel values
    var updatePosition = function(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed) {
      var result = {};
      var valueX = ((horizontalSpeed ? horizontalSpeed : speed) * (100 * (1 - percentageX)));
      var valueY = ((verticalSpeed ? verticalSpeed : speed) * (100 * (1 - percentageY)));

      result.x = self.options.round ? Math.round(valueX) : Math.round(valueX * 100) / 100;
      result.y = self.options.round ? Math.round(valueY) : Math.round(valueY * 100) / 100;

      return result;
    };

    // Remove event listeners and loop again
    var deferredUpdate = function() {
      window.removeEventListener('resize', deferredUpdate);
      window.removeEventListener('orientationchange', deferredUpdate);
      (self.options.wrapper ? self.options.wrapper : window).removeEventListener('scroll', deferredUpdate);
      (self.options.wrapper ? self.options.wrapper : document).removeEventListener('touchmove', deferredUpdate);

      // loop again
      loopId = loop(update);
    };

    // Loop
    var update = function() {
      if (setPosition() && pause === false) {
        animate();

        // loop again
        loopId = loop(update);
      } else {
        loopId = null;

        // Don't animate until we get a position updating event
        window.addEventListener('resize', deferredUpdate);
        window.addEventListener('orientationchange', deferredUpdate);
        (self.options.wrapper ? self.options.wrapper : window).addEventListener('scroll', deferredUpdate, supportsPassive ? { passive: true } : false);
        (self.options.wrapper ? self.options.wrapper : document).addEventListener('touchmove', deferredUpdate, supportsPassive ? { passive: true } : false);
      }
    };

    // Transform3d on parallax element
    var animate = function() {
      var positions;
      for (var i = 0; i < self.elems.length; i++){
        // Determine relevant movement directions
        var verticalScrollAxis = blocks[i].verticalScrollAxis.toLowerCase();
        var horizontalScrollAxis = blocks[i].horizontalScrollAxis.toLowerCase();
        var verticalScrollX = verticalScrollAxis.indexOf("x") != -1 ? posY : 0;
        var verticalScrollY = verticalScrollAxis.indexOf("y") != -1 ? posY : 0;
        var horizontalScrollX = horizontalScrollAxis.indexOf("x") != -1 ? posX : 0;
        var horizontalScrollY = horizontalScrollAxis.indexOf("y") != -1 ? posX : 0;

        var percentageY = ((verticalScrollY + horizontalScrollY - blocks[i].top + screenY) / (blocks[i].height + screenY));
        var percentageX = ((verticalScrollX + horizontalScrollX - blocks[i].left + screenX) / (blocks[i].width + screenX));

        // Subtracting initialize value, so element stays in same spot as HTML
        positions = updatePosition(percentageX, percentageY, blocks[i].speed, blocks[i].verticalSpeed, blocks[i].horizontalSpeed);
        var positionY = positions.y - blocks[i].baseY;
        var positionX = positions.x - blocks[i].baseX;

        // The next two "if" blocks go like this:
        // Check if a limit is defined (first "min", then "max");
        // Check if we need to change the Y or the X
        // (Currently working only if just one of the axes is enabled)
        // Then, check if the new position is inside the allowed limit
        // If so, use new position. If not, set position to limit.

        // Check if a min limit is defined
        if (blocks[i].min !== null) {
          if (self.options.vertical && !self.options.horizontal) {
            positionY = positionY <= blocks[i].min ? blocks[i].min : positionY;
          }
          if (self.options.horizontal && !self.options.vertical) {
            positionX = positionX <= blocks[i].min ? blocks[i].min : positionX;
          }
        }

        // Check if directional min limits are defined
        if (blocks[i].minY != null) {
            positionY = positionY <= blocks[i].minY ? blocks[i].minY : positionY;
        }
        if (blocks[i].minX != null) {
            positionX = positionX <= blocks[i].minX ? blocks[i].minX : positionX;
        }

        // Check if a max limit is defined
        if (blocks[i].max !== null) {
          if (self.options.vertical && !self.options.horizontal) {
            positionY = positionY >= blocks[i].max ? blocks[i].max : positionY;
          }
          if (self.options.horizontal && !self.options.vertical) {
            positionX = positionX >= blocks[i].max ? blocks[i].max : positionX;
          }
        }

        // Check if directional max limits are defined
        if (blocks[i].maxY != null) {
            positionY = positionY >= blocks[i].maxY ? blocks[i].maxY : positionY;
        }
        if (blocks[i].maxX != null) {
            positionX = positionX >= blocks[i].maxX ? blocks[i].maxX : positionX;
        }

        var zindex = blocks[i].zindex;

        // Move that element
        // (Set the new translation and append initial inline transforms.)
        var translate = 'translate3d(' + (self.options.horizontal ? positionX : '0') + 'px,' + (self.options.vertical ? positionY : '0') + 'px,' + zindex + 'px) ' + blocks[i].transform;
        self.elems[i].style[transformProp] = translate;
      }
      self.options.callback(positions);
    };

    self.destroy = function() {
      for (var i = 0; i < self.elems.length; i++){
        self.elems[i].style.cssText = blocks[i].style;
      }

      // Remove resize event listener if not pause, and pause
      if (!pause) {
        window.removeEventListener('resize', init);
        pause = true;
      }

      // Clear the animation loop to prevent possible memory leak
      clearLoop(loopId);
      loopId = null;
    };

    // Init
    init();

    // Allow to recalculate the initial values whenever we want
    self.refresh = init;

    return self;
  };
  return Rellax;
}));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
module.exports={
  "comp": "index",
  "admins": [
    "theme_editor"
  ],
  "sub": {
    "theme_widget" : [],
    "topnav" : [],
    "header" : [],
    "datdot" : [],
    "editor" : [],
    "smartcontract_codes" : [],
    "supporters" : [],
    "our_contributors" : [],
    "footer" : []
  }
}
},{}],3:[function(require,module,exports){
const IO = require('io')
const default_data = require('./data.json')
const modules = {
 theme_widget : require('theme_widget'),
 topnav : require('topnav'),
 header : require('header'),
 datdot : require('datdot'),
 editor : require('editor'),
 smartcontract_codes : require('smartcontract_codes'),
 supporters : require('supporters'),
 our_contributors : require('our_contributors'),
 footer : require('footer'),
}
const statedb = require('STATE')
/******************************************************************************
  MAKE_PAGE COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------

module.exports = make_page

async function make_page(opts, lang) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const name = 'index'
  const on = {
    jump,
    inject,
    inject_all,
  }
  const sdb = statedb()
  let data = sdb.get(opts.sid)
  if(!data){
    const {id, sid} = sdb.add({...default_data})
    opts.sid = sid
    data = {...default_data, id}
  }
  const admin = sdb.req_access(opts.sid)
  admin.set_admins(data.admins)
  const {send, css_id} = await IO({ id: data.id, name, type: 'comp', comp: name }, on)
  // ----------------------------------------
  // OPTS
  // ----------------------------------------
  switch(lang) {
    case 'zh-tw':
    case 'ja':
    case 'th':
    case 'fr':
      var path = `./src/node_modules/lang/${lang}.json`
      break
    default:
      var path = `./src/node_modules/lang/en-us.json`
  }
  const {theme} = opts
  
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.createElement('div')
  const shadow = el.attachShadow(shopts)
  shadow.innerHTML = `
  <div id="top" class='wrap'>
  </div>`
  const main = shadow.querySelector('div')

  main.append(...await Promise.all(
    Object.entries(data.sub).map(async ([name, sids]) => {
      console.log(name, sids)
      const el = document.createElement('div')
      el.name = name
      const shadow = el.attachShadow(shopts)
      shadow.append(await modules[name]({ sid: sids[0], hub: [css_id] }))
      return el
  })))
  init_css()
  return el
  
  async function jump ({ data }) {
    main.querySelector('#'+data).scrollIntoView({ behavior: 'smooth'})
  }
  async function init_css () {
    const pref = JSON.parse(localStorage.pref || '{}')
    const pref_shared = pref[name] || data.shared || [{ id: name }]
    const pref_uniq = pref[css_id] || data.uniq || []
    pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
    pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
  }
  async function inject_all ({ data }) {
    const sheet = new CSSStyleSheet
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets.push(sheet)
  }
  async function inject ({ data }){
    const style = document.createElement('style')
    style.innerHTML = data
    shadow.append(style)
  }
  async function get_theme ({local = true, theme = 'default', id}) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
    else
      theme_css = JSON.parse(localStorage[theme])[id]
    return theme_css
  }
}


},{"./data.json":2,"STATE":4,"datdot":12,"editor":14,"footer":16,"header":22,"io":23,"our_contributors":27,"smartcontract_codes":29,"supporters":31,"theme_widget":35,"topnav":37}],4:[function(require,module,exports){
// STATE.js
const localdb = require('localdb')
const db = localdb()

Object.assign(STATE, { init })
const s2i = {}
const i2s = {}
var admins = [0]

module.exports = STATE

async function init (url) {
  if (!STATE.init) throw new Error('already initialized')
  STATE.init = undefined
  Object.freeze(STATE)
  let data = db.read(['state'])
  if(!data){
    const resp = await fetch(url)
    data = resp.ok && await (resp).json()
    db.add(['state'], data || {})
  }
  const length = db.length(['state'])
  for (var id = 0; id < length; id++) s2i[i2s[id] = Symbol(id)] = id
  return i2s[0]
  async function reset () {
    await db.clear()
  }
}

function STATE () {
  const sdb = { get, add, req_access }
  const deny = {}
  return sdb

  function symbolfy (data) {
    data?.sub && Object.entries(data.sub).forEach(assign)
    return data

    function assign([comp, ids]){
      if(typeof(ids) === 'object'){
        data.sub[comp] = []
        ids.forEach(id => {
          data.sub[comp].push(i2s[id])
          deny[i2s[id]] = true
        })
      }
      else{
        data.sub[comp] = i2s[ids]
        deny[i2s[ids]] = true
      }
    }
  }
  function get (sid) {
    if (deny[sid]) throw new Error('access denied')
    return symbolfy(db.read(['state', s2i[sid]]))
  }
  function add (opts, hub) {
    const id = db.length(['state'])
    s2i[i2s[id] = Symbol(id)] = id
    opts.sub = {}
    opts.id = id
    db.add(['state', id], opts)
    if(hub){
      if(!db.read(['state', hub, 'sub', opts.comp]))
        db.add(['state', hub, 'sub', opts.comp], [])
      db.push(['state', hub, 'sub', opts.comp], id)
    }
    return {id, sid: i2s[id]}
  }
  function req_access(sid) {
    if (deny[sid]) throw new Error('access denied')
    const el = db.read(['state', s2i[sid]])
  console.log(s2i, sid)
    if(admins.includes(s2i[sid]) || admins.includes(el?.comp))
      return { xget, set_admins }
  }
  function xget(id) {
    return db.read(['state', id])
  }
  async function set_admins(ids) {
    admins = ids
  }
}
},{"localdb":25}],5:[function(require,module,exports){
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  CONTENT COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = content

async function content (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'content'
    const status = {}
    const on = {
      inject,
      inject_all,
      scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const style = document.createElement('style')
    el.classList.add('content')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
    <div class="main">
        <h2 class="subTitle subTitleColor">${data.title}</h2>
        <article class=article>${data.article}</article>
        ${data.url ? `<a class="button buttonBg" href=${data.url} target="_blank">${data.action}</a>` : ''}
    </div>
    `
    shadow.append(style)
    
    init_css()
    return el

    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name] || data.shared || [{ id: name }]
      const pref_uniq = pref[css_id] || data.uniq || []
      pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
      pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
    }
    async function scroll () {
      el.scrollIntoView({behavior: 'smooth'})
      el.tabIndex = '0'
      el.focus()
      el.onblur = () => {
        el.tabIndex = '-1'
        el.onblur = null
      }
    }
    async function inject_all ({ data }) {
      const sheet = new CSSStyleSheet
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets.push(sheet)
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', id}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
      else
        theme_css = JSON.parse(localStorage[theme])[id]
      return theme_css
    }
}

},{"./data.json":6,"STATE":4,"io":23}],6:[function(require,module,exports){
module.exports={
  "comp": "content",
  "title": "Play Editor",
  "article": "Web based IDE with interactive UI generator for easy writing, deploying and interacting with Solidity smart contracts.",
  "action": "Learn more",
  "url": "https://smartcontract-codes.github.io/play-ed/"
}
},{}],7:[function(require,module,exports){
const Graphic = require('graphic')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  CONTRIBUTOR COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = contributor

async function contributor (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'contributor'
    const status = {}
    const lifeIsland = await Graphic('lifeIsland','./src/node_modules/assets/svg/life-island.svg')
    const on = {
      inject,
      inject_all,
      scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name: data.name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
      <div>
        <div class='member'>
          <img class='avatar' src=${data.avatar} alt=${data.name}>
          <div class='info'>
            <h3 class='name'>${data.name}</h3>
            ${data.careers &&
                data.careers.map( career =>
                    `<span class='career'>${career}</span>`
                )
            }
          </div>
        </div>
        ${lifeIsland.outerHTML}
      </div>
    `
    init_css()
    return el

    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name] || data.shared || [{ id: name + '.css' }]
      const pref_uniq = pref[css_id] || data.uniq || []
      pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
      pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
    }
    async function scroll () {
      el.scrollIntoView({behavior: 'smooth'})
      el.tabIndex = '0'
      el.focus()
      el.onblur = () => {
        el.tabIndex = '-1'
        el.onblur = null
      }
    }
    async function inject_all ({ data }) {
      const sheet = new CSSStyleSheet
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets.push(...shadow.adoptedStyleSheets, sheet)
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', id}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}`)).text()
      else
        theme_css = JSON.parse(localStorage[theme])[id]
      return theme_css
    }
}



},{"./data.json":8,"STATE":4,"graphic":20,"io":23}],8:[function(require,module,exports){
module.exports={
  "name": "Nina",
  "comp": "contributor",
  "careers": ["Decentralized tech"],
  "contact": {
    "twitter": "",
    "github": "",
    "website": ""
  },
  "css": [{ "id": "contributor.css"}, { "id": "contributor_1.css" }],
  "avatar": "./src/node_modules/assets/images/avatar-nina.png"  
}
},{}],9:[function(require,module,exports){
const IO = require('io')
const graphic = require('graphic')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  CRYSTAL ISLAND COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = crystal_island

async function crystal_island(opts) {
    // {date, info}, deco, island, title)
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'crystal_island'
    const status = {}
    const on = {
      inject,
      inject_all,
      scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    const paths = {
      island: './src/node_modules/assets/svg/floating-island3.svg',
      tree: './src/node_modules/assets/svg/big-tree.svg',
      tree1: './src/node_modules/assets/svg/single-tree1.svg',
      tree2: './src/node_modules/assets/svg/single-tree2.svg',
      tree3: './src/node_modules/assets/svg/single-tree3.svg',
      yellowCrystal: './src/node_modules/assets/svg/crystal-yellow.svg',
      purpleCrystal: './src/node_modules/assets/svg/crystal-purple.svg',
      blueCrystal: './src/node_modules/assets/svg/crystal-blue.svg',
      stone: './src/node_modules/assets/svg/stone1.svg',
      card: './src/node_modules/assets/svg/card2.svg'
    }
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    // el.classList.add('scene')
    shadow.innerHTML = `
        <div class='deco'>
            <div class='content'>
                <h3>${data.date}</h3>
                ${ data.info === 'Coming soon' ? `<h3>${data.info}</h3>` : `<p>${data.info}</p>` }
            </div>
            ${data.title || ''}
        </div>
    `
    // ----------------------------------------
    const deco_el = shadow.querySelector('.deco')
    shadow.append(await graphic('island', paths['island']))
    deco_el.append(...await Promise.all(data.deco.map(async v => await graphic(v.includes('tree') ? 'tree' : v, paths[v]))))
    init_css()
    return el

    async function init_css () {
        const pref = JSON.parse(localStorage.pref)
        const pref_shared = pref[name] || data.shared || [{ id: name }]
        const pref_uniq = pref[css_id] || data.uniq || []
        pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
        pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
      }
      async function scroll () {
        el.scrollIntoView({behavior: 'smooth'})
        el.tabIndex = '0'
        el.focus()
        el.onblur = () => {
          el.tabIndex = '-1'
          el.onblur = null
        }
      }
      async function inject_all ({ data }) {
        const sheet = new CSSStyleSheet
        sheet.replaceSync(data)
        shadow.adoptedStyleSheets.push(sheet)
      }
      async function inject ({ data }){
        const style = document.createElement('style')
        style.innerHTML = data
        shadow.append(style)
      }
      async function get_theme ({local = true, theme = 'default', id}) {
        let theme_css
        if(local)
          theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
        else
          theme_css = JSON.parse(localStorage[theme])[id]
        return theme_css
      }
}


},{"./data.json":10,"STATE":4,"graphic":20,"io":23}],10:[function(require,module,exports){
module.exports={
  "comp": "crystal_island",
  "date": "2018",
  "info": "$48.000 / Ethereum Foundation",
  "deco" : ["stone", "card", "tree1"]
}
},{}],11:[function(require,module,exports){
module.exports={
  "comp": "datdot",
  "logo": "",
  "image": ""
}
},{}],12:[function(require,module,exports){
const graphic = require('graphic')
const Rellax = require('rellax')
const content = require('content')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  DATDOT COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = datdot

async function datdot (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'datdot'
    const status = {}
    const on = {
      inject,
      inject_all,
      scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    var graphics = [
      graphic('blockchainIsland', './src/node_modules/assets/svg/blockchian-island.svg'),
      graphic('blossomIsland', './src/node_modules/assets/svg/blossom-island.svg'),
      graphic('cloud1', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud2', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud3', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud4', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud5', './src/node_modules/assets/svg/cloud.svg'),
    ]

    const [blockchainIsland, blossomIsland, cloud1, cloud2, cloud3, cloud4, cloud5] = await Promise.all(graphics)
    // Parallax effects
    let cloud1Rellax = new Rellax( cloud1, { speed: 4})
    let cloud2Rellax = new Rellax( cloud2, { speed: 2})
    let cloud3Rellax = new Rellax( cloud3, { speed: 5})
    let cloud4Rellax = new Rellax( cloud4, { speed: 2})
    let cloud5Rellax = new Rellax( cloud5, { speed: 4})
    
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
    <section id="datdot" class="section">
    </section>
    `
    const main = shadow.querySelector('section')
    main.append(await content({ sid: data.sub?.content?.[0], hub: [css_id] }), blockchainIsland, blossomIsland, cloud1, cloud2, cloud3, cloud4, cloud5)
    
    init_css()
    return el

    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name] || data.shared || [{ id: name }]
      const pref_uniq = pref[css_id] || data.uniq || []
      pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
      pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
    }
    async function scroll () {
      el.scrollIntoView({behavior: 'smooth'})
      el.tabIndex = '0'
      el.focus()
      el.onblur = () => {
        el.tabIndex = '-1'
        el.onblur = null
      }
    }
    async function inject_all ({ data }) {
      const sheet = new CSSStyleSheet
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets.push(sheet)
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', id}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
      else
        theme_css = JSON.parse(localStorage[theme])[id]
      return theme_css
    }
}
},{"./data.json":11,"STATE":4,"content":5,"graphic":20,"io":23,"rellax":1}],13:[function(require,module,exports){
module.exports={
  "comp": "editor",
  "logo": "https://smartcontract-codes.github.io/play-ed/assets/logo.png",
  "image": "./src/node_modules/assets/images/smart-contract-ui.jpg"  
}
},{}],14:[function(require,module,exports){
const graphic = require('graphic')
const Rellax = require('rellax')
const Content = require('content')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  EDITOR COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = editor

async function editor (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'editor'
    const status = {}
    const on = {
        inject,
        inject_all,
        scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    const graphics = [
      graphic('island', './src/node_modules/assets/svg/floating-island.svg'),
      graphic('energyIsland', './src/node_modules/assets/svg/energy-island.svg'),
      graphic('tree', './src/node_modules/assets/svg/single-tree.svg'),
      graphic('stone', './src/node_modules/assets/svg/stone.svg'),
      graphic('cloud1', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud2', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud3', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud4', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud5', './src/node_modules/assets/svg/cloud.svg'),
    ]

    const [island, energyIsland, tree, stone, cloud1, cloud2, cloud3, cloud4, cloud5] = await Promise.all(graphics)

    // Parallax effects
    let cloud1Rellax = new Rellax( cloud1, { speed: 2})
    let cloud2Rellax = new Rellax( cloud2, { speed: 3})
    let cloud3Rellax = new Rellax( cloud3, { speed: 4})
    let cloud4Rellax = new Rellax( cloud4, { speed: 4})
    let cloud5Rellax = new Rellax( cloud5, { speed: 3})

    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
    <section id="smartcontractUI" class='section'>
        <div class='scene'>
            <div class='objects'>
                <img class='logo' src=${data.logo} alt="${data.title} logo">
                <img class='screenshot' src=${data.image} alt=${data.title}>
                <div class='deco'>
                    ${stone.outerHTML}
                    ${tree.outerHTML}
                </div>
            </div>
            ${island.outerHTML}
        </div>
    </section>
    `
    // ----------------------------------------
    const main = shadow.querySelector('section')
    main.append(energyIsland, cloud1, cloud2, cloud3, cloud4, cloud5)
    main.prepend(await Content({ sid: data.sub?.content?.[0], hub: [css_id] }))
    
    init_css()
    return el

  async function init_css () {
    const pref = JSON.parse(localStorage.pref)
    const pref_shared = pref[name] || data.shared || [{ id: name }]
    const pref_uniq = pref[css_id] || data.uniq || []
    pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
    pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
  }
  async function scroll () {
    el.scrollIntoView({behavior: 'smooth'})
    el.tabIndex = '0'
    el.focus()
    el.onblur = () => {
      el.tabIndex = '-1'
      el.onblur = null
    }
  }
  async function inject_all ({ data }) {
    const sheet = new CSSStyleSheet
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets.push(sheet)
  }
  async function inject ({ data }){
    const style = document.createElement('style')
    style.innerHTML = data
    shadow.append(style)
  }
  async function get_theme ({local = true, theme = 'default', id}) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
    else
      theme_css = JSON.parse(localStorage[theme])[id]
    return theme_css
  }
}

},{"./data.json":13,"STATE":4,"content":5,"graphic":20,"io":23,"rellax":1}],15:[function(require,module,exports){
module.exports={
  "comp": "footer",
  "copyright": " PlayProject",
  "icons": [
    {
      "id": "1",
      "name": "email",
      "imgURL": "./src/node_modules/assets/svg/email.svg",
      "url": "mailto:ninabreznik@gmail.com"
    },
    {
      "id": "2",
      "name": "twitter",
      "imgURL": "./src/node_modules/assets/svg/twitter.svg",
      "url": "https://twitter.com/playproject_io"
    },
    {
      "id": "3",
      "name": "Github",
      "imgURL": "./src/node_modules/assets/svg/github.svg",
      "url": "https://github.com/playproject-io"
    },
    {
      "id": "4",
      "name": "Gitter",
      "imgURL": "./src/node_modules/assets/svg/gitter.svg",
      "url": "https://gitter.im/playproject-io/community"
    }
  ]
}
},{}],16:[function(require,module,exports){
const graphic = require('graphic')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  APP FOOTER COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = footer

async function footer (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'footer'
    const status = {}
    const on = {
        inject,
        inject_all,
        scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    let island = await graphic('island', './src/node_modules/assets/svg/deco-island.svg')
    const graphics = data.icons.map(icon => graphic('icon', icon.imgURL))
    const icons = await Promise.all(graphics)
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
    <footer class='footer'>
        <div class='scene'>
            ${island.outerHTML}
            <nav class='contacts'>
                ${data.icons.map((icon, i) => 
                    `<a href=${icon.url} 
                    title=${icon.name} 
                    target="${icon.url.includes('http') ? "_blank" : null}"
                    >${icons[i].outerHTML}</a>`
                )}
            </nav>
        </div>
        
        <p class='copyright'>${new Date().getFullYear()+' '+data.copyright}</p>
    </footer>
    `
    
    init_css()
    return el

    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name] || data.shared || [{ id: name }]
      const pref_uniq = pref[css_id] || data.uniq || []
      pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
      pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
    }
    async function scroll () {
      el.scrollIntoView({behavior: 'smooth'})
      el.tabIndex = '0'
      el.focus()
      el.onblur = () => {
        el.tabIndex = '-1'
        el.onblur = null
      }
    }
    async function inject_all ({ data }) {
      const sheet = new CSSStyleSheet
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets.push(sheet)
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', id}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
      else
        theme_css = JSON.parse(localStorage[theme])[id]
      return theme_css
    }
}

},{"./data.json":15,"STATE":4,"graphic":20,"io":23}],17:[function(require,module,exports){
module.exports={
  "comp": "graph_explorer"
}
},{}],18:[function(require,module,exports){
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
const {copy, get_color, download_json} = require('helper')
/******************************************************************************
  GRAPH COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------

module.exports = graph_explorer

async function graph_explorer (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const name = 'graph_explorer'
  const hub_id = opts.hub[0]
  const status = { tab_id: 0, count: 0, entry_types: {}, menu_ids: [] }
  const on = {
    init,
    inject,
    inject_all,
    scroll
  }
  const on_add = {
    entry: add_entry,
    menu: add_action
  }
	const sdb = statedb()
	let main_data = sdb.get(opts.sid)
  if(!main_data){
    const {id} = sdb.add(default_data, opts.hub)
    main_data = {...default_data, id}
  }
  const {send, css_id} = await IO({id: main_data.id, name, type: 'comp', comp: name, hub: opts.hub, css: main_data.css}, on)
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.createElement('div')
  const shadow = el.attachShadow(shopts)
  shadow.innerHTML = `
  <main>

  </main>
  `
  const main = shadow.querySelector('main')
  shadow.addEventListener('copy', oncopy)

  init_css()
  return el

  /******************************************
   Mix
  ******************************************/
  async function oncopy(e) {
    const selection = shadow.getSelection()
    e.clipboardData.setData('text/plain', copy(selection))
    e.preventDefault()
  }
  async function init ({ data }) {
    let id = Object.keys(data).length

    add({ id, name: 'edit', type: 'action', hub: [] })
    add({ id, name: 'link', type: 'action', hub: [] })
    add({ id, name: 'unlink', type: 'action', hub: [] })
    add({ id, name: 'drop', type: 'action', hub: [] })

    status.graph = data
    const root_nodes = Object.values(data).filter(node => !node.hub)
    root_nodes.forEach((data, i) => add_entry({hub_el: main, data, last: i === root_nodes.length - 1, ancestry:[] }))
    function add (args){
      status.menu_ids.push(args.id)
      data[id++] = args
    }
  }
  function html_template (data, space, pos){
    const element = document.createElement('div')
    element.classList.add(data.type, 'node', 'a'+data.id)
    element.tabIndex = '0'
    element.dataset.space = space
    element.dataset.pos = pos
    return element
  }
  /******************************************
   Addition Operation
  ******************************************/
  // function add_el ({ data, parent, space, grand_last, type }){
  //   const is_single = parent.children.length ? false : true
  //   if(data.root){
  //     parent.prepend(add_root({ data, last: false}))
  //     return
  //   }
  //   //hub or sub node check
  //   if(type === 'inputs')
  //     parent.append(on_add[type]({ data, space, grand_last, first: is_single}))
  //   else
  //     parent.prepend(on_add[type]({ data, space, grand_last, last: is_single}))
  // }

  function add_action ({ hub_el, data, last, space = '' }) {
    const element = html_template(data, last, space)
    hub_el.append(element)
    !status.entry_types[data.type] && (status.entry_types[data.type] = Object.keys(status.entry_types).length)

    element.innerHTML = `
    <div class="details">
      <span class="odd">${space}</span>
      <span class="type_emo odd"></span>
      <span class="name odd">${data.name}</span>
    </div>
    `
    const name = element.querySelector('.details > .name')
    name.onclick = () => send({ type: 'click', to: hub_id, data })

  }
  //A button with 4 slots for sub nodes, data entity
  function add_entry ({ hub_el, data, first, last, space = '', pos, ancestry }) {
    //Init
    const element = html_template(data, last, space, pos)
    !status.entry_types[data.type] && (status.entry_types[data.type] = Object.keys(status.entry_types).length)
    ancestry = [...ancestry]
    let lo_space = space + (last ? '&emsp;&nbsp;' : '│&nbsp;&nbsp;')
    let hi_space = space + (first ? '&emsp;&nbsp;' : '│&nbsp;&nbsp;')
    const space_handle = [], els = []
    let slot_no = 0, slot_on

    //HTML
    element.innerHTML = `
      <div class="nodes hi_row">${space}${first ? '&nbsp;' : '│'}</div>
      <div class="details">
        <span class="space odd"><!--
        -->${space}<span>${last ? '└' : first ? "┌" : '├'}</span><!--
        --><span class='on'>${last ? '┗' : first ? "┏" : '┠'}</span>
        </span><!--
        --><span class="menu_emo"></span><!--
        --><span class="type_emo odd"></span><!--
        --><span class="name odd">${data.name}</span>
      </div>
      <div class="nodes lo_row">${space}${last ? '&nbsp;' : '│'}</div>
      <div class="menu nodes"></div>
    `

    //Unavoidable mix
    const copies = main.querySelectorAll('.a'+data.id + '> .details')
    if(copies.length > 1){
      const color = get_color()
      copies.forEach(copy => copy.style.backgroundColor = color)
    }
    if(ancestry.includes(data.id))
      return
    ancestry.push(data.id)

    //Elements
    const details = element.querySelector('.details')
    const name = element.querySelector('.details > .name')
    const menu_emo = element.querySelector('.details > .menu_emo')
    const type_emo = element.querySelector('.details > .type_emo')
    const menu = element.querySelector('.menu')
    const hi_row = element.querySelector('.hi_row')
    const lo_row = element.querySelector('.lo_row')

    //Listeners
    type_emo.onclick = type_click
    name.onclick = () => send({ type: 'click', to: hub_id, data })
    hub_el.append(element)
    data.slot.forEach(handle_slot)
    menu_click({el: menu, emo: menu_emo, data: status.menu_ids, pos: 0, type: 'menu'})
    if(getComputedStyle(type_emo, '::before').content === 'none')
      type_emo.innerHTML = `[${status.entry_types[data.type]}]`

    //Procedures
    async function handle_slot (pair, i) {
      const slot_check = [false, false]
      const slot_emo = document.createElement('span')
      slot_emo.innerHTML = '<span></span><span>─</span>'
      menu_emo.before(slot_emo)
      slot_no++
      
      pair.forEach((x, j) => {
        let gap, mode, emo_on, temp
        const pos = !j
        const count = status.count++
        const el = document.createElement('div')
        const emo = document.createElement('span')
        const style = document.createElement('style')
        
        el.classList.add('nodes')
        element.append(style)
        if(pos){
          hi_row.before(el)
          hi_row.append(emo)
          mode= 'hi'
          gap = hi_space
          hi_space += `<span class="space${count}"><span class="hi">&nbsp;</span>${x ? '<span class="xhi">│</span>' : ''}&nbsp;&nbsp;</span>`
          temp = `<span class="space${count}"><span class="hi">&nbsp;</span><span class="xhi">│</span></span>`
        }
        else{
          menu.after(el)
          lo_row.append(emo)
          mode = 'lo'
          gap = lo_space
          lo_space += `<span class="space${count}"><span class="lo">&nbsp;</span>${x ? '<span class="xlo">│</span>' : ''}&nbsp;&nbsp;</span>`
          temp = `<span class="space${count}"><span class="lo">&nbsp;</span><span class="xlo">│</span></span>`
        }
        style.innerHTML = `.space${count} > .x${mode}{display: none;}`
        els.push(slot_emo)
        space_handle.push(() => style.innerHTML = `.space${count}${slot_on ? ` > .x${mode}` : ''}{display: none;}`)
        if(!x){
          const space = document.createElement('span')
          space.innerHTML = '&nbsp;&nbsp;&nbsp;'
          j ? lo_row.append(space) : hi_row.append(space)
          return
        }
        slot_emo.classList.add(x)
        emo.classList.add(mode+'_emo')
        emo.innerHTML = temp

        emo.onclick = () => {
          emo.classList.toggle('on')
          slot_emo.classList.add('on')
          style.innerHTML = `.space${count} > .${emo_on ? 'x' : ''}${mode}{display: none;}`
          emo_on && space_handle[i]()
          slot_check[j] = emo_on = !emo_on
          if(slot_check[0] && slot_check[1])
            slot_emo.children[1].innerHTML = '┼'
          else if(slot_check[0] && !slot_check[1])
            slot_emo.children[1].innerHTML = '┴'
          else if(!slot_check[0] && slot_check[1])
            slot_emo.children[1].innerHTML = '┬'
          else{
            slot_emo.children[1].innerHTML = '─'
            slot_emo.classList.remove('on')
          }
          handle_click({space: gap, pos, el, data: data[x], ancestry })
        }
      })
      if(getComputedStyle(slot_emo, '::before').content === 'none')
        slot_emo.innerHTML = `<span>${slot_no}</span><span>─</span>`
    }
    async function type_click() {
      slot_on = !slot_on
      if(status.xentry && status.xentry !== type_emo)
        status.xentry.click()
      status.xentry = type_emo
      details.classList.toggle('on')
      hi_row.classList.toggle('show')
      lo_row.classList.toggle('show')
      let temp = element
      while(temp.tagName !== 'MAIN'){
        if(temp.classList.contains('node')){
          slot_on ? temp.classList.add('on') : temp.classList.remove('on')
          while(temp.previousElementSibling){
            temp = temp.previousElementSibling
            slot_on ? temp.classList.add('on') : temp.classList.remove('on')
          }
        }
        temp = temp.parentElement
      }
      els.forEach((emo, i) => {
        if(!emo.classList.contains('on')){
          space_handle[i]()
        }
      })
    }
    async function menu_click({ emo, emo_on, ...rest }, i) {
      emo.onclick = () => {
        emo.classList.toggle('on')
        emo_on = !emo_on
        handle_click({space: lo_space, ...rest })
      }
    }
  }
  // async function add_node_data (name, type, parent_id, users, author){
  //   const node_id = status.graph.length
  //   status.graph.push({ id: node_id, name, type: state.code_words[type], room: {}, users })
  //   if(parent_id){
  //     save_msg({
  //         head: [id],
  //         type: 'save_msg',
  //         data: {username: 'system', content: author + ' added ' + type.slice(0,-1)+': '+name, chat_id: parent_id}
  //       })
  //     //Add a message in the chat
  //     if(state.chat_task && parent_id === state.chat_task.id.slice(1))
  //       channel_up.send({
  //         head: [id, channel_up.send.id, channel_up.mid++],
  //         type: 'render_msg',
  //         data: {username: 'system', content: author+' added '+type.slice(0,-1)+': '+name}
  //       })
  //     const sub_nodes = graph[parent_id][state.add_words[type]]
  //     sub_nodes ? sub_nodes.push(node_id) : graph[parent_id][state.add_words[type]] = [node_id]
  //   }
  //   else{
  //     graph[node_id].root = true
  //     graph[node_id].users = [opts.host]
  //   }
  //   save_msg({
  //     head: [id],
  //     type: 'save_msg',
  //     data: {username: 'system', content: author + ' created ' + type.slice(0,-1)+': '+name, chat_id: node_id}
  //   })
  //   const channel = state.net[state.aka.taskdb]
  //   channel.send({
  //     head: [id, channel.send.id, channel.mid++],
  //     type: 'set',
  //     data: graph
  //   })
    
  // }
  // async function on_add_node (data) {
  //   const node = data.id ? shadow.querySelector('#a' + data.id + ' > .'+data.type) : main
  //   node && node.children.length && add_el({ data: { name: data.name, id: status.graph.length, type: state.code_words[data.type] }, parent: node, grand_last: data.grand_last, type: data.type, space: data.space })
  //   add_node_data(data.name, data.type, data.id, data.users, data.user)
  // }
  /******************************************
   Event handlers
  ******************************************/
  function handle_focus (e) {
    state.xtask = e.target
    state.xtask.classList.add('focus')
    state.xtask.addEventListener('blur', e => {
      if(e.relatedTarget && e.relatedTarget.classList.contains('noblur'))
        return
      state.xtask.classList.remove('focus')
      state.xtask = undefined
    }, { once: true })
  }
  function handle_popup (e) {
    const el = e.target
    el.classList.add('show')
    popup.style.top = el.offsetTop - 20 + 'px'
    popup.style.left = el.offsetLeft - 56 + 'px'
    popup.focus()
    popup.addEventListener('blur', () => {
      el.classList.remove('show')
    }, { once: true })
  }
  function handle_click ({ el, data, pos, hub_id, type = 'entry', ...rest }) {
    el.classList.toggle('show')
    if(data && el.children.length < 1){
      length = data.length - 1
      data.forEach((value, i) => on_add[type]({ hub_el: el, data: {...status.graph[value], hub_id}, first: pos ? 0 === i : false, last: pos ? false : length === i, pos, ...rest }))
    }
  }
  async function handle_export () {
    const data = await traverse( state.xtask.id.slice(1) )
    download_json(data)
  }
  async function handle_add (data) {
    data = data.slice(2).trim().toLowerCase() + 's'
    const input = document.createElement('input')
    let node, task_id, space = '', grand_last = true, root = true
    //expand other siblings
    if(state.xtask){
      node = state.xtask.querySelector('.' + data)
      task_id = state.xtask.id.slice(1)
      const before = state.xtask.querySelector('.' + data.slice(0,3))
      before.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable: true, view: window}))
      node.classList.add('show')
      grand_last = state.xtask.dataset.grand_last
      space = state.xtask.dataset.space
      state.xtask.classList.remove('focus')
      state.xtask = undefined
      root = false
    }
    else{
      node = main
      task_id = ''
    }
    node.prepend(input)
    input.onkeydown = async (event) => {
      if (event.key === 'Enter') {
        input.blur()
        add_el({ data : { name: input.value, id: status.graph.length, type: state.code_words[data], root }, space, grand_last, type: data, parent: node })
        const users = task_id ? graph[task_id].users : [host]
        add_node_data(input.value, data, task_id, users, host)
        //sync with other users
        if(users.length > 1)
          channel_up.send({
            head: [id, channel_up.send.id, channel_up.mid++],
            type: 'send',
            data: {to: 'task_explorer', route: ['up', 'task_explorer'], users: graph[task_id].users.filter(user => user !== host), type: 'on_add_node', data: {name: input.value, id: task_id, type: data, users, grand_last, space, user: host} }
          })
      }
    }
    input.focus()
    input.onblur = () => input.remove()
  }
  /******************************************
   Tree traversal
  ******************************************/
  async function jump (e){
    let target_id = e.currentTarget.dataset.id
    const el = main.querySelector('#a'+target_id)
    if(el)
      el.focus()
    else{
      const path = []
      let temp
      for(temp = status.graph[target_id]; temp.hub; temp = status.graph[temp.hub[0]])
        path.push(temp.id)
      temp = main.querySelector('#a'+temp.id)
      target_id = 'a'+target_id
      while(temp.id !== target_id){
        const sub_emo = temp.querySelector('.sub_emo')
        sub_emo.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable: true, view: window}))
        temp.classList.add('show')
        temp = temp.querySelector('#a'+path.pop())
      }
      temp.focus()
    }
      
  }
  async function traverse (id) {
    state.result = []
    state.track = []
    recurse(id)
    return state.result
  }
  function recurse (id){
    if(state.track.includes(id))
      return
    state.result.push(graph[id])
    state.track.push(id)
    for(temp = 0; graph[id].sub && temp < graph[id].sub.length; temp++)
      recurse(graph[id].sub[temp])
    for(temp = 0; graph[id].inputs && temp < graph[id].inputs.length; temp++)
      recurse(graph[id].inputs[temp])
    for(temp = 0; graph[id].outputs && temp < graph[id].outputs.length; temp++)
      recurse(graph[id].outputs[temp])
  }
  /******************************************
   Communication
  ******************************************/
  async function init_css () {
    const pref = JSON.parse(localStorage.pref)
    const pref_shared = pref[name] || data.shared || [{ id: name }]
    const pref_uniq = pref[css_id] || data.uniq || []
    pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
    pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
  }
  async function scroll () {
    el.scrollIntoView({behavior: 'smooth'})
    el.tabIndex = '0'
    el.focus()
    el.onblur = () => {
      el.tabIndex = '-1'
      el.onblur = null
    }
  }
  async function inject_all ({ data }) {
    const sheet = new CSSStyleSheet
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets.push(sheet)
  }
  async function inject ({ data }){
    const style = document.createElement('style')
    style.innerHTML = data
    shadow.append(style)
  }
  async function get_theme ({local = true, theme = 'default', id}) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
    else
      theme_css = JSON.parse(localStorage[theme])[id]
    return theme_css
  }
}
},{"./data.json":17,"STATE":4,"helper":19,"io":23}],19:[function(require,module,exports){
function copy (selection) {
  const range = selection.getRangeAt(0)
  const selectedElements = []
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    {
        acceptNode: function(node) {
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        }
    },
    false
  )

  while (walker.nextNode()) {
      walker.currentNode.tagName === 'SPAN' && selectedElements.push(walker.currentNode)
  }
  let text = ''
  selectedElements.forEach(el => {
    const before = getComputedStyle(el, '::before').content
    text += (before === 'none' ? '' : before.slice(1, -1)) + el.textContent
    text += el.classList.contains('name') ? '\n' : ''
  })
  return text
}
function get_color () {
  const letters = 'CDEF89'
  let color = '#'
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)]
  }
  return color;
}
function download_json (data) {
  const json_string = JSON.stringify(data, null, 2);
  const blob = new Blob([json_string], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'data.json';
  link.click();
}
module.exports = {copy, get_color, download_json}
},{}],20:[function(require,module,exports){
const loadSVG = require('loadSVG')

function graphic(className, url) {
  
  return new Promise((resolve, reject) => {
    const el = document.createElement('div')
    el.classList.add(className)
    loadSVG(url, (err, svg) => {
      if (err) return console.error(err)
      el.append(svg)
      resolve(el)
    })
  })
}   

module.exports = graphic
},{"loadSVG":24}],21:[function(require,module,exports){
module.exports={
  "comp": "header",
  "title": "Infrastructure for the next-generation Internet"
}
},{}],22:[function(require,module,exports){
const graphic = require('graphic')
const Rellax = require('rellax')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  HEADER COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = header

async function header (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'header'
    const status = {}
    const on = {
      inject,
      inject_all,
      scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    var graphics = [
      graphic('playIsland', './src/node_modules/assets/svg/play-island.svg'),
      graphic('sun', './src/node_modules/assets/svg/sun.svg'),
      graphic('cloud1', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud2', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud3', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud4', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud5', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud6', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud7', './src/node_modules/assets/svg/cloud.svg'),
    ]

    const [playIsland, sun, cloud1, cloud2, cloud3, cloud4, cloud5, cloud6, cloud7] = await Promise.all(graphics)

		// Parallax effects
		// let playRellax = new Rellax(playIsland, { speed: 2 })
		let sunRellax = new Rellax(sun, { speed: 2 })
		let cloud1Rellax = new Rellax(cloud1, { speed: 4 })
		let cloud2Rellax = new Rellax(cloud2, { speed: 2 })
		let cloud3Rellax = new Rellax(cloud3, { speed: 4 })
		let cloud4Rellax = new Rellax(cloud4, { speed: 2 })
		let cloud5Rellax = new Rellax(cloud5, { speed: 4 })
		let cloud6Rellax = new Rellax(cloud6, { speed: 3 })
		let cloud7Rellax = new Rellax(cloud7, { speed: 3 })
		// ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
		<div class='header'>
				<h1 class='title'>${data.title}</h1>
				<section class='scene'>
						<div class='sunCloud'>
						</div>
				</section>
		</div>
		`
    // ----------------------------------------
		const scene = shadow.querySelector('.scene')
		const sunCloud = shadow.querySelector('.sunCloud')
		scene.append(cloud3, cloud4, cloud5, cloud6, cloud7, playIsland)
		sunCloud.append(cloud1, sun, cloud2)
		
    init_css()
    return el

    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name] || data.shared || [{ id: name }]
      const pref_uniq = pref[css_id] || data.uniq || []
      pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
      pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
    }
    async function scroll () {
      el.scrollIntoView({behavior: 'smooth'})
      el.tabIndex = '0'
      el.focus()
      el.onblur = () => {
        el.tabIndex = '-1'
        el.onblur = null
      }
    }
    async function inject_all ({ data }) {
      const sheet = new CSSStyleSheet
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets.push(sheet)
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', id}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
      else
        theme_css = JSON.parse(localStorage[theme])[id]
      return theme_css
    }
}


},{"./data.json":21,"STATE":4,"graphic":20,"io":23,"rellax":1}],23:[function(require,module,exports){
const ports = {}
const graph = {}
let timer
module.exports = io
async function io(data, on) {
  const on_rx = {
    on: {init}
  }
  const id = data.id || Object.keys(ports).length
  ports[id] = { id, name: data.name, on}
  data.hub && graph[data.hub[0]].sub.push(id)
  graph[id] = { id, ...data, sub: [], slot: [[data.hub && 'hub', 'sub'], ['input']]}
  timer && clearTimeout(timer)
  timer = setTimeout(init, 1000)
  return {send, css_id: id}

  async function send(data) {
    const port = ports[data.to] || ports[await find_id(data.to)] || on_rx
    return port.on[data.type](data)
  }
  async function find_id (name){
    return (Object.values(ports).filter(node => node.name === name)[0] || {id: undefined}).id
  }
  async function init() {
    ports[await find_id('theme_widget')].on['refresh']({ data: graph})
  }
}
},{}],24:[function(require,module,exports){
async function loadSVG (url, done) { 
    const parser = document.createElement('div')
    let response = await fetch(url)
    if (response.status == 200) {
      let svg = await response.text()
      parser.innerHTML = svg
      return done(null, parser.children[0])
    }
    throw new Error(response.status)
}

module.exports = loadSVG
},{}],25:[function(require,module,exports){
/******************************************************************************
  LOCALDB COMPONENT
******************************************************************************/
module.exports = localdb

function localdb () {
  return { add, read, drop, push, length }

  function length (keys) {
    if(keys) {
      data = JSON.parse(localStorage[keys[0]] || '{}')
      let temp = data
      keys.slice(1, -1).forEach(key => {
        temp = temp[key]
      })
      return Object.keys(temp).length
    }
    return Object.keys(localStorage).length
  }
  //for object
  function add (keys, value) {
    let data
    if(keys.length > 1) {
      data = JSON.parse(localStorage[keys[0]])
      let temp = data
      keys.slice(1, -1).forEach(key => {
        temp = temp[key]
      })
      temp[keys.slice(-1)[0]] = value
    }
    else
      data = value
    localStorage[keys[0]] = JSON.stringify(data)
  }
  //for arrays
  function push (keys, value) {
    const data = JSON.parse(localStorage[keys[0]])
    let temp = data
    keys.slice(1).forEach(key => {
      temp = temp[key]
    })
    temp.push(value)
    localStorage[keys[0]] = JSON.stringify(data)
  }
  function read (keys) {
    let data = localStorage[keys[0]] && JSON.parse(localStorage[keys[0]])
    data && keys.slice(1).forEach(key => {
      data = data[key]
    })
    return data
  }
  function drop (keys) {
    if(keys.length > 1){
      const data = JSON.parse(localStorage[keys[0]])
      let temp = data
      keys.slice(1, -1).forEach(key => {
        temp = temp[key]
      })
      if(Array.isArray(temp))
        temp.splice(keys[keys.length - 1], 1)
      else
        delete(temp[keys[keys.length - 1]])
      localStorage[keys[0]] = JSON.stringify(data)
    }
    else
      delete(localStorage[keys[0]])
  }
}
},{}],26:[function(require,module,exports){
module.exports={
  "comp": "our_contributors",
  "sub": {
    "contributor": [
      "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33"
    ]
  }
}
},{}],27:[function(require,module,exports){
const graphic = require('graphic')
const Rellax = require('rellax')
const Content = require('content')
const Contributor = require('contributor')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  OUR CONTRIBUTORS COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = our_contributors

async function our_contributors (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'our_contributors'
    const status = {}
    const on = {
        inject,
        inject_all,
        scroll,
        refresh
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id, sid} = sdb.add(JSON.parse(JSON.stringify(default_data)), opts.hub)
      opts.sid = sid
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    const graphics = [
      graphic('island','./src/node_modules/assets/svg/waterfall-island.svg'),
      graphic('cloud1', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud2', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud3', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud4', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud5', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud6', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud7', './src/node_modules/assets/svg/cloud.svg'),
    ]

    const [island, cloud1, cloud2, cloud3, cloud4, cloud5, cloud6, cloud7] = await Promise.all(graphics)

    let cloud1Rellax = new Rellax( cloud1, { speed: 0.3})
    let cloud2Rellax = new Rellax( cloud2, { speed: 0.4})
    let cloud3Rellax = new Rellax( cloud3, { speed: 0.3})
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    await refresh()
    return el

    async function refresh() {
      const xdata = sdb.get(opts.sid)
      const temp = []
      for (const sid of xdata.sub.contributor || data.sub.contributor){
          temp.push(await Contributor({sid, hub: [css_id]}))
      }
      const contributors = await Promise.all(temp)
      shadow.innerHTML = `
        <section id="ourContributors" class="section">
            <div class='inner'>
            </div>
            <div class='groups'>
            </div>
            ${cloud4.outerHTML}
            ${cloud5.outerHTML}
            ${cloud6.outerHTML}
            ${cloud7.outerHTML}
        </section>
      `
      // ----------------------------------------
      const inner = shadow.querySelector('.inner')
      const groups = shadow.querySelector('.groups')
      const main = shadow.querySelector('section')
      groups.append(...contributors.map(el => el.classList.add('group') || el))
      main.prepend(await Content({ sid: data.sub?.content?.[0], hub: [css_id] }))
      inner.append(island, cloud1, cloud2, cloud3)
      init_css()
    }
    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name] || data.shared || [{ id: name }]
      const pref_uniq = pref[css_id] || data.uniq || []
      pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
      pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
    }
    async function scroll () {
      el.scrollIntoView({behavior: 'smooth'})
      el.tabIndex = '0'
      el.focus()
      el.onblur = () => {
        el.tabIndex = '-1'
        el.onblur = null
      }
    }
    async function inject_all ({ data }) {
      const sheet = new CSSStyleSheet
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets.push(...shadow.adoptedStyleSheets, sheet)
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', id}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
      else
        theme_css = JSON.parse(localStorage[theme])[id]
      return theme_css
    }
}
},{"./data.json":26,"STATE":4,"content":5,"contributor":7,"graphic":20,"io":23,"rellax":1}],28:[function(require,module,exports){
module.exports={
 "comp": "smartcontract_codes",
  "logo": "https://smartcontract.codes/src/assets/images/logo-1.png",
  "image": "./src/node_modules/assets/images/smart-contract-codes.jpg" 
}
},{}],29:[function(require,module,exports){
const graphic = require('graphic')
const Content = require('content')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  SMARTCONTRACT-CODES COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = smartcontract_codes

async function smartcontract_codes (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'smartcontract_codes'
    const status = {}
    const on = {
      inject,
      inject_all,
      scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id} = sdb.add(default_data, opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
  const graphics = [
    graphic('island', './src/node_modules/assets/svg/floating-island1.svg'),
    graphic('islandMiddle', './src/node_modules/assets/svg/floating-island2.svg'),
    graphic('islandRight', './src/node_modules/assets/svg/floating-island2.svg'),
    graphic('blossom', './src/node_modules/assets/svg/blossom-tree.svg'),
    graphic('tree', './src/node_modules/assets/svg/single-tree.svg'),
    graphic('trees', './src/node_modules/assets/svg/two-trees.svg'),
    graphic('stone', './src/node_modules/assets/svg/stone.svg'),
    graphic('smallStone', './src/node_modules/assets/svg/small-stone.svg'),
  ]

    const [island, islandMiddle, islandRight, blossom, tree, trees, stone, smallStone] = await Promise.all(graphics)

    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
    <section id="smartcontractCodes" class='section'>

      <div class='scene'>
          <div class='deco'>
              <img class='logo' src=${data.logo} alt="${data.title} logo">
              <img class='screenshot' src=${data.image} alt=${data.title}>
              ${trees.outerHTML}
          </div>
          ${island.outerHTML}
      </div>
      <div class='sceneMedium'>
          <div class='deco'>
              <div class='container'>
                  ${smallStone.outerHTML}
                  ${stone.outerHTML}
                  ${blossom.outerHTML}
              </div>
              ${islandMiddle.outerHTML}
          </div>
          <div class='deco'>
              ${tree.outerHTML}
              ${islandRight.outerHTML}
          </div>
      </div>
      
  </section>
  `
  const main = shadow.querySelector('section')
  main.prepend(await Content({ sid: data.sub?.content?.[0], hub: [css_id] }))
  
  init_css()
  return el

  async function init_css () {
    const pref = JSON.parse(localStorage.pref)
    const pref_shared = pref[name] || data.shared || [{ id: name }]
    const pref_uniq = pref[css_id] || data.uniq || []
    pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
    pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
  }
  async function scroll () {
    el.scrollIntoView({behavior: 'smooth'})
    el.tabIndex = '0'
    el.focus()
    el.onblur = () => {
      el.tabIndex = '-1'
      el.onblur = null
    }
  }
  async function inject_all ({ data }) {
    const sheet = new CSSStyleSheet
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets.push(sheet)
  }
  async function inject ({ data }){
    const style = document.createElement('style')
    style.innerHTML = data
    shadow.append(style)
  }
  async function get_theme ({local = true, theme = 'default', id}) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
    else
      theme_css = JSON.parse(localStorage[theme])[id]
    return theme_css
  }
}

},{"./data.json":28,"STATE":4,"content":5,"graphic":20,"io":23}],30:[function(require,module,exports){
module.exports={
  "comp": "supporters",
  "title": "Supporters",
  "sub": {
    "crystal_island": [
      1, 2, 3, 4, 5
    ]
  }
}
},{}],31:[function(require,module,exports){
const graphic = require('graphic')
const Rellax = require('rellax')
const crystal_island = require('crystal_island')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  SUPPORTERS COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = supporters

async function supporters (opts) {
  // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'supporters'
    const status = {}
    const on = {
        inject,
        inject_all,
        scroll
    }
    const sdb = statedb()
    let data = sdb.get(opts.sid)
    if(!data){
      const {id, sid} = sdb.add(JSON.parse(JSON.stringify(default_data)), opts.hub)
      data = {...default_data, id}
    }
    const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    let pageTitle = `<div class='title'>${data.title}</div>`
    

    const graphics = [
      graphic('cloud1', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud2', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud3', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud4', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud5', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud6', './src/node_modules/assets/svg/cloud.svg'),
    ]

    const [cloud1, cloud2, cloud3, cloud4, cloud5, cloud6] = await Promise.all(graphics)
    
    // Parallax effects
    let cloud1Rellax = new Rellax( cloud1, { speed: 1.5})
    let cloud2Rellax = new Rellax( cloud2, { speed: 1})
    let cloud3Rellax = new Rellax( cloud3, { speed: 1.5})
    let cloud4Rellax = new Rellax( cloud4, { speed: 4})
    let cloud5Rellax = new Rellax( cloud5, { speed: 1.5})
    let cloud6Rellax = new Rellax( cloud6, { speed: 3})
    
    const scene = []
    console.log(data)
    for (const sid of data.sub.crystal_island){
      scene.push(await crystal_island({sid, hub: [css_id]}))
    }
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.innerHTML = `
        <section id="supporters" class="section">
        </section>
    `
    // ----------------------------------------
    const main = shadow.querySelector('section')
    main.append(...(await Promise.all(scene)).map(v => v), cloud1, cloud2, cloud3, cloud4, cloud5, cloud6)
    
    // port.onmessage = onmessage
    init_css()
    return el

    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name] || data.shared || [{ id: name }]
      const pref_uniq = pref[css_id] || data.uniq || []
      pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
      pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
    }
    async function scroll () {
      el.scrollIntoView({behavior: 'smooth'})
      el.tabIndex = '0'
      el.focus()
      el.onblur = () => {
        el.tabIndex = '-1'
        el.onblur = null
      }
    }
    async function inject_all ({ data }) {
      const sheet = new CSSStyleSheet
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets.push(sheet)
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', id}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
      else
        theme_css = JSON.parse(localStorage[theme])[id]
      return theme_css
    }
}

},{"./data.json":30,"STATE":4,"crystal_island":9,"graphic":20,"io":23,"rellax":1}],32:[function(require,module,exports){
module.exports={
  "comp": "theme_editor",
  "admin": "true"
}
},{}],33:[function(require,module,exports){
const DB = require('localdb')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  THEME_EDITOR COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------

module.exports = theme_editor
async function theme_editor (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const name = 'theme_editor'
  const status = { tab_id: 0 }
  const db = await DB()
  const on = {
    init,
    init_tab,
    hide
  }
	const sdb = statedb()
	let data = sdb.get(opts.sid)
  if(!data){
    const {id, sid} = sdb.add(default_data, opts.hub)
    opts.sid = sid
    data = {...default_data, id}
  }
  const {xget} = sdb.req_access(opts.sid)
  const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
  status.themes = {
    builtin: Object.keys(opts.paths),
    saved: Object.keys(JSON.parse(localStorage.index || (localStorage.index = '{}')))
  }
  const defaults = await(await (fetch('./data.json'))).json()
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.createElement('div')
  const shadow = el.attachShadow(shopts)
  shadow.innerHTML = `
  <main>
    <div class="content">
    </div>
    <div class="relative">
      <input list="themes" class="theme" placeholder='Enter theme' />
      <div id="themes" class="theme"></div>
    </div>
    <button class="load single">
      Load
    </button>
    <button class="inject">
      Inject
    </button>
    <button class="save_file single">
      Save file
    </button>
    <button class="save_pref">
      Save pref
    </button>
    <button class="drop_theme single">
      Drop theme
    </button>
    <button class="drop_file single">
      Drop file
    </button>
    <button class="reset single">
      Reset
    </button>
    <button class="export single">
      Export
    </button>
    <button class="import single">
      Import
    </button>
    <input style="display: none;" class="upload" type='file' />
    <button class="add">
      Add
    </button>
    <h3>
    </h3>
    <div class="tabs">
      <div class="box"></div>
      <span class="plus">+</span>
    </div>
  </main>
  `
  const main = shadow.querySelector('main')
  const inject_btn = shadow.querySelector('.inject')
  const load_btn = shadow.querySelector('.load')
  const save_file_btn = shadow.querySelector('.save_file')
  const save_pref_btn = shadow.querySelector('.save_pref')
  const add_btn = shadow.querySelector('.add')
  const drop_theme_btn = shadow.querySelector('.drop_theme')
  const drop_file_btn = shadow.querySelector('.drop_file')
  const reset_btn = shadow.querySelector('.reset')
  const upload = shadow.querySelector('.upload')
  const import_btn = shadow.querySelector('.import')
  const export_btn = shadow.querySelector('.export')
  const title = shadow.querySelector('h3')
  const content = shadow.querySelector('.content')
  const tabs = shadow.querySelector('.tabs > .box')
  const plus = shadow.querySelector('.plus')
  const select_theme = shadow.querySelector('div.theme')
  const input = shadow.querySelector('input.theme')

  input.onfocus = () => select_theme.classList.add('active')
  input.onblur = () => setTimeout(() => select_theme.classList.remove('active'), 200)
  input.oninput = update_select_theme
  inject_btn.onclick = on_inject
  load_btn.onclick = () => load(input.value, false)
  save_file_btn.onclick = save_file
  save_pref_btn.onclick = save_pref
  add_btn.onclick = () => add(input.value)
  drop_theme_btn.onclick = drop_theme
  drop_file_btn.onclick = drop_file
  export_btn.onclick = export_fn
  import_btn.onclick = () => upload.click()
  upload.onchange = import_fn
  reset_btn.onclick = () => {localStorage.clear(), location.reload()}
  plus.onclick = () => add_tab('New')
  update_select_theme()
  init_css()
  return el

  async function hide () {
    main.classList.toggle('select')
    status.select = !status.select
  }
  async function export_fn () {
    const theme = db.read([ input.value ])
    const index = db.read([ 'index', input.value ])
    const blob = new Blob([JSON.stringify({theme, index}, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = input.value
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  async function import_fn () {
    const file = upload.files[0]
    const name = file.name.split('.')[0]
    await add(name)
    const reader = new FileReader()
    reader.onload = e => {
      const blob = JSON.parse(e.target.result)
      db.add([name], blob.theme)
      db.add(['index', name], blob.index)
      load(name)
    }
    reader.readAsText(file)
  }
  async function add (theme) {
    db.add([theme], [])
    status.themes.saved.push(theme)
    db.add(['index', theme], [])
    update_select_theme()
  }
  async function drop_theme () {
    db.drop([input.value])
    db.drop(['index', input.value])
    status.themes.saved = status.themes.saved.filter(v => v != input.value)
    update_select_theme()
    input.value = 'default'
    load('default')
  }
  async function drop_file () {
    db.drop([status.active_tab.dataset.theme, status.active_tab.dataset.id])
    db.drop(['index', status.active_tab.dataset.theme, status.active_tab.dataset.id])
    close_tab(status.active_tab)
  }
  async function forget_changes () {
    status.active_el.classList.remove('dirty')
    const dirt = JSON.parse(localStorage.dirt)
    delete(dirt[status.title])
    localStorage.dirt = JSON.stringify(dirt)
  }
  async function save_file () {
    // forget_changes()
    if(db.read([input.value])){
      db.push(['index', input.value], status.active_tab.dataset.name)
      db.push([input.value], status.textarea.value)
    }
  }
  async function save_pref () {
    const pref = db.read(['pref'])
    if(status.select){
      var ids = await get_select()
      ids.forEach(id => pref[id] = [])
    }
    pref[status.instance_id] = []
    pref[status.title] = []
    Array.from(tabs.children).forEach(tab => {
      if(tab.dataset.access === "uniq"){
        if(ids)
          ids.forEach(id => 
          pref[id].push({theme: tab.dataset.theme, id: tab.dataset.id, local: status.themes.builtin.includes(tab.dataset.theme)})
        )
        else
          pref[status.instance_id].push({theme: tab.dataset.theme, id: tab.dataset.id, local: status.themes.builtin.includes(tab.dataset.theme)})
      }
      else
        pref[status.title].push({theme: tab.dataset.theme, id: tab.dataset.id, local: status.themes.builtin.includes(tab.dataset.theme) })
    })
    db.add(['pref'], pref)
  }
  async function unsave () {
    status.active_el.classList.add('dirty')
    let theme = localStorage[input.value] && JSON.parse(localStorage[input.value])
    if(theme){
      theme.css[status.title] = textarea.value
      localStorage[input.value] = JSON.stringify(theme)
      const dirt = JSON.parse(localStorage.dirt)
      dirt[status.title] = input.value
      localStorage.dirt = JSON.stringify(dirt)
    }
    else{
      const name = input.value + '*'
      theme = localStorage[name] && JSON.parse(localStorage[name])
      if(theme){
        theme.css[status.title] = textarea.value
        localStorage[name] = JSON.stringify(theme)
        const dirt = JSON.parse(localStorage.dirt)
        dirt[status.title] = name
        localStorage.dirt = JSON.stringify(dirt)
      }
      else{
        theme = { theme: true, css: {} }
        theme.css[status.title] = textarea.value
        localStorage[name] = JSON.stringify(theme)
        status.themes.saved.push(name)
        const dirt = JSON.parse(localStorage.dirt)
        dirt[status.title] = name
        localStorage.dirt = JSON.stringify(dirt)
        update_select_theme()
        input.value = name
      }
    }
  }
  async function on_inject () {
    if(status.active_tab.dataset.type === 'json'){
      const id = add_data(status.textarea.value)
      const hub = xget(xget(id).hub).id
      send({type: 'refresh', to: hub})
    }
    else{
      if(status.select){
        const ids = await get_select()
        ids.forEach(id => {
          send({ type: 'inject', to: id, data: status.textarea.value })
        })
      }
      else
        send({ type: 'inject', to: status.node_data.hub_id, data: status.textarea.value })
    }
  }
  async function get_select () {
    return await send({ type: 'get_select', to: 'theme_widget'})
  }
  async function load (theme, clear = true) {
    if(clear){
      content.innerHTML = ''
      tabs.innerHTML = ''
    }
    if(status.themes.builtin.includes(theme)){
      const index = opts.paths[theme].length
      for(let i = 0; i < index; i++){
        const temp = await fetch(`./src/node_modules/css/${theme}/${i}.css`)
        add_tab(i, await temp.text(), '', theme, status.title)
      }
    }
    else{
      const temp = db.read([theme])
      temp.forEach((file, i) => {
          add_tab(i, file, '', theme, status.title)
      })
    }
    // forget_changes()
  }
  async function init ({ data }) {
    title.innerHTML = data.id
    status.title = data.type
    status.instance_id = data.id
    add_tab(data.name, JSON.stringify(xget(data.hub[0]), null, 2),  '.json')
  }
  async function init_css_tab ({id, comp, uniq, shared}) {
    const pref = db.read(['pref'])
    const pref_shared = pref[comp] || shared || [{ id: comp }]
    const pref_uniq = pref[id] || uniq || []
    await Promise.all(pref_shared.map(async v => await add_tab(v.id, await get_css(v), 'shared', v.theme)))
    await Promise.all(pref_uniq.map(async v => await add_tab(v.id, await get_css(v), 'uniq', v.theme)))
  }
  async function add_tab (id, css = '', ext = '', access = 'uniq', theme = 'default') {
    if(id === 'New' && status.themes.builtin.includes(theme)){
      theme += '*'
      add(theme)
    }
    const tab = document.createElement('span')
    const tab_id = '_' + status.tab_id++
    tab.id = tab_id
    const index = opts.paths[theme] || db.read(['index', theme])
    tabs.append(tab)
    const btn = document.createElement('span')
    btn.innerHTML = index[id] || id
    btn.innerHTML += ext
    tab.dataset.id = id
    tab.dataset.name = btn.innerHTML
    tab.dataset.theme = theme
    tab.dataset.access = access
    tab.dataset.ext = ext
    btn.onclick = () => switch_tab(tab.id)
    btn.ondblclick = rename
    const btn_x = document.createElement('span')
    btn_x.innerHTML = 'x'
    tab.append(btn, btn_x)
    tab.tabIndex = '0'
    tab.onkeydown = e => {
      if(e.key === 'ArrowRight' && tab.nextElementSibling)
        tab.nextElementSibling.after(tab)
      else if(e.key === 'ArrowLeft' && tab.previousElementSibling)
        tab.previousElementSibling.before(tab)
      tab.focus()
    }
    const textarea = document.createElement('textarea')
    textarea.value = css
    textarea.id = tab_id
    content.append(textarea)
    btn_x.onclick = () => close_tab(tab)
    switch_tab(tab_id)
  }
  async function close_tab (tab) {
    content.querySelector('#' + tab.id).remove()
    tab.remove()
    if(tabs.children.length)
      switch_tab(tabs.children[tabs.children.length - 1].id)
    else
      add_tab('New')
  }
  async function switch_tab (tab_id) {
    status.textarea && status.textarea.classList.remove('active')
    status.textarea = content.querySelector('#' + tab_id)
    status.textarea.classList.add('active')
    status.active_tab && status.active_tab.classList.remove('active')
    status.active_tab = tabs.querySelector('#' + tab_id)
    status.active_tab.classList.add('active')
    status.active_tab.focus()
    input.value = status.active_tab.dataset.theme
  }
  async function init_tab({ data }) {
    status.node_data = data
    add_tab(data.id, await get_css(data), '', '', data.theme)
  }
  async function get_css ({ local = true, theme = 'default', id }) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}`)).text()
    else
      theme_css = db.read([theme, id])
    return theme_css
  }
  async function rename (e) {
    const btn = e.target
    const hub = btn.parentElement
    const input = document.createElement('input')
    input.value = btn.innerHTML
    btn.innerHTML = ''
    btn.append(input)
    input.onkeydown = e => {
      if(e.key === 'Enter'){
        btn.innerHTML = input.value
        db.add([hub.dataset.theme, hub.dataset.id], input.value)
      }
    }
    input.onblur = e => {
      if(e.relatedTarget)
        btn.innerHTML = hub.dataset.name
    }
    input.focus()
  }
  async function update_select_theme () {
    const builtin = document.createElement('div')
    builtin.classList.add('cat')
    status.themes.builtin.forEach(theme => {
      const el = document.createElement('div')
      el.innerHTML = theme
      el.onclick = () => input.value = theme
      theme.includes(input.value) && builtin.append(el)
    })
    builtin.innerHTML && builtin.insertAdjacentHTML('afterbegin', '<b>builtin</b>')
    const saved = document.createElement('div')
    saved.classList.add('cat')
    status.themes.saved.forEach(theme => {
      const el = document.createElement('div')
      el.innerHTML = theme
      el.onclick = () => input.value = theme
      theme.includes(input.value) && saved.append(el)
    })
    saved.innerHTML && saved.insertAdjacentHTML('afterbegin', '<b>saved</b>')
    select_theme.innerHTML = ''
    select_theme.append(builtin, saved)
  }
  async function init_css () {
    const pref = db.read(['pref'])
    const pref_shared = pref[name] || data.shared || [{ id: name }]
    const pref_uniq = pref[css_id] || data.uniq || []
    pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
    pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
  }
  async function inject_all ({ data }) {
    const sheet = new CSSStyleSheet
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets.push(sheet)
  }
  async function inject ({ data }){
    const style = document.createElement('style')
    style.innerHTML = data
    shadow.append(style)
  }
  async function get_theme ({local = true, theme = 'default', id}) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
    else
      theme_css = db.read([theme, id])
    return theme_css
  }
}

},{"./data.json":32,"STATE":4,"io":23,"localdb":25}],34:[function(require,module,exports){
module.exports={
  "id": "1",
  "comp": "theme_widget",
  "admin": "true"
}
},{}],35:[function(require,module,exports){
const theme_editor = require('theme_editor')
const graph_explorer = require('graph_explorer')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  THEME_WIDGET COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------

module.exports = theme_widget

async function theme_widget (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const name = 'theme_widget'
  const status = { tab_id: 0, init_check: true }
  const on = {
    refresh,
    get_select,
    inject,
    inject_all,
    scroll,
    click
  }
	const sdb = statedb()
	let data = sdb.get(opts.sid)
  if(!data){
    const {id} = sdb.add(default_data, opts.hub)
    data = {...default_data, id}
  }
  const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
  
  status.dirts = JSON.parse(localStorage.dirt || (localStorage.dirt = '{}'))
  localStorage.pref || (localStorage.pref = '{}')
  const paths =  JSON.parse(await(await fetch('./src/node_modules/css/index.json')).text())
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.createElement('div')
  const shadow = el.attachShadow(shopts)
  shadow.innerHTML = `
  <section>
    <div class="btn">
      ⚙️
    </div>
    <div class="popup">
      <div class="box">
        <span class="stats">
          Entries: 
        </span>
        <button class="select">Select</button>
        <input min="0" max="100" value="75" type="range"/>
      </div>
      <div class="editor">
      </div>
    </div>
  </section>`
  const btn = shadow.querySelector('.btn')
  const popup = shadow.querySelector('.popup')
  const box = popup.querySelector('.box')
  const list = box.querySelector('.list')
  const editor = popup.querySelector('.editor')
  const stats = box.querySelector('.stats')
  const select = box.querySelector('.select')
  const slider = box.querySelector('input')

  editor.append(await theme_editor({ sid: data.sub?.theme_editor?.[0], hub: [css_id], paths }))
  box.prepend(await graph_explorer({ sid: data.sub?.graph_explorer?.[0], hub: [css_id] }))
  select.onclick = on_select
  slider.oninput = blur
  init_css()
  return el

  async function blur(e) {
    popup.style.opacity = e.target.value/100
  }
  async function on_select () {
    list.classList.toggle('active')
    send({to: 'theme_editor', type: 'hide'})
  }
  async function get_select () {
    const inputs = list.querySelectorAll('input')
    const output = []
    inputs.forEach(el => el.checked && output.push(el.nextElementSibling.id))
    send({type: 'send', to: 'theme_editor', data: output})
  }
  async function refresh ({ data }) {
    let id = Object.keys(data).length
    const themes_id = id++
    data[themes_id] = {id: themes_id, name: 'themes', type: 'themes', sub: [], slot: [['', 'sub']]}
    Object.entries(paths).forEach(entry => {
      const theme_id = id
      data[id] = {id, name: entry[0], hubx: [themes_id], type: 'theme', subx: [], inpx: [], outx: [], slot: [['hubx', 'subx'],['inpx', 'outx']]}
      data[themes_id].sub.push(id++)
      entry[1].forEach(name => {
        data[id] = {id, name, type: 'css', local: true, hub: [theme_id], slot: [['hub']]}
        data[theme_id].inpx.push(id)
        data[theme_id].outx.push(id)
        data[theme_id].subx.push(id++)
      })
    })
    Object.entries(JSON.parse(localStorage.index)).forEach(entry => {
      const theme_id = id
      data[id] = {id, name: entry[0], hub: [themes_id], type: 'theme', sub: [], slot: [['hub', 'sub']]}
      data[themes_id].sub.push(id++)
      entry[1].forEach(name => {
        data[id] = {id, name, type: 'css', hub: [theme_id], slot: [['hub']]}
        data[theme_id].sub.push(id++)
      })
    })
    status.tree = data
    const data_id = id++
    data[data_id] = {id: data_id, name: 'data', type: 'data', sub: [], slot: [['', 'sub']]}
    Object.values(data).forEach(node => {
      if(node.type === 'comp'){
        node.input = []
        const css = node.css || [{id: node.comp + '.css'}]
        css.forEach(async file => {
          node.input.push(await find_id(file.id, 'css'))
        })
        data[id] = {id, name: node.comp + '.json', type: 'json', hub: [node.id], slot: [['hub']]}
        data[data_id].sub.push(id)
        node.input.push(id++)
      }
    })
    console.log(data)
    status.tree = data
    stats.innerHTML = `Entries: ${Object.keys(data).length}`
    btn.onclick = () => {
      popup.classList.toggle('active')
      status.init_check && send({type: 'init', to: 'graph_explorer' , data:status.tree})
      status.init_check = false
    }
  }
  async function click ({ data }) {
    if(data.type === 'css')
      send({to: 'theme_editor', type: 'init_tab', data: {id: data.name, local: data.local, hub_id: data.hub_id, theme: status.tree[data.hub[0]].name}})
    else if(data.type === 'json')
      send({ to: 'theme_editor', type: 'init', data })
    else
      return
    status.active_el && status.active_el.classList.remove('active')
    if(status.instance_id === data.id)
      editor.classList.toggle('active')
    else{
      editor.classList.add('active')
      el.classList.add('active')
    }
    status.instance_id = data.id
    status.active_el = el
  }
  async function find_id(name, type) {
    const node = Object.values(status.tree).filter(node => node.name === name && node.type === type)[0]
    return node && node.id
  }
  function make_node (instance){
    const el = document.createElement('div')
    el.classList.add('item')
    if(Object.keys(status.dirts).includes(instance.name)){
     el.classList.add('dirty')
    }
    el.innerHTML = `<main><input type='checkbox' /><span class='pre'>➕</span> <span class='name'>${instance.name || instance.id}</span> <span class='post'>➡️</span></main> <div class="sub"></div>`
    const pre_btn = el.querySelector('.pre')
    pre_btn.id = instance.id
    const post_btn = el.querySelector('.post')
    const name_el = el.querySelector('.name')
    const sub = el.querySelector('.sub')
    pre_btn.onclick = () => {
      pre_btn.innerHTML = pre_btn.innerHTML === '➕' ? '➖' : '➕'
      if(sub.children.length)
        sub.classList.toggle('hide')
      else
        sub.append(...status.tree.filter(node => node.hub == instance.id).map(make_node))
    }
    post_btn.onclick = () => {
      port.postMessage({ type: 'scroll', to: instance.id })
    }
    name_el.onclick = async () => {
      status.active_el && status.active_el.classList.remove('active')
      if(status.instance_id === instance.id)
        editor.classList.toggle('active')
      else{
        editor.classList.add('active')
        el.classList.add('active')
      }
      status.instance_id = instance.id      
      status.active_el = el
      send({to: 'theme_editor', type: 'init', data: instance })
    }
    return el
  }
  async function init_css () {
    const pref = JSON.parse(localStorage.pref)
    const pref_shared = pref[name] || data.shared || [{ id: name }]
    const pref_uniq = pref[css_id] || data.uniq || []
    pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
    pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
  }
  async function scroll () {
    el.scrollIntoView({behavior: 'smooth'})
    el.tabIndex = '0'
    el.focus()
    el.onblur = () => {
      el.tabIndex = '-1'
      el.onblur = null
    }
  }
  async function inject_all ({ data }) {
    const sheet = new CSSStyleSheet
    sheet.replaceSync(data)
    shadow.adoptedStyleSheets.push(sheet)
  }
  async function inject ({ data }){
    const style = document.createElement('style')
    style.innerHTML = data
    shadow.append(style)
  }
  async function get_theme ({local = true, theme = 'default', id}) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
    else
      theme_css = JSON.parse(localStorage[theme])[id]
    return theme_css
  }
}

},{"./data.json":34,"STATE":4,"graph_explorer":18,"io":23,"theme_editor":33}],36:[function(require,module,exports){
module.exports={
  "comp": "topnav",
  "links": [
    {
      "id": "datdot",
      "text": "DatDot",
      "url": "datdot"
    },
    {
      "id": "editor",
      "text": "Play Editor",
      "url": "editor"
    },
    {
      "id": "smartcontract_codes",
      "text": "Smart Contract Codes",
      "url": "smartcontract_codes"
    },
    {
      "id": "supporters",
      "text": "Supporters",
      "url": "supporters"
    },
    {
      "id": "our_contributors",
      "text": "Contributors",
      "url": "our_contributors"
    }
  ]
}
},{}],37:[function(require,module,exports){
const graphic = require('graphic')
const IO = require('io')
const statedb = require('STATE')
const default_data = require('./data.json')
/******************************************************************************
  OUR CONTRIBUTORS COMPONENT
******************************************************************************/
// ----------------------------------------
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = topnav

async function topnav (opts) {
	// ----------------------------------------
	// ID + JSON STATE
	// ----------------------------------------
	const name = 'topnav'
	const status = {}
	const on = {
		inject,
		inject_all,
		scroll
	}

	const sdb = statedb()
	let data = sdb.get(opts.sid)
	if(!data){
    const {id} = sdb.add(default_data, opts.hub)
    data = {...default_data, id}
  }
	const {send, css_id} = await IO({id: data.id, name, type: 'comp', comp: name, hub: opts.hub, css: data.css}, on)
	// ----------------------------------------
	// OPTS
	// ----------------------------------------

	const playLogo = await graphic('playLogo', './src/node_modules/assets/svg/logo.svg')
	// ----------------------------------------
	// TEMPLATE
	// ----------------------------------------
	const el = document.createElement('div')
	const shadow = el.attachShadow(shopts)
	shadow.innerHTML = `
		<section class='topnav'>
				<a href="#top">${playLogo.outerHTML}</a>
				<nav class='menu'>
				</nav>
		</section>
	`
	// ----------------------------------------
	const menu = shadow.querySelector('.menu')
	const body = shadow.querySelector('section')
	menu.append(...data.links.map(make_link))
	const scrollUp = 'scrollUp'
	const scrollDown = 'scrollDown'
	let lastScroll = 0
	
	window.addEventListener('scroll', ()=> {
		if (window.innerWidth >= 1024) {
			let currentScroll = window.pageYOffset
			if (currentScroll < 1) {
					body.classList.remove(scrollUp)
					body.classList.remove(scrollDown)
					return
			}
			if (currentScroll > lastScroll && !body.classList.contains(scrollDown)) {
					body.classList.add(scrollDown)
					body.classList.remove(scrollUp)
			} else if (currentScroll < lastScroll) {
					body.classList.add(scrollUp)
					body.classList.remove(scrollDown)
			}
			lastScroll = currentScroll
		}
	})

	window.addEventListener('resize', ()=> {
		if (window.innerWidth <= 1024) {
			body.classList.remove(scrollUp)
			body.classList.remove(scrollDown)
		}
	})
	init_css()
	return el

	function click(url) {
		send({to:'index', type: 'jump', data: url })
	}
	async function inject ({ data }) {
		sheet.replaceSync(data)
		shadow.adoptedStyleSheets = [sheet]
	}
	function make_link(link){
		const a = document.createElement('a')
		a.href = `#${link.url}`
		a.textContent = link.text
		a.onclick = () => click(link.url)
		return a
	}
	async function init_css () {
		const pref = JSON.parse(localStorage.pref)
		const pref_shared = pref[name] || data.shared || [{ id: name }]
		const pref_uniq = pref[css_id] || data.uniq || []
		pref_shared.forEach(async v => inject_all({ data: await get_theme(v)}))
		pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
	}
	async function scroll () {
		el.scrollIntoView({behavior: 'smooth'})
		el.tabIndex = '0'
		el.focus()
		el.onblur = () => {
			el.tabIndex = '-1'
			el.onblur = null
		}
	}
	async function inject_all ({ data }) {
		const sheet = new CSSStyleSheet
		sheet.replaceSync(data)
		shadow.adoptedStyleSheets.push(sheet)
	}
	async function inject ({ data }){
		const style = document.createElement('style')
		style.innerHTML = data
		shadow.append(style)
	}
	async function get_theme ({local = true, theme = 'default', id}) {
		let theme_css
		if(local)
			theme_css = await (await fetch(`./src/node_modules/css/${theme}/${id}.css`)).text()
		else
			theme_css = JSON.parse(localStorage[theme])[id]
		return theme_css
	}
}

},{"./data.json":36,"STATE":4,"graphic":20,"io":23}],38:[function(require,module,exports){
(function (__dirname){(function (){
const make_page = require('../') 
const statedb = require('../src/node_modules/STATE')
const theme = require('theme')
/******************************************************************************
  INITIALIZE PAGE
******************************************************************************/
// ----------------------------------------
let current_theme = theme
const sheet = new CSSStyleSheet()
sheet.replaceSync(get_theme(current_theme))
// ----------------------------------------
config().then(() => boot({ themes: { theme } }))

/******************************************************************************
  CSS & HTML Defaults
******************************************************************************/
async function config () {
  const path = path => new URL(`../src/node_modules/${path}`, `file://${__dirname}`).href.slice(8)

  const html = document.documentElement
  const meta = document.createElement('meta')
	const appleTouch = `<link rel="apple-touch-icon" sizes="180x180" href="./src/node_modules/assets/images/favicon/apple-touch-icon.png">`
	const icon32 = `<link rel="icon" type="image/png" sizes="32x32" href="./src/node_modules/assets/images/favicon/favicon-32x32.png">`
	const icon16 = `<link rel="icon" type="image/png" sizes="16x16" href="./src/node_modules/assets/images/favicon/favicon-16x16.png">`
	const webmanifest = `<link rel="manifest" href="./src/node_modules/assets/images/favicon/site.webmanifest"></link>`
  html.setAttribute('lang', 'en')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', 'width=device-width,initial-scale=1.0')
  // @TODO: use font api and cache to avoid re-downloading the font data every time
  document.adoptedStyleSheets = [sheet]
  document.head.append(meta)
  document.head.innerHTML += appleTouch + icon16 + icon32 + webmanifest
  await document.fonts.ready // @TODO: investigate why there is a FOUC
}
/******************************************************************************
  PAGE BOOT
******************************************************************************/
async function boot (opts) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const status = {}
  const sid = await statedb.init('./d.json')
  // ----------------------------------------
  // OPTS
  // ----------------------------------------
  const { page = 'INFO', theme = 'theme' } = opts
  const themes = opts.themes
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
    const on = { 'theme_change': on_theme }
    const opts = { page, theme, themes, sid }
    const element = await make_page(opts)
    shadow.append(element)
  }
  // ----------------------------------------
  // INIT
  // ----------------------------------------

  return

  function on_theme (message) {
    ;current_theme = current_theme === light_theme ? dark_theme : light_theme
    sheet.replaceSync(get_theme(current_theme))
  }
}
function get_theme (opts) {
	return`
	:host{
		${Object.entries(opts).map(entry => `--${entry[0]}: ${entry[1]};`).join('')}
	}
	html {
		font-size: 82.5%;
		scroll-behavior: smooth;
	}
	body {
		font-family: var(--bodyFont);
		font-size: 1.4rem;
		color: var(--bodyColor);
		margin: 0;
		padding: 0;
		background-color: var(--bodyBg);
		overflow-x: hidden;
	}
	a {
		text-decoration: none;
	}
	button {
		outline: none;
		border: none;
		font-family: var(--titleFont);
		font-size: var(--sectionButtonSize);
		color: var(--titleColor);
		border-radius: 2rem;
		padding: 1.2rem 3.8rem;
		cursor: pointer;
	}
	img {
		width: 100%;
		height: auto;
	}
	article {
		font-size: var(--articleSize);
		color: var(--articleColor);
		line-height: 2.5rem;
		padding-bottom: 4rem;
	}
	@media only screen and (min-width: 2561px) {
		article {
			font-size: calc(var(--articleSize) * 1.5 );
			line-height: calc(2.5rem * 1.5);
		}
		button {
			font-size: calc(var(--sectionButtonSize) * 1.5 );
	}
	}
	@media only screen and (min-width: 4096px) {
		article {
			font-size: calc(var(--articleSize) * 2.25 );
			line-height: calc(2.5rem * 2.25);
		}
		button {
			font-size: calc(var(--sectionButtonSize) * 2.25 );
		}
	}`
}
}).call(this)}).call(this,"/web")
},{"../":3,"../src/node_modules/STATE":4,"theme":39}],39:[function(require,module,exports){
const font = 'https://fonts.googleapis.com/css?family=Nunito:300,400,700,900|Slackey&display=swap'
const loadFont = `<link href=${font} rel='stylesheet' type='text/css'>`
document.head.innerHTML += loadFont

const defines = {
    fonts: {
        slackey         : `'Slackey', Arial, sans-serif`,
        nunito          : `'Nunito', Arial, sans-serif`,
    },
    sizes: {
        'xx-small'      : '1.2rem',
        'x-small'       : '1.3rem',
        small           : '1.4rem',
        medium          : '1.6rem',
        large           : '2rem',
        'x-large'       : '3rem',
        'xx-large'      : '4rem',
        'xxx-large'     : '5rem',
    },
    colors: {
        white           : '#fff',
        skyblue         : '#b3e2ff',
        turquoise       : '#aae6ed',
        pink            : '#e14365',
        grey            : '#333333',
        lightGrey       : '#999999',
        lightGreen      : '#a1e9da',
        blueGreen       : '#00a6ad',
        purple          : '#b337fb',
        lightBluePurple : '#9db9ee',
        bluePurple      : '#9a91ff',
        lightPurple     : '#beb2d7',
        lightYellow     : '#eddca4',
        lightSky        : '#b4e4fd',
        green           : '#4aa95b',
        lowYellow       : '#fdfbee',
        brown           : '#b06d56',
    }
}

const theme = {
    bodyFont            : defines.fonts.nunito,
    bodyColor           : defines.colors.grey,
    bodyBg              : defines.colors.lightSky,
    menuSize            : defines.sizes.small,
    titleFont           : defines.fonts.slackey,
    titleSize           : defines.sizes['xxx-large'],
    titleSizeM          : '3.6rem',
    titlesSizeS         : '2.8rem',
    titleColor          : defines.colors.white,
    playBgGStart        : defines.colors.skyblue,
    playBgGEnd          : defines.colors.turquoise,
    subTitleSize        : '4.2rem',
    section1TitleColor  : defines.colors.pink,
    section2TitleColor  : defines.colors.blueGreen,
    section3TitleColor  : defines.colors.purple,
    section4TitleColor  : defines.colors.brown,
    section5TitleColor  : defines.colors.green,
    articleSize         : defines.sizes.small,
    articleColor        : defines.colors.grey,
    section1BgGStart    : defines.colors.turquoise,
    section1BgGEnd      : defines.colors.lightGreen,
    section2BgGStart    : defines.colors.lightGreen,
    section2BgGEnd      : defines.colors.lightBluePurple,
    section3BgGStart    : defines.colors.lightBluePurple,
    section3BgGEnd      : defines.colors.bluePurple,
    section4BgGStart    : defines.colors.bluePurple,
    section4BgGEnd      : defines.colors.lightPurple,
    section5BgGStart    : defines.colors.lightPurple,
    section5BgGMiddle   : defines.colors.lightYellow,
    section5BgGEnd      : defines.colors.lightSky,
    sectionButtonSize   : defines.sizes.small,
    roadmapHeadlline    : '4rem',
    roadmapHeadllineM   : '3rem',
    roadmapHeadllineS   : '1.6rem',
    roadmapTitleSize    : defines.sizes.large,
    roadmapTitleSizeM   : defines.sizes.medium,
    roadmapTitleColor   : defines.colors.blueGreen,
    roadmapTextSize     : defines.sizes.medium,
    roadmapTextSizeM    : defines.sizes["x-small"],
    contributorsBg              : defines.colors.lowYellow,
    contributorsTextSize        : defines.sizes.small,
    contributorsTextSizeS       : defines.sizes["xx-small"],
    contributorsCareerColor     : defines.colors.lightGrey,
    footerTextColor     : defines.colors.grey,
    footerBg            : defines.colors.lightSky
}

module.exports = theme

},{}]},{},[38]);
