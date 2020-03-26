import * as constants from './constants/config.js';
import SvgPathData from './classes/SvgPathData.js';
const { b2Vec2 } = window;

const imageCache = {};
const svgPathDataCache = {};
const userEvents = {};
const listeners = {};
const canUsePerformance = (window.performance !== undefined);
let queriesCache = null;

/** parseDegree(rad)
 * ラジアンを度に変換する。
 * @param {number} rad - ラジアン。例えば 2π＝6.28… (rad)
 * @return {number} 度に変換された値。例えば 360 (°)
 */
export function parseDegree(rad) {
  return rad * (180 / Math.PI);
}

/** parseRadian(deg)
 * 度をラジアンに変換する。
 * @param {number} deg - 角度。例えば 360 (°)
 * @return {number} ラジアンに変換された値。例えば 2π＝6.28… (rad)
 */
export function parseRadian(deg) {
  return deg * (Math.PI / 180);
}

/** round(num, unit)
 * 指定した桁数で四捨五入します。
 * @param {number} num - 四捨五入する数
 * @param {number} unit - 桁数
 * @return {number} 四捨五入された数。たとえば(1,234, 2) => 1.23
 */
export function round(num, unit) {
  return Math.round(num * (10 ** unit)) / (10 ** unit);
}

/** ucfirst(str)
 * 最初の文字を大文字にして返します。
 * @param {string} str - 文字列
 * @return {string} 最初の文字を大文字に変換された文字列
 */
export function ucfirst(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}

/** logger
 * コンソールやDOMにサインを書き出すデバッグ用のオブジェクトです。
 */
export const logger = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  getMarkerStyle(color) {
    return `background: linear-gradient(transparent 60%, ${color} 60%);
      font-weight: bold;`;
  },
  getBigMarkerStyle(color, textColor = 'black') {
    return `background: linear-gradient(transparent 0%, ${color} 0%);
      color: ${textColor}; font-weight: bold;`;
  },
};
// ロガーの無効化
if (!constants.IS_DEBUG_LOG) {
  Object.keys(logger).forEach((key) => {
    logger[key] = () => {};
  });
}

/** setB2BodyXYAngle(options)
 * LiquidFunのb2Bodyインスタンスに「x座標」「y座標」「回転量」を直接指定します。
 * @param {b2Body} options - オプション
 * @param {b2Body} options.body - LiquidFunのb2Bodyインスタンス
 * @param {number} options.x - x座標
 * @param {number} options.y - y座標
 * @param {number} options.angle - 角度 (rad)
 */
export function setB2BodyXYAngle(options) {
  const x = (options.x !== undefined) ? options.x : options.body.GetPosition().x;
  const y = (options.y !== undefined) ? options.y : options.body.GetPosition().y;
  const angle = (options.angle !== undefined) ? options.angle : options.body.GetAngle();
  options.body.SetTransform(new b2Vec2(x, y), angle);
}

/** addB2BodyXYAngle(options)
 * LiquidFunのb2Bodyインスタンスに「x座標」「y座標」「回転量」を足します。
 * @param {b2Body} options - オプション
 * @param {b2Body} options.body - LiquidFunのb2Bodyインスタンス
 * @param {number} options.x - x座標
 * @param {number} options.y - y座標
 * @param {number} options.angle - 角度 (rad)
 */
export function addB2BodyXYAngle(options) {
  const pos = options.body.GetPosition();
  const x = (options.x !== undefined) ? options.x : 0;
  const y = (options.y !== undefined) ? options.y : 0;
  const angle = (options.angle !== undefined) ? options.angle * (Math.PI / 180) : 0;
  setB2BodyXYAngle({
    body: options.body,
    x: pos.x + x,
    y: pos.y + y,
    angle: options.body.GetAngle() + angle,
  });
}

/** getImage(url)
 * 画像ファイルのURLを受け取ってImage Elementインスタンスを返します。
 * @param {string} url - 画像ファイルのURL
 * @return {Promise} Promiseインスタンス
 */
export function getImage(url) {
  return new Promise((resolve) => {
    // キャッシュに保存されているならばそれをすぐさまresolveする
    if (url in imageCache) {
      resolve(imageCache[url]);
      return;
    }
    // Image Elementインスタンスを作成
    const img = new Image();
    // ロードが完了したら
    img.onload = () => {
      // キャッシュに保存して自身をresolve
      imageCache[url] = img;
      resolve(img);
    };
    // ロード開始
    img.src = url;
  });
}

/** getSvgPathData(url)
 * SVGファイルのURLを受け取って「SVGファイルのXMLデータをパスデータに変換したもの」を返します。
 * @param {string} url - SVGファイルのURL
 * @return {Promise} Promiseインスタンス
 */
export function getSvgPathData(url) {
  return new Promise((resolve) => {
    // キャッシュに保存されているならばそれをすぐさまresolveする
    if (url in svgPathDataCache) {
      resolve(svgPathDataCache[url]);
      return;
    }
    // キャッシュには保存されていないようだ！
    // XMLHttpRequestを作成
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    // エラーが生じた場合にはnullをresolveするようにしておこう
    xhr.onerror = () => {
      resolve(null);
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200 || xhr.status === 304) {
          // 通信に成功したならば
          // XMLデータからパスデータを作成
          const svgPathData = new SvgPathData(xhr.responseXML);
          // urlをキーにしてキャッシュに保存
          svgPathDataCache[url] = svgPathData;
          // パスデータをresolveしよう
          resolve(svgPathData);
        } else {
          // 通信に失敗したならば
          resolve(null);
        }
      }
    };
    // 通信開始
    xhr.send(null);
  });
}

/** existsURL(url)
 * URLにアクセス可能かどうかを調べます。
 * @param {string} url - 調べるURL
 * @return {Promise<boolean>} URLにアクセス可能かどうか
 */
export function existsURL(url) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 404) {
          resolve(false);
        } else {
          resolve(true);
        }
      }
    };
    // 通信開始
    xhr.send(null);
  });
}

/** getWindowWidth()
 * @return {number} 画面の横幅(px)
 */
export function getWindowWidth() {
  return window.innerWidth
    || (document.body ? document.body.clientWidth : false)
    || document.documentElement.clientWidth;
}

/** getWindowHeight()
 * @return {number} 画面の高さ(px)
 */
export function getWindowHeight() {
  return window.innerHeight
    || (document.body ? document.body.clientHeight : false)
    || document.documentElement.clientHeight;
}

/** getTime()
 * 現在時刻を取得します。測定単位がmsecの点に注意してください。
 * performance.nowが使えるならそちらを、使えなければDateを使います。
 * @return {number} UNIX時刻(msec)
 */
export function getTime() {
  if (canUsePerformance) {
    return window.performance.now();
  }
  return new Date().getTime();
}

/** padding00(number)
 */
export function padding00(number) {
  return (`00${number}`).slice(-2);
}

/** getDate()
 */
export function getDate() {
  const now = new Date();
  const Y = now.getFullYear();
  const M = padding00(now.getMonth() + 1);
  const D = padding00(now.getDate());
  const d = ['Sun',
    'Mon',
    'The',
    'Wed',
    'Thu',
    'Fri',
    'Sat'][now.getDay()];
  const h = padding00(now.getHours());
  const m = padding00(now.getMinutes());
  const s = padding00(now.getSeconds());
  // const unix = Math.floor(now.getTime() / 10000);
  return `${Y}/${M}/${D} ${d} ${h}:${m}:${s}`;
}

/** getTimestamp()
 */
export function getTimestamp() {
  const now = new Date();
  const Y = now.getFullYear();
  const M = padding00(now.getMonth() + 1);
  const D = padding00(now.getDate());
  const h = padding00(now.getHours());
  const m = padding00(now.getMinutes());
  const s = padding00(now.getSeconds());
  const unix = Math.floor(now.getTime() / 10000);
  const string = `${Y}/${M}/${D} ${h}:${m}:${s}`;
  return { unix, string };
}

/** existsElectron()
 */
export function existsElectron() {
  return !!window.electron;
}

/** getBrowserName()
 */
export function getBrowserName() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('msie') > -1
     || userAgent.indexOf('trident') > -1) {
    return 'ie';
  } if (userAgent.indexOf('edge') > -1) {
    return 'edge';
  } if (userAgent.indexOf('chrome') > -1) {
    return 'chrome';
  } if (userAgent.indexOf('safari') > -1) {
    return 'safari';
  } if (userAgent.indexOf('firefox') > -1) {
    return 'firefox';
  } if (userAgent.indexOf('opera') > -1) {
    return 'opera';
  }
  return 'other';
}

/** getOSName()
 */
export function getOSName() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('iphone') > -1) {
    return 'iphone';
  } if (userAgent.indexOf('ipad') > -1) {
    return 'ipad';
  } if (userAgent.indexOf('android') > -1) {
    if (userAgent.indexOf('mobile') > -1) {
      return 'android';
    }
    return 'android';
  } if (userAgent.indexOf('windows') > -1) {
    return 'windows';
  } if (userAgent.indexOf('mac os x') > -1) {
    return 'mac';
  }
  return 'other';
}

/** getQueries()
 * クエリパラメータを取得します。
 */
export function getQueries() {
  if (queriesCache) {
    return queriesCache;
  }
  const queryStr = window.location.search.slice(1);
  const queries = {};
  if (queryStr) {
    queryStr.split('&').forEach((str) => {
      const queryArr = str.split('=');
      if (queryArr[1]) {
        [, queries[queryArr[0]]] = queryArr;
      } else {
        queries[queryArr[0]] = '';
      }
    });
  }
  queriesCache = queries;
  return queries;
}

/** logDisplayObjectCount(container)
 * StageあるいはContainerが含むすべてのDisplayObjectの数を数えます。
 * @param {Object} containt - Stage、StageGL、Containerのいずれか
 */
export function logDisplayObjectCount(container, depth = 0) {
  let count = 0;
  container.children.forEach((child) => {
    if (child instanceof createjs.Container) {
      count += logDisplayObjectCount(child, depth + 1);
    } else {
      count += 1;
    }
  });
  if (depth === 0) {
    console.log(`${count} display obejcts exist.`);
  }
  return count;
}

/** emptyElement(elm)
 * 指定したDOM要素のすべての子要素を削除します。
 * https://freefielder.jp/blog/2015/09/javascript-remove-childnodes.html
 * @param {Element|string} elm - 空にしたい要素のElementまたはセレクタ文字列。
 */
export function emptyElement(elm) {
  const targetElm = (typeof elm === 'string') ? document.querySelector(elm) : elm;
  while (targetElm.firstChild) {
    targetElm.removeChild(targetElm.firstChild);
  }
  // const cloneElm = targetElm.cloneNode(false);
  // targetElm.parentNode.replaceChild(cloneElm, targetElm);
}

/** dispatchDocumentEvent(type, detail)
 * ユーザーイベントを生成し、documentに対してそのイベントを発火します。
 * 以下が使用例です。
 *
 * // ユーザーイベントhogehogeのイベントハンドラをdocumentに取り付ける
 * document.addEventListener('hogehoge', (e) => {
 *   console.log(e.detail.x); // 100
 * });
 *
 * // ユーザーイベントhogehogeを発行する
 * dispatchDocumentEvent('hogehoge', {x: 100});
 *
 * @param {string} type - イベントタイプ
 * @param {Object} detail - イベントハンドラに渡すディティール
 */
export function dispatchDocumentEvent(type, detail = {}) {
  if (!(type in userEvents)) {
    userEvents[type] = document.createEvent('HTMLEvents');
  }
  userEvents[type].initEvent(type, false, false);
  userEvents[type].detail = detail;
  document.dispatchEvent(userEvents[type]);
}

/** addDocumentEventListener(argEventType, listener)
 */
export function addDocumentEventListener(argEventType, listener) {
  const [
    eventType,
    groupName,
  ] = argEventType.split('.');
  if (!(eventType in listeners)) {
    listeners[eventType] = [];
    document.addEventListener(eventType, (e) => {
      listeners[eventType].forEach((item) => {
        item.callback(e);
      });
    });
  }
  listeners[eventType].push({ groupName, callback: listener });
}

/** removeDocumentEventListener(argEventType)
 */
export function removeDocumentEventListener(argEventType) {
  // イベントタイプとグループネームを取得
  const [
    eventType,
    groupName,
  ] = argEventType.split('.');
  // イベントタイプのリスナーが存在するなら
  if (eventType in listeners) {
    // グループネームの有無で場合分け
    if (!groupName) {
      // グループネームが指定されていない場合
      // そのイベントタイプのリスナー配列を延々とポップして空にする
      while (listeners[eventType][0]) {
        listeners[eventType].pop();
      }
    } else {
      // グループネームが指定されている場合
      // そのイベントタイプのリスナー配列を走査
      for (let i = 0; i < listeners[eventType].length; i += 1) {
        // グループネームが一致するリスナーをつまみだす
        if (groupName === listeners[eventType][i].groupName) {
          listeners[eventType].splice(i, 1);
          i -= 1;
        }
      }
    }
  }
}

/** execCopy(str)
 * @see {@link https://qiita.com/simiraaaa/items/2e7478d72f365aa48356}
 * @param {string} str - コピーする文字列
 * @param {string} select - 選択する要素のID
 * @return {boolean} コピーに成功したかどうか
 */
export function execCopy(str, select) {
  const tmp = document.createElement('div');
  const pre = document.createElement('pre');
  pre.style.webkitUserSelect = 'auto';
  pre.style.userSelect = 'auto';
  tmp.appendChild(pre).textContent = str;
  const s = tmp.style;
  s.position = 'fixed';
  s.right = '200%';
  document.body.appendChild(tmp);
  document.getSelection().selectAllChildren(tmp);
  const result = document.execCommand('copy');
  document.body.removeChild(tmp);
  if (select) {
    const element = document.getElementById(select);
    element.style.webkitUserSelect = 'auto';
    element.style.userSelect = 'auto';
    window.getSelection().selectAllChildren(element);
  }
  return result;
}


/** sleep(time)
 * 指定した時間処理を停止します。
 * async関数内でawaitを付けて呼び出します。
 * @example
 * async function hogehoge() {
 *   console.log(1);
 *   await sleep(1000);
 *   console.log(2);
 * }
 * @param {number} time - 停止する時間(msec)
 * @return {Promise<null>}
 */
export function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
}

/** logAsciiArt()
 * コンソールにアスキーアートを出して遊びます。
 * loggerではなくconsoleを直接使うので、
 * デバッグモードが無効な場合(本番モード)でも表示されます。
 */
export function logAsciiArt() {
  // SALMON TOWER BATTLE
  // Ver.x.x.x
  console.log(`%c
███████╗ █████╗ ██╗     ███╗   ███╗ ██████╗ ███╗   ██╗
██╔════╝██╔══██╗██║     ████╗ ████║██╔═══██╗████╗  ██║
███████╗███████║██║     ██╔████╔██║██║   ██║██╔██╗ ██║
╚════██║██╔══██║██║     ██║╚██╔╝██║██║   ██║██║╚██╗██║
███████║██║  ██║███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
%c                                                      
████████╗ ██████╗ ██╗    ██╗███████╗██████╗           
╚══██╔══╝██╔═══██╗██║    ██║██╔════╝██╔══██╗          
   ██║   ██║   ██║██║ █╗ ██║█████╗  ██████╔╝          
   ██║   ██║   ██║██║███╗██║██╔══╝  ██╔══██╗          
   ██║   ╚██████╔╝╚███╔███╔╝███████╗██║  ██║          
   ╚═╝    ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝          
                                                      
██████╗  █████╗ ████████╗████████╗██╗     ███████╗    
██╔══██╗██╔══██╗╚══██╔══╝╚══██╔══╝██║     ██╔════╝    
██████╔╝███████║   ██║      ██║   ██║     █████╗      
██╔══██╗██╔══██║   ██║      ██║   ██║     ██╔══╝      
██████╔╝██║  ██║   ██║      ██║   ███████╗███████╗    
╚═════╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚══════╝╚══════╝

%cVer.${constants.APP_VERSION} ${constants.IS_DEVELOPMENT ? '(DEVELOPMENT)' : ''}
`, 'color: orange;', 'color: limegreen;', 'color: orange; font-weight: bold; font-size: 24px;');
  // アプリのバージョンとクエリが一致しなかった場合警告を出す
  if (constants.APP_VERSION !== constants.APP_VERSION_QUERY) {
    console.error(`%cMismatch app version (${constants.APP_VERSION}) and query parameter (${constants.APP_VERSION_QUERY})`, logger.getBigMarkerStyle('pink'));
  }
}
