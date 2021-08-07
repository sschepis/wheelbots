import Game from './game';

var canvas = document.getElementById("renderCanvas");

var createDefaultEngine = function () {
  return new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  });
};

async function main() {
  await Ammo();

  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine();
    } catch (e) {
      console.log(
        "the available createEngine function failed. Creating the default engine instead"
      );
      return createDefaultEngine();
    }
  };

  window.engine = await asyncEngineCreation();
  if (!window.engine) throw "engine should not be null.";

  window.game = new Game(window.engine);
  window.scene = window.game.scene;

  // Resize
  window.addEventListener("resize", function () {
    window.engine.resize();
  });

  window.engine.runRenderLoop(function () {
    if (window.scene && window.scene.activeCamera) {
      window.scene.render();
    }
  });
}
main();
