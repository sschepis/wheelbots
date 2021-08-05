export default class Ramp {
    constructor(
        scene: BABYLON.Scene,
        size: BABYLON.Vector3,
        position: BABYLON.Vector3,
        rotation: BABYLON.Vector3,
        mass: number,
        material: BABYLON.Material) {
        var box = BABYLON.MeshBuilder.CreateBox("ramp", {
            width: size.x,
            depth: size.z,
            height: size.y
        },
            scene);
        box.position.set(position.x, position.y, position.z);
        box.rotation.set(rotation.x, rotation.y, rotation.z);
        if (!mass) {
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

    static createRandomRamps(scene: BABYLON.Scene, numRamps: number, m: BABYLON.Material) {
        let s = new BABYLON.Vector3();
        let p = new BABYLON.Vector3();
        let r = new BABYLON.Vector3();
        for (let i = 0; i < numRamps; i++) {
            let _m = Math.random() * 300 - 150;
            let m3 = Math.random() * 300 - 150;
            let m2 = (Math.random() * 8) * 5;
            s.set(m2, 1, m2);
            p.set(m3, 0, m);
            r.set(_m, _m / 4 + 10, _m / 4 + 10);
            new Ramp(scene, s, p, r, 0, m);
        }
    }
}