/** Xors(seed)
 * XOR交換アルゴリズムによる乱数生成機のクラスです。
 */
export default class Xors {
  /** .constructor(seed)
   * 初期シード値を指定して乱数生成器を作ります。
   * 省略した場合は88675123になります。
   * @param {number} seed - 初期シード値。
   */
  constructor(seed) {
    this.x = 123456789;
    this.y = 362436069;
    this.z = 521288629;
    this.w = seed || 88675123;
  }
  /** .random()
   * 0から数億の整数乱数を返します。
   * @return {number} 0以上の整数乱数。
   */
  random() {
    const t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    this.w = (this.w ^ (this.w >> 19)) ^ (t ^ (t >> 8));
    return this.w;
  }
  /** .getRandom(max)
   * 0以上max未満の整数乱数を返します。
   * たとえばgetRandom(10)で0～9の乱数が取得できます。
   * @param {number} max - 乱数の最大値+1（max自体は取得できない）。
   * @return {number} 0以上max未満の整数乱数。
   */
  getRandom(max) {
    return (this.random() % max);
  }
};
