// video要素
const $canvas = document.getElementById('cvs'),
      $ctx = $canvas.getContext("2d"),
      $video = document.getElementById('vid');

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

function draw() {
  $canvas.width  = window.innerWidth;
  $canvas.height = window.innerHeight;
  $ctx.drawImage($video, 0, 0);

  requestAnimationFrame(draw);
}
