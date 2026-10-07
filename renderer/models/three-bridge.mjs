// Carga Three.js (librería 3D) y la deja disponible para los temas como window.THREE.
// También carga el lector de modelos .glb/.gltf (lo que exporta Blockbench o se baja de Sketchfab).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Muchos modelos de Sketchfab usan un formato de material antiguo ("specular-glossiness") que Three.js
// ya no lee: sin esto se ven completamente blancos. Aquí lo traducimos al material normal:
// color y textura del objeto, y qué tan brillante es.
class SpecGlossPlugin {
  constructor(parser) {
    this.parser = parser;
    this.name = 'KHR_materials_pbrSpecularGlossiness';
  }

  ext(materialIndex) {
    const def = this.parser.json.materials[materialIndex];
    return (def && def.extensions && def.extensions[this.name]) || null;
  }

  getMaterialType(materialIndex) {
    return this.ext(materialIndex) ? THREE.MeshStandardMaterial : null;
  }

  extendMaterialParams(materialIndex, params) {
    const e = this.ext(materialIndex);
    if (!e) return Promise.resolve();
    const pending = [];
    const d = e.diffuseFactor || [1, 1, 1, 1];
    params.color = new THREE.Color().setRGB(d[0], d[1], d[2], THREE.LinearSRGBColorSpace);
    params.opacity = d[3] !== undefined ? d[3] : 1;
    if (e.diffuseTexture) pending.push(this.parser.assignTexture(params, 'map', e.diffuseTexture, THREE.SRGBColorSpace));
    const gloss = e.glossinessFactor !== undefined ? e.glossinessFactor : 1;
    params.roughness = Math.min(1, Math.max(0.05, 1 - gloss));
    // El brillo "especular" fuerte se aproxima con un poco de metal
    const spec = e.specularFactor || [1, 1, 1];
    params.metalness = Math.min(0.6, Math.max(0, (spec[0] + spec[1] + spec[2]) / 3 - 0.4));
    return Promise.all(pending);
  }
}

function makeLoader() {
  const loader = new GLTFLoader();
  loader.register((parser) => new SpecGlossPlugin(parser));
  return loader;
}

window.THREE = THREE;
window.THREE_ADDONS = { GLTFLoader, SkeletonUtils, RoomEnvironment, makeLoader };
window.dispatchEvent(new Event('three-ready'));
