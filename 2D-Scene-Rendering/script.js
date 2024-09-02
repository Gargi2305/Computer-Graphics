var gl;
var mMatrix = mat4.create();
var aPositionLocation;
var uColorLoc;
var uMMatrixLocation;
var mStack = [];
let mode = 's';

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 10.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;

void main() {
  fragColor = color;
}`;



const pushMatrix = (stack, m) => {
  //necessary because javascript only does shallow push
  const copy = mat4.create(m);
  stack.push(copy);
}

const popMatrix = (stack) => {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

function dtr(degrees){
  return (degrees * Math.PI) / 180;
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
// drawing a square
function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
      0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(aPositionLocation, sqVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  // show the solid view
  if (mode === 's') {
      gl.drawElements(gl.TRIANGLES, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }
  // show the wireframe view
  else if (mode === 'w') {
      gl.drawElements(gl.LINE_LOOP, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }
  // show the point view
  else if (mode === 'p') {
      gl.drawElements(gl.POINTS, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  }    
}

// drawing a triangle
function initTriangleBuffer() {
  // buffer for point locations
  const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  triangleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  triangleBuf.itemSize = 2;
  triangleBuf.numItems = 3;

  // buffer for point indices
  const triangleIndices = new Uint16Array([0, 1, 2]);
  triangleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
  triangleIndexBuf.itemsize = 1;
  triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(aPositionLocation, triangleBuf.itemSize, gl.FLOAT, false, 0, 0);

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.uniform4fv(uColorLoc, color);

  // now draw the triangle
  if (mode === 's') {
      gl.drawElements(gl.TRIANGLES, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  }
  else if (mode === 'w') {
      gl.drawElements(gl.LINE_LOOP, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  }
  else if (mode === 'p') {
      gl.drawElements(gl.POINTS, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  }
}

//function for blades
function initbladeBuffer() {
    // buffer for point locations
    const bladeVertices = new Float32Array([0.0, 0.0, -0.866, -0.5, 0.866, -0.5]);
    bladeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, bladeVertices, gl.STATIC_DRAW);
    bladeBuf.itemSize = 2;
    bladeBuf.numItems = 3;
  
    // buffer for point indices
    const bladeIndices = new Uint16Array([0, 1, 2]);
    bladeIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bladeIndices, gl.STATIC_DRAW);
    bladeIndexBuf.itemsize = 1;
    bladeIndexBuf.numItems = 3;
  }
  
  function drawblade(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  
    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.vertexAttribPointer(aPositionLocation, bladeBuf.itemSize, gl.FLOAT, false, 0, 0);
  
    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.uniform4fv(uColorLoc, color);
  
    // now draw the triangle
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
  }


// Function to draw circle

function initCircleBuffer() {
    // buffer for point locations
    const positions = [0, 0]; // take the center of the circle
    
    var anglestep = (Math.PI*2)/720;
    for (var i = 0; i < 720; i++) {
      const theta = anglestep * i;
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      positions.push(x, y);
    }
  
    const Verticescircle = new Float32Array(positions);
    circleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, Verticescircle, gl.STATIC_DRAW);
    circleBuf.itemSize = 2;
    circleBuf.numItems = 721;
  
    // Create index buffer
    const indices = [0, 1, 720];
    for (var i = 1; i <= 720; i++) {
      indices.push(0, i-1, i );
    }
  
    // buffer for point indices
    const Indicescircle = new Uint16Array(indices);
    circleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Indicescircle, gl.STATIC_DRAW);
    circleIndexBuf.itemsize = 1;
    circleIndexBuf.numItems = indices.length;
  }
  
  function drawCircle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
  
    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);
  
    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.uniform4fv(uColorLoc, color);
  
    // now draw the circle
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
  }


  function initShaders() {
    shaderProgram = gl.createProgram();
  
    var vertexShader = vertexShaderSetup(vertexShaderCode);
    var fragmentShader = fragmentShaderSetup(fragShaderCode);
  
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

  

function drawLand(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0, -0.9, 0.0]);
   // mMatrix = mat4.rotate(mMatrix, dtr(153.55), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[3.0,1.5,1.0]);
//    mMatrix = mat4.rotate(mMatrix, dtr(-45), [0.0, 0.0, 1.0]);
    color = [0.2, 1.0, 0.2, 0.7];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    
  
  }

  function drawaboveLand(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, 0.18, 0.0]);
    mMatrix = mat4.scale(mMatrix,[3.0,0.07,1.0]);
    color = [0.2, 1.0, 0.2, 0.7];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);
  }

  //draw river

  function drawRiver(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, -0.01, 0.0]);
    mMatrix = mat4.scale(mMatrix,[5.0,0.4,1.0]);
    color = [0.0, 0.41, 0.58, 0.9];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

  }

  function drawroad(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.4, -0.7, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(48.55), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[1.2,2.2,1.0]);
    color = [0.447, 0.702, 0.267, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);


  }

  function drawsky(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, 1, 0.0]);
    mMatrix = mat4.scale(mMatrix,[1.99,1.48,1.0]);
    color = [0, 0, 0, 0.9];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);
  }

  function drawmoon(degree){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.65, 0.85, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.08,0.08,1.0]);
    color = [1, 1, 1, 0.9];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);    

    for(let theta = 0 ; theta < 360 ; theta += 45){
        pushMatrix(mStack,mMatrix);
        mMatrix = mat4.translate(mMatrix, [-0.65, 0.85, 0.0]);
        mMatrix = mat4.rotate(mMatrix, dtr(degree+theta),[0,0,1])
        mMatrix = mat4.scale(mMatrix,[0.006,0.3,1.0]);
        color = [1, 1, 1, 0.9];
        drawblade(color,mMatrix);
        mMatrix = popMatrix(mStack);
    }
  }
  
function drawclouds(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.905, 0.65, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.15,0.1,1.0]);
    color = [0.698, 0.698, 0.690, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack); 

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.75, 0.65, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.12,0.08,1.0]);
    color = [1, 1, 1, 0.9];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack); 

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.605, 0.65, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.09,0.06,1.0]);
    color = [0.698, 0.698, 0.690, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack); 
}

  function drawTreeTrunk(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.3, 0.4, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.030,0.4,1.0]);
    color = [0.47, 0.25, 0.12, 0.9];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.52, 0.4, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.030,0.4,1.0]);
    color = [0.47, 0.25, 0.12, 0.9];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.4, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.030,0.4,1.0]);
    color = [0.47, 0.25, 0.12, 0.9];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

  }

  function drawTree(){

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.60, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.35,0.35,1.0]);
    color = [0.376, 0.588, 0.337, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.65, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.35,0.35,1.0]);
    color = [0.408, 0.690, 0.353, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.50, 0.7, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.35,0.35,1.0]);
    color = [0.506, 0.792, 0.380, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.3, 0.5, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.3,0.3,1.0]);
    color = [0.376, 0.588, 0.337, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.3, 0.55, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.3,0.3,1.0]);
    color = [0.408, 0.690, 0.353, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.3, 0.6, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.3,0.3,1.0]);
    color = [0.506, 0.792, 0.380, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.55, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.3,0.3,1.0]);
    color = [0.376, 0.588, 0.337, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.6, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.3,0.3,1.0]);
    color = [0.408, 0.690, 0.353, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.75, 0.65, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.3,0.3,1.0]);
    color = [0.506, 0.792, 0.380, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);


  }

  function drawmountains(){

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.56, 0.1, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(29), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[2,0.92,1.0]);
    color = [0.584, 0.475, 0.318, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.9, 0.298, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(-29.9), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.2,0.49,1.0]);
    color = [0.506, 0.369, 0.251, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.85, -0.1, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(17), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[2.7,0.99,1.0]);
    color = [0.584, 0.475, 0.318, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.05, 0.3, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(19), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[1.6,1.02,1.0]);
    color = [0.584, 0.475, 0.318, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.45, 0.353, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(-28.9), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.4,0.99,1.0]);
    color = [0.506, 0.369, 0.251, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);




  }

  function drawhouse(){

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.45, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.39,0.28,1.0]);
    color = [0.937, 0.882, 0.894, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.795, -0.405, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.07,0.072,1.0]);
    color = [0.835, 0.710, 0.196, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.595, -0.405, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.07,0.072,1.0]);
    color = [0.835, 0.710, 0.196, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.695, -0.505, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.058,0.175,1.0]);
    color = [0.835, 0.710, 0.196, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.22, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.2,0.2,1.0]);
    color = [1, 0.0, 0.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.85, -0.22, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.2,0.2,1.0]);
    color = [1, 0.0, 0.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.22, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.298,0.198,1.0]);
    color = [1, 0.0, 0.0, 0.9];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

  }

  function drawcar(){

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.598, -0.698, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.138,0.095,1.0]);
    color = [0.114, 0.298, 0.706, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.595, -0.685, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.15,0.101,1.0]);
    color = [0.808, 0.804, 0.894, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.595, -0.785, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.3,0.14,1.0]);
    color = [0.173, 0.494, 0.918, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.746, -0.785, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.14,0.14,1.0]);
    color = [0.173, 0.494, 0.918, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.45, -0.785, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.14,0.14,1.0]);
    color = [0.173, 0.494, 0.918, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);


  }

  function drawwheels(){

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.708, -0.878, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.05,0.05,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.708, -0.878, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.045,0.045,1.0]);
    color = [0.396, 0.400, 0.439, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.488, -0.878, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.05,0.05,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.488, -0.878, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.045,0.045,1.0]);
    color = [0.396, 0.400, 0.439, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

  }

  function drawboat(xb_boat, xs_boat){

    //big boat
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.605+xb_boat, 0.2, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.009,0.36,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.6625+xb_boat, 0.28, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(26), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.23,0.23,1.0]);
    color = [0.90, 0.10, 0.10, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.565+xb_boat, 0.18, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(-17), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.005,0.3,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.605+xb_boat, 0, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.2,0.086,1.0]);
    color = [0.800, 0.800, 0.792, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.706+xb_boat, -0.001, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(180), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.093,0.089,1.0]);
    color = [0.800, 0.800, 0.792, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.509+xb_boat, -0.001, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(180), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.093,0.089,1.0]);
    color = [0.800, 0.800, 0.792, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);



    // smaller boat 

        mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.585+xs_boat, 0.085, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.003,0.12,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.562+xs_boat, 0.102, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(26), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.088,0.088,1.0]);
    color = [0.90, 0.10, 0.10, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.60+xs_boat, 0.07, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(-17), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.0016,0.1,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.585+xs_boat, 0, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.1,0.049,1.0]);
    color = [0.800, 0.800, 0.792, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.636+xs_boat, -0.001, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(180), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.068,0.051,1.0]);
    color = [0.800, 0.800, 0.792, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.539+xs_boat, -0.001, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(180), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.068,0.051,1.0]);
    color = [0.800, 0.800, 0.792, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);

  }

function drawwaves(){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.05, 0.07, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.4,0.002,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.07, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.4,0.002,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.6, -0.07, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(0), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.4,0.002,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);
}

  function drawwindmill(theta){
    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.45, -0.245, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(90), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.7,0.02,1.0]);
    color = [0.200, 0.200, 0.196, 0.95];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.45, +0.1, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.02,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.45, +0.1, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.45, +0.1, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta+90),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.45, +0.1, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta+180),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);

    //blades for smaller windmill

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.24, +0.132, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.24, +0.132, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta+90),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.24, +0.132, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta+180),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.24, +0.132, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta-90),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);

    //

    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.45, +0.1, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(theta-90),[0,0,1]);
    mMatrix = mat4.scale(mMatrix,[0.02,0.5,1.0]);
    color = [1, 1, 0.0, 1.0];
    drawblade(color,mMatrix);
    mMatrix = popMatrix(mStack);



    mat4.identity(mMatrix);
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.24, -0.08, 0.0]);
    mMatrix = mat4.rotate(mMatrix, dtr(90), [0.0, 0.0, 1.0]);
    mMatrix = mat4.scale(mMatrix,[0.4,0.02,1.0]);
    color = [0.200, 0.200, 0.196, 0.95];
    drawSquare(color,mMatrix);
    mMatrix = popMatrix(mStack);



    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.24, +0.132, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.015,0.015,1.0]);
    color = [0.0, 0.0, 0.0, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  }

  function drawbushes(){
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.85, -0.588, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.085,0.085,1.0]);
    color = [0.290, 0.690, 0.314, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.99, -0.582, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.13,0.095,1.0]);
    color = [0.039, 0.588, 0.224, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.32, -0.482, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.07,0.07,1.0]);
    color = [0.039, 0.488, 0.224, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.52, -0.482, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.06,0.06,1.0]);
    color = [0.039, 0.588, 0.224, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.4, -0.48, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.099,0.08,1.0]);
    color = [0.390, 0.790, 0.204, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.95, -0.48, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.072,0.0608,1.0]);
    color = [0.290, 0.490, 0.204, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.90, -0.48, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.092,0.0708,1.0]);
    color = [0.390, 0.790, 0.204, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.19, -0.99, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.102,0.0708,1.0]);
    color = [0.390, 0.790, 0.204, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [+0.09, -0.99, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.102,0.0708,1.0]);
    color = [0.390, 0.790, 0.204, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);

    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.05, -0.98, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.192,0.0998,1.0]);
    color = [0.290, 0.490, 0.204, 1.0];
    drawCircle(color,mMatrix);
    mMatrix = popMatrix(mStack);


  }

  function Stars(twinkling){
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.97, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.008+twinkling,0.03+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.515, 0.95, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(-90),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.015+twinkling,0.028+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.486, 0.95, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(90),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.015+twinkling,0.03+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.5, 0.93, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(180),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.01+twinkling,0.03+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.4, 0.835, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.012+twinkling,0.053+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.42, 0.8, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(-90),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.018+twinkling,0.04+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.38, 0.8, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(90),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.018+twinkling,0.04+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.4, 0.77, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(180),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.012+twinkling,0.053+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack); 
    
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, 0.92, 0.0]);
    mMatrix = mat4.scale(mMatrix,[0.008+twinkling,0.03+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.015, 0.9, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(-90),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.015+twinkling,0.028+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.014, 0.9, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(90),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.015+twinkling,0.03+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);
  
    pushMatrix(mStack,mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.0, 0.88, 0.0]);
    mMatrix = mat4.rotate(mMatrix,dtr(180),[0.0,0.0,1.0]);
    mMatrix = mat4.scale(mMatrix,[0.01+twinkling,0.03+twinkling,1.0]);
    color = [1.0, 1.0, 1.0, 1.0];
    drawTriangle(color,mMatrix);
    mMatrix = popMatrix(mStack);    
   
  }


  function drawScene(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    let theta = 0;
    let xs_boat = 0;
    let xb_boat = 0;
    let dirb = 1;
    let dirs = 1;
    let speed = 0.001;
    var twinkling = 0;
    const windmillspeed = 1;
    function animate(){
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        theta += windmillspeed;
        twinkling += 0.002;
        if(twinkling > 0.01) twinkling = 0;
        if (xs_boat > 1.55) {
            dirs = -1;
          } 
          if (xs_boat < -0.4) {
            dirs = 1;
          }
      
          if (xb_boat > 0.3) {
            dirb = -1;
          } 
          if (xb_boat < -1.5) {
            dirb = 1;
          }
         // angle += speed;
          xb_boat += dirb*speed;
          xs_boat  += dirs*speed;
        
        
        drawsky();
        Stars(twinkling);
        drawmoon(theta);
        drawclouds();
        drawmountains();
        drawLand();
        drawroad();
        drawRiver();
        drawwaves();
        drawwheels();
        drawcar();
        drawaboveLand();
        drawTreeTrunk();
        drawboat(xb_boat, xs_boat);
        drawwindmill(theta);
        drawbushes();
        drawhouse();
        drawTree();

        animation = window.requestAnimationFrame(animate);
   }
   animate(); 
  }
  
  // This is the entry point from the html
  function webGLStart() {
    var canvas = document.getElementById("glcanvas");
    initGL(canvas); // intialize webgl
    shaderProgram = initShaders(); // initialize shader code, load, and compile
    aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.enableVertexAttribArray(aPositionLocation);
    uColorLoc = gl.getUniformLocation(shaderProgram, "color");
    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    initSquareBuffer();
    initTriangleBuffer();
    initCircleBuffer();
    initbladeBuffer();
    drawScene();
  }

  function changeView(m){
    mode = m;
    drawScene();
  }