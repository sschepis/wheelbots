import Vehicle from './vehicle';
import Loot from './loot';
import Turret from './turret';
import RaceTrack from './racetrack';
import Hazard from './hazard';

declare const Ammo: any;

var PointerEventTypes = BABYLON.PointerEventTypes;
var Color3 = BABYLON.Color3;
var Vector3 = BABYLON.Vector3;

declare global {
    interface Window { engine: any, scene: any; game: any; }
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

        this.preconfigure();

        this.setupCamera();
        this.setupLighting();
        this.setupGround();
        this.setupSkySphere();

        //const racetrack = new RaceTrack(this, 10, new Vector3(20, 0, 0));

        //Hazard.createRandomHazard(this.scene, 10, this.groundMesh.material);

        this.vehicle = new Vehicle(this);

       // Loot.createRandomLoot(this, 1);
        //Turret.createRandomTurret(this, 1);
    }

    preconfigure() {
        this.scene.onPointerObservable.add((pointerInfo: any) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    break;
                case PointerEventTypes.POINTERUP:
                    break;
                case PointerEventTypes.POINTERMOVE:
                    break;
                case PointerEventTypes.POINTERWHEEL:
                    break;
                case PointerEventTypes.POINTERPICK:
                    break;
                case PointerEventTypes.POINTERTAP:
                    break;
                case PointerEventTypes.POINTERDOUBLETAP:
                    break;
            }
        });
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
        skyMaterial.mainColor = new Color3(0, 0.05, 0.2);
        skyMaterial.lineColor = new Color3(0.07, 0.55, 0.55);	
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
        this.groundMesh.material.mainColor =  new Color3(1, 1, 1);
        this.groundMesh.material.lineColor = new Color3(1, 1, 1);
        this.groundMesh.material.opacity = 0.99;
    }

    setupLighting() {
        // a light
        this.light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.7;
    }

}

