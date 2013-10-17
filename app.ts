/// <reference path="glMatrix.d.ts" />

// Class Point
class Point {
    constructor (public x: number, public y: number) { }
}

// アンカークラス
class Anchor {
    static private target: HTMLElement;
    static private target2: HTMLElement;
    static private target3: HTMLElement;
    static callback: () => void;

    // コンストラクタ
    constructor (no: string, x: number, y: number, v:Boolean) {
        var elm: HTMLElement = document.getElementById("p" + no);

        Anchor.move(elm, x, y);
        if (v) {
            if (Anchor.target == null) {
                // マウスダウン
                elm.addEventListener('mousedown', event => { 
                    event.preventDefault();
                    event.stopPropagation();
                    Anchor.target = elm; 
                }); 
            }
        }
        else {
            elm.style.visibility = "hidden";
        }
    }

    // 座標セット
    static move(e: HTMLElement, xx: number, yy: number) {
        e.style.left = xx + "px";
        e.style.top = yy + "px";
    }

    // 座標値取得
    static getPoint(name:string): Point {
        var elm: HTMLElement = document.getElementById(name);

        return new Point(elm.offsetLeft, elm.offsetTop);
    }

    // マウス移動処理
    static onMouseMove(e) {
        var elm: HTMLElement = Anchor.target;

        if (elm) {
            Anchor.move(elm,  e.clientX, e.clientY);
            if (Anchor.callback instanceof Function) {
                Anchor.callback();
            }
        }
    }

    // マウスアップ処理
    static onMouseUp(e) {
	    Anchor.target = null;
    }
}

// 射影変換(ホモグラフィ)クラス
class HomographyApp {
    private context;

    private width:number;
    private height:number;
    private ctlHeight: number;
    private image:HTMLImageElement;
    private degrees:HTMLInputElement;
    private drawType:HTMLInputElement[];
    private srcImageData:ImageData;
    private offset:Point = new Point(100, 150);
    private center:Point;
    private origin = [];
    private markers = [];
    private vertexs = [];
    private input;
   
    // コンストラクタ
    constructor (canvas: HTMLCanvasElement) {
	    
        this.width = canvas.width = window.innerWidth;
	    this.height = canvas.height = window.innerHeight;
        this.context = canvas.getContext("2d");

		this.image = new Image();
		this.image.src = "cat.jpg";
		this.image.onload = (() => this.imageReady(this));

        // コントローラの高さ
		this.ctlHeight = document.getElementById('controler').offsetHeight;

        // 描画方法(ラジオボタン)の変更イベントの設定
        this.drawType = (<HTMLInputElement[]><any>document.getElementsByName('drawType'));
        for (var i = 0; i < this.drawType.length; i++) {
    		this.drawType[i].addEventListener("change", (e) => { this.render(); });
        }

        // 角度(範囲スライダー)の変更イベントの設定
        this.degrees = <HTMLInputElement>document.getElementById('degrees');
        this.degrees.addEventListener("change", (e) => {
            var distanceDisp = <HTMLInputElement>document.getElementById('degreesDisp');
            distanceDisp.innerHTML = this.degrees.value;

            var degrees: number = this.degrees.value;
			var rad = -degrees / 180 * Math.PI;

            // 回転後のアンカー値をセット
            for (var i = 0; i < this.markers.length; i++) {
                var elm: HTMLElement = document.getElementById("p" + (i+1));
                var pt = this.rotate2d(this.vertexs[i].x - this.center.x, this.vertexs[i].y - this.center.y , rad);
                Anchor.move(elm, pt.x + this.offset.x + this.center.x, pt.y + this.offset.y + this.center.y);
            }

            this.render();
        });
    }

    // イメージ読込完了
    imageReady(that) {
        var ctx = this.context;
        var w = this.image.width;
        var h = this.image.height;

        // 初期描画および画像データ退避
        ctx.drawImage(this.image, this.offset.x, this.offset.y, w, h);
        this.input = ctx.getImageData(this.offset.x, this.offset.y, w, h);

        this.origin = [[0, 0],[w, 0],[w, h],[0, h]];
        this.markers = [[20, 0],[w-20, 0],[w, h],[0, h]]; //初期 台形
        
        // アンカー初期化
        this.initAnchor();
    }

    // 回転座標を取得
    rotate2d(x:number, y:number, rad:number) {
        var pt = new Point;
        pt.x =  Math.cos(rad) * x - Math.sin(rad) * y;
        pt.y =  Math.sin(rad) * x + Math.cos(rad) * y;

        return pt;
    }

    // 射影変換パラメータ取得(8次元連立方程式の8x8行列を4x4行列と2x2行列を組み合わせて解く)
    // http://sourceforge.jp/projects/nyartoolkit/document/tech_document0001/ja/tech_document0001.pdf
    getParam(src, dest):number[] {
        // X1 Y1 −X1x1 −Y1x1  A   x1 − C
        // X2 Y2 −X2x2 −Y2x2  B = x2 − C
        // X3 Y3 −X3x3 −Y3x3  G   x3 − C
        // X4 Y4 −X4x4 −Y4x4  H   x4 − C

        var Z = (val) =>{ return val == 0 ? 0.5 : val; }

        var X1: number = Z(src[0][0]);
        var X2: number = Z(src[1][0]);
        var X3: number = Z(src[2][0]);
        var X4: number = Z(src[3][0]);
        var Y1: number = Z(src[0][1]);
        var Y2: number = Z(src[1][1]);
        var Y3: number = Z(src[2][1]);
        var Y4: number = Z(src[3][1]);

        var x1: number = Z(dest[0][0]);
        var x2: number = Z(dest[1][0]);
        var x3: number = Z(dest[2][0]);
        var x4: number = Z(dest[3][0]);
        var y1: number = Z(dest[0][1]);
        var y2: number = Z(dest[1][1]);
        var y3: number = Z(dest[2][1]);
        var y4: number = Z(dest[3][1]);

        var tx = mat4.create(new Float32Array([
            X1, Y1, -X1 * x1, -Y1 * x1, // 1st column
            X2, Y2, -X2 * x2, -Y2 * x2, // 2nd column
            X3, Y3, -X3 * x3, -Y3 * x3, // 3rd column
            X4, Y4, -X4 * x4, -Y4 * x4  // 4th column
        ]));

        mat4.inverse(tx);

        // A = tx11x1 + tx12x2 + tx13x3 + tx14x4 − C(tx11 + tx12 + tx13 + tx14)
        // B = tx21x1 + tx22x2 + tx32x3 + tx42x4 − C(tx21 + tx22 + tx23 + tx24)
        // G = tx31x1 + tx23x2 + tx33x3 + tx43x4 − C(tx31 + tx32 + tx33 + tx34)
        // H = tx41x1 + tx24x2 + tx34x3 + tx44x4 − C(tx14 + tx24 + tx34 + tx44)
        var kx1 = tx[0] * x1 + tx[1] * x2 + tx[2] * x3 + tx[3] * x4;
        var kc1 = tx[0] + tx[1] + tx[2] + tx[3];
        var kx2 = tx[4] * x1 + tx[5] * x2 + tx[6] * x3 + tx[7] * x4;
        var kc2 = tx[4] + tx[5] + tx[6] + tx[7];
        var kx3 = tx[8] * x1 + tx[9] * x2 + tx[10] * x3 + tx[11] * x4;
        var kc3 = tx[8] + tx[9] + tx[10] + tx[11];
        var kx4 = tx[12] * x1 + tx[13] * x2 + tx[14] * x3 + tx[15] * x4;
        var kc4 = tx[12] + tx[13] + tx[14] + tx[15];

        //Y point
        var ty = mat4.create(new Float32Array([
            X1, Y1, -X1 * y1, -Y1 * y1, // 1st column
            X2, Y2, -X2 * y2, -Y2 * y2, // 2nd column
            X3, Y3, -X3 * y3, -Y3 * y3, // 3rd column
            X4, Y4, -X4 * y4, -Y4 * y4  // 4th column
        ]));

        mat4.inverse(ty);

        // D = ty11y1 + ty12y2 + ty13y3 + ty14y4 − F(ty11 + ty12 + ty13 + ty14)
        // E = ty21y1 + ty22y2 + ty23x3 + ty24y4 − F(ty21 + ty22 + ty23 + ty24)
        // G = ty31y1 + ty32y2 + ty33y3 + ty34y4 − F(ty31 + ty32 + ty33 + ty34)
        // H = ty41y1 + ty42y2 + ty43y3 + ty44y4 − F(ty41 + ty42 + ty43 + ty44)
        var ky1 = ty[0] * y1 + ty[1] * y2 + ty[2] * y3 + ty[3] * y4;
        var kf1 = ty[0] + ty[1] + ty[2] + ty[3];
        var ky2 = ty[4] * y1 + ty[5] * y2 + ty[6] * y3 + ty[7] * y4;
        var kf2 = ty[4] + ty[5] + ty[6] + ty[7];
        var ky3 = ty[8] * y1 + ty[9] * y2 + ty[10] * y3 + ty[11] * y4;
        var kf3 = ty[8] + ty[9] + ty[10] + ty[11];
        var ky4 = ty[12] * y1 + ty[13] * y2 + ty[14] * y3 + ty[15] * y4;
        var kf4 = ty[12] + ty[13] + ty[14] + ty[15];

		var	det_1:number = kc3 * (-kf4) - (-kf3) * kc4;
		if (det_1 == 0) {
			det_1=0.0001;
		}
		det_1 = 1 / det_1;

        var param:number[] = new Array(8);
        var C = (-kf4 * det_1) * (kx3 - ky3) + (kf3 * det_1) * (kx4 - ky4);
        var F = (-kc4 * det_1) * (kx3 - ky3) + (kc3 * det_1) * (kx4 - ky4);
		param[2] = C;             // C
		param[5] = F;             // F
		param[6] = kx3 - C * kc3; // G
		param[7] = kx4 - C * kc4; // H 
		param[0] = kx1 - C * kc1; // A
		param[1] = kx2 - C * kc2; // B
		param[3] = ky1 - F * kf1; // D
		param[4] = ky2 - F * kf2; // E

        return param;
    }

    // 描画用の射影変換パラメータ取得
    computeH(src, dest, min:Point, max:Point): number[] {

        // 自由変形のため、画像サイズを取得用に4角から最小値と最大値を求める
        for (var i = 0; i < dest.length; i++) {
            var x = dest[i][0];
            var y = dest[i][1];
            if (x > max.x) max.x = x;
            if (y > max.y) max.y = y;
            if (x < min.x) min.x = x;
            if (y < min.y) min.y = y;
        }

        // 左上を原点(0,0)にするため移動(最小値分)
        for (var i = 0; i < dest.length; i++) {
            dest[i][0] -= min.x;
            dest[i][1] -= min.y;
        }
         
        // 射影変換パラメータ取得
        var param = this.getParam(src, dest);

        // 描画用に射影変換の逆行列パラメータにする
        var mx = mat4.create(new Float32Array([
            param[0], param[1], param[2], 0, // 1st column
            param[3], param[4], param[5], 0, // 2nd column
            param[6], param[7], 1, 0,        // 3rd column
                   0, 0, 0, 1                // 4th column
        ]));
        mat4.inverse(mx);

        var inv_param = new Array(9);
        inv_param[0] = mx[0];
        inv_param[1] = mx[1];
        inv_param[2] = mx[2];
        inv_param[3] = mx[4];
        inv_param[4] = mx[5];
        inv_param[5] = mx[6];
        inv_param[6] = mx[8];
        inv_param[7] = mx[9];
        inv_param[8] = mx[10];

        return inv_param;
    }

    // 最近傍補間（ニアレストネイバー Nearest neighbor)
    drawNearest(ctx:CanvasRenderingContext2D, param, sx:number, sy:number, w:number, h:number){
        var imgW = this.image.width;
        var imgH = this.image.height;

        var output = ctx.createImageData(w, h);

        for(var i = 0; i < h; ++i){
            for(var j = 0; j < w; ++j){
                // u = (x*a + y*b + c) / (x*g + y*h + 1)
                // v = (x*d + y*e + f) / (x*g + y*h + 1)
           
                var tmp = j * param[6] + i * param[7] + param[8];
                var tmpX = (j * param[0] + i * param[1] + param[2]) / tmp;
                var tmpY = (j * param[3] + i * param[4] + param[5]) / tmp;

                var floorX = (tmpX + 0.5) | 0;
                var floorY = (tmpY + 0.5) | 0;

                if(floorX >= 0 && floorX < imgW && floorY >= 0 && floorY < imgH){
                    var pixelData = this.getPixel(this.input, floorX, floorY, imgW, imgH);
                    var R = pixelData.R;
                    var G = pixelData.G;
                    var B = pixelData.B;
                    this.setPixel(output, j, i, R, G, B, 255);
                }
            }
        }

        // ImageDataを描画
        ctx.putImageData(output, sx, sy);
    }

    // 双一次補間（バイリニア補間 Bilinear）
    drawBilinear(ctx:CanvasRenderingContext2D, param, sx:number, sy:number, w:number, h:number) {
        var imgW = this.image.width;
        var imgH = this.image.height;

        var output = ctx.createImageData(w, h);

        for (var i = 0; i < h; ++i) {
            for (var j = 0; j < w; ++j) {
                //u = (x*a + y*b + c) / (x*g + y*h + 1)
                //v = (x*d + y*e + f) / (x*g + y*h + 1)

                var tmp = j * param[6] + i * param[7] + param[8];
                var tmpX = (j * param[0] + i * param[1] + param[2]) / tmp;
                var tmpY = (j * param[3] + i * param[4] + param[5]) / tmp;

                var floorX = tmpX | 0;
                var floorY = tmpY | 0;

                if (floorX >= 0 && floorX < imgW && floorY >= 0 && floorY < imgH) {
                    // それぞれの方向からどの割合で足し合わせるか計算
                    var dx = tmpX - floorX;
                    var dy = tmpY - floorY;

                    var rgb00 = this.getPixel(this.input, floorX,     floorY    , imgW, imgH);
                    var rgb10 = this.getPixel(this.input, floorX + 1, floorY    , imgW, imgH);
                    var rgb01 = this.getPixel(this.input, floorX,     floorY + 1, imgW, imgH);
                    var rgb11 = this.getPixel(this.input, floorX + 1, floorY + 1, imgW, imgH);
                
                    var r0 = (rgb00.R * (1-dx)) + (rgb10.R * dx);
                    var r1 = (rgb01.R * (1-dx)) + (rgb11.R * dx);
                    var R = (r0 * (1-dy) + r1 * dy) | 0;

                    var g0 = (rgb00.G * (1-dx)) + (rgb10.G * dx);
                    var g1 = (rgb01.G * (1-dx)) + (rgb11.G * dx);
                    var G = (g0 * (1-dy) + g1 * dy) | 0;

                    var b0 = (rgb00.B * (1-dx)) + (rgb10.B * dx);
                    var b1 = (rgb01.B * (1-dx)) + (rgb11.B * dx);
                    var B = (b0 * (1-dy) + b1 * dy) | 0;

                    this.setPixel(output, j, i, R, G, B, 255);
                }
            }
        }

        // ImageDataを描画
        ctx.putImageData(output, sx, sy);
    }

    // 描画色を取得
    getPixel(imageData, x, y, w, h) {
        if (x == w) x = w-1;
        if (y == h) y = h-1;

        var pixels = imageData.data;
        var index = (imageData.width * y * 4) + (x * 4);
        if(index < 0 || index + 3 > pixels.length) return undefined;
        return { R:pixels[index + 0], G:pixels[index + 1], B:pixels[index + 2], A:pixels[index + 3] };
    }

    // 描画色をセット
    setPixel(imageData, x, y, r, g, b, a): Boolean {
        var pixels = imageData.data;
        var index = (imageData.width * y * 4) + (x * 4);
        if(index < 0 || index + 3 > pixels.length) return false;
        pixels[index + 0] = r;
        pixels[index + 1] = g;
        pixels[index + 2] = b;
        pixels[index + 3] = a;

        return true;
    }

    // 座標位置を表示
    drawInfo(pt) {
        for (var i = 0; i < pt.length; i++) {
            var elm: HTMLElement = document.getElementById("i" + (i+1));
            elm.innerText = 'Anchor' + (i+1) + '(' + pt[i].x + ',' + pt[i].y + ')';
        }
	}

    // アンカー初期化
    initAnchor(){
	    // 1  2
	    // 4  3
	    for (var i = 0; i < this.markers.length; i++) {
	        new Anchor((i+1).toString(), this.markers[i][0] + this.offset.x, this.markers[i][1] + this.offset.y, true);
	    }

        // マウスイベント
        document.addEventListener("mousemove", event => Anchor.onMouseMove(event));
	    document.addEventListener("mouseup", event => Anchor.onMouseUp(event));

        // マウス移動時のコールバック関数
	    this.render();
        Anchor.callback = () => this.render();
    }

    // フレーム処理
    render(){
        var ctx = this.context;
        var min: Point = new Point(0,0);
        var max: Point = new Point(0,0);
        var pt = [];
       

        // アンカー値をセット
        for (var i = 0; i < this.markers.length; i++) {
            pt.push(Anchor.getPoint("p" + (i + 1)));
            this.markers[i][0] = pt[i].x - this.offset.x;
            this.markers[i][1] = pt[i].y - this.offset.y;
        }

        // 描画用の射影変換パラメータを取得
        var inv_param = this.computeH(this.origin, this.markers, min, max);

        // 画像サイズをセット
        var w = max.x - min.x;
        var h = max.y - min.y;
        if (this.degrees.value == "0") {
            // 回転用に各制御点の中心点との差をセット
            this.center = new Point(w / 2, h / 2);
            this.vertexs.length = 0;
            for (var i = 0; i < this.markers.length; i++) {
                this.vertexs.push(new Point(this.markers[i][0], this.markers[i][1]));
            }
        }

        // 描画クリア
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 画像処理
        if(this.drawType[0].checked)
            // ニアレストネイバー
            this.drawNearest(ctx, inv_param, this.offset.x + min.x, (this.offset.y - this.ctlHeight) + min.y, w, h);
        else
            // バイリニア補間
            this.drawBilinear(ctx, inv_param, this.offset.x + min.x, (this.offset.y - this.ctlHeight) + min.y, w, h);

        // 座標位置表示
        this.drawInfo(pt);
    }
}


window.onload = () => {
    var app = new HomographyApp(<HTMLCanvasElement>document.getElementById('ctx'));
};