// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
// Global variables
const canvas = document.getElementById("asg2");
const mouseDataDiv = document.getElementById("mouseData");
const playerPosDiv = document.getElementById("playerPos");
const playerAngleDiv = document.getElementById("playerAngle");
let playerAngle = -90;
let g_lightOn;

let gl;
let a_Position;
// NOTE: color variable that will be used to store the color of the shapes
let u_FragColor;
let u_Size;
let u_baseColor;
let u_texColorWeight;
// NOTE: this matrix is used to rotate and transalte cubes
let a_UV;
let g_yellowAngle = 0;
let g_purpleAngle = 0;
let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;
let g_yellowAnimation = false;

//NOTE: camera variables
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_NormalMatrix;
let u_ProjectionMatrix;
let g_globalAngle = 180;
let g_camera;

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  attribute vec3 a_Normal;
  varying vec3 v_Normal;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec4 v_VertPos;

  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    // v_Normal = a_Normal;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal,1)));
    v_VertPos = u_ModelMatrix * a_Position;
  }
`;

// Fragment shader program

// uniform int u_whichTexture;
// uniform float t;
var FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
varying vec3 v_Normal;
uniform vec4 u_FragColor;
uniform int u_whichTexture;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform float colorMixerIntensity;
uniform float u_texColorWeight; 
uniform vec4 u_baseColor; 


uniform vec3 u_lightPos;
varying vec4 v_VertPos;
uniform vec3 u_cameraPos;
uniform bool u_lightOn;




void main() {
vec4 colorMixer;
if (u_whichTexture == -5){
gl_FragColor = vec4((v_Normal+1.0)/2.0,1.0);
}
else if(u_whichTexture == -4){
gl_FragColor = vec4(1,.2,.2,1);

}else if(u_whichTexture == -3) {
gl_FragColor = vec4(v_UV, 1.0, 1.0); 
}

else if(u_whichTexture == -2){
gl_FragColor = texture2D(u_Sampler2, v_UV); 
}
else if(u_whichTexture == -1){
gl_FragColor = texture2D(u_Sampler1, v_UV); 
}

else if(u_whichTexture == 0){
gl_FragColor = texture2D(u_Sampler0, v_UV); 
}
else if(u_whichTexture == 1){
gl_FragColor = u_FragColor * u_texColorWeight;
}
else if(u_whichTexture ==2){

gl_FragColor = u_FragColor;
}
else if(u_whichTexture ==3){
 gl_FragColor = (1.0 -  u_texColorWeight) * u_baseColor + u_texColorWeight * colorMixer;

}

vec3 lightVector =    u_lightPos -vec3(v_VertPos) ;
float r = length(lightVector);
 // if (r<1.0){
 // gl_FragColor = vec4(1,0,0,1);
 // } else if (r<2.0){
 //  gl_FragColor = vec4(0,1,0,1);
 // }

// N dot L
vec3 L = normalize(lightVector);
vec3 N = normalize(v_Normal);
float nDotL = max(dot(N,L), 0.0);

// Reflection
vec3 R = reflect(-L, N);

// eye 
vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

// Specular
float specular = pow(max(dot(E,R),0.0),10.0);

vec3 diffuse = vec3(gl_FragColor) * nDotL *0.7;
vec3 ambient = vec3(gl_FragColor) * 0.3;
if(u_lightOn){
gl_FragColor = vec4(specular+ diffuse + ambient, 1.0);
}
// gl_FragColor = gl_FragColor * nDotL;
// gl_FragColor.a = 1.0;
// gl_FragColor = vec4(vec3(gl_FragColor)/(r*r),1);

}`;
// if(u_whichTexture != -5){
// gl_FragColor = colorMixer * u_texColorWeight;
// gl_FragColor = (1.0 -  u_texColorWeight) * u_baseColor + u_texColorWeight * colorMixer;
//
// }
// NOTE: this code if for the using a live texuture:
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture = 0;

//NOTE: lighting attributes and variables
let a_Normal;
let g_normalON;
let g_lightPos = [0, 0, -1];
let lightAnimationOn = true;
var u_lightPos;
var u_cameraPos;
let u_lightOn;

function setupWebGL() {
  // Rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}
function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }
  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (a_Normal < 0) {
    console.log("Failed to get the storage location of a_Normal");
    return;
  }
  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (a_UV < 0) {
    console.log("Failed to get the storage location of a_UV");
    return;
  }
  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  if (!u_Sampler0) {
    console.log("Failed to get the storage location of u_Sampler0");
    return false;
  }
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  if (!u_Sampler1) {
    console.log("Failed to get the storage location of u_Sampler1");
    return false;
  }
  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
  if (!u_Sampler2) {
    console.log("Failed to get the storage location of u_Sampler2");
    return false;
  }
  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  if (!u_whichTexture) {
    console.log("Failed to get the storage location of u_whichTexture");
    return false;
  }

  // NOTE: had to comment out because it was unused to the u_FragColor is tossed out by the compiler

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }
  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  if (!u_NormalMatrix) {
    console.log("Failed to get the storage location of u_NormalMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  if (!u_ViewMatrix) {
    console.log("Failed to get the storage location of u_ViewMatrix");
    return;
  }
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_ProjectionMatrix");
    return;
  }
  u_texColorWeight = gl.getUniformLocation(gl.program, "u_texColorWeight");
  if (!u_texColorWeight) {
    console.log("failed to get the storage location of u_texcolorweight");
    return;
  } else {
    console.log("connected the u_texColorWeight");
  }

  u_baseColor = gl.getUniformLocation(gl.program, "u_baseColor");
  if (!u_baseColor) {
    console.log("Failed to get the storage location of u_baseColor");
    return;
  }
  u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_lightPos");
    return;
  }
  u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
  if (!u_cameraPos) {
    console.log("Failed to get the storage location of u_cameraPos");
    return;
  }
  u_lightOn = gl.getUniformLocation(gl.program, "u_lightOn");
  if (!u_lightOn) {
    console.log("Failed to get the storage location of u_lightOn");
    return;
  }
}

// NOTE: texture handling
function initTextures() {
  // Get the storage location of u_Sampler
  var skyImageObj = new Image(); // Create the image object
  var image1 = new Image(); // Create the image object
  var image2 = new Image(); // Create the image object
  if (!skyImageObj) {
    console.log("Failed to create the image object");
    return false;
  }
  if (!image1) {
    console.log("Failed to create the image object");
    return false;
  }
  if (!image2) {
    console.log("Failed to create the image object");
    return false;
  }
  // Register the event handler to be called on loading an image
  skyImageObj.onload = function () {
    sendTextureToTEXTURE0(skyImageObj);
  };
  image1.onload = function () {
    sendTextureToTEXTURE1(image1);
  };
  image2.onload = function () {
    sendTextureToTEXTURE2(image2);
  };
  // Tell the browser to load an image
  skyImageObj.src = "sky1.jpg";
  image1.src = "grass1.png";
  image2.src = "wall.jpg";

  // NOTE: texture needs to be a power of 2
  //can add more texturese later here
  return true;
}

function sendTextureToGLSL(image, sampler) {
  var texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(sampler, 0);
  // gl.uniform1i(u_Sampler1, 0);
  // if (sampler == 0) {
  //   gl.uniform1i(u_Sampler0, 0);
  // } else if (sampler == 0) {
  //   gl.uniform1i(u_Sampler1, 0);
  // }
  console.log(sampler);

  // gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>

  // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  console.log("finished loadTexture");
}

function sendTextureToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log("Finished loadTexture");
}
// ================================SKY
function sendTextureToTEXTURE1(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE1);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Set the texture unit 1 to the sampler
  gl.uniform1i(u_Sampler1, 1);

  console.log("Finished loadTexture1");
}

function sendTextureToTEXTURE2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE2);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler2, 2);

  console.log("Finished loadTexture2");
}
// NOTE: handles the ui part and cursor moments;

function changeBaseColorAndIntensity(rgba, textureIntensity) {
  gl.uniform4f(u_baseColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  gl.uniform1f(u_texColorWeight, textureIntensity);
}
function lockCursor() {
  canvas.requestPointerLock =
    canvas.requestPointerLock ||
    canvas.mozRequestPointerLock ||
    canvas.webkitRequestPointerLock;
  if (canvas.requestPointerLock) {
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    canvas.requestPointerLock();
  }
}

// Pointer Lock Change Handler
function handlePointerLockChange() {
  if (document.pointerLockElement === canvas) {
    document.body.style.overflow = "hidden";
    // Cursor is locked
  } else {
    document.body.style.overflow = "auto";
    // Cursor is unlocked
  }
}

let lastX = canvas.width / 2;
let lastY = canvas.height / 2;
function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // sets up the shadow programs and also the
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  g_camera = new Camera();
  document.onkeydown = keydown;
  document.onkeyup = keyup;

  initTextures();

  changeBaseColorAndIntensity([1, 0, 0, 1], 0.8);

  // initTextures("dirt.jpg", u_Sampler0);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(tick);
  playerPosDiv.textContent = `player pos x: ${Math.round(g_camera.eye.elements[0])}---y:${Math.round(g_camera.eye.elements[2])}`;
}

// this function is the function that will instiate to start the scene
function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
}
let g_eye = [0, 0, 3];
let g_at = [0, 0, -100];
var g_up = [0, 1, 0];

let playerPosX = 0;
let playerPosY = 0;
let tracerBlockX1 = 0;
let tracerBlockY1 = 0;

function renderAllShapes() {
  var projMat = g_camera.projMat;
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // Pass the view matrix
  var viewMat = g_camera.viewMat;
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  //Pass the light position ot GLSL
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform1i(u_lightOn, g_lightOn);
  // gl.uniform3f(
  //   u_cameraPos,
  //   g_camera.eye.elements[0],
  //   g_camera.eye.elements[1],
  //   g_camera.eye.elements[2],
  // );

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // NOTE: draws a new cube and scales and translates it color is red

  drawPenguin();
  var sphere = new Sphere();
  sphere.color = [0.9, 0.6, 0.95, 1];
  sphere.textureNum = 0;
  if (g_normalON) sphere.textureNum = -3;
  sphere.matrix.scale(0.5, 0.5, 0.5);
  sphere.matrix.translate(1.5, 0.75, -1.25);
  sphere.render();

  // Draw the light
  var light = new Cube();
  light.color = [2, 2, 0, 1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.render();

  drawFloor(-0.5, 0, -0.9);
  renderSky(-0.5, -0.3, -0.9);
  tracker();
}
function drawFloor(x, y, z) {
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0];
  floor.textureNum = -1;
  floor.matrix.translate(0, -0.4, 0.0);
  floor.matrix.translate(0, -0.45, 0.0);
  floor.matrix.scale(5, 0, 6);
  floor.matrix.translate(x, y, z);
  floor.render();
}

let block = 0;
let maxZ = 10;
function changeBlock() {
  maxZ = g_camera.eye.elements[2];
  // NOTE: offset by default g_camera.elements[2] and also the offset in drawwlls
  g_map[tracerBlockX1][tracerBlockY1] = block;
}
function tracker() {
  maxZ = g_camera.eye.elements[2];

  let x = Math.ceil(g_camera.eye.elements[0] + 9);
  let y = Math.ceil(maxZ + 9);
  playerPosX = x;
  playerPosY = y;
  whereToDeleteAndAddBlock(normalizeAngle(playerAngle));

  // playerPosDiv.textContent = `${g_camera.eye.elements[0].toFixed(3)}---${g_camera.eye.elements[1].toFixed(3)}---${g_camera.eye.elements[2].toFixed(3)}`;
  // playerPosDiv.textContent = `player pos x: ${Math.round(g_camera.eye.elements[0])}---y:${Math.round(g_camera.eye.elements[2])}`;
}

function renderSky(x, y, z) {
  changeBaseColorAndIntensity([0, 0, 0, 1], 1);
  var sky = new Cube();
  // sky.textureNum = -4;
  // sky.texureNum = -5;
  if (g_normalON) {
    sky.textureNum = -5;
  } else {
    sky.textureNum = 1;
  }
  sky.color = [0.67, 0.67, 0.67, 1.0];

  sky.matrix.scale(-3, -3, 6);
  sky.matrix.translate(x, y, z);
  sky.render();
}

let lastFPSUpdate = 0;
const fpsUpdateInterval = 1.0; // update every second
let accumulatedFPS = 0;
let frameCount = 0;
let then = 0;

function tick(now) {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  requestAnimationFrame(tick);

  now *= 0.001; // convert to seconds
  const deltaTime = now - then; // compute time since last frame
  then = now; // remember time for next frame

  // Accumulate frames and their time intervals
  accumulatedFPS += 1 / deltaTime;
  frameCount++;

  // Check if at least one second has elapsed since the last FPS update
  if (now - lastFPSUpdate >= fpsUpdateInterval) {
    const averagedFPS = accumulatedFPS / frameCount; // calculate average FPS over the interval
    fpsElem.textContent = averagedFPS.toFixed(1); // update fps display
    lastFPSUpdate = now; // reset the timer
    accumulatedFPS = 0; // reset accumulated FPS
    frameCount = 0; // reset frame count
  }

  updateAnimationAngle();

  // renderScene();
  renderAllShapes();
}

function updateAnimationAngle() {
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  // console.log(g_seconds);
  //
  // NOTE: light animation or off
  if (lightAnimationOn) {
    g_lightPos[0] = Math.cos(g_seconds);
  }
}

// NOTE: cursor movements

// Track Cursor Movement
let fpsElem;

function normalizeAngle(angle) {
  let normalizedAngle = angle % 360;
  if (normalizedAngle < 0) {
    normalizedAngle += 360;
  }
  return normalizedAngle;
}

function whereToDeleteAndAddBlock(angle) {
  if ((337.5 < angle && angle < 360) || (0 < angle && angle < 22.5)) {
    // Your code here
    tracerBlockX1 = playerPosX;
    tracerBlockY1 = playerPosY - 1;
  } else if (22.5 < angle && angle < 67.5) {
    tracerBlockX1 = playerPosX + 1;
    tracerBlockY1 = playerPosY - 1;
  } else if (67.5 < angle && angle < 112.5) {
    tracerBlockX1 = playerPosX + 1;
    tracerBlockY1 = playerPosY;
  } else if (112.5 < angle && angle < 157.5) {
    tracerBlockX1 = playerPosX + 1;
    tracerBlockY1 = playerPosY + 1;
  } else if (157.5 < angle && angle < 202.5) {
    tracerBlockX1 = playerPosX;
    tracerBlockY1 = playerPosY + 1;
  } else if (202.5 < angle && angle < 247.5) {
    tracerBlockX1 = playerPosX - 1;
    tracerBlockY1 = playerPosY + 1;
  } else if (247.5 < angle && angle < 292.5) {
    tracerBlockX1 = playerPosX - 1;
    tracerBlockY1 = playerPosY;
  } else if (292.5 < angle && angle < 337.5) {
    tracerBlockX1 = playerPosX - 1;
    tracerBlockY1 = playerPosY - 1;
  }
}

function handleMouseMove(event) {
  if (document.pointerLockElement === canvas) {
    const deltaX = event.movementX;
    const deltaY = event.movementY;

    // Update player rotation or camera based on deltaX and deltaY
    // (This part will depend on your specific game logic)

    lastX = event.clientX;
    lastY = event.clientY;
    if (event.movementX < 0) {
      // NOTE:have to invert coordinate to correspond to mouse movements
      g_camera.panLeft(-event.movementX * 0.6);
    }
    if (event.movementX > 0) {
      g_camera.panRight(-event.movementX * 0.6);
    }
    g_camera.panY(-event.movementY);
    let normalizeAng = normalizeAngle(playerAngle);
    playerAngle = playerAngle + event.movementX * 0.6;

    playerAngleDiv.textContent = `player Angle ${normalizeAng}`;

    // NOTE: block in front = -1 of playerPos
  }
}

// NOTE: disabled hand
// function handleMouseClick(event) {
//   if (document.pointerLockElement === canvas) {
//     switch (event.button) {
//       case 0: // Left button
//         block = 1;
//         changeBlock();
//         // Implement left-click specific logic here
//         break;
//       // case 1: // Middle button (scroll wheel button)
//       //     console.log("Middle button clicked");
//       //     // Implement middle-click specific logic here
//       //     break;
//       case 2: // Right button
//         block = 0;
//         changeBlock();
//         // Implement right-click specific logic here
//         break;
//     }
//   }
// }

// Add event listener using the encapsulated function

function addActionsForHtmlUI() {
  fpsElem = document.getElementById("fps");
  fpsCounter = document.getElementById("fps");
  canvas.addEventListener("mousemove", handleMouseMove);
  // canvas.addEventListener("mousedown", handleMouseClick);
  canvas.addEventListener("click", lockCursor);
  document.getElementById("normalOn").addEventListener("click", function () {
    g_normalON = true;
    console.log(g_normalON);
  });
  document.getElementById("normalOff").addEventListener("click", function () {
    g_normalON = false;
    console.log(g_normalON);
  });
  document
    .getElementById("lightSlideX")
    .addEventListener("mousemove", function (ev) {
      if (ev.buttons == 1) {
        g_lightPos[0] = this.value / 100;
        console.log(g_lightPos[0]);
        renderScene();
      }
    });
  document
    .getElementById("lightSlideY")
    .addEventListener("mousemove", function (ev) {
      if (ev.buttons == 1) {
        g_lightPos[1] = this.value / 100;
        renderScene();
      }
    });
  document
    .getElementById("lightSlideZ")
    .addEventListener("mousemove", function (ev) {
      if (ev.buttons == 1) {
        g_lightPos[2] = this.value / 100;
        renderScene();
      }
    });
  document.getElementById("light_on").onclick = function () {
    g_lightOn = true;
  };
  document.getElementById("light_off").onclick = function () {
    g_lightOn = false;
  };
  document.getElementById("lightAnimationOn").onclick = function () {
    lightAnimationOn = true;
  };

  document.getElementById("lightAnimationOff").onclick = function () {
    lightAnimationOn = false;
  };
  console.log(lightAnimationOn);
}

let shiftDown = false;
let intervalId = null; // Variable to store the interval ID
let key = "";
function userDown() {
  if (shiftDown) {
    g_camera.cameraYaxis(-0.3);
  }
}

function keydown(ev) {
  if (ev.keyCode == 39 || ev.keyCode == 68) {
    // Right Arrow or D
    g_camera.right();
    g_eye[0] += 0.2;
  } else if (ev.keyCode == 37 || ev.keyCode == 65) {
    // Left Arrow or A
    g_camera.left();
    g_eye[0] -= 0.2;
  } else if (ev.keyCode == 38 || ev.keyCode == 87) {
    // up Arrow or W
    g_camera.forward();
  } else if (ev.keyCode == 40 || ev.keyCode == 83) {
    // down Arrow or S
    g_camera.back();
  } else if (ev.keyCode == 81) {
    // Q
    g_camera.panLeft();
    playerAngle = playerAngle - 10;
  } else if (ev.keyCode == 69) {
    playerAngle = playerAngle + 10;
    // E
    g_camera.panRight();
  } else if (ev.keyCode == 32) {
    g_camera.cameraYaxis(0.3);
  } else if (ev.keyCode == 16) {
    shiftDown = true;
    intervalId = setInterval(userDown, 70);
  } else if (ev.key == "j") {
    block = 1;
    changeBlock();
  } else if (ev.key == "u") {
    block = 0;
    changeBlock();
  }
  whereToDeleteAndAddBlock(normalizeAngle(playerAngle));
  playerPosDiv.textContent = `player pos x: ${Math.round(g_camera.eye.elements[0])}---y:${Math.round(g_camera.eye.elements[2])}`;
}

function keyup(ev) {
  if (ev.keyCode == 16) {
    shiftDown = false;
    clearInterval(intervalId);
    intervalId = null;
  }
}
