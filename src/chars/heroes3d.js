// =============================================================
//  NOIVO e NOIVA com os personagens do Mixamo
//  noivo: zumbi de terno + cartola    noiva: zumbi azul + véu e buquê
// =============================================================
import * as THREE from 'three';
import { createChar } from './models.js';
import { bouquetGeo } from '../mantis/heroes.js';

class Hero3D {
  constructor(key) {
    this.char = createChar(key, { shadow: true, seed: Math.random() });
    this.group = this.char.root;
    this.anim = this.char.anim;
  }
  headTop(v) { return this.char.headTop(v); }
  headPos(v) { return this.char.headPos(v); }
  update(dt) { this.char.update(dt); }
}

export class Groom3D extends Hero3D {
  constructor() {
    super('noivo_zumbi');
    const satin = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.35 });
    const red = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
    const hat = new THREE.Group();
    hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.32, 24), satin)); hat.children[0].position.y = 0.17;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 28), satin); hat.add(brim);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.06, 24, 1, true), red); band.position.y = 0.05; hat.add(band);
    hat.rotation.z = -0.12;
    this.hat = this.char.attach('HeadTop_End', hat, { pos: [0, -0.05, 0] });
    for (const m of hat.children) m.castShadow = true;
  }
}

export class Bride3D extends Hero3D {
  constructor() {
    super('noiva');  // mesma zumbi azul, agora com vestido de noiva (corpete + saia de renda)
    const tulle = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
    // véu: cone aberto caindo pelas costas
    const veil = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 28, 1, true, Math.PI * 0.62, Math.PI * 0.76), tulle);  // só nas costas
    veil.position.set(0, -0.36, -0.12);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
    crown.rotation.x = Math.PI / 2;
    const flowers = new THREE.Group(); flowers.add(veil, crown);
    this.char.attach('HeadTop_End', flowers, { pos: [0, -0.04, 0] });
    const bq = bouquetGeo();
    const bouquet = new THREE.Mesh(bq.geo, bq.mat); bouquet.castShadow = true;
    this.char.attach('LeftHand', bouquet, { pos: [0, 0.1, 0.05], scale: 1.3 });
  }
}
