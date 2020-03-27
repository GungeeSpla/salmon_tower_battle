//
// 全体
//
/** アプリのバージョン */
export const APP_VERSION = '0.3.0';
/** 読んでいるindex.jsまたはbundle.jsのクエリを含むファイル名 */
const appfile = document.getElementById('app').getAttribute('src');
/** アプリを読み込んだ際のURLクエリパラメータ */
export const APP_VERSION_QUERY = appfile.split('?')[1];

//
// デバッグ
//

/** 開発中かどうか(bundle.jsではなくindex.jsを読んでいるかどうか) */
export const IS_DEVELOPMENT = appfile.indexOf('index.js') > -1;
/** デバッグモード:誰の番でも操作できるようにするか */
export const IS_DEBUG_OPERATE = IS_DEVELOPMENT && false;
/** デバッグモード:当たり判定ポリゴン･重心･中心を表示するか */
export const IS_DEBUG_POLYGON = IS_DEVELOPMENT && false;
/** デバッグモード:乱数のシード値を固定するか */
export const IS_DEBUG_RANDOM_SEED = IS_DEVELOPMENT && false;
/** デバッグモード:ログを表示するか */
export const IS_DEBUG_LOG = IS_DEVELOPMENT && true;
/** 乱数のシード固定値 */
export const DEBUG_RANDOM_SEED = 1;

//
// ストレージ
//

/* ストレージコンフィグ */
export const STORAGE_CONFIG = {
  settings: {
    storageKey: 'stb-settings',
    initialValue: {
      globalVolume: 0,
      isEnabledStageGL: true,
      language: null,
    },
  },
};
/** ストレージコンフィグのキー配列 */
export const STORAGE_CONFIG_KEYS = Object.keys(STORAGE_CONFIG);

//
// サウンド
//

/** 音声ファイルのURLベース */
export const SOUND_URL_BASE = './assets/snd/';
/** サウンド再生制限解除用の無音ファイル */
export const SOUND_SILENT = 'silent.mp3';
/** 最初のBGMファイル */
export const SOUNT_INITIAL_BGM = 'gogo.mp3';
/** 音量の調節用パラメータ */
export const SOUND_VOLUME_ALPHAS = [
  0,
  0.1,
  0.4,
  1,
];
export const SE_PANEL_NEXT = 'se-panel-next.wav';
export const SE_PANEL_JUMP_OUT = 'se-panel-jump-out.wav';
export const SE_PANEL_ROTATE = 'se-panel-rotate.wav';
export const SE_PANEL_DOWN = 'se-panel-rotate.wav';

//
// キー
//

/** キーコンフィグ */
export const KEY_CONFIG = {
  left: [
    37,
  ],
  up: [
    38,
  ],
  right: [
    39,
  ],
  down: [
    40,
  ],
  start: [
    32,
    13,
  ],
};
/** キーコンフィグのキー配列 */
export const KEY_TYPES = Object.keys(KEY_CONFIG);

//
// ビュー
//

/** 最初にジャンプするラベル */
export const INITIAL_LABEL = 'title';
/** レイヤー名配列 */
export const LAYER_NAMES = [
  'loading',
  'back',
  'main',
  'fix',
  'alert',
];
/** コンテナID */
export const CONTAINER_ID = 'createjs-container';
/** キャンバスID */
export const CANVAS_ID = 'createjs-canvas';
/** シーンジャンプ処理を行う最低間隔(msec) */
export const SCENE_JUMP_DURATION = 200;
/** キャンバスリサイズ処理を行う最低間隔(msec) */
export const CANVAS_FITTING_DURATION = 250;
/** オリジナルキャンバス幅 */
export const CANVAS_WIDTH = 720;
/** オリジナルキャンバス高さ */
export const CANVAS_HEIGHT = 1280;
/** オリジナルキャンバス縦横比 */
export const CANVAS_RATIO = CANVAS_HEIGHT / CANVAS_WIDTH;
/** iPhone4のキャンバス縦横比 */
export const IPHONE_4_RATIO = 960 / 640;
/** iPhone11の画面縦横比 */
export const IPHONE_11_RATIO = 2688 / 1242;
/** iPad Pro(10インチ)の画面縦横比 */
export const IPAD_PRO_10_RATIO = 2224 / 1668;
/** 最小キャンバス縦横比 */
export const CANVAS_MIN_RATIO = IPAD_PRO_10_RATIO;
/** 最大キャンバス縦横比 */
export const CANVAS_MAX_RATIO = IPHONE_11_RATIO;
/** ポップアップを有効にするか？ */
export const IS_ENABLED_POPUP = false;
/** 画面の横中央 */
export const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
/** 背景色 */
export const BG_COLOR = '#00bcd4';
/** 背景グラデーションを切り替える閾値 */
export const BACK_GRAD_THRESHOLD = 15;
/** 背景グラデーション */
export const BACK_GRADS = [
  /** 1枚目の背景グラデーション */
  [
    '#2BFBF9',
    '#16B4E8',
    '#0B8ADE',
  ],
  /** 2枚目の背景グラデーション */
  [
    '#FDA798',
    '#AA5360',
    '#582F51',
  ],
  /** 3枚目の背景グラデーション */
  [
    '#2F7FA9',
    '#306A9A',
    '#070C21',
  ],
];

//
// ゲーム
//

/** ルームメンバーの最大数 */
export const ROOM_MEMBER_COUNT_MAX = 6;
/** パネルの制限時間 */
export const PANEL_TIME_LIMIT = 15;
/** プレイヤーのライフ */
export const PLAYER_LIFE = 1;
/** フレームレート */
export const FRAME_RATE = 60;
/** CreateJSのタイミングモード */
export const SHOULD_USE_TIMEOUT = true;
/** LiquidFunの世界の1メートルに対応するピクセル数 */
export const METER = 100;
/** 1メートルに対応するピクセル数 別の用途で用いる */
export const METER_B = 170;
/** 重力加速度(現実では約9.8) */
export const GRAVITY = 4;
/** 時間のステップ */
export const TIME_STEP = 1 / FRAME_RATE;
/** 速度の計算回数 */
export const VELOCITY_ITERATIONS = 3;
/** 位置の計算回数 */
export const POSITION_ITERATIONS = 1;
/** 線の厚み */
export const STROKE_WIDTH = 2;
/** 最大落下速度 */
export const MAX_LINEAR_VELOCITY = 3;
/** デフォルト密度 */
export const DEFAULT_DENSITY = 1;
/** デフォルト摩擦抵抗 */
export const DEFAULT_FRICTION = 8;
/** デフォルト反発係数 */
export const DEFAULT_RESTITUTION = 0;
/** 最大頂点数 */
export const MAX_VERTEX_NUM = 8;
/** 最大密度(重心調整用) */
export const MAX_DENSITY = 30;
/** 画面スクロールアニメーション時間(msec) */
export const SCROLL_DURATION = 1000;
/** パネル回転操作アニメーション時間(msec) */
export const ROTATE_DURATION = 300;
/** パネル生成時に出現する雲のアニメーション時間(msec) */
export const CLOUD_ANIMATION_DURATION = 2000;
/** すべてのパネルが静止してから次のパネルを生成するまでの余白時間(msec) */
export const PANEL_CREATE_DURATION = 400;
/** (飛び出した場合)すべてのパネルが静止してから次のパネルを生成するまでの余白時間(msec) */
export const PANEL_CREATE_DURATION_JUMPED = 800;
/** (オンライン時)フレンドの操作のアニメーション時間(msec) */
export const SYNC_OPERATE_ANIMATION_DURATION = 800;
/** (オンライン時)非落下操作の同期を取る間隔(msec) */
export const SYNC_OPERATE_TIMEOUT_DURATION = 3333;
/** 座標テレポート量(m) */
export const TELEPORT_X = 100;
/** 操作オブジェクトを出すy座標(px) */
export const OPERATION_DEFAULT_Y = 400;
/** 操作オブジェクトを出すときの下方向マージン(px) */
export const OPERATION_MARGIN_BOTTOM = 200;
/** 操作オブジェクトを出すときの上方向マージン(px) */
export const OPERATION_MARGIN_TOP = 400;
/** 床オブジェクトのy座標(px) */
export const FLOOR_Y = 1000;
/** 床オブジェクトの幅(px) */
export const FLOOR_WIDTH = 580;
/** ワールドの下方向への限界位置 */
export const WORLD_HEIGHT = (200 + CANVAS_HEIGHT) / METER;
/** 衝突時のクッション係数 */
export const CUSION_COEFFICIENT = 1 / 16;
/** 回転速度に抵抗をかけ始める振動回数 */
export const MAX_SHAKE_COUNT = 5;
/** 回転速度の抵抗係数 */
export const ROTATE_BRAKE_COEFFICIENT = 0.9;
