Homography
==========
射影変換

4つの点からホモグラフィ行列(平面射影変換行列)を使って自由変形を行います。  
shogo82148氏の[CSS3 Transform 3D Test](http://jsdo.it/shogo82148/vdlv)では、CSSで実現していましたが  
Canvasを使った方法はどうすれば出来るのか挑戦してみました。  
行列演算ライブラリには、glMatrixを採用しました。

アルゴリズムに関しては、下記サイトを参照してください。  
[射影変換(ホモグラフィ)について理解してみる](http://yaju3d.hatenablog.jp/entry/2013/08/04/152524)  

jsdo.itには[テクスチャマッピング入門 射影変換(ホモグラフィ)](http://jsdo.it/yaju3D/zUk5)で投稿しています。

■パラメータ説明  
degreea 回転角度  
0度の時に回転させる形状を保存します。  
0度以外で形状を変形しても元に戻ってしまいます。  
本当は、形状を回転途中で変形しても保持して回転出来るようにしたかったんですが、  
面倒くさそうだし、今回の目的とは違うので追求するのはやめました。  
  
    
drawType 画像補間方法  
・Nearest(ニアレストネイバー)    
・Bilinear(バイリニア補間)  
  
  
