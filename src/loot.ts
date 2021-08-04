import Game from './game';

export default class Loot {
    game;
    sphere: any;
    scene;
    constructor(
        game: Game, 
        size: number, 
        position: BABYLON.Vector3) {
        this.scene = game.scene;
        this.game = game;

        this.sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
            diameter: size,
            slice: 0.4, 
            sideOrientation: 
            BABYLON.Mesh.DOUBLESIDE
        });
        this.sphere.actionManager = game.actionManager;
        this.sphere.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, 
                    parameter: { 
                        mesh: game.vehicle.chassisMesh, 
                        usePreciseIntersection: true
                    }
                }, 
                () => {
                    this.sphere.dispose();
                    this.game.onLoot();
                }
            )
        );

        this.sphere.position.set(position.x, position.y, position.z);

        const redMaterial = new BABYLON.StandardMaterial("RedMaterial", this.scene);
        redMaterial.alpha = 0.8;
        redMaterial.emissiveColor = new BABYLON.Color3(0.8,0.4,0.5);
        redMaterial.diffuseColor = new BABYLON.Color3(0.8,0.4,0.5);
        redMaterial.ambientColor = new BABYLON.Color3(1,1,1);

        this.sphere.material = redMaterial;
        this.sphere.physicsImpostor = new BABYLON.PhysicsImpostor(
            this.sphere,
            BABYLON.PhysicsImpostor.SphereImpostor, {
                mass: 0, 
                friction: 0, 
                restitution: 0 
            }, this.scene);
    }

    static createRandomLoot(game: Game, numLoot: number): Loot[] {
        const out: Loot[] = [];
        let p = new BABYLON.Vector3();
        let r = new BABYLON.Vector3();
        for(let i=0;i<numLoot;i++){
            let m3 = Math.random()*300-150+5;
            p.set(m3,0,m3);
            out.push(new Loot(game, 5, p));
        }
        return out;
    }
}