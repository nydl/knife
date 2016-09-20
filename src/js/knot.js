// 输出一个函数, 返回对象
export default (object = {}) => {
  const events = {}

  alert('knot');

  function on(name, handler) {
    events[name] = events[name] || []
    events[name].push(handler)
    return this;
  }

  // 触发一次
  function once(name, handler) {
    handler._once = true;
    on(name, handler);
    return this;
  }

  /**
   * 删除事件
   * @param name
   * @param handler 缺少删除该事件, 指定处理函数,则只删除指定处理函数
   * @returns {off}
   */
  function off(name, handler = false) {
    handler
      ? events[name].splice(events[name].indexOf(handler), 1)
      : delete events[name];

    return this;
  }

  function emit(name, ...args) {
    // cache the events, to avoid consequences of mutation
    const cache = events[name] && events[name].slice();

    // only fire handlers if they exist
    cache && cache.forEach(handler => {
      // remove handlers added with 'once'
      handler._once && off(name, handler);

      // set 'this' context, pass args to handlers
      handler.apply(this, args);
    });

    return this;
  }

  return {
    ...object,

    on,
    once,
    off,
    emit
  }
}
