import * as constants from '../constants/config.js';
import * as utilities from '../utilities.js';
import Animater from './Animater.js';

/** Panel(options)
 * 2Dオブジェクトを扱うクラスです。
 * LiquidFunの剛体およびCreateJSのディスプレイオブジェクトを統括します。
 */
export default class Panel {
  /** .constructor(options)
   * @param {Object} options - オプション。
   * @param {number} options.x - CreateJSのx座標。キャンバスの左端が0
   * @param {number} options.y - CreateJSのy座標。キャンバスの上端が0
   * @param {boolean} options.isField - フィールドを構成するオブジェクトかどうか
   * @param {string} options.image - 画像のURL
   * @param {string} options.path - パスデータ (SVG) のURL
   */
  constructor(options) {
    /** イベントリスナー(on()の戻り値をoff()に渡す必要がある) */
    this.lisners = {};
    /** 落下したか？ */
    this.isFalled = false;
    /** 落下が予約されているか？ */
    this.isBookedFalling = false;
    /** 飛び出たか？ */
    this.hasJumpedOut = false;
    /** [CreateJS] 実際に生成したDisplayObjectを格納する配列 */
    this.cjsObjects = [];
    /** [CreateJS] クリック領域 */
    this.cjsClick = null;
    /** [CreateJS] 出現時の雲 */
    this.cjsCloud = null;
    /** [CreateJS] パネル画像 */
    this.cjsBitmap = null;
    /** [CreateJS] デバッグ用のポリゴン */
    this.cjsPolygon = null;
    /** [CreateJS] デバッグ用の矩形 */
    this.cjsBounds = null;
    /** [LiquidFun] 剛体 */
    this.physicsBody = null;
    /** 操作の同期を一定間隔で取るためのsetTimeout処理の戻り値 */
    this.sendOperationTimer = -1;
    /** 前回同期からパネルを操作したか？（同期を改めて取る必要があるか？） */
    this.isMoved = false;
    /** ホストによって強制されたか？ */
    this.isForced = false;
    // thisにoptionsをマージする
    Object.assign(this, options);
    // スケールの設定
    if (!this.scale) {
      if (this.width) {
        this.scale = this.width / this.pathData.width;
        this.height = this.pathData.height * this.scale;
      } else if (this.height) {
        this.scale = this.height / this.pathData.height;
        this.width = this.pathData.width * this.scale;
      } else {
        this.scale = 1;
      }
    } else {
      this.width = this.pathData.width * this.scale;
      this.height = this.pathData.height * this.scale;
    }
    //
    // [LiquidFun]
    //
    // 物理ボディの定義
    const physicsBodyDef = new b2BodyDef();
    physicsBodyDef.type = b2_staticBody;
    physicsBodyDef.position.Set(
      this.x / constants.METER, // 発生X座標
      this.y / constants.METER, // 発生Y座標
    );
    // 物理ボディをワールドに生成
    this.physicsBody = this.world.CreateBody(physicsBodyDef);
    Object.assign(this.physicsBody, {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      vangle: 0,
      teleportX: 0,
      shakeCount: 0,
      rotateCount: 0,
      name: this.name,
      vangleDirection: 0,
      onAnimationEnd: null,
      animater: new Animater(this.physicsBody),
    });
    // パス指定 (paths, circles)
    if (this.pathData) {
      // scale
      const lfScale = this.scale / constants.METER;
      const hw = lfScale * (this.pathData.width / 2);
      const hh = lfScale * (this.pathData.height / 2);
      this.pathData.shapes.forEach((shape) => {
        switch (shape.type) {
          case 'circle': {
            const circleShape = new b2CircleShape();
            circleShape.radius = lfScale * shape.r;
            circleShape.position = new b2Vec2(lfScale * shape.cx - hw, lfScale * shape.cy - hh);
            const fd = new b2FixtureDef();
            fd.density = shape.density;
            fd.friction = constants.DEFAULT_FRICTION;
            fd.restitution = constants.DEFAULT_RESTITUTION;
            fd.shape = circleShape;
            this.physicsBody.CreateFixtureFromDef(fd);
            break;
          }
          case 'path': {
            const { path } = shape;
            const polygonShape = new b2PolygonShape();
            const length = Math.floor(path.length / 2);
            if (length > constants.MAX_VERTEX_NUM) {
              utilities.logger.log('フィクスチャに指定できる頂点の限界数を超えています。');
            }
            for (let i = 0; i < length; i += 1) {
              polygonShape.vertices[i] = new b2Vec2(
                lfScale * path[i * 2 + 0] - hw,
                lfScale * path[i * 2 + 1] - hh,
              );
            }
            const fd = new b2FixtureDef();
            fd.density = shape.density;
            fd.friction = constants.DEFAULT_FRICTION;
            fd.restitution = constants.DEFAULT_RESTITUTION;
            fd.shape = polygonShape;
            this.physicsBody.CreateFixtureFromDef(fd);
            break;
          }
          default:
            break;
        }
      });
    } else {
      const rectShape = new b2PolygonShape();
      const w = this.width / 2 / constants.METER;
      const h = this.height / 2 / constants.METER;
      rectShape.SetAsBoxXYCenterAngle(w, h, new b2Vec2(0, 0), 0);
      const fixtureDef = new b2FixtureDef();
      fixtureDef.density = constants.DEFAULT_DENSITY;
      fixtureDef.friction = constants.DEFAULT_FRICTION;
      fixtureDef.restitution = constants.DEFAULT_RESTITUTION;
      fixtureDef.shape = rectShape;
      this.physicsBody.CreateFixtureFromDef(fixtureDef);
    }
    //
    // CreateJS
    //
    // バウンズ
    if (constants.IS_DEBUG_POLYGON) {
      this.cjsBounds = new createjs.Shape();
      this.stage.addChild(this.cjsBounds);
      this.cjsObjects.push(this.cjsBounds);
    }
    // クリック領域
    if (this.image && !this.isField && this.isOperable) {
      this.cjsClick = new createjs.Shape();
      this.cjsClick.isClickObject = true;
      this.cjsClick.set({
        x: 0,
        y: 0,
      });
      this.cjsClick.graphics
        .beginFill('#ffffff')
        .rect(0, 0, this.image.naturalWidth, this.image.naturalHeight);
      // this.stage.addChild(this.cjsClick);
      this.cjsObjects.push(this.cjsClick);
    }
    // 画像
    if (this.image) {
      this.cjsBitmap = new createjs.Bitmap(this.image);
      this.cjsBitmap.set({
        x: this.x,
        y: this.y,
        scaleX: this.width / this.image.naturalWidth,
        scaleY: this.width / this.image.naturalWidth,
        regX: Math.floor(this.image.naturalWidth / 2),
        regY: Math.floor(this.image.naturalHeight / 2),
        hitArea: this.cjsClick,
      });
      this.stage.addChild(this.cjsBitmap);
      this.cjsObjects.push(this.cjsBitmap);
    }
    // 当たり判定ポリゴン等
    if (constants.IS_DEBUG_POLYGON) {
      this.cjsPolygon = new createjs.Shape();
      this.cjsPolygon.set({
        x: this.x,
        y: this.y,
        regX: Math.floor(this.width / 2),
        regY: Math.floor(this.height / 2),
      });
      this.stage.addChild(this.cjsPolygon);
      this.cjsObjects.push(this.cjsPolygon);
      this.refreshStroke(false);
    }
    if (!this.isField) {
      // 操作可能なパネルなら
      if (this.isOperable) {
        // 操作同期を取る
        this.sendOperation();
        // ドラッグイベントハンドラを取り付ける
        this.setupDragEvent(this.cjsBitmap);
      }
      // 雲を生成
      this.cjsCloud = new createjs.Bitmap(this.cloudImage);
      this.cjsCloud.cloudAnimater = new Animater(this.cjsCloud);
      this.cjsCloud.set({
        x: this.x,
        y: this.y,
        originX: this.x,
        originY: this.y,
        regX: Math.floor(this.cloudImage.naturalWidth / 2),
        regY: Math.floor(this.cloudImage.naturalHeight / 2),
        scale: 0.8,
        alpha: 1,
      });
      this.stage.addChild(this.cjsCloud);
      this.cjsObjects.push(this.cjsCloud);
      // 雲のアニメーションを設定
      this.cjsCloud.cloudAnimater.addAnim(
        { scale: 1, alpha: 0 },
        constants.CLOUD_ANIMATION_DURATION,
        () => {
          this.stage.removeChild(this.cjsCloud);
          this.cjsCloud = null;
        },
      );
      // 操作中のオブジェクトが既存の設置オブジェクトにぶつからないようにするために
      // LiquidFun上ではオブジェクトを横に大きくテレポートさせておく！
      // ただしCreateJSで描画する際にはテレポート量を差し引いて描画するので
      // 見かけは普通に見える
      this.physicsBody.teleportX = constants.TELEPORT_X;
      utilities.addB2BodyXYAngle({
        body: this.physicsBody,
        x: this.physicsBody.teleportX,
      });
    }
    this.tick(true);
    return this;
  }

  /** .setupDragEvent()
   * ドラッグイベントハンドラを登録します。
   * (Bitmapオブジェクトのmousedown、pressmove、pressupイベント)
   * LiquidFunの剛体の座標を動かしてやれば、あとはtickが勝手に座標を同期してくれます。
   */
  setupDragEvent() {
    let now;
    // マウスボタンが押下されているかどうか
    let isMouseDown = false;
    // マウスボタンが押下されたときのマウス座標とオブジェクト座標の差
    let marginX;
    //
    let startX;
    // ホバー時のマウスカーソルをpointerに設定
    this.cjsBitmap.cursor = 'pointer';
    // mousedown … マウスボタンを押下したとき
    this.lisners.onmousedown = this.cjsBitmap.on('mousedown', () => {
      // ホイールクリックでドロップできるようにする
      // if (window.event && window.event.button >= 1) {
      //   this.drop();
      //   return;
      // }
      // // 現在操作可能であり、かつ、
      // そのオブジェクトがスタティックであり、かつ、
      // オブジェクトが落下中ではないならば、ドラッグ操作を開始する
      if (this.needsOperate()) {
        // マージンの計算
        marginX = this.stage.mouseX - this.cjsBitmap.x;
        // オブジェクトを起こす
        this.physicsBody.SetAwake(true);
        // マウスダウンした時間
        now = utilities.getTime();
        // マウスボタン押下フラグを立てる
        isMouseDown = true;
        //
        startX = this.stage.mouseX;
      }
    });
    // pressmove … ドラッグしたとき
    this.lisners.onpressmove = this.cjsBitmap.on('pressmove', () => {
      // 現在操作可能であり、かつ、
      // マウスボタン押下フラグが立っており、かつ、
      // オブジェクトが落下中ではないならば、ドラッグ操作による移動を行う
      if (this.needsOperate() && isMouseDown) {
        // 計算しておいたマージンをマウス座標から引く
        const x = this.stage.mouseX - marginX - this.canvasDetail.padding.x;
        utilities.setB2BodyXYAngle({
          body: this.physicsBody,
          x: x / constants.METER + this.physicsBody.teleportX,
        });
        this.isMoved = true;
      }
    });
    // pressup … マウスボタンを離したとき
    this.lisners.onpressup = this.cjsBitmap.on('pressup', () => {
      if (isMouseDown && this.isMovable()) {
        if (startX === this.stage.mouseX && (utilities.getTime() - now) < 200) {
          this.rotate();
        }
        // フラグを折る
        isMouseDown = false;
      }
    });
  }

  /** .removeDragEvent()
   */
  removeDragEvent() {
    this.cjsBitmap.cursor = '';
    this.cjsBitmap.off('mousedown', this.lisners.onmousedown);
    this.cjsBitmap.off('pressmove', this.lisners.onpressmove);
    this.cjsBitmap.off('pressup', this.lisners.onpressup);
  }

  /** .refreshStroke(isAwake)
   * デバッグモード用のポリゴンを描き直します。
   */
  refreshStroke(isAwake) {
    const strokeColor = (isAwake) ? 'rgba(255, 100, 0, 1)' : 'rgba(0, 100, 255, 1)';
    const fillColor = (isAwake) ? 'rgba(255, 100, 0, 0.5)' : 'rgba(0, 100, 255, 0.5)';
    if (this.pathData) {
      this.cjsPolygon.graphics
        .clear()
        .beginFill(fillColor)
        .setStrokeStyle(constants.STROKE_WIDTH);
      // ===============================
      // 図形
      // ===============================
      this.pathData.shapes.forEach((shape) => {
        switch (shape.type) {
          // 円
          case 'circle':
            this.cjsPolygon.graphics
              .beginStroke(strokeColor)
              .drawCircle(
                this.scale * shape.cx,
                this.scale * shape.cy,
                this.scale * shape.r,
              )
              .endStroke();
            break;
          // 多角形
          case 'path': {
            this.cjsPolygon.graphics.beginStroke(strokeColor);
            const { path } = shape;
            const length = Math.floor(path.length / 2);
            for (let i = 0; i <= length; i += 1) {
              const funcKey = (i === 0) ? 'moveTo' : 'lineTo';
              const ii = (i < length) ? i : 0;
              const x = path[ii * 2 + 0] * this.scale;
              const y = path[ii * 2 + 1] * this.scale;
              this.cjsPolygon.graphics[funcKey](x, y);
            }
            this.cjsPolygon.graphics.endStroke();
            break;
          }
          default:
            break;
        }
      });
      // ===============================
      // 画像の中心
      // ===============================
      const cColor = 'rgba(255, 100, 0, 1)';
      const center = {
        x: this.width / 2,
        y: this.height / 2,
      };
      this.cjsPolygon.graphics
        .beginStroke(cColor)
        .setStrokeStyle(6)
        .moveTo(center.x - 10, center.y)
        .lineTo(center.x + 10, center.y)
        .endStroke()
        .beginStroke(cColor)
        .moveTo(center.x, center.y - 10)
        .lineTo(center.x, center.y + 10)
        .setStrokeStyle(constants.STROKE_WIDTH)
        .endStroke();
      // ===============================
      // 重心およびそこから伸びる矢印
      // ===============================
      const gColor = 'rgba(255, 0, 255, 1)';
      const rad = -this.physicsBody.GetAngle();
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const g = {
        x: this.scale * this.pathData.gCenter.x,
        y: this.scale * this.pathData.gCenter.y,
      };
      const rotate = (p) => ({
        x: -sin * p.y + cos * p.x,
        y: sin * p.x + cos * p.y,
      });
      const a = rotate({ x: 0, y: 100 });
      const b = rotate({ x: -5, y: 90 });
      const c = rotate({ x: 5, y: 90 });
      this.cjsPolygon.graphics
        // 重心を表す円
        .beginFill(gColor)
        .drawCircle(g.x, g.y, 6)
        // 重心から真下に伸びる線
        .beginStroke(gColor)
        .moveTo(g.x, g.y)
        .lineTo(g.x + a.x, g.y + a.y)
        .endStroke()
        // 矢印の先端から左側へ伸びるヒゲ
        .beginStroke(gColor)
        .moveTo(g.x + a.x, g.y + a.y)
        .lineTo(g.x + b.x, g.y + b.y)
        .endStroke()
        // 矢印の先端から右側へ伸びるヒゲ
        .beginStroke(gColor)
        .moveTo(g.x + a.x, g.y + a.y)
        .lineTo(g.x + c.x, g.y + c.y)
        .endStroke();
      // ===============================
      // キャッシュ
      // ===============================
      const cacheX = Math.min(0, g.x + a.x);
      const cacheY = Math.min(0, g.y + a.y);
      const cacheWidth = Math.max(this.width, g.x + Math.abs(a.x));
      const cacheHeight = Math.max(this.height, g.y + Math.abs(a.y));
      this.cjsPolygon.cache(
        cacheX - constants.STROKE_WIDTH,
        cacheY - constants.STROKE_WIDTH,
        cacheWidth + constants.STROKE_WIDTH * 2,
        cacheHeight + constants.STROKE_WIDTH * 2,
      );
    } else {
      // パスデータがない場合単純な矩形を描画
      this.cjsPolygon.graphics
        .clear()
        .beginFill(fillColor)
        .setStrokeStyle(constants.STROKE_WIDTH)
        .beginStroke(strokeColor)
        .drawRect(0, 0, this.width, this.height)
        .endStroke();
      // キャッシュする (StageGLで図形を描画するために必須)
      this.cjsPolygon.cache(
        0 - constants.STROKE_WIDTH,
        0 - constants.STROKE_WIDTH,
        this.width + constants.STROKE_WIDTH * 2,
        this.height + constants.STROKE_WIDTH * 2,
      );
    }
  }

  /** .calcLeftTime()
   * 残り時間を計算します。
   */
  calcLeftTime() {
    const time = utilities.getTime();
    const pastTime = time - this.timeCreate;
    const leftTime = (this.timeLimit * 1000) - pastTime;
    return leftTime;
  }

  /** .tick(bool)
   * オブジェクトのハンドルティック関数を生成して返します。
   * @return {boolean} bool - 強制的に描画しなおすかどうか
   */
  tick(bool) {
    if (this.cjsCloud) {
      this.cjsCloud.cloudAnimater.tick();
    }
    // 描き直す必要があるか？
    const needsRedraw = bool || this.needsRedraw();
    // 描き直すべきならば
    if (needsRedraw) {
      const x = this.physicsBody.GetPosition().x - this.physicsBody.teleportX;
      const { y } = this.physicsBody.GetPosition();
      const transform = {
        x: x * constants.METER + this.canvasDetail.padding.x,
        y: y * constants.METER + this.canvasDetail.padding.y + this.scroller.getProperty('y'),
        rotation: utilities.parseDegree(this.physicsBody.GetAngle()),
      };
      // 画像の位置と回転を同期する
      if (this.cjsBitmap) {
        this.cjsBitmap.set(transform);
      }
      if (this.cjsCloud) {
        this.cjsCloud.set({
          x: this.cjsCloud.originX + this.canvasDetail.padding.x,
          y: this.cjsCloud.originY + this.canvasDetail.padding.y + this.scroller.getProperty('y'),
          rotation: 0,
        });
      }
      // ポリゴンの位置を同期する
      if (this.cjsPolygon) {
        this.cjsPolygon.set(transform);
        this.refreshStroke(this.physicsBody.isAwake);
      }
      // バウンズの位置と大きさを同期する
      if (this.cjsBounds) {
        const bounds = (this.cjsBitmap || this.cjsPolygon).getTransformedBounds();
        this.cjsBounds.x = bounds.x;
        this.cjsBounds.y = bounds.y;
        this.cjsBounds.graphics
          .clear()
          .beginFill('rgba(100, 255, 0, 0.2)')
          .setStrokeStyle(constants.STROKE_WIDTH)
          .beginStroke('rgba(100, 255, 0, 1)')
          .drawRect(0, 0, bounds.width, bounds.height)
          .endStroke();
        this.cjsBounds.cache(
          0 - constants.STROKE_WIDTH,
          0 - constants.STROKE_WIDTH,
          bounds.width + (constants.STROKE_WIDTH * 2),
          bounds.height + (constants.STROKE_WIDTH * 2),
        );
      }
    }
    // 現在フレームの物理ボディの情報を記録しておく
    this.saveTransform();
    // 描き直すべきかどうかを返す
    return needsRedraw;
  }

  saveTransform() {
    Object.assign(this.physicsBody, {
      angle: this.physicsBody.GetAngle(),
      x: this.physicsBody.GetPosition().x,
      y: this.physicsBody.GetPosition().y,
      vx: this.physicsBody.GetLinearVelocity().x,
      vy: this.physicsBody.GetLinearVelocity().y,
      vangle: this.physicsBody.GetAngularVelocity(),
    });
  }

  /** .needsRedraw()
   */
  needsRedraw() {
    // 物理ボディが起きているか
    // x座標、y座標、回転度のうち少なくともひとつが前回フレームの値と異なるならば起きている
    let isAwake = true;
    if (this.physicsBody.angle === this.physicsBody.GetAngle()) {
      if (this.physicsBody.x === this.physicsBody.GetPosition().x
          && this.physicsBody.y === this.physicsBody.GetPosition().y) {
        isAwake = false;
      }
    }
    // "物理ボディが起きているか"が直前のフレームから変わったか
    const isAwakeChange = (isAwake !== this.physicsBody.isAwake);
    this.physicsBody.isAwake = isAwake;
    // スクロール量に変化があるか
    const isScrollChange = this.scroller.isUpdate;
    // 描き直すべきか
    return isScrollChange || isAwake || isAwakeChange
      || this.physicsBody.animater.isUpdate || this.cjsCloud;
  }

  /** .move(delta)
   */
  move(delta) {
    this.isMoved = true;
    const x = this.physicsBody.GetPosition().x + delta;
    this.physicsBody.animater.addAnim(
      { x },
      constants.ROTATE_DURATION,
      { isOverwrite: true },
    );
  }

  /** .createOperation(isDown)
   */
  createOperation(isDown) {
    const operation = {};
    if (isDown) {
      operation.x = this.physicsBody.GetPosition().x;
      operation.y = this.physicsBody.GetPosition().y;
      operation.angle = this.physicsBody.GetAngle();
    } else {
      operation.x = this.physicsBody.animater.getTargetProperty('x');
      operation.y = this.physicsBody.animater.getTargetProperty('y');
      operation.angle = this.physicsBody.animater.getTargetProperty('angle');
    }
    operation.uid = this.ownerUid;
    if (isDown) {
      operation.isDown = isDown;
    }
    if (this.isForced) {
      operation.isForced = this.isForced;
    }
    return operation;
  }

  /** .sendOperation()
   */
  sendOperation() {
    this.sendOperationTimer = setTimeout(() => { this.sendOperation(); },
      constants.SYNC_OPERATE_TIMEOUT_DURATION);
    if (this.needsOperate() && this.isMoved && this.isOnline) {
      const operation = this.createOperation(false);
      this.app.network.sendOperation(this.stepCount, operation);
      this.isMoved = false;
    }
  }

  /** .isMovable()
   * 落下していないかどうかを返します。
   * このパネルがまだ落下しておらず、落下の予約もされていないならば、trueを返します。
   * @return {boolean} まだ落下していないか。
   */
  isMovable() {
    return !this.isFalled && !this.isBookedFalling;
  }

  /** .needsOperate()
   * 操作する必要があるかどうかを返します。
   * このパネルが操作対象パネルであり、なのに落下がなされていないならば、trueを返します。
   * このパネルが操作対象ではない（他人のターンのパネルである）場合や、
   * すでに落下済み（落下予約済み）の場合は、falseを返します。
   * @return {boolean} 操作する必要があるか。
   */
  needsOperate() {
    return this.isOperable && this.isMovable();
  }

  /** .setDynamic()
   * 操作オブジェクトをダイナミックに変更します。
   */
  setDynamic() {
    this.physicsBody.SetType(b2_dynamicBody);
  }

  /** .setStatic()
   * 操作オブジェクトをスタティックに変更します。
   */
  setStatic() {
    this.physicsBody.SetType(b2_staticBody);
  }

  /** .teleport()
   * 操作オブジェクトをテレポートさせます。
   */
  teleport() {
    utilities.addB2BodyXYAngle({
      body: this.physicsBody,
      x: constants.TELEPORT_X,
    });
  }

  /** .drop()
   */
  drop() {
    // 操作ボタンと残り時間を非表示にする
    document.getElementById('ope-button-outer').style.setProperty('display', 'none');
    this.leftTimeElm.textContent = '';
    // 現在回転アニメーション中ではないならば
    // 操作を最終決定して落とす！
    if (this.physicsBody.animater.queue.length === 0) {
      // 操作情報を記録する
      const operation = this.createOperation(true);
      utilities.setB2BodyXYAngle({
        body: this.physicsBody,
        x: operation.x,
        y: operation.y,
        angle: operation.angle,
      });
      utilities.addB2BodyXYAngle({
        body: this.physicsBody,
        x: -this.physicsBody.teleportX,
      });
      this.physicsBody.teleportX = 0;
      // 操作オブジェクトをダイナミックに変更
      this.physicsBody.SetType(b2_dynamicBody);
      // フラグを立てる
      this.isFalled = true;
      this.removeDragEvent();
      clearTimeout(this.sendOperationTimer);
      if (this.isOnline && this.isOperable) {
        this.app.network.sendOperation(this.stepCount, operation);
      }
      this.app.sound.play(constants.SE_PANEL_DOWN);
    } else {
      this.isBookedFalling = true;
      this.physicsBody.animater.onComplete = () => {
        this.drop();
      };
    }
  }

  /** .rotate()
   */
  rotate() {
    this.isMoved = true;
    // 回転回数を1増加
    this.physicsBody.rotateCount += 1;
    // 回転回数に応じて目標角度を決定する
    const angle = utilities.parseRadian(360 * (this.physicsBody.rotateCount / 8));
    this.physicsBody.animater.addAnim(
      { angle },
      constants.ROTATE_DURATION,
      { isOverwrite: true },
    );
    this.app.sound.play(constants.SE_PANEL_ROTATE);
  }

  /** .initShakeCount()
   */
  initShakeCount() {
    this.physicsBody.shakeCount = 0;
  }

  /** .pushTo(array)
   */
  pushTo(array) {
    this.panels = array;
    this.index = array.length;
    array.push(this);
    return this;
  }

  /** .remove()
   * LiquidFunワールドのオブジェクトとCreateJSステージのオブジェクトを
   * 同時に削除します。
   */
  remove() {
    // LiquidFunワールドから取り除く
    this.world.DestroyBody(this.physicsBody);
    // CreateJSステージから取り除く
    this.cjsObjects.forEach((cjsObject) => {
      this.stage.removeChild(cjsObject);
    });
    // panelのindex値の変更
    for (let i = this.index + 1; i < this.panels.length; i += 1) {
      this.panels[i].index -= 1;
    }
    // panelsから切り取る
    this.panels.splice(this.index, 1);
  }

  /** .jumpOut()
   */
  jumpOut() {
    this.hasJumpedOut = true;
    this.setStatic();
    this.teleport();
    this.app.sound.play(constants.SE_PANEL_JUMP_OUT);
    // this.remove();
  }
}
