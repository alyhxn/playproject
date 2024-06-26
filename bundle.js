(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
(function (process,__filename){(function (){
const fetch_data = require('fetch-data')
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
/******************************************************************************
  MAKE_PAGE COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
sheet.replaceSync(get_theme())
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------

module.exports = make_page

async function make_page(opts, lang) {
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const id = `${ID}:${count++}` // assigns their own name
  const status = { tree: { '': { id: '' } }, id: 0 }
  const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {}, ports: {}} // all state of component instance
  const on_rx = {
    init_ch,
    req_ch,
    send,
    jump
  }
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
  const data = await fetch_data(path)
  const {theme} = opts
  
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.createElement('div')
  const shadow = el.attachShadow(shopts)
  shadow.adoptedStyleSheets = [sheet]
  shadow.innerHTML = `
  <div id="top" class='wrap'>
  </div>`
  const main = shadow.querySelector('div')

  main.append(...await Promise.all(Object.entries(data).map(async entry => {
    const el = document.createElement('div')
    el.id = entry[0]
    const shadow = el.attachShadow(shopts)
    shadow.append(await modules[entry[0]](entry[1], init_ch({data: {name: entry[0], pref: entry[1].pref }})))
    return el
  })))
  update_theme_widget()
  return el
  
  function init_ch({ data, hub = '' }) {
    if(data.name)
      var {name, uniq} = data
    else
      var name = data
    const ch = new MessageChannel()
    const id = data.id ? data.id : status.id++
    state.ports[id] = ch.port1
    if( name !== 'theme_widget')
      status.tree[id] = { name, hub, path:status.tree[hub].id + '/' + name, uniq }
    ch.port1.onmessage = event => {
      on_rx[event.data.type] && on_rx[event.data.type]({...event.data, by: id})
    }
    return ch.port2
  }
  function req_ch ({ by, data }) {
    const port = init_ch({ data, hub: by })
    state.ports[by].postMessage({ data: 'hi' }, [port])
  }
  function send ({ data, to, to_type, by }) {
    state.ports[to].postMessage({ data, type: to_type, by })
  }
  async function update_theme_widget () {
    state.ports[0].postMessage({ data: status.tree, type: 'refresh'})
  }
  async function jump ({ data }) {
    main.querySelector('#'+data).scrollIntoView({ behavior: 'smooth'})
  }
}

function get_theme() {
  return `
.wrap {
    background: var(--bodyBg);
}
[class^="cloud"] {
    transition: left 0.6s, bottom 0.5s, top 0.5s linear;
}`}

}).call(this)}).call(this,require('_process'),"/src/index.js")
},{"_process":1,"datdot":7,"editor":8,"fetch-data":9,"footer":10,"header":12,"our_contributors":14,"smartcontract_codes":15,"supporters":16,"theme_widget":17,"topnav":18}],4:[function(require,module,exports){
(function (process,__filename){(function (){
/******************************************************************************
  CONTENT COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = content

async function content(data, port, hub) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'content'
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const style = document.createElement('style')
    el.classList.add('content')
    const shadow = el.attachShadow(shopts)
    shadow.adoptedStyleSheets = [sheet]
    shadow.innerHTML = `
    <div class="main">
        <h2 class="subTitle subTitleColor">${data.title}</h2>
        <article class=article>${data.article}</article>
        ${data.url ? `<a class="button buttonBg" href=${data.url} target="_blank">${data.action}</a>` : ''}
    </div>
    `
    shadow.append(style)
    
    port.onmessage = onmessage
    inject_all({ data: await get_theme(name) })
    // inject({ data: await get_theme(hub +'/'+ name) })
    return el

    async function onmessage ({ data }){
        on_rx[data.type](data.data)
    }
    async function inject_all ({ data }) {
        sheet.replaceSync(data)
        shadow.adoptedStyleSheets = [sheet]
    }
    async function inject ({ data }){
        style.innerText = data
    }
    async function get_theme (slice) {
        const pref = JSON.parse(localStorage.pref)[name]
        let theme
        if(pref){
            if(Object.keys(localStorage).includes(pref))
                theme = JSON.parse(localStorage[pref]).css[name]
            else
                theme = await (await fetch(`./src/node_modules/css/${pref}/${slice}.css`)).text()
        }
        else
            theme = await (await fetch(`./src/node_modules/css/default/${slice}.css`)).text()
        return theme
    }
}

}).call(this)}).call(this,require('_process'),"/src/node_modules/content.js")
},{"_process":1}],5:[function(require,module,exports){
(function (process,__filename){(function (){
const Graphic = require('graphic')
/******************************************************************************
  CONTRIBUTOR COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = contributor

async function contributor(person, port, css_id) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'contributor'
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
    const lifeIsland = await Graphic('lifeIsland','./src/node_modules/assets/svg/life-island.svg')
    const on_rx = {
      inject,
      inject_all
    }
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.adoptedStyleSheets = [sheet]
    shadow.innerHTML = `
      <div>
        <div class='member'>
          <img class='avatar' src=${person.avatar} alt=${person.name}>
          <div class='info'>
            <h3 class='name'>${person.name}</h3>
            ${person.careers &&
                person.careers.map( career =>
                    `<span class='career'>${career}</span>`
                )
            }
          </div>
        </div>
        ${lifeIsland.outerHTML}
      </div>
    `
    port.onmessage = event => on_rx[event.data.type](event.data)
    init_css()
    return el

    async function init_css () {
      const pref = JSON.parse(localStorage.pref)
      const pref_shared = pref[name]
      const pref_uniq = pref[css_id]
      inject_all({ data: await get_theme(pref_shared ? pref_shared : {file: name}) })
      if(pref_uniq)
        pref_uniq.forEach(async v => inject({ data: await get_theme(v)}))
      else
        person.uniq.forEach(async no => inject({ data: await get_theme({file: name + no})}))
    }
    async function inject_all ({ data }) {
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets = [sheet]
    }
    async function inject ({ data }){
      const style = document.createElement('style')
      style.innerHTML = data
      shadow.append(style)
    }
    async function get_theme ({local = true, theme = 'default', file}) {
      let theme_css
      if(local)
        theme_css = await (await fetch(`./src/node_modules/css/${theme}/${file}.css`)).text()
      else
        theme_css = JSON.parse(localStorage[theme]).css[file]
      return theme_css
    }
}



}).call(this)}).call(this,require('_process'),"/src/node_modules/contributor.js")
},{"_process":1,"graphic":11}],6:[function(require,module,exports){
(function (process,__filename){(function (){
/******************************************************************************
  SUPPORTERS COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------

const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = crystalIsland

async function crystalIsland({date, info}, deco, island, title) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    deco = await Promise.all(deco)
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    el.classList.add('scene')
    el.innerHTML = `
        <div class='deco'>
            <div class='content'>
                <h3>${date}</h3>
                ${ info === 'Coming soon' ? `<h3>${info}</h3>` : `<p>${info}</p>` }
            </div>
            ${title}
        </div>
    `
    // ----------------------------------------
    const deco_el = el.querySelector('.deco')
    el.append( island)
    deco_el.append(...deco)
    return el
}

module.exports = crystalIsland
}).call(this)}).call(this,require('_process'),"/src/node_modules/crystalIsland.js")
},{"_process":1}],7:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
const Rellax = require('rellax')
const content = require('content')
/******************************************************************************
  DATDOT COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = datdot

async function datdot(data, port) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'datdot'
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
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
    shadow.adoptedStyleSheets = [sheet]
    shadow.innerHTML = `
    <section id="datdot" class="section">
    </section>
    `
    const main = shadow.querySelector('section')
    main.append(await content(data, await init_ch({ name: 'content'}), name), blockchainIsland, blossomIsland, cloud1, cloud2, cloud3, cloud4, cloud5)
    
    port.onmessage = event => inject(event.data)
    const css = await get_theme()
    inject({ data: css })
    return el

    async function init_ch({ name }) {
        port.postMessage({type: 'req_ch', data: name})
        return new Promise(resolve => 
          port.onmessage = event => {
              resolve(event.ports[0])
              port.onmessage = event => inject(event.data)
          }
        )
      }
    async function inject ({ data }) {
        sheet.replaceSync(data)
        shadow.adoptedStyleSheets = [sheet]
    }
    async function get_theme () {
        const pref = JSON.parse(localStorage.pref)[name]
        let theme
        if(pref){
            if(Object.keys(localStorage).includes(pref))
            theme = JSON.parse(localStorage[pref]).css[name]
            else
            theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
        }
        else
            theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
        return theme
    }
}
}).call(this)}).call(this,require('_process'),"/src/node_modules/datdot.js")
},{"_process":1,"content":4,"graphic":11,"rellax":2}],8:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
const Rellax = require('rellax')
const Content = require('content')
/******************************************************************************
  EDITOR COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = editor

async function editor (data, port) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'editor'
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
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
    shadow.adoptedStyleSheets = [sheet]
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
    main.prepend(await Content(data, await init_ch({ name: 'content' }), name))
    
    port.onmessage = event => inject(event.data)
    const css = await get_theme()
    inject({ data: css })
    return el

    async function init_ch({ name }) {
        port.postMessage({type: 'req_ch', data: name})
        return new Promise(resolve => 
          port.onmessage = event => {
              resolve(event.ports[0])
              port.onmessage = event => inject(event.data)
          }
        )
      }
    async function inject ({ data }) {
        sheet.replaceSync(data)
        shadow.adoptedStyleSheets = [sheet]
    }
    async function get_theme () {
        const pref = JSON.parse(localStorage.pref)[name]
        let theme
        if(pref){
            if(Object.keys(localStorage).includes(pref))
            theme = JSON.parse(localStorage[pref]).css[name]
            else
            theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
        }
        else
            theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
        return theme
    }
}

}).call(this)}).call(this,require('_process'),"/src/node_modules/editor.js")
},{"_process":1,"content":4,"graphic":11,"rellax":2}],9:[function(require,module,exports){
module.exports = fetch_data

async function fetch_data(path) {
    let response = await fetch(path)
    if (response.status == 200) {
        let texts = await response.json()
        return texts
    }
    throw new Error(response.status)
}
},{}],10:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
/******************************************************************************
  APP FOOTER COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = footer

async function footer(opts, port) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    let island = await graphic('island', './src/node_modules/assets/svg/deco-island.svg')
    const graphics = opts.icons.map(icon => graphic('icon', icon.imgURL))
    const icons = await Promise.all(graphics)
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.adoptedStyleSheets = [sheet]
    shadow.innerHTML = `
    <footer class='footer'>
        <div class='scene'>
            ${island.outerHTML}
            <nav class='contacts'>
                ${opts.icons.map((icon, i) => 
                    `<a href=${icon.url} 
                    title=${icon.name} 
                    target="${icon.url.includes('http') ? "_blank" : null}"
                    >${icons[i].outerHTML}</a>`
                )}
            </nav>
        </div>
        
        <p class='copyright'>${new Date().getFullYear()+' '+opts.copyright}</p>
    </footer>
    `
    
    port.onmessage = event => inject(event.data)
    const css = await get_theme()
    inject({ data: css })
    return el

    async function inject ({ data }) {
        sheet.replaceSync(data)
        shadow.adoptedStyleSheets = [sheet]
    }
    async function get_theme () {
        const name = 'footer'
        const pref = JSON.parse(localStorage.pref)[name]
        let theme
        if(pref){
            if(Object.keys(localStorage).includes(pref))
            theme = JSON.parse(localStorage[pref]).css[name]
            else
            theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
        }
        else
            theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
        return theme
    }
}

}).call(this)}).call(this,require('_process'),"/src/node_modules/footer.js")
},{"_process":1,"graphic":11}],11:[function(require,module,exports){
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
},{"loadSVG":13}],12:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
const Rellax = require('rellax')
/******************************************************************************
  HEADER COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = header

async function header(data, port) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
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
    shadow.adoptedStyleSheets = [sheet]
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
		
		port.onmessage = event => inject(event.data)
    const css = await get_theme()
    inject({ data: css })
    return el

    async function inject ({ data }) {
        sheet.replaceSync(data)
        shadow.adoptedStyleSheets = [sheet]
    }
    async function get_theme () {
        const name = 'header'
        const pref = JSON.parse(localStorage.pref)[name]
        let theme
        if(pref){
            if(Object.keys(localStorage).includes(pref))
            theme = JSON.parse(localStorage[pref]).css[name]
            else
            theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
        }
        else
            theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
        return theme
    }
}


}).call(this)}).call(this,require('_process'),"/src/node_modules/header.js")
},{"_process":1,"graphic":11,"rellax":2}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
const Rellax = require('rellax')
const Content = require('content')
const Contributor = require('contributor')
/******************************************************************************
  OUR CONTRIBUTORS COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet()
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = our_contributors

async function our_contributors (data, port, paths) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'our_contributors'
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
    const on_rx = {
        inject
    }
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
    const temp = []
    for (const [index, person] of data.contributors.entries()){
        temp.push(await Contributor( person, await init_ch({ name: 'contributor', uniq: person.uniq, id: 'contributor' + index }), 'contributor' + index))
    }
    const contributors = await Promise.all(temp)

    let cloud1Rellax = new Rellax( cloud1, { speed: 0.3})
    let cloud2Rellax = new Rellax( cloud2, { speed: 0.4})
    let cloud3Rellax = new Rellax( cloud3, { speed: 0.3})
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
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
    main.prepend(await Content(data, await init_ch({ name: 'content' }), name))
    inner.append(island, cloud1, cloud2, cloud3)

    const css = await get_theme()
    inject({ data: css })
    return el

    async function init_ch (data) {
      port.postMessage({type: 'req_ch', data })
      return new Promise(resolve => 
        port.onmessage = event => {
            resolve(event.ports[0])
            port.onmessage = onmessage
        }
      )
    }
    async function onmessage ({ data }){
      on_rx[data.type](data.data)
    }
    async function inject ({ data }) {
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets = [sheet]
    }
    async function get_theme () {
      const pref = JSON.parse(localStorage.pref)[name]
      let theme
      if(pref){
        if(Object.keys(localStorage).includes(pref))
          theme = JSON.parse(localStorage[pref]).css[name]
        else
          theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
      }
      else
        theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
      return theme
    }
}
// ----------------------------------------------------------------------------
function shadowfy (props = {}, sheets = []) {
  return element => {
    const el = Object.assign(document.createElement('div'), { ...props })
    const sh = el.attachShadow(shopts)
    sh.adoptedStyleSheets = sheets
    sh.append(element)
    return el
  }
}
}).call(this)}).call(this,require('_process'),"/src/node_modules/our_contributors.js")
},{"_process":1,"content":4,"contributor":5,"graphic":11,"rellax":2}],15:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
const Content = require('content')
/******************************************************************************
  SMARTCONTRACT-CODES COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = smartcontract_codes

async function smartcontract_codes (data, port) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const name = 'smartcontract_codes'
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
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
    shadow.adoptedStyleSheets = [sheet]
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
  main.prepend(await Content(data, await init_ch({ name: 'content' }), name))
  
  port.onmessage = event => inject(event.data)
  const css = await get_theme()
  inject({ data: css })
  return el

  async function init_ch({ name }) {
    port.postMessage({type: 'req_ch', data: name})
    return new Promise(resolve => 
      port.onmessage = event => {
          resolve(event.ports[0])
          port.onmessage = event => inject(event.data)
      }
    )
  }
  async function inject ({ data }) {
      sheet.replaceSync(data)
      shadow.adoptedStyleSheets = [sheet]
  }
  async function get_theme () {
      const pref = JSON.parse(localStorage.pref)[name]
      let theme
      if(pref){
          if(Object.keys(localStorage).includes(pref))
          theme = JSON.parse(localStorage[pref]).css[name]
          else
          theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
      }
      else
          theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
      return theme
  }
}

}).call(this)}).call(this,require('_process'),"/src/node_modules/smartcontract_codes.js")
},{"_process":1,"content":4,"graphic":11}],16:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
const Rellax = require('rellax')
const crystalIsland = require('crystalIsland')
/******************************************************************************
  SUPPORTERS COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = supporters

async function supporters (data, port) {
    // ----------------------------------------
    // ID + JSON STATE
    // ----------------------------------------
    const id = `${ID}:${count++}` // assigns their own name
    const status = {}
    const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
    // ----------------------------------------
    // OPTS
    // ----------------------------------------
    let pageTitle = `<div class='title'>${data.title}</div>`
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

    const graphics = [
      // crystals
      graphic('yellowCrystal','./src/node_modules/assets/svg/crystal-yellow.svg'),
      graphic('purpleCrystal','./src/node_modules/assets/svg/crystal-purple.svg'),
      graphic('blueCrystal','./src/node_modules/assets/svg/crystal-blue.svg'),
      // stone
      graphic('stone','./src/node_modules/assets/svg/stone1.svg'),
      // trees
      graphic('tree','./src/node_modules/assets/svg/big-tree.svg'),
      graphic('tree','./src/node_modules/assets/svg/single-tree1.svg'),
      graphic('tree','./src/node_modules/assets/svg/single-tree3.svg'),
      graphic('treeGold','./src/node_modules/assets/svg/single-tree2.svg'),
      // islands
      graphic('island','./src/node_modules/assets/svg/floating-island3.svg'),
      graphic('island','./src/node_modules/assets/svg/floating-island3.svg'),
      graphic('island','./src/node_modules/assets/svg/floating-island3.svg'),
      graphic('island','./src/node_modules/assets/svg/floating-island3.svg'),
      graphic('island','./src/node_modules/assets/svg/floating-island3.svg'),
      // clouds
      graphic('cloud1', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud2', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud3', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud4', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud5', './src/node_modules/assets/svg/cloud.svg'),
      graphic('cloud6', './src/node_modules/assets/svg/cloud.svg'),
    ]

    const [yellowCrystal, purpleCrystal, blueCrystal, stone, tree, tree1, tree2, tree3, 
      island, island1, island2, island3, island4, cloud1, cloud2, cloud3, cloud4, cloud5, cloud6] = await Promise.all(graphics)
    
    // Parallax effects
    let cloud1Rellax = new Rellax( cloud1, { speed: 1.5})
    let cloud2Rellax = new Rellax( cloud2, { speed: 1})
    let cloud3Rellax = new Rellax( cloud3, { speed: 1.5})
    let cloud4Rellax = new Rellax( cloud4, { speed: 4})
    let cloud5Rellax = new Rellax( cloud5, { speed: 1.5})
    let cloud6Rellax = new Rellax( cloud6, { speed: 3})

    const scenes = await data.supporters.map(async (supporter, i) => 
        await crystalIsland(supporter, supporter.deco.map(async v => await graphic(v.includes('tree') ? 'tree' : v, paths[v])), await graphic('island', paths.island), i ? '' : pageTitle)
    )
    // ----------------------------------------
    // TEMPLATE
    // ----------------------------------------
    const el = document.createElement('div')
    const shadow = el.attachShadow(shopts)
    shadow.adoptedStyleSheets = [sheet]
    shadow.innerHTML = `
        <section id="supporters" class="section">
            
        </section>
    `
    // ----------------------------------------
    const main = shadow.querySelector('section')
    main.append(...(await Promise.all(scenes)).map(v => v), cloud1, cloud2, cloud3, cloud4, cloud5, cloud6)
    
    port.onmessage = event => inject(event.data)
    const css = await get_theme()
    inject({ data: css })
    return el

    async function inject ({ data }) {
        sheet.replaceSync(data)
        shadow.adoptedStyleSheets = [sheet]
    }    
    async function get_theme () {
        const name = 'supporters'
        const pref = JSON.parse(localStorage.pref)[name]
        let theme
        if(pref){
            if(Object.keys(localStorage).includes(pref))
            theme = JSON.parse(localStorage[pref]).css[name]
            else
            theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
        }
        else
            theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
        return theme
    }
}

}).call(this)}).call(this,require('_process'),"/src/node_modules/supporters.js")
},{"_process":1,"crystalIsland":6,"graphic":11,"rellax":2}],17:[function(require,module,exports){
(function (process,__filename){(function (){
/******************************************************************************
  THEME_WIDGET COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
sheet.replaceSync(get_theme())
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------

module.exports = theme_widget

async function theme_widget(instances, port, data) {
  port.onmessage = event => on_rx[event.data.type](event.data)
  // ----------------------------------------
  // ID + JSON STATE
  // ----------------------------------------
  const id = `${ID}:${count++}` // assigns their own name
  const status = { tab_id: 0 }
  const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {}, channels: {}} // all state of instance instance
  status.dirts = JSON.parse(localStorage.dirt || (localStorage.dirt = '{}'))
  localStorage.pref || (localStorage.pref = '{}')
  const paths =  JSON.parse(await(await fetch('./src/node_modules/css/index.json')).text())
  status.themes = {
    local: Object.keys(paths),
    saved: Object.entries(localStorage).filter(entry => {
      try{
        return JSON.parse(entry[1]).theme
      }
      catch{
        return false
      }
    }
    ).map(entry => entry[0])
  }
  const on_rx = {
    refresh
  }
  // ----------------------------------------
  // TEMPLATE
  // ----------------------------------------
  const el = document.createElement('div')
  const shadow = el.attachShadow(shopts)
  shadow.adoptedStyleSheets = [sheet]
  shadow.innerHTML = `
  <section>
    <div class="btn">
      ⚙️
    </div>
    <div class="popup">
      <div class="box">
        <div class="stats">
          Active instances: 
        </div>
        <div class="list">
        </div>
      </div>
      <div class="editor">
        <div class="btns">
          <div class="box"></div>
          <span class="plus">+</span>
        </div>
        <div class="tabs">
        </div>
        <select class="theme"></select>
        <select class="type">
          <option>shared</option>
          <option>uniq</option>
        </select>
        <button class="load">
          Load
        </button>
        <button class="inject">
          Inject
        </button>
        <button class="save_file">
          Save file
        </button>
        <button class="save_pref">
          Save pref
        </button>
        <button class="drop">
          Drop
        </button>
        <button class="reset">
          Reset
        </button>
        <input placeholder='Enter theme' />
        <button class="add">
          Add
        </button>
      </div>
    </div>
  </section>`
  const btn = shadow.querySelector('.btn')
  const popup = shadow.querySelector('.popup')
  const list = popup.querySelector('.list')
  const stats = popup.querySelector('.stats')
  const editor = popup.querySelector('.editor')
  const inject_btn = editor.querySelector('.inject')
  const load_btn = editor.querySelector('.load')
  const save_file_btn = editor.querySelector('.save_file')
  const save_pref_btn = editor.querySelector('.save_pref')
  const add_btn = editor.querySelector('.add')
  const drop_btn = editor.querySelector('.drop')
  const reset_btn = editor.querySelector('.reset')
  const tabs = editor.querySelector('.tabs')
  const btns = editor.querySelector('.btns > .box')
  const plus = editor.querySelector('.plus')
  const select_theme = editor.querySelector('select.theme')
  const select_type = editor.querySelector('select.type')
  const input = editor.querySelector('input')

  btn.onclick = () => popup.classList.toggle('active')
  inject_btn.onclick = inject
  load_btn.onclick = load
  save_file_btn.onclick = save_file
  save_pref_btn.onclick = save_pref
  add_btn.onclick = add
  drop_btn.onclick = drop
  reset_btn.onclick = () => localStorage.clear()
  plus.onclick = () => add_tab('New', 'default', 'uniq', '')
  // textarea.oninput = unsave
  update_select_theme()
  return el

  async function add () {
    localStorage[input.value] = '{"theme":"true","css":{}}'
    status.themes.saved.push(input.value)
    update_select_theme()
  }
  async function drop () {
    localStorage.removeItem(select_theme.value)
    status.themes.saved = status.themes.saved.filter(v => v != select_theme.value)
    update_select_theme()
    select_theme.value = 'default'
    load()
  }
  async function forget_changes () {
    status.active_el.classList.remove('dirty')
    const dirt = JSON.parse(localStorage.dirt)
    delete(dirt[status.title])
    localStorage.dirt = JSON.stringify(dirt)
  }
  async function save_file () {
    // forget_changes()
    const theme = localStorage[select_theme.value] && JSON.parse(localStorage[select_theme.value])
    if(theme){
      theme.css[status.active_tab.id] = status.textarea.value
      localStorage[select_theme.value] = JSON.stringify(theme)
    }
  }
  async function save_pref () {
    const pref = JSON.parse(localStorage.pref)
    if(select_type.value === "uniq"){
      pref[status.active_id].length || (pref[status.active_id] = [])
      pref[status.active_id].push({theme: select_theme.value, file:status.active_tab.id, local: status.themes.local.includes(select_theme.value) })
    }
    else{
      pref[status.title].length || (pref[status.title] = [])
      pref[status.title].push({theme: select_theme.value, file:status.active_tab.id, local: status.themes.local.includes(select_theme.value) })
    }
    localStorage.pref = JSON.stringify(pref)
  }
  async function unsave () {
    status.active_el.classList.add('dirty')
    let theme = localStorage[select_theme.value] && JSON.parse(localStorage[select_theme.value])
    if(theme){
      theme.css[status.title] = textarea.value
      localStorage[select_theme.value] = JSON.stringify(theme)
      const dirt = JSON.parse(localStorage.dirt)
      dirt[status.title] = select_theme.value
      localStorage.dirt = JSON.stringify(dirt)
    }
    else{
      const name = select_theme.value + '*'
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
        select_theme.value = name
      }
    }
  }
  async function inject () {
    port.postMessage({type: 'send', to_type: select_type.value === 'uniq' ? 'inject' : 'inject_all', to: status.active_id, data: status.textarea.value})
  }
  async function load () {
    tabs.innerHTML = ''
    btns.innerHTML = ''
    const theme = select_theme.value
    let css
    if(status.themes.local.includes(theme)){
      const temp = await fetch(`./src/node_modules/css/${theme}/${status.title}.css`)
      css = await temp.text()
    }
    else{
      const temp = JSON.parse(localStorage[theme]).css
      Object.entries(temp).forEach(entry => {
        if(entry[0].includes(status.title))
          add_tab(entry[0], entry[1])
      })
    }
    forget_changes()
  }
  async function refresh ({ data }) {
    status.tree = data
    stats.innerHTML = `Active instances: ${Object.keys(data).length}`
    list.append(...Object.entries(data).filter(entry => entry[1].hub === '').map(make_node))
  }
  function make_node (instance){
    const el = document.createElement('div')
    el.classList.add('item')
    if(Object.keys(status.dirts).includes(instance[1].name)){
     el.classList.add('dirty') 
    }
    el.innerHTML = `<main><span class='pre'>+</span> <span class='name'>${instance[1].name}</span></main> <div class="sub"></div>`
    const pre_btn = el.querySelector('.pre')
    const name_el = el.querySelector('.name')
    const sub = el.querySelector('.sub')
    pre_btn.onclick = () => {
      pre_btn.innerHTML = pre_btn.innerHTML === '+' ? '-' : '+'
      if(sub.children.length)
        sub.classList.toggle('hide')
      else
        sub.append(...Object.entries(status.tree).filter(entry => entry[1].hub == instance[0]).map(make_node))
    }
    name_el.onclick = async () => {
      tabs.innerHTML = ''
      btns.innerHTML = ''
      status.title = instance[1].name
      if(status.active_id === instance[0])
        editor.classList.toggle('active')
      else
        editor.classList.add('active')
      // textarea.value = await get_css(instance[1].name)
      status.active_id = instance[0]
      status.active_el = el
      status.active_path = instance[1].path
      init_css({...instance[1], id:instance[0]})
    }
    return el
  }
  async function init_css ({id, name, uniq, hub}) {
    const pref = JSON.parse(localStorage.pref)
    const pref_shared = pref[name] || {file: name, theme: 'default'}
    const pref_uniq = pref[id]
    add_tab(pref_shared.file, pref_shared.theme, 'shared', await get_css(pref_shared))
    if(pref_uniq)
      pref_uniq.forEach(async v => add_tab(v.file, v.theme, 'uniq', await get_css(v)))
    else
      uniq && uniq.forEach(async no => add_tab(name + no, 'default', 'uniq', await get_css({file: name + no})))
  }
  async function add_tab (file, theme, type, css) {
    const btn = document.createElement('span')
    btn.id = file
    btn.innerHTML = file
    btn.dataset.theme = theme
    btn.dataset.type = type
    btns.append(btn)
    btn.onclick = () => switch_tab(file)
    const textarea = document.createElement('textarea')
    textarea.value = css
    textarea.id = file
    tabs.append(textarea)
    switch_tab(file)
  }
  async function switch_tab (tab_id) {
    status.textarea && status.textarea.classList.remove('active')
    status.textarea = tabs.querySelector('#' + tab_id)
    status.textarea.classList.add('active')
    status.active_tab && status.active_tab.classList.remove('active')
    status.active_tab = btns.querySelector('#' + tab_id)
    status.active_tab.classList.add('active')
    select_type.value = status.active_tab.dataset.type
    select_theme.value = status.active_tab.dataset.theme
  }
  async function get_css ({local = true, theme = 'default', file}) {
    let theme_css
    if(local)
      theme_css = await (await fetch(`./src/node_modules/css/${theme}/${file}.css`)).text()
    else
      theme_css = JSON.parse(localStorage[theme]).css[file]
    select_theme.value = theme
    return theme_css
  }
  async function update_select_theme () {
    select_theme.innerHTML = `<optgroup label='local'>${status.themes.local.map(theme => `<option>${theme}</option>`)}</optgroup>` +
    `<optgroup label='saved'> ${status.themes.saved.map(theme => `<option>${theme}</option>`)}</optgroup>`
  }
}

function get_theme() {
  return `
  *{
    box-sizing: border-box;
  }
  section{
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 50;
    display: flex;
    align-items: end;
  }
  .btn{
    font-size: 30px;
    cursor: pointer;
  }
  .popup{
    display: none;
    position: relative;
    bottom: 44px;
    margin-left: -42px;
    gap: 10px;
    align-items: end;
  }
  .popup.active{
    display: flex;
  }
  .popup > .box{
    background: #beb2d7;
    border-radius: 5px;
    padding: 10px;
  }
  .popup .list{
    max-height: 60vh;
    overflow-y: scroll;
  }
  .popup .list .item{
    white-space: nowrap;
    cursor: pointer;
  }
  .popup .list .item > .sub{
    display: block;
    margin-left: 10px;
  }
  .popup .list .item > .sub.hide{
    display: none;
  }
  .popup .list .item > main:hover{
    background: #ada1c6;
  }
  .popup .list .item.dirty > main > .name{
    color: yellow;
  }
  .popup .editor{
    display: none;
    background: #beb2d7;
    position: relative;
    border-radius: 5px;
    padding: 10px;
  }
  .popup .editor.active{
    display: block;
  }
  .popup .editor .tabs textarea{
    display: none;
    min-height: 44vh;
    min-width: 100%;
  }
  .popup .editor .tabs textarea.active{
    display: block;
  }
  .popup .editor .btns{
    display: flex;
  }
  .popup .editor .btns span{
    padding: 0 5px;
    margin: 0 5px;
    cursor: pointer;
  }
  .popup .editor .btns span.active{
    background: #ada1c6;
  }
  .popup .editor .btns span:hover{
    background: #ae9cd4;
  }
  `
}
}).call(this)}).call(this,require('_process'),"/src/node_modules/theme_widget.js")
},{"_process":1}],18:[function(require,module,exports){
(function (process,__filename){(function (){
const graphic = require('graphic')
/******************************************************************************
  OUR CONTRIBUTORS COMPONENT
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
// ----------------------------------------
const sheet = new CSSStyleSheet
const default_opts = { }
const shopts = { mode: 'closed' }
// ----------------------------------------
module.exports = topnav

async function topnav(data, port) {
	port.onmessage = event => inject(event.data)
	// ----------------------------------------
	// ID + JSON STATE
	// ----------------------------------------
	const id = `${ID}:${count++}` // assigns their own name
	const status = {}
	const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
	// ----------------------------------------
	// OPTS
	// ----------------------------------------

	const playLogo = await graphic('playLogo', './src/node_modules/assets/svg/logo.svg')
	// ----------------------------------------
	// TEMPLATE
	// ----------------------------------------
	const el = document.createElement('div')
	const shadow = el.attachShadow(shopts)
	shadow.adoptedStyleSheets = [sheet]
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
	menu.append(...data.map(make_link))
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

	const css = await get_theme()
	inject({ data: css })
	return el
	function click(url) {
		port.postMessage({ type: 'jump', data: url })
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
	async function get_theme () {
		const name = 'topnav'
		const pref = JSON.parse(localStorage.pref)[name]
		let theme
		if(pref){
			if(Object.keys(localStorage).includes(pref))
				theme = JSON.parse(localStorage[pref]).css[name]
			else
				theme = await (await fetch(`./src/node_modules/css/${pref}/${name}.css`)).text()
		}
		else
			theme = await (await fetch(`./src/node_modules/css/default/${name}.css`)).text()
		return theme
	}
}

}).call(this)}).call(this,require('_process'),"/src/node_modules/topnav.js")
},{"_process":1,"graphic":11}],19:[function(require,module,exports){
(function (process,__filename,__dirname){(function (){
const make_page = require('../') 
const theme = require('theme')
/******************************************************************************
  INITIALIZE PAGE
******************************************************************************/
// ----------------------------------------
// MODULE STATE & ID
var count = 0
const [cwd, dir] = [process.cwd(), __filename].map(x => new URL(x, 'file://').href)
const ID = dir.slice(cwd.length)
const STATE = { ids: {}, net: {} } // all state of component module
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
  const id = `${ID}:${count++}` // assigns their own name
  const status = {}
  const state = STATE.ids[id] = { id, status, wait: {}, net: {}, aka: {} } // all state of component instance
  const cache = resources({})
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
    const protocol = use_protocol('make_page')({ state, on })
    const opts = { page, theme, themes }
    const element = await make_page(opts, protocol)
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
// ----------------------------------------------------------------------------
function shadowfy (props = {}, sheets = []) {
  return element => {
    const el = Object.assign(document.createElement('div'), { ...props })
    const sh = el.attachShadow(shopts)
    sh.adoptedStyleSheets = sheets
    sh.append(element)
    return el
  }
}
function use_protocol (petname) {
  return ({ protocol, state, on = { } }) => {
    if (petname in state.aka) throw new Error('petname already initialized')
    const { id } = state
    const invalid = on[''] || (message => console.error('invalid type', message))
    if (protocol) return handshake(protocol(Object.assign(listen, { id })))
    else return handshake
    // ----------------------------------------
    // @TODO: how to disconnect channel
    // ----------------------------------------
    function handshake (send) {
      state.aka[petname] = send.id
      const channel = state.net[send.id] = { petname, mid: 0, send, on }
      return protocol ? channel : Object.assign(listen, { id })
    }
    function listen (message) {
      const [from] = message.head
      const by = state.aka[petname]
      if (from !== by) return invalid(message) // @TODO: maybe forward
      console.log(`[${id}]:${petname}>`, message)
      const { on } = state.net[by]
      const action = on[message.type] || invalid
      action(message)
    }
  }
}
// ----------------------------------------------------------------------------
function resources (pool) {
  var num = 0
  return factory => {
    const prefix = num++
    const get = name => {
      const id = prefix + name
      if (pool[id]) return pool[id]
      const type = factory[name]
      return pool[id] = type()
    }
    return Object.assign(get, factory)
  }
}
}).call(this)}).call(this,require('_process'),"/web/demo.js","/web")
},{"../":3,"_process":1,"theme":20}],20:[function(require,module,exports){
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

},{}]},{},[19]);
