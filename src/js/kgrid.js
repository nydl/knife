/**
 * Created by way on 16/6/15.
 * 加载动态表格
 */

const $ = require('./kdom');

export default class ViewTable {
  // 更改 行 样式
  setRowClass(row, className) {
    if (!row)
      return;

    // 恢复原始 样式
    if (className)
      $.className(row, className);
    else {
      $.className(row, '');
      /*
       if (row.className.indexOf('Odd') > -1)
       tl.setClass(row, 'etRowOdd');
       else
       tl.setClass(row, 'etRowEven');
       */
    }
  }

  clearRow(tb) {
    if (!tb) {
      alert('请传入table对象！');
      return;
    }

    const tbody = $.tags(tb, 'TBODY')[0];
    while (tbody.childNodes.length > 0)
      tbody.removeChild(tbody.childNodes[0]); // 需测试！
  }

  /**
   * 计算空行数，第一列为序号，第二列为空，作为空行
   * @param obj
   * @returns {*}
   */
  getNullRow(obj) {
    let rs = {row: null, cnt: 0};

    let nullRow = null;
    let nullCnt = 0;
    for (let i = 0; i < obj.childNodes.length; i++) {
      const nd = obj.childNodes[i];
      let val = '';
      try {
        // 第二列,不管第一列,如果去掉第一列,需修改当前代码!!!
        const tx = $.firstChild(nd.cells[1]);
        if (tx.tagName === 'IMG')
          val = 'img';
        else if (tx.tagName === 'SPAN')
          val = $.trim(tx.innerHTML);
        else if (tx.tagName === 'INPUT')
          val = $.trim(tx.value);
        else
          val = $.trim(tx.nodeValue);
      } catch (e) {
        console.error(`getNullRow exp:${e.message}`);
      }

      if (nd.nodeType === 1 && !val) {
        nullCnt++;
        if (!nullRow)
          nullRow = nd;
      }
    }

    if (nullRow)
      rs = {row: nullRow, cnt: nullCnt};

    return rs;
  }

  setIdx(txs, names) {
    // 对 Input 添加 索引，方便操作
    for (let i = 0; i < txs.length; i++) {
      txs[i].setAttribute('idx', '');
      // 与名称对应上, span 不能直接使用 name
      for (let j = 0; j < names.length; j++) {
        if (txs[i].getAttribute('name') === `tx${names[j]}`)
          txs[i].setAttribute('idx', j);
      }
    }
  }

  /**
   * 设置值
   * @param txs
   * @param values
   * @returns {*}
   */
  setVal(txs, values) {
    // 列赋值
    for (let j = 0; j < txs.length; j++) {
      let idx = txs[j].getAttribute('idx');
      if (idx === null || $.trim(idx) === '' || isNaN(idx))
        continue;

      idx = Number(idx);
      if ((values[idx] || values[idx] === 0)) {
        const tx = txs[j];
        const val = values[idx];

        if (tx.tagName === 'SPAN') {
          // 图片
          let rgs = /!\[([\s\S]*)\]\s*\(([\s\S]+)\)/.exec(val);
          if (rgs) {
            // 图片赋值
            const img = document.createElement('img');
            img.src = rgs[2];
            $.className(img, 'etImg');
            tx.parentNode.insertBefore(img, tx.parentNode.childNodes[0]);
            tx.innerHTML = $.trim((rgs[1] || '').replace(/<br>|<div>|<\/div>/gi, ''));
            // sp.placeholder = '点这里输入标题';
            $.className(tx, 'imgTitle');
          } else {
            const v = `;${val};`;
            rgs = /;value=([^;]*);/.exec(v);
            if (rgs)
              tx.innerHTML = rgs[1] || '';
            else {
              rgs = /^~~(.*)~~/.exec(val);
              // 提示符 ~~请输入价格~~
              if (rgs) {
                tx.innerHTML = '';
              } else
                tx.innerHTML = val;
            }
          }
          // 回车换行
          tx.innerHTML = tx.innerHTML.replace(/\r\n/g, '\n').replace(/[\r\n]/g, '<br>');
          tx.style.webkitUserModify = 'read-only';
        }
      }
    }
  }

  /**
   * 添加一个实例数据行到空行之前, 返回 添加的行数
   * textarea 实现高度自动适配很麻烦,去掉支持!
   * span 可直接编辑!
   * @param tb 表
   * @param names 字段名称
   * @param values 值
   * @param node 插入到指定的行前
   * @returns {number}
   */
  addData(tb, names, values, node) {
    let RC = 0;
    try {
      const thead = $.tags(tb, 'THEAD')[0];
      const tbody = $.tags(tb, 'TBODY')[0];
      // 行模板
      const rowPat = $.lastChild(thead);

      let txs = $.tags(rowPat, 'SPAN');

      // 对 Input 添加 索引，方便操作
      if (txs && txs.length > 0)
        this.setIdx(txs, names);

      let row = null;
      // 行赋值
      for (let i = 0; i < values.length; i++) {
        // 拷贝 模板行
        row = rowPat.cloneNode(true);
        row.style.display = '';

        txs = $.tags(row, 'SPAN');
        // 列赋值
        if (txs && txs.length > 0)
          this.setVal(txs, values[i]);

        // 计算空行数，第一列为序号，第二列为空，作为空行,dwz 为何无此部分？
        // if (node)
        const nullRow = this.getNullRow(tbody);

        const cnt = $.childCount(tbody);
        $.firstChild($.firstChild(row)).nodeValue = cnt - nullRow.cnt + 1;

        if ((cnt - nullRow.cnt) % 2 === 1)
          this.setRowClass(row, 'etRowEven');

        // 插入到空行前
        if (nullRow.row)
          tbody.insertBefore(row, nullRow.row);
        else
          tbody.insertBefore(row, null);

        RC = i + 1;
      } // for
    } catch (e) {
      alert(`addData exp:${e.message}`);
    }

    return RC;
  }
}
