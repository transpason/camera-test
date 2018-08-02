// htmlの要素
const $canvas = document.getElementById('cvs'),
      $ctx = $canvas.getContext("2d"),
      $video = document.getElementById('vid');

// posenet設定
var imageScaleFactor = 0.5;
var outputStride = 16;
var flipHorizontal = false;
var scale = 1.0;
var color = 'pink';

// 選択可能なデバイスをログ出力
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    console.log(JSON.stringify(devices, undefined, 2));
  });

// カメラを起動
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then(stream => $video.srcObject = stream)
  .catch(err => alert(`${err.name} ${err.message}`));

// canvasに描画
requestAnimationFrame(draw);

posenet.load()
      .then(function(net){return net.estimateSinglePose($video, imageScaleFactor, flipHorizontal, outputStride)})
      .then(function(pose){
          var keypoints = pose.keypoints;
          for (let i = 0; i < keypoints.length; i++) {
            const keypoint = keypoints[i];
            const {y, x} = keypoint.position;
            drawPoint($ctx, y * scale, x * scale, 3, color);
          }
      });

function draw() {
  $canvas.width  = window.innerWidth;
  $canvas.height = window.innerHeight;
  $ctx.drawImage($video, 0, 0);

  requestAnimationFrame(draw);
}
