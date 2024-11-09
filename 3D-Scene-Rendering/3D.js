var gl;
var canvas;
var matrixStack = [];

var degree0 = 0.0;
var degree1 = 0.0;
var prevMouseX = 0.0;
var prevMouseY = 0.0;
var aPositionLocation;
var aNormalLocation;
var aTexCoordLocation;
var uVMatrixLocation;
var uLVMatrixLocation;
var uMMatrixLocation;
var uPMatrixLocation;

var diffuseTermLocation;
var uShadowLocation;
var uColorLocation;
var uLightPosLocation;

var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix
var lVMatrix = mat4.create();

var spBuf;
var spIndexBuf;
var spNormalBuf;
var spTexBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];
var spTexCoords = [];

var cubeBuf;
var cubeIndexBuf;
var cubeNormalBuf;
var cubeTexBuf;

var objVertexPositionBuffer;
var objVertexNormalBuffer;
var objVertexIndexBuffer;
var objVertexTextureBuffer;

var FBO;
var depthTextureSize = 1024;
var depthTexture;

var diffuseTerm = [0.7, 0.7, 0.7, 1.0];

var lightPos = [1.0, 2.0, 1.0];
var eyePos = [-1.0, 1.0, 1.0];
var defaultEyePos = [-1.0, 1.0, 1.0];

var COI = [0.0, 0.0, 0.0];
var viewUp = [0.0, 1.0, 0.0];

input_JSON = "teapot.json";
var isAnimating = false;

const vertexShaderCode_s = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;

void main(){
    gl_Position = uPMatrix*uVMatrix*uMMatrix*vec4(aPosition, 1.0);
}`;

const fragShaderCode_s = `#version 300 es
precision highp float;
uniform vec4 diffuseTerm;
uniform vec4 objColor;
out vec4 fragColor;

void main(){
    fragColor = diffuseTerm;
}`;

const vertexShaderCode_n = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

out vec3 vPosInEyeSpace;
out mat4 vVMatrix;
out vec3 normal;
out vec4 shadowCoord;

uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform mat4 uVMatrix;
uniform mat4 uLVMatrix;

void main() {
  
  const mat4 textureTransformMat = mat4(0.5,0.0,0.0,0.0,
                                          0.0,0.5,0.0,0.0,
                                          0.0,0.0,0.5,0.0,
                                          0.5,0.5,0.5,1.0);
  shadowCoord = textureTransformMat*uPMatrix*uLVMatrix*uMMatrix*vec4(aPosition, 1.0);


  mat4 projectionModelView;
  projectionModelView = uPMatrix*uVMatrix*uMMatrix;
  vPosInEyeSpace = vec3((uVMatrix*uMMatrix)*vec4(aPosition,1.0));

  vec4 vNormal = transpose(inverse(uVMatrix*uMMatrix))*vec4(aNormal,1.0);
  normal = normalize(vec3(vNormal));

  vVMatrix = uVMatrix;
  gl_Position = projectionModelView*vec4(aPosition,1.0);
  gl_PointSize=5.0;
}`;

// Fragment shader code
const fragShaderCode_n = `#version 300 es
precision mediump float;

in vec3 vPosInEyeSpace;
in mat4 vVMatrix;
in vec3 normal;
in vec4 shadowCoord;
out vec4 fragColor;

uniform sampler2D shadowMap;
uniform vec3 uLightPos;
uniform vec4 objColor;


void main() {

  vec3 p = shadowCoord.xyz / shadowCoord.w;
  float shadowFactor = texture(shadowMap,p.xy).r < p.z - 0.001 ? 0.3 : 1.0;

  vec3 L = normalize(vec3(vVMatrix*vec4(uLightPos,1.0)) - vPosInEyeSpace);
  vec3 R = normalize(reflect(-L, normal));
  vec3 V = normalize(-vPosInEyeSpace);

  vec3 Id = vec3(objColor)*max(dot(normal, L),0.0);
  vec3 Is = vec3(1.0)*pow(max(dot(V, R),0.0),32.0);
  vec3 Ia = 0.15*vec3(objColor);

  vec3 finalColor = (Id + Is)*shadowFactor + Ia;

  fragColor = vec4(finalColor, 1.0);
}`;

function pushMatrix() {
  //necessary because javascript only does shallow push
  var copy = mat4.create(mMatrix);
  matrixStack.push(copy);
}

function popMatrix() {
  if (matrixStack.length > 0) return matrixStack.pop();
  else console.log("stack has no matrix to pop!");
}

function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShaders(mode) {
  shaderProgram = gl.createProgram();
  var vertexShader;
  var fragmentShader;
  if (mode == "s") {
    // console.log("using shadow shader");
    vertexShader = vertexShaderSetup(vertexShaderCode_s);
    fragmentShader = fragmentShaderSetup(fragShaderCode_s);
  } else {
    // console.log("using normal shader");
    vertexShader = vertexShaderSetup(vertexShaderCode_n);
    fragmentShader = fragmentShaderSetup(fragShaderCode_n);
  }

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compiiion and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  //   gl.useProgram(shaderProgram);

  return shaderProgram;
}

function initDepthFBO() {
  depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT24,
    depthTextureSize,
    depthTextureSize,
    0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_INT,
    null
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  FBO = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
  FBO.width = depthTextureSize;
  FBO.height = depthTextureSize;

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTexture,
    0
  );

  var FBOstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (FBOstatus != gl.FRAMEBUFFER_COMPLETE) {
    console.error("GL_FRAMEBUFFER_COMPLETE failed, CANNOT use FBO");
  }
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function initSphere(nslices, nstacks, radius) {
  var theta1, theta2;

  for (i = 0; i < nslices; i++) {
    spVerts.push(0);
    spVerts.push(-radius);
    spVerts.push(0);

    spNormals.push(0);
    spNormals.push(-1.0);
    spNormals.push(0);
  }

  for (j = 1; j < nstacks - 1; j++) {
    theta1 = (j * 2 * Math.PI) / nslices - Math.PI / 2;
    for (i = 0; i < nslices; i++) {
      theta2 = (i * 2 * Math.PI) / nslices;
      spVerts.push(radius * Math.cos(theta1) * Math.cos(theta2));
      spVerts.push(radius * Math.sin(theta1));
      spVerts.push(radius * Math.cos(theta1) * Math.sin(theta2));

      spNormals.push(Math.cos(theta1) * Math.cos(theta2));
      spNormals.push(Math.sin(theta1));
      spNormals.push(Math.cos(theta1) * Math.sin(theta2));
    }
  }

  for (i = 0; i < nslices; i++) {
    spVerts.push(0);
    spVerts.push(radius);
    spVerts.push(0);

    spNormals.push(0);
    spNormals.push(1.0);
    spNormals.push(0);
  }

  // setup the connectivity and indices
  for (j = 0; j < nstacks - 1; j++)
    for (i = 0; i <= nslices; i++) {
      var mi = i % nslices;
      var mi2 = (i + 1) % nslices;
      var idx = (j + 1) * nslices + mi;
      var idx2 = j * nslices + mi;
      var idx3 = j * nslices + mi2;
      var idx4 = (j + 1) * nslices + mi;
      var idx5 = j * nslices + mi2;
      var idx6 = (j + 1) * nslices + mi2;

      spIndicies.push(idx);
      spIndicies.push(idx2);
      spIndicies.push(idx3);
      spIndicies.push(idx4);
      spIndicies.push(idx5);
      spIndicies.push(idx6);
    }
}

function initSphereBuffer() {
  var nslices = 30; // use even number
  var nstacks = nslices / 2 + 1;
  var radius = 1.0;
  initSphere(nslices, nstacks, radius);

  spBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spVerts), gl.STATIC_DRAW);
  spBuf.itemSize = 3;
  spBuf.numItems = nslices * nstacks;

  spNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spNormals), gl.STATIC_DRAW);
  spNormalBuf.itemSize = 3;
  spNormalBuf.numItems = nslices * nstacks;

  spIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(spIndicies),
    gl.STATIC_DRAW
  );
  spIndexBuf.itemsize = 1;
  spIndexBuf.numItems = (nstacks - 1) * 6 * (nslices + 1);
}

function drawSphere(color) {
  objectType = 1.0;

  gl.bindBuffer(gl.ARRAY_BUFFER, spBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    spBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, spNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation,
    spNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

  gl.uniform4fv(uColorLocation, color);

  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

function initCubeBuffer() {
  var vertices = [
    // Front face
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Back face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    // Top face
    -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Bottom face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    // Right face
    0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
    // Left face
    -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,
  ];
  buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  buf.itemSize = 3;
  buf.numItems = vertices.length / 3;

  var normals = [
    // Front face
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    // Back face
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    // Top face
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    // Bottom face
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
    // Right face
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    // Left face
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];
  cubeNormalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  cubeNormalBuf.itemSize = 3;
  cubeNormalBuf.numItems = normals.length / 3;

  var indices = [
    0,
    1,
    2,
    0,
    2,
    3, // Front face
    4,
    5,
    6,
    4,
    6,
    7, // Back face
    8,
    9,
    10,
    8,
    10,
    11, // Top face
    12,
    13,
    14,
    12,
    14,
    15, // Bottom face
    16,
    17,
    18,
    16,
    18,
    19, // Right face
    20,
    21,
    22,
    20,
    22,
    23, // Left face
  ];
  indexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  indexBuf.itemSize = 1;
  indexBuf.numItems = indices.length;
}

function drawCube(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(
    aPositionLocation,
    buf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuf);
  gl.vertexAttribPointer(
    aNormalLocation,
    cubeNormalBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

  gl.uniform4fv(uColorLocation, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  //gl.drawArrays(gl.LINE_STRIP, 0, buf.numItems); // show lines
  //gl.drawArrays(gl.POINTS, 0, buf.numItems); // show points
}


function initObject() {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.open("GET", input_JSON);
    request.overrideMimeType("application/json");
    
    request.onreadystatechange = function () {
      // console.log(request.readyState);
      // console.log(request.status);
      // console.log(request.responseText);
      if (request.readyState === 3) {
          processObject(JSON.parse(request.responseText));
          resolve();
        } 
      // else {
      //     reject("File not found");
      // }
    };
    request.send();

  });
}

function processObject(objData) {
  objVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexPositions),
    gl.STATIC_DRAW
  );
  objVertexPositionBuffer.itemSize = 3;
  objVertexPositionBuffer.numItems = objData.vertexPositions.length / 3;

  
  objVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexNormals),
    gl.STATIC_DRAW
  );
  objVertexNormalBuffer.itemSize = 3;
  objVertexNormalBuffer.numItems = objData.vertexNormals.length / 3;

  objVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(objData.indices),
    gl.STATIC_DRAW
  );
  objVertexIndexBuffer.itemSize = 1;
  objVertexIndexBuffer.numItems = objData.indices.length;
}

function drawObject(color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    objVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.vertexAttribPointer(
    aNormalLocation,
    objVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);

  gl.uniform4fv(uColorLocation, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);

  gl.drawElements(
    gl.TRIANGLES,
    objVertexIndexBuffer.numItems,
    gl.UNSIGNED_INT,
    0
  );
}


function drawScene(mode) {
  // set up the view matrix, multiply into the modelview matrix
  mat4.identity(vMatrix);
  if (mode == "s") {
    gl.viewport(0, 0, depthTextureSize, depthTextureSize);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    vMatrix = mat4.lookAt(lightPos, COI, viewUp, vMatrix);
  } else {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    vMatrix = mat4.lookAt(eyePos, COI, viewUp, vMatrix);
  }

  //set up perspective projection matrix
  mat4.identity(pMatrix);
  mat4.perspective(50, 1.0, 0.1, 1000, pMatrix);

  //set up the model matrix
  mat4.identity(mMatrix);

  // transformations applied here on model matrix
  mMatrix = mat4.rotate(mMatrix, degToRad(degree0), [0, 1, 0]);

  // Now draw the cube
  pushMatrix();
  mat4.scale(mMatrix, [1.0, 0.01, 1.0]);
  color = [0.7, 0.7, 0.7, 1]; // specify color for the cube
  drawCube(color);
  mMatrix = popMatrix();

  pushMatrix();
  mat4.translate(mMatrix, [0.1, 0.1, -0.1]);
  mat4.scale(mMatrix, [0.1, 0.1, 0.1]);
  color = [0, 1, 1, 1]; // specify color for the cube
  drawSphere(color);
  mMatrix = popMatrix();
  color = [0.1, 1, 0.5, 1];
  mat4.translate(mMatrix, [0., 0.2, 0.3]);
  mat4.scale(mMatrix, [0.02, 0.02, 0.02]);
  drawObject(color);
}

// Mouse functions
{
  function onMouseDown(event) {
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mouseout", onMouseOut, false);

    if (
      event.layerX <= canvas.width &&
      event.layerX >= 0 &&
      event.layerY <= canvas.height &&
      event.layerY >= 0
    ) {
      prevMouseX = event.clientX;
      prevMouseY = canvas.height - event.clientY;
    }
  }

  function onMouseMove(event) {
    // make mouse interaction only within canvas
    if (
      event.layerX <= canvas.width &&
      event.layerX >= 0 &&
      event.layerY <= canvas.height &&
      event.layerY >= 0
    ) {
      var mouseX = event.clientX;
      var diffX1 = mouseX - prevMouseX;
      prevMouseX = mouseX;
      degree0 = degree0 + diffX1 / 5;

      var mouseY = canvas.height - event.clientY;
      var diffY2 = mouseY - prevMouseY;
      prevMouseY = mouseY;
      degree1 = degree1 - diffY2 / 5;

      drawScene();
    } else {
      document.removeEventListener("mousemove", onMouseMove, false);
      document.removeEventListener("mouseup", onMouseUp, false);
      document.removeEventListener("mouseout", onMouseOut, false);
    }
  }

  function onMouseUp(event) {
    document.removeEventListener("mousemove", onMouseMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);
    document.removeEventListener("mouseout", onMouseOut, false);
  }

  function onMouseOut(event) {
    document.removeEventListener("mousemove", onMouseMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);
    document.removeEventListener("mouseout", onMouseOut, false);
  }
}

function updateCamera() {
  // Calculate the new camera position (for rotation around the room)
  const cosTheta = Math.cos(degToRad(degree));
  const sinTheta = Math.sin(degToRad(degree));

  eyePos[0] = defaultEyePos[0] * cosTheta - defaultEyePos[2] * sinTheta;
  eyePos[2] = defaultEyePos[0] * sinTheta + defaultEyePos[2] * cosTheta;

  // Recalculate the view matrix
  mat4.lookAt(eyePos, [0, 0, 0], [0, 1, 0], vMatrix);
}
// This is the entry point from the html
async function webGLStart() {
  canvas = document.getElementById("canvas");
  checkBox = document.getElementById("animate");
  lightRange = document.getElementById("lightPos");
  checkBox.addEventListener("change", function () {
    if (checkBox.checked) {
      console.log("Checkbox is checked");
      isAnimating = true;
      animate();
    } else {
      console.log("Checkbox is unchecked");
      isAnimating = false;
      animate();
    }
  });
  lightRange.addEventListener("input", function () {
    lightPos[0] = lightRange.value / 10;
    animate();
  });
  document.addEventListener("mousedown", onMouseDown, false);
  // initialize WebGL
  initGL(canvas);
  gl.enable(gl.DEPTH_TEST);
  
  await initObject();
  initDepthFBO();
  initCubeBuffer();
  initSphereBuffer();
  degree = 0.0;

  shaderProgram1 = initShaders("s");
  shaderProgram2 = initShaders("n");

  function animate() {
    gl.useProgram(shaderProgram1);
    aPositionLocation = gl.getAttribLocation(shaderProgram1, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram1, "aNormal");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram1, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram1, "uVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram1, "uPMatrix");
    uColorLocation = gl.getUniformLocation(shaderProgram1, "objColor");
    diffuseTermLocation = gl.getUniformLocation(shaderProgram1, "diffuseTerm");

    //enable the attribute arrays
    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);

    //set const variables

    gl.uniform4fv(diffuseTermLocation, diffuseTerm);

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    updateCamera();
    if (isAnimating) degree += 0.2;
    drawScene("s");

    gl.useProgram(shaderProgram2);

    aPositionLocation = gl.getAttribLocation(shaderProgram2, "aPosition");
    aNormalLocation = gl.getAttribLocation(shaderProgram2, "aNormal");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram2, "uMMatrix");
    uVMatrixLocation = gl.getUniformLocation(shaderProgram2, "uVMatrix");
    uLVMatrixLocation = gl.getUniformLocation(shaderProgram2, "uLVMatrix");
    uPMatrixLocation = gl.getUniformLocation(shaderProgram2, "uPMatrix");
    uColorLocation = gl.getUniformLocation(shaderProgram2, "objColor");
    uLightPosLocation = gl.getUniformLocation(shaderProgram2, "uLightPos");
    uShadowLocation = gl.getUniformLocation(shaderProgram2, "shadowMap");

    gl.enableVertexAttribArray(aPositionLocation);
    gl.enableVertexAttribArray(aNormalLocation);

    gl.uniform3fv(uLightPosLocation, lightPos);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    mat4.identity(lVMatrix);
    lVMatrix = mat4.lookAt(lightPos, COI, viewUp, lVMatrix);
    gl.uniformMatrix4fv(uLVMatrixLocation, false, lVMatrix);
    gl.activeTexture(gl.TEXTURE0); // set texture unit 1 to use
    gl.bindTexture(gl.TEXTURE_2D, depthTexture); // bind the texture object to the texture unit
    gl.uniform1i(uShadowLocation, 0); // pass the texture unit to the shader
    drawScene("n");
    if (isAnimating) {
      animationRequestId = requestAnimationFrame(animate);
    }
  }
  // console.log(objVertexPositionBuffer.itemSize);
  animate();
}
