/* Modelos 3D de las consolas en el selector.
   Si dejas un modelo.glb (o .gltf) en %APPDATA%\NostalHub\consolas\<consola>\, se muestra girando
   en vez de la imagen icono.png. Usa un solo dibujador 3D para todas las consolas. */
(() => {
  const SIZE = 640; // resolución del dibujo (el cuadro en pantalla mide 520)
  const PERIOD = 14; // segundos por vuelta

  const M = {
    renderer: null,
    env: null,
    handles: new Set(),
    cache: new Map(),
    raf: 0,
    start: performance.now(),
    drag: null,

    ready() {
      if (window.THREE && window.THREE_ADDONS) return Promise.resolve();
      return new Promise((res) => window.addEventListener('three-ready', () => res(), { once: true }));
    },

    ensureRenderer() {
      if (this.renderer) return this.renderer;
      const THREE = window.THREE;
      try {
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      } catch (e) {
        console.warn('Sin 3D en este equipo; se usa la imagen', e);
        return null;
      }
      this.renderer.setSize(SIZE, SIZE, false);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // Luz "de estudio" para que los materiales de los modelos (metal, plástico) se vean bien
      const { RoomEnvironment } = window.THREE_ADDONS;
      if (RoomEnvironment) {
        const pm = new THREE.PMREMGenerator(this.renderer);
        this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        pm.dispose();
      }
      return this.renderer;
    },

    load(url) {
      if (!this.cache.has(url)) {
        const { GLTFLoader, makeLoader } = window.THREE_ADDONS;
        this.cache.set(
          url,
          new Promise((resolve, reject) => (makeLoader ? makeLoader() : new GLTFLoader()).load(url, resolve, undefined, reject)).catch((e) => {
            this.cache.delete(url);
            throw e;
          })
        );
      }
      return this.cache.get(url);
    },

    // container: el cuadro del ícono. onFail: se llama si el modelo no carga (para mostrar la imagen)
    async attach(container, url, onFail) {
      await this.ready();
      const THREE = window.THREE;
      if (!this.ensureRenderer()) return onFail && onFail();
      let gltf;
      try {
        gltf = await this.load(url);
      } catch (e) {
        console.warn('No se pudo cargar el modelo de la consola', url, e);
        return onFail && onFail();
      }
      if (!container.isConnected) return;

      const canvas = document.createElement('canvas');
      canvas.className = 'sel-model';
      canvas.width = SIZE;
      canvas.height = SIZE;
      container.appendChild(canvas);
      container.classList.add('has-model');

      const scene = new THREE.Scene();
      if (this.env) {
        scene.environment = this.env;
        scene.environmentIntensity = 0.55;
      }
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.7));
      const key = new THREE.DirectionalLight(0xffffff, 1.3);
      key.position.set(3, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 0.6);
      rim.position.set(-4, 2, -3);
      scene.add(rim);

      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      camera.position.set(0, 1.1, 7.4);
      camera.lookAt(0, 0, 0);

      // Centra y escala el modelo para que quepa, sea del tamaño que sea
      const obj = window.THREE_ADDONS.SkeletonUtils.clone(gltf.scene);
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      obj.position.sub(box.getCenter(new THREE.Vector3()));
      const holder = new THREE.Group();
      holder.add(obj);
      holder.scale.setScalar(2.9 / Math.max(size.x, size.y, size.z, 0.001));
      const pivot = new THREE.Group();
      pivot.rotation.x = 0.12;
      pivot.add(holder);
      scene.add(pivot);

      let mixer = null;
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(obj);
        const clip = gltf.animations.find((c) => /idle|loop/i.test(c.name)) || gltf.animations[0];
        mixer.clipAction(clip).play();
      }

      const h = { canvas, ctx: canvas.getContext('2d'), scene, camera, pivot, mixer, extra: 0, item: container.closest('.sel-item') };
      this.handles.add(h);

      // Arrastrar con el mouse lo hace girar a mano
      canvas.addEventListener('pointerdown', (e) => {
        this.drag = { h, x: e.clientX, extra: h.extra };
        h.dragged = false;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!this.drag || this.drag.h !== h) return;
        const dx = e.clientX - this.drag.x;
        if (Math.abs(dx) > 6) h.dragged = true;
        h.extra = this.drag.extra + dx / 120;
      });
      canvas.addEventListener('pointerup', () => (this.drag = null));
      // Un arrastre no cuenta como clic (no entra a la consola)
      canvas.addEventListener('click', (e) => {
        if (h.dragged) e.stopPropagation();
        h.dragged = false;
      });

      this.loop();
    },

    loop() {
      if (!this.raf) this.raf = requestAnimationFrame(() => this.frame());
    },

    frame() {
      this.raf = 0;
      if (!this.handles.size) return;
      const selector = document.getElementById('selector');
      const visible = selector && !selector.hidden && !document.body.classList.contains('playing');
      const t = (performance.now() - this.start) / 1000;
      const r = this.renderer;
      for (const h of [...this.handles]) {
        if (!h.canvas.isConnected) {
          this.handles.delete(h);
          continue;
        }
        // Solo se dibujan la consola elegida y las vecinas que se asoman
        if (!visible || !h.item || !(h.item.classList.contains('active') || h.item.classList.contains('near'))) continue;
        h.pivot.rotation.y = (t / PERIOD) * Math.PI * 2 + h.extra;
        if (h.mixer) h.mixer.setTime(t);
        r.render(h.scene, h.camera);
        h.ctx.clearRect(0, 0, SIZE, SIZE);
        h.ctx.drawImage(r.domElement, 0, 0);
      }
      this.loop();
    },
  };

  window.ConsoleModel = { attach: (el, url, onFail) => M.attach(el, url, onFail) };
})();
