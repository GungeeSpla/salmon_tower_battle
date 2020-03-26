export const SCENE_PRIVATE_ROOM = {
  /** label */
  label: 'private-room',

  /** createRoom() */
  async createRoom() {
    this.app.view.clearLayer('main');
    this.app.view.showLoading();
    const roomId = await this.app.network.createRoom('private');
    this.app.view.jump('wait-online-game', { roomId, isHost: true });
    this.app.view.hideLoading();
  },

  /** enter() */
  async enter() {
    this.app.view.showLoading();
    const userData = await this.app.network.getOwnUserDataNewly();
    const ownRoomId = userData.ownPrivateRoom;
    const invitedRoomId = this.utilities.getQueries().invite;
    this.app.view.hideLoading();
    //
    // プライベートルームを作る
    //
    if (!ownRoomId) {
      this.append({
        class: 'spiky-button',
        text: 'create-private-room',
        onclick: () => {
          if (ownRoomId) {
            this.app.view.alert({
              title: 'heads-up',
              message: 'create-private-room-caution',
              ok: () => {
                this.createRoom();
              },
            });
          } else {
            this.createRoom();
          }
        },
      });
    }
    //
    // 自分の部屋に行く
    //
    if (ownRoomId) {
      this.append({
        class: 'spiky-button',
        text: 'go-to-own-private-room',
        onclick: () => {
          this.app.view.jump('wait-online-game', {
            roomId: ownRoomId,
            isHost: true,
          });
        },
      });
      this.append({
        class: 'spiky-button danger',
        text: 'destroy-own-private-room',
        onclick: () => {
          this.app.view.alert({
            title: 'heads-up',
            message: 'destroy-private-room-caution',
            ok: async () => {
              this.app.view.clearLayer('main');
              this.app.view.showLoading();
              await this.app.network.destroyRoom('private', ownRoomId);
              this.app.view.hideLoading();
              this.app.view.jump('private-room');
            },
          });
        },
      });
    }
    //
    // 招待されている部屋に行く
    //
    if (invitedRoomId) {
      this.append({
        class: 'spiky-button',
        text: 'go-to-invited-private-room',
        onclick: () => {
          this.app.view.jump('wait-online-game', {
            roomId: invitedRoomId,
            isHost: false,
          });
        },
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
  },

  /** leave() */
  leave() {
  },
};
