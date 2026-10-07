/* Modelo original "Bloque neón": un cubo con emblema de cuadrados que salta girando junto a un pincho.
   Se usa como ícono 3D de Geometry Dash en el tema PS2. */
window.PS2Models.register({
  id: 'bloque-neon',
  match: { appIds: ['322170'], names: [/geometry\s*dash/i] },

  build(THREE) {
    const root = new THREE.Group();

    // ---- Textura del emblema (se dibuja en un canvas) ----
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#ff3fd2'; // borde magenta
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#2a0f4f'; // fondo violeta oscuro
    g.fillRect(22, 22, 212, 212);
    g.strokeStyle = '#3ff2ff'; // cuadrado cian
    g.lineWidth = 18;
    g.strokeRect(62, 62, 132, 132);
    g.fillStyle = '#ffffff'; // rombo central
    g.beginPath();
    g.moveTo(128, 98);
    g.lineTo(158, 128);
    g.lineTo(128, 158);
    g.lineTo(98, 128);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; // brillo en la esquina
    g.fillRect(22, 22, 212, 40);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    // ---- Bloque ----
    const block = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const boxMat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.35,
      roughness: 0.45,
      metalness: 0.1,
    });
    block.add(new THREE.Mesh(boxGeo, boxMat));
    block.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), new THREE.LineBasicMaterial({ color: 0xffffff })));
    const REST_Y = -0.9 + 0.55;
    block.position.set(-0.45, REST_Y, 0);
    root.add(block);

    // ---- Pincho (pirámide de 4 caras) ----
    const spikeGeo = new THREE.ConeGeometry(0.42, 0.75, 4);
    const spike = new THREE.Mesh(
      spikeGeo,
      new THREE.MeshStandardMaterial({ color: 0x1b1b2e, emissive: 0x0a2a3a, roughness: 0.6, flatShading: true })
    );
    spike.add(new THREE.LineSegments(new THREE.EdgesGeometry(spikeGeo), new THREE.LineBasicMaterial({ color: 0x3ff2ff })));
    spike.rotation.y = Math.PI / 4;
    spike.position.set(0.75, -0.9 + 0.375, 0);
    root.add(spike);

    // ---- Sombra suave bajo el bloque ----
    const sc = document.createElement('canvas');
    sc.width = sc.height = 128;
    const sg = sc.getContext('2d');
    const grad = sg.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(-0.45, -0.899, 0);
    root.add(shadow);

    // ---- Animación: salto con un cuarto de vuelta y aplastón al caer ----
    const PERIOD = 1.15;
    const AIR = 0.72; // fracción del ciclo en el aire
    function update(t) {
      const n = Math.floor(t / PERIOD);
      const u = (t % PERIOD) / PERIOD;
      let y = REST_Y;
      let rot = -n * (Math.PI / 2);
      let sy = 1;
      let sxz = 1;
      if (u < AIR) {
        const k = u / AIR;
        y = REST_Y + 1.15 * Math.sin(Math.PI * k);
        rot -= (Math.PI / 2) * k;
      } else {
        const k = (u - AIR) / (1 - AIR);
        rot -= Math.PI / 2;
        const s = Math.sin(Math.PI * k);
        sy = 1 - 0.14 * s;
        sxz = 1 + 0.07 * s;
        y = REST_Y - 0.55 * 0.14 * s;
      }
      block.position.y = y;
      block.rotation.z = rot;
      block.scale.set(sxz, sy, sxz);
      const h = (y - REST_Y) / 1.15;
      shadow.scale.setScalar(1 - 0.5 * Math.max(0, h));
      shadow.material.opacity = 1 - 0.6 * Math.max(0, h);
    }

    return { object: root, update };
  },
});
