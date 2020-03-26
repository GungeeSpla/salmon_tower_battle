export const SCENE_INVITE = {
  /** label */
  label: 'invite',

  /** bgm */
  bgm: 'gogo.mp3',

  /** enter() */
  async enter() {
    this.app.view.showLoading();
    // サインインデータを取得する
    const userData = this.app.network.getOwnUserData();
    // まだサインイン状態に変化が見られないならば
    // (サインインしているかどうかも判定できない状態ならば)
    if (userData === undefined) {
      // authstatechangeイベントにenter()をセットして帰る
      this.utilities.addDocumentEventListener('authstatechange', () => {
        this.utilities.removeDocumentEventListener('authstatechange');
        this.enter();
      });
      return;
    }
    // この行に到達したということは、サインインしているかどうかが確定したようだ！
    this.app.view.hideLoading();
    // サインイン状態で分岐
    if (userData === null) {
      // サインインしていない場合
      this.enterNotSignedIn();
    } else {
      // サインインしている場合
      // 招待されているルームID
      const roomId = this.utilities.getQueries().invite;
      // Firebaseからルームデータを持ってくる
      const room = await this.app.network.getRoom('private', roomId);
      // ルームデータが取得できたかどうか
      if (!room) {
        // 取得できなかった場合
        this.enterInvalidInvatation();
      } else {
        // 取得できた場合
        this.enterInvatation(room, roomId);
      }
    }
    // 音量調節
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
    }
    // タイトルに戻る
    this.append({
      class: 'return-title-lb',
      text: 'exit',
      jump: 'title',
    });
  },

  /** enterNotSignedIn()
   * ｢サインインが済んでいないので招待コードを受け取れない｣ときの
   * 画面を作成します。
   */
  enterNotSignedIn() {
    this.append({
      id: 'invite-card-not-signed',
      class: 'invite-card',
      contents: [{
        class: 'invite-card-back',
      }, {
        text: 'invitation-not-signed-in',
        class: 'invite-message',
      }, {
        text: 'sign-in-with-twitter',
        class: 'invite-sign-in-button',
        onclick: () => {
          this.app.network.signIn();
        },
      }],
    });
  },

  /** enterInvalidInvatation()
   * ｢サインインは済んでいるが、招待コードに書いてある部屋がFirebaseに存在しなかった｣ときの
   * 画面を作成します。
   */
  enterInvalidInvatation() {
    this.append({
      id: 'invite-card-not-signed',
      class: 'invite-card',
      contents: [{
        class: 'invite-card-back',
      }, {
        text: 'invitation-invalid',
        class: 'invite-message',
      }],
    });
  },

  /** enterInvatation(room)
   * ｢サインインが済んでおり、招待コードに書いてある部屋のデータをFirebaseから持ってこれた｣ときの
   * 画面を作成します。
   * @param {Object} room - Firebaseから持ってきたルームデータ
   * @param {string} roomId - ルームID
   */
  enterInvatation(room, roomId) {
    this.append({
      id: 'invite-card',
      class: 'invite-card',
      contents: [{
        class: 'invite-card-back',
      }, {
        tag: 'img',
        src: room.ownerUser.photoURL,
        class: 'invite-photo',
      }, {
        text: 'invitation',
        innerSpanText: room.ownerUser.displayName,
        class: 'invite-message',
      }, {
        text: 'join',
        class: 'invite-join-button',
        onclick: async () => {
          this.app.view.jump('wait-online-game', { roomId, isHost: false });
        },
      }],
    });
  },

  /** leave() */
  leave() {
  },
};
