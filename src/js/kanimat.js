/**
 * Created by way on 16/9/13.
 */

import $ from './kevent';

/* jshint ignore:start */
$.requestAnimationFrame = function (callback) {
  if (window.requestAnimationFrame) return window.requestAnimationFrame(callback);
  else if (window.webkitRequestAnimationFrame) return window.webkitRequestAnimationFrame(callback);
  else if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame(callback);
  else {
    return window.setTimeout(callback, 1000 / 60);
  }
};
$.cancelAnimationFrame = function (id) {
  if (window.cancelAnimationFrame) return window.cancelAnimationFrame(id);
  else if (window.webkitCancelAnimationFrame) return window.webkitCancelAnimationFrame(id);
  else if (window.mozCancelAnimationFrame) return window.mozCancelAnimationFrame(id);
  else {
    return window.clearTimeout(id);
  }
};
/* jshint ignore:end */

// 动画处理
$.cssEvent = function (events, callback) {
  const dom = this;// jshint ignore:line

  function fireCallBack(e) {
    /*jshint validthis:true */
    if (e.target !== this) return;
    callback.call(this, e);
    for (let i = 0; i < events.length; i++) {
      dom.off(events[i], fireCallBack);
    }
  }

  if (callback) {
    for (let i = 0; i < events.length; i++) {
      dom.on(events[i], fireCallBack);
    }
  }
};

// 动画事件
//------------------------

$.fn.animationEnd = function (callback) {
  $.cssEvent.call(this, ['webkitAnimationEnd', 'animationend'], callback);
  return this;
};

$.fn.transitionEnd = function (callback) {
  $.cssEvent.call(this, ['webkitTransitionEnd', 'transitionend'], callback);
  return this;
};

$.fn.transition = function (duration) {
  let dur = duration;
  if (typeof duration !== 'string') {
    dur = duration + 'ms';
  }
  for (let i = 0; i < this.length; i++) {
    const elStyle = this[i].style;
    elStyle.webkitTransitionDuration = elStyle.MozTransitionDuration
      = elStyle.transitionDuration = dur;
  }
  return this;
};

$.fn.transform = function (transform) {
  for (let i = 0; i < this.length; i++) {
    const elStyle = this[i].style;
    elStyle.webkitTransform = elStyle.MozTransform = elStyle.transform = transform;
  }
  return this;
};

export default $;
