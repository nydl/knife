/**
 * Created by way on 16/8/29.
 * knife 引入模块
 * 可添加扩充、覆盖 k模块的功能
 */

const $ = require('./knife');

['width', 'height'].forEach(function (dimension) {
  var Dimension = dimension.replace(/./, function (m) {
    return m[0].toUpperCase();
  });
  $.fn['outer' + Dimension] = function (margin) {
    var elem = this;
    if (elem) {
      var size = elem[dimension]();
      var sides = {
        'width': ['left', 'right'],
        'height': ['top', 'bottom']
      };
      sides[dimension].forEach(function (side) {
        if (margin) size += parseInt(elem.css('margin-' + side), 10);
      });
      return size;
    } else {
      return null;
    }
  };
});

/*
$.fn.data = function(key, value) {
  var tmpData = $(this).dataset();
  if (!key) {
    return tmpData;
  }
  // value may be 0, false, null
  if (typeof value === 'undefined') {
    // Get value
    var dataVal = tmpData[key],
      __eD = this[0].__eleData;

    //if (dataVal !== undefined) {
    if (__eD && (key in __eD)) {
      return __eD[key];
    } else {
      return dataVal;
    }

  } else {
    // Set value,uniformly set in extra ```__eleData```
    for (var i = 0; i < this.length; i++) {
      var el = this[i];
      // delete multiple data in dataset
      if (key in tmpData) delete el.dataset[key];

      if (!el.__eleData) el.__eleData = {};
      el.__eleData[key] = value;
    }
    return this;
  }
};
*/

// 获取scroller对象
$.fn.getScroller = function(content) {
  // 以前默认只能有一个无限滚动，因此infinitescroll都是加在content上，现在允许里面有多个，因此要判断父元素是否有content
  content = content.hasClass('content') ? content : content.parents('.content');
  if (content) {
    return $(content).data('scroller');
  } else {
    return $('.content.javascript-scroll').data('scroller');
  }
};

$.fn.scrollTop = function (value) {
  if (!this.length) return
  var hasScrollTop = 'scrollTop' in this[0]
  if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
  return this.each(hasScrollTop ?
    function () {
      this.scrollTop = value
    } :
    function () {
      this.scrollTo(this.scrollX, value)
    })
}

export default $;