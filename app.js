var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();
var Anchor = (function () {
    function Anchor(no, x, y, v) {
        var elm = document.getElementById("p" + no);
        Anchor.move(elm, x, y);
        if(v) {
            if(Anchor.target == null) {
                elm.addEventListener('mousedown', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    Anchor.target = elm;
                });
            }
        } else {
            elm.style.visibility = "hidden";
        }
    }
    Anchor.target = null;
    Anchor.target2 = null;
    Anchor.target3 = null;
    Anchor.callback = null;
    Anchor.move = function move(e, xx, yy) {
        e.style.left = xx + "px";
        e.style.top = yy + "px";
    }
    Anchor.getPoint = function getPoint(name) {
        var elm = document.getElementById(name);
        return new Point(elm.offsetLeft, elm.offsetTop);
    }
    Anchor.onMouseMove = function onMouseMove(e) {
        var elm = Anchor.target;
        if(elm) {
            Anchor.move(elm, e.clientX, e.clientY);
            if(Anchor.callback instanceof Function) {
                Anchor.callback();
            }
        }
    }
    Anchor.onMouseUp = function onMouseUp(e) {
        Anchor.target = null;
    }
    return Anchor;
})();
var HomographyApp = (function () {
    function HomographyApp(canvas) {
        var _this = this;
        this.offset = new Point(100, 150);
        this.origin = [];
        this.markers = [];
        this.vertexs = [];
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;
        this.context = canvas.getContext("2d");
        this.image = new Image();
        this.image.src = "cat.jpg";
        this.image.onload = (function () {
            return _this.imageReady(_this);
        });
        this.ctlHeight = document.getElementById('controler').offsetHeight;
        this.drawType = (document.getElementsByName('drawType'));
        for(var i = 0; i < this.drawType.length; i++) {
            this.drawType[i].addEventListener("change", function (e) {
                _this.render();
            });
        }
        this.degrees = document.getElementById('degrees');
        this.degrees.addEventListener("change", function (e) {
            var distanceDisp = document.getElementById('degreesDisp');
            distanceDisp.innerHTML = _this.degrees.value;
            var degrees = _this.degrees.value;
            var rad = -degrees / 180 * Math.PI;
            for(var i = 0; i < _this.markers.length; i++) {
                var elm = document.getElementById("p" + (i + 1));
                var pt = _this.rotate2d(_this.vertexs[i].x - _this.center.x, _this.vertexs[i].y - _this.center.y, rad);
                Anchor.move(elm, pt.x + _this.offset.x + _this.center.x, pt.y + _this.offset.y + _this.center.y);
            }
            _this.render();
        });
    }
    HomographyApp.prototype.imageReady = function (that) {
        var ctx = this.context;
        var w = this.image.width;
        var h = this.image.height;
        ctx.drawImage(this.image, this.offset.x, this.offset.y, w, h);
        this.input = ctx.getImageData(this.offset.x, this.offset.y, w, h);
        this.origin = [
            [
                0, 
                0
            ], 
            [
                w, 
                0
            ], 
            [
                w, 
                h
            ], 
            [
                0, 
                h
            ]
        ];
        this.markers = [
            [
                20, 
                0
            ], 
            [
                w - 20, 
                0
            ], 
            [
                w, 
                h
            ], 
            [
                0, 
                h
            ]
        ];
        this.initAnchor();
    };
    HomographyApp.prototype.rotate2d = function (x, y, rad) {
        var pt = new Point();
        pt.x = Math.cos(rad) * x - Math.sin(rad) * y;
        pt.y = Math.sin(rad) * x + Math.cos(rad) * y;
        return pt;
    };
    HomographyApp.prototype.getParam = function (src, dest) {
        var Z = function (val) {
            return val == 0 ? 0.5 : val;
        };
        var X1 = Z(src[0][0]);
        var X2 = Z(src[1][0]);
        var X3 = Z(src[2][0]);
        var X4 = Z(src[3][0]);
        var Y1 = Z(src[0][1]);
        var Y2 = Z(src[1][1]);
        var Y3 = Z(src[2][1]);
        var Y4 = Z(src[3][1]);
        var x1 = Z(dest[0][0]);
        var x2 = Z(dest[1][0]);
        var x3 = Z(dest[2][0]);
        var x4 = Z(dest[3][0]);
        var y1 = Z(dest[0][1]);
        var y2 = Z(dest[1][1]);
        var y3 = Z(dest[2][1]);
        var y4 = Z(dest[3][1]);
        var tx = mat4.create(new Float32Array([
            X1, 
            Y1, 
            -X1 * x1, 
            -Y1 * x1, 
            X2, 
            Y2, 
            -X2 * x2, 
            -Y2 * x2, 
            X3, 
            Y3, 
            -X3 * x3, 
            -Y3 * x3, 
            X4, 
            Y4, 
            -X4 * x4, 
            -Y4 * x4
        ]));
        mat4.inverse(tx);
        var kx1 = tx[0] * x1 + tx[1] * x2 + tx[2] * x3 + tx[3] * x4;
        var kc1 = tx[0] + tx[1] + tx[2] + tx[3];
        var kx2 = tx[4] * x1 + tx[5] * x2 + tx[6] * x3 + tx[7] * x4;
        var kc2 = tx[4] + tx[5] + tx[6] + tx[7];
        var kx3 = tx[8] * x1 + tx[9] * x2 + tx[10] * x3 + tx[11] * x4;
        var kc3 = tx[8] + tx[9] + tx[10] + tx[11];
        var kx4 = tx[12] * x1 + tx[13] * x2 + tx[14] * x3 + tx[15] * x4;
        var kc4 = tx[12] + tx[13] + tx[14] + tx[15];
        var ty = mat4.create(new Float32Array([
            X1, 
            Y1, 
            -X1 * y1, 
            -Y1 * y1, 
            X2, 
            Y2, 
            -X2 * y2, 
            -Y2 * y2, 
            X3, 
            Y3, 
            -X3 * y3, 
            -Y3 * y3, 
            X4, 
            Y4, 
            -X4 * y4, 
            -Y4 * y4
        ]));
        mat4.inverse(ty);
        var ky1 = ty[0] * y1 + ty[1] * y2 + ty[2] * y3 + ty[3] * y4;
        var kf1 = ty[0] + ty[1] + ty[2] + ty[3];
        var ky2 = ty[4] * y1 + ty[5] * y2 + ty[6] * y3 + ty[7] * y4;
        var kf2 = ty[4] + ty[5] + ty[6] + ty[7];
        var ky3 = ty[8] * y1 + ty[9] * y2 + ty[10] * y3 + ty[11] * y4;
        var kf3 = ty[8] + ty[9] + ty[10] + ty[11];
        var ky4 = ty[12] * y1 + ty[13] * y2 + ty[14] * y3 + ty[15] * y4;
        var kf4 = ty[12] + ty[13] + ty[14] + ty[15];
        var det_1 = kc3 * (-kf4) - (-kf3) * kc4;
        if(det_1 == 0) {
            det_1 = 0.0001;
        }
        det_1 = 1 / det_1;
        var param = new Array(8);
        var C = (-kf4 * det_1) * (kx3 - ky3) + (kf3 * det_1) * (kx4 - ky4);
        var F = (-kc4 * det_1) * (kx3 - ky3) + (kc3 * det_1) * (kx4 - ky4);
        param[2] = C;
        param[5] = F;
        param[6] = kx3 - C * kc3;
        param[7] = kx4 - C * kc4;
        param[0] = kx1 - C * kc1;
        param[1] = kx2 - C * kc2;
        param[3] = ky1 - F * kf1;
        param[4] = ky2 - F * kf2;
        return param;
    };
    HomographyApp.prototype.computeH = function (src, dest, min, max) {
        for(var i = 0; i < dest.length; i++) {
            var x = dest[i][0];
            var y = dest[i][1];
            if(x > max.x) {
                max.x = x;
            }
            if(y > max.y) {
                max.y = y;
            }
            if(x < min.x) {
                min.x = x;
            }
            if(y < min.y) {
                min.y = y;
            }
        }
        for(var i = 0; i < dest.length; i++) {
            dest[i][0] -= min.x;
            dest[i][1] -= min.y;
        }
        var param = this.getParam(src, dest);
        var mx = mat4.create(new Float32Array([
            param[0], 
            param[1], 
            param[2], 
            0, 
            param[3], 
            param[4], 
            param[5], 
            0, 
            param[6], 
            param[7], 
            1, 
            0, 
            0, 
            0, 
            0, 
            1
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
    };
    HomographyApp.prototype.drawNearest = function (ctx, param, sx, sy, w, h) {
        var imgW = this.image.width;
        var imgH = this.image.height;
        var output = ctx.createImageData(w, h);
        for(var i = 0; i < h; ++i) {
            for(var j = 0; j < w; ++j) {
                var tmp = j * param[6] + i * param[7] + param[8];
                var tmpX = (j * param[0] + i * param[1] + param[2]) / tmp;
                var tmpY = (j * param[3] + i * param[4] + param[5]) / tmp;
                var floorX = (tmpX + 0.5) | 0;
                var floorY = (tmpY + 0.5) | 0;
                if(floorX >= 0 && floorX < imgW && floorY >= 0 && floorY < imgH) {
                    var pixelData = this.getPixel(this.input, floorX, floorY, imgW, imgH);
                    var R = pixelData.R;
                    var G = pixelData.G;
                    var B = pixelData.B;
                    this.setPixel(output, j, i, R, G, B, 255);
                }
            }
        }
        ctx.putImageData(output, sx, sy);
    };
    HomographyApp.prototype.drawBilinear = function (ctx, param, sx, sy, w, h) {
        var imgW = this.image.width;
        var imgH = this.image.height;
        var output = ctx.createImageData(w, h);
        for(var i = 0; i < h; ++i) {
            for(var j = 0; j < w; ++j) {
                var tmp = j * param[6] + i * param[7] + param[8];
                var tmpX = (j * param[0] + i * param[1] + param[2]) / tmp;
                var tmpY = (j * param[3] + i * param[4] + param[5]) / tmp;
                var floorX = tmpX | 0;
                var floorY = tmpY | 0;
                if(floorX >= 0 && floorX < imgW && floorY >= 0 && floorY < imgH) {
                    var dx = tmpX - floorX;
                    var dy = tmpY - floorY;
                    var rgb00 = this.getPixel(this.input, floorX, floorY, imgW, imgH);
                    var rgb10 = this.getPixel(this.input, floorX + 1, floorY, imgW, imgH);
                    var rgb01 = this.getPixel(this.input, floorX, floorY + 1, imgW, imgH);
                    var rgb11 = this.getPixel(this.input, floorX + 1, floorY + 1, imgW, imgH);
                    var r0 = (rgb00.R * (1 - dx)) + (rgb10.R * dx);
                    var r1 = (rgb01.R * (1 - dx)) + (rgb11.R * dx);
                    var R = (r0 * (1 - dy) + r1 * dy) | 0;
                    var g0 = (rgb00.G * (1 - dx)) + (rgb10.G * dx);
                    var g1 = (rgb01.G * (1 - dx)) + (rgb11.G * dx);
                    var G = (g0 * (1 - dy) + g1 * dy) | 0;
                    var b0 = (rgb00.B * (1 - dx)) + (rgb10.B * dx);
                    var b1 = (rgb01.B * (1 - dx)) + (rgb11.B * dx);
                    var B = (b0 * (1 - dy) + b1 * dy) | 0;
                    this.setPixel(output, j, i, R, G, B, 255);
                }
            }
        }
        ctx.putImageData(output, sx, sy);
    };
    HomographyApp.prototype.getPixel = function (imageData, x, y, w, h) {
        if(x == w) {
            x = w - 1;
        }
        if(y == h) {
            y = h - 1;
        }
        var pixels = imageData.data;
        var index = (imageData.width * y * 4) + (x * 4);
        if(index < 0 || index + 3 > pixels.length) {
            return undefined;
        }
        return {
            R: pixels[index + 0],
            G: pixels[index + 1],
            B: pixels[index + 2],
            A: pixels[index + 3]
        };
    };
    HomographyApp.prototype.setPixel = function (imageData, x, y, r, g, b, a) {
        var pixels = imageData.data;
        var index = (imageData.width * y * 4) + (x * 4);
        if(index < 0 || index + 3 > pixels.length) {
            return false;
        }
        pixels[index + 0] = r;
        pixels[index + 1] = g;
        pixels[index + 2] = b;
        pixels[index + 3] = a;
        return true;
    };
    HomographyApp.prototype.drawInfo = function (pt) {
        for(var i = 0; i < pt.length; i++) {
            var elm = document.getElementById("i" + (i + 1));
            elm.innerText = 'Anchor' + (i + 1) + '(' + pt[i].x + ',' + pt[i].y + ')';
        }
    };
    HomographyApp.prototype.initAnchor = function () {
        var _this = this;
        for(var i = 0; i < this.markers.length; i++) {
            new Anchor((i + 1).toString(), this.markers[i][0] + this.offset.x, this.markers[i][1] + this.offset.y, true);
        }
        document.addEventListener("mousemove", function (event) {
            return Anchor.onMouseMove(event);
        });
        document.addEventListener("mouseup", function (event) {
            return Anchor.onMouseUp(event);
        });
        this.render();
        Anchor.callback = function () {
            return _this.render();
        };
    };
    HomographyApp.prototype.render = function () {
        var ctx = this.context;
        var min = new Point(0, 0);
        var max = new Point(0, 0);
        var pt = [];
        for(var i = 0; i < this.markers.length; i++) {
            pt.push(Anchor.getPoint("p" + (i + 1)));
            this.markers[i][0] = pt[i].x - this.offset.x;
            this.markers[i][1] = pt[i].y - this.offset.y;
        }
        var inv_param = this.computeH(this.origin, this.markers, min, max);
        var w = max.x - min.x;
        var h = max.y - min.y;
        if(this.degrees.value == "0") {
            this.center = new Point(w / 2, h / 2);
            this.vertexs.length = 0;
            for(var i = 0; i < this.markers.length; i++) {
                this.vertexs.push(new Point(this.markers[i][0], this.markers[i][1]));
            }
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if(this.drawType[0].checked) {
            this.drawNearest(ctx, inv_param, this.offset.x + min.x, (this.offset.y - this.ctlHeight) + min.y, w, h);
        } else {
            this.drawBilinear(ctx, inv_param, this.offset.x + min.x, (this.offset.y - this.ctlHeight) + min.y, w, h);
        }
        this.drawInfo(pt);
    };
    return HomographyApp;
})();
window.onload = function () {
    var app = new HomographyApp(document.getElementById('ctx'));
};
//@ sourceMappingURL=app.js.map
