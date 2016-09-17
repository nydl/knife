/**
 * Created by way on 16/6/12.
 * 文件上传
 */
// import 'babel-polyfill';
// import * as fet from './fetch';
import {get, post} from './kajax';

const UP_URL = 'http://wx.nuoyadalu.com/txyun/getSign';

/**
 * 获取上传地址
 * @param type 不同类型文件,通过服务器获得相应上传地址
 * @returns {upload}
 */

/*
export async function getUrl(type) {
  // const url = await fet.get('/upload/api/getUrl', {type});
  const url = '';
  if (__DEV__) {
    console.log('upfile.getUrl:', url);
  }
  return '';
}
*/


/**
 * 上传文件,支持多个文件上传!
 * @param files
 * @param type 上传文件类型, 产品 prod,
 * @returns {Array}
 */
/*
export async function upload(files, type) {
  let rs = [];

  const url = await getUrl(type);
  files.map(file => {
    rs.push(fet.post(url, {data: file}));
  });

  return rs;
}
*/

/**
 * 从服务器获取上传 url、及签名
 * @param type
 * @returns {string}
 */
export function getUrl(url, cb) {
  // const url = await fet.get('/upload/api/getUrl', {type});
  let rs = '';

  get(url, '', rs => {
    rs = JSON.parse(rs).url + Math.floor(Math.random() * 1000) + '?sign=' + encodeURIComponent(JSON.parse(rs).sign);
    cb(rs);
  });
}

/**
 * formdata 补丁, 给不支持formdata上传blob的android机打补丁
 * 未测试!!!
 * @constructor
 */
function FormDataShim() {
  console.warn('using formdata shim');

  var o = this,
    parts = [],
    boundary = Array(21).join('-') + (+new Date() * (1e16 * Math.random())).toString(36),
    oldSend = XMLHttpRequest.prototype.send;

  this.append = function (name, value, filename) {
    parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="' + name + '"');
    if (value instanceof Blob) {
      parts.push('; file="' + (filename || 'blob') + '"\r\nContent-Type: ' + value.type + '\r\n\r\n');
      parts.push(value);
    }
    else {
      parts.push('\r\n\r\n' + value);
    }
    parts.push('\r\n');
  };

  // Override XHR send()
  XMLHttpRequest.prototype.send = function (val) {
    var fr,
      data,
      oXHR = this;
    if (val === o) {
      // Append the final boundary string
      parts.push('--' + boundary + '--\r\n');
      // Create the blob
      data = getBlob(parts);
      // Set up and read the blob into an array to be sent
      fr = new FileReader();
      fr.onload = function () {
        oldSend.call(oXHR, fr.result);
      };
      fr.onerror = function (err) {
        throw err;
      };
      fr.readAsArrayBuffer(data);
      // Set the multipart content type and boudary
      this.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
      XMLHttpRequest.prototype.send = oldSend;
    }
    else {
      oldSend.call(this, val);
    }
  };
}

/**
 * 获取formdata,兼容不支持 FormData 的安卓手机
 */
function getFormData() {
  const shim = ~navigator.userAgent.indexOf('Android')
    && ~navigator.vendor.indexOf('Google')
    && !~navigator.userAgent.indexOf('Chrome')
    && navigator.userAgent.match(/AppleWebKit\/(\d+)/).pop() <= 534;

  return shim ? new FormDataShim() : new FormData();
}

/**
 * 图片上传，将base64的图片转成二进制对象，塞进formdata上传
 * @param basestr
 * @param type
 * @param $li
 */
export function upload(data, url, cb) {
  let percent = 0;
  let loop = null;

  const xhr = new XMLHttpRequest();
  const formdata = getFormData();

  // field名称必须与服务端规定的一致,否则,服务端可能拒绝保存!
  formdata.append('filecontent', data);
  xhr.open('post', url);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      /*
       const rs = JSON.parse(xhr.responseText);
       const info = rs[0] || {};
       const text = info.path ? '上传成功' : '上传失败';
       console.log(text + '：' + imagedata.path);
       */
      // 当收到该消息时上传完毕
      cb(JSON.parse(xhr.responseText).data.download_url);
      console.log(`上传成功：${xhr.responseText}`);

      // 停止 百分比动画上传进度
      // clearInterval(loop);
      // console.log('. 100%');

      /*
       $li.find(".progress span").animate({'width': "100%"}, percent < 95 ? 200 : 0, function() {
       $(this).html(text);
       });

       if (imagedata.path)
       $(".pic-list").append('<a href="' + imagedata.path + '">' + imagedata.name + '（' + imagedata.size + '）<img src="' + imagedata.path + '" /></a>');
       // $(".pic-list").append('<a href="' + xhr.responseText + '">' + xhr.responseText + '<img src="' + xhr.responseText + '" /></a>');
       */
    }
  };

  // 数据后50%用模拟进度
  function mockProgress() {
    if (loop) return;

    loop = setInterval(() => {
      percent++;

      // $li.find(".progress span").css('width', percent + "%");
      console.log(`... ${percent}%`);

      if (percent === 99) {
        clearInterval(loop);
      }
    }, 1000);
  };

/* ??? 暂时屏蔽,不显示进度
  // 数据发送进度，前50%展示该进度,后50%使用模拟进度!
  xhr.upload.addEventListener('progress', e => {
    if (loop) return;
    percent = ~~(100 * e.loaded / e.total) / 2;
    // $li.find(".progress span").css('width', percent + "%");
    console.log(`... ${percent}%`);
    if (percent === 50) {
      mockProgress();
    }
  }, false);
*/

  // 发送from数据到服务器!
  xhr.send(formdata);
}


/**
 * 图片上传，将base64的图片转成二进制对象
 * @param base base64 字符串
 * @param type canvas.toDataURL 返回的默认格式就是 image/png, 压缩过的 是 image/jpeg
 */
export function baseToBlob(base, type) {
  // dataURL 的格式为 “data:image/png;base64,****”,逗号之前都是一些说明性的文字，我们只需要逗号之后的就行了
  const text = window.atob(base.split(',')[1]);
  // const buffer = new ArrayBuffer(text.length);
  const buf = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    buf[i] = text.charCodeAt(i);
  }

  try {
    return new Blob([buf], {type});
  } catch (e) {
    const bd = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder);
    bd.append([buf]);
    return bd.getBlob(type);
  }
}

/**
 * 上传图片到腾讯云
 * @param url base64的url
 */
export function uploadImg(url, cb) {
  const data = baseToBlob(url, 'image/jpeg');
  getUrl(UP_URL, upurl => {
    upload(data, upurl, rs => {
      cb(rs);
    });
  });
}

