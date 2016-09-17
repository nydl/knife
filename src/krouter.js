
/**
 * Created by way on 16/9/13.
 * 基于 knife ui的 路由组件
 * 通过 hash实现页面切换导航,分离page到不同文件,实现动态加载,动画切换
 * 由于 pushState 不支持微信侧滑返回, 因此采用了最传统的 hash模式,兼容性最好。
 * 建议与传统 hash 区分开来, 请使用 #! 作为 路由 hash!!!
 */

import $ from './kevent';

const CFG = {
  sectionGroupClass: 'page-group',
  // 用来辅助切换时表示 page 是 visible 的,
  // 之所以不用 curPageClass，是因为 page-current 已被赋予了「当前 page」这一含义而不仅仅是 display: block
  // 并且，别的地方已经使用了，所以不方便做变更，故新增一个
  visiblePageClass: 'page-visible'
};

const DIRECTION = {
  leftToRight: 'from-left-to-right',
  rightToLeft: 'from-right-to-left'
};

const EVENTS = {
  pageLoadStart: 'pageLoadStart', // ajax 开始加载新页面前
  pageLoadCancel: 'pageLoadCancel', // 取消前一个 ajax 加载动作后
  pageLoadError: 'pageLoadError', // ajax 加载页面失败后
  pageLoadComplete: 'pageLoadComplete', // ajax 加载页面完成后（不论成功与否）
  pageAnimationStart: 'pageAnimationStart', // 动画切换 page 前
  pageAnimationEnd: 'pageAnimationEnd', // 动画切换 page 结束后
  beforePageRemove: 'beforePageRemove', // 移除旧 document 前（适用于非内联 page 切换）
  pageRemoved: 'pageRemoved', // 移除旧 document 后（适用于非内联 page 切换）
  // page 切换前，pageAnimationStart 前，beforePageSwitch后会做一些额外的处理才触发 pageAnimationStart
  beforePageSwitch: 'beforePageSwitch',
  pageInit: 'pageInitInternal' // 目前是定义为一个 page 加载完毕后（实际和 pageAnimationEnd 等同）
};

/**
 * 获取 url 的 fragment（即 hash 中去掉 # 的剩余部分）
 *
 * 如果没有则返回字符串
 * 如: http://example.com/path/?query=d#123 => 123
 *
 * @param {String} url url
 * @returns {String}
 */
function getHash(url) {
  let pos = url.indexOf('#!');
  if (pos !== -1)
    pos++;
  else
    pos = url.indexOf('#');

  return pos !== -1 ? url.substring(pos + 1) : ''; // ??? '/'
}

// google 支持 #! 格式
function setHash(url) {
  let hash = url;
  if (url[0] !== '!')
    hash = `!${url}`;
  location.hash = hash;
}

/**
 * 修改微信 title
 */
function setTitle(val) {
  if(document.title === val)
    return;

  if (/MicroMessenger/i.test(navigator.userAgent)) {
    setTimeout(() => {
      // 利用iframe的onload事件刷新页面
      document.title = val;

      const fr = document.createElement('iframe');
      // fr.style.visibility = 'hidden';
      fr.style.display = 'none';
      fr.src = 'img/favicon.ico';
      fr.onload = () => {
        setTimeout(() => {
          document.body.removeChild(fr);
        }, 0);
      };
      document.body.appendChild(fr);
    }, 0);
  } else
    document.title = val;
}

/**
 * 获取一个 url 的基本部分，即不包括 hash
 *
 * @param {String} url url
 * @returns {String}
 */
function getBaseUrl(url) {
  const pos = url.indexOf('#');
  return pos === -1 ? url.slice(0) : url.slice(0, pos);
}

/**
 * a very simple router for the **demo** of [weui](https://github.com/weui/weui)
 */
class Router {

  // default option
  _opts = {
    container: '#dvContainer',
    className: 'page',
    showClass: 'page-current'
  };

  _index = 1;

  // container element
  _$container = null;

  // array of route config
  _routes = [];

  // start route config
  _start = null;

  /**
   * constructor
   * @param opts
   */
  constructor(opts) {
    this._opts = Object.assign({}, this._opts, opts);
    this._$container = $.qu(this._opts.container);
  }

  set start(val) {
    this._start = val;
  }

  /**
   * initial，监控url hash变化
   * @returns {Router}
   */
  init(route) {
    if (route)
      this._start = route;
    else if (this._routes.length > 0)
      this._start = this._routes[0];

    // why not `history.pushState`? see https://github.com/weui/weui/issues/26, Router in wechat webview
    // pushState 不支持 微信侧滑返回
    // 不带 hash 到 hash,返回时, 不能触发该事件,因此一开始就要设置 hash,否则无法回到 首页!
    window.addEventListener('hashchange', (event) => {
      const oldHash = getHash(event.oldURL);
      const hash = getHash(event.newURL);
      // fix '/' repeat see https://github.com/progrape/router/issues/21
      if (oldHash === hash) return;

      // const state = history.state || {};
      // this.go(hash, state._index <= this._index);
      this.go(hash, oldHash);
    }, false);

/*
    if (history.state && history.state._index) {
      this._index = history.state._index;
    }

    this._index--;
*/
    this.bindLink();

    // 当前页面刷新加载
    if (getHash(location.href) === this._start.hash) // `#${url}`;
      this.go(this._start.hash);
    else
      setHash(this._start.hash);

    /*
     const hash = getHash(location.href);
     const route = this.getRoute(hash);
     this.go(route ? hash : this._start);
     */
    return this;
  }

  /**
   * use ontouchstart replace onclick, implement faskclick!
   */
  bindLink() {
    try {
      const links = $.qus('a');
      links.forEach(link => {
        if (link.href && link.href.indexOf('javascript:') === -1) {
          // # 替换为 #!, 支持 SEO
          // if (/#[^!]/.test(link.href))
          //   link.href = link.href.replace('#', '#!');

          link.ontouchstart = (ev) => {
            ev.preventDefault();
            if (!ev.touches.length)
              return;

            if ($.hasClass(link, 'back'))
              return history.back();

            // 不改变 hash,避免引起 普通 hash不能工作!
/*
            const hash = getHash(link.href);
            if (hash) {
              // alert(hash);
              location.hash = `!${hash}`;
            } else
              location.href = link.href;
*/
          };
        }
      });
    } catch(e) {
      alert(`bindLink exp: ${e.message}`);
    }
  }

  /**
   * go to the specify url
   * @param {String} url
   * @param {Boolean} isBack, default: false
   * @returns {Router}
   */
  go(url, fromUrl) {
    const r = this.getRoute(url);
    if (r) {
      // 返回
      const rs = this.lasts = this.lasts || [];
      let back = false;
      if (rs.length > 0 && rs[rs.length - 1].id === r.id) {
        rs.pop();
        back = true;
      } else if (this.route) {
        rs.push(this.route);
      }

      // 记录当前 route
      this.route = r;

      /*
       // 卸载
       const leave = (hasChildren) => {
       // if have child already, then remove it
       if (hasChildren) {
       const child = this._$container.children[0];
       if (isBack) {
       child.classList.add(this._opts.leave);
       }

       if (this._opts.leaveTimeout > 0) {
       setTimeout(() => {
       child.parentNode.removeChild(child);
       }, this._opts.leaveTimeout);
       } else
       child.parentNode.removeChild(child);
       }
       };
       */

      const enter = (html) => {
        let dv = $.id(r.id);
        if (!dv) {
          dv = document.createElement('div');
          dv.id = r.id;
          dv.innerHTML = html;

          if (r.className)
            $.addClass(dv, `${r.className}`);

          // 插在前面,否则会直接覆盖当前页,动画效果不好!
          if ($.hasChild(this._$container))
            this._$container.insertBefore(dv, this._$container.children[0]);
          else
            this._$container.appendChild(dv);
        }

        /*
         // add class name
         if (r.className || r.showClass) {
         $.removeClass($.qu(`.${r.showClass}`), r.showClass);
         $.addClass(dv, `${r.className} ${r.showClass}`);
         if (r.title)
         setTitle(r.title);
         }
         */

        /*
         // add class
         if (!isBack && this._opts.enter && hasChild) {
         dv.classList.add(this._opts.enter);
         }

         if (this._opts.enterTimeout > 0) {
         setTimeout(() => {
         dv.classList.remove(this._opts.enter);
         }, this._opts.enterTimeout);
         } else
         dv.classList.remove(this._opts.enter);
         */

        /*
         if (location.hash !== `#${url}`)
         location.hash = `#${url}`;
         */

        /*
         try {
         if (isBack)
         this._index--;
         else this._index++;

         if (history.replaceState)
         history.replaceState({_index: this._index}, '', location.href);
         console.log(`history state:${history.state}`);
         } catch (e) {
         alert(`replaceState exp:${e.message}`);
         }
         */
        if (!r.loaded) {
          r.loaded = true;

          this.bindLink();
          if (typeof r.bind === 'function'/* && !r.__isBind*/) {
            r.bind.call(dv);
            // r.__isBind = true;
          }
        }

        // 动画
        this.switchToSec(r, back);
      };

      // const hasChild = $.hasChild(this._$container);
      // pop current page
      // leave(hasChild);

      // callback
      const onload = (err, html = '') => {
        if (err)
          throw err;
        // push next page
        enter(html);
      };

      // const res = r.render(callback);
      if (!r.loaded)
        r.load(onload);
      else
        enter();

      /*
       // promise
       if (res && typeof res.then === 'function') {
       res.then((html) => {
       callback(null, html);
       }, callback);
       } else if (r.render.length === 0)  // synchronous
       callback(null, res);
       // callback
       else {

       }
       */
    }
/*
    else
      throw new Error(`path ${url} was not found`);
*/

    return this;
  }

  /**
   * get route from routes filter by url
   * @param {Array} routes
   * @param {String} url
   * @returns {Object}
   */
  getRoute(url) {
    for (let i = 0, len = this._routes.length; i < len; i++) {
      const r = this._routes[i];
      // let keys = [];
      const rx = new RegExp(r.path); // pathToRegexp(r.url, keys);
      const ms = rx.exec(url);
      if (ms) {
        /*
         r.params = {};
         for (let j = 0, l = keys.length; j < l; j++) {
         const key = keys[j];
         const name = key.name;
         r.params[name] = ms[j + 1];
         }
         */
        // 记录当前 url
        r.url = url;
        return r;
      }
    }
    return null;
  }

  /**
   * push route config into routes array
   * @param {Object} route
   * @returns {Router}
   */
  push(route) {
    const exist = this._routes.filter(r => r.path === route.path)[0];
    if (exist)
      throw new Error(`route ${route.path} is existed!`);

    if (!route.id)
      throw new Error(`route ${route.id} is empty!`);

    const r = Object.assign({}, {
      path: '*',
      render: $.noop,
      bind: $.noop
    }, route);

    this._routes.push(r);

    return this;
  }

  /**
   * 从一个文档切换为显示另一个文档
   *
   * @param $from 目前显示的文档
   * @param $to 待切换显示的新文档
   * @param $visibleSection 新文档中展示的 section 元素
   * @param direction 新文档切入方向
   * @private
   */
/*
  animateDoc($from, $to, $visibleSection, direction) {
    var sectionId = $visibleSection.attr('id');

    var $visibleSectionInFrom = $from.find('.' + this._opts.showClass);
    $visibleSectionInFrom.addClass(CFG.visiblePageClass).removeClass(this._opts.showClass);

    $visibleSection.trigger(EVENTS.pageAnimationStart, [sectionId, $visibleSection]);

    this._animateElement($from, $to, direction);

    $from.animationEnd(function () {
      $visibleSectionInFrom.removeClass(CFG.visiblePageClass);
      // 移除 document 前后，发送 beforePageRemove 和 pageRemoved 事件
      $(window).trigger(EVENTS.beforePageRemove, [$from]);
      $from.remove();
      $(window).trigger(EVENTS.pageRemoved);
    });

    $to.animationEnd(function () {
      $visibleSection.trigger(EVENTS.pageAnimationEnd, [sectionId, $visibleSection]);
      // 外层（init.js）中会绑定 pageInitInternal 事件，然后对页面进行初始化
      $visibleSection.trigger(EVENTS.pageInit, [sectionId, $visibleSection]);
    });
  };
*/

  /**
   * 把当前文档的展示 section 从一个 section 切换到另一个 section
   *
   * @param from
   * @param to
   * @param dir
   * @private
   */
  animateSec(from, to, dir) {
    if (!from && !to)
      return;

    if (from) {
      $(from).trigger(EVENTS.beforePageSwitch, [from.id, from]);
      $.removeClass(from, this._opts.showClass);
    }

    let $to = null;
    if (to) {
      $to = $(to);
      $.addClass(to, this._opts.showClass);
      $(to).trigger(EVENTS.pageAnimationStart, [to.id, to]);
    }

    if (from && to) {
      this.animateEle(from, to, dir);
      $to.animationEnd(() => {
        $to.trigger(EVENTS.pageAnimationEnd, [to.id, to]);
        // 外层（init.js）中会绑定 pageInitInternal 事件，然后对页面进行初始化
        $to.trigger(EVENTS.pageInit, [to.id, to]);
      });
    }
  }

  /**
   * 切换显示两个元素
   *
   * 切换是通过更新 class 来实现的，而具体的切换动画则是 class 关联的 css 来实现
   *
   * @param $from 当前显示的元素
   * @param $to 待显示的元素
   * @param dir 切换的方向
   * @private
   */
  animateEle(from, to, direction) {
    // todo: 可考虑如果入参不指定，那么尝试读取 $to 的属性，再没有再使用默认的
    // 考虑读取点击的链接上指定的方向
    let dir = direction;
    if (typeof dir === 'undefined') {
      dir = DIRECTION.rightToLeft;
    }

    const animPageClasses = [
      'page-from-center-to-left',
      'page-from-center-to-right',
      'page-from-right-to-center',
      'page-from-left-to-center'].join(' ');

    let classForFrom = '';
    let classForTo = '';
    switch (dir) {
      case DIRECTION.rightToLeft:
        classForFrom = 'page-from-center-to-left';
        classForTo = 'page-from-right-to-center';
        break;
      case DIRECTION.leftToRight:
        classForFrom = 'page-from-center-to-right';
        classForTo = 'page-from-left-to-center';
        break;
      default:
        classForFrom = 'page-from-center-to-left';
        classForTo = 'page-from-right-to-center';
        break;
    }

    if (from) {
      $.removeClass(from, animPageClasses);
      $.addClass(from, classForFrom);
    }

    if (to) {
      $.removeClass(to, animPageClasses);
      $.addClass(to, classForTo);
    }

    from && $(from).animationEnd(() => $.removeClass(from, animPageClasses));
    to && $(to).animationEnd(() => $.removeClass(to, animPageClasses));
  }

  /**
   * 获取当前显示的第一个 section
   *
   * @returns {*}
   * @private
   */
  getCurrentSec = () => $.qu(`.${this._opts.showClass}`);

  /**
   * 切换显示当前文档另一个块
   *
   * 把新块从右边切入展示，同时会把新的块的记录用 history.pushState 来保存起来
   *
   * 如果已经是当前显示的块，那么不做任何处理；
   * 如果没对应的块，那么忽略。
   *
   * @param {String} sectionId 待切换显示的块的 id
   * @private
   */
  switchToSec(r, back) {
    if (!r)
      return;

    const curPage = this.getCurrentSec();
    const newPage = $.id(r.id);

    // 如果已经是当前页，不做任何处理
    if (curPage === newPage)
      return;
/*
 if (r.className || r.showClass) {
 $.removeClass($.qu(`.${r.showClass}`), r.showClass);
 $.addClass(dv, `${r.className} ${r.showClass}`);
 if (r.title)
 setTitle(r.title);
 }
*/
    this.animateSec(curPage, newPage, back ? DIRECTION.leftToRight : DIRECTION.rightToLeft);
    setTitle(this.route.title);
    // this.pushNewState('#' + sectionId, sectionId);
  }

/*
  sameDoc(url, anotherUrl) {
    return getBase(url) === getBase(anotherUrl);
  }
*/
}

export default Router;
