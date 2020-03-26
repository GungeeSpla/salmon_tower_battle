export const SCENE_WAIT_ONLINE_GAME = {
  /** label */
  label: 'wait-online-game',

  /** enter(options)
   * @param {Object} options
   * @param {boolean} options.isHost - ホストかどうか。
   * @param {string} options.roomId - ルームID。
   */
  async enter(options) {
    // ローディング画面ここから
    this.app.view.showLoading();
    this.roomId = options.roomId;
    const baseURL = window.location.href.split('?')[0];
    const shareURL = `${baseURL}?invite=${options.roomId}`;
    const hostStr = (options.isHost) ? 'host' : 'gest';
    // ルームデータを取ってくる
    const roomData = await this.app.network.getRoom('private', options.roomId);
    let error;
    if (roomData) {
      // ルームデータが持ってこれればjoinRoomを呼んでみる
      error = await this.app.network.joinRoom('private', options.roomId);
    } else {
      // ルームデータが持ってこれなければ非存在エラー
      error = 'room-doesnt-exist';
    }
    // エラーが存在すれば
    if (error) {
      // ローディング画面ここまで
      this.app.view.hideLoading();
      // アラートを表示して帰る
      this.app.view.alert({
        title: 'heads-up',
        message: error,
        ok: () => {
          this.app.view.jump('title');
        },
        onlyok: true,
      });
      return;
    }
    // ホストだったらreadyRoomを呼ぶ(ルームステートを'waiting'に変更する)
    if (options.isHost) {
      await this.app.network.readyRoom('private', options.roomId);
    }
    // ローディング画面ここまで
    this.app.view.hideLoading();
    //
    // 招待URLを見る(ホストのみ)
    //
    if (options.isHost) {
      this.append({
        text: '招待URLを見る',
        class: 'show-url-button',
        onclick: () => {
          document.querySelector('.invite-url-outer').style.setProperty('display', 'block');
        },
      });
    }
    //
    // ルームメンバーのアウター
    //
    this.append({
      id: 'room-member-outer',
      class: `room-member-outer room-member-outer-${hostStr}`,
    });
    //
    // ゲーム開始ボタン / ゲーム開始を待っています…
    //
    let isConnecting = false;
    if (options.isHost) {
      this.append({
        id: 'game-start-button',
        class: 'game-start-button',
        text: 'start',
        style: { display: 'block' },
        onclick: async () => {
          /*
          this.app.view.jump('replay', {
            userData: this.app.network.getOwnUserData(),
            room: room,
            roomId: options.roomId,
            isHost: true,
            isStartingGame: true,
          });
          return;
          */
          if (isConnecting) {
            return;
          }
          isConnecting = true;
          // const room = await this.app.network.getRoom('private', options.roomId);
          const startRoomData = await this.app.network.getRoom('private', options.roomId);
          const uids = Object.keys(startRoomData.members);
          let areAllMembersWaiting = true;
          for (let i = 0; i < uids.length; i += 1) {
            const member = startRoomData.members[uids[i]];
            if (member.state !== 'waiting') {
              areAllMembersWaiting = false;
              break;
            }
          }
          if (areAllMembersWaiting) {
            this.app.network.beginGame('private', options.roomId);
          } else {
            this.app.view.alert({
              title: 'heads-up',
              message: 'not-all-waiting',
            });
          }
          isConnecting = false;
        },
      });
    } else {
      this.append({
        class: 'waiting-start',
        text: 'waiting-game-start',
      });
    }
    //
    // タイトル画面に戻る
    //
    this.append({
      class: 'return-title-lb',
      text: 'exit',
      jump: 'title',
    });
    //
    // 招待URL
    //
    if (options.isHost) {
      let copiedTimer = null;
      this.append({
        style: { display: 'none' },
        class: 'invite-url-outer',
        contents: [{
          class: 'invite-url-desc',
          text: 'please-share-url',
        }, {
          id: 'invite-url',
          class: 'invite-url',
          innerHTML: shareURL,
        }, {
          class: 'invite-url-copy',
          text: 'copy',
          onclick: () => {
            const target = document.getElementById('invite-url-copied');
            const ret = this.utilities.execCopy(shareURL, 'invite-url');
            if (ret) {
              clearTimeout(copiedTimer);
              target.classList.remove('animation');
              copiedTimer = setTimeout(() => {
                target.classList.add('animation');
              }, 17);
            }
          },
        }, {
          id: 'invite-url-copied',
          class: 'invite-url-copied',
          text: 'copied',
        }, {
          class: 'invite-url-close',
          text: 'close',
          onclick: () => {
            window.getSelection().removeAllRanges();
            document.getElementById('invite-url-copied').classList.remove('animation');
            document.querySelector('.invite-url-outer').style.setProperty('display', 'none');
          },
        }],
      });
    }
    //
    // 待機画面のFirebaseイベントを準備する
    //
    this.app.network.setupWaiting('private', options.roomId, {
      // メンバーが追加されたとき
      onaddmember: (member, key) => {
        if (options.isHost) {
          document.getElementById('game-start-button').style.setProperty('display', 'block');
        }
        this.append({
          id: key,
          attr: { state: member.state },
          layer: 'room-member-outer',
          class: 'room-member',
          contents: [{
            class: 'room-member-back',
          }, {
            tag: 'img',
            class: 'room-member-photo',
            src: member.photoURL,
          }, {
            class: 'room-member-name',
            innerHTML: member.displayName,
          }, {
            class: 'room-member-state',
            text: member.state,
          }],
          onclick: () => {
            if (options.isHost && key !== this.app.network.getOwnUid()) {
              const name = (member.displayName.length > 10)
                ? `${member.displayName.substr(0, 10)}…`
                : member.displayName;
              this.app.view.alert({
                title: 'heads-up',
                message: 'deport-room-member',
                vars: { name },
                ok: () => {
                  this.app.network.remove(`private-rooms/${options.roomId}/members/${key}`);
                },
              });
            }
          },
        });
      },
      // メンバーが削除されたとき
      onremovemember: (member, key) => {
        const elm = document.getElementById(key);
        if (elm) {
          elm.parentNode.removeChild(elm);
        }
        // 削除されたメンバー、というのが自分のことだったなら
        if (key === this.app.network.getOwnUid()) {
          // ｢部屋が崩れました｣というアラートを出してタイトルに戻る
          this.app.view.alert({
            title: 'heads-up',
            message: 'room-was-destroyed',
            ok: () => {
              this.app.view.jump('title');
            },
            onlyok: true,
          });
        }
      },
      // ルームステートが変更されたとき
      onchangeroomstate: async (state) => {
        if (state.indexOf('playing') > -1) {
          const playingRoomData = await this.app.network.getRoom('private', options.roomId);
          this.app.view.jump('online-game', {
            userData: this.app.network.getOwnUserData(),
            room: playingRoomData,
            roomId: options.roomId,
            isHost: options.isHost,
            isStartingGame: true,
          });
        }
      },
      // メンバーステートが変更されたとき
      onchangememberstate: (member, key) => {
        const elm = document.getElementById(key);
        if (elm) {
          elm.setAttribute('state', member.state);
          elm.querySelector('.room-member-state').textContent = this.app.view.getTranslatedText(member.state);
        }
      },
    });
    // ウィンドウを閉じる前
    // window.onbeforeunload = () => {
    //   return 'いまウィンドウを閉じると、あなたは部屋から抜けることになります。よろしいですか？';
    // };
    // ウィンドウを閉じたとき
    window.onunload = () => {
      this.app.network.leaveRoom('private', options.roomId);
    };
  },

  /** leave(options) */
  leave(options) {
    window.onbeforeunload = null;
    window.onunload = null;
    this.app.network.teardownWaiting('private', this.roomId);
    if (!options.isStartingGame) {
      this.app.network.leaveRoom('private', this.roomId);
    }
  },
};
