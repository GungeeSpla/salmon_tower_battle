import * as constants from './constants/config.js';
import * as utilities from './utilities.js';

/** getKeyType(keyCode)
 * 押されたキーコードが何のボタン(←、→、START、A、B…)に該当するのかを
 * キーコンフィグに従って判定し、その結果を返します。
 * @param {number} keyCode - 押されたキーコード
 * @return {string|null} 判定されたボタンの種類
 */
export function getKeyType(keyCode) {
  for (let i = 0; i < constants.KEY_TYPES.length; i += 1) {
    const keyType = constants.KEY_TYPES[i];
    if (constants.KEY_CONFIG[keyType].indexOf(keyCode) > -1) {
      return keyType;
    }
  }
  return null;
}

/** removeAllListener()
 * 初期化します。
 */
export function removeAllListener() {

}

/** initialize()
 * 初期化します。
 */
export function initialize() {
  window.addEventListener('keydown', (e) => {
    const keyType = getKeyType(e.keyCode);
    if (keyType) {
      utilities.logger.log(`keydown-${keyType}`);
      utilities.dispatchDocumentEvent(`keydown-${keyType}`, {
        isAlt: e.altKey,
        isCtrl: e.ctrlKey,
        isShift: e.shiftKey,
      });
    }
  });
}

// keyモジュールの定義とエクスポート
const key = {
  initialize,
  removeAllListener,
};
export default key;
