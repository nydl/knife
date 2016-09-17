/**
 * Created by way on 16/8/28.
 * 设备检测
 * 全局对象
 */

// 一个包中所有引用共享该变量!
const device = {};

export const ua = navigator.userAgent;
export const url = window.URL || window.webkitURL;
const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
const ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
const iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
device.ios = device.android = device.iphone = device.ipad = device.androidChrome = false;

export function isIE() {
  return document.all;
}

// Android
if (android) {
  device.os = 'android';
  device.osVersion = android[2];
  device.android = true;
  device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
}

if (iphone) {
  device.os = 'ios';
  device.ios = true;
}

// iOS
if (iphone && !ipod) {
  device.osVersion = iphone[2].replace(/_/g, '.');
  device.iphone = true;
  device.oldIos = parseInt(device.osVersion.split('.')[0], 10) <= 7;
}

// weixin
device.wechat = /MicroMessenger/i.test(ua);
device.weixin = device.wechat;

export default device;
