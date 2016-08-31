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

/**
 * 修改微信 title
 */
export function setTitle(val) {
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

