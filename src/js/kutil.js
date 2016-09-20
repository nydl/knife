/**
 * Created by way on 16/6/10.
 */

/**
 * 格式化字符串，类似 node util中带的 format
 * @type {Function}
 */
export function format(f, ...args) {
  let i = 0;
  const len = args.length;
  const str = String(f).replace(/%[sdj%]/g, x => {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s':
        return String(args[i++]);
      case '%d':
        return Number(args[i++]);
      case '%j':
        return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });

  return str;
}

export function urlParam(name) {
  let rc = null;

  const val = `&${location.search.substr(1)}&`;
  const rg = new RegExp(`&${name}=([^&]*)&`);
  const rgs = rg.exec(val);
  if (rgs) {
    rc = rgs[1];
    rc = decodeURIComponent(rc);
  }

  return rc;
}

// import pathToRegexp from 'path-to-regexp';

/**
 * 获取一个链接相对于当前页面的绝对地址形式
 *
 * 假设当前页面是 http://a.com/b/c
 * 那么有以下情况:
 * d => http://a.com/b/d
 * /e => http://a.com/e
 * #1 => http://a.com/b/c#1
 * http://b.com/f => http://b.com/f
 *
 * @param {String} url url
 * @returns {String}
 */
export function getAbsUrl(url) {
  var link = document.createElement('a');
  link.setAttribute('href', url);
  const abs = link.href;
  link = null;
  return abs;
}

/**
 * 获取一个 url 的基本部分，即不包括 hash
 *
 * @param {String} url url
 * @returns {String}
 */
export function getBaseUrl(url) {
  const pos = url.indexOf('#');
  return pos === -1 ? url.slice(0) : url.slice(0, pos);
}
