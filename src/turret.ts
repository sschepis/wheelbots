import Game from "./game";
import Axes from "./axes";
import { blurPixelShader } from "babylonjs/Shaders/blur.fragment";

const Vector3 = BABYLON.Vector3;
const PhysicsImpostor = BABYLON.PhysicsImpostor;
const MeshBuilder = BABYLON.MeshBuilder;
const Mesh = BABYLON.Mesh;
const HingeJoint = BABYLON.HingeJoint;
const StandardMaterial = BABYLON.StandardMaterial;
const Color3 = BABYLON.Color3;
const TransformNode = BABYLON.TransformNode;

declare const Ammo: any;

export default class Turret {
  game;
  scene;
  position;
  parentMesh;

  joint: any;
  barrel: any;

  rotationalAxis = new Vector3(0, 2, 0);
  rotatingPivotPosition = new Vector3(0, 1, 0);
  fixedPivotPosition = new Vector3(0, 0, 0);
  centerPointPosition = new Vector3(0, 0, 1);

  rotatingTransform;
  fixedTransform;
  centerpointTransform;

  turretMaterials;

  createBarrel() {
    // create the tube for the turrel barrel
    var path = [];
    var segLength = 2;
    var numSides = 18;
    for (var i = 0; i < 2; i++) {
      var z = i * segLength;
      var y = 0;
      var x = 0;
      path.push(new Vector3(x, y, z));
    }
    // create the barrel from all paths
    this.barrel = Mesh.CreateTube(
      "barrel",
      path,
      0.2,
      numSides,
      null,
      0,
      this.scene
    );
    //this.barrel.position.z -= 1;
    this.barrel.visibility = 0.7;
    // the barrel's parent is the freely-rotating transform
    this.barrel.parent = this.rotatingTransform;
    // create the physics impostor
    this.barrel.physicsImpostor = new PhysicsImpostor(
      this.barrel,
      PhysicsImpostor.BoxImpostor,
      { mass: 1 }
    );
    return this.barrel;
  }

  createHingeJoint() {
    // create a hinge joint from the main and connected
    // pivots and axes so that the turret body can
    // rotate around its axis when effected by external
    // forces
    this.joint = new HingeJoint({
      mainPivot: this.rotatingPivotPosition,
      connectedPivot: this.fixedPivotPosition,
      mainAxis: this.rotatingPivotPosition,
      connectedAxis: this.fixedPivotPosition,
    });
    this.fixedTransform.physicsImpostor = new PhysicsImpostor(
      this.fixedTransform,
      PhysicsImpostor.BoxImpostor,
      { mass: 1000 }
    );
    this.rotatingTransform.physicsImpostor = new PhysicsImpostor(
      this.rotatingTransform,
      PhysicsImpostor.BoxImpostor,
      { mass: 10 }
    );
    // add the main body and joint to the connected axle
    this.fixedTransform.physicsImpostor.addJoint(
      this.rotatingTransform.physicsImpostor,
      this.joint
    );
    return this.joint;
  }

  constructor(game: Game, parentMesh: typeof Mesh, position: typeof Vector3) {
    this.scene = game.scene;
    this.game = game;
    this.position = position;
    this.parentMesh = parentMesh;

    this.turretMaterials = Turret.createMaterials(this.scene);
    this.fixedTransform = Axes.localAxes(this.scene, 5);
    this.fixedTransform.parent = this.parentMesh;

    // create the rotating transform node
    this.rotatingTransform = Axes.localAxes(this.scene, 5);
    this.centerpointTransform = new TransformNode("turret-centerpointTransform");
    this.centerpointTransform.position = this.centerPointPosition.clone();

    // create the hinge joint that lets the
    // turret head rotate with the bidy
    this.createHingeJoint();

    // create the gun barrel tube and place it 
    this.createBarrel();
    
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
    //bullet.position = this.barrel.getAbsolutePosition()
    bullet.parent = this.barrel;

    // set the bullet's physics impostor
    bullet.physicsImpostor = new PhysicsImpostor(
      bullet,
      PhysicsImpostor.SphereImpostor,
      { mass: 1, friction: 0.5, restition: 0.3 },
      this.scene
    )

    // get the directional vector for the bullet
    var dir = this.rotatingTransform.getAbsolutePosition().subtract(
      this.centerpointTransform.getAbsolutePosition()
    );
      
    const force = dir.scale(5);
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
