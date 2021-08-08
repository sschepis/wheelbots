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
const VirtualJoystick = BABYLON.VirtualJoystick;
const VirtualKeyboard = BABYLON.VirtualKeyboard;

export default class VirtuaKeyboard {
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

        this.keyboard = new VirtualKeyboard('keyboard').
    }

}