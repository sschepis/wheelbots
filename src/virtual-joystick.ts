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

export default class VirtualJoystick {
    game;
    scale;
    position;

    leftStick;
    rightStick;

    constructor(
        game: any,
        scale: typeof Vector3,
        position: typeof Vector3) {

        this.game = game;
        this.scale = scale;
        this.position = position;

        // Create joystick and set z index to be below playgrounds top bar
        this.leftStick = new VirtualJoystick(true);
        this.rightStick = new VirtualJoystick(false);
        VirtualJoystick.Canvas.style.zIndex = "4";

        // Game/Render loop
        var movespeed = 5
        this.game.scene.onBeforeRenderObservable.add(() => {
            if (this.leftStick.pressed) {
                this.onLeftJoystickPressed();
            }
            if (this.rightStick.pressed) {
                this.onRightJoystickPressed();
            }
        })

    }

    onLeftJoystickPressed() {
        // base does nothing
    }

    onRightJoystickPressed() {
        // base does nothing
    }

}