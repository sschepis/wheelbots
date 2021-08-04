import Game from './game';
import Axes from './axes';

declare const Ammo: any;

export default class Turret {
    game;
    scene;
    position;
    parentMesh;
    
    dome;
    joint;
    barrel;
    mainBody;
    connectedAxle;

    mainPivotPosition;
    connectedPivotPosition;
    startingPointPosition;

    turretMaterials;

    constructor(
        game: Game,
        parentMesh: BABYLON.Mesh,
        position: BABYLON.Vector3) {

        this.scene = game.scene;
        this.game = game;
        this.position = position;
        this.parentMesh = parentMesh;

        this.turretMaterials = Turret.createMaterials(this.scene);

    //    this.createDome();

        this.mainBody = new BABYLON.MeshBuilder.CreateBox("mainBody", {width: 1.5, height: 1, depth: 1.5}, this.scene);
        this.mainBody.visibility = 1;
        let localMain = Axes.localAxes(this.scene, 5);
        localMain.parent = this.mainBody;

        this.connectedAxle = new BABYLON.MeshBuilder.CreateBox("connectedAxis", {width: 0.5, height: 1, depth: 0.5}, this.scene);
        this.connectedAxle.visibility = 1;
        this.connectedAxle.position.y = 0.5;
        let localConnected = Axes.localAxes(this.scene, 5);
        localConnected.parent = this.connectedAxle;

        this.mainPivotPosition = new BABYLON.Vector3(0, 2, 0);
        this.connectedPivotPosition = new BABYLON.Vector3(0, 1, 0);
        this.startingPointPosition = this.mainPivotPosition.add(this.connectedPivotPosition);
        this.mainBody.position = this.connectedPivotPosition.add(new BABYLON.Vector3(0, this.connectedPivotPosition.y + 5, 0));
        this.mainBody.physicsImpostor = new BABYLON.PhysicsImpostor(this.mainBody, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 1});
        this.connectedAxle.physicsImpostor = new BABYLON.PhysicsImpostor(this.connectedAxle, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0});
          
        var path = [];
        var segLength = 1;
        var numSides = 18;
        
        for(var i = 0; i < 2; i++) {
            var z = i * segLength;
            var y = 0;
            var x = 0;
            path.push(new BABYLON.Vector3(x, y, z + 0.5));
            
        }
        this.barrel = BABYLON.Mesh.CreateTube("barrel", path, 0.2, numSides, null, 0, this.scene);
        this.barrel.parent = this.mainBody;
        this.barrel.position.x = 0;
        this.barrel.position.y = 0;
        this.barrel.physicsImpostor = new BABYLON.PhysicsImpostor(this.barrel, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0});

        this.joint = new BABYLON.HingeJoint({  
            mainPivot: this.mainPivotPosition ,
            connectedPivot: this.connectedPivotPosition,
            mainAxis: new BABYLON.Vector3(0, 1, 0),
            connectedAxis: new BABYLON.Vector3(0, 2, 0),
        });
        
        // add the main body and joint to the connected axle 
        this.connectedAxle.physicsImpostor.addJoint(this.mainBody.physicsImpostor, this.joint);
        this.joint.setMotor(1, 1000);

        this.fire = this.fire.bind(this);
        setInterval(() => this.fire(), 1000);
    }

    fire() {
        // vehicle geometry
        var bullet = new Ammo.btBoxShape(new Ammo.btVector3(
            0.1,
            0.1,
            0.1));

        const pe = this.scene.getPhysicsEngine();
        if (!pe) {
            throw Error('cannot create');
        }

        // geometry transform
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(
            this.barrel.position.x,
            this.barrel.position.y, 
            this.barrel.position.z));

        // motionstate and local inertia
        var localInertia = new Ammo.btVector3(0, 0, 0);
        bullet.calculateLocalInertia(1, localInertia);

                // add body to world
        pe.getPhysicsPlugin().world.addRigidBody(bullet);

        var tbv30 = new Ammo.btVector3(0, 0, 1000);
        bullet.applyImpulse(tbv30);

        // bullet.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 0, 1000), bullet.getAbsolutePosition()); 
    }

    static createMaterials(scene: BABYLON.Scene): any {

        const turretMaterials: any = {};

        // purple material
        turretMaterials["purple"] = (new BABYLON.StandardMaterial("purple", scene));
        turretMaterials["purple"].diffuseColor = new BABYLON.Color3(1, 0, 1);
        
        // yellow material
        turretMaterials["yellow"] = new BABYLON.StandardMaterial("yellow", scene);
        turretMaterials["yellow"].diffuseColor = new BABYLON.Color3(1, 1, 0);
        
        // black material
        turretMaterials["black"] = new BABYLON.StandardMaterial("black", scene);
        turretMaterials["black"].diffuseColor = new BABYLON.Color3(0, 0, 0);
        
        // turret material
        turretMaterials["TurretDomeMaterial"] = new BABYLON.StandardMaterial("TurretDomeMaterial", scene);
        turretMaterials["TurretDomeMaterial"].alpha = 0.8;
        turretMaterials["TurretDomeMaterial"].emissiveColor = new BABYLON.Color3(0.8, 0.4, 0.5);
        turretMaterials["TurretDomeMaterial"].diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.5);
        turretMaterials["TurretDomeMaterial"].ambientColor = new BABYLON.Color3(0, 0, 0);
        
        return turretMaterials;
    }

    createDome() {
        // create the dome
        this.dome = BABYLON.MeshBuilder.CreateSphere("turret", {
            diameter: 3,
            slice: 0.8,
            sideOrientation:
                BABYLON.Mesh.DOUBLESIDE
        });

        // action manager for turret
        this.dome.actionManager = this.game.actionManager;
        this.dome.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {   // when the turret is collided by vehicle
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: {
                        mesh: this.game.vehicle.chassisMesh,
                        usePreciseIntersection: true
                    }
                },
                () => {
                    // do nothing
                }
            )
        );

        // apply turret material
        this.dome.material =  this.turretMaterials.TurretDomeMaterial;

        // dome impostor for physics
        this.dome.physicsImpostor = new BABYLON.PhysicsImpostor(
            this.dome,
            BABYLON.PhysicsImpostor.domeImpostor, {
            mass: 5,
            friction: 0,
            restitution: 0
        }, this.scene);

        this.dome.position = this.position;
    }

    static createRandomTurret(game: Game, parentMesh: BABYLON.Mesh, numTurret: number): Turret[] {
        const out: Turret[] = [];
        let p = new BABYLON.Vector3();
        let r = new BABYLON.Vector3();
        for (let i = 0; i < numTurret; i++) {
            let m3 = Math.random() * 300 - 150 + 5;
            p.set(5, 0, 5);
            out.push(new Turret(game, parentMesh, p));
        }
        return out;
    }


}

	/*****************Local Axes****************************/
    //Local Axes
