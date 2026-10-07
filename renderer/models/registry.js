/* Registro de modelos 3D para los íconos de la PS2.
   Cada modelo es un archivo en renderer/models/ que llama a PS2Models.register({...}):
     id:     nombre interno
     match:  { appIds: ['322170'], names: [/geometry\s*dash/i] }  -> a qué juegos se aplica
     build(THREE): devuelve { object, update(t, object) }
       - object: un THREE.Object3D centrado en el origen, que quepa en una caja de ~2x2x2
       - update: (opcional) animación propia; t = segundos desde que empezó
   El giro lento alrededor del eje vertical lo pone el tema; el modelo solo anima lo suyo. */
window.PS2Models = {
  defs: [],
  register(def) {
    this.defs.push(def);
  },
  find(game) {
    const appId = (String(game.id || '').match(/^steam-(\d+)$/) || [])[1];
    return (
      this.defs.find((d) => {
        const m = d.match || {};
        if (appId && (m.appIds || []).includes(appId)) return true;
        return (m.names || []).some((re) => re.test(game.name || ''));
      }) || null
    );
  },
};
