/** SvgVertex
 * SVGファイルから読み取った多角形の頂点を扱うクラスです。
 */
export default class SvgVertex {
  /** .constructor(x, y, index, vertexes)
   * @param {number} x - x座標
   * @param {number} y - y座標
   * @param {number} index - 頂点のインデックス
   * @param {Array} vertexes - 元の多角形の頂点配列への参照
   */
  constructor(x, y, index = null, vertexes = null) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.originIndex = index;
    this.vertexes = vertexes;
  }

  /** .remove()
   * 自身を元の多角形から削除します。
   * 配列の中身自体を書き換えて自身をなかったことにするほか、
   * それによって生じるindexの齟齬も修正します。
   */
  remove() {
    // 自身より後にある頂点すべてについてインデックスをデクリメント
    for (let i = this.index + 1; i < this.vertexes.length; i += 1) {
      this.vertexes[i].index -= 1;
    }
    // 配列から自身を削除する
    this.vertexes.splice(this.index, 1);
  }

  /** .prev()
   * 元の多角形における、自身の前の頂点を返します。
   */
  prev() {
    // 基本的に自身のインデックスより1つ下のインデックスにある頂点を返せばよいのだが
    // インデックスが負の数になる場合を考慮してlengthを足してからlengthによる余算を行う
    const prevIndex = ((this.index - 1) + this.vertexes.length) % this.vertexes.length;
    return this.vertexes[prevIndex];
  }

  /** .next()
   * 元の多角形における、自身の次の頂点を返します。
   */
  next() {
    // 基本的に自身のインデックスより1つ上のインデックスにある頂点を返せばよいのだが
    // インデックスが配列の長さを超える場合を考慮してlengthによる余算を行う
    const nextIndex = (this.index + 1) % this.vertexes.length;
    return this.vertexes[nextIndex];
  }

  /** .getTriangle()
   * 自身、自身の次、自身の前、の3つ頂点からなる配列を返します。
   * @return {Array} 3つの頂点が格納された配列
   */
  getTriangle() {
    return [
      this,
      this.next(),
      this.prev(),
    ];
  }

  /** .isContainedByTriangle(vertexes)
   * 自身が「指定された三角形」の内部にあるかどうかを真偽値で返します。
   * @param {Array} vertexes - 三角形の頂点3つが格納された配列
   * @return {Bool} 指定された三角形の内部に自身があるかどうか
   */
  isContainedByTriangle(vertexes) {
    // 自身となる点Pが、指定された△ABCのなかにあるかどうかを求めるとき、
    // △ABP、△BCP、△CAPの向き（外積の正負）を調べることを考えてみる
    const d1 = this.constructor.getTriangleDirection([vertexes[0], vertexes[1], this]);
    const d2 = this.constructor.getTriangleDirection([vertexes[1], vertexes[2], this]);
    const d3 = this.constructor.getTriangleDirection([vertexes[2], vertexes[0], this]);
    // すべての向きが一致したなら、ば点Pは△ABCのなかにある
    return (d1 === d2) && (d2 === d3) && (d3 === d1);
  }

  /** .getTriangleDirection(vertexes)
   * 指定された三角形の向き（外積の正負）を返します。
   * @return {number} 指定された三角形の向き。+1もしくは-1。
   */
  static getTriangleDirection(vertexes) {
    // △ABCがあるとき、ベクトルABとベクトルACについて考える
    const a = new SvgVertex(
      vertexes[1].x - vertexes[0].x,
      vertexes[1].y - vertexes[0].y,
    );
    const b = new SvgVertex(
      vertexes[2].x - vertexes[0].x,
      vertexes[2].y - vertexes[0].y,
    );
    // ベクトルABとベクトルACの外積を計算する
    const product = a.x * b.y - b.x * a.y;
    // 外積の正負が三角形の向きとなる
    const sign = (product >= 0) ? 1 : -1;
    return sign;
  }

  /** .getDistance(vertex)
   * 自身と「指定された頂点」までの距離を返します。
   * @param {SvgVertex} vertex - 距離を求めたい頂点
   * @return {number} 自身から指定された頂点までの距離
   */
  getDistance(vertex) {
    const w = this.x - vertex.x;
    const h = this.y - vertex.y;
    return Math.sqrt(w * w + h * h);
  }

  /** .getFurthestVertex()
   * 元の多角形のうち、自身から最も遠い頂点を取得します。
   * @return {SvgVertex} 元の多角形のうち、自身から最も遠い頂点
   */
  getFurthestVertex() {
    let distanceMax = -Infinity;
    let furthestSvgVertex = null;
    this.vertexes.forEach((vertex) => {
      const distance = this.getDistance(vertex);
      if (distance > distanceMax) {
        distanceMax = distance;
        furthestSvgVertex = vertex;
      }
    });
    return furthestSvgVertex;
  }
}
