import { STORAGE_CONFIG, STORAGE_CONFIG_KEYS } from './constants/config.js';
import { logger, getQueries } from './utilities.js';

/** ストレージ */
const storage = {};

/** get(name)
 * ストレージのデータを取得します。
 * @param {string} name - ストレージ名。
 */
export function get(name) {
  return storage[name];
}

/** clear(configKey)
 * ローカルストレージのデータをクリアします。
 * @param {string} configKey - クリアするプロパティ名
 */
export function clear(configKey) {
  const config = STORAGE_CONFIG[configKey];
  localStorage.setItem(config.storageKey, null);
}

/** clearAll()
 * ローカルストレージのデータをすべてクリアします。
 */
export function clearAll() {
  STORAGE_CONFIG_KEYS.forEach((configKey) => {
    clear(configKey);
  });
}

/** save(configKey)
 * storageモジュールの指定したプロパティをローカルストレージに保存します。
 * @param {string} configKey - セーブするプロパティ名
 */
export function save(configKey) {
  const config = STORAGE_CONFIG[configKey];
  const item = JSON.stringify(storage[configKey]);
  localStorage.setItem(config.storageKey, item);
}

/** saveAll()
 * storageモジュールのプロパティをすべてローカルストレージに保存します。
 */
export function saveAll() {
  STORAGE_CONFIG_KEYS.forEach((configKey) => {
    save(configKey);
  });
}

/** initialize()
 * STORAGE_CONFIGに定義してあるすべてのプロパティについて、
 * ローカルストレージからデータを取得してきてstorageモジュールのプロパティとして追加する
 * 処理を行います。
 */
export function initialize() {
  // コンフィグに従って値を読み取っていく
  STORAGE_CONFIG_KEYS.forEach((configKey) => {
    const config = STORAGE_CONFIG[configKey];
    const item = localStorage.getItem(config.storageKey);
    const json = (item)
      ? Object.assign({}, config.initialValue, JSON.parse(item))
      : Object.assign({}, config.initialValue);
    storage[configKey] = json;
    save(configKey);
  });
  // 言語設定が未設定ならばnavigatorから読み取る
  if (!storage.settings.language) {
    const navigatorLangStr = navigator.language || navigator.userLanguage || 'ja';
    storage.settings.language = (navigatorLangStr.indexOf('ja') > -1) ? 'ja' : 'en';
  }
  // URLクエリパラメータにlangがある場合はそれで上書きする
  if (getQueries().lang) {
    storage.settings.language = (getQueries().lang.indexOf('ja') > -1) ? 'ja' : 'en';
  }
  // ログ
  logger.log('%cStorage initialized', logger.getMarkerStyle('skyblue'));
  STORAGE_CONFIG_KEYS.forEach((configKey) => {
    logger.log(`${configKey}: %o`, storage[configKey]);
  });
}
