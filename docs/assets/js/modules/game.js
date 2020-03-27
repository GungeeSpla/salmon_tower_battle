import MONSTERS_DATA from './constants/monsters.js';
import * as constants from './constants/config.js';
import * as utilities from './utilities.js';
import Xors from './classes/Xors.js';
import Animater from './classes/Animater.js';
import Panel from './classes/Panel.js';
const {
  createjs, b2AABB, b2World, b2Vec2,
} = window;
const { logger } = utilities;

/** LiquidFunの物理ワールド */
let world;
/** CreateJSの描画ステージ */
let stage;
/** 操作対象のPanel */
let operationPanel;
/** 手を進めた回数 */
let stepCount;
/** 積み上げたパネルの高さ */
let towerHeight;
/** 積み上げたパネルの数 */
let panelCount;
/** パネルが同期を取られたか */
let isSyncedPanelStates;
/** 現在のプレイヤーのインデックス */
let currentPlayerIndex;
/** 画面のスクローラ */
const scroller = new Animater({ y: 0 });
/** Panel配列 */
const panels = [];
/** 参加しているプレイヤーらの状態 */
let playerStates;
/** 動物の配牌配列 */
let monsterTiles;
/** 乱数生成器のインスタンス */
let xors;
/** 現在の背景グラデーションのインデックス */
let currentBackGradIndex = 0;
/** 背景グラデーションを格納する配列 */
const backGrads = [];
/** 背景オブジェクトを格納する配列 */
const backObjects = {};
/** 背景グラデーションのAnimaterを格納する配列 */
const backAnimaters = [];
/** エンドレスモードか */
let isEndless = false;
/** オンラインモードが有効か */
let isOnline = false;
/** シード値 */
let gameSeed;
/** ゲームの終了処理が行われたか */
let isFinished;
/** オペレーションキュー */
let operationQueue;
/** キャンバスエレメント */
let canvas;
/** リプレイモードかどうか */
let isReplay = false;
/** リプレイ用の操作情報 */
let replayOperations;
/** 床の高さ */
let floorY;
/** 制限時間 */
let timeLimit = constants.PANEL_TIME_LIMIT;
/** 残り時間 */
let leftTimeBefore = 0;
/** 残り時間エレメント */
let leftTimeElm;
/** 死の順番 */
let deathOrder;
/** ステージのキャッシュ */
let stageCache;
/** アプリモジュール */
let app;

/** setApp(module)
 * アプリモジュールをセットします。
 * @param {Object} module - アプリモジュール。
 */
export function setApp(module) {
  app = module;
}

/** getSeed()
 * ゲームを開始する際に必要な乱数のシード値を取得します。
 * @return {number} 乱数のシード値。
 */
export function getSeed() {
  // 乱数デバッグが有効なら固定値を返す
  if (constants.IS_DEBUG_RANDOM_SEED) {
    return constants.DEBUG_RANDOM_SEED;
  }
  // そうでなければgameSeedを返す
  return gameSeed;
}

/** setTodaySeed()
 * シード値を日付で設定します。
 */
export function setTodaySeed() {
  gameSeed = utilities.getTimestamp().date;
}

/** setUnixSeed()
 * シード値をUNIX時刻に設定します。
 */
export function setUnixSeed() {
  gameSeed = utilities.getTimestamp().unix;
}

/** setTimeLimit(time)
 * 制限時間をセットします。
 * @param {number} time - セットする制限時間。
 */
export function setTimeLimit(time) {
  if (time === undefined) {
    timeLimit = constants.PANEL_TIME_LIMIT;
  } else {
    timeLimit = time;
  }
}

/** setSeed(seed)
 * オンラインシードをセットします。
 * @param {number} seed - セットするシード値。
 */
export function setSeed(seed) {
  gameSeed = seed;
}

/** setIsOnline(bool)
 * オンラインかどうかをセットします。
 * @param {Boolean} bool - セットする真偽値。
 */
export function setIsOnline(bool) {
  isOnline = bool;
}

/** setIsEndless(bool)
 * エンドレスかどうかをセットします。
 * @param {Boolean} bool - セットする真偽値。
 */
export function setIsEndless(bool) {
  isEndless = bool;
}

/** setPlayerStates(infos)
 * @typedef {Object} PlayerState
 * @property {string} displayName - 表示する名前。
 * @property {string} photoURL - プロフ画像URL。
 * @property {number} life - 残りライフ。
 * @property {number} deathOrder - 死んだ順番。
 * @param {Array.<PlayerState>} infos - 参加するプレイヤーの名前の配列。
 */
export function setPlayerStates(infos) {
  playerStates = infos;
}

/** getBackGradIndex(count)
 * いま表示すべき背景グラデーション番号を取得します。
 * @param {number} count - パネルを進めた手数。
 * @return {number} 背景グラデーションのインデックス。
 */
export function getBackGradIndex(count) {
  // 背景が1周するまでの手数の長さ
  const length = constants.BACK_GRAD_THRESHOLD * constants.BACK_GRADS.length;
  // 手数をlengthで割った余り
  const rem = (count + length) % length;
  // remを閾値で割る
  return Math.floor(rem / constants.BACK_GRAD_THRESHOLD);
}

/** isOwnTurn()
 * いま自分のターンであるかどうかを返します。
 * @return {boolean} いま自分のターンであるかどうか
 */
export function isOwnTurn() {
  // 操作ターンを迎えているプレイヤーのuidが自身のuidに一致するならばtrue
  return playerStates[currentPlayerIndex].uid === app.network.getOwnUid();
}

/** isOperable()
 * いま自分が操作可能かどうかを返します。
 * @return {boolean} いま自分が操作可能かどうか。
 */
export function isOperable() {
  // デバッグモードならば常にtrue
  if (constants.IS_DEBUG_OPERATE) {
    return true;
  }
  // オフラインモードならば常にtrue
  if (!isOnline) {
    return true;
  }
  // 自分のターンならばtrue
  return isOwnTurn();
}

/** getObjectMinY()
 * 現在積まれているPanelの面が存在する最小のy値（LiquidFunにおける値）を求めます。
 * 最小のy値というのは、要するに、積み上げたオブジェクトのてっぺんの高さのことです。
 * @return {number} Panelの面が存在する最小のy値。
 */
export function getObjectMinY() {
  // 最小のy値 フロアのy値から始めよう
  let minY = constants.FLOOR_Y;
  // 保有するPanelインスタンスを操作
  panels.forEach((manager) => {
    // DisplayObjectのBoundsのy値からスクローラのy値を引いたものを実質的なy値とする
    const y = manager.cjsBitmap.getTransformedBounds().y
      - scroller.getProperty('y') - app.view.canvasDetail.padding.y;
    if (y < minY) {
      minY = y;
    }
  });
  minY = Math.floor(minY);
  // とりあえずのminYが取得できたようだ！しかし…
  // DisplayObjectのBoundsのy値から決定したのではy値が過小になってしまうので
  // (デバッグモードを有効にするとよくわかる)
  // ｢LiquidFunの剛体と衝突するまでy値をじわじわ大きくしていく｣ことを考える
  const queryCallback = {
    body: null,
    ReportFixture(fixture) {
      this.body = fixture.body;
    },
  };
  const aabb = new b2AABB();
  const marginWidth = 300;
  const littleHeight = 0.01;
  const maxTryCount = 300;
  // フロアのより上にあるならば
  if (minY < constants.FLOOR_Y) {
    // 最大でmaxTryCount回繰り返す
    for (let i = 0; i < maxTryCount; i += 1) {
      // 1px下に移動してみる
      minY += 1;
      // キャンバスの横幅から左右にmarginWidthだけはみ出した、
      // 厚みlittleHeightの板をminYの位置に置いてみる
      aabb.lowerBound.Set(
        (-marginWidth) / constants.METER,
        minY / constants.METER,
      );
      aabb.upperBound.Set(
        (constants.CANVAS_WIDTH + marginWidth) / constants.METER,
        minY / constants.METER + littleHeight,
      );
      // その板に衝突している物体はあるだろうか？
      world.QueryAABB(queryCallback, aabb);
      // 衝突している物体があったならば
      if (queryCallback.body) {
        // ここが正確なminYのようだ！必要な情報を整えてbreakしよう
        minY += 10; // 10px分足すと何やらちょうど良い よくわからない
        break;
      }
    }
  }
  // minYはフロアよりも下になることはない
  minY = Math.min(minY, constants.FLOOR_Y);
  // minYとてっぺんのオブジェクトの名前を返す
  return minY;
}

/** MonsterDef
 * @typedef {Object} MonsterDef - モンスター定義。
 * @property {string} name - モンスターの名前。
 * @property {number} id - モンスターの一意なID。
 * @property {number} scale - モンスターのデカさ。
 * @property {number} frequency - モンスターの頻度。
 */
/** getMonsterTiles()
 * 動物の定義をもとに、動物の配牌を作って返します。
 * 配牌の長さは、動物の頻度データの合計値です。
 * たとえば動物の定義が ｢鳥(3)、犬(1)、猫(2)｣ (カッコ内は頻度) となっていれば、
 * ｢鳥、猫、鳥、鳥、犬、猫｣ のような配列が返ります。
 * @return {Array.<MonsterDef>} 動物のIDの配列。
 */
export function getMonsterTiles() {
  const monstersData = MONSTERS_DATA;
  // 頻度の合計を計算する
  let frequencySum = 0;
  monstersData.forEach((monster) => {
    frequencySum += monster.frequency;
  });
  // 抽選番号配列を作成する [0, 1, 2, …, frequencySum - 1]
  const lotteryNumbers = [];
  for (let i = 0; i < frequencySum; i += 1) {
    lotteryNumbers.push(i);
  }
  // 抽選を開始する
  const monsterIds = [];
  for (let i = 0; i < frequencySum; i += 1) {
    // 抽選番号配列から取り出す位置を決定する
    const randomIndex = xors.getRandom(lotteryNumbers.length);
    // 抽選番号を取り出す
    let lotteryNumber = lotteryNumbers[randomIndex];
    // その抽選番号に基づいて動物IDを特定する
    let monsterId = monstersData[0].id;
    for (let j = 0; j < monstersData.length; j += 1) {
      if (lotteryNumber < monstersData[j].frequency) {
        monsterId = monstersData[j].id;
        break;
      } else {
        lotteryNumber -= monstersData[j].frequency;
      }
    }
    // 動物IDを追加
    monsterIds.push(monsterId);
    // 抽選番号配列から抽選済みの番号を取り除く
    lotteryNumbers.splice(randomIndex, 1);
  }
  return monsterIds;
}

/** getAlivePlayerCount()
 * 現在生きているプレイヤーの数を返します。
 * @return {number} 生きているプレイヤーの数。
 */
export function getAlivePlayerCount() {
  let count = 0;
  playerStates.forEach((item) => {
    if (item.life > 0) {
      count += 1;
    }
  });
  return count;
}

/** getAlivePlayer()
 * 現在生きているプレイヤーをひとり返します。
 * @return {string} 生きているプレイヤーの名前。
 */
export function getAlivePlayer() {
  let name = 'Null';
  for (let i = 0; i < playerStates.length; i += 1) {
    if (playerStates[i].life > 0) {
      name = playerStates[i].displayName;
      break;
    }
  }
  return name;
}

/** execOperationRotate()
   * 操作オブジェクトを時計回りに45°回転させます。
   */
export function execOperationRotate() {
  // 操作対象のオブジェクトが存在するなら
  if (operationPanel && operationPanel.isOperable && operationPanel.isMovable()) {
    operationPanel.rotate();
  }
}

/** execOperationDown()
 * 操作オブジェクトを落下させます。
 */
export function execOperationDown() {
  // 操作対象のオブジェクトが存在するなら
  if (operationPanel && operationPanel.isOperable && operationPanel.isMovable()) {
    operationPanel.drop();
    panels.forEach((panel) => {
      if (!panel.isField) {
        panel.setDynamic();
      }
    });
  }
}

/** execOperationDownForcibly()
 * 操作オブジェクトを【強制的に】落下させます。
 */
export function execOperationDownForcibly() {
  operationPanel.isOperable = true;
  operationPanel.isForced = true;
  operationPanel.ownerUid = app.network.getOwnUid();
  execOperationDown();
}

/** receiveOperation(operation, index)
 * オンラインモードにおいて、操作情報を受信してその通りに動かします。
 * @param {Object} operation - 操作情報。
 * @param {number} operation.x - 操作オブジェクトのx座標 (m) 。
 * @param {number} operation.y - 操作オブジェクトのy座標 (m) 。
 * @param {number} operation.angle - 操作オブジェクトの回転量 (rad) 。
 * @param {string} operation.uid - 操作ユーザーのuid。
 * @param {boolean} operation.isDown - 操作オブジェクトを落下させるかどうか。
 */
export function receiveOperation(operation, index) {
  if (index < stepCount) {
    // すでに過ぎた手数の操作情報を受け取った場合、無視していい
    return;
  } if (index > stepCount) {
    // まだ先の手数の操作情報を受け取ってしまった場合
    // 落下操作ならばオペレーションキューに入れておいて、未来に実行することにする
    if (operation.isDown) {
      operationQueue.push(operation);
    }
    // あとは処理を終了していい
    return;
  } if (isOnline && operation.uid === app.network.getOwnUid()) {
    // 自分が送った操作情報を改めて受け取った場合、無視していい
    return;
  } if (operationPanel && operationPanel.isForced) {
    // 当該手数の操作情報なのだが、すでに操作パネルが【強制】落下している場合、無視していい
    return;
  } if (operationPanel && !operationPanel.isMovable() && !operation.isForced) {
    // 当該手数の操作情報なのだが、すでに操作パネルが落下しており、かつ強制命令でないならば、無視していい
    return;
  }
  // ここまで到達したということは、この操作は受け付ける必要があるようだ！
  // 強制操作の場合
  if (operation.isForced) {
    // コントロールを失う
    operationPanel.isOperable = false;
    operationPanel.ownerUid = operation.uid;
  }
  // 落下操作かどうか
  if (operation.isDown) {
    // 落下操作の場合
    // アニメーションを停止して
    operationPanel.physicsBody.animater.stop();
    // 指定された座標･回転量に瞬間移動する
    utilities.setB2BodyXYAngle({
      x: operation.x,
      y: operation.y,
      angle: operation.angle,
      body: operationPanel.physicsBody,
    });
    // 落下させる
    operationPanel.drop();
  } else {
    // 落下操作ではない場合
    // 回転アニメーション→横移動アニメーションを行う
    operationPanel.physicsBody.animater
      .addAnim(
        { angle: operation.angle },
        constants.SYNC_OPERATE_ANIMATION_DURATION,
        { isOverwrite: true },
      )
      .addAnim(
        { x: operation.x, y: operation.y },
        constants.SYNC_OPERATE_ANIMATION_DURATION,
      );
  }
  // ログ
  logger.log('receive operation: %o', operation);
}

/** createPanel()
 * 振ってくるパネルを生成する。
 */
export async function createPanel() {
  // パネルの同期はとられていない
  isSyncedPanelStates = false;
  // 現在存在するパネルのうちもっとも小さい (＝上にある) y座標を取得
  const minY = getObjectMinY();
  if (stepCount === 0) {
    floorY = minY;
  }
  // パネルの数
  panelCount = panels.length - 1;
  // 操作パネルを出現させるy座標の決定
  const putY = Math.min(
    constants.OPERATION_DEFAULT_Y,
    minY - constants.OPERATION_MARGIN_BOTTOM,
  );
    // スクロール位置の調整
  const scrollY = Math.max(0, -putY + constants.OPERATION_MARGIN_TOP);
  scroller.addAnim({ y: scrollY }, constants.SCROLL_DURATION, { isOverwrite: true });
  // 背景の調整
  const backGradIndex = getBackGradIndex(stepCount);
  if (backGradIndex !== currentBackGradIndex) {
    backAnimaters[backGradIndex]
      .addAnim({ alpha: 1 }, constants.SCROLL_DURATION, { isOverwrite: true });
    backAnimaters[currentBackGradIndex]
      .addAnim({ alpha: 0 }, constants.SCROLL_DURATION, { isOverwrite: true });
    currentBackGradIndex = backGradIndex;
  }
  // 動物の決定
  const monsterId = monsterTiles[stepCount % monsterTiles.length];
  let monsterData = MONSTERS_DATA[0];
  for (let i = 0; i < MONSTERS_DATA.length; i += 1) {
    if (monsterId === MONSTERS_DATA[i].id) {
      monsterData = MONSTERS_DATA[i];
      break;
    }
  }
  // 現在生存しているプレイヤーの数
  const alivePlayerCount = getAlivePlayerCount();
  // 次のプレイヤーインデックスを決めよう
  do {
    // とりあえずインクリメントしてプレイヤー数で割ってみるが…
    currentPlayerIndex = (currentPlayerIndex + 1) % playerStates.length;
    // そのプレイヤーがすでに死んでおり、
    // 他に生きているプレイヤーがひとり以上いるならばループする
  } while (playerStates[currentPlayerIndex].life <= 0
      && alivePlayerCount >= 1);
  //
  leftTimeElm.textContent = '';
  //
  const panelIndex = stepCount + 1;
  const panelName = app.view.getTranslatedText(monsterData.name);
  document.getElementById('step-info').innerText = `${panelIndex}. ${panelName}`;
  // 現在時刻
  const timeCreate = utilities.getTime();
  const isOperableRet = isOperable();
  // Panelインスタンスを作成
  operationPanel = new Panel({
    name: `${monsterData.name}`,
    x: constants.CANVAS_CENTER_X,
    y: putY,
    scale: monsterData.scale,
    cloudImage: await utilities.getImage('./assets/img/monsters/cloud.png'),
    image: await utilities.getImage(`./assets/img/monsters/${monsterData.name}.png`),
    pathData: await utilities.getSvgPathData(`./assets/img/monsters/${monsterData.name}.svg`),
    ownerUid: playerStates[currentPlayerIndex].uid,
    app,
    stage,
    world,
    scroller,
    isOnline,
    stepCount,
    timeLimit,
    timeCreate,
    leftTimeElm,
    isOperable: isOperableRet,
    canvasDetail: app.view.canvasDetail,
  }).pushTo(panels);
  // サーバーに保存する操作情報の初期化
  if (isOnline && isOperableRet) {
    app.network.sendOperation(stepCount, { isDown: false });
  }
  // サウンド
  app.sound.play(constants.SE_PANEL_NEXT);
  // 自分の番かどうか
  if (isOnline) {
    if (isOwnTurn()) {
      document.getElementById('ope-button-outer').style.setProperty('display', 'block');
      document.getElementById('ones-turn-outer').style.setProperty('display', 'none');
      app.view.log('your-turn');
    } else {
      document.getElementById('turn-name').textContent = playerStates[currentPlayerIndex].displayName;
      document.getElementById('ope-button-outer').style.setProperty('display', 'none');
      document.getElementById('ones-turn-outer').style.setProperty('display', 'block');
    }
  } else {
    document.getElementById('ope-button-outer').style.setProperty('display', 'block');
  }
  // オペレーションキューがあるなら
  if (operationQueue.length > 0) {
    const operation = operationQueue.shift();
    receiveOperation(operation, stepCount);
  }
  // リプレイモードなら
  if (isReplay) {
    const paddedStepCount = (`000${stepCount}`).slice(-3);
    const operation = replayOperations[`step-${paddedStepCount}`];
    receiveOperation(operation, stepCount);
  }
  utilities.dispatchDocumentEvent('gamestep', {
    stepCount,
    panelCount,
    towerHeight,
  });
  // ログ
  logger.log(
    `%cStep ${stepCount + 1}. ${utilities.ucfirst(monsterData.name)} (${towerHeight}m)`,
    logger.getMarkerStyle('orange'),
  );
  logger.log(`Player: ${playerStates[currentPlayerIndex].displayName} `
    + `${isOperableRet ? '(Your Turn)' : ' (Other\'s Turn)'}`);
}

/** judgeNextPanel(hasJumpedOut)
 * 次のパネルに進めるかどうかを判定します。
 * @param {boolean} hasJumpedOut - 飛び出たかどうか。
 */
export function judgeNextPanel(hasJumpedOut) {
  // 飛び出たパネルがあったかどうかで場合分け
  if (!hasJumpedOut) {
    // 飛び出たパネルがなければ次のパネルを作る
    createPanel();
  } else {
    // 飛び出たパネルがあれば現在のプレイヤーのライフを1減らす
    const currentPlayer = playerStates[currentPlayerIndex];
    currentPlayer.life -= 1;
    // もしこのプレイヤーが死んでしまったら
    if (currentPlayer.life <= 0) {
      // 死の順番を決定する
      currentPlayer.deathOrder = deathOrder;
      deathOrder += 1;
      logger.log(`${currentPlayer.displayName} died!`);
    }
    // 生きているプレイヤーの数で場合分け
    if (getAlivePlayerCount() <= 1) {
      // 生きているプレイヤーの数が1以下の場合、ゲームは終了
      utilities.dispatchDocumentEvent('gamefinish', {
        stepCount,
        panelCount,
        towerHeight,
        playerStates,
        stageCache,
      });
      logger.log(`${getAlivePlayer()} win!`);
    } else {
      // 生きているプレイヤーの数が2以上の場合、ゲームは続行
      // 次のパネルを作ろう
      createPanel();
    }
  }
}

/** syncPanelStates()
 * panelStatesの同期を取るときに呼ばれます。
 */
export function syncPanelStates(json) {
  if (!json) {
    return;
  }
  // すべてのパネルについて同期をとりつつ飛び出ているかどうかもチェックする
  let hasJumpedOut = false;
  const panelStates = JSON.parse(json);
  const panelKeys = Object.keys(panelStates);
  logger.log('receive panelStates: %o', panelStates);
  for (let i = 0; i < panels.length; i += 1) {
    const panel = panels[i];
    const key = `${panel.stepCount}`;
    if (!panel.isField && panelKeys.indexOf(key) > -1) {
      const state = panelStates[key];
      if (state.j) {
        if (!panel.hasJumpedOut) {
          app.sound.play(constants.SE_PANEL_JUMP_OUT);
        }
        hasJumpedOut = true;
        utilities.logger.log(`${panel.name} jumped out!`);
        panel.remove();
        i -= 1;
      } else {
        panel.hasJumpedOut = false;
        panel.setStatic();
        utilities.setB2BodyXYAngle({
          body: panel.physicsBody,
          x: state.x,
          y: state.y,
          angle: state.a,
        });
      }
    }
  }
  isSyncedPanelStates = true;
  // 手数を進める
  stepCount += 1;
  // 一定時間後にonAllBodiesSleep()を呼び出す
  const time = (operationPanel.hasJumpedOut)
    ? constants.PANEL_CREATE_DURATION_JUMPED
    : constants.PANEL_CREATE_DURATION;
  setTimeout(() => {
    // 次のパネルに進めるかどうかを判定
    judgeNextPanel(hasJumpedOut);
  }, time);
  // とりあえず再描画する
  stage.update();
  // operationPanelは消す
  operationPanel = null;
  // スクリーンショットを撮影
  const d = app.view.canvasDetail;
  stage.cache(d.padding.x, d.padding.y, d.originWidth, d.originHeight);
  stageCache = stage.getCacheDataURL();
  stage.uncache();
  // 高さを計算
  towerHeight = utilities.round((floorY - getObjectMinY()) / constants.METER_B, 2);
}

/** createPanelStates()
 * パネル状況を表すオブジェクトを作って返します。
 * @return {Object} パネル状況を表すオブジェクト
 */
export function createPanelStates() {
  const panelStates = {};
  panels.forEach((panel) => {
    if (!panel.isField) {
      panelStates[panel.stepCount] = {
        a: panel.physicsBody.GetAngle(),
        x: panel.physicsBody.GetPosition().x,
        y: panel.physicsBody.GetPosition().y,
        j: panel.hasJumpedOut,
      };
    }
  });
  return panelStates;
}

/** onAllBodiesSleep()
 * すべてのオブジェクトが静止したときに呼ばれます。
 */
export function onAllBodiesSleep() {
  logger.log('all bodies sleep');
  // 手数を進める
  stepCount += 1;
  // オフラインモードならば
  if (!isOnline) {
    // 飛び出たかどうか
    let hasJumpedOut = false;
    // すべてのパネルについて
    for (let i = 0; i < panels.length; i += 1) {
      const panel = panels[i];
      // 震えカウントをゼロにする
      panel.initShakeCount();
      // 飛び出ていれば削除する
      if (panel.hasJumpedOut) {
        hasJumpedOut = true;
        utilities.logger.log(`${panel.name} jumped out!`);
        panel.remove();
        i -= 1;
      }
    }
    // エンドレスモードかどうか
    if (isEndless) {
      // エンドレスモードならば
      // 次のパネルを作って終了
      createPanel();
    } else {
      // エンドレスモードではないならば
      // 次のパネルに進めるかどうかを判定
      judgeNextPanel(hasJumpedOut);
    }
  }
}

/** updateBackGrads()
 * 背景のグラデーションを描画し直します。
 */
export function updateBackGrads() {
  constants.BACK_GRADS.forEach((colors, i) => {
    backGrads[i].graphics
      .clear()
      .beginLinearGradientFill(colors, [0,
        0.5,
        1], 0, canvas.height, 0, 0)
      .drawRect(0, 0, canvas.width, canvas.height);
    backGrads[i].cache(0, 0, canvas.width, canvas.height);
  });
  backObjects.boat.set({
    x: Math.floor(canvas.width * 0.5),
    y: Math.floor(canvas.height * 0.4),
    regX: Math.floor(backObjects.boat.image.naturalWidth / 2),
    regY: Math.floor(backObjects.boat.image.naturalHeight / 2),
    scale: 0.7,
    alpha: 0.4,
  });
  backObjects.rock.set({
    x: Math.floor(canvas.width * 0.5),
    y: Math.floor(canvas.height * 0.25),
    regX: Math.floor(backObjects.rock.image.naturalWidth / 2),
    regY: Math.floor(backObjects.rock.image.naturalHeight / 2),
    scale: 0.7,
    alpha: 0.6,
  });
}

/** tickWorld()
 * LiquidFunのワールドを1フレーム分進めます。
 * 単にWorldのStepメソッドを呼ぶだけではなく、
 * スムーズにタワーバトルを行うための手入れを行います(物理的に不自然な挙動になるが…)。
 * (衝突時に速度軽減＋何度も振り子運動をした場合に回転速度軽減)
 * また、パネルが落ちたかどうかの判定も行います。
 */
export function tickWorld() {
  // LiquidFunワールドをStep
  world.Step(
    constants.TIME_STEP,
    constants.VELOCITY_ITERATIONS,
    constants.POSITION_ITERATIONS,
  );
  // 保有するPanelインスタンスについて走査
  panels.forEach((panel) => {
    const body = panel.physicsBody;
    // アニメーションを進める
    body.animater.tick();
    // Awakeなオブジェクトではないならばこの先の処理は必要ない
    if (body.isAwake === false) {
      return;
    }
    // 飛び出しの判定
    // y座標がワールドサイズを超えていればonBodyJumpOut()を呼び出してから削除する
    if (body.GetPosition().y > constants.WORLD_HEIGHT) {
      if (!panel.hasJumpedOut) {
        panel.jumpOut();
      }
    }
    // 移動速度･回転速度の調整
    // 移動速度
    const vec = body.GetLinearVelocity();
    // 回転速度
    let vangle = body.GetAngularVelocity();
    // 回転方向
    const vangleDir = (vangle >= 0) ? 1 : -1;
    // 回転方向が変わった回数を記録
    if (body.vangleDirection !== 0 && body.vangleDirection !== vangleDir) {
      body.shakeCount += 1;
    }
    body.vangleDirection = vangleDir;
    // 直前に自由落下していたか
    // (下方向に速度を持ち、かつ、横方向の速度と回転速度を持っているか)
    const isFreeFallBefore = (body.vy !== 0
                                && body.vx === 0
                                && body.vangle === 0);
      // この瞬間衝突が発生したか
    const isCollisionNow = (vec.x !== 0 || vangle !== 0 || body.vy > vec.y);
    // 場合分けして速度を変化させる
    if (isFreeFallBefore && isCollisionNow) {
      // 着地した瞬間ならば
      // (直前まで自由落下しており、かつ、いまこの瞬間何かに衝突したならば)
      // 速度を減らす (着地時の衝撃を和らげるため)
      vec.x *= constants.CUSION_COEFFICIENT;
      vec.y *= constants.CUSION_COEFFICIENT;
      vangle *= constants.CUSION_COEFFICIENT;
    } else if (vangle !== 0 && body.shakeCount >= constants.MAX_SHAKE_COUNT) {
      // "回転方向が変わった回数"が所定回数以上になったら
      // 強制的に抵抗をかけて止める
      // if (body.name === 'stinger') {
      vangle *= constants.ROTATE_BRAKE_COEFFICIENT;
      // }
      // (オブジェクトが振り子のような動きをしている場合、
      //  静止するまでにかなりの時間を要する恐れがあるため)
    }
    // 落下速度に上限を設ける
    vec.y = Math.min(constants.MAX_LINEAR_VELOCITY, vec.y);
    // 新しい速度をセットする
    body.SetLinearVelocity(vec);
    body.SetAngularVelocity(vangle);
  }); // 速度の調整終わり
}

/** handleTickStage(e)
 * CreateJSのTickerに登録するリスナーです。
 * @param {Event} e - イベントオブジェクト。
 * @param {boolean} e.needsRedraw - trueの場合、強制的に再描画を行います。
 * @param {boolean} e.paused - Tickerがポーズ中かどうか。
 * @param {number} e.delta - 前回のtickイベント発生から経過した時間(msec)。
 * @param {number} e.time - Tickerが初期化されてから経過した時間(msec)。
 * @param {number} e.runTime - timeからポーズ中の時間を引いた時間(msec)。
 */
export function handleTickStage(e) {
  // 再描画の必要性があるかどうか 初期値はe.needsRedraw
  // AnimaterやPanelをTickしていくときに、
  // ひとつでも再描画の必要があると判断されればtrueになる
  let needsRedraw = !!e.needsRedraw;
  // 物理世界を1フレーム分進める
  tickWorld();
  // スクローラーおよび背景グラデーションのAnimaterのTick
  needsRedraw = scroller.tick() || needsRedraw;
  backAnimaters.forEach((backAnimater) => {
    needsRedraw = backAnimater.tick() || needsRedraw;
  });
  // 保有するすべてのPanelのTick
  panels.forEach((panel) => {
    needsRedraw = panel.tick() || needsRedraw;
  });
  if (needsRedraw) {
    stage.update();
  }
  // パネルが落ちた後で再描画が必要ではなくなった(動いている物体がなくなった)ならば
  if (operationPanel && operationPanel.isFalled && !needsRedraw) {
    if (isOnline && !isSyncedPanelStates && operationPanel.isOperable) {
      // panelStatesを作成して通信する
      const panelStates = createPanelStates();
      app.network.sendPanelStates(panelStates);
      isSyncedPanelStates = true;
    } else if (!isOnline) {
      // 一定時間後にonAllBodiesSleep()を呼び出す
      const time = (operationPanel.hasJumpedOut)
        ? constants.PANEL_CREATE_DURATION_JUMPED
        : constants.PANEL_CREATE_DURATION;
      setTimeout(() => {
        onAllBodiesSleep();
      }, time);
      // とりあえず再描画する
      stage.update();
      // operationPanelは消す
      operationPanel = null;
      // スクリーンショットを撮影
      const d = app.view.canvasDetail;
      stage.cache(d.padding.x, d.padding.y, d.originWidth, d.originHeight);
      stageCache = stage.getCacheDataURL();
      stage.uncache();
      // 高さを計算
      towerHeight = utilities.round((floorY - getObjectMinY()) / constants.METER_B, 2);
    }
  }
  // 制限時間がある場合
  if (timeLimit > 0 && operationPanel && operationPanel.needsOperate()) {
    // 残り時間を計算
    const leftTime = operationPanel.calcLeftTime();
    // 切り上げ秒に直す
    const leftTimeSec = Math.max(0, Math.ceil(leftTime / 1000));
    // 切り上げ秒が前回フレームと一致しなければ残り時間の<div>要素の内容を変更する
    if (leftTimeSec !== leftTimeBefore) {
      leftTimeElm.setAttribute('time', leftTimeSec);
      leftTimeElm.classList.remove('animation');
      setTimeout(() => {
        leftTimeElm.classList.add('animation');
        leftTimeElm.textContent = leftTimeSec;
      }, 17);
    }
    // 残り時間が0を切れば強制的に落下させる
    if (leftTime <= 0) {
      operationPanel.drop();
    }
    // 今フレームで計算した残り時間(切り上げ秒)を覚えておく
    leftTimeBefore = leftTimeSec;
  }
}

/** initialize()
 * パネルを初期化します。
 * LiquidFunワールドおよびCreateJSステージの作成、
 * CreateJSのアップデート関数の登録を行います。
 */
export async function initialize() {
  //
  // LiquidFun - Worldの作成
  //
  const gravity = (constants.IS_DEVELOPMENT && utilities.getBrowserName() === 'firefox')
    ? 30
    : constants.GRAVITY;
  // ワールドを作成
  world = new b2World(
    new b2Vec2(0, gravity),
  );
  // LiquidFunライブラリ内でグローバル変数worldを参照しているようなので
  // window.worldに参照を渡しておかないと動かない
  window.world = world;
  //
  // CreateJS - Stageの作成
  //
  // <canvas>要素の横幅と高さを設定
  canvas = document.getElementById(constants.CANVAS_ID);
  // WebGLが有効かどうかで場合分け
  if (app.storage.get('settings').isEnabledStageGL) {
    // WebGLが有効な場合
    // StageGL(WebGL製のステージ)を作成して背景色を設定
    stage = new createjs.StageGL(canvas);
    stage.setClearColor(constants.BG_COLOR);
  } else {
    // WebGLが有効ではない場合
    // Stage(2dContext製のステージ)を作成
    stage = new createjs.Stage(canvas);
  }
  // stageをcanvasから参照できるようにしておく
  canvas.stage = stage;
  // マウスオーバーを有効化
  stage.enableMouseOver();
  // タッチが有効なデバイスならタッチ操作の有効化
  if (createjs.Touch.isSupported()) {
    createjs.Touch.enable(stage);
  }
  // CreateJSのフレームレートの設定
  if (constants.SHOULD_USE_TIMEOUT) {
    // setTimeoutを使う場合
    createjs.Ticker.timingMode = createjs.Ticker.TIMEOUT;
    createjs.Ticker.framerate = constants.FRAME_RATE;
  } else if (constants.FRAME_RATE >= 60) {
    // RAF(Request Animation Frame)を使用する、かつ、60FPS以上の場合
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
  } else {
    // RAF(Request Animation Frame)を使用する、かつ、60FPS未満の場合
    createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    createjs.Ticker.framerate = constants.FRAME_RATE;
  }
  //
  // CreateJS - 背景を作成する
  //
  for (let i = 0; i < constants.BACK_GRADS.length; i += 1) {
    backGrads[i] = new createjs.Shape();
    backGrads[i].alpha = (i === 0) ? 1 : 0;
    backAnimaters[i] = new Animater(backGrads[i]);
    stage.addChild(backGrads[i]);
  }
  const boatImage = await utilities.getImage('./assets/img/back/boat.png');
  const boat = new createjs.Bitmap(boatImage);
  stage.addChild(boat);
  backObjects.boat = boat;
  const rockImage = await utilities.getImage('./assets/img/back/rock.png');
  const rock = new createjs.Bitmap(rockImage);
  stage.addChild(rock);
  backObjects.rock = rock;
  updateBackGrads();
  stage.update();
  //
  // キャンバスリサイズ時のイベントハンドラを登録する
  //
  utilities.addDocumentEventListener('canvasresize.stage', (e) => {
    // StageGL製ならばviewportのアップデートが必要
    if (stage instanceof createjs.StageGL) {
      stage.updateViewport(e.detail.width, e.detail.height);
    }
    // Panelの座標の更新
    panels.forEach((panel) => {
      panel.tick(true);
    });
    // 背景のアップデート
    updateBackGrads();
    // ステージの再描画
    stage.update();
  });
  // ログ
  logger.log('%cGame initialized', logger.getMarkerStyle('skyblue'));
}

/** finishGame()
 * ゲームの終了処理を行います。
 */
export function finishGame() {
  // 存在するPanelをすべて削除
  while (panels[0]) {
    panels[0].remove();
  }
  // スクロールを戻す
  scroller.addAnim({ y: 0 }, constants.SCROLL_DURATION, { isOverwrite: true });
  // 背景を戻す
  if (currentBackGradIndex !== 0) {
    backAnimaters[0]
      .addAnim({ alpha: 1 }, constants.SCROLL_DURATION, { isOverwrite: true });
    backAnimaters[currentBackGradIndex]
      .addAnim({ alpha: 0 }, constants.SCROLL_DURATION, { isOverwrite: true });
  }
  // 各変数の初期化
  operationPanel = null;
  stepCount = 0;
  towerHeight = 0;
  panelCount = 0;
  currentPlayerIndex = -1;
  isFinished = true;
  currentBackGradIndex = 0;
  operationQueue = [];
  leftTimeBefore = 0;
  deathOrder = 0;
  if (leftTimeElm) {
    leftTimeElm.textContent = '';
  }
  // リスナーをすべて削除
  createjs.Ticker.reset();
  // 再描画
  handleTickStage({ needsRedraw: true });
  // ログ
  logger.log('%cGame finished', logger.getMarkerStyle('skyblue'));
}

/** beginGame(room)
 * ゲームの開始処理を行います。
 * オフラインで遊ぶ場合、引数roomを指定する必要はありません。
 * @typedef {Object} Room - 部屋データのオブジェクトです。Firebaseから取ってきます。
 * @property {Object} members - uidをキーにして、｛displayName、photoURLプロパティを持つオブジェクト｝を取り出せるオブジェクトです。
 * @property {Object} orders - ’order-1'、'order-2'…をキーにして、その順番のプレイヤーのuidを取り出せるオブジェクトです。
 * @property {number} seed - 部屋の乱数シード。
 * @param {Room} room - 部屋のデータ。
 */
export async function beginGame(room) {
  // 終了処理が行われていないならば終了処理を行う
  if (!isFinished) {
    finishGame();
  }
  // 部屋が指定されているならば
  if (room) {
    // プレイヤーの特定
    const players = [];
    const orderKeys = Object.keys(room.orders);
    orderKeys.forEach((orderKey) => {
      const uid = room.orders[orderKey];
      const order = parseInt(orderKey.split('-')[1], 10);
      players[order] = {
        uid,
        displayName: room.members[uid].displayName,
        photoURL: room.members[uid].photoURL,
      };
    });
    // プレイヤーとシードをセット
    setPlayerStates(players);
    setSeed(room.seed);
    setIsEndless(false);
  }
  // プレイヤーの状態をリセット(全員生存)
  for (let i = 0; i < playerStates.length; i += 1) {
    playerStates[i].life = constants.PLAYER_LIFE;
    playerStates[i].deathOrder = playerStates.length - 1;
  }
  // 乱数生成器の初期化
  const seed = getSeed();
  xors = new Xors(seed);
  // 残り時間エレメントの取得
  leftTimeElm = document.getElementById('left-time');
  // 動物配牌の決定
  monsterTiles = getMonsterTiles();
  //
  // オブジェクトの初期化
  //
  // 床オブジェクトを作成
  new Panel({
    name: 'floor',
    x: constants.CANVAS_CENTER_X,
    y: constants.FLOOR_Y,
    width: constants.FLOOR_WIDTH,
    isField: true,
    image: await utilities.getImage('./assets/img/monsters/field.png'),
    pathData: await utilities.getSvgPathData('./assets/img/monsters/field.svg'),
    app,
    canvasDetail: app.view.canvasDetail,
    stage,
    world,
    scroller,
  }).pushTo(panels);
  // 操作オブジェクトを作成
  createPanel();
  // 終了処理は行われていない
  isFinished = false;
  // ハンドルティックを登録
  createjs.Ticker.on('tick', handleTickStage);
  utilities.dispatchDocumentEvent('gamebegin', {
    seed,
  });
  // ログ
  logger.log(`Seed: ${seed}`);
  logger.log(`Monster Tiles: ${JSON.stringify(monsterTiles)}`);
  logger.log(`Player Names: ${JSON.stringify(playerStates)}`);
  logger.log('%cGame begined', logger.getMarkerStyle('skyblue'));
}

/** execOperationLR(delta)
   * 操作オブジェクトを左右に動かします。
   * @param {number} delta - 動かす量(m)
   */
export function execOperationLR(delta) {
  // 操作対象のオブジェクトが存在するなら
  if (operationPanel && operationPanel.isOperable && !operationPanel.isFalled) {
    operationPanel.move(delta);
  }
}

/** replayGame(room)
 */
export function replayGame(room) {
  isOnline = false;
  isEndless = true;
  playerStates = [
    { uid: '1P', displayName: '1P' },
    { uid: '2P', displayName: '2P' },
  ];
  gameSeed = room.seed;
  replayOperations = room.operations;
  isReplay = true;
  beginGame();
}

/** startOver()
 * 乱数シードを変えずに、ゲームを最初からやり直します。
 */
export function startOver() {
  beginGame();
}

/** startAgain()
 * 乱数シードを変えて、ゲームを最初からやり直します。
 */
export function startAgain() {
  setUnixSeed();
  beginGame();
}
