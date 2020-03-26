import FIREBASE_CONFIG from './constants/firebase.js';
import * as constants from './constants/config.js';
import * as utilities from './utilities.js';
const { logger } = utilities;
export const { firebase } = window;
delete window.firebase;

// サインインデータ
let ownUserData;
// 現在操作している部屋ID
let currentRoomPath = null;
/** 遊んだ回数 */
let playCount = 0;
/** アプリモジュール */
let app;

/** setApp(module)
 * アプリモジュールをセットします。
 * @param {Object} module - アプリモジュール。
 */
export function setApp(module) {
  app = module;
}

/** signInWithTwitterOnElectron()
 * Electron上で、Twitterでサインインします。
 */
export function signInWithTwitterOnElectron() {
  // ipc (Inter Process Communication: プロセス間通信) を呼び出す
  const ipc = window.require('electron').ipcRenderer;
  // メッセージ'oauth'を送る
  ipc.send('oauth', 'ping');
  // メッセージ'oauth-reply'を受け取ったときに
  ipc.on('oauth-reply', (event, isSucceed, result) => {
    // electron-oauth-twitterモジュールの実行に成功したかどうかで場合分け
    if (isSucceed) {
      // electron-oauth-twitterモジュールの実行に成功していたようだ！
      logger.log('electron-oauth-twitterモジュールの実行に成功しました。');
      logger.log(result);
      // credentialを生成
      const credential = firebase.auth.TwitterAuthProvider.credential(
        result.oauth_access_token,
        result.oauth_access_token_secret,
      );
      // credentialでFirebaseにサインインする
      firebase.auth().signInWithCredential(credential)
        .then((ret) => {
          // Firebaseにサインインできたようだ！
          logger.log('サインインに成功しました。');
          logger.log(ret);
          window.location.reload();
        }).catch((err) => {
          // Firebaseにサインインできなかったようだ！
          logger.error('サインインに失敗しました。');
          logger.error(err);
        });
    } else {
      // electron-oauth-twitterモジュールの実行に失敗したようだ！
      window.logger.error('electron-oauth-twitterの実行に失敗しました。');
      window.logger.error(result);
    }
  });
}

/** signInWithTwitterOnBrowser()
 * Webブラウザ上で、Twitterでサインインします。
 */
export function signInWithTwitterOnBrowser() {
  // プロバイダを作成
  const provider = new firebase.auth.TwitterAuthProvider();
  // ポップアップが有効かどうか
  if (constants.IS_ENABLED_POPUP) {
    // ポップアップが有効な場合
    // ポップアップによるサインインを行う
    // ページの遷移は起こらない
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        // サインインに成功したようだ！
        logger.log('サインインに成功しました。');
        logger.log(result);
      }).catch((error) => {
        // サインインに失敗したようだ！
        logger.error('サインインに失敗しました。');
        logger.error(error);
      });
  } else {
    // ポップアップが無効な場合
    // リダイレクトによるサインインを行う
    // ページの遷移が起こる
    firebase.auth().signInWithRedirect(provider);
  }
}

/** signInWithTwitter()
 * Twitterでサインインします。
 */
export function signInWithTwitter() {
  // ElectronかWebブラウザか
  if (utilities.existsElectron()) {
    // Electronの場合
    signInWithTwitterOnElectron();
  } else {
    // Webブラウザの場合
    signInWithTwitterOnBrowser();
  }
}

/** signIn()
 * Firebaseへのサインインを行います。
 */
export function signIn() {
  signInWithTwitter();
}

/** signOut()
 * Firebaseからのサインアウトを行います。
 */
export function signOut() {
  firebase.auth().signOut().then(() => {
    logger.log('サインアウトに成功しました。');
    window.location.reload();
  }).catch((error) => {
    logger.error('サインアウトに失敗しました。');
    logger.error(error);
  });
}

/** parseProtoPhotoURL(url)
 * Twitter連携でFirebaseにログインして得られるphotoURLの解像度は48x48です。
 * これでは不便なので、なるべく高解像度の画像を取得するためにURLを加工します。
 * 入力例) https://pbs.twimg.com/…/XXX_normal.jpg
 * 出力例) https://pbs.twimg.com/…/XXX{size}.jpg
 * @param {String} url - プロフィール画像のURL
 * @return {String} 加工されたURL
 */
export function parseProtoPhotoURL(url) {
  const dummy = '{size}';
  const urlSplit = url.split('/');
  const fileName = urlSplit.pop();
  const fileNameSplit = fileName.split('.');
  const extension = fileNameSplit.pop();
  const fileNameOnly = fileNameSplit.join('.');
  const newFileNameOnly = fileNameOnly.replace('_mini', '')
    .replace('_normal', '').replace('_bigger', '') + dummy;
  const url2 = `${urlSplit.join('/')}/${newFileNameOnly}.${extension}`;
  return url2;
}

/** parsePhotoURL(url)
 * 加工されたプロフ画像URLを用いて、
 * なるべく高解像度のプロフィール画像を取得しようとします。
 * @param {String} url - 細工されたプロフィール画像のURL
 * @return {String} 取得可能なもののうち最高解像度のプロフィール画像のURL
 */
export async function parsePhotoURL(url) {
  const dummy = '{size}';
  const url1 = url.replace(dummy, '');
  const url2 = url.replace(dummy, '_bigger');
  const url3 = url.replace(dummy, '_normal');
  if (await utilities.existsURL(url1)) return url1;
  if (await utilities.existsURL(url2)) return url2;
  return url3;
}

/** off()
 * @param {string} path - イベントハンドラを外すパス。
 */
export function off(path) {
  firebase.database().ref(path).off();
}

/** onadd()
 * @param {string} path - addイベントを監視するパス。
 * @param {function} callback - イベントハンドラ。
 */
export function onadd(path, callback) {
  firebase.database().ref(path).on('child_added', (snap) => {
    callback(snap.val(), snap.key);
  });
}

/** onchange()
 * @param {string} path - changeイベントを監視するパス。
 * @param {function} callback - イベントハンドラ。
 */
export function onchange(path, callback) {
  firebase.database().ref(path).on('child_changed', (snap) => {
    callback(snap.val(), snap.key);
  });
}

/** onremove()
 * @param {string} path - removeイベントを監視するパス。
 * @param {function} callback - イベントハンドラ。
 */
export function onremove(path, callback) {
  firebase.database().ref(path).on('child_removed', (snap) => {
    callback(snap.val(), snap.key);
  });
}

/** get(path)
 * Firebaseからデータのスナップショットを取得してきて、
 * そのスナップショットの値を返します。
 * @param {string} path - 取り出すデータのパス。
 * @example
 * const data = await get('messages/message123');
 * // Firebaseのデータベース例
 * // "messages": {
 * //   "message1": { "name": "太郎", "text": "こんにちは！" }
 * // }
 * // 取り出せたdata
 * // { name: "太郎", text: "こんにちは！" }
 * @return {Promise<Object|string|number>} Firebaseに保存されているデータ。
 */
export async function get(path) {
  const snap = await firebase.database().ref(path).once('value');
  return snap.val();
}

/** getRoom(roomType, roomId)
 * ルームデータのプロミスを返します。
 * awaitを付けてこの関数を呼ぶことでルームデータのオブジェクトを取得できます。
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 * @return {Promise.<Object>} ルームデータのプロミス。
 */
export function getRoom(roomType, roomId) {
  return get(`${roomType}-rooms/${roomId}`);
}

/** remove(path)
 * Firebaseのデータを削除します。
 * @param {string} path - 削除するデータのパス。
 */
export async function remove(path) {
  await firebase.database().ref(path).remove();
}

/** update(path, updates)
 * Firebaseのデータを書き換えます。
 * @param {string} path - 変更するデータのパス。
 * @param {Object} updates - 変更内容のオブジェクト。
 * @example
 * await update('messages/message123', { text: 'おはよう！' });
 * // Firebaseのデータベース例
 * // "messages": {
 * //   "message1": { "name": "太郎", "text": "こんにちは！" }
 * // }
 * // データベース書き換え後
 * // "messages": {
 * //   "message1": { "name": "太郎", "text": "おはよう！" }
 * // }
 */
export async function update(path, updates) {
  await firebase.database().ref(path).update(updates);
}

/** push()
 * Firebaseにデータを追加します。
 * @param {string} path - 追加する場所。
 * @param {Object|string|number} val - 追加する内容。
 * @example
 * const key = await push('messages', { name: "花子", text: "誰？" });
 * // Firebaseのデータベース例
 * // "messages": {
 * //   "message1": { "name": "太郎", "text": "こんにちは！" }
 * // }
 * // データベースプッシュ後
 * // "messages": {
 * //   "message1": { "name": "太郎", "text": "おはよう！" },
 * //   "hogehoge": { "name": "花子", "text": "誰？" }
 * // }
 * @return {string} push時に生成された一意なキー。
 */
export async function push(path, val) {
  const snap = await firebase.database().ref(path).push(val);
  return snap.key;
}

/** setEventAuthStateChange()
 * Firebaseへのログイン状態に変更があった際のイベントハンドラをセットします。
 */
export function setupAuthStateChange() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      logger.log('%cFirebase signed in', logger.getMarkerStyle('skyblue'));
      logger.log('%cuser: %cガンジー', 'line-height: 30px', `line-height: 30px; padding-left: 35px;
        font-family: sans-serif; background-image: url(${user.photoURL});
        background-repeat: no-repeat; background-size: contain;`, '');
      // ログインしている場合
      // プロフ画像URLのひな形を取得する
      const protoPhotoURL = parseProtoPhotoURL(user.photoURL);
      // プロフ画像URLのひな形を実際のURLに変換する
      const photoURL = await parsePhotoURL(protoPhotoURL);
      // TwitterIDを取得する
      // スクリーンネーム(@Hogehoge)はFirebaseからは取得できないっぽい
      // TwitterIDからユーザーページを確認するためのURLは以下
      // https://twitter.com/intent/user?user_id=99999999
      const tuid = (user.providerData && user.providerData[0]
                    && user.providerData[0].uid) || -1;
      // Firebaseのユーザー情報を更新(あるいは新規作成)しよう
      // 更新内容
      const updates = {};
      // キーはuid
      const key = user.uid;
      // タイムスタンプを作る
      const timestamp = utilities.getTimestamp();
      // ユーザーデータを取り出す
      const val = await get(`users/${key}`);
      // データが取り出せなかった場合
      if (!val) {
        // 更新 > 初回サインイン日時
        updates[`${key}/firstSignInDate`] = timestamp.string;
        updates[`${key}/firstSignInUnix`] = timestamp.unix;
        // 更新 > TwitterID
        updates[`${key}/tuid`] = tuid;
      }
      // 更新 > ディスプレイネーム
      updates[`${key}/displayName`] = user.displayName;
      // 更新 > プロフ画像URL
      updates[`${key}/photoURL`] = photoURL;
      // 更新 > 最終サインイン日時
      updates[`${key}/lastSignInDate`] = timestamp.string;
      updates[`${key}/lastSignInUnix`] = timestamp.unix;
      // 以上の更新内容でFirebaseのユーザーデータを書き換える
      update('users', updates);
      // インスタンスにサインインデータを保存しておく
      ownUserData = {
        displayName: user.displayName,
        photoURL,
        uid: user.uid,
      };
    } else {
      ownUserData = null;
      // ログアウトしている場合
    }
    utilities.dispatchDocumentEvent('authstatechange', ownUserData);
  });
}

/** destroyRoom(roomType, roomId)
 * プライベートルームを破壊します。
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 * @return {Promise} ルーム破壊操作のプロミス。
 */
export async function destroyRoom(roomType, roomId) {
  await remove(`users/${ownUserData.uid}/ownPrivateRoom`);
  return remove(`${roomType}-rooms/${roomId}`);
}

/** createRoom(roomType)
 * プライベートルームを作ります。
 * @param {string} roomType - ルームタイプ。
 */
export async function createRoom(roomType) {
  // サインインデータがないならば何もしない
  if (!ownUserData) {
    return false;
  }
  // =================================
  // 既存のルームの削除
  // =================================
  // 自身のユーザーデータを取ってくる
  const userVal = await get(`users/${ownUserData.uid}`);
  // ユーザーデータがあり、所有しているプライベートルームがあるなら
  if (userVal && userVal.ownPrivateRoom) {
    // そのルームを削除する
    await destroyRoom(roomType, userVal.ownPrivateRoom);
  }
  // =================================
  // 新規ルームの作成
  // =================================
  // タイムスタンプを作る
  const timestamp = utilities.getTimestamp();
  // ルームの初期データを作る
  const room = {
    seed: 0,
    members: {},
    state: 'waiting',
    createUnix: timestamp.unix,
    createDate: timestamp.string,
    ownerUser: {
      uid: ownUserData.uid,
      displayName: ownUserData.displayName,
      photoURL: ownUserData.photoURL,
    },
    version: constants.APP_VERSION,
  };
  // メンバーに自身を追加する
  room.members[ownUserData.uid] = {
    displayName: ownUserData.displayName,
    photoURL: ownUserData.photoURL,
    state: 'waiting',
  };
  // ルームデータをプッシュしてそのIDを取得
  const roomId = await push(`${roomType}-rooms`, room);
  // 自身のユーザーデータのプレイべートルームIDを更新する
  await update(`users/${ownUserData.uid}`, { ownPrivateRoom: roomId });
  return roomId;
}

/** readyRoom(roomType, roomId)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 */
export async function readyRoom(roomType, roomId) {
  playCount = 0;
  // 操作情報を削除＋stateにwaitingを代入
  await update(`${roomType}-rooms/${roomId}`, {
    state: 'waiting',
  });
}

/** joinRoom(roomType, roomId)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 * @return {Promise<string>} 参加処理のプロミス。(エラーメッセージを返す)
 */
export async function joinRoom(roomType, roomId) {
  // いったんいまのルームデータを取得
  const room = await getRoom(roomType, roomId);
  // ルームが取得できなかった ならば 非存在エラー
  if (!room) {
    return 'room-doesnt-exist';
  }
  // いまいるメンバーの数
  const uids = Object.keys(room.members || {});
  const memberCount = uids.length;
  // 自分のuidが部屋に登録されていない かつ メンバーの数が上限値以上である ならば 満員エラー
  if (uids.indexOf(ownUserData.uid) < 0 && memberCount >= constants.ROOM_MEMBER_COUNT_MAX) {
    return 'error-room-is-full';
  }
  // ルームステートがwaitingではない ならば アクティブエラー
  // if (room.state !== 'waiting') {
  //   return 'error-room-is-active';
  // }
  // ルームバージョンと自分のバージョンが一致しない ならば バージョンエラー
  if (room.version !== constants.APP_VERSION) {
    return 'error-room-versions-dont-match';
  }
  // ここに到達したならばこの部屋に参加することができる！
  // メンバーに自分を追加する
  await update(`${roomType}-rooms/${roomId}/members/${ownUserData.uid}`, {
    displayName: ownUserData.displayName,
    photoURL: ownUserData.photoURL,
    state: 'waiting',
  });
  // エラーメッセージはなし
  return '';
}

/** leaveRoom(roomType, roomId)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 */
export function leaveRoom(roomType, roomId) {
  // メンバーに自分を追加する
  return remove(`${roomType}-rooms/${roomId}/members/${ownUserData.uid}`);
}

/** beginGame(roomType, roomId)
 * ゲームを開始するためのFirebaseの処理を行います。
 * (操作順の決定、乱数の決定、operationsの初期化、ルームステートの変更など)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - 参加するルームID。
 */
export async function beginGame(roomType, roomId) {
  // いったんいまのルームデータを取得
  const room = await getRoom(roomType, roomId);
  // 操作順を表すオブジェクトordersの作成
  // orders = { "order-0": "uid-hogehoge", "order-1": "uid-fugafuga", … }
  const uids = Object.keys(room.members);
  const playerNum = uids.length;
  const arr = [];
  for (let i = 0; i < playerNum; i += 1) {
    arr[i] = i;
  }
  const orders = {};
  uids.forEach((uid) => {
    const r = Math.floor(Math.random() * arr.length);
    const order = arr[r];
    arr.splice(r, 1);
    orders[`order-${order}`] = uid;
    // ついでにメンバーステートをplayingにしておく
    room.members[uid].state = 'playing';
  });
  const timestamp = utilities.getTimestamp();
  // ルームデータをアップデートする
  update(`${roomType}-rooms/${roomId}`, {
    // タイムスタンプ
    lastPlayUnix: timestamp.unix,
    lastPlayDate: timestamp.string,
    // 操作順
    orders,
    // 操作情報
    operations: null,
    // パネル状況
    panelStates: '',
    // メンバー
    members: room.members,
    // シード値
    seed: new Date().getTime(),
    // ルームステート
    state: `playing-${playCount}`,
  });
}

/** finishGame()
 */
export function finishGame() {
  update(`${currentRoomPath}`, { state: 'waiting' });
}

/** againGame(roomType, roomId)
 */
export function againGame(roomType, roomId) {
  playCount += 1;
  beginGame(roomType, roomId);
}

/** sendOperation(step, operation)
 * 操作情報をFirebaseに送ります。
 * @param {number} step - 何手目か。(0、1、2…)
 * @param {Object} operation - 操作情報。
 */
export async function sendOperation(step, operation) {
  // 手数を3桁までゼロ埋め(000、001、002…)
  const paddedStep = (`000${step}`).slice(-3);
  // (たとえば)operations/step-000の内容にアップデートをかける
  await update(`${currentRoomPath}/operations/step-${paddedStep}`, operation);
  // ログ
  utilities.logger.log('send operation: %o', operation);
}

/** sendPanelStates(panelStates)
 * パネル状況をFirebaseに送ります。
 * @param {Object} panelStates - パネル状況
 */
export async function sendPanelStates(panelStates) {
  await update(`${currentRoomPath}`, {
    panelStates: JSON.stringify(panelStates),
  });
  // ログ
  utilities.logger.log('send panelStates: %o', panelStates);
}

/** teardownGaming(roomType, roomId)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 */
export function teardownGaming(roomType, roomId) {
  off(`${roomType}-rooms/${roomId}/operations`);
  off(`${roomType}-rooms/${roomId}/members`);
  off(`${roomType}-rooms/${roomId}`);
}

/** setupGaming(roomType, roomId, options)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 * @param {Object} options - オプション。
 */
export function setupGaming(roomType, roomId, options) {
  teardownGaming(roomType, roomId);
  // 操作情報の変更を監視
  onchange(`${roomType}-rooms/${roomId}/operations`, (operation, key) => {
    const num = parseInt(key.split('-')[1], 10);
    app.game.receiveOperation(operation, num);
  });
  // メンバーの削除を監視
  onremove(`${roomType}-rooms/${roomId}/members`, options.onremovemember);
  // ルームステートの変更を監視
  onchange(`${roomType}-rooms/${roomId}`, (val, key) => {
    if (key === 'state') {
      options.onchangeroomstate(val);
    }
    if (key === 'panelStates') {
      app.game.syncPanelStates(val);
    }
  });
  currentRoomPath = `${roomType}-rooms/${roomId}`;
}

/** teardownWaiting(roomType, roomId)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 */
export function teardownWaiting(roomType, roomId) {
  off(`${roomType}-rooms/${roomId}`);
  off(`${roomType}-rooms/${roomId}/members`);
}

/** setupWaiting(roomType, roomId, options)
 * @param {string} roomType - ルームタイプ。
 * @param {string} roomId - ルームID。
 * @param {Object} options - オプション。
 */
export function setupWaiting(roomType, roomId, options) {
  teardownWaiting(roomType, roomId);
  onadd(`${roomType}-rooms/${roomId}/members`, options.onaddmember);
  onremove(`${roomType}-rooms/${roomId}/members`, options.onremovemember);
  onchange(`${roomType}-rooms/${roomId}/members`, options.onchangememberstate);
  onchange(`${roomType}-rooms/${roomId}`, (val, key) => {
    if (key === 'state') {
      options.onchangeroomstate(val);
    }
  });
}

/** getOwnUid()
 * Firebaseにおける自分のuidを取得します。
 * サインインしていなければ空の文字列が返ります。
 * @return {string} 自分のuid
 */
export function getOwnUid() {
  if (ownUserData && ownUserData.uid) {
    return ownUserData.uid;
  }
  return '';
}

/** getOwnUserData()
 * ユーザーデータを返します。
 * @return {Object} ユーザーデータ。
 */
export function getOwnUserData() {
  return ownUserData;
}

/** getOwnUserDataNewly()
 * ユーザーデータのプロミスを返します。
 * @return {Promise.<Object>} ユーザーデータのプロミス。
 */
export function getOwnUserDataNewly() {
  return get(`users/${ownUserData.uid}`);
}

/** setOwnUserData()
 * ユーザーデータをセットします。
 * @param {Object} userData - ユーザーデータ。
 */
export function setOwnUserData(userData) {
  ownUserData = userData;
}

/** getSignState()
 * サインイン状態を表す文字列を取得します。
 * 'connecting'    … アプリ起動直後で、サインイン済みかどうかもわかっていない状態
 * 'not-signed-in' … 未サインイン
 * 'signed-in'     … サインイン済み
 * @return {string} サインイン状態。
 */
export function getSignState() {
  if (ownUserData === undefined) {
    return 'connecting';
  } if (ownUserData === null) {
    return 'not-signed-in';
  }
  return 'signed-in';
}

/** initialize()
 * Firebaseの初期化およびイベントハンドラのセットアップを行います。
 */
export function initialize() {
  // Firebaseを初期化する
  const project = firebase.initializeApp(FIREBASE_CONFIG);
  // ログ
  logger.log('%cFirebase initialized', logger.getMarkerStyle('skyblue'));
  logger.log('database: %o', project.options.databaseURL);
  // ログイン状態変化時のイベントハンドラを登録
  setupAuthStateChange();
}
