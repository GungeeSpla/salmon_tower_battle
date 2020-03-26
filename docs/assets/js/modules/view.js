import * as constants from './constants/config.js';
import * as sceneModules from './scenes.js';
import * as utilities from './utilities.js';
import LANGUAGES from './constants/languages.js';
import Scene from './classes/Scene.js';

// カレントシーン
let currentScene = {};
// レイヤー
const layers = {};
// シーン
const scenes = {};
// キャンバス
let canvas;
// キャンバスコンテナ
let canvasContainer;
// 最後にジャンプした時間
let lastJumpTime = 0;
// フィット関数予約時のタイマーID
let canvasFittingTimer;
/** アプリモジュール */
let app;
// 現在のキャンバス情報
export const canvasDetail = {
  originWidth: 0,
  originHeight: 0,
  targetWidth: 0,
  targetHeight: 0,
  windowWidth: 0,
  windowHeight: 0,
  scale: 1,
  width: 0,
  height: 0,
  margin: { x: 0, y: 0 },
  padding: { x: 0, y: 0 },
};

/** setApp(module)
 * アプリモジュールをセットします。
 * @param {Object} module - アプリモジュール。
 */
export function setApp(module) {
  app = module;
}

/** fitCanvas()
 * キャンバスをウィンドウサイズにフィットさせます。
 */
export function fitCanvas() {
  // ウィンドウサイズ(横幅、高さ、縦横比）
  const ww = utilities.getWindowWidth();
  const wh = utilities.getWindowHeight();
  const wr = wh / ww;
  // ゲームのオリジナルサイズ(横幅、高さ、縦横比）
  const ow = constants.CANVAS_WIDTH;
  const oh = constants.CANVAS_HEIGHT;
  const or = constants.CANVAS_RATIO;
  // 実際に設定するキャンバスサイズ(横幅、高さ、縦横比）
  let cw;
  let ch;
  const cr = Math.max(
    constants.CANVAS_MIN_RATIO,
    Math.min(constants.CANVAS_MAX_RATIO, wr),
  );
  let scale;
  let mx;
  let my;
  let px;
  let py;
  // ｢ウィンドウがオリジナルサイズよりも縦長か？｣ で処理を分けよう
  if (cr > or) {
    // ウィンドウが縦長の場合、キャンバスの「横幅」は変更せずに「高さ」を広げよう
    cw = ow;
    ch = ow * cr;
    scale = ww / cw;
    mx = 0;
    my = Math.floor((wh - (ch * scale)) / 2);
    px = 0;
    py = Math.floor((ch - oh) / 2);
  } else {
    // 画面が横長の場合、キャンバスの「高さ」は変更せずに「横幅」を広げよう
    cw = oh * (1 / cr);
    ch = oh;
    scale = wh / ch;
    mx = Math.floor((ww - (cw * scale)) / 2);
    my = 0;
    px = Math.floor((cw - ow) / 2);
    py = 0;
  }
  // 小数部分を切り捨てる
  cw = Math.floor(cw);
  ch = Math.floor(ch);
  // キャンバスに設定する横幅と高さが決定できたようだ！
  canvas.setAttribute('width', cw);
  canvas.setAttribute('height', ch);
  //
  Object.assign(canvasDetail, {
    windowWidth: ww,
    windowHeight: wh,
    originWidth: ow,
    originHeight: oh,
    targetWidth: Math.floor(cw * scale),
    targetHeight: Math.floor(ch * scale),
    width: cw,
    height: ch,
    scale,
    margin: { x: mx, y: my },
    padding: { x: px, y: py },
  });
  // コンテナにスタイルをセット
  // transform、width、height
  canvasContainer.style.setProperty(
    'transform',
    `translateX(${mx}px) translateY(${my}px) scale(${scale})`,
  );
  canvasContainer.style.setProperty('width', `${cw}px`);
  canvasContainer.style.setProperty('height', `${ch}px`);
  // canvasresizeイベントを発生
  utilities.dispatchDocumentEvent('canvasresize', canvasDetail);
}

/** bookFitCanvas()
 * フィット関数を予約します。
 */
export function bookFitCanvas() {
  clearTimeout(canvasFittingTimer);
  canvasFittingTimer = setTimeout(() => {
    fitCanvas();
  }, constants.CANVAS_FITTING_DURATION);
}

/** unlockSound()
 *
 */
export function unlockSound() {
  app.sound.unlock();
  window.removeEventListener('mousedown', unlockSound);
  canvas.removeEventListener('touchstart', unlockSound);
}

/** setupUnlockSound()
 *
 */
export function setupUnlockSound() {
  window.addEventListener('mousedown', unlockSound);
  canvas.addEventListener('touchstart', unlockSound);
}

/** clearLayer(name)
 * レイヤーを空にします。
 */
export function clearLayer(name) {
  utilities.emptyElement(layers[name]);
}

/** clearLayerAll()
 * すべてのレイヤーを空にします。
 */
export function clearLayerAll() {
  constants.LAYER_NAMES.forEach((name) => {
    clearLayer(name);
  });
}

/** jump(target)
 * 指定したシーンに遷移します。
 * まず現在のシーンのleaveメソッドを呼んで退出処理を行い、レイヤーを空にして、
 * 遷移先のシーンのenterメソッドを呼びます。
 * @param {string} target - 遷移先のシーンのラベル。
 * @param {Object} options - オプション
 */
export function jump(target, options = {}) {
  // あまりに短時間に連続してこの関数が呼ばれた場合、キャンセルする
  const nowTime = new Date().getTime();
  if (nowTime - lastJumpTime < constants.SCENE_JUMP_DURATION) {
    return;
  }
  lastJumpTime = nowTime;
  // 目標シーンを取得する
  const targetScene = scenes[target];
  // 定義されていなければエラーを吐いて終了する
  if (!targetScene) {
    utilities.logger.error('シーンが定義されていません: %s', target);
    return;
  }
  // 現在シーンの退室関数が定義されていればそれを実行する
  if (typeof currentScene.leave === 'function') {
    currentScene.leave(options);
  }
  // 現在シーンをクリアーする
  clearLayer('main');
  // 目標シーンに入室する
  targetScene.enter(options);
  // BGMを再生する
  if (targetScene.bgm) {
    app.sound.play(targetScene.bgm, { volume: 0.3, loop: true });
  }
  currentScene = targetScene;
}

/** getTranslatedText()
 */
export function getTranslatedText(key) {
  if (key in LANGUAGES && app.storage.get('settings').language in LANGUAGES[key]) {
    return LANGUAGES[key][app.storage.get('settings').language];
  }
  return key;
}

/** closeAlert()
 * アラートを閉じます。
 */
export function closeAlert() {
  layers.alert.firstChild.classList.remove('alert-showed');
  setTimeout(() => {
    layers.alert.style.setProperty('display', 'none');
  }, 350);
}

/** alert(options)
 * アラートを出します。
 * @param {Object} options - オプション
 * @param {string} options.title - オプション
 * @param {string} options.message - オプション
 * @param {string} options.okLabel - オプション
 * @param {string} options.ngLabel - オプション
 * @param {function} options.ok - オプション
 * @param {boolean} options.onlyok - オプション
 */
export function alert(options) {
  const outer = layers.alert.firstChild;
  const title = outer.querySelector('.alert-title');
  const message = outer.querySelector('.alert-message');
  const ng = document.getElementById('alert-button-ng');
  const ok = document.getElementById('alert-button-ok');
  // タイトルテキスト(省略可)
  // 省略した場合はタイトル要素自体を非表示にする
  if (options.title) {
    title.style.setProperty('display', 'block');
    title.textContent = getTranslatedText(options.title);
  } else {
    title.style.setProperty('display', 'none');
  }
  // メッセージとボタンのテキスト
  let messageStr = getTranslatedText(options.message);
  if (options.vars) {
    messageStr = messageStr.replace(/%([A-Za-z0-9]+)%/g, (match, p1) => {
      return options.vars[p1];
    });
  }
  message.innerHTML = messageStr;
  // OK関数が指定されているかどうか
  if (options.ok) {
    // OK関数が指定されているようだ！
    ok.textContent = getTranslatedText(options.okLabel || 'cool');
    ok.onclick = () => {
      options.ok();
      closeAlert();
    };
    if (options.onlyok) {
      // NGボタンは不要
      ng.style.setProperty('display', 'none');
    } else {
      // NGボタンを表示して閉じるための関数をセットしてやる
      ng.style.setProperty('display', 'inline-block');
      ng.textContent = getTranslatedText(options.ngLabel || 'not-cool');
      ng.onclick = closeAlert;
    }
  } else {
    // OK関数は指定されていないようだ！
    // OKボタンを閉じるためのボタンとして使う
    ok.textContent = getTranslatedText(options.okLabel || 'ok');
    ok.onclick = closeAlert;
    // NGボタンは不要
    ng.style.setProperty('display', 'none');
  }
  layers.alert.style.setProperty('display', 'block');
  setTimeout(() => {
    outer.classList.add('alert-showed');
  }, 17);
}

/** log(text)
 * ログを出します。
 * @param {string} text - メッセージ
 */
export function log(text) {
  const div = document.createElement('div');
  div.classList.add('push-log');
  div.innerHTML = getTranslatedText(text);
  layers.main.appendChild(div);
  setTimeout(() => {
    layers.main.removeChild(div);
  }, 3000);
}

/** showLoading()
 * ローディング画面を表示します。
 */
export function showLoading() {
  layers.loading.style.setProperty('display', 'block');
}

/** hideLoading()
 * ローディング画面を非表示にします。
 */
export function hideLoading() {
  layers.loading.style.setProperty('display', 'none');
}

/** firstJump()
 */
export function firstJump() {
  // クエリパラメータ ?invite=xxx が設定されているかどうか
  if (utilities.getQueries().invite) {
    // 設定されていた場合、招待ラベルにジャンプする
    jump('invite');
  } else {
    // 設定されていなかった場合、初期ラベルにジャンプする
    jump(window.INITIAL_LABEL || constants.INITIAL_LABEL);
  }
}

/** initialize(targetLabel)
 * 初期化します。
 * @param {string} targetLabel - 最初に遷移するシーンのラベル。省略するとconstantsから拾ってくる。
 */
export function initialize(targetLabel = constants.INITIAL_LABEL) {
  // シーン定義からシーンインスタンス群を作成
  Object.keys(sceneModules).forEach((key) => {
    scenes[sceneModules[key].label] = new Scene(
      sceneModules[key], {
        layers, utilities, constants, app,
      },
    );
  });
  // コンテナを取得
  // canvasContainer = document.getElementById(constants.CONTAINER_ID);
  // コンテナを作成して追加
  canvasContainer = document.createElement('div');
  canvasContainer.setAttribute('id', constants.CONTAINER_ID);
  document.body.appendChild(canvasContainer);
  // キャンバスを作成してコンテナに収納
  canvas = document.createElement('canvas');
  canvas.setAttribute('id', constants.CANVAS_ID);
  canvas.style.setProperty('z-index', 0);
  canvasContainer.appendChild(canvas);
  // 設定したレイヤー枚数だけレイヤーを生成してコンテナに収納
  constants.LAYER_NAMES.forEach((name, i) => {
    const layer = document.createElement('div');
    layer.classList.add('layer');
    layer.classList.add(`layer-${name}`);
    layer.style.setProperty('z-index', i + 1);
    canvasContainer.appendChild(layer);
    layers[name] = layer;
  });
  // ローディングレイヤーの中身を作成する
  layers.loading.style.setProperty('display', 'none');
  layers.loading.innerHTML = `<div id="loading">
    <p>
      <svg id="loading-tower" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 500" width="250" height="500">
        <g paint-order="markers fill stroke">
          <path d="M203.756 446.654H58.04v-40h145.715z"/>
          <path d="M197.041 396.654h-135v-40h135z"/>
          <path d="M189.756 346.654H64.04v-40h125.715z"/>
          <path d="M181.041 296.654h-115v-40h115z"/>
          <path d="M170.613 246.654H72.04v-40h98.572z"/>
          <path d="M166.899 196.654H74.04v-40H166.9z"/>
          <path d="M158.756 146.654H78.04v-40h80.715z"/>
          <path d="M30.672 20.381v34.425h47.37v41.848H220.306V76.708h-54.27V38.574h-65.21V20.38zm106.469 30.074a9.014 9.014 0 019.014 9.015 9.014 9.014 0 11-9.014-9.015z"/>
          <path d="M58.041 457.667v12.725h19.194v20.322h20.31v-20.322h67.42v20.322h20.313v-20.322h18.12v-12.725z"/>
        </g>
      </svg>
    </p>
    <p style="margin-left: 35px;">LOADING…</p>
  </div>`;
  // アラートレイヤーの中身を作成する
  layers.alert.style.setProperty('display', 'none');
  layers.alert.innerHTML = `<div class="alert-outer">
    <div class="alert">
      <div class="alert-back">
        <div class="alert-back-img-outer">
          <img src="./assets/img/forcss/alert-logo-1.png">
          <img src="./assets/img/forcss/alert-logo-2.png">
          <img src="./assets/img/forcss/alert-logo-3.png">
          <img src="./assets/img/forcss/alert-logo-4.png">
        </div>
      </div>
      <div class="alert-title">注意</div>
      <div class="alert-message">評価に差があるプレイヤーと<br>バイトに参加する場合<br>評価が上がらないことがあるよ<br>それでも、バイトに参加するかい？</div>
      <div class="alert-button-outer">
        <div id="alert-button-ng" class="alert-button clickable">いいえ</div>
        <div id="alert-button-ok" class="alert-button clickable">はい！</div>
      </div>
    </div>
  </div>`;
  // サウンド再生制限の解除を仕込む
  setupUnlockSound();
  // キャンバスを画面サイズに合わせる
  fitCanvas();
  // 画面リサイズ時のイベントハンドラ
  window.addEventListener('resize', () => {
    bookFitCanvas();
  });
  // 画面回転時のイベントハンドラ
  window.addEventListener('orientationchange', () => {
    bookFitCanvas();
  });
}
