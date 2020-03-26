import * as constants from '../constants/config.js';
import SvgVertex from './SvgVertex.js';

/** getTriangleArea(x1, y1, x2, y2, x3, y3)
 * x1, y1, … x3, y3で示される3つの頂点からなる三角形の面積を返します。
 * @return {number} 三角形の面積
 */
const getTriangleArea = (x1, y1, x2, y2, x3, y3) => {
  const a = (x1 - x3) * (y2 - y3);
  const b = (x2 - x3) * (y1 - y3);
  return Math.abs(a - b) / 2;
};

/** getDensity(elm)
 * 引数elmの構造は、たとえば次のようなものです。
 * <circle … stroke="#000" style="fill:#ee0000;stroke:#ff0000;" />
 * ここで、ストロークカラーがより赤ければ赤いほど、高い密度を持っていると解釈します。
 * @param {Element} elm - 密度を解釈するElementインスタンス
 * @return {number} 解釈された密度（DEFAULT_DENSITY ～ MAX_DENSITY)
 */
const getDensity = (elm) => {
  // stroke属性の値を取得する
  let strokeStr = elm.getAttribute('stroke') || '#000';
  // style属性の中でstrokeプロパティが指定されている場合、その値でstrokeStrを上書きする
  const styleStr = elm.getAttribute('style') || '';
  styleStr.split(';').forEach((oneStyle) => {
    const arr = oneStyle.split(':');
    if (arr[0] === 'stroke') {
      [, strokeStr] = arr;
    }
  });
  // 一部のカラーコードを#RGB形式に変換
  // その後「#」を削除
  strokeStr = strokeStr.toLowerCase();
  strokeStr = strokeStr.replace('red', '#f00');
  strokeStr = strokeStr.replace('black', '#000');
  strokeStr = strokeStr.replace('#', '');
  // 赤度を取得したい
  let redValue;
  // strokeStrの文字数で分岐する
  if (strokeStr.length === 3) {
    // RGB形式の場合
    redValue = parseInt(strokeStr[0] + strokeStr[0], 16) || 0;
  } else {
    // RRGGBB形式の場合
    redValue = parseInt(strokeStr[0] + strokeStr[1], 16) || 0;
  }
  // DEFAULT_DENSITYをベースに
  // 真っ赤ならばMAX_DENSITYまで増加するように計算された値を返す
  return constants.DEFAULT_DENSITY
    + (constants.MAX_DENSITY - constants.DEFAULT_DENSITY) * (redValue / 255);
};

/** Shape
 * @typedef {Object} Shape
 * @property {string} type - 図形のタイプ。'circle' あるいは 'path'。
 * @property {number} density - 密度。これが大きいと、重くずっしりした剛体になる。
 * @property {number} cx - (type: circle) 円の中心のx座標。
 * @property {number} cy - (type: circle) 円の中心のy座標。
 * @property {number} r - (type: circle) 円の半径。
 * @property {Array.<number>} path - (type: path) 頂点の座標配列。[x1, y1, x2, y2, …]と続く。
 */
/** parseSVG(xml)
 * @param {xml} svgファイルのxmlオブジェクト
 * @return {Object} ret
 * @return {number} ret.width - 解釈された横幅。
 * @return {number} ret.height - 解釈された高さ。
 * @return {Array.<Shape>} ret.shapes - 解釈された図形群。
 */
const parseSVG = (xml) => {
  const $svg = xml.getElementsByTagName('svg')[0];
  const viewBox = $svg.getAttribute('viewBox');
  let width;
  let height;
  if (viewBox) {
    const viewBoxSplit = viewBox.split(' ');
    width = parseFloat(viewBoxSplit[2]);
    height = parseFloat(viewBoxSplit[3]);
  } else {
    width = parseFloat($svg.getAttribute('width'));
    height = parseFloat($svg.getAttribute('height'));
  }
  const $circles = xml.getElementsByTagName('circle');
  const $ellipses = xml.getElementsByTagName('ellipse');
  const $paths = xml.getElementsByTagName('path');
  const shapes = [];
  //
  // <circle cx="0" cy="0" r="10" />
  //
  if ($circles) {
    Array.prototype.forEach.call($circles, ($circle) => {
      const type = 'circle';
      const density = getDensity($circle);
      const cx = parseFloat($circle.getAttribute('cx'));
      const cy = parseFloat($circle.getAttribute('cy'));
      const r = parseFloat($circle.getAttribute('r'));
      shapes.push({
        type, density, cx, cy, r,
      });
    });
  }
  //
  // <ellipse cx="0" cy="0" rx="10" ry="10" />
  //
  if ($ellipses) {
    Array.prototype.forEach.call($ellipses, ($ellipse) => {
      const type = 'circle';
      const density = getDensity($ellipse);
      const cx = parseFloat($ellipse.getAttribute('cx'));
      const cy = parseFloat($ellipse.getAttribute('cy'));
      const rx = parseFloat($ellipse.getAttribute('rx'));
      const ry = parseFloat($ellipse.getAttribute('ry'));
      const r = (rx + ry) / 2;
      shapes.push({
        type, density, cx, cy, r,
      });
    });
  }
  //
  // <path d="M0,0 10,0 10,10 0,10z" />
  //
  if ($paths) {
    Array.prototype.forEach.call($paths, ($path) => {
      const type = 'path';
      const density = getDensity($path);
      const dValue = $path.getAttribute('d');
      let partStr = '';
      let path = [];
      let lineMode = '';
      let isAbsolute = true;
      let ignoreCount = 0;
      let resetIgnoreCount = 0;
      let isIncludeDot = false;
      const beforePos = { x: 0, y: 0 };
      //
      // 現在のpartStrをパスとして追加する関数
      //
      function pushPos() {
        // partStrの数値変換を試みる
        let pos = parseFloat(partStr);
        // 数値に変換できたら
        if (!Number.isNaN(pos)) {
          if (ignoreCount > 0) {
            // ignoreCountが正の値をとっているうちは無視する
            // logger.log('%cNG: ' + pos, 'color: red;');
            ignoreCount -= 1;
          } else {
            // ignoreCountが正の値ではなければパスとして追加する
            // logger.log('%cOK: ' + pos, 'color: green;');
            // x座標なのかy座標なのか
            let target;
            if (path.length % 2 === 0 && lineMode !== 'V') {
              target = 'x';
            } else {
              target = 'y';
            }

            // 相対指定モードならば直前の座標を足す
            if (!isAbsolute) {
              pos += beforePos[target];
            }

            // 直線モード
            switch (lineMode) {
              case 'H':
              // 水平線モードならx座標として追加
              // y座標は直前の座標をそのまま使う
                path.push(pos);
                path.push(beforePos.y);
                beforePos.x = pos;
                break;
              case 'V':
              // 垂直線モードならy座標として追加
              // x座標は直前の座標をそのまま使う
                path.push(beforePos.x);
                path.push(pos);
                beforePos.y = pos;
                break;
              default:
              // 指定がなければそのまま追加
                path.push(pos);
                beforePos[target] = pos;
                break;
            }

            // ignoreCountを減らしてリセット判定を行う
            ignoreCount -= 1;
            if (ignoreCount <= -2) {
              ignoreCount = resetIgnoreCount;
            }
          } // ignoreCountが正の値かどうか分岐はここまで

          // リセット
          partStr = '';
          isIncludeDot = false;
        } // partStrが数値変換できたかどうかの分岐はここまで
        return true;
      }
      //
      // d属性の値を1文字1文字を見ていく
      //
      for (let i = 0; i < dValue.length; i += 1) {
        // i番目の文字を取得
        let c = dValue.charAt(i);
        // 大文字かどうかを判定しておいてから大文字化する
        const isUpperCase = (c === c.toUpperCase());
        c = c.toUpperCase();
        switch (c) {
          default:
            // 数値ならpartStrにcを足して次へ
            partStr += c;
            break;
          case ' ':
          case ',':
            // 区切り文字なら現在のpartStrをプッシュする
            pushPos();
            break;
          case '-':
            // マイナスも区切り文字として機能するのでプッシュ
            // そのあとリセットされたpartStrにcを足す
            pushPos();
            partStr += c;
            break;
          case '.':
            // 小数点を含む数値のあとにドットが来た場合
            // そのドットは区切り文字として機能するのでプッシュ
            if (isIncludeDot) {
              pushPos();
            }
            // 小数点を含むフラグを立ててpartStrにcを足す
            isIncludeDot = true;
            partStr += c;
            break;
          case 'H':
            // 以下、特殊な意味を持つアルファベット群
            // いずれも区切り文字として機能する
            // プッシュしてから対応するフラグを上げ下げする
            // https://developer.mozilla.org/ja/docs/Web/SVG/Attribute/d
            pushPos();
            isAbsolute = isUpperCase;
            lineMode = 'H';
            break;
          case 'V':
            pushPos();
            isAbsolute = isUpperCase;
            lineMode = 'V';
            break;
          case 'L':
          case 'M':
          case 'Z':
          case 'T':
            pushPos();
            isAbsolute = isUpperCase;
            lineMode = '';
            ignoreCount = 0;
            resetIgnoreCount = 0;
            break;
          case 'C': // キュービックベジェ曲線 C c1x,c1y c2x,c2y x,y
            pushPos();
            isAbsolute = isUpperCase;
            lineMode = '';
            resetIgnoreCount = 4;
            ignoreCount = 4;
            break;
          case 'S': // キューブベジェ曲線 S cx,cy x,y
          case 'Q': // クアドリックベジェ曲線 Q cx,cy x,y
            pushPos();
            isAbsolute = isUpperCase;
            lineMode = '';
            resetIgnoreCount = 2;
            ignoreCount = 2;
            break;
        }
        // Zならそこでパスは終わり
        if (c === 'Z') {
          // pathsにプッシュ
          shapes.push({ type, density, path });
          // リセット
          beforePos.x = path[0] || 0;
          beforePos.y = path[1] || 0;
          resetIgnoreCount = 0;
          ignoreCount = 0;
          isAbsolute = true;
          lineMode = '';
          path = [];
        }
      } // dValueの走査はここまで
    }); // ひとつの<path></path>の解析はここまで
  }
  return { width, height, shapes };
};

/** dividePath(path)
 * 多角形を三角形に分割します。
 * http://javaappletgame.blog34.fc2.com/blog-entry-148.html
 * @param {Array} path - 分割するパス。[x1, y1, x2, y2, … xn, yn]
 * @return {Array} 分割されたパスの配列。[[x1, y1, x2, y2, x3, y3], … ]
 */
const dividePath = (path) => {
  const vertexes = [];
  const vertexCount = path.length / 2;
  // path = [x1, y1, x2, y2, … xn, yn]
  // というデータから、
  // vertexes = [
  //   {x1, y1},
  //   {x2, y2},
  //     …
  //   {xn, yn}
  // ]
  // というデータを作成する
  for (let i = 0; i < vertexCount; i += 1) {
    vertexes[i] = new SvgVertex(
      path[i * 2 + 0],
      path[i * 2 + 1],
      i,
      vertexes,
    );
  }
  // x=0, y=0の原点を作る
  const originVertex = new SvgVertex(0, 0, 0, vertexes);
  // 分割の最大試行回数
  const divideCountMax = 300;
  // 三角形のパス配列を放り込んでいく配列
  const triangles = [];
  // 分割の試行回数
  let divideCount = 0;
  // 原点から最も遠い頂点
  let currentVertex = originVertex.getFurthestVertex();
  // 原点から最も遠い頂点で作られた"はみ出し"三角形
  let currentPAFTriangle = null;
  // 頂点が3個以上残っている限り繰り返す
  while (divideCount < divideCountMax && vertexes.length >= 3) {
    divideCount += 1;
    // 現在の頂点と両隣りの頂点で三角形を作る
    const triangle = currentVertex.getTriangle();
    // そうしてできた三角形Aが元の多角形Bからはみ出ているかどうか調べる
    // (三角形の内部に元の多角形の頂点があればはみ出ている)
    // はみ出ている三角形は使用不可能
    let isProtruded = false;
    // すべての頂点について
    for (let i = 0; i < vertexes.length; i += 1) {
      const vertex = vertexes[i];
      // 三角形の頂点に一致するならば無視
      let isSameInstance = false;
      for (let j = 0; j < triangle.length; j += 1) {
        if (vertex === triangle[j]) {
          isSameInstance = true;
          break;
        }
      }
      if (!isSameInstance) {
        // もしその頂点が三角形の内部にあるならば
        // 三角形ははみ出している
        if (vertex.isContainedByTriangle(triangle)) {
          isProtruded = true;
          break;
        }
      }
    }
    // はみ出しているならその三角形を分割結果として使うことはできない
    if (isProtruded) {
      // "現在最も遠いはみ出し三角形"として保存して代替を探しにいく
      if (!currentPAFTriangle) {
        currentPAFTriangle = triangle;
      }
      // ひとつ前の頂点に移動する
      currentVertex = currentVertex.prev();
      // ループする
      continue;
    }
    // この行に到達しているということは
    // この三角形は元の多角形からはみ出していなかった
    // いまこの三角形が"現在最も遠いはみ出し三角形"の代替として選ばれているならば
    if (currentPAFTriangle) {
      // この三角形と"現在最も遠いはみ出し三角形"の向きが一致するかどうかをチェックする
      const dirA = SvgVertex.getTriangleDirection(currentPAFTriangle);
      const dirB = SvgVertex.getTriangleDirection(triangle);
      // 一致しないならこの三角形は"現在最も遠いはみ出し三角形"の代替にはなれない
      if (dirA !== dirB) {
        currentVertex = currentVertex.prev();
        // ループする
        continue;
      }
    }
    // この行に到達しているということは
    // この三角形は元の多角形からはみ出していなかったし
    // "現在最も遠いはみ出し三角形"と向きが一致するかあるいは
    // "現在最も遠いはみ出し三角形"がそもそも存在しなかった
    // したがってこの三角形は分割結果として使用可能
    triangles.push(triangle);
    // 現在の頂点を削除する
    currentVertex.remove();
    // 原点からもっとも遠い頂点に移動する
    currentVertex = originVertex.getFurthestVertex();
    // "現在最も遠いはみ出し三角形"は消去
    currentPAFTriangle = null;
  }
  // 戻り値となるパス配列配列
  const paths = [];
  // 外周を形作る三角形のみにするか
  const isOnlyOuterSide = false;
  // 辺abが外周かどうかを調べる関数
  const isOuterSide = (a, b) => (((a.originIndex + 1) % vertexCount) === b.originIndex);
  // すべての三角形について走査
  triangles.forEach((triangle) => {
    // pushすべきか
    let shouldPush = true;
    // もし外周となる三角形のみでよいならば
    if (isOnlyOuterSide) {
      // 3辺のいずれかが外周であるときにのみpushする
      const boolA = isOuterSide(triangle[0], triangle[1]);
      const boolB = isOuterSide(triangle[1], triangle[2]);
      const boolC = isOuterSide(triangle[2], triangle[0]);
      shouldPush = boolA || boolB || boolC;
    }
    if (shouldPush) {
      paths.push([
        triangle[0].x,
        triangle[0].y,
        triangle[1].x,
        triangle[1].y,
        triangle[2].x,
        triangle[2].y,
      ]);
    }
  });
  return paths;
};

/** devideShapesForLF(shapes)
 * @param {shapes} SVGファイルから解釈された図形群
 * @return {Array.<Shape>} 分割された図形群
 */
const devideShapesForLF = (shapes) => {
  const newShapes = [];
  shapes.forEach((shape) => {
    if (shape.type !== 'path') {
      // <path>でないならば、そのまま放り込む
      newShapes.push(shape);
    } else if (Math.floor(shape.path.length / 2) <= constants.MAX_VERTEX_NUM) {
      // <path>であっても頂点の数がMAX_VERTEX_NUM以下なら分割の必要はない
      newShapes.push(shape);
    } else {
      // <path>でありしかも頂点の数がMAX_VERTEX_NUMより多いならば分割する必要がある
      const dividedPaths = dividePath(shape.path);
      // 分割した三角形それぞれについてtype, densityは元の多角形のものを受け継ぎ
      // pathだけ上書きしたものをshapesに放り込んでいく
      dividedPaths.forEach((dividedPath) => {
        newShapes.push({
          type: shape.type,
          density: shape.density,
          path: dividedPath,
        });
      });
    }
  });
  return newShapes;
};

/** getGCenter(shapes)
 * 多角形を三角形に分割します。
 * http://javaappletgame.blog34.fc2.com/blog-entry-148.html
 * @param {Array} path - 分割するパス。[x1, y1, x2, y2, … xn, yn]
 * @return {Array} 分割されたパスの配列。[[x1, y1, x2, y2, x3, y3], … ]
 */
const getGCenter = (shapes) => {
  // まず多角形をすべて三角形に分割することを考える
  const devidedShapes = [];
  // すべての図形について
  shapes.forEach((shape) => {
    if (shape.type !== 'path') {
      // <path>でないならば、そのまま放り込む
      devidedShapes.push(shape);
    } else if (Math.floor(shape.path.length / 2) <= 3) {
      // <path>であっても頂点の数が3以下なら分割の必要はないから、そのまま放り込む
      devidedShapes.push(shape);
    } else {
      // <path>でありしかも頂点の数が3より多いならば分割する必要がある
      const dividedPaths = dividePath(shape.path);
      // 分割した三角形それぞれについてtype, densityは元の多角形のものを受け継ぎ
      // pathだけ上書きしたものをshapesに放り込んでいく
      dividedPaths.forEach((dividedPath) => {
        devidedShapes.push({
          type: shape.type,
          density: shape.density,
          path: dividedPath,
        });
      });
    }
  });
  // 分割が完了したようだ！
  // {x: 99, y: 99, m: 99} … というような、
  // x座標とy座標と質量をプロパティに持つオブジェクトmxyを作って配列mxysに放り込んでいく
  const mxys = [];
  // 分割済みのすべての図形について…
  devidedShapes.forEach((shape) => {
    switch (shape.type) {
      case 'circle': {
        const x = shape.cx;
        const y = shape.cy;
        const d = shape.density; // 密度
        const a = shape.r * shape.r * Math.PI; // 面積
        const m = d * a; // 質量＝密度×面積
        mxys.push({ m, x, y });
        break;
      }
      case 'path': {
        const x = (shape.path[0] + shape.path[2] + shape.path[4]) / 3;
        const y = (shape.path[1] + shape.path[3] + shape.path[5]) / 3;
        const d = shape.density;
        const a = getTriangleArea(...shape.path);
        const m = d * a;
        mxys.push({ m, x, y });
        break;
      }
      default:
        break;
    }
  });
  // ｢質量×距離の和」を「質量の和」で割ると「重心の距離」が得られる
  // これはx座標もy座標についても同じこと それぞれ別個に計算してやる
  let mxSum = 0;
  let mySum = 0;
  let mSum = 0;
  mxys.forEach((mxy) => {
    mxSum += mxy.m * mxy.x;
    mySum += mxy.m * mxy.y;
    mSum += mxy.m;
  });
  const gx = Math.floor(mxSum / mSum);
  const gy = Math.floor(mySum / mSum);
  // こうして得られたx座標とy座標を返す
  return {
    x: gx,
    y: gy,
  };
};

/** SvgPathData
 * SVGファイルから解釈したパスデータを扱うクラスです。
 */
export default class SvgPathData {
  /** constructor(svg)
   * @param {Document} svg - SVGファイルを解釈したDocumentオブジェクト。
   */
  constructor(svg) {
    const { width, height, shapes } = parseSVG(svg);
    // 三角形分割
    const devidedShapes = devideShapesForLF(shapes);
    // 重心の計算
    const gCenter = getGCenter(devidedShapes);
    // 終わり
    this.width = width;
    this.height = height;
    this.gCenter = gCenter;
    this.shapes = devidedShapes;
  }
}
