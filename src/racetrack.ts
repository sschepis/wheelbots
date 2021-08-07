const Vector3 = BABYLON.Vector3;
const PhysicsImpostor = BABYLON.PhysicsImpostor;
const MeshBuilder = BABYLON.MeshBuilder;
const Mesh = BABYLON.Mesh;
const HingeJoint = BABYLON.HingeJoint;
const StandardMaterial = BABYLON.StandardMaterial;
const Color3 = BABYLON.Color3;
const Scene = BABYLON.Scene;
const ActionManager = BABYLON.ActionManager;
const TransformNode = BABYLON.TransformNode;
const ExecuteCodeAction = BABYLON.ExecuteCodeAction;
const Material = BABYLON.ExecuteCodeAction;

export default class RaceTrack {
    game;
    scale;
    position;

    constructor(
        game: any, 
        scale: typeof Vector3, 
        position: typeof Vector3) {
        
        this.game = game;
        this.scale = scale;
        this.position = position;

        var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), game.scene);
        light2.position = new BABYLON.Vector3(0, 5, 5);

            // Shadows
        var shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 32;
	
        BABYLON.SceneLoader.ImportMesh(
            "",
            "/src/assets/models/",
            "monaco.babylon",
            game.scene, ( newMeshes: any,
                particleSystems: any,
                skeletons: any) => {
                newMeshes.forEach((mesh: any) => { mesh.rotation.x = Math.PI; mesh.rotation.y = Math.PI; });
        })
    }

}