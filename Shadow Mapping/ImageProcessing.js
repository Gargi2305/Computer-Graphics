//  A simple WebGL program to show how to load JSON model
//

var gl;
var canvas;
var button;
var matrixStack = [];

var aPositionLocation;
var aNormalLocation;
var aTextureLocation;
var uVMatrixLocation;
var uWNMatrixLocation;
var uMMatrixLocation;
var uPMatrixLocation;
var uTextureLocation;
var u2DTextureLocation;
var uColorLocation;
var uShaderTypeLocation;
var uEyePositionLocation;

var buf;
var cubeNormalBuf;
var indexBuf;

var spBuf;
var spIndexBuf;
var spNormalBuf;
var spTexBuf;

var spVerts = [];
var spIndicies = [];
var spNormals = [];
var spTexCoords = [];

var objVertexPositionBuffer;
var objVertexNormalBuffer;
var objVertexIndexBuffer;
var objVertexTextureBuffer;

var cubeMapTexture;
var cubeTextureBuf;

var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create(); // model matrix
var pMatrix = mat4.create(); //projection matrix
var uBounceLimitLocation;
var uColorLocation;
var uShadingModeLocation;

var eyeMatrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
var speed = 0.5;
var color = [1.0, 1.0, 1.0];

var eyePos = [1, 2.5, 4.0];
var initialEyePos = eyePos.copyWithin(eyePos);
var reflection = 0.6;
var teapot_JSON = "texture_and_other_files/teapot.json";

var cubeMapPath = "texture_and_other_files/Field/";
var posx, posy, posz, negx, negy, negz;
var posx_file, posy_file, posz_file, negx_file, negy_file, negz_file;

var fenceCube, fenceCube_file;
var wood, wood_file;
var earth, earth_file;

var isAnimation = false;
var animate;

const vertexShaderReflection = #version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexture;

uniform mat4 uWNMatrix;
uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec3 v;
out vec3 n;
out vec2 t;

void main() {
  v_worldPosition =  mat3(uMMatrix) * aPosition;
  v_worldNormal = mat3(uWNMatrix) * aNormal;

  mat4 modelViewMatrix = uVMatrix * uMMatrix;
  v = vec3(modelViewMatrix * vec4(aPosition,1.0));
  n = vec3(transpose(inverse(modelViewMatrix)) * vec4(aNormal,1.0));
  t = aTexture;

  gl_Position =  uPMatrix*uVMatrix*uMMatrix * vec4(aPosition,1.0);
  gl_PointSize=1.0;
};

const fragShaderEnvironment = #version 300 es
precision mediump float;

uniform vec3 uEyePos;
uniform samplerCube cubeMap;
uniform sampler2D cubeMap2D;
uniform vec3 uDiffuseColor;
uniform int uShaderType;

in vec3 v_worldPosition;
in vec3 v_worldNormal;
in vec3 v;
in vec3 n;
in vec2 t;

out vec4 fragColor;

void main() {
  // Normalize the world normal for correct lighting calculations
  vec3 worldNormal = normalize(v_worldNormal);

  // Eye to surface direction for reflection
  vec3 eyeToSurfaceDir = normalize(v_worldPosition - uEyePos);
  vec3 directionReflection = reflect(eyeToSurfaceDir, worldNormal);

  // Refraction for certain shader types
  if (uShaderType == 2) {
    directionReflection = refract(eyeToSurfaceDir, worldNormal, 0.82);
  }

  // Sample from cube map based on reflection
  vec4 cubeMapReflectCol = texture(cubeMap, directionReflection);
  if (uShaderType == 3) {
    cubeMapReflectCol = texture(cubeMap2D, t);
    if (cubeMapReflectCol.a < 0.3)
      discard;
    fragColor = vec4(cubeMapReflectCol.rgb, cubeMapReflectCol.a);
    return;
  }

  // For solid color, skip reflections and use Phong shading
  vec4 textureColor = vec4(0.0, 0.0, 0.0, 1.0);

  if (uShaderType == 4) {
    if (cubeMapReflectCol.a <= 0.01)
      discard;
    fragColor = texture(cubeMap2D, t) * cubeMapReflectCol * 0.85;
    return;
  }

  // Phong shading calculations
  vec3 lightPos = vec3(3.0, 5.0, -4.0);  // Light source moved to northeast and above
  vec3 lightDir = normalize(lightPos - v_worldPosition);  // Calculate light direction based on world position

  // Calculate diffuse lighting (Lambertian reflection)
  float costheta = max(dot(lightDir, worldNormal), 0.0);
  vec3 Idiffuse = uDiffuseColor * costheta;

  // Calculate specular lighting (Blinn-Phong)
  vec3 halfDir = normalize(lightDir + normalize(uEyePos - v_worldPosition));
  float cosalpha = max(dot(worldNormal, halfDir), 0.0);
  vec3 Ispecular = vec3(1.0, 1.0, 1.0) * pow(cosalpha, 32.0);  // Specular highlight

  // Ambient lighting component
  vec3 Iambient = uDiffuseColor * 0.3;

  // Combine the lighting components
  vec3 phongColor = Iambient + Idiffuse + Ispecular;

  if (uShaderType == 1 || uShaderType == 2) {
    if (cubeMapReflectCol.a <= 0.01)
      discard;
    else
      fragColor = cubeMapReflectCol;
  } else {
    if (cubeMapReflectCol.a <= 0.01)
      discard;
    else
      fragColor = vec4(cubeMapReflectCol.rgb * 0.4 + phongColor, 1.0);
  }

  // For Phong shading only
  if (uShaderType == 0) {
    fragColor = vec4(phongColor, 1.0);
    return;
  }
};


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

function initShaders(vertexShaderCode, fragmentShaderCode) {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragmentShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
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

function pushMatrix(m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  matrixStack.push(copy);
}

function popMatrix() {
  if (matrixStack.length > 0) return matrixStack.pop();
  else console.log("stack has no matrix to pop!");
}

function myMatMul(a, b) {
  const result = [];
  // i know this function takes nx1 vector and nxn matrix
  for (let i = 0; i < b.length; i++) {
    let sum = 0;
    for (let j = 0; j < a.length; j++) {
      sum += a[j] * b[i][j];
    }
    result.push(sum);
  }
  return result;
}

function initObject() {
  // XMLHttpRequest objects are used to interact with servers
  // It can be used to retrieve any type of data, not just XML.
  var request = new XMLHttpRequest();
  request.open("GET", teapot_JSON);
  // MIME: Multipurpose Internet Mail Extensions
  // It lets users exchange different kinds of data files
  request.overrideMimeType("application/json");
  request.onreadystatechange = function () {
    //request.readyState == 4 means operation is done
    if (request.readyState == 4) {
      processObject(JSON.parse(request.responseText));
    }
  };
  request.send();
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

  var cubeTexture = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
  cubeTexture = Array.from({ length: 6 }, () => [...cubeTexture]).flat();
  cubeTextureBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeTexture), gl.STATIC_DRAW);
  cubeTextureBuf.itemSize = 2;
  cubeTextureBuf.numItems = cubeTexture.length / 2;

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

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuf);
  gl.vertexAttribPointer(
    aTextureLocation,
    cubeTextureBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

  gl.uniform3fv(uColorLocation, color);
  gl.uniform3fv(uEyePositionLocation, eyePos);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.uniformMatrix4fv(
    uWNMatrixLocation,
    false,
    mat4.inverse(mat4.transpose(mMatrix))
  );

  gl.drawElements(gl.TRIANGLES, indexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}

// New sphere initialization function
function initSphere(nslices, nstacks, radius) {
  for (var i = 0; i <= nslices; i++) {
    var angle = (i * Math.PI) / nslices;
    var comp1 = Math.sin(angle);
    var comp2 = Math.cos(angle);

    for (var j = 0; j <= nstacks; j++) {
      var phi = (j * 2 * Math.PI) / nstacks;
      var comp3 = Math.sin(phi);
      var comp4 = Math.cos(phi);

      var xcood = comp4 * comp1;
      var ycoord = comp2;
      var zcoord = comp3 * comp1;
      var utex = 1 - j / nstacks;
      var vtex = 1 - i / nslices;

      spVerts.push(radius * xcood, radius * ycoord, radius * zcoord);
      spNormals.push(xcood, ycoord, zcoord);
      spTexCoords.push(utex, vtex);
    }
  }

  // now compute the indices here
  for (var i = 0; i < nslices; i++) {
    for (var j = 0; j < nstacks; j++) {
      var id1 = i * (nstacks + 1) + j;
      var id2 = id1 + nstacks + 1;

      spIndicies.push(id1, id2, id1 + 1);
      spIndicies.push(id2, id2 + 1, id1 + 1);
    }
  }
}

function initSphereBuffer() {
  var nslices = 180; // use even number
  var nstacks = nslices / 2 + 1;
  var radius = 0.7;
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

  spTexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spTexCoords), gl.STATIC_DRAW);
  spTexBuf.itemSize = 2;
  spTexBuf.numItems = spTexCoords.length / 2;
}

function drawSphere(color) {
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

  gl.bindBuffer(gl.ARRAY_BUFFER, spTexBuf);
  gl.vertexAttribPointer(
    aTextureLocation,
    spTexBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // draw elementary arrays - triangle indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spIndexBuf);

  gl.uniform3fv(uEyePositionLocation, eyePos);
  gl.uniform3fv(uColorLocation, color);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.uniformMatrix4fv(
    uWNMatrixLocation,
    false,
    mat4.inverse(mat4.transpose(mMatrix))
  );

  gl.drawElements(gl.TRIANGLES, spIndexBuf.numItems, gl.UNSIGNED_INT, 0);
}

function setAttributes() {
  //get locations of attributes declared in the vertex shader
  aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
  aTextureLocation = gl.getAttribLocation(shaderProgram, "aTexture");
  aNormalLocation = gl.getAttribLocation(shaderProgram, "aNormal");
  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
  uPMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  uVMatrixLocation = gl.getUniformLocation(shaderProgram, "uVMatrix");
  uWNMatrixLocation = gl.getUniformLocation(shaderProgram, "uWNMatrix");
  uEyePositionLocation = gl.getUniformLocation(shaderProgram, "uEyePos");
  uTextureLocation = gl.getUniformLocation(shaderProgram, "cubeMap");
  u2DTextureLocation = gl.getUniformLocation(shaderProgram, "cubeMap2D");
  uColorLocation = gl.getUniformLocation(shaderProgram, "uDiffuseColor");
  uShaderTypeLocation = gl.getUniformLocation(shaderProgram, "uShaderType");
  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aNormalLocation);
  gl.enableVertexAttribArray(aTextureLocation);
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

  objVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint32Array(objData.indices),
    gl.STATIC_DRAW
  );
  objVertexIndexBuffer.itemSize = 1;
  objVertexIndexBuffer.numItems = objData.indices.length;

  objVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexNormals),
    gl.STATIC_DRAW
  );
  objVertexNormalBuffer.itemSize = 3;
  objVertexNormalBuffer.numItems = objData.vertexNormals.length / 3;

  objVertexTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTextureBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objData.vertexTextureCoords),
    gl.STATIC_DRAW
  );
  objVertexTextureBuffer.itemSize = 2;
  objVertexTextureBuffer.numItems = objData.vertexTextureCoords.length / 2;

  drawScene();
}

function drawObject() {
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

  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexTextureBuffer);
  gl.vertexAttribPointer(
    aTextureLocation,
    objVertexTextureBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objVertexIndexBuffer);

  gl.uniform3fv(uEyePositionLocation, eyePos);
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  gl.uniformMatrix4fv(uVMatrixLocation, false, vMatrix);
  gl.uniformMatrix4fv(uPMatrixLocation, false, pMatrix);
  gl.uniform1i(uShaderTypeLocation, 0);
  gl.uniformMatrix4fv(
    uWNMatrixLocation,
    false,
    mat4.inverse(mat4.transpose(mMatrix))
  );

  gl.drawElements(
    gl.TRIANGLES,
    objVertexIndexBuffer.numItems,
    gl.UNSIGNED_INT,
    0
  );
}

// function to draw each side of the skybox
function drawCubeFace(texture, textureEnum, textureNumber, location) {
  pushMatrix(mMatrix);

  // texture setup for use
  gl.activeTexture(textureEnum); // set texture unit 1 to use
  gl.bindTexture(gl.TEXTURE_2D, texture); // bind the texture object
  gl.uniform1i(u2DTextureLocation, textureNumber); // pass the texture unit
  // telling shader to treat it as textured surface

  // transformations
  mMatrix = mat4.translate(mMatrix, location);
  mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
  mMatrix = mat4.scale(mMatrix, [200, 200, 200]);

  drawCube(color);
  mMatrix = popMatrix(matrixStack);
}

//The main drawing routine
function drawScene() {
  var degree = 0;

  animate = function () {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const cosTheta = Math.cos(degToRad(degree));
    const sinTheta = Math.sin(degToRad(degree));

    eyeMatrix = [
      [cosTheta, 0, -sinTheta],
      [0, 1, 0],
      [sinTheta, 0, cosTheta],
    ];

    eyePos = myMatMul(initialEyePos, eyeMatrix);
    degree += speed;

    //set up the model matrix
    mat4.identity(mMatrix);

    // set up the view matrix, multiply into the modelview matrix
    mat4.identity(vMatrix);
    vMatrix = mat4.lookAt(eyePos, [0, 0, 0], [0, 1, 0], vMatrix);

    //drawteapot

    //set up projection matrix
    mat4.identity(pMatrix);
    mat4.perspective(60, 1.0, 0.01, 1000, pMatrix);
    //draw teapot
    pushMatrix(mMatrix);
    mMatrix = mat4.rotate(mMatrix, degToRad(-72.5), [0, 1, 0]);
    mMatrix = mat4.translate(mMatrix, [-0.1, 0.5, 0.9]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 0.08]);

    // for texture binding
    gl.activeTexture(gl.TEXTURE0); // set texture unit 0 to use
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture); // bind the texture object to the texture unit
    gl.uniform1i(uTextureLocation, 0); // pass the texture unit to the shader
    gl.uniform3fv(uColorLocation, [50 / 255, 150 / 255, 100 / 255]); // Green color
    drawObject();
    mMatrix = popMatrix();

    //drawspheres
    gl.uniform1i(uShaderTypeLocation, 0);
    pushMatrix(mMatrix);
    var color = [10 / 255, 100 / 255, 180 / 255];
    mMatrix = mat4.rotate(mMatrix, degToRad(45), [0, 1, 0]);
    mMatrix = mat4.translate(mMatrix, [0.1, 0.37, 1.7]);
    mMatrix = mat4.scale(mMatrix, [0.6, 0.6, 0.6]);
    drawSphere(color);
    mMatrix = popMatrix();

    //drawSquareTable
    pushMatrix(mMatrix);
    
    // Translate and scale to form a square table
    mMatrix = mat4.translate(mMatrix, [0.2, -0.12, 0.5]);
    mMatrix = mat4.scale(mMatrix, [5, 0.05, 4]);
    mMatrix = mat4.rotate(mMatrix, degToRad(17.5), [0, 1, 0]);

   
    gl.uniform1i(u2DTextureLocation, 2); // pass the texture unit to the shader

    // Telling shader to treat it as textured and reflecting surface
    // gl.uniform1i(uShaderTypeLocation, 3);
    gl.uniform1i(uShaderTypeLocation, 0);
    var color = [0.5,0.5, 0.5];

    // Draw the tabletop
    drawCube(color);

    // Restore the previous matrix state
    mMatrix = popMatrix();

    if (isAnimation) window.requestAnimationFrame(animate);
  };
  animate();
}

function PlayAnimation() {
  isAnimation = !isAnimation;
  if (isAnimation) {
    button.style.backgroundColor = "#FF0000";
    button.style.transform = "scale(1.1)";
    animate();
    button.textContent = "Stop Animation";
  } else {
    button.textContent = "Play Animation";
    button.style.backgroundColor = "#82d585";
    button.style.transform = "scale(1.1)";
  }
}

function ChangeSpeed(value) {
  speed = parseFloat(value) / 50;
}

function handleTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, // 2D texture
    0, // mipmap level
    gl.RGBA, // internal format
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type of data
    texture.image // array or <img>
  );

  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );

  drawScene();
}
function initTextures(file_path) {
  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.src = file_path;
  texture.image.onload = function () {
    handleTextureLoaded(texture);
  };
  return texture;
}

function initCubeMap() {
  const faceInfos = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: posx_file },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: negx_file },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: posy_file },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: negy_file },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: posz_file },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: negz_file },
  ];

  cubeMapTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);

  faceInfos.forEach((faceInfo) => {
    const { target, url } = faceInfo;
    gl.texImage2D(
      target,
      0,
      gl.RGBA,
      512,
      512,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    //load images again
    const image = new Image();
    image.src = url;
    image.addEventListener("load", function () {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
      gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      drawScene();
    });
  });

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(
    gl.TEXTURE_CUBE_MAP,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );
}

function initFiles() {
  posx_file = cubeMapPath.concat("posx.jpg");
  posy_file = cubeMapPath.concat("posy.jpg");
  posz_file = cubeMapPath.concat("posz.jpg");
  negx_file = cubeMapPath.concat("negx.jpg");
  negy_file = cubeMapPath.concat("negy.jpg");
  negz_file = cubeMapPath.concat("negz.jpg");

  posx = initTextures(posx_file);
  posy = initTextures(posy_file);
  posz = initTextures(posz_file);
  negz = initTextures(negz_file);
  negx = initTextures(negx_file);
  negy = initTextures(negy_file);


  wood_file = "./texture_and_other_files/wood_texture.jpg";
  wood = initTextures(wood_file);

 
}

// This is the entry point from the html
function webGLStart() {
  canvas = document.getElementById("canvas");
  button = document.getElementById("button");

  initGL(canvas);
  shaderProgram = initShaders(vertexShaderReflection, fragShaderEnvironment);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  setAttributes();

  //initialize buffers for the square
  initObject();
  initFiles();
  initCubeBuffer();
  initSphereBuffer();
  initCubeMap();
}