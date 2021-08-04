export default class Hazard {
    constructor(
        scene: BABYLON.Scene, 
        size: BABYLON.Vector3, 
        position: BABYLON.Vector3, 
        rotation: BABYLON.Vector3,
        mass: number,
        material: BABYLON.Material) {
        var box = BABYLON.MeshBuilder.CreateBox("box", {
                width: size.x, 
                depth: size.z, 
                height:size.y
            }, 
            scene);
        box.position.set(position.x, position.y, position.z);
        box.rotation.set(rotation.x, rotation.y, rotation.z);
        if(!mass) {
            mass = 0;
            box.material = material;
        } else {
            box.position.y += 5;
        }
        //box.material = material;
        box.physicsImpostor = new BABYLON.PhysicsImpostor(
            box,
            BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: mass, 
                friction: 0.5, 
                restitution: 0.7 
            }, scene);
    }

    static createRandomHazard(scene: BABYLON.Scene, numLoot: number, m: BABYLON.Material) {
        let s = new BABYLON.Vector3();
        let p = new BABYLON.Vector3();
        let r = new BABYLON.Vector3();
        for(let i=0;i<numLoot;i++){
            let _m = Math.random()*300-150+5;
            let m3 = Math.random()*300-150+5;
            let m2 = Math.random()*10;
            s.set(m2,m2,m2);
            p.set(m3,0,m);
            r.set(_m,_m,_m);
            new Hazard(scene, s, p, r, 0, m);
        }
    }
}