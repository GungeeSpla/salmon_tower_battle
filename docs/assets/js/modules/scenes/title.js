export const SCENE_TITLE = {
  /** label */
  label: 'title',

  /** bgm */
  bgm: 'gogo.mp3',

  /** enter() */
  enter() {
    //
    // サインイン状態
    //
    this.append({
      id: 'sign-state-container',
      class: 'sign-state-container',
      contents: [{
        // 接続中
        id: 'connecting',
        class: 'sign-state',
        style: { display: 'none' },
        contents: [{
          text: 'connecting',
          class: 'sign-state-connecting',
        }],
      }, {
        // サインイン済み
        id: 'signed-in',
        class: 'sign-state',
        style: { display: 'none' },
        contents: [{
          tag: 'img',
          src: 'data:image/gif;base64,R0lGODlhAQABAGAAACH5BAEKAP8ALAAAAAABAAEAAAgEAP8FBAA7',
          class: 'sign-state-photo',
          onclick: () => {
            this.app.view.alert({
              title: 'sign-out',
              message: 'sign-out-heads-up',
              ok: () => {
                this.app.network.signOut();
              },
            });
          },
        }, {
          class: 'sign-state-name',
        }],
      }, {
        // 未サインイン
        id: 'sign-in',
        class: 'sign-state clickable',
        style: { display: 'none' },
        contents: [{
          text: 'sign-in-with-twitter',
          class: 'sign-state-sign-in',
          onclickonce: () => {
            this.app.network.signIn();
          },
        }],
      }],
    });
    //
    // タイトルロゴ
    //
    this.append({
      id: 'title-logo',
      class: 'title-logo',
      contents: [{
        text: 'logo-salmon',
        class: 'title-logo-salmon',
      }, {
        text: 'logo-tower-battle',
        class: 'title-logo-tower-battle',
      }],
    });
    //
    // オフライン
    //
    this.append({
      id: 'play-in-offline',
      class: 'title-button clickable',
      jump: 'offline-game',
      contents: [{
        class: 'title-button-back',
      }, {
        text: 'play-in-offline',
        class: 'title-button-content shadow-text',
      }, {
        text: 'play-in-offline-footer',
        class: 'title-button-footer shadow-text',
      }],
    });
    //
    // プライベートルーム
    //
    this.append({
      id: 'create-private-room',
      class: 'title-button clickable',
      // style: { opacity: '0.3' },
      // jump: 'online-game',
      onclick: () => {
        /*
        this.app.view.jump('wait-online-game', {
          isHost: true,
        });
        return;
        this.app.view.jump('online-game');
        return;
        */
        // サインイン済みかどうかでクリック時の処理を切り替える
        if (this.app.network.getSignState() === 'signed-in') {
          // サインイン済みの場合にかぎりprivate-roomに飛ぶ
          this.app.view.jump('private-room');
        } else {
          // サインイン済みでなければ警告を出す
          this.app.view.alert({
            title: 'heads-up',
            message: 'private-room-not-signed-in',
          });
        }
      },
      contents: [{
        class: 'title-button-back',
      }, {
        text: 'private-room',
        class: 'title-button-content shadow-text',
      }, {
        text: 'create-private-room-footer',
        class: 'title-button-footer shadow-text',
      }],
    });
    //
    // オプション
    //
    this.append({
      id: 'settings',
      class: 'title-button clickable',
      jump: 'settings',
      contents: [{
        class: 'title-button-back',
      }, {
        text: 'settings',
        class: 'title-button-content shadow-text',
      }, {
        text: 'settings-footer',
        class: 'title-button-footer shadow-text',
      }],
    });
    //
    // バージョン
    //
    this.append({
      text: `Ver.${this.constants.APP_VERSION}`,
      class: 'title-version',
    });
    //
    // 音量調節
    //
    if (!document.getElementById('speaker')) {
      const { app } = this;
      const { globalVolume } = app.storage.get('settings');
      this.append({
        layer: 'fix',
        id: 'speaker',
        class: `speaker volume-${globalVolume}`,
        attr: { volume: globalVolume },
        onclick() {
          const volume = parseInt(this.getAttribute('volume'), 10);
          const nextVolume = (volume + 4 + 1) % 4;
          this.setAttribute('volume', nextVolume);
          this.classList.remove(`volume-${volume}`);
          this.classList.add(`volume-${nextVolume}`);
          app.sound.changeVolume(nextVolume);
        },
      });
      //
      // タイトルバー
      //
      document.title = this.app.view.getTranslatedText('title');
    }
    // サインステートを取得する
    const signState = this.app.network.getSignState();
    if (signState === 'connecting') {
      // サインイン済みかどうか判別できない(起動直後)ならば
      // authstatechangeイベントが発火したときに《サインイン状態アップデート》を仕込む
      this.utilities.addDocumentEventListener('authstatechange', (e) => {
        document.getElementById('connecting').style.setProperty('display', 'none');
        this.updateSignState(e.detail);
      });
      document.getElementById('connecting').style.setProperty('display', 'block');
    } else {
      // サインイン済みかどうか判別できたならば
      // 《サインイン状態アップデート》を呼び出す
      const userData = this.app.network.getOwnUserData();
      this.updateSignState(userData);
    }
  },

  /** updateSignState(userData) */
  updateSignState(userData) {
    if (userData) {
      // document.getElementById('create-private-room').style.setProperty('opacity', '1');
      document.getElementById('signed-in').style.setProperty('display', 'block');
      document.querySelector('.sign-state-photo').setAttribute('src', userData.photoURL);
      document.querySelector('.sign-state-name').textContent = userData.displayName;
      
    } else {
      document.getElementById('sign-in').style.setProperty('display', 'block');
    }
  },

  /** leave() */
  leave() {
    this.utilities.removeDocumentEventListener('authstatechange');
  },
};
