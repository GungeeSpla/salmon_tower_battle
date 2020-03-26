/*! Reference
 * https://github.com/emaame/salmonrun_time_timer/blob/master/src/sound.js
 * https://github.com/GoogleChromeLabs/airhorn/blob/master/app/scripts/main.min.js
 * https://qiita.com/cortyuming/items/b6e3784d08d7a90b3614
 */

import {
  SOUND_SILENT, SOUNT_INITIAL_BGM, SOUND_URL_BASE, SOUND_VOLUME_ALPHAS,
} from './constants/config.js';
import { sleep } from './utilities.js';

/** サウンドオブジェクトを格納しておくオブジェクト(キーは音声ファイル名) */
const sounds = {};
/** AudioContextインタフェース */
const AudioContext = (window.AudioContext || window.webkitAudioContext);
/** AudioContextインタフェースが存在するかどうか */
const existsAudioContext = !!AudioContext;
/** サウンド再生制限が解除されたかどうか */
let isUnlocked = false;
/** サウンド再生制限が解除される前に再生が命令されたBGMの音声ファイル名 */
let bgmFilename;
/** サウンド再生制限が解除される前に再生が命令されたBGMの再生オプション */
let bgmOptions;
/** ミュートしているかどうか */
let isMuted = false;
/** AudioContextインスタンス */
let audioCtx;
/** アプリモジュール */
let app;

/** setApp(module)
 * アプリモジュールをセットします。
 * @param {Object} module - アプリモジュール。
 */
export function setApp(module) {
  app = module;
}

/** makeVolume(vol)
 * 全体音量(globalAlpha)およびミュート状態(isMuted)を考慮した音量を用意します。
 * @param {number} vol - play命令時に設定した音声ファイル個別の音量
 * @return {number} 最終的に出力される音量
 */
export function makeVolume(vol) {
  if (isMuted) {
    return 0;
  }
  const { globalVolume } = app.storage.get('settings');
  const alpha = (globalVolume in SOUND_VOLUME_ALPHAS) ? SOUND_VOLUME_ALPHAS[globalVolume] : 0;
  return alpha * vol;
}

/** loadElement(filename)
 * 指定した音声ファイルをロードします。(HTMLElement)
 * @param {string} filename - 音声ファイル名
 * @return {Promise<Element>} <audio>要素
 */
export function loadElement(filename) {
  const url = SOUND_URL_BASE + filename;
  // キャッシュは取得可能だろうか
  let element = sounds[filename] && sounds[filename].element;
  if (element) {
    // キャッシュがあればそれを返せばいい
    return new Promise((resolve) => {
      resolve(element);
    });
  }
  // キャッシュがなければ新しく作ろう
  sounds[filename] = {};
  return new Promise((resolve) => {
    element = document.createElement('audio');
    element.oncanplaythrough = () => {
      resolve(element);
    };
    element.src = url;
    sounds[filename].element = element;
  });
}

/** loadBuffer(filename)
 * 指定した音声ファイルをロードします。(AudioContext)
 * @param {string} filename - 音声ファイル名
 * @return {Promise<AudioBuffer>} デコードされた音声ファイルデータ
 */
export function loadBuffer(filename) {
  const url = SOUND_URL_BASE + filename;
  // キャッシュは取得可能だろうか
  const buffer = sounds[filename] && sounds[filename].buffer;
  if (buffer) {
    // キャッシュがあればそれを返せばいい
    return new Promise((resolve) => {
      resolve(buffer);
    });
  }
  // キャッシュがなければ新しく作ろう
  sounds[filename] = {};
  // XMLHttpRequestを生成
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        audioCtx.resume();
        audioCtx.decodeAudioData(xhr.response, (decodedBuffer) => {
          sounds[filename].buffer = decodedBuffer;
          resolve(decodedBuffer);
        });
      } else {
        reject(new Error(xhr.statusText));
      }
    };
    xhr.onerror = () => {
      reject(new Error(xhr.statusText));
    };
    xhr.send(null);
  });
}

/** load(filename)
 * 指定した音声ファイルをロードします。
 * @param {string} filename - 音声ファイル名
 * @return {Promise<Element>|Promise<AudioBuffer>} <audio>要素またはデコードされた音声ファイルデータ
 */
const load = (existsAudioContext) ? loadBuffer : loadElement;

/** loadAll(filenames)
 * 配列で指定した音声ファイル群をすべてロードします。
 * @param {Array.<string>} filenames - ロードする音声ファイル名の配列
 */
export function loadAll(filenames) {
  return Promise.all(
    filenames.map((filename) => load(filename)),
  );
}

/** stop(filename)
 * 指定した音声ファイルが再生中なら、それを停止します。
 * @param {string} filename - 音声ファイル名
 */
export function stop(filename) {
  sounds[filename].playing = false;
  if (existsAudioContext) {
    sounds[filename].source.stop(0);
  } else {
    sounds[filename].element.pause();
  }
}

/** stopAll()
 * 再生中のすべての音声を停止します。
 */
export function stopAll() {
  Object.keys(sounds).forEach((filename) => {
    if (sounds[filename].playing) {
      stop(filename);
    }
  });
}

/** playElement(filename, options)
 * 音声を再生します。(HTMLElement)
 * @param {string} filename - 再生する音声ファイル名
 * @param {Object} _options - 設定
 * @param {number} _options.volume - 音量(0～1)
 * @param {boolean} _options.loop - ループするかどうか
 * @return {Promise<boolean>} 再生に成功したかどうか
 */
export async function playElement(filename, options) {
  const element = await loadElement(filename);
  return new Promise((reject) => {
    element.currentTime = 0;
    element.volume = makeVolume(options.volume);
    element.loop = options.loop;
    sounds[filename].updateVolume = () => {
      element.volume = makeVolume(options.volume);
    };
    element.onended = () => {
      stop(filename);
    };
    sounds[filename].playing = true;
    element.play()
      .then(() => {
        reject(true);
      })
      .catch(() => {
        reject(false);
      });
  });
}

/** playBuffer(filename, options)
 * 音声を再生します。(AudioContext)
 * @param {string} filename - 再生する音声ファイル名
 * @param {Object} _options - 設定
 * @param {number} _options.volume - 音量(0～1)
 * @param {boolean} _options.loop - ループするかどうか
 */
export async function playBuffer(filename, options) {
  const buffer = await loadBuffer(filename);
  // いままさにこの音声ファイルを再生中なら停止する
  if (sounds[filename].playing) {
    stop(filename);
    await sleep(50); // ちょっと待ったほうがいいようだ
    // sounds[filename].mute();
    // sounds[filename].source.onended = null;
  }
  audioCtx.resume();
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = makeVolume(options.volume);
  // このゲインノードのボリュームをゼロにする関数を確保しておく
  sounds[filename].mute = () => {
    gainNode.gain.value = 0;
  };
  // このゲインノードのボリュームを更新する関数を確保しておく
  sounds[filename].updateVolume = () => {
    gainNode.gain.value = makeVolume(options.volume);
  };
  source.loop = options.loop;
  source.buffer = buffer;
  // SourceNode - GainNode - AudioContext.destination の経路で接続する
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  // endedイベント(再生が終了したとき)のハンドラを設定
  // - ループ再生の場合には発生しない。
  // - stopメソッドが呼ばれた時にも発生する。
  source.onended = () => {
    stop(filename);
  };
  sounds[filename].source = source;
  sounds[filename].playing = true;
  source.start(0);
}

/** play(filename, _options)
 * 音声を再生します。
 * @param {string} filename - 再生する音声ファイル名
 * @param {Object} _options - 設定
 * @param {number} _options.volume - 音量(0～1)
 * @param {boolean} _options.loop - ループするかどうか
 */
export async function play(filename, _options) {
  // オプションをデフォルト設定にマージ
  const options = Object.assign({
    volume: 1,
    loop: false,
  }, _options);
  // まだ音声再生制限が解除されていないならば何もしない
  if (!isUnlocked) {
    // ただしBGMなら引数を保存しておく
    if (options.loop) {
      bgmFilename = filename;
      bgmOptions = options;
    }
    return;
  }
  // BGM再生命令に関して、次の場合は何もしない
  // - そのBGMがすでに再生中の場合
  // - そのBGMが予約済みの場合
  if (options.loop) {
    const isPlaying = sounds[filename] && sounds[filename].playing;
    const isBooking = bgmFilename === filename;
    if (isPlaying || isBooking) {
      return;
    }
  }
  // playBuffer/playElementに投げる
  if (existsAudioContext) {
    playBuffer(filename, options);
  } else {
    playElement(filename, options);
  }
}

/** updateVolume()
 * 再生中のすべての音声ファイルについて、音量を更新します。
 */
export function updateVolume() {
  Object.keys(sounds).forEach((filename) => {
    if (sounds[filename].playing) {
      sounds[filename].updateVolume();
    }
  });
}

/** changeMute(bool)
 * isMutedに値をセットして、再生中の音声ファイルの音量を更新します。
 * @param {boolean} bool - ミュートするかどうか
 */
export function changeMute(bool) {
  isMuted = bool;
  updateVolume();
}

/** unlock()
 * サウンドの再生制限を解除するために無音の音声ファイル(silent.mp3)を再生します。
 * その後、制限解除前に再生されるはずだったBGMが存在するなら、それを再生します。
 * この関数は、必ずユーザーアクション(mousedown、touchstart、keydown…)の
 * イベントハンドラ内に仕込む必要があります。
 */
export async function unlock() {
  // 制限が解除されていないなら、制限を解除して無音の音声ファイルを再生する
  if (!isUnlocked) {
    isUnlocked = true;
    play(SOUND_SILENT);
    // 制限解除前にBGM再生命令があったなら、いま改めて再生する
    if (bgmFilename) {
      const filename = bgmFilename;
      const options = bgmOptions;
      bgmFilename = null;
      bgmOptions = null;
      play(filename, options);
    }
  }
}

/** changeVolume(vol)
 * app.storage.get('settings').globalVolumeに値をセットして、再生中の音声ファイルの音量を更新します。
 * @param {number} vol - セットする音量
 */
export function changeVolume(vol) {
  app.storage.get('settings').globalVolume = vol;
  app.storage.save('settings');
  updateVolume();
}

/** initialize()
 * 初期化します。
 */
export function initialize() {
  // AudioContextインタフェースが存在するならそのインスタンスを作成する
  if (existsAudioContext) {
    audioCtx = new AudioContext();
    // createGainをフォールバックする(しないと一部の環境で音が鳴らない)
    audioCtx.createGain = audioCtx.createGain || audioCtx.createGainNode;
  }
  load(SOUNT_INITIAL_BGM);
}
