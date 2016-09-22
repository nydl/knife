// Knife.js
// (c) 2016 Walter Yu from zepto
// remove more not use function, keep smaller for h5.
// Knife.js may be freely distributed under the MIT license.

const $ = require('./kdom');

(function (global, factory) {
  if (typeof define === 'function' && define.amd)
    define(function () {
      return factory(global)
    })
  else
    factory(global)
}(typeof window !== "undefined" ? window : this, function (window) {
  // 函数内私有变量及函数
  var undefined, key,
    emptyArray = [],
    concat = emptyArray.concat,
    filter = emptyArray.filter,
    slice = emptyArray.slice,

    document = window.document,
    elementDisplay = {},
    cssNumber = {
      'column-count': 1,
      'columns': 1,
      'font-weight': 1,
      'line-height': 1,
      'opacity': 1,
      'z-index': 1,
      'zoom': 1
    },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

  // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
    adjacencyOperators = ['after', 'prepend', 'before', 'append'],

    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    simpleSelectorRE = /^[\w-]*$/,

  // 内部变量
    knife = $.knife,
    camelize, uniq,
    tempParent = document.createElement('div')

  knife.matches = function (element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
      element.mozMatchesSelector || element.oMatchesSelector ||
      element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~knife.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function compact(array) {
    return filter.call(array, function (item) {
      return item != null
    })
  }

  function flatten(array) {
    return array.length > 0 ? $.fn.concat.apply([], array) : array
  }

  camelize = function (str) {
    return str.replace(/-+(.)?/g, function (match, chr) {
      return chr ? chr.toUpperCase() : ''
    })
  }
  function dasherize(str) {
    return str.replace(/::/g, '/')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .replace(/_/g, '-')
      .toLowerCase()
  }

  uniq = function (array) {
    return filter.call(array, function (item, idx) {
      return array.indexOf(item) == idx
    })
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function (node) {
        if (node.nodeType == 1) return node
      })
  }

  // `$.knife.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  knife.fragment = function (html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function () {
        container.removeChild(this)
      })
    }

    if ($.isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function (key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.knife.qsa` is Knife's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overridden in plugins.
  knife.qsa = function (element, selector) {
    var found,
      maybeID = selector[0] == '#',
      maybeClass = !maybeID && selector[0] == '.',
      nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
      isSimple = simpleSelectorRE.test(nameOnly)

    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
        slice.call(
          isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
            maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
              element.getElementsByTagName(selector) : // Or a tag
            element.querySelectorAll(selector) // Or it's not simple, and we need to query all
        )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  function funcArg(ctx, arg, idx, payload) {
    return $.isFunction(arg) ? arg.call(ctx, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
      value == "true" ||
      ( value == "false" ? false :
        value == "null" ? null :
          +value + "" == value ? +value :
            /^[\[\{]/.test(value) ? $.parseJSON(value) :
              value )
        : value
    } catch (e) {
      return value
    }
  }

  // 静态属性,可直接调用
  $.isEmptyObject = function (obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function (elem, array, i) {
    return emptyArray.indexOf.call(array, elem, i)
  }
  $.camelCase = camelize

  $.map = function (elements, callback) {
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.grep = function (elements, callback) {
    return filter.call(elements, callback)
  }

  $.parseJSON = JSON.parse

  // Define methods that will be available on all
  // Knife collections
  // 原型, 在$()后可调用
  // var fn = {
  $.fn.concat = function () {
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = knife.isK(value) ? value.toArray() : value
      }
      return concat.apply(knife.isK(this) ? this.toArray() : this, args)
    }
    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
  $.fn.map = function (fn) {
      return $($.map(this, function (el, i) {
        return fn.call(el, i, el)
      }))
    }
  $.fn.slice = function () {
      return $(slice.apply(this, arguments))
    }
  $.fn.get = function (idx) {
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    }
  $.fn.toArray = function () {
      return this.get()
    }
  $.fn.size = function () {
      return this.length
    }
  $.fn.remove = function () {
      return this.each(function () {
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    }
  $.fn.each = function (callback) {
      emptyArray.every.call(this, function (el, idx) {
        return callback.call(el, idx, el) !== false
      })
      return this
    }
  $.fn.filter = function (selector) {
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function (element) {
        return knife.matches(element, selector)
      }))
    }
  $.fn.find = function (sel) {
      var result, $this = this
      if (!sel) result = $()
      else if (this.length == 1) result = $(knife.qs(sel, this[0]))
      /*
       else if (typeof sel == 'object')
       result = $(sel).filter(function () {
       var node = this
       return emptyArray.some.call($this, function (parent) {
       return $.contains(parent, node)
       })
       })
       else if (this.length == 1) result = $(knife.qsa(this[0], sel))
       else result = this.map(function () {
       return knife.qsa(this, sel)
       })
       */
      return result
    }
  $.fn.contents = function () {
      return this.map(function () {
        return this.contentDocument || slice.call(this.childNodes)
      })
    }
  $.fn.empty = function () {
      return this.each(function () {
        this.innerHTML = ''
      })
    }
    // `pluck` is borrowed from Prototype.js
  $.fn.pluck = function (property) {
      return $.map(this, function (el) {
        return el[property]
      })
    }
  $.fn.html = function (html) {
      var rs = $.html(this[0], html);
      return (0 in arguments) ? this : rs
    },
    $.fn.text = function (text) {
      return 0 in arguments ?
        this.each(function (idx) {
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : '' + newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    }
  $.fn.attr = function (name, value) {
      var rs = $.attr(this[0], name, value);
      return (1 in arguments) ? this : rs
    }
  $.fn.removeAttr = function (name) {
      $.removeAttr(this[0], name);
      return this
    }
  $.fn.prop = function (name, value) {
      var rs = $.prop(this[0], name, value);
      return (1 in arguments) ? this : rs
    }
  $.fn.removeProp = function (name) {
      $.removeProp(this[0], name);
      return this
    }
  $.fn.hasClass = function (name) {
      return $.hasClass(this[0], name)
    }
  $.fn.addClass = function (name) {
      $.addClass(this[0], name);
      return this
    }
  $.fn.removeClass = function (name) {
      $.removeClass(this[0], name);
      return this
    }

  // for now
  $.fn.detach = $.fn.remove;

  // Generate the `width` and `height` functions
  ['width', 'height'].forEach(function (dimension) {
    var dimensionProperty =
      dimension.replace(/./, function (m) {
        return m[0].toUpperCase()
      })

    $.fn[dimension] = function (value) {
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function (idx) {
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function (operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function () {
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function (arg) {
          argType = type(arg)
          return argType == "object" || argType == "array" || arg == null ?
            arg : zepto.fragment(arg)
        }),
        parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function (_, target) {
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
          operatorIndex == 1 ? target.firstChild :
            operatorIndex == 2 ? target :
              null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function (node) {
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function (el) {
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
              (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
      $(html)[operator](this)
      return this
    }
  })

  // Export internal API functions in the `$.knife` namespace
  $.knife.uniq = uniq
  $.knife.deserializeValue = deserializeValue

  return $
}))
