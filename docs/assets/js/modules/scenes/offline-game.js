export const SCENE_OFFLINE_GAME = {
  /** label */
  label: 'offline-game',

  /** enter() */
  enter() {
    //
    // パネル数と高さ
    //
    this.append({
      class: 'game-random-seed',
      contents: [{
        tag: 'span',
        text: 'offline-seed',
      }, {
        tag: 'span',
        class: 'count',
      }],
    });
    this.append({
      class: 'game-panel-count',
      contents: [{
        tag: 'span',
        text: 'offline-salmonids',
      }, {
        tag: 'span',
        class: 'count',
      }],
    });
    this.append({
      class: 'game-tower-height',
      contents: [{
        tag: 'span',
        text: 'offline-height',
      }, {
        tag: 'span',
        class: 'count',
      }],
    });
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
    //
    // メニューボタン
    //
    this.append({
      class: 'game-menu-rt',
      onclick: () => {
        document.querySelector('.game-menu-outer').style.setProperty('display', 'block');
      },
    });
    //
    // メニュー
    //
    this.append({
      class: 'game-menu-outer',
      style: { display: 'none' },
      contents: [{
        class: 'game-menu-button-outer',
        contents: [{
          class: 'alert-button',
          text: 'game-start-over',
          onclick: () => {
            this.app.game.startOver();
            document.querySelector('.game-menu-outer').style.setProperty('display', 'none');
          },
        }, {
          class: 'gemu-menu-button-desc right',
          text: 'game-start-over-desc',
        }],
      }, {
        class: 'game-menu-button-outer',
        contents: [{
          class: 'gemu-menu-button-desc left',
          text: 'game-start-again-desc',
        }, {
          class: 'alert-button',
          text: 'game-start-again',
          onclick: () => {
            this.app.game.startAgain();
            document.querySelector('.game-menu-outer').style.setProperty('display', 'none');
          },
        }],
      }, {
        class: 'game-menu-button-outer',
        contents: [{
          class: 'alert-button',
          text: 'game-exit',
          jump: 'title',
        }, {
          class: 'gemu-menu-button-desc right',
          text: 'game-exit-desc',
        }],
      }, {
        class: 'game-menu-close',
        text: 'close',
        onclick: () => {
          document.querySelector('.game-menu-outer').style.setProperty('display', 'none');
        },
      }],
    });
    this.utilities.addDocumentEventListener('gamebegin', (e) => {
      document.querySelector('.game-random-seed .count').textContent = `${e.detail.seed}`;
    });
    this.utilities.addDocumentEventListener('gamestep', (e) => {
      const counter = this.app.view.getTranslatedText('salmonid-counter');
      document.querySelector('.game-tower-height .count').textContent = `${e.detail.towerHeight} m`;
      document.querySelector('.game-panel-count .count').textContent = `${e.detail.panelCount} ${counter}`;
    });
    this.app.game.setIsOnline(false);
    this.app.game.setIsEndless(true);
    this.app.game.setTimeLimit(0);
    this.app.game.setPlayerStates([
      { uid: '1P', displayName: '1P' },
    ]);
    this.app.game.setUnixSeed();
    this.app.game.setTodaySeed();
    this.app.game.beginGame();
    // this.utilities.addDocumentEventListener('canvasresize.bottom-buttons', this.oncanvasresize);
  },

  /** oncanvasresize(e)
   * @param {Event} e - イベントオブジェクト。
   * @param {Object} e.detail - キャンバスサイズの情報が入っています。
   */
  oncanvasresize(e) {
    const elm = document.getElementById('createjs-bottom-buttons');
    if (elm) {
      elm.style.setProperty('left', `${e.detail.padding.x}px`);
      elm.style.setProperty('bottom', `${e.detail.padding.y}px`);
      elm.style.setProperty('width', `${e.detail.width}px`);
    }
  },

  /** leave() */
  leave() {
    this.utilities.removeDocumentEventListener('gamebegin');
    this.utilities.removeDocumentEventListener('gamestep');
    this.app.game.finishGame();
    // this.utilities.removeDocumentEventListener('canvasresize.bottom-buttons');
  },
};
