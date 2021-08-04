import Vehicle from './vehicle';
import Loot from './loot';
import Turret from './turret';
import Hazard from './hazard';


var FRONT_LEFT = 0;
var FRONT_RIGHT = 1;
var BACK_LEFT = 2;
var BACK_RIGHT = 3;

declare type actions = {
    accelerate: boolean,
    brake: boolean,
    right: boolean,
    left: boolean
};

declare type keysActions = {
    KeyW: string,
    KeyS: string,
    KeyA: string,
    KeyD: string
};

declare global {
    interface Window { scene: any; }
}

// declare namespace BABYLON {
//     class Mesh{}
//     class Engine{}
//     class Scene {
//         constructor(e:Engine);
//         getPhysicsEngine(): any;
//         activeCamera: any;
//         registerBeforeRender(cb:any): any;
//         enablePhysics(e:Vector3, f:any): any;

//     }
//     class PhysicsImpostor {
//         constructor(a: any, b: any, c: any, d: any);
//         BoxImpostor: any;
//     }
//     class AmmoJSPlugin{}
//     class Vector3 {
//         constructor(a: number, b: number, c: number);
//         Zero(): any;
//     }
//     class Quaternion{
//         x: number
//         y: number
//         z: number
//         w: number;
//         constructor();
//         constructor(a: number, b: number, c: number, d:number);
//     }
//     class GridMaterial{
//         constructor(a:string, b:any);
//     }
//     class HemisphericLight{
//         constructor(a: string, b: Vector3, c:Scene);
//     }
// }

export default class Game {
    canvas;
    engine;
    scene;
    groundMesh: any;
    camera: any;
    light: any;
    vehicle: any;
    skySphere: any;
    actionManager: any;

    constructor(engine: BABYLON.Engine) {

        this.engine = engine;
        this.canvas = document.getElementById("renderCanvas");        
        this.scene = new BABYLON.Scene(engine);
        // Enable physics
        this.scene.enablePhysics(
            new BABYLON.Vector3(0, -10, 0), 
            new BABYLON.AmmoJSPlugin()
        );
        this.actionManager = new BABYLON.ActionManager(this.scene);

        this.setupCamera();
        this.setupLighting();
        this.setupGround();
        this.setupSkySphere();

        //Hazard.createRandomHazard(this.scene, 10, this.groundMesh.material);

        this.setupVehicle();

       // Loot.createRandomLoot(this, 1);
        Turret.createRandomTurret(this, this.groundMesh, 1);
    }

    onLoot() {
        Loot.createRandomLoot(this, 1);
    }

    setupCamera() {
        // a camera
        this.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachControl(this.canvas, true);
    }

    setupSkySphere() {
        var skyMaterial = new BABYLON.GridMaterial("skyMaterial", this.scene);
        skyMaterial.majorUnitFrequency = 6;
        skyMaterial.minorUnitVisibility = 0.43;
        skyMaterial.gridRatio = 0.5;
        skyMaterial.mainColor = new BABYLON.Color3(0, 0.05, 0.2);
        skyMaterial.lineColor = new BABYLON.Color3(0.07, 0.55, 0.55);	
        skyMaterial.backFaceCulling = false;
        
        this.skySphere = BABYLON.Mesh.CreateSphere("skySphere", 200, 450, this.scene);
        this.skySphere.material = skyMaterial;       
    }

    setupGround() {
        
        // the ground
        this.groundMesh = BABYLON.Mesh.CreateGround("groundMesh", 460, 460, 2, this.scene);
        this.groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
            this.groundMesh, 
            BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: 0,
                friction: 5,
                restitution: 0.7
            }, this.scene);
        
        this.groundMesh.material = new BABYLON.GridMaterial("groundMaterial", this.scene);
        this.groundMesh.material.majorUnitFrequency = 5;
        this.groundMesh.material.minorUnitVisibility = 0.45;
        this.groundMesh.material.gridRatio = 2;
        this.groundMesh.material.backFaceCulling = false;
        this.groundMesh.material.mainColor =  new BABYLON.Color3(1, 1, 1);
        this.groundMesh.material.lineColor = new BABYLON.Color3(1, 1, 1);
        this.groundMesh.material.opacity = 0.99;
    }

    setupLighting() {
        // a light
        this.light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.7;
    }

    setupVehicle() {
        this.vehicle = new Vehicle(this, new BABYLON.Quaternion());
        
        const actions: actions = {
            accelerate: false,
            brake: false,
            right: false,
            left: false
        };
        
        const keysActions: keysActions = {
            "KeyW": 'accelerate',
            "KeyS": 'brake',
            "KeyA": 'left',
            "KeyD": 'right'
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

            if (this.vehicle.ready) {

                var speed = this.vehicle.vehicle.getCurrentSpeedKmHour();
                this.vehicle.breakingForce = 0;
                this.vehicle.engineForce = 0;

                if (actions.accelerate) {
                    if (speed < -1) {
                        this.vehicle.breakingForce = this.vehicle.maxBreakingForce;
                    } else {
                        this.vehicle.engineForce = this.vehicle.maxEngineForce;
                    }

                } else if (actions.brake) {
                    if (speed > 1) {
                        this.vehicle.breakingForce = this.vehicle.maxBreakingForce;
                    } else {
                        this.vehicle.engineForce = -this.vehicle.maxEngineForce;
                    }
                }

                if (actions.right) {
                    if (this.vehicle.vehicleSteering < this.vehicle.steeringClamp) {
                        this.vehicle.vehicleSteering += this.vehicle.steeringIncrement;
                    }

                } else if (actions.left) {
                    if (this.vehicle.vehicleSteering > -this.vehicle.steeringClamp) {
                        this.vehicle.vehicleSteering -= this.vehicle.steeringIncrement;
                    }

                } else {
                    this.vehicle.vehicleSteering = 0;
                }

                this.vehicle.vehicle.applyEngineForce(this.vehicle.engineForce, FRONT_LEFT);
                this.vehicle.vehicle.applyEngineForce(this.vehicle.engineForce, FRONT_RIGHT);

                this.vehicle.vehicle.setBrake(this.vehicle.breakingForce / 2, FRONT_LEFT);
                this.vehicle.vehicle.setBrake(this.vehicle.breakingForce / 2, FRONT_RIGHT);
                this.vehicle.vehicle.setBrake(this.vehicle.breakingForce, BACK_LEFT);
                this.vehicle.vehicle.setBrake(this.vehicle.breakingForce, BACK_RIGHT);

                this.vehicle.vehicle.setSteeringValue(this.vehicle.vehicleSteering, FRONT_LEFT);
                this.vehicle.vehicle.setSteeringValue(this.vehicle.vehicleSteering, FRONT_RIGHT);


                var tm, p, q, i;
                var n = this.vehicle.vehicle.getNumWheels();
                for (i = 0; i < n; i++) {
                    this.vehicle.vehicle.updateWheelTransform(i, true);
                    tm = this.vehicle.vehicle.getWheelTransformWS(i);
                    p = tm.getOrigin();
                    q = tm.getRotation();
                    this.vehicle.wheelMeshes[i].position.set(p.x(), p.y(), p.z());
                    this.vehicle.wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                    this.vehicle.wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI / 2);
                }

                tm = this.vehicle.vehicle.getChassisWorldTransform();
                p = tm.getOrigin();
                q = tm.getRotation();
                this.vehicle.chassisMesh.position.set(p.x(), p.y(), p.z());
                this.vehicle.chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                this.vehicle.chassisMesh.rotate(BABYLON.Axis.X, Math.PI);

            }
        });
    }

}

