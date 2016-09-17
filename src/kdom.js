/**
 * Created by way on 16/8/28.
 * 静态 dom 常用操作, 通过 $ 静态属性、方法访问
 */

(function (global, factory) {
  if (typeof define === 'function' && define.amd)
    define(function () {
      return factory(global)
    })
  else
    factory(global)
}(typeof window !== "undefined" ? window : this, function (window) {
  var Knife = (function () {
    // 函数内私有变量及函数
    var $,
      emptyArray = [],
      classCache = {},
      idCache = {},
      readyRE = /complete|loaded|interactive/,
      class2type = {},
      toString = class2type.toString,
      fragmentRE = /^\s*<(\w+|!)[^>]*>/,
      knife = {},
      propMap = {
        'tabindex': 'tabIndex',
        'readonly': 'readOnly',
        'for': 'htmlFor',
        'class': 'className',
        'maxlength': 'maxLength',
        'cellspacing': 'cellSpacing',
        'cellpadding': 'cellPadding',
        'rowspan': 'rowSpan',
        'colspan': 'colSpan',
        'usemap': 'useMap',
        'frameborder': 'frameBorder',
        'contenteditable': 'contentEditable'
      }

    function classRE(name) {
      return name in classCache ?
        classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    // 私有方法
    function funcArg(ctx, arg, idx, payload) {
      return $.isFunction(arg) ? arg.call(ctx, idx, payload) : arg
    }

    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    document.ready = function (callback) {
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback()
      else document.addEventListener('DOMContentLoaded', function () {
        document.removeEventListener('DOMContentLoaded', arguments.callee, false)
        callback()
      }, false)
    }

    // 构造函数
    function K(dom, sel) {
      this.selector = sel || ''
      this[0] = this.dom = dom;
      this.length = 1;
      if (!dom)
        this.length = 0;
    }

    // `$.knife.K` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Knife functions
    // to the array. This method can be overridden in plugins.
    knife.K = function (dom, sel) {
      return new K(dom, sel)
    }

    // `$.knife.isK` should return `true` if the given object is a Knife
    // collection. This method can be overridden in plugins.
    knife.isK = function (obj) {
      return obj instanceof knife.K
    }

    knife.id = function (x) {
      return x in idCache ?
        idCache[x] : (idCache[x] = knife.K(document.getElementById(x), x))
    }

    // knife 实现
    knife.fragment = function (html, name, properties) {
    }
    // `$.knife.init` is Knife's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overridden in plugins.
    knife.init = function (sel, root) {
      let dom;
      // If nothing given, return an empty Zepto collection
      if (!sel) return knife.K()
      // Optimize for string selectors
      if (typeof sel === 'string') {
        if (sel[0] === '#')
          return knife.id(sel.substr(1));

        if (sel[0] == '<' && fragmentRE.test(sel))
          dom = knife.fragment(sel, RegExp.$1, root), sel = null
        else
          dom = $.qu(sel, root);
      } else if (knife.isK(sel))
        return sel
      // Wrap DOM nodes.
      else if ($.isObject(sel))
        dom = sel, sel = null

      // create a new Knife collection from the nodes found
      return knife.K(dom, sel);
    }

    // `$` will be the base `Knife` object. When calling this
    // function just call `$.knife.init, which makes the implementation
    // details of selecting nodes and creating Knife collections
    // patchable in plugins.
    // 实例化函数调用, $() 返回一个新的实例!
    $ = function (selector, context) {
      return knife.init(selector, context)
    }

    $.K = K
    $.knife = knife

    // plugin compatibility
    $.uuid = 0
    $.expr = {}
    $.noop = function () {
    }

    // 静态属性,可直接调用
    $.type = function (obj) {
      return obj == null ? String(obj) :
      class2type[toString.call(obj)] || 'object'
    }

    $.isFunction = function (value) {
      return $.type(value) == 'function'
    }
    $.isWindow = function (obj) {
      return obj != null && obj == obj.window
    }

    $.isDocument = function (obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    $.isObject = function (obj) {
      return $.type(obj) == 'object'
    }
    $.isPlainObject = function (obj) {
      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }
    $.isArray = Array.isArray ||
      function (object) {
        return object instanceof Array
      }
    $.isNumeric = function (val) {
      var num = Number(val), type = typeof val
      return val != null && type != 'boolean' &&
        (type != 'string' || val.length) && !isNaN(num) && isFinite(num) || false
    }
    $.trim = function (str) {
      return str == null ? '' : String.prototype.trim.call(str)
    }

    /**
     * 判断浏览器是否支持 sessionStorage，支持返回 true，否则返回 false
     * @returns {Boolean}
     */
    function hasStorage() {
      var mod = 'krouter.storage.ability'
      try {
        sessionStorage.setItem(mod, mod)
        sessionStorage.removeItem(mod)
        return true
      } catch(e) {
        return false
      }
    }

    $.support = (function () {
      var support = {
        touch: !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch),
        storage: hasStorage()
      }
      return support
    })()

    $.touchEvents = {
      start: $.support.touch ? 'touchstart' : 'mousedown',
      move: $.support.touch ? 'touchmove' : 'mousemove',
      end: $.support.touch ? 'touchend' : 'mouseup'
    };

    $.likeArray = function (obj) {
      var length = !!obj && 'length' in obj && obj.length,
        type = $.type(obj)

      return 'function' != type && !$.isWindow(obj) && (
          'array' == type || length === 0 ||
          (typeof length == 'number' && length > 0 && (length - 1) in obj)
        )
    }
    $.each = function (els, callback) {
      var i, key
      if ($.likeArray(els)) {
        for (i = 0; i < els.length; i++)
          if (callback.call(els[i], i, els[i]) === false) return els
      } else {
        for (key in els)
          if (callback.call(els[key], key, els[key]) === false) return els
      }
      return els
    }
    // Populate the class2type map
    $.each('Boolean Number String Function Array Date RegExp Object Error'.split(' '),
      function (i, name) {
        class2type['[object ' + name + ']'] = name.toLowerCase()
      })

    $.id = function (x) {
      return document.getElementById(x);
      return x in idCache ?
        idCache[x] : (idCache[x] = knife.K(document.getElementById(x), x))
    }
    $.qu = function (sel, root) {
      if (root)
        return knife.isK(root) ? root[0].querySelector(sel) : root.querySelector(sel);
      return document.querySelector(sel);
    }
    // 返回数组, 便于 forEach
    $.qus = function (sel, root) {
      let es = null;
      if (root)
        es = knife.isK(root) ? root[0].querySelectorAll(sel) : root.querySelectorAll(sel);
      else
        es = document.querySelectorAll(sel);
      if (es.length > 0)
        return Array.prototype.slice.call(es);
      else
        return [];
    }
    $.nms = function (name) {
      return document.getElementsByName(name)
    }
    $.tags = function (el, tag) {
      el = el || document;
      return el.getElementsByTagName(tag.toUpperCase())
    }
    $.dc = function (obj, tag, cls) {
      const el = document.createElement(tag);
      if (cls)
        el.className = cls;
      obj.appendChild(el);
      return el;
    }
    $.html = function (el, html) {
      if (html !== undefined) {
        var originHtml = el.innerHTML
        el.innerHTML = ''
        $(el).append(funcArg(el, html, 0, originHtml))
      } else
        return (el ? el.innerHTML : null)
    }
    $.attr = function (el, name, value) {
      var result
      if (!el) return ''
      if (typeof name == 'string' && value === undefined)
        return (el && el.nodeType == 1 && (result = el.getAttribute(name)) != null ? result : '') // undefined)

      if (el.nodeType !== 1) return false
      if (isObject(name)) for (key in name) setAttribute(el, key, name[key])
      else setAttribute(el, name, funcArg(el, value, 0, el.getAttribute(name)))
      return true
    }
    $.attrn = function (el, name) {
      if (!el)
        return '';

      let rc = el.getAttribute(name);
      if (rc == null)
        rc = '';
      if (rc)
        rc = `${name}=${rc};`;
      return rc;
    }
    $.removeAttr = function (el, name) {
      el.nodeType === 1 && name.split(' ').forEach(function (attribute) {
        setAttribute(el, attribute)
      })
    }
    $.prop = function (el, name, value) {
      name = propMap[name] || name
      return (value !== undefined) ?
        (el[name] = funcArg(el, value, 0, el[name]), true)
        : (el && el[name])
    }
    $.removeProp = function (el, name) {
      name = propMap[name] || name
      delete el[name]
    }
    // access className property while respecting SVGAnimatedString
    $.className = function (node, value) {
      var cls = (node.className || '').trim(),
        svg = cls && cls.baseVal !== undefined

      if (value === undefined) return svg ? cls.baseVal : cls
      svg ? (cls.baseVal = value) : (node.className = value)
    }
    $.hasClass = function (el, name) {
      if (!el || !name) return false
      return classRE(name).test($.className(el));
    }
    $.addClass = function (el, name) {
      if (!el || !name) return false
      var cs = []
      var cl = $.className(el), newName = funcArg(el, name, 0, cl)
      newName.split(/\s+/g).forEach(klass => {
        if (!$.hasClass(el, klass)) cs.push(klass)
      })
      cs.length && $.className(el, cl + (cl ? ' ' : '') + cs.join(' '))
      return true
    }
    $.removeClass = function (el, name) {
      if (name === undefined) return $.className(el, '')
      var classList = $.className(el)
      funcArg(el, name, 0, classList).split(/\s+/g).forEach(function (cls) {
        classList = classList.replace(classRE(cls), ' ')
      })
      $.className(el, classList.trim())
    }
    // 第一个子元素节点或非空文本节点 Object.prototype. ie 不支持
    $.firstChild = function (el) {
      let RC = null;
      if (!el)
        return null;

      try {
        for (let i = 0; i < el.childNodes.length; i++) {
          const nd = el.childNodes[i];

          // alert(nd.nodeType + "/" + nd.nodeName + "/"
          //	+ (nd.nodeValue ? escape(nd.nodeValue) : "null") );

          if (nd.nodeType === 1// 元素节点
              // 有效文本节点，nodeName == "#text"
            || (nd.nodeType === 3 && nd.nodeValue && nd.nodeValue.trim())) {
            RC = nd;
            break;
          }
        }
      } catch (e) {
        alert(`firstChild exp:${e.message}`);
      }
      return RC;
    }
    // 下一个子元素节点或非空文本节点
    $.nextNode = function (el) {
      let RC = null;
      if (!el)
        return null;

      let nd = el.nextSibling;
      while (nd) {
        if (nd.nodeType === 1// 元素节点
            // 有效文本节点，nodeName == "#text"
          || (nd.nodeType === 3 && nd.nodeValue && nd.nodeValue.trim())) {
          RC = nd;
          break;
        }
        nd = nd.nextSibling;
      }
      return RC;
    }
    // 最后一个子元素节点或非空文本节点 Object.prototype. ie 不支持
    $.lastChild = function (el) {
      let RC = null;
      if (!el)
        return null;

      for (let i = el.childNodes.length - 1; i >= 0; i--) {
        const nd = el.childNodes[i];

        // alert(nd.nodeType + "/" + nd.nodeName + "/"
        //	+ (nd.nodeValue ? escape(nd.nodeValue) : "null") );

        if (nd.nodeType === 1// 元素节点，元素节点没有 nodeValue
            // 有效文本节点，nodeName == "#text"
          || (nd.nodeType === 3 && nd.nodeValue && nd.nodeValue.trim())) {
          RC = nd;
          break;
        }
      }
      return RC;
    }
    // 元素子节点或非空文本节点数量
    $.childCount = function (el) {
      let RC = 0;

      if (!el)
        return 0;

      for (let i = 0; i < el.childNodes.length; i++) {
        const nd = el.childNodes[i];

        // alert(nd.nodeType + "/" + nd.nodeName + "/"
        //	+ (nd.nodeValue ? escape(nd.nodeValue) : "null") );

        if (nd.nodeType === 1// 元素节点，元素节点没有 nodeValue
            // 有效文本节点，nodeName === "#text"
          || (nd.nodeType === 3 && nd.nodeValue && nd.nodeValue.trim())) {
          RC++;
        }
      }
      return RC;
    }
    $.hasChild = function(el) {
      if (!el)
        return false;
      const child = el.children;
      return child.length > 0;
    }

    // 得到obj的上级元素TagName
    // ff parentNode 会返回 空 节点
    // ff textNode节点 没有 tagName
    $.upperTag = function (el, tagName) {
      let RC = null;

      const tn = tagName.toUpperCase();

      let i = 0;
      let nd = el;
      while (nd) {
        i++;
        if (i >= 10)
          break;
        if (nd.tagName && nd.tagName === tn) {
          RC = nd;
          break;
        }
        nd = nd.parentNode;
      }
      return RC;
    }

    // 得到obj的上级元素TagName
    // ff parentNode 会返回 空 节点
    // ff textNode节点 没有 tagName
    /**
     * 获取 指定 tagName的子元素
     * @param el
     * @param tagName
     * @returns {*}
     */
    $.childTag = function (el, tag) {
      let RC = null;

      if (!el)
        return null;

      try {
        for (let i = 0; i < el.childNodes.length; i++) {
          const nd = el.childNodes[i];

          if (nd.tagName && nd.tagName === tag.toUpperCase()) {
            RC = nd;
            break;
          }
        }
      } catch (e) {
        alert(`childTag exp:${e.message}`);
      }

      return RC;
    }
    /**
     * 光标放入尾部
     * @param el
     */
    $.cursorEnd = function (el) {
      el.focus();

      if (typeof window.getSelection !== 'undefined'
        && typeof document.createRange !== 'undefined') {
        const rg = document.createRange();
        rg.selectNodeContents(el);
        // 合并光标
        rg.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rg);
      } else if (typeof document.body.createTextRangrge !== 'undefined') {
        const rg = document.body.createTextRange();
        rg.moveToElementText(el);
        // 合并光标
        rg.collapse(false);
        // textRange.moveStart('character', 3);
        rg.select();
      }
    }

    /**
     * 获取光标位置
     * @param el
     * @returns {number}
     */
    $.getCursorPos = function (el) {
      let rs = 0;

      if (!el)
        return 0;

      // obj.focus();
      if (el.selectionStart) { // IE以外
        rs = el.selectionStart;
      } else { // IE
        let rg = null;
        if (el.tagName.toLowerCase() === 'textarea') { // TEXTAREA
          rg = event.srcElement.createTextRange();
          rg.moveToPoint(event.x, event.y);
        } else { // Text
          rg = document.selection.createRange();
        }
        rg.moveStart('character', -event.srcElement.value.length);
        // rg.setEndPoint("StartToStart", obj.createTextRange())
        rs = rg.text.length;
      }
      return rs;
    }

    // 得到光标的位置
    $.getCursorPosition = function (el) {
      const qswh = '@#%#^&#*$';
      // obj.focus();
      const rng = document.selection.createRange();
      rng.text = qswh;
      const nPosition = el.value.indexOf(qswh)
      rng.moveStart('character', -qswh.length)
      rng.text = '';
      return nPosition;
    }

    // 设置光标位置
    $.setCursorPos = function (el, pos) {
      const rg = el.createTextRange();
      rg.collapse(true);
      rg.moveStart('character', pos);
      rg.select();
    }

    $.moveFirst = function () {
      this.rowindex = 0;
    }

    // Define methods that will be available on all
    // Knife collections
    // 原型, 在$()后可调用
    $.fn = {
      constructor: knife.K,
      length: 0,

      // Because a collection acts like an array
      // copy over these useful array functions.
      forEach: emptyArray.forEach,
      reduce: emptyArray.reduce,
      push: emptyArray.push,
      sort: emptyArray.sort,
      splice: emptyArray.splice,
      indexOf: emptyArray.indexOf,
    };

    // 返回 $ 类,可以直接调用其静态属性和方法
    return $
  })();

  // If `$` is not yet defined, point it to `Knife`
  window.Knife = Knife
  window.$ === undefined && (window.$ = Knife)
  return Knife
}))
