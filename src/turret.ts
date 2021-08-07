import Game from "./game";
import Axes from "./axes";

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

declare const Ammo: any;

export default class Turret {
  game;
  scene;
  position;
  parentMesh;

  joint: any;
  barrel: any;
  reticle: any;
  base: any;

  rotatingPivotPosition = new Vector3(0, 1, 0);
  fixedPivotPosition = new Vector3(0, 1, 0);
  centerPointPosition = new Vector3(0, 1, 1);

  turretMaterials;

  static createBarrel(scene: typeof Scene): any {
    var barrel;
    // create the tube for the turrel barrel
    var path = [];
    var segLength = 2;
    var numSides = 18;
    for (var i = 0; i < 2; i++) {
      var z = (i * segLength) - 1;
      var y = 1;
      var x = 0;
      path.push(new Vector3(x, y, z));
    }
    // create the barrel from all paths
    barrel = Mesh.CreateTube(
      "barrel",
      path,
      0.2,
      numSides,
      null,
      0,
      scene
    );
    barrel.visibility = 1;
    barrel.rotation.x = Math.PI / 2;

    // create the physics impostor
    barrel.physicsImpostor = new PhysicsImpostor(
      barrel,
      PhysicsImpostor.BoxImpostor,
      { mass: 0 }
    );
    
      // create the reticle
    const reticle = Mesh.CreateBox(
      "reticle",
      {
        width: 1,
        height: 1,
        depth: 0.1,
      },
      scene
    );
    reticle.position.z = 5;
    reticle.visibility = 0.1;

    return { barrel, reticle };
  }

  static createBase(scene: typeof Scene): any {
    const theBase  = new MeshBuilder.CreateBox(
      "cannonBase",
      {
        width: 0.5,
        depth: 0.5,
        height: 1,
      },
      scene
    );
    theBase.physicsImpostor = new PhysicsImpostor(
      theBase,
      PhysicsImpostor.BoxImpostor,
      { mass: 100 }
    );
    theBase.visibility = 0.7;
    return theBase;
  }

  static createHingeJoint(
    base: typeof Mesh,
    barrel: typeof Mesh,
    fixedPivotPosition: typeof Vector3,
    rotatingPivotPosition: typeof Vector3) {
    // create a hinge joint from the main and connected
    // pivots and axes so that the turret body can
    // rotate around its axis when effected by external
    // forces
    const joint = new HingeJoint({
      mainPivot: rotatingPivotPosition,
      connectedPivot:fixedPivotPosition,
      mainAxis: rotatingPivotPosition,
      connectedAxis: fixedPivotPosition,
    });
    // add the main body and joint to the connected axle
    base.physicsImpostor.addJoint(
      barrel.physicsImpostor,
      joint
    );
    return joint;
  }

  constructor(game: Game, parentMesh: typeof Mesh, position: typeof Vector3) {
    this.scene = game.scene;
    this.game = game;
    this.position = position;
    this.parentMesh = parentMesh;

    this.turretMaterials = Turret.createMaterials(this.scene);
    
    // create the base of the turret
    this.base = Turret.createBase(this.scene);

    // create the gun barrel tube and place it 
    const { barrel, reticle } = Turret.createBarrel(this.scene);
    this.barrel = barrel;
    this.reticle = reticle;

    // create the hinge joint that lets the
    // turret head rotate with the bidy
    this.joint = Turret.createHingeJoint(
      this.base,
      this.barrel,
      this.fixedPivotPosition,
      this.rotatingPivotPosition
    );

    this.barrel.actionManager = new ActionManager(this.scene);
    this.barrel.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        {
          trigger: ActionManager.OnLeftPickTrigger,
        },
        () => { 
          this.barrel.physicsImpostor.applyImpulse(
            new Vector3(1, 0, 0),
            this.barrel.getAbsolutePosition().add(
              new Vector3(0, 0, -.9)
            )
          );
        }
      )
    );
    
    // enable the motor
    //this.joint.setMotor(1, 100);

    this.fire = this.fire.bind(this);
    setInterval(() => this.fire(), 1000);
  }

  fire() {
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
    bullet.position = this.barrel.getAbsolutePosition().clone().add(new Vector3(0, 1, 0));

    // set the bullet's physics impostor
    bullet.physicsImpostor = new PhysicsImpostor(
      bullet,
      PhysicsImpostor.SphereImpostor,
      { mass: 0.1, friction: 0.5, restition: 0.3 },
      this.scene
    )

    const force = this.reticle.position
        .add(this.centerPointPosition).scale(1 / 4);
    force.y = 0;

    // fire it
    bullet.physicsImpostor.applyImpulse(force, this.barrel.getAbsolutePosition());
    bullet.life = 0

    bullet.step = () => {
      bullet.life++;
      if (bullet.life > 200 && bullet.physicsImpostor) {
        bullet.physicsImpostor.dispose();
        bullet.dispose();
      }
    };

    bullet.physicsImpostor.onCollideEvent = (e:any, t:any) => {
      console.log(e, t);
    };

    this.scene.onBeforeRenderObservable.add(bullet.step);
  }

  static createMaterials(scene: BABYLON.Scene): any {
    const turretMaterials: any = {};

    // purple material
    turretMaterials["purple"] = new StandardMaterial("purple", scene);
    turretMaterials["purple"].diffuseColor = new Color3(1, 0, 1);

    // yellow material
    turretMaterials["yellow"] = new StandardMaterial("yellow", scene);
    turretMaterials["yellow"].diffuseColor = new Color3(1, 1, 0);

    // black material
    turretMaterials["black"] = new StandardMaterial("black", scene);
    turretMaterials["black"].diffuseColor = new Color3(0, 0, 0);

    return turretMaterials;
  }

  static createRandomTurret(
    game: Game,
    numTurrets: number
  ): Turret[] {
    const out: Turret[] = [];
    let p = new Vector3();
    let r = new Vector3();
    for (let i = 0; i < numTurrets; i++) {
      let m3 = Math.random() * 300 - 150 + 5;
      p.set(5, 0, 5);
      out.push(new Turret(game, game.groundMesh, p));
    }
    return out;
  }
}

/*****************Local Axes****************************/
//Local Axes
