/** 言語データ */
const LANGUAGES = {
  'title': {
    ja: 'サーモンタワーバトル',
    en: 'Salmon Tower Battle',
  },
  /** タイトル画面 */
  'logo-salmon': {
    ja: 'サーモン',
    en: 'Salmon',
  },
  'logo-tower-battle': {
    ja: 'タワーバトル',
    en: 'Tower Battle',
  },
  'sign-in-with-twitter': {
    ja: 'Twitterでログインする',
    en: 'Sign In With Twitter',
  },
  'private-room': {
    ja: 'プライベートルーム',
    en: 'Private Room',
  },
  'create-private-room-footer': {
    ja: 'フレンドを招待していっしょに遊べる！',
    en: 'You can invite and play with friends!',
  },
  'play-in-offline': {
    ja: 'ひとりで遊ぶ',
    en: 'Play by Myself',
  },
  'play-in-offline-footer': {
    ja: 'ひとりでとことん練習できる！',
    en: 'You can practice by myself thoroughly!',
  },
  settings: {
    ja: 'オプション',
    en: 'Settings',
  },
  'settings-footer': {
    ja: 'ゲーム設定を変更する',
    en: 'You can change game settings',
  },
  /** アラート */
  'heads-up': {
    ja: '注意',
    en: 'HEADS UP',
  },
  'private-room-not-signed-in': {
    ja: 'プライベートルームを作るためには<br><b>Twitterでログイン</b>する必要があります',
    en: 'You should <b>sign in with Twitter</b><br>in order to create a private room',
  },
  'sign-out': {
    ja: 'ログアウト',
    en: 'SIGN OUT',
  },
  'sign-out-heads-up': {
    ja: 'ログアウトします<br>よろしいですか？',
    en: 'Would you like to sign out?',
  },
  cool: {
    ja: 'はい！',
    en: 'Cool!',
  },
  'not-cool': {
    ja: 'いいえ',
    en: 'Not Cool',
  },
  ok: {
    ja: 'はい！',
    en: 'OK!',
  },
  /** オプション */
  'webgl-desc': {
    ja: '動作が低速または不安定の場合、<br>OFFにすると改善する可能性があります(リロード後に有効)',
    en: 'If your app is slow or unstable, <br>please try setting "OFF" (valid after a reload)',
  },
  language: {
    ja: '言語',
    en: 'Language',
  },
  'lang-desc': {
    ja: '言語を日本語または英語から選ぶことができます',
    en: 'Please choose language from Japanese or English',
  },
  exit: {
    ja: '戻る',
    en: 'Exit',
  },
  /** ルーム管理 */
  'create-private-room': {
    ja: 'プライベートルームを作る',
    en: 'Create private room',
  },
  'create-private-room-caution': {
    ja: 'いまあるプライベートルームは崩れますが<br>よろしいですか？',
    en: 'Existing room will be destroyed<br>Are you cool with that?',
  },
  'destroy-private-room-caution': {
    ja: 'プライベートルームを崩します<br>よろしいですか？',
    en: 'The room will be destroyed<br>Are you cool with that?',
  },
  'go-to-own-private-room': {
    ja: '自分のプライベートルームに行く',
    en: 'Go to my private room',
  },
  'destroy-own-private-room': {
    ja: '自分のプライベートルームを壊す',
    en: 'Destroy my private room',
  },
  'go-to-invited-private-room': {
    ja: '招待されているプライベートルームに行く',
    en: 'Go to room you are invited',
  },
  /** ゲーム開始待機画面 */
  start: {
    ja: 'スタート！',
    en: 'START!',
  },
  'please-share-url': {
    ja: '以下の招待URLを<br>Twitterのともだちに<br>教えてあげてください',
    en: 'Please share this URL<br>with your Twitter friends',
  },
  copy: {
    ja: 'コピー',
    en: 'COPY',
  },
  copied: {
    ja: 'コピーしました！',
    en: 'Copied!',
  },
  close: {
    ja: '閉じる',
    en: 'Close',
  },
  'not-all-waiting': {
    ja: '待機中ではないメンバーがいます',
    en: 'Some players are not \'waiting\'',
  },
  'waiting-game-start': {
    ja: 'ホストのゲーム開始を待っています…',
    en: 'Waiting for the host to start the game…',
  },
  'room-was-destroyed': {
    ja: '部屋が崩れました<br>タイトルに戻ります',
    en: 'The room was destroyed<br>Return title',
  },
  'deport-room-member': {
    ja: '%name%<br>を退去させますか？',
    en: 'Would you like to deport<br>%name%?',
  },
  waiting: {
    ja: '待機中',
    en: 'waiting',
  },
  playing: {
    ja: 'ゲーム中',
    en: 'playing',
  },
  /** 招待URL */
  'invitation-not-signed-in': {
    ja: '招待を受け取るためには<br><b>Twitterでログイン</b>する必要があります',
    en: 'You should <b>sign in with Twitter</b><br>in order to accept a invitation',
  },
  invitation: {
    ja: '<span id="invite-user"></span> さんに招待されています',
    en: 'You\'ve been invited to join by <span id="invite-user"></span>',
  },
  'invitation-invalid': {
    ja: '無効な招待URLです',
    en: 'This invitation URL is invalid',
  },
  'room-doesnt-exist': {
    ja: '部屋が存在しません',
    en: 'The room doesn\'t exist',
  },
  join: {
    ja: '参加する！',
    en: 'JOIN!',
  },
  'error-room-is-full': {
    ja: '部屋が満員なので<br>部屋に入ることができませんでした',
    en: 'Failed to enter the room<br>because the room is full',
  },
  'error-room-is-active': {
    ja: 'ゲームが行われている最中なので<br>部屋に入ることができませんでした',
    en: 'Failed to enter the room<br>because the room is active',
  },
  'error-room-versions-dont-match': {
    ja: 'ホストとバージョンが一致しないため<br>部屋に入ることができませんでした',
    en: 'Failed to enter the room<br>because the versions don\'t match',
  },
  /** 接続中など */
  connecting: {
    ja: '接続中…',
    en: 'Connecting…',
  },
  /** リザルト */
  'salmonid-counter': {
    ja: '匹',
    en: '',
  },
  'offline-seed': {
    ja: 'シード値',
    en: 'Seed',
  },
  'offline-salmonids': {
    ja: '乗っている数',
    en: 'Remaining',
  },
  'offline-height': {
    ja: '高さ',
    en: 'Height',
  },
  'result-fall-count-desc': {
    ja: '落ちてきた数',
    en: 'Falling',
  },
  'result-ride-count-desc': {
    ja: '最後に乗っていた数',
    en: 'Remaining',
  },
  'result-height-desc': {
    ja: '積み上げた高さ',
    en: 'Height',
  },
  'result-return': {
    ja: '戻る',
    en: 'Return',
  },
  'result-again': {
    ja: 'もう一度！',
    en: 'Again!',
  },
  /** ゲーム */
  drop: {
    ja: '落下',
    en: 'DROP',
  },
  'your-turn': {
    ja: 'あなたのターン！',
    en: 'Your Turn!',
  },
  'game-start': {
    ja: 'ゲーム開始！',
    en: 'Game Start!',
  },
  'game-start-over': {
    ja: 'やりなおす',
    en: 'Start Over',
  },
  'game-start-again': {
    ja: 'リスタート',
    en: 'Start Again',
  },
  'game-exit': {
    ja: 'タイトルへ',
    en: 'Exit',
  },
  'game-start-over-desc': {
    ja: '同じシャケ順で<br>やりなおします',
    en: 'Start over<br>with same order',
  },
  'game-start-again-desc': {
    ja: 'シャケ順を変えて<br>リスタートします',
    en: 'Start again<br>with different order',
  },
  'game-exit-desc': {
    ja: 'ゲームをやめて<br>タイトル画面に戻ります',
    en: 'Quit playing game <br>and Return to title',
  },
  'game-online-forced-drop-desc': {
    ja: '誰のターンであっても<br>強制的に落下させます<br>(ホストのみ)',
    en: 'No matter who\'s turn<br>Drop forcibly<br>(Host only)',
  },
  'game-online-exit-desc': {
    ja: 'ゲームをやめて<br>ルーム画面に戻ります',
    en: 'Quit playing game <br>and Return to room',
  },
  'game-online-forced-drop': {
    ja: '強制落下',
    en: 'Drop forcibly',
  },
  'game-online-exit': {
    ja: 'ルームへ',
    en: 'Exit',
  },
  chum: {
    ja: 'シャケ',
    en: 'Chum',
  },
  cohock: {
    ja: 'ドスコイ',
    en: 'Cohock',
  },
  smallfry: {
    ja: 'コジャケ',
    en: 'Smallfry',
  },
  maws: {
    ja: 'モグラ',
    en: 'Maws',
  },
  scrapper: {
    ja: 'テッパン',
    en: 'Scrapper',
  },
  steeleel: {
    ja: 'ヘビ',
    en: 'Steeleel',
  },
  steelhead: {
    ja: 'バクダン',
    en: 'Steelhead',
  },
  drizzler: {
    ja: 'コウモリ',
    en: 'Drizzler',
  },
  flyfish: {
    ja: 'カタパッド',
    en: 'Flyfish',
  },
  stinger: {
    ja: 'タワー',
    en: 'Stinger',
  },
};
export default LANGUAGES;
