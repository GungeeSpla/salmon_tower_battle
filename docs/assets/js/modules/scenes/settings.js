export const SCENE_SETTINGS = {
  /** label */
  label: 'settings',

  /** enter() */
  enter() {
    function select(elm) {
      const siblings = elm.parentNode.childNodes;
      Array.prototype.forEach.call(siblings, (sibling) => {
        sibling.classList.remove('selected');
      });
      elm.classList.add('selected');
    }
    const { app } = this;
    //
    // WebGL
    //
    this.append({
      text: 'webgl-desc',
      class: 'config-desc',
    });
    this.append({
      class: 'config-line',
      contents: [{
        text: 'WebGL',
        class: 'config-line-content',
      }, {
        class: 'config-line-item-container',
        contents: [{
          id: 'webgl-off',
          text: 'OFF',
          class: 'config-line-item config-webgl',
          onclick() {
            select(this);
            app.storage.get('settings').isEnabledStageGL = false;
            app.storage.save('settings');
          },
        }, {
          id: 'webgl-on',
          text: 'ON',
          class: 'config-line-item config-webgl',
          onclick() {
            select(this);
            app.storage.get('settings').isEnabledStageGL = true;
            app.storage.save('settings');
          },
        }],
      }],
    });
    //
    // 言語
    //
    this.append({
      text: 'lang-desc',
      class: 'config-desc',
    });
    this.append({
      class: 'config-line',
      contents: [{
        text: 'language',
        class: 'config-line-content',
      }, {
        class: 'config-line-item-container',
        contents: [{
          id: 'lang-ja',
          text: '日本語',
          class: 'config-line-item config-lang',
          onclick() {
            select(this);
            app.storage.get('settings').language = 'ja';
            app.storage.save('settings');
            app.view.jump('settings');
          },
        }, {
          id: 'lang-en',
          text: 'English',
          class: 'config-line-item config-lang',
          onclick() {
            select(this);
            app.storage.get('settings').language = 'en';
            app.storage.save('settings');
            app.view.jump('settings');
          },
        }],
      }],
    });
    // selectedクラスを付与
    const selectedIds = [];
    selectedIds.push((this.app.storage.get('settings').isEnabledStageGL)
      ? 'webgl-on' : 'webgl-off');
    selectedIds.push((this.app.storage.get('settings').language === 'ja')
      ? 'lang-ja' : 'lang-en');
    selectedIds.forEach((id) => {
      document.getElementById(id).classList.add('selected');
    });
    //
    // タイトルに戻る
    //
    this.append({
      text: '戻る',
      class: 'return-title-lb',
      jump: 'title',
    });
  },

  /** leave() */
  leave() {
  },
};
