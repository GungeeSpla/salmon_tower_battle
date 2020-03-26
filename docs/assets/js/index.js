import * as game from './modules/game.js';
import * as view from './modules/view.js';
import * as network from './modules/network.js';
import * as sound from './modules/sound.js';
import * as key from './modules/key.js';
import * as storage from './modules/storage.js';
import { IS_DEVELOPMENT } from './modules/constants/config.js';
import { logAsciiArt } from './modules/utilities.js';

// ロード完了時のイベントハンドラ
window.addEventListener('load', () => {
  // コンソールで遊んでみる
  logAsciiArt();
  // appオブジェクトの定義
  const app = { game, view, network, sound, storage, key };
  // appオブジェクトが持つすべてのプロパティにappプロパティを用意して
  // app自身を循環参照させる
  Object.keys(app).forEach((key) => {
    if ('setApp' in app[key]) {
      app[key].setApp(app);
    }
  });
  // 開発時はappオブジェクトをwindowから参照できるようにしておく
  if (IS_DEVELOPMENT) {
    window.app = app;
  }
  // 初期化
  storage.initialize();
  network.initialize();
  sound.initialize();
  view.initialize();
  game.initialize();
  key.initialize();
  view.firstJump();
});
