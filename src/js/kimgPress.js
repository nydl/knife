/**
 * Created by way on 16/6/18.
 * 图片方向修正及压缩
 */

const $ = require('./kdom');
const imgorien = require('./kimgOrien');
const MegaPixImage = require('../lib/kmegapix');
const JPEGEncoder = require('../lib/kjpegCoder');
import device from './kdevice';

/**
 * 修正方向及压缩图片
 * @param img 原始图片Image,不是页面上的 img 元素,页面上的 img 已经对图片进行了压缩处理!
 * 返回 压缩后的 base64 图片url,可直接赋值给 图片的 src,或者上传服务器
 */
function pressImg(img, ratio, cb) {
  let rs = '';

  // 非安卓需要获取orientation来drawImage
  if (device.android) {
    rs = compress(img, 1, ratio);
    cb(null, rs);
  } else {
    // 获取图像的方位信息
    imgorien.getOrien(img.src, orien => {
      rs = compress(img, orien, ratio);
      cb(null, rs);
    });
  }
}

/**
 * 图片最大高宽校正（方向和比例）
 * @param  {image} 图片
 * @param  {number} 图片方向 1)正常 3)180度 6)90度 8)270度
 * @return  {object}
 *   width: {number} 矫正后的width
 *   height: {number} 校正后的hieght
 */
function getSize(img, orien, scale) {
  let w = img.width;
  let h = img.height;

  if (~'68'.indexOf(orien)) { // 90，270度则高宽互换
    w = img.height;
    h = img.width;
  }

  /*  if (w / h < scale) {
   h = w / scale;
   }
   */

  return {width: w, height: h};
}

/**
 * 对图片进行旋转修正并压缩
 * @param img
 * @param orien 方向
 * @param ratio 压缩比 0.1~1
 */
function compress(img, orien, ratio) {
  let rs = null;

  if (img == null)
    return;

  // img的高度和宽度不能在img元素隐藏后获取，否则会出错
  let w = img.width;
  let h = img.height;

  img.realWidth = w;
  img.realHeight = h;

  const initSize = img.src.length;
  if (orien === 1 && initSize < 200 * 1024)
    return img.src;

  if (~'68'.indexOf(orien)) { // 90，270度则高宽互换
    w = img.height;
    h = img.width;
  }

  // 用于旋转图片的canvas
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');

  if (device.oldIos) { // iOS6/iOS7
    const iosImg = new MegaPixImage(img);
    const iosRenderOptions = {
      maxWidth: cv.width,
      maxHeight: cv.height,
      orientation: orien
    };

    if (~'68'.indexOf(orien)) { // 90，270度则高宽互换
      iosRenderOptions.maxWidth = cv.height;
      iosRenderOptions.maxHeight = cv.width;
    }
    iosImg.render(cv, iosRenderOptions);
  } else { // 其他设备
    switch (orien) { // 根据方向在画布不同的位置画图
      case 3:
        ctx.rotate(180 * Math.PI / 180);
        drawImg(cv, img, -cv.width, -cv.height, cv.width, cv.height);
        break;
      case 6:
        ctx.rotate(90 * Math.PI / 180);
        drawImg(cv, img, 0, -cv.width, cv.height, cv.width);
        break;
      case 8:
        ctx.rotate(270 * Math.PI / 180);
        drawImg(cv, img, -cv.height, 0, cv.height, cv.width);
        break;
      default:
        drawImg(cv, img, 0, 0, cv.width, cv.height);
    }
  }

  // 获取压缩后生成的img对象,小于 300K的不压缩!
  if (initSize < 200 * 1024)
    rs = cv.toDataURL('image/jpeg', 1);
  else if (device.android && device.wechat) { // 安卓微信下压缩有问题
    const encoder = new JPEGEncoder();
    rs = encoder.encode(ctx.getImageData(0, 0, cv.width, cv.height), ratio * 100);
  } else
    rs = cv.toDataURL('image/jpeg', ratio);

  if ($.qu('#spInfo'))
    $.qu('#spInfo').innerHTML += `<br>orien:${orien} ratio:${ratio} 旋转前:${ ~~(initSize * 100 / (1024 * 1024)) / 100}M 旋转后:${~~(rs.length * 100 / 1024) / 100}K 压缩率:${~~(100 * (initSize - rs.length) / initSize)}%`;

  return rs;
}

/**
 * 使用canvas对大图片进行绘制,太大的图片一次性绘制会失败,分成多次绘制!
 * @param cv 绘制的 convert
 * @param img 源图
 * @param maxpx 最大分辨率
 * @returns {*}
 */
function drawImg(cv, img, sx, sy, sw, sh, maxpx) {
  maxpx = maxpx || 4000000; // 四百万像素

  const initSize = img.src.length;
  let w = img.width;
  let h = img.height;
  const px = w * h;
  if ($.qu('#spInfo'))
    $.qu('#spInfo').innerHTML += `像素: ${parseInt(px / 10000)}万. 最大: ${~~(maxpx / 10000)}万`;

  const ctx = cv.getContext('2d');
  ctx.drawImage(img, sx, sy, sw, sh);
  return;

  // 瓦片绘制
  // 如果图片大于最高像素，计算压缩比,减少大小
  let pr = px / maxpx;
  if (pr > 1) {
    pr = Math.sqrt(px);
    w /= pr;
    h /= pr;
  } else {
    pr = 1;
  }

  /*
   cv.width = w;
   cv.height = h;
   // 铺底色,png转jpg，绘制时，透明区域会变成黑色
   ctx.fillStyle = '#fff';
   ctx.fillRect(0, 0, cv.width, cv.height);
   */

  // 如果图片像素大于100万则使用瓦片绘制,避免绘制失败!
  let count = w * h / 1000000;
  if (count > 1) {
    console.log('像素> 100万!');
    count = ~~(Math.sqrt(count) + 1); // 计算要分成多少块瓦片
    // 计算每块瓦片的宽和高
    const nw = ~~(w / count);
    const nh = ~~(h / count);

    // 瓦片canvas
    const tcv = document.createElement('canvas');
    const tctx = tcv.getContext('2d');
    const maxsize = 100 * 1024;
    tcv.width = nw;
    tcv.height = nh;
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        // 将图片像素画到按比例缩小的画布上,避免绘制失败!
        tctx.drawImage(img, i * nw * pr, j * nh * pr, nw * pr, nh * pr, 0, 0, nw, nh);
        // 再将瓦片画布画到整个画布上
        ctx.drawImage(tcv, i * nw, j * nh, nw, nh);
      }
    }
    tcv.width = tcv.height = 0;
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }
}

/**
 * 以下代码是修复ios6中canvas绘制图片比例不对问题!
 * ??? 没有测试验证,没有使用!!!
 * Detecting vertical squash in loaded image.
 * Fixes a bug which squash image vertically while drawing into canvas for some images.
 * This is a bug in iOS6 devices. This function from https://github.com/stomita/ios-imagefile-megapixel
 *
 */
function detectVerticalSquash(img) {
  var iw = img.naturalWidth, ih = img.naturalHeight;
  var canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = ih;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  var data = ctx.getImageData(0, 0, 1, ih).data;
  // search image edge pixel position in case it is squashed vertically.
  var sy = 0;
  var ey = ih;
  var py = ih;
  while (py > sy) {
    var alpha = data[(py - 1) * 4 + 3];
    if (alpha === 0) {
      ey = py;
    } else {
      sy = py;
    }
    py = (ey + sy) >> 1;
  }
  var ratio = (py / ih);
  return (ratio === 0) ? 1 : ratio;
}

/**
 * A replacement for context.drawImage
 * (args are for source and destination).
 */
function drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
  var vertSquashRatio = detectVerticalSquash(img);
  // Works only if whole image is displayed:
  // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
  // The following works correct also when only a part of the image is displayed:
  ctx.drawImage(img, sx * vertSquashRatio, sy * vertSquashRatio,
    sw * vertSquashRatio, sh * vertSquashRatio,
    dx, dy, dw, dh);
}

export {pressImg};
