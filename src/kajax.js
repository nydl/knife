/**
 * Created by way on 16/8/28.
 * ajax get、post
 */

/**
 创建xmlHttpRequest,返回xmlHttpRequest实例,根据不同的浏览器做兼容
 */
function getXhr() {
  let rs = null;

  if (window.XMLHttpRequest)
    rs = new XMLHttpRequest();
  else if (window.ActiveXObject)
    rs = new ActiveXObject('Microsoft.XMLHTTP');

  return rs;
}

function objToParam(obj) {
  let rs = '';

  const arr = [];
  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      arr.push(`${k}=${obj[k]}`);
    }
    // rs += `${k}=${obj[k]}&`;
  }
  // 排序
  rs = arr.sort().join('&');
  // alert(rs);
  return rs;
}

function post(url, data, cb) {
  const xhr = getXhr();
  xhr.onreadystatechange = () => {
    if ((xhr.readyState === 4) && (xhr.status === 200)) {
      cb(xhr.responseText);
    }
  };

  // 异步 post,回调通知
  xhr.open('POST', url, true);
  let param = data;
  if ((typeof data) === 'object')
    param = objToParam(data);

  // 发送 FormData 数据, 会自动设置为 multipart/form-data
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  // xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=AaB03x');
  // alert(param);
  xhr.send(param);
}

/**
 * xmlHttpRequest POST 方法
 * 发送 FormData 数据, 会自动设置为 multipart/form-data
 * 其他数据,应该是 application/x-www-form-urlencoded
 * @param url post的url地址
 * @param data 要post的数据
 * @param cb 回调
 */
function postForm(url, data, cb) {
  const xhr = getXhr();
  xhr.onreadystatechange = () => {
    if ((xhr.readyState === 4) && (xhr.status === 200)) {
      cb(xhr.responseText);
    }
  };

  // 异步 post,回调通知
  xhr.open('POST', url, true);
  // 发送 FormData 数据, 会自动设置为 multipart/form-data
  // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  // xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=AaB03x');
  xhr.send(data);
}

/**
 * xmlHttpRequest GET 方法
 * @param url get的URL地址
 * @param data 要get的数据
 * @param cb 回调
 */
function get(url, param, cb) {
  const xhr = getXhr();
  xhr.onreadystatechange = () => {
    if ((xhr.readyState === 4) && (xhr.status === 200)) {
      if (cb)
        cb(xhr.responseText);
    }
  };

  if (param)
    xhr.open('GET', `${url}?${param}`, true);
  else
    xhr.open('GET', url, true);
  xhr.send(null);
}

export {get, post, postForm};
