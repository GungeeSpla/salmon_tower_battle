import MONSTERS_DATA from '../constants/monsters.js';
import * as constants from '../constants/config.js';
import * as utilities from '../utilities.js';

export const LOADING = {
  /** label */
  label: 'loading',

  /** enter() */
  async enter() {
    let loadedNum = 0;
    const targetUrls = [
      './assets/img/forcss/volume-0.png',
      './assets/img/forcss/volume-1.png',
      './assets/img/forcss/volume-2.png',
      './assets/img/forcss/volume-3.png',
      './assets/img/forcss/mask-hooked.png',
      './assets/img/forcss/mask-holed.png',
      './assets/img/forcss/mask-chipped.svg',
      './assets/img/forcss/wave-1.png',
    ];
    const targetNum = targetUrls.length + MONSTERS_DATA.length * 2;
    function count() {
      loadedNum += 1;
      const p = Math.floor(100 * loadedNum / targetNum);
      // console.log(`${p}% loaded`);
    }
    this.app.view.showLoading();
    for (let i = 0; i < targetUrls.length; i += 1) {
      await utilities.getImage(targetUrls[i]);
      count();
    }
    for (let i = 0; i < MONSTERS_DATA.length; i += 1) {
      await utilities.getImage(`./assets/img/monsters/${MONSTERS_DATA[i].name}.png`);
      count();
      await utilities.getSvgPathData(`./assets/img/monsters/${MONSTERS_DATA[i].name}.svg`);
      count();
    }
    setTimeout(() => {
      this.app.view.hideLoading();
      this.app.view.firstJump();
    }, 100);
  },

  /** leave() */
  leave() {
  },
};
