/*
 * Copyright(c) 2014 Yuki Kurata <yuki.kurata@gmail.com>
 * MIT Licensed
 */

/**
 * オブジェクトをUL,LIタグを使用したエレメントで表示します
 * jQueryを使用します
 *
 * placeElを指定しない場合はbodyの最後に挿入します
 * prefixを指定すると各エレメントに設定されるクラスに接頭語を指定します
 * 省略時は'peep_'です
 * omissionsを指定すると、__proto__を表示しないオブジェクトを増やす事ができます
 * 規定ではObject.prototypeとjQueryのみが対象です

 * 
 * @method peep
 * @param  {Object}  obj
 * @param  {Object} options
 *             {Element} placeEl   挿入先 (省略時 document.body)
 *             {String}  prefix    クラスの接頭語、cssで使用(省略時 peep_) 
 *             {Array}   omissions 省略するオブジェクト
 */
window.peep = (function () {

  function main (obj, options) {

    // 省略するオブジェクト
    options = options || {};
    var omissions = [Object.prototype];
    if (Array.isArray(options.omissions)) {
      options.omissions.forEach(function(x){
        if (typeof x === 'object') {
          omissions.push(x);
        } else if (typeof x === 'function') {
          omissions.push(x.prototype);
        }
      });
    }

    var self = {
      placeEl: options.placeEl || document.body,
      prefix: options.prefix || 'peep_',
      omissions: omissions,
      ref: [],
      obj: {root: obj},
      getUl: getUl,
      getLi: getLi,
      getLiFunction:getLiFunction,
      getLiNode:getLiNode,
      getLijQuery:getLijQuery,
      getUljQuery:getUljQuery,
      getLiArray:getLiArray,
      getUlArray:getUlArray,
      getLiObject:getLiObject,
      getUlObject:getUlObject,
      createLi:createLi,
      openAllButton: openAllButton,
      closeAllButton:closeAllButton,
      autoOpenCheck:autoOpenCheck,
      hiddenButton:hiddenButton
    };

    peepObject(self);
  }

  /**
   * ノード作成
   * @method peepObject
   * @param  {Object} self
   */
  function peepObject (self) {

    var prefix = self.prefix;

    var ul = self.getUl(self.obj);
    ul.setAttribute('class', prefix + 'peepObject');


    $(ul).delegate('.' + prefix + 'isRef', 'click', addNode(self));

    // ツリーを開く・閉じる
    $(ul).delegate('.' + prefix + 'toggle', 'click', toggleNode(self));

    // コンソール出力・ハイライト
    $(ul).delegate('li', 'click', clickLi(self, ul));

    // 各ボタンの作成
    self.placeEl.appendChild(self.openAllButton(ul));
    self.placeEl.appendChild(self.closeAllButton(ul));
    self.placeEl.appendChild(self.autoOpenCheck());
    self.placeEl.appendChild(self.hiddenButton(ul, 'proto'));
    self.placeEl.appendChild(self.hiddenButton(ul, 'blind'));
    self.placeEl.appendChild(self.hiddenButton(ul, 'disconfig'));

    self.placeEl.appendChild(ul);
  }

  function addNode(self) {
    var obj = self.obj.root;
    var prefix = self.prefix;
    return function () {
      var parent = this.parentNode;
      var path = getPath(parent.title);
      var value = getValue(obj, path, true);
      var ul;
      switch(getType(value)) {
      case 'function':
        return true;
      case 'jQuery':
        ul = self.getUljQuery(value, path);
        break;
      case 'array':
        ul = self.getUlArray(value, path);
        break;
      case 'object':
        ul = self.getUlObject(value, path);
        break;
      default:
        return true;
      }
      var toggleSpan = $('<span class="'+ prefix + 'toggle">[ - ]</span>');
      $('.' + prefix + 'value', parent).before(toggleSpan);
      $(parent).addClass(prefix + 'expandable').removeClass(prefix + 'ref');
      parent.removeChild(this);
      parent.appendChild(ul);
      return false;
    };
  }

  /**
   * ノードを開閉する
   * @method toggleNode
   * @param  {Object}   self
   * @return {Function} callback
   */
  function toggleNode (self) {
    var unexpanded = self.prefix + 'unexpanded';
    return function () {
      var el = $(this);
      var parant = $(this.parentNode);
      if (parant.hasClass(unexpanded)){
        parant.removeClass(unexpanded);
        el.text('[ - ]');
      } else {
        parant.addClass(unexpanded);
        el.text('[ + ]');
      }
      return false;
    };
  }


  /**
   * クリックしたノードの値をコンソールに出力します
   * 
   * 関数、jQuery、配列、オブジェクトをクリックした際に、同じ参照先を持つノードを
   * ハイライト表示します
   * open autoをonにしている場合は、閉じているノードを自動的に開く
   */
  function clickLi (self, ul) {
    var lastRef;
    var lastEl;
    var prefix = self.prefix;
    var selected   = prefix + 'selected';
    var selectedEl = prefix + 'selectedEl';
    var unexpanded = prefix + 'unexpanded';

    return function () {
      var title = this.title;
      // コンソール出力
      if (title && typeof console === 'object') {
        var path = getPath(title);
        var peeped = getValue(self.obj.root, path);
        console.log(peeped);
        window.peeped = peeped;
      }
      // ハイライト表示
      var r = this.getAttribute('data-ref');
      if (!r) {
        return false;
      }
      r = Number(r);
      var val = self.ref[r];
      var isEl = getType(val) === 'node';
      $('.' + selected, ul).removeClass(selected);
      if (lastEl) {
        lastEl.removeClass(selectedEl);
        lastEl = null;
      }
      if (lastRef === r) {
        lastRef = null;
      } else {
        // 同じ参照先をハイライト
        var els = $('[data-ref=' + r + ']', ul);
        els.addClass(selected);
        if (isEl) {
          lastEl = $(val);
          lastEl.addClass(selectedEl);
        }
        lastRef = r;
        // open auto
        if (self.autoOpen) {
          els.parents('.' + unexpanded).removeClass(unexpanded).each(function(i, el){
            $('>.' + prefix + 'toggle', el).text('[ - ]');
          });
        }
      }
      return false;
    };
  }

  /**
   * 全てのノードを開く
   * @method openAllButton
   * @param  {Element}  ul
   * @return {Element}  botton
   */
  function openAllButton (ul) {
    var prefix = this.prefix;
    var btn = document.createElement('button');
    btn.innerHTML = 'open all';
    var expandable = '.' + this.prefix + 'expandable';
    var unexpanded = this.prefix + 'unexpanded';
    $(btn).click(function() {
      $(expandable, ul).removeClass(unexpanded);
      $('.' + prefix + 'toggle', ul).text('[ - ]');
    });
    return btn;
  }

  /**
   * 全てのノードを閉じる
   * @method closeAllButton
   * @param  {Element}  ul
   * @return {Element}  botton
   */
  function closeAllButton (ul) {
    var prefix = this.prefix;
    var btn = document.createElement('button');
    btn.innerHTML = 'close all';
    var expandable = '.' + this.prefix + 'expandable';
    var unexpanded = this.prefix + 'unexpanded';
    $(btn).click(function() {
      $(expandable, ul).addClass(unexpanded);
      $('.' + prefix + 'toggle', ul).text('[ + ]');
    });
    return btn;
  }

  /**
   * 同じ参照先のノードを自動的に開く
   * @method autoOpenCheck
   * @return {Element}  label
   */
  function autoOpenCheck () {
    var self = this;
    var check = $('<label><input type="checkbox" value="auto">auto open</label>');
    $('input', check).change(function (){
      self.autoOpen = this.checked;
    });
    return check.get(0);
  }

  /**
   * proto,blind,disconfigボタンの作成
   * @method hiddenButton
   * @param  {Element}  ul
   * @param  {String}   name
   * @return {Element}  button
   */
  function hiddenButton (ul, name) {
    var self = this;
    var prefix = self.prefix;
    var btn = document.createElement('button');
    btn.innerHTML = name;
    var sel = '.' + prefix + name;
    var show = true;
    var hidden = prefix + 'hidden_' + name;
    var enable = prefix + 'enable_' + name;
    $(btn).click(function () {
      show = !show;
      if (show) {
        $(sel, ul).removeClass(hidden);
        $(btn).removeClass(enable);
      } else {
        $(sel, ul).addClass(hidden);
        $(btn).addClass(enable);
      }
    });
    return btn;
  }

  /**
   * @method getType
   * @param  {Mixed}  obj
   * @return {String} type
   */
  function getType(obj) {
    if (obj === null) {
      return 'null';
    }
    if (obj instanceof Error) {
      return 'error';
    }
    if (Array.isArray(obj)) {
      return 'array';
    }
    if (obj === window) {
      return 'window';
    }
    if (obj instanceof Node) {
      return 'node';
    }
    if (obj instanceof $) {
      return 'jQuery';
    }
    var type = typeof obj;
    if (type !== 'object') {
      return type; // string, number, boolean, function, undefined
    }
    switch(obj.constructor) {
    case Date:
      return 'date';
    case RegExp:
      return 'regexp';
    case Array:
      return 'array';
    default:
      return 'object';
    }
  }

  /**
   * オブジェクトのプロパティの属性を調査し配列で返す
   * @method getClasses
   * @param  {Object}   obj
   * @param  {String}   name
   * @return {Array}    classes
   */
  function getClasses (obj, name) {
    var classes = [];
    var desc = Object.getOwnPropertyDescriptor(obj, name);
    if (!desc.enumerable) {
      classes.push('blind');
    }
    if (!desc.configurable) {
      classes.push('disconfig');
    }
    if (!('value' in desc)) {
      classes.push('accessor');

    } else if (!desc.writable) {
      classes.push('readonly');
    }
    return classes;
  }

  /**
   * ルートのULエレメントを作成
   * @method getUl
   * @param  {Object}  obj
   * @return {Element} ul
   */
  function getUl(obj) {
    var self = this;
    var ul = document.createElement('ul');

    var isArray = Array.isArray(obj);

    var names = isArray ? Object.keys(obj) : Object.getOwnPropertyNames(obj);

    names.forEach(function (name) {
      var classes = isArray ? [] : getClasses(obj, name);
      var value = ~classes.indexOf('accessor') ? 'Getter/Setter' : obj[name];
      var li = self.getLi(name, value, [], classes);
      ul.appendChild(li);
    });
    return ul;
  }

  /**
   * LIエレメントノードの作成
   * @method getLi
   * @param  {String}  name
   * @param  {Mixed}   value
   * @param  {Array}   path
   * @param  {Array}   classes
   * @return {Element} li
   */
  function getLi (name, value, path, classes) {
    classes = classes || [];
    var self = this;
    var type = getType(value);
    classes.push(type);
    var li;

    switch(type) {
    case 'undefined':
    case 'null':
      li = self.createLi(name, type, path);
      break;
    case 'boolean':
      li = self.createLi(name, String(value), path);
      break;
    case 'string':
      if (value !== 'Getter/Setter') {
        value = '\'' + value + '\'';
      }
      li = self.createLi(name, value, path);
      break;
    case 'number':
      li = self.createLi(name, String(value), path);
      break;
    case 'error':
      li = self.createLi(name, '[' + value.constructor.name + '] ' +value.message, path);
      break;
    case 'window':
      li = self.createLi(name, 'window', path);
      break;
    case 'date':
      li = self.createLi(name, String(value), path);
      break;
    case 'regexp':
      li = self.createLi(name, '[RegExp] ' + value.valueOf(), path);
      break;
    case 'node':
      li = self.getLiNode(name, value, path, classes);
      break;
    case 'function':
      li = self.getLiFunction(name, value, path, classes);
      break;
    case 'array':
      li = self.getLiArray(name, value, path, classes);
      break;
    case 'object':
      li = self.getLiObject(name, value, path, classes);
      break;
    case 'jQuery':
      li = self.getLijQuery(name, value, path, classes);
      break;
    default:
      li = self.createLi(name, 'unknown type (' + type +')', path);
    }

    var prefix = self.prefix;
    if (prefix) {
      classes = classes.map(function (c) {return prefix + c;});
    }
    li.setAttribute('class', classes.join(' '));
    return li;
  }

  /**
   * ノードタイプのLIエレメントの作成
   * @method getLiNode
   * @param  {String}   name
   * @param  {Node}     value
   * @param  {Array}    path
   * @return {Element}  li
   */
  function getLiNode(name, value, path) {
    var self = this;
    var ref = self.ref;
    var idx = ref.indexOf(value);
    if (!~idx) {
      idx = ref.length;
      ref.push(value);
    }
    var data;
    var tag;
    switch(value.nodeType) {
    case 1: // ELEMENT_NODE
      tag = value.tagName;
      data = value.innerHTML;
      break;
    case 3: // TEXT_NODE
      tag = 'TEXT';
      data = value.data;
      break;
    case 8: // COMMENT_NODE
      tag = 'COMMENT';
      data = value.data;
      break;
    case 9: // DOCUMENT_NODE
      tag = 'DOCUMENT';
      data = value.innerHTML;
      break;
    case 11: // DOCUMENT_FRAGMENT_NODE
      tag = 'FRAGMENT';
      data = value.textContent;
      break;
    default:
      tag = 'NODE_TYPE(' + value.nodeType + ')';
      data = '';
      console.log(value.nodeType);
    }

    if (20 < data.length) {
      data = data.substring(0, 21) + '...';
    }
    var li = self.createLi(name, '<' + tag + '> ' + data, path);
    li.setAttribute('data-ref', idx);
    return li;
  }


  var REG_FN = /(\(.*?\))/;


  /**
   * 関数タイプのLIエレメントの作成
   * @method getLiFunction
   * @param  {String}    name
   * @param  {Function}  value
   * @param  {Array}     path
   * @param  {Array}     classes
   * @return {Element}   li
   */
  function getLiFunction (name, value, path, classes) {
    var self = this;
    var ref = self.ref;
    var idx = ref.indexOf(value);
    var fnName = value.name || 'anonymous';
    var params = '';

    var source = value.toString();
    if (source) {
      var matches = source.match(REG_FN);
      if (matches) {
        params = ' ' + matches[1];
      }
    }
    var li = self.createLi(name, '[Function] ' + fnName + params, path);
    if (~idx) {
      classes.push('ref');
    } else {
      idx = ref.length;
      ref.push(value);
    }
    li.setAttribute('data-ref', idx);
    return li;
  }

  /**
   * jQueryタイプのLIエレメントの作成
   * @method getLijQuery
   * @param  {String}   name
   * @param  {jQUery}   value
   * @param  {Array}    path
   * @param  {Array}    classes
   * @return {Element}  li
   */
  function getLijQuery (name, value, path, classes) {
    var self = this;
    var ref = self.ref;
    var idx = ref.indexOf(value);
    var len = value.length;
    var li;
    if (~idx) {
      li = self.createLi(name, '[jQuery] (' + len + ')', path, true);
      classes.push('ref');
    } else {
      idx = ref.length;
      ref.push(value);
      li = self.createLi(name, '[jQuery] (' + len + ')', path, false);
      classes.push('expandable');
      if (len) {
        li.appendChild(self.getUljQuery(value, path));
      }
    }
    li.setAttribute('data-ref', idx);
    return li;
  }

  /**
   * jQueryタイプの子要素のULエレメントを作成
   * @method getUljQuery
   * @param  {jQuery}    value
   * @param  {Array}     path
   * @return {Element}   ul
   */
  function getUljQuery (value, path) {
    var self = this;
    var ul = document.createElement('ul');
    var len = value.length;
    var p;
    for(var i = 0; i < len; i++) {
      p = [].slice.call(path);
      p.push(i);
      ul.appendChild(self.getLi('[' + i + ']', value[i], p));
    }
    return ul;
  }

  /**
   * 配列タイプのLIエレメントの作成
   * @method getLiArray
   * @param  {String}  name
   * @param  {Array}   value
   * @param  {Array}   path
   * @param  {Array}   classes
   * @return {Element} li
   */
  function getLiArray (name, value, path, classes) {
    var self = this;
    var ref = self.ref;
    var idx = ref.indexOf(value);
    var len = value.length;
    var li;
    if (~idx) {
      li = self.createLi(name, '[Array] (' + len + ')', path, true);
      classes.push('ref');
    } else {
      idx = ref.length;
      ref.push(value);
      li = self.createLi(name, '[Array] (' + len + ')', path, false, 0 === len);
      classes.push('expandable');
      if (len) {
        li.appendChild(self.getUlArray(value, path));
      }
    }
    li.setAttribute('data-ref', idx);
    return li;
  }

  /**
   * 配列タイプの子要素のULエレメントを作成
   * @method getUlArray
   * @param  {jQuery}    value
   * @param  {Array}     path
   * @return {Element}   ul
   */
  function getUlArray (value, path) {
    var self = this;
    var ul = document.createElement('ul');
    value.forEach(function (item, i){
      var p = [].slice.call(path);
      p.push(i);
      ul.appendChild(self.getLi('[' + i + ']', item, p));
    });
    return ul;
  }

  /**
   * オブジェクタイプのLIエレメントの作成
   * @method getLiObject
   * @param  {String}   name
   * @param  {Object}   value
   * @param  {Array}    path
   * @param  {Array}    classes
   * @return {Element}  li
   */
  function getLiObject (name, value, path, classes) {
    var self = this;
    var ref = self.ref;
    var idx = ref.indexOf(value);
    var li;
    var proto = Object.getPrototypeOf(value);
    var keys = Object.getOwnPropertyNames(value);
    var ctorName = value.constructor ? value.constructor.name : 'constructor null';
    if (~idx) {
      li = self.createLi(name, '[' + ctorName + ']', path, true);
      classes.push('ref');
    } else {
      idx = ref.length;
      ref.push(value);
      if (keys.length || proto !== Object.prototype) {
        var unexpandable = !keys.length && proto === null;
        li = self.createLi(name, '[' + ctorName + ']', path, false, unexpandable);
        if (!unexpandable) {
          classes.push('expandable');
        }
        li.appendChild(self.getUlObject(value, path));
      } else {
        li = self.createLi(name, '[' + ctorName + '] {}', path);
      }
    }
    li.setAttribute('data-ref', idx);
    return li;
  }

  /**
   * オブジェクトタイプの子要素のULエレメントを作成
   * @method getUlObject
   * @param  {Object}    value
   * @param  {Array}     path
   * @return {Element}   ul
   */
  function getUlObject (value, path) {
    var self = this;
    var keys = Object.getOwnPropertyNames(value);
    var proto = Object.getPrototypeOf(value);
    var omit = ~self.omissions.indexOf(proto);
    var ul = document.createElement('ul');
    keys.forEach(function(name){
      var classes = getClasses (value, name);
      var item = ~classes.indexOf('accessor') ? 'Getter/Setter' : value[name];
      var p = [].slice.call(path);
      p.push(name);
      ul.appendChild(self.getLi(name, item, p, classes));
    });
    if (!omit) {
      var p2 = [].slice.call(path);
      p2.push('__proto__');
      ul.appendChild(self.getLi('__proto__', proto, p2, ['proto']));
    }
    return ul;
  }

  /**
   * LIエレメントの作成
   * @method createLi
   * @param  {String}  name
   * @param  {String}  value
   * @param  {Boolean} isRef 値のプロパティが既に他で表示済みである
   * @return {Element} li
   */
  function createLi (name, value, path, isRef, noToggle) {
    var prefix = this.prefix;
    var li = document.createElement('li');
    var toggle = isRef === false && !noToggle;
    var toggleSpan = toggle ? '<span class="'+ prefix + 'toggle">[ - ]</span>' : '';
    var html = '<span class="' + prefix + 'name">' + name + '</span> : ' + toggleSpan +
               '<span class="' + prefix + 'value">' + escape(value) + '</span>';
    if (isRef) {
      html += '<span class="' + prefix + 'isRef"> -&gt; ref</span>';
    }
    li.innerHTML = html;
    li.title = getTitle(path);
    return li;
  }

  // アクセスの方法が.であるものの正規表現
  var RAG_NORMAL = /^[_$a-z][_$a-z0-9]*$/i;

  /**
   * パスからタイトルを作成する
   * @method getTitle
   * @param  {Array}  path
   * @return {String} title
   */
  function getTitle (path) {
    return path.reduce(function(x, y) {
      var normal = String(y).match(RAG_NORMAL);
      if (!normal) {
        y =  typeof y === 'number' ? '[' + y + ']' : '[\'' + y + '\']';
      } else if (x.length) {
        y = '.' + y;
      }
      return x + y;
    }, '');
  }

  /**
   * タイトルからパスを作成する
   * @method getPath
   * @param  {Stroing} title
   * @return {Array}   path
   */
  function getPath (title) {
    return title.split(/[\[\]]/).reduce(function(x, y){
      if (!y.length){
        return x;
      }
      if (y[0] === '\'') {
        x.push(y.replace(/\'/g, ''));
      } else if (/[0-9]/.test(y[0])){
        x.push(Number(y));
      } else {
        var z = y.split('.').filter(function(x){return x.length;});
        if (z.length) {
          x = x.concat(z);
        }
      }
      return x;
    },[]);
  }

  /**
   * オブジェクトを取得する
   * @method getValue
   * @param  {Object}  obj
   * @param  {Array}   path
   * @param  {Boolean} noSkip
   * @return {Mixed}   result
   */
  function getValue (obj, path, noSkip) {
    path.some(function (p, i, s) {
      if (p === '__proto__') {
        if (i + 1 === s.length || noSkip) {
          obj = Object.getPrototypeOf(obj);
        }
      } else {
        obj = obj[p];
      }
    });
    return obj;
  }

  /**
   * タグ文字をエスケープ
   * @method escape
   * @param  {String} val
   * @return {Srting} escapedVal
   */
  function escape(val) {
    return val.replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
  }

  return main;
})();