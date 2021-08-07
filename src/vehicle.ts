import Game from './game';

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

var FRONT_LEFT = 0;
var FRONT_RIGHT = 1;
var BACK_LEFT = 2;
var BACK_RIGHT = 3;

declare type actions = {
    accelerate: boolean,
    brake: boolean,
    right: boolean,
    left: boolean,
    up: boolean,
    down: boolean,
    lside: boolean,
    rside: boolean,
    shoot: boolean,
    slick: boolean,
};

declare type keysActions = {
    KeyW: string,
    KeyS: string,
    KeyA: string,
    KeyD: string,
    KeyI: string,
    KeyK: string,
    KeyJ: string,
    KeyL: string,
    KeyM: string,
    KeyN: string
};

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
        registerBeforeRender(cb: any): any;
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

    frontLeftBumper;
    frontRightBumper;
    rearLeftBumper;
    rearRightBumper;

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
    reticle;

    ready;

    constructor(game: Game) {

        this.canvas = document.getElementById("renderCanvas");
        this.game = game;
        this.scene = game.scene;

        var quat = new BABYLON.Quaternion();

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

        // mass and position
        var massOffset = new Ammo.btVector3(0, 0.4, 0);
        var transform2 = new Ammo.btTransform();
        transform2.setIdentity();
        transform2.setOrigin(massOffset);

        // ammo.js geometry
        var compound = new Ammo.btCompoundShape();
        compound.addChildShape(transform2, this.geometry);
        
        // get the chassis world transform
        var p = transform2.getOrigin();
        var q = transform2.getRotation();

        // four bumpers, mostly to help with positioning
        const bumpers = [0, 1, 2, 3];
        bumpers.map((b) => MeshBuilder.CreateBox("bumper", {
            height: 0.7,
            width: .1,
            depth: .1
        })).forEach((bumper: any, i:any) => {
            bumper.position.set(
                i == 1 || i == 2 ? p.x() + 1.1 : -p.x()-1.1,
                p.y() - ( i == 1 || i == 2 ? this.wheelAxisHeightFront : this.wheelAxisHeightBack ),
                i == 0 || i == 1 ? p.z() + 2.1 : -p.z()-2.1
            );
            bumper.physicsImpostor = new PhysicsImpostor(
                this.reticle,
                PhysicsImpostor.Box,
                { mass: 0.1, friction: 0.5, restition: 1 },
                this.scene
            )
            bumper.rotationQuaternion = new BABYLON.Quaternion;
            bumper.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
            bumper.rotate(BABYLON.Axis.X, Math.PI);
            bumper.parent = this.chassisMesh;
        });
    
        // reticle / front windshield
        this.reticle = MeshBuilder.CreateBox("reticle", {
            height: 2,
            width: 2,
            depth: .1
        }, this.scene);
        this.reticle.parent = this.chassisMesh;
        this.reticle.physicsImpostor = new PhysicsImpostor(
            this.reticle,
            PhysicsImpostor.Box,
            { mass: 0.1, friction: 0.5, restition: 1 },
            this.scene
        )
        this.reticle.rotationQuaternion = new BABYLON.Quaternion;
        this.reticle.visibility = 0.1;
        this.reticle.position.set(q.x(), q.y() - 0.5, q.z() - 2, q.w());
        this.reticle.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
        this.reticle.rotate(BABYLON.Axis.X, Math.PI);

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
        
        this.setupVehicle();
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
        return wheelInfo
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


    shoot() {
        // create a new bullet mesh
        const bullet = new MeshBuilder.CreateSphere(
            "bullet",
            {
                diameter: 0.25,
                segments: 6,
            },
            this.scene
        );

        bullet.life = 0;
        bullet.rotationQuaternion = new BABYLON.Quaternion();
        bullet.position = this.chassisMesh.getAbsolutePosition().clone();
        const retPos = this.reticle.getAbsolutePosition();

        // set the bullet's physics impostor
        bullet.physicsImpostor = new PhysicsImpostor(
            bullet,
            PhysicsImpostor.SphereImpostor,
            { mass: 0.1, friction: 0.5, restition: 0.3 },
            this.scene
        )

        const rap = retPos.subtract(bullet.getAbsolutePosition());
        rap.y = 1;
        rap.scaleInPlace(3);

        // fire it
        bullet.physicsImpostor.applyImpulse(rap, bullet.getAbsolutePosition());
        bullet.life = 0

        var tbv30 = new Ammo.btVector3(-2 * rap.x, rap.y, -2 * rap.z);
        this.body.applyImpulse(tbv30);

        bullet.step = () => {
            bullet.life++;
            if (bullet.life > 200 && bullet.physicsImpostor) {
                bullet.physicsImpostor.dispose();
                bullet.dispose();
            }
        };

        bullet.physicsImpostor.onCollideEvent = (e: any, t: any) => {
            console.log(e, t);
        };

        this.scene.onBeforeRenderObservable.add(bullet.step);
    }

    poop() {
        const poop = new MeshBuilder.CreateBox(
            "poop",
            {
                width: this.chassisWidth,
                depth: this.chassisLength,
                height: 0.01
            },
            this.scene
        );
        poop.position = this.chassisMesh.getAbsolutePosition();
        poop.position.y = 0;
        poop.parent = this.game.groundMesh;
    }

    setupVehicle() {

        const actions: actions = {
            accelerate: false,
            brake: false,
            right: false,
            left: false,
            up: false,
            down: false,
            lside: false,
            rside: false,
            shoot: false,
            slick: false,
        };

        const keysActions: keysActions = {
            "KeyW": 'accelerate',
            "KeyS": 'brake',
            "KeyA": 'left',
            "KeyD": 'right',
            "KeyI": 'up',
            "KeyK": 'down',
            "KeyJ": 'lside',
            "KeyL": 'rside',
            "KeyM": 'shoot',
            "KeyN": 'slick',
        };

        // keydown listener
        window.addEventListener('keydown', (e: any) => {
            if (keysActions[e.code]) {
                actions[keysActions[e.code]] = true;
            }
        });

        window.addEventListener('keyup', (e: any) => {
            if (keysActions[e.code]) {
                actions[keysActions[e.code]] = false;
            }
        });

        this.scene.registerBeforeRender(() => {

            if (this.ready) {

                var speed = this.vehicle.getCurrentSpeedKmHour();
                this.breakingForce = 0;
                this.engineForce = 0;
                var pos = this.chassisMesh.getAbsolutePosition();

                if (actions.accelerate) {
                    if (Math.abs(pos.y) > 1) {
                        var tbv30 = new Ammo.btVector3(0, 0, 50);
                        this.body.applyImpulse(tbv30);
                        actions.accelerate = false;
                    } else {
                        if (speed < -1) {
                            this.breakingForce = this.maxBreakingForce;
                        } else {
                            this.engineForce = this.maxEngineForce;
                        }
                    }

                } else if (actions.brake) {
                    if (Math.abs(pos.y) > (1) {
                        var tbv30 = new Ammo.btVector3(0, 0, -50);
                        this.body.applyImpulse(tbv30);
                        actions.brake = false;
                    } else {
                        if (speed > 1) {
                            this.breakingForce = this.maxBreakingForce;
                        } else {
                            this.engineForce = -this.maxEngineForce;
                        }
                    }
                }

                if (actions.right) {
                    if (Math.abs(pos.y) > (1)) {
                        
                    }
                    else {
                        if (this.vehicleSteering < this.steeringClamp) {
                            this.vehicleSteering += this.steeringIncrement;
                        }
                    }
                } else if (actions.left) {
                    if (Math.abs(pos.y) > (1)) {
                        // var tbv30 = new Ammo.btVector3(-5, 0, 0);
                        // this.backLeftWheel.applyImpulse(tbv30);
                        // var tbv30 = new Ammo.btVector3(5, 0, 0);
                        // this.frontRightWheel.applyImpulse(tbv30);
                        // actions.left = false;
                    }
                    else {
                        if (this.vehicleSteering > -this.steeringClamp) {
                            this.vehicleSteering -= this.steeringIncrement;
                        }
                    }
                } else {
                    this.vehicleSteering = 0;
                }

                if (actions.lside) {
                    var tbv30 = new Ammo.btVector3(50, 0, 0);
                    this.body.applyImpulse(tbv30);
                    actions.lside = false;

                } else if (actions.rside) {
                    var tbv30 = new Ammo.btVector3(-50, 0, 0);
                    this.body.applyImpulse(tbv30);
                    actions.rside = false;
                }
                if (actions.up) {
                    var tbv30 = new Ammo.btVector3(0, 50, 0);
                    this.body.applyImpulse(tbv30);
                    actions.up = false;

                } else if (actions.down) {
                    var tbv30 = new Ammo.btVector3(0, -50, 0);
                    this.body.applyImpulse(tbv30);
                    actions.down = false;
                }

                if (actions.shoot) {
                    this.shoot();
                    actions.shoot = false;
                } else if (actions.slick) {
                    this.poop();
                    actions.slick = false;
                }

                this.vehicle.applyEngineForce(this.engineForce, FRONT_LEFT);
                this.vehicle.applyEngineForce(this.engineForce, FRONT_RIGHT);

                this.vehicle.setBrake(this.breakingForce / 2, FRONT_LEFT);
                this.vehicle.setBrake(this.breakingForce / 2, FRONT_RIGHT);
                this.vehicle.setBrake(this.breakingForce, BACK_LEFT);
                this.vehicle.setBrake(this.breakingForce, BACK_RIGHT);

                this.vehicle.setSteeringValue(this.vehicleSteering, FRONT_LEFT);
                this.vehicle.setSteeringValue(this.vehicleSteering, FRONT_RIGHT);


                var tm, p, q, i;
                var n = this.vehicle.getNumWheels();
                for (i = 0; i < n; i++) {
                    this.vehicle.updateWheelTransform(i, true);
                    tm = this.vehicle.getWheelTransformWS(i);
                    p = tm.getOrigin();
                    q = tm.getRotation();
                    this.wheelMeshes[i].position.set(p.x(), p.y(), p.z());
                    this.wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                    this.wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI / 2);
                }

                tm = this.vehicle.getChassisWorldTransform();
                p = tm.getOrigin();
                q = tm.getRotation();

                this.chassisMesh.position.set(p.x(), p.y(), p.z());
                this.chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                this.chassisMesh.rotate(BABYLON.Axis.X, Math.PI);

            }
        });
    }
}