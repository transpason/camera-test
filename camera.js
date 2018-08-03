const videoWidth = 370;
const videoHeight = 660;
const color = 'orange';
const lineWidth = 2;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}

// Loads a the camera to be used in the demo
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      console.log(JSON.stringify(devices, undefined, 2));
    });

  const video = document.getElementById('vid');
  video.height = videoHeight;
  video.width = videoWidth;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
//      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById('cvs');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext('2d');
  // since images are being fed from a webcam
  const flipHorizontal = true;

  async function poseDetectionFrame() {
    // Scale an image down to a certain factor. Too large of an image will slow
    // down the GPU
    const imageScaleFactor = 0.5;
    const outputStride = 16;
    const maxPoseDetections = 2;
    const minPoseConfidence = 0.15;
    const minPartConfidence = 0.1;

    let msg = document.getElementById('msg');
    let poses = [];
    poses = await net.estimateMultiplePoses(
        video, imageScaleFactor, flipHorizontal, outputStride, maxPoseDetections
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // For each pose (i.e. person) detected in an image, loop through the poses
    // and draw the resulting skeleton and keypoints if over certain confidence
    // scores
    poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {
        drawKeypoints(keypoints, minPartConfidence, ctx);
        drawSkeleton(keypoints, minPartConfidence, ctx);

        if(checkPose(keypoints)){
          msg.textContent = 'Banzai!';
          canvas.toBlob(function(blob) {
            var img = document.getElementById('capture');
            img.src = window.URL.createObjectURL(blob);
          }, 'image/jpeg', 0.95);
          
        } else {
          msg.textContent = 'Please hands up.';
        }
      }
    });

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

/**
 * Kicks off the demo by loading the posenet model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */
async function bindPage() {
  // Load the PoseNet model weights with architecture 0.75
  const net = await posenet.load(0.5);

  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    let info = document.getElementById('info');
    // info.textContent = 'this browser does not support video capture,' +
    //     'or this device does not have a camera';
    info.textContent = e.name + ' ' + e.massage;
    info.style.display = 'block';
    throw e;
  }

  detectPoseInRealTime(video, net);
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(toTuple(keypoints[0].position),
      toTuple(keypoints[1].position), color, scale, ctx);
  });
}

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function toTuple({y, x}) {
  return [y, x];
}

function checkPose(keypoints){
  // 万歳しているときはtrueを返す
  var noseY = 0;
  var leftWristY = 0;
  var rightWristY = 0;
  var isHandsUp = false;
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];
    if(keypoint.part == "nose"){
      noseY = keypoint.position.y;
    } else if(keypoint.part == "leftWrist"){
      leftWristY = keypoint.position.y;
    } else if(keypoint.part == "rightWrist"){
      rightWristY = keypoint.position.y;
    }
  }
  if(noseY > leftWristY && noseY > rightWristY){
    isHandsUp = true;
    console.log("noseY: " + noseY + " leftWristY:" + leftWristY + " rightWristY: " + rightWristY);
  }
  return isHandsUp;
}

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// kick off the demo
bindPage();
