/**
 * Created by way on 16/8/28.
 * 图片延迟加载
 * 全局对象
 */

// import $ from './kevent';
import $ from './kevent';

// private
let prevLoc = getLoc();
let ticking;

let nodes;
let windowHeight;

// options
let sets = {
  normal: 'nor',
  retina: 'ret',
  srcset: 'set',
  threshold: 0
};

// feature detection
// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/img/srcset.js
const srcset = document.body.classList.contains('srcset') || 'srcset' in document.createElement('img');

// device pixel ratio
// not supported in IE10 - https://msdn.microsoft.com/en-us/library/dn265030(v=vs.85).aspx
const dpr = window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI;

// location helper
function getLoc() {
  return window.scrollY || window.pageYOffset;
}

// debounce helpers
function requestScroll() {
  // alert('requestScroll');
  prevLoc = getLoc();
  requestFrame();
}

function requestFrame() {
  if (!ticking) {
    requestAnimationFrame(() => check());
    ticking = true;
  }
}

// offset helper
function getOffset(node) {
  return node.getBoundingClientRect().top + prevLoc;
}

// in viewport helper
function inViewport(node) {
  const viewTop = prevLoc;
  const viewBot = viewTop + windowHeight;

  const nodeTop = getOffset(node);
  const nodeBot = nodeTop + node.offsetHeight;

  const offset = (sets.threshold / 100) * windowHeight;

  return nodeBot >= viewTop - offset
    && nodeTop <= viewBot + offset;
}

// source helper
function setSource(node) {
  $.emit('lazy:src:before', node);

  // prefer srcset, fallback to pixel density
  if (srcset && node.hasAttribute(sets.srcset)) {
    node.setAttribute('srcset', node.getAttribute(sets.srcset));
  } else {
    const retina = dpr > 1 && node.getAttribute(sets.retina);
    node.setAttribute('src', retina || node.getAttribute(sets.normal));
  }

  $.emit('lazy:src:after', node);
  [sets.normal, sets.retina, sets.srcset].forEach(attr => node.removeAttribute(attr));
  update();
}

// API
//----------------------------------------

/**
 * 启动延迟加载, 加载事件, ready时调用!
 * @param root 根对象, scroll的目标对象
 * @returns {init}
 */
function start(root, opts) {
  if (opts) {
    sets = {
      normal: opts.normal || sets.normal,
      retina: opts.retina || sets.retina,
      srcset: opts.srcset || sets.srcset,
      threshold: opts.threshold || sets.threshold
    };
  }

// sui window scroll event invalid!!!
  // ['scroll', 'resize'].forEach(event => window[action](event, requestScroll));
  ['scroll', 'resize'].forEach(event => root['addEventListener'](event, requestScroll));
  return this;
}

/**
 * 停止延迟加载,卸载事件!
 * @param root 根对象, scroll的目标对象
 * @returns {init}
 */
function stop(root) {
  // sui window scroll event invalid!!!
  // ['scroll', 'resize'].forEach(event => window[action](event, requestScroll));
  ['scroll', 'resize'].forEach(event => root['removeEventListener'](event, requestScroll));
  return this;
}

/**
 * 检查是否可视,如果可视则加载图片
 * @returns {check}
 */
function check() {
  windowHeight = window.innerHeight;
  nodes.forEach(node => inViewport(node) && setSource(node));
  ticking = false;
  return this;
}

/**
 * 更新未加载图片节点
 * @returns {update}
 */
function update() {
  nodes = Array.prototype.slice.call(document.querySelectorAll(`[${sets.normal}]`));
  return this;
}

export {start, stop, check, update};
