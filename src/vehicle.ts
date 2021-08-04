import Game from './game';

var FRONT_LEFT = 0;
var FRONT_RIGHT = 1;
var BACK_LEFT = 2;
var BACK_RIGHT = 3;

declare const Ammo: any;
declare namespace BABYLON {
    class Quaternion {
        x: number
        y: number
        z: number
        w: number
    }
    class Mesh {
        material: any;
        rotationQuaternion: any;
    }
    class MeshBuilder {
        constructor(a: string, b: any, c: Scene);
        CreateCylinder(a: string, b: any, c: Scene): Mesh;
        CreateBox(a: string, b: any, c: Scene): Mesh;
    }
    class Scene {
        getPhysicsEngine(): any;
        activeCamera: any;
        registerBeforeRender(cb:any): any;
    }
    class Texture {
        constructor(a: string, b: Scene);
    }
    class StandardMaterial {
        constructor(a: string, b: Scene);
        diffuseTexture: Texture
    }
    class Vector3 {
        constructor(a: number, b: number, c: number);
    }
    class FollowCamera {
        constructor(a: string, b: Vector3, c: Scene)
        radius: number;
        heightOffset: number;
        rotationOffset: number;
        cameraAcceleration: number;
        maxCameraSpeed: number;
        attachControl(val: boolean): void;
        lockedTarget: any; //version 2.5 onwards
    }
    class Color4 {
        constructor(a: number, b: number, c: number, d: number);
    }
    class Vector4 {
        constructor(a: number, b: number, c: number, d: number);
    }
}

export default class Vehicle {

    chassisWidth = 2;
    chassisHeight = 0.7;
    chassisLength = 4;

    wheelAxisPositionBack = -1;
    wheelRadiusBack = 0.8;
    wheelWidthBack = 0.3;
    wheelHalfTrackBack = 1;
    wheelAxisHeightBack = 0.4;

    wheelAxisFrontPosition = 1.0;
    wheelHalfTrackFront = 1;
    wheelAxisHeightFront = 0.4;
    wheelRadiusFront = 0.8;
    wheelWidthFront = 0.3;
    suspensionMaxForce = 600000;

    friction = 10;
    suspensionStiffness = 10;
    suspensionDamping = 0.3;
    suspensionCompression = 4.4;
    suspensionRestLength = 0.6;
    rollInfluence = 1.0;
    vehicleMass = 100;

    steeringIncrement = 0.01;
    steeringClamp = 0.2;
    maxEngineForce = 500;
    maxBreakingForce = 10;
    incEngine = 10.0;

    engineForce = 0;
    vehicleSteering = 0;
    breakingForce = 0;

    wheelDirectionCS0;
    wheelAxleCS;
    wheelMeshes: BABYLON.Mesh[] = [];

    scene: BABYLON.Scene;
    canvas;
    body;

    game;
    geometry;
    physicsWorld;
    chassisMesh;
    transform;
    motionState;
    localInertia;
    vehicle;
    tuning;
    trans;

    ready;

    constructor(game: Game, quat: BABYLON.Quaternion) {

        this.canvas = document.getElementById("renderCanvas");
        this.game = game;
        this.scene = game.scene;

        const pe = this.scene.getPhysicsEngine();
        if (!pe) {
            throw Error('cannot create');
        }

        //Use native Ammo.js
        this.physicsWorld = pe.getPhysicsPlugin().world;
        this.wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
        this.wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

        // vehicle geometry
        this.geometry = new Ammo.btBoxShape(new Ammo.btVector3(
            this.chassisWidth * .5,
            this.chassisHeight * .5,
            this.chassisLength * .5));

        // geometry transform
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(5, 15, 0));
        this.transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        // motionstate and local inertia
        this.motionState = new Ammo.btDefaultMotionState(this.transform);
        this.localInertia = new Ammo.btVector3(0, 0, 0);
        this.geometry.calculateLocalInertia(this.vehicleMass, this.localInertia);

        // chassis mesh
        this.chassisMesh = this.createChassisMesh();
        this.chassisMesh.actionManager = game.actionManager;
        this.chassisMesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnLeftPickTrigger,
                },
                () => { 
                    var tbv30 = new Ammo.btVector3(0, 1000, 0);
                    this.body.applyImpulse(tbv30)
                 }
            )
        );

        // mass and position
        var massOffset = new Ammo.btVector3(0, 0.4, 0);
        var transform2 = new Ammo.btTransform();
        transform2.setIdentity();
        transform2.setOrigin(massOffset);

        // ammo.js geometry
        var compound = new Ammo.btCompoundShape();
        compound.addChildShape(transform2, this.geometry);

        // ammo.js rigid body
        this.body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
            this.vehicleMass,
            this.motionState,
            compound,
            this.localInertia));
        this.body.setActivationState(4);

        // add body to world
        this.physicsWorld.addRigidBody(this.body);

        // vehicle physics and chassis
        this.tuning = new Ammo.btVehicleTuning();
        this.vehicle = new Ammo.btRaycastVehicle(
            this.tuning,
            this.body,
            new Ammo.btDefaultVehicleRaycaster(this.physicsWorld));

        this.vehicle.setCoordinateSystem(0, 1, 2);
        this.trans = this.vehicle.getChassisWorldTransform();
        this.physicsWorld.addAction(this.vehicle);

        // wheel 1
        this.addWheel(true,
            new Ammo.btVector3(
                this.wheelHalfTrackFront,
                this.wheelAxisHeightFront,
                this.wheelAxisFrontPosition
            ),
        this.wheelRadiusFront,
        this.wheelWidthFront,
        FRONT_LEFT);

        // wheel 2
        this.addWheel(true, new Ammo.btVector3(
            -this.wheelHalfTrackFront,
            this.wheelAxisHeightFront,
            this.wheelAxisFrontPosition
        ),
        this.wheelRadiusFront,
        this.wheelWidthFront,
        FRONT_RIGHT);

        // wheel 3
        this.addWheel(false, new Ammo.btVector3(
            -this.wheelHalfTrackBack,
            this.wheelAxisHeightBack,
            this.wheelAxisPositionBack
        ),
        this.wheelRadiusBack,
        this.wheelWidthBack,
        BACK_LEFT);

        // wheel 4
        this.addWheel(false, new Ammo.btVector3(
            this.wheelHalfTrackBack,
            this.wheelAxisHeightBack,
            this.wheelAxisPositionBack
        ),
        this.wheelRadiusBack,
        this.wheelWidthBack,
        BACK_RIGHT);
        
        // vehicle is ready
        this.ready = true;
    }


    createChassisMesh() {

        // base mesh
        const carMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox("carMesh", {
            width: this.chassisWidth,
            depth: this.chassisLength,
            height: this.chassisHeight
        }, this.scene);

        // mesh material
        carMesh.material = new BABYLON.StandardMaterial("RedMaterial", this.scene);
        carMesh.rotationQuaternion = new BABYLON.Quaternion();

        // vehicle follow cam
        const camera = new BABYLON.FollowCamera(
            "FollowCam",
            new BABYLON.Vector3(0, 10, -10),
            this.scene
        );

        camera.radius = 10;
        camera.heightOffset = 4;
        camera.rotationOffset = 0;
        camera.cameraAcceleration = 0.05;
        camera.maxCameraSpeed = 400;
        camera.attachControl(true);
        camera.lockedTarget = carMesh; //version 2.5 onwards
        this.scene.activeCamera = camera;

        return carMesh;
    }

    addWheel(
        isFront: boolean, 
        positionVector: BABYLON.Vector3, 
        wheelRadius: number, 
        wheelThickness: number, 
        index: number) {

        // wheel basics. Not so basic
        var wheelInfo = this.vehicle.addWheel(
            positionVector,
            this.wheelDirectionCS0,
            this.wheelAxleCS,
            this.suspensionRestLength,
            wheelRadius,
            this.tuning,
            isFront);

        // wheel and suspension
        wheelInfo.set_m_suspensionStiffness(this.suspensionStiffness);
        wheelInfo.set_m_wheelsDampingRelaxation(this.suspensionDamping);
        wheelInfo.set_m_wheelsDampingCompression(this.suspensionCompression);
        wheelInfo.set_m_maxSuspensionForce(this.suspensionMaxForce);
        wheelInfo.set_m_frictionSlip(40);
        wheelInfo.set_m_rollInfluence(this.rollInfluence);

        // add to meshes
        this.wheelMeshes[index] = this.createWheelMesh(wheelRadius * 2, wheelThickness);

    }

    createWheelMesh(diameter: number, width: number) {

        //Wheel Material 
        var wheelMaterial = new BABYLON.StandardMaterial("wheelMaterial", this.scene);
        var wheelTexture = new BABYLON.Texture("http://i.imgur.com/ZUWbT6L.png", this.scene);
        wheelMaterial.diffuseTexture = wheelTexture;

        //Set color for wheel tread as black
        var faceColors = [];
        faceColors[1] = new BABYLON.Color4(0, 0, 0, 1);

        //set texture for flat face of wheel 
        var faceUV = [];
        faceUV[0] = new BABYLON.Vector4(0, 0, 1, 1);
        faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1);

        //create wheel front inside and apply material
        var wheelMesh = BABYLON.MeshBuilder.CreateCylinder("wheelMesh", {
            diameter: diameter,
            height: width,
            tessellation: 24,
            faceColors: faceColors,
            faceUV: faceUV
        }, this.scene);

        wheelMesh.material = wheelMaterial;
        wheelMesh.rotationQuaternion = new BABYLON.Quaternion();
        return wheelMesh;
    }

}