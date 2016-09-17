/**
 * Created by way on 16/8/28.
 * event trigger、define
 * 使用伪dom方式实现 原生及自定义事件 响应与触发
 * 每个事件只支持 一个响应, 添加响应自动卸载原来的事件
 * 支持 匿名响应函数, 多次加载只有最后一个起作用
 */

const $ = require('./kdom');

// 一个包中所有引用共享该变量!
const events = {};

// 创建用户事件类
if (!window.CustomEvent) {
  window.CustomEvent = function (type, opts) {
    const opt = opts || {bubbles: false, cancelable: false, detail: undefined};
    const ev = document.createEvent('CustomEvent');
    ev.initCustomEvent(type, opt.bubbles, opt.cancelable, opt.detail);
    return ev;
  };

  window.CustomEvent.prototype = window.Event.prototype;
}

// 加在原型对象上, 所有对象实例均可调用

$.on = function (event, fn) {
  events[event] = events[name] || [];
  events[event].push(fn);
  return this;
};

/**
 * 添加事件, 标准dom事件或自定义事件
 * 只能加载一个处理函数, 覆盖式加载, 自动卸载之前的加载
 * @param event 事件名称
 * @param fn
 * @param capture
 * @returns {$}
 */
$.fn.on = function (event, fn, capture = false) {
  const evs = this.events = this.events || {};
  const ev = evs[event] = evs[event] || {};
  if (ev.fn)
    this[0].removeEventListener(event, ev.fn, capture || false);
  ev.fn = fn;
  ev.capture = capture;
  this[0].addEventListener(event, ev.fn, capture);
  return this;
};

// 触发一次
$.fn.once = function (event, fn, capture = false) {
  const evs = this.events = this.events || {};
  const ev = evs[event] = evs[event] || {};
  ev.once = true;
  /*
   evs[ev].fn = () => {
   // 卸载自己
   this[0].removeEventListener(ev, arguments.callee, capture || false);
   fn.apply(this, fn.arguments);
   }

   evs[ev].capture = capture;
   this[0].addEventListener(ev, evs[ev].fn, capture);
   */
  return this.on(ev, fn, capture);
};

// 触发一次
$.once = function (event, fn) {
  fn._once = true;
  $.on(event, fn);
  return this;
};

/*
$.once = function (el, ev, callback) {
  el.addEventListener(ev, function () {
    el.removeEventListener(ev, arguments.callee, false)
    callback()
  }, false)
}
*/

/**
 * 删除事件
 * @param event
 * @param handler 缺少删除该事件, 指定处理函数,则只删除指定处理函数
 * @returns {off}
 */
$.fn.off = function (event) {
  if (this.events && this.events[event]) {
    this[0].removeEventListener(event, this.events[event].fn, this.events[event].capture || false);
    delete this.events[event];
  }
  return this;
};

$.off = function (event, fn = false) {
  if (fn)
    events[event].splice(events[event].indexOf(fn), 1);
  else
    delete events[event];

  return this;
};

/**
 * 通过 dom 触发 事件
 * @param event
 * @returns {$}
 */
$.fn.trigger = function (event) {
  const ev = new CustomEvent(event, {
    bubbles: true,
    cancelable: true
  });

  // remove handlers added with 'once'
  const evs = this.events = this.events || {};
  if (evs[event] && evs[event].once)
    this.off(event);

  this[0].dispatchEvent(ev);
  return this;
};

/**
 * 直接带参数触发自定义
 * @param event
 * @param args
 * @returns {emit}
 */
$.fn.emit = function (event, ...args) {
  const evs = this.events = this.events || {};
  const ev = evs[event] = evs[event] || {};
  // only fire handlers if they exist
  if (ev.once)
    this.off(event);
  // set 'this' context, pass args to handlers
  ev.fn.apply(this, args);

  return this;
};

$.emit = function (event, ...args) {
  // cache the events, to avoid consequences of mutation
  const cache = events[event] && events[event].slice();

  // only fire handlers if they exist
  if (cache) {
    cache.forEach(fn => {
      // remove handlers added with 'once'
      if (fn._once)
        $.off(event, fn);
      // set 'this' context, pass args to handlers
      fn.apply(this, args);
    });
  }

  return this;
};

// export {on, off, once, emit, emit as trigger};
export default $;

