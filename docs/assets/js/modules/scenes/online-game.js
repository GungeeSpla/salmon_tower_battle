export const SCENE_ONLINE_GAME = {
  /** label */
  label: 'online-game',

  /** enter(options)
   * @param {Object} options
   * @param {UserData} options.userData - ユーザーデータ。
   * @param {Room} options.room - ルームデータ。
   * @param {string} options.roomId - ルームID。
   * @param {boolean} options.isHost - ホストかどうか。
   */
  enter(options) {
    this.roomId = options.roomId;
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
    this.append({
      id: 'ones-turn-outer',
      class: 'ope-button-outer',
      style: { display: 'none' },
      contents: [{
        class: 'turn-title selectable',
        text: 'ones-turn',
      }],
    });
    //
    // メニュー
    //
    if (options.isHost) {
      this.append({
        class: 'game-menu-rt',
        onclick: () => {
          document.getElementById('game-menu-rt').style.setProperty('display', 'block');
        },
      });
      this.append({
        id: 'game-menu-rt',
        class: 'game-menu-outer',
        style: { display: 'none' },
        contents: [{
          class: 'game-menu-button-outer',
          contents: [{
            class: 'gemu-menu-button-desc left',
            text: 'game-online-forced-drop-desc',
          }, {
            class: 'alert-button',
            text: 'game-online-forced-drop',
            onclick: () => {
              this.app.game.execOperationDownForcibly();
              document.getElementById('game-menu-rt').style.setProperty('display', 'none');
            },
          }],
        }, {
          class: 'game-menu-button-outer',
          contents: [{
            class: 'alert-button',
            text: 'game-online-exit',
            onclick: () => {
              this.app.network.finishGame('private', options.roomId);
            },
          }, {
            class: 'gemu-menu-button-desc right',
            text: 'game-online-exit-desc',
          }],
        }, {
          class: 'game-menu-close',
          text: 'close',
          onclick: () => {
            document.getElementById('game-menu-rt').style.setProperty('display', 'none');
          },
        }],
      });
    }
    //
    // リザルト
    //
    const resultReturn = (!options.isHost) ? null : {
      class: 'game-result-return',
      text: 'result-return',
      onclick: () => {
        document.getElementById('game-result').style.setProperty('display', 'none');
        this.app.network.finishGame('private', options.roomId);
      },
    };
    const resultAgain = (!options.isHost) ? null : {
      class: 'game-result-again',
      text: 'result-again',
      onclick: () => {
        document.getElementById('game-result').style.setProperty('display', 'none');
        this.app.network.againGame('private', options.roomId);
      },
    };
    this.append({
      id: 'game-result',
      class: 'game-menu-outer',
      style: {
        display: 'none',
        'padding-left': `${this.app.view.canvasDetail.padding.x}px`,
        'padding-top': `${this.app.view.canvasDetail.padding.y}px`,
      },
      contents: [{
        class: 'game-result-container',
        contents: [{
          class: 'result-detail',
          contents: [{
            class: 'result-fall-count-desc',
            text: 'result-fall-count-desc',
          }, {
            class: 'result-fall-count',
          }, {
            class: 'result-ride-count-desc',
            text: 'result-ride-count-desc',
          }, {
            class: 'result-ride-count',
          }, {
            class: 'result-height-desc',
            text: 'result-height-desc',
          }, {
            class: 'result-height',
          }],
        }, {
          class: 'result-win-text',
          innerHTML: 'WIN!',
        }, {
          tag: 'img',
          class: 'result-screen',
          src: 'data:image/gif;base64,R0lGODlhAQABAGAAACH5BAEKAP8ALAAAAAABAAEAAAgEAP8FBAA7',
        }, {
          class: 'result-winner',
          contents: [{
            tag: 'img',
            src: 'data:image/gif;base64,R0lGODlhAQABAGAAACH5BAEKAP8ALAAAAAABAAEAAAgEAP8FBAA7',
          }, {
            tag: 'br',
          }, {
            tag: 'span',
          }],
        }, {
          id: 'result-players',
          class: 'result-players',
        }, resultReturn, resultAgain],
      }],
    });
    this.app.game.setTimeLimit();
    this.app.game.setIsOnline(true);
    this.app.game.setIsEndless(false);
    this.app.game.beginGame(options.room);
    const returnTitle = () => {
      this.app.view.alert({
        title: 'heads-up',
        message: 'room-was-destroyed',
        ok: () => {
          this.app.view.jump('title');
        },
        onlyok: true,
      });
    };
    this.app.network.setupGaming('private', options.roomId, {
      // メンバーが削除されたとき
      onremovemember: (member, key) => {
        // 削除されたメンバー、というのが自分のことだったならタイトルに戻る
        if (key === this.app.network.getOwnUid()) {
          returnTitle();
          return;
        }
        // あるいはホストが削除された場合も
        if (key === options.room.ownerUser.uid) {
          returnTitle();
        }
      },
      // ルームステートが変更されたとき
      onchangeroomstate: async (state) => {
        if (state === 'waiting') {
          this.app.view.jump('wait-online-game', {
            roomId: options.roomId,
            isHost: options.isHost,
            isWaitingGame: true,
          });
        } else if (state.indexOf('playing') > -1) {
          document.getElementById('game-result').style.setProperty('display', 'none');
          const playingRoomData = await this.app.network.getRoom('private', options.roomId);
          this.app.game.beginGame(playingRoomData);
        }
      },
    });
    this.utilities.addDocumentEventListener('gamefinish', (e) => {
      const results = document.getElementById('game-result');
      const counter = this.app.view.getTranslatedText('salmonid-counter');
      results.querySelector('.result-fall-count').textContent = `${e.detail.stepCount} ${counter}`;
      results.querySelector('.result-ride-count').textContent = `${e.detail.panelCount} ${counter}`;
      results.querySelector('.result-height').textContent = `${e.detail.towerHeight} m`;
      results.querySelector('.result-screen').src = e.detail.stageCache;
      this.utilities.emptyElement('.result-players');
      const players = [];
      const states = e.detail.playerStates;
      states.forEach((state) => {
        const rank = states.length - state.deathOrder - 1;
        players[rank] = state;
      });
      results.querySelector('.result-winner>img').src = players[0].photoURL;
      results.querySelector('.result-winner>span').textContent = players[0].displayName;
      for (let i = 1; i < players.length; i += 1) {
        this.append({
          layer: 'result-players',
          tag: 'img',
          src: players[i].photoURL,
        });
      }
      results.style.setProperty('display', 'block');
    });
    // ウィンドウを閉じる前
    window.onbeforeunload = () => {
      if (options.isHost) {
        return 'いまウィンドウを閉じると、部屋が崩れることになります。よろしいですか？';
      }
      return undefined;
    };
    // ウィンドウを閉じたとき
    window.onunload = () => {
      // if (options.isHost) {
      //   this.app.network.destroyRoom('private', options.roomId);
      // } else {
      //   this.app.network.leaveRoom('private', options.roomId);
      // }
      this.app.network.leaveRoom('private', options.roomId);
    };
  },

  /** leave(options) */
  leave(options) {
    window.onbeforeunload = null;
    window.onunload = null;
    this.utilities.removeDocumentEventListener('gamefinish');
    this.app.network.teardownGaming('private', this.roomId);
    this.app.game.finishGame();
    if (!options.isWaitingGame) {
      this.app.network.leaveRoom('private', this.roomId);
    }
  },
};
