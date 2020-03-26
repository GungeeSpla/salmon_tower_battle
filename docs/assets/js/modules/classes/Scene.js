/** parseLengthProperty(value)
 * number型だった場合に限り'px'を付け足して返します。
 * @param {string|number} value - スタイルの長さプロパティ
 * @return {string} pxが付け足された値
 */
function parseLengthProperty(value) {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

/** Scene
 */
export default class Scene {
  /** constructor(define, options) */
  constructor(define, options) {
    Object.assign(this, define, options);
  }

  /** getLayer(name)
   * @param {string} name - レイヤー名
   * @return {Element} レイヤー要素
   */
  getLayer(name) {
    if (name in this.layers) {
      return this.layers[name];
    }
    return document.getElementById(name);
  }

  /** append(options)
   * 要素を追加します。
   * @param {Object} options - オプション
   * @param {string} options.layer - 挿入するレイヤー名
   */
  append(options) {
    // オプションを元に要素を作成する
    const elm = this.createElement(options);
    // 親要素を取得する
    const target = this.getLayer(options.layer || 'main');
    // 作成した要素を親要素に追加する
    target.appendChild(elm);
  }

  /** createElement(_options)
   * 要素を作成して返します。
   * @param {Object} _options - オプション
   * @param {string} _options.tag - タグ名
   * @param {string} _options.text - LANGUAGESのキーまたはinnerHTML
   * @param {string} _options.class - クラス(複数指定する場合は半角スペースで区切る)
   * @param {string} _options.id - id属性
   * @param {string} _options.src - src属性
   * @param {Object} _options.attr - その他の属性
   * @param {number} _options.x - スタイルのleftプロパティ
   * @param {number} _options.y - スタイルのtopプロパティ
   * @param {number} _options.width - スタイルのwidthプロパティ
   * @param {number} _options.height - スタイルのheightプロパティ
   * @param {Object} _options.style - スタイルのその他のプロパティ
   * @param {boolean} _options.centering - 要素の基準位置を中央にするかどうか
   * @param {function} _options.onclick - クリックイベントハンドラ
   * @param {function} _options.onclickonce - クリックイベントハンドラ(1回だけ)
   * @param {string} _options.jump - ジャンプするラベル
   * @param {Array.<object>} _options.contents - 子要素のオプション配列
   * @return {Element} 作成した要素
   */
  createElement(_options) {
    const options = Object.assign({
      tag: 'div',
      text: '',
      style: {},
      attr: {},
    }, _options);
    //
    const elm = document.createElement(options.tag);
    // テキスト
    if (options.innerHTML) {
      elm.innerHTML = options.innerHTML;
    } else if (options.text) {
      elm.innerHTML = this.app.view.getTranslatedText(options.text);
    }
    if (options.innerSpanText) {
      const spanElm = elm.getElementsByTagName('span')[0];
      if (spanElm) {
        spanElm.textContent = options.innerSpanText;
      }
    }
    // id
    if (options.id) {
      elm.setAttribute('id', options.id);
    }
    // src
    if (options.src) {
      elm.setAttribute('src', options.src);
    }
    // クラス
    if (options.class) {
      options.class.split(' ').forEach((name) => {
        elm.classList.add(name);
      });
    }
    // left, top
    if (options.x) {
      options.x = parseLengthProperty(options.x);
      elm.style.setProperty('left', options.x);
      Object.assign(options.style, {
        position: 'absolute',
      });
    }
    if (options.y) {
      options.y = parseLengthProperty(options.y);
      elm.style.setProperty('top', options.y);
      Object.assign(options.style, {
        position: 'absolute',
      });
    }
    // width, height
    if (options.width) {
      options.width = parseLengthProperty(options.width);
      elm.style.setProperty('width', options.width);
    }
    if (options.height) {
      options.height = parseLengthProperty(options.height);
      elm.style.setProperty('height', options.height);
    }
    // 基準位置を中央に
    if (options.centering) {
      elm.style.setProperty('left', `calc(${options.x} - (${options.width} / 2))`);
      elm.style.setProperty('top', `calc(${options.y} - (${options.height} / 2))`);
    }
    // その他任意のスタイル
    if (options.style) {
      Object.keys(options.style).forEach((key) => {
        elm.style.setProperty(key, options.style[key]);
      });
    }
    // その他任意の属性
    if (options.attr) {
      Object.keys(options.attr).forEach((key) => {
        elm.setAttribute(key, options.attr[key]);
      });
    }
    if (options.onclick) {
      // onclick
      elm.classList.add('clickable');
      elm.addEventListener('click', options.onclick);
    } else if (options.onclickonce) {
      // onclickonce
      elm.classList.add('clickable');
      elm.addEventListener('click', options.onclickonce, { once: true });
    } else if (options.jump) {
      // jump
      elm.classList.add('clickable');
      if (typeof options.jump === 'string') {
        elm.addEventListener('click', () => {
          this.app.view.jump(options.jump);
        }, { once: true });
      } else {
        elm.addEventListener('click', () => {
          this.app.view.jump(options.jump[0], options.jump[1]);
        }, { once: true });
      }
    }
    if (options.contents) {
      options.contents.forEach((contentOpt) => {
        if (contentOpt) {
          const contentElm = this.createElement(contentOpt);
          elm.appendChild(contentElm);
        }
      });
    }
    return elm;
  }
}
