import { FRAME_RATE } from '../constants/config.js';
import { setB2BodyXYAngle } from '../utilities.js';

/** 各種イージング関数 (参考：http://gizma.com/easing/)
 * t: current time, b: start value, c: change in value, d: duration
 */
const EASING = {
  linearTween(t, b, c, d) {
    return c * t / d + b;
  },
  easeInQuad(t, b, c, d) {
    t /= d;
    return c * t * t + b;
  },
  easeOutQuad(t, b, c, d) {
    t /= d;
    return -c * t * (t - 2) + b;
  },
  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t -= 1;
    return -c / 2 * (t * (t - 2) - 1) + b;
  },
  easeInCubic(t, b, c, d) {
    t /= d;
    return c * t * t * t + b;
  },
  easeOutCubic(t, b, c, d) {
    t /= d;
    t -= 1;
    return c * (t * t * t + 1) + b;
  },
  easeInOutCubic(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  },
  easeInQuart(t, b, c, d) {
    t /= d;
    return c * t * t * t * t + b;
  },
  easeOutQuart(t, b, c, d) {
    t /= d;
    t -= 1;
    return -c * (t * t * t * t - 1) + b;
  },
  easeInOutQuart(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t * t + b;
    t -= 2;
    return -c / 2 * (t * t * t * t - 2) + b;
  },
  easeInQuint(t, b, c, d) {
    t /= d;
    return c * t * t * t * t * t + b;
  },
  easeOutQuint(t, b, c, d) {
    t /= d;
    t -= 1;
    return c * (t * t * t * t * t + 1) + b;
  },
  easeInOutQuint(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t * t * t + 2) + b;
  },
  easeInSine(t, b, c, d) {
    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
  },
  easeOutSine(t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  },
  easeInOutSine(t, b, c, d) {
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  },
  easeInExpo(t, b, c, d) {
    return c * Math.pow(2, 10 * (t / d - 1)) + b;
  },
  easeOutExpo(t, b, c, d) {
    return c * (-Math.pow(2, -10 * t / d) + 1) + b;
  },
  easeInOutExpo(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    t -= 1;
    return c / 2 * (-Math.pow(2, -10 * t) + 2) + b;
  },
  easeInCirc(t, b, c, d) {
    t /= d;
    return -c * (Math.sqrt(1 - t * t) - 1) + b;
  },
  easeOutCirc(t, b, c, d) {
    t /= d;
    t -= 1;
    return c * Math.sqrt(1 - t * t) + b;
  },
  easeInOutCirc(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    t -= 2;
    return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
  },
};

/** Animatier
 * オブジェクトのプロパティの値を時々刻々と変化させる仕事をするクラスです。
 * たとえば次のように記述することで、obj.xが0から100に時々刻々と変化します。
 * const obj = {x: 0};
 * const objAnimater = new Animater(obj)
 * objAnimater.addAnim({x: 100});
 * setInterval(() => {
 *   objAnimater.tick();
 * }, 1000 / 60);
 */
export default class Animater {
  /** .constructor(parentObject)
   * プロパティを変化させたいオブジェクトを引数に指定します。
   * @param {Object} parentObject - プロパティを変化させるオブジェクト (の参照) 
   */
  constructor(parentObject) {
    this.parentObject = parentObject;
    this.isUpdate = false;
    this.onComplete = null;
    this.queue = [];
    this.handle = {};
  }

  /** .addAnim()
   * @param {Object} props - 変化後のプロパティの値。
   * @param {number} duration - 変化に要する時間 (ms) 。
   * @param {string} easingType - イージングタイプ。
   * @param {Function} callback - 変化後に実行される関数。
   * @param {Object} options - isOverwrite: trueで現在のアニメーションを上書きする。
   */
  addAnim(props, ...args) {
    let time = 1000;
    let type = 'easeOutCubic';
    let callback = null;
    let opt = {};
    let doAnim = false;
    let anim;
    args.forEach((arg) => {
      switch (typeof arg) {
        case 'number':
          time = arg;
          break;
        case 'string':
          type = arg;
          break;
        case 'function':
          callback = arg;
          break;
        case 'object':
          opt = arg;
          break;
        default:
          break;
      }
    });
    const duration = Math.floor((time / 1000) * FRAME_RATE);
    if (this.queue.length === 0 || !opt.isOverwrite) {
      anim = {
        props: {}, frame: 0, duration, type, callback,
      };
      Object.keys(props).forEach((key) => {
        const startValue = this.parentObject[key];
        const endValue = props[key];
        const changeInValue = endValue - startValue;
        if (changeInValue !== 0) {
          doAnim = true;
          anim.props[key] = { startValue, endValue, changeInValue };
        }
      });
      if (this.queue.length === 0 && !doAnim) {
        if (typeof anim.callback === 'function') {
          anim.callback();
        }
      } else {
        this.queue.push(anim);
      }
    } else {
      while (this.queue.length >= 2) {
        this.queue.pop();
      }
      anim = this.queue[0];
      if (typeof anim.callback === 'function') {
        anim.callback();
      }
      anim.frame = 0;
      anim.type = type;
      anim.callback = callback;
      anim.duration = duration;
      Object.keys(props).forEach((key) => {
        const startValue = this.parentObject[key];
        const endValue = props[key];
        const changeInValue = endValue - startValue;
        if (changeInValue !== 0) {
          doAnim = true;
          anim.props[key].startValue = startValue;
          anim.props[key].endValue = endValue;
          anim.props[key].changeInValue = changeInValue;
        }
      });
      if (!doAnim) {
        if (typeof anim.callback === 'function') {
          anim.callback();
        }
        this.queue.pop();
      }
    }
    return this;
  }

  /** .stop()
   */
  stop() {
    while (this.queue.length) {
      this.queue.shift();
    }
    this.onComplete = null;
  }

  /** .call(func)
   */
  call(func) {
    this.onComplete = func;
  }

  /** .getProperty(key)
   * 現在のプロパティの値を取得します。
   * @param {string} key - 取得するプロパティ名
   */
  getProperty(key) {
    return this.parentObject[key];
  }

  /** .getTargetProperty(key)
   * 現在のプロパティの目標値を取得します。
   * @param {string} key - 取得するプロパティ名
   */
  getTargetProperty(key) {
    if (this.queue.length > 0) {
      let i = this.queue.length - 1;
      for (let i = this.queue.length - 1; i >= 0; i -= 1) {
        if (key in this.queue[i].props) {
          return this.queue[i].props[key].endValue;
        }
      }
    }
    return this.parentObject[key];
  }

  /** .tick()
   * アニメーションを進めます。
   */
  tick() {
    if (this.queue.length === 0) {
      this.isUpdate = false;
      return false;
    }
    const anim = this.queue[0];
    anim.frame += 1;
    const changeProperties = {};
    Object.keys(anim.props).forEach((key) => {
      const prop = anim.props[key];
      const newValue = (anim.frame >= anim.duration) ? prop.endValue : EASING[anim.type](
        anim.frame, prop.startValue, prop.changeInValue, anim.duration,
      );
      this.parentObject[key] = newValue;
      changeProperties[key] = newValue;
    });
    if (this.parentObject instanceof b2Body) {
      changeProperties.body = this.parentObject;
      setB2BodyXYAngle(changeProperties);
    }
    if (anim.frame >= anim.duration) {
      if (typeof anim.callback === 'function') {
        anim.callback();
      }
      this.queue.shift();
      if (!(this.queue.length === 0)) {
        let nextAnim;
        let doAnim = false;
        do {
          nextAnim = this.queue[0];
          Object.keys(nextAnim.props).forEach((key) => {
            nextAnim.props[key].startValue = this.parentObject[key];
            nextAnim.props[key].changeInValue = nextAnim.props[key].endValue - nextAnim.props[key].startValue;
            if (nextAnim.props[key].changeInValue !== 0) {
              doAnim = true;
            }
          });
          if (!doAnim) {
            if (typeof nextAnim.callback === 'function') {
              nextAnim.callback();
            }
            this.queue.shift();
          }
        } while (this.queue.length > 0 && !doAnim);
      }
      if (this.queue.length === 0) {
        if (typeof this.onComplete === 'function') {
          this.onComplete();
          this.onComplete = null;
        }
      }
    }
    this.isUpdate = true;
    return true;
  }
};
