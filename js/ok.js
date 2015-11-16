  //----- TESTEO--- //

      DEBUG=true;

  //---------------//
  
  window.onload = function() {
    
  // --------- SE CARGA EL MODELO 3D ---- //

    var w = Magi.Bin.load('walas.bin');
    w.flatNormals = false;
  // ----------------------------------- //

  w.onload = function() {

  // ----- CARGA DEL VIDEO O WEBCAM ----------------//
    
    var video = document.createElement('video');
    video.src = "output_4.ogg";
    video.width = 320;
    video.height = 240;
    video.loop = true;
    video.volume = 0;
    video.controls = true;
    document.body.appendChild(video);

  // -------------------------------------------- //
  

  // ---- CARGA DEL CANVAS MODELO 3D -------------------//
    
    var canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    // document.body.appendChild(canvas);

  // -------------------------------------------------- //


  //----- CARGA DEl CANVAS DE TESTEO -------------------------------//

    var debugCanvas = document.createElement('canvas');
    debugCanvas.width = 320;
    debugCanvas.height = 240;
    debugCanvas.id = 'debugCanvas';
    document.body.appendChild(debugCanvas);

  // --------------------------------------------------------------//

    var raster = new NyARRgbRaster_Canvas2D(canvas);
    var param = new FLARParam(320,240);
    var resultMat = new NyARTransMatResult();
    var detector = new FLARMultiIdMarkerDetector(param, 80);
    detector.setContinueMode(true);

  
  // ------------------ INTERPRETACION DE MODELO 3D ---------------------- //

      var glCanvas = document.createElement('canvas');
      glCanvas.width = 320;
      glCanvas.height = 240;
      document.body.appendChild(glCanvas);
      var display = new Magi.Scene(glCanvas);
      param.copyCameraMatrix(display.camera.perspectiveMatrix, 100, 10000);
      display.camera.useProjectionMatrix = true;
      var videoTex = new Magi.FlipFilterQuad();
      videoTex.material.textures.Texture0 = new Magi.Texture();
      videoTex.material.textures.Texture0.image = video;
      videoTex.material.textures.Texture0.generateMipmaps = false;
      display.scene.appendChild(videoTex);

  // -------------------------------------------------------------------------//

      var frame = 0;
      var ctx = canvas.getContext('2d');
      var times = [];
      var pastResults = {};
      var lastTime = 0;
      var cubes = {};

    setInterval(function() {
        if (video.paused) return;
        if (window.paused) return;
        if (video.currentTime == lastTime) return;
        lastTime = video.currentTime;
        ctx.drawImage(video, 0,0,320,240);
        var dt = new Date().getTime();

      videoTex.material.textures.Texture0.changed = true;
      canvas.changed = true;

      var t = new Date();
      var detected = detector.detectMarkerLite(raster, 190);

    // BUSCA LOS DIFERENTES MARCADORES Y LE AGREGA UNA ID --------------//

      for (var idx = 0; idx<detected; idx++) {
        var id = detector.getIdMarkerData(idx);
        var currId;
        if (id.packetLength > 4) {
          currId = -1;
        }else{
          currId=0;
          for (var i = 0; i < id.packetLength; i++ ) {
            currId = (currId << 8) | id.getPacketData(i);
          }
        }
        if (!pastResults[currId]) {
          pastResults[currId] = {};
        }

        console.log("[add] : ID = " + currId);
        detector.getTransformMatrix(idx, resultMat);
        pastResults[currId].age = 0;
        pastResults[currId].transform = Object.asCopy(resultMat);
          if (idx == 0) times.push(new Date()-t);
        }
        for (var i in pastResults) {
          var r = pastResults[i];
          if (r.age > 5) delete pastResults[i];
          r.age++;
        }

    // ----------------------------------------------------------------//


    // IDENTIFICA LA ID Y INSERTA EL MODELO 3D ------------------------// 

       for (var i in cubes) cubes[i].display = false;
       for (var i in pastResults) {
          if (!cubes[i]) {
            var pivot = new Magi.Node();
            pivot.transform = mat4.identity();
            pivot.setScale(80);
            var cube;
            if (i == 64) {
              var n = new Magi.Node();
              walas = n;
              var sc = 2.5 / (w.boundingBox.diameter);
              n.scaling = [sc, sc, sc];
              n.model = w.makeVBO();
              n.setZ(-0.85);
              n.rotation.axis = [1,0,0];
              n.rotation.angle = Math.PI;
              n.material = Magi.DefaultMaterial.get();
              n.material.floats.LightDiffuse = [1,1,1,1];
              n.material.floats.MaterialShininess = 6.0;
              n.material.floats.MaterialDiffuse = [1,1,1,1];
              cube = n;
            } else {
              cube = new Magi.Cube();
              cube.setZ(-0.125);
              cube.scaling[2] = 0.25;
            }
            pivot.appendChild(cube);
            pivot.cube = cube;
            display.scene.appendChild(pivot);
            cubes[i] = pivot;
          }

          cubes[i].display = true;
          var mat = pastResults[i].transform;
          var cm = cubes[i].transform;

        cm[0] = mat.m00;
        cm[1] = -mat.m10;
        cm[2] = mat.m20;
        cm[3] = 0;
        cm[4] = mat.m01;
        cm[5] = -mat.m11;
        cm[6] = mat.m21;
        cm[7] = 0;
        cm[8] = -mat.m02;
        cm[9] = mat.m12;
        cm[10] = -mat.m22;
        cm[11] = 0;
        cm[12] = mat.m03;
        cm[13] = -mat.m13;
        cm[14] = mat.m23;
        cm[15] = 1;
      }
    // ----------------------------------------------------------------//

      // if (detected == 0) times.push(new Date()-t);
      // if (times.length > 100) {
      //   if (window.console)
      //     console.log(times.reduce(function(s,i){return s+i;})/times.length)
      //   times.splice(0);
      // }
    }, 50);
  }
}