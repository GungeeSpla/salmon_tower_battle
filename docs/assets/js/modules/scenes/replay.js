export const REPLAY = {
  /** label */
  label: 'replay',

  /** enter(options)
   * @param {Object} options
   * @param {UserData} options.userData - ユーザーデータ。
   * @param {Room} options.room - ルームデータ。
   * @param {string} options.roomId - ルームID。
   * @param {boolean} options.isHost - ホストかどうか。
   */
  enter(options) {
    //
    // 残り時間
    //
    this.append({
      id: 'left-time',
      class: 'left-time',
    });
    //
    // 手数とパネル名
    //
    this.append({
      id: 'step-info',
      class: 'step-info',
    });
    //
    // 操作ボタン
    //
    this.append({
      id: 'ope-button-outer',
      class: 'ope-button-outer',
      contents: [{
        text: 'drop',
        class: 'drop-button',
        onclick: () => { this.app.game.execOperationDown(); },
      }, {
        class: 'rotate-button',
        onclick: () => { this.app.game.execOperationRotate(); },
        contents: [{
          tag: 'img',
          src: './assets/img/forcss/rotate.svg',
        }],
      }],
    });
    this.app.game.replayGame(options.room);
  },

  /** leave(options) */
  leave() {
  },
};
