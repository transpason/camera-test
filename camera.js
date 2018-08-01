// スタートのボタン
const $start = document.getElementById('s');
// video要素
const $video = document.getElementById('v');

$start.addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => $video.srcObject = stream)
    .catch(err => alert(`${err.name} ${err.message}`));
}, false);

navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    console.log(JSON.stringify(devices, undefined, 2));
  });
