// Opciones de Ajustes: las mismas en el menú del ícono junto al reloj y en el de cada consola. Las secciones las arma
// menuSections() de main.js, como datos; aquí se convierten para cada uso:
// - plantillaBandeja: el menú normal de Windows ("Salir" siempre al final).
// - modelo: lo que pinta cada consola (sin funciones, y sin las opciones solo de la bandeja).
// - ejecutar: lo que pasa al elegir una opción en una consola.
// Tipos de opción: 'action' (run), 'toggle' (value + set) y 'choice' (options + value + set).

function plantillaBandeja(sections, salir) {
  const template = [];
  const quit = sections[0] && sections[0].items.find((it) => it.id === 'quit');
  for (const sec of sections) {
    if (template.length) template.push({ type: 'separator' });
    for (const it of sec.items) {
      if (it === quit) continue; // "Salir" va al final
      if (it.type === 'action') template.push({ label: it.label, click: () => it.run() });
      else if (it.type === 'toggle') template.push({ label: it.label, type: 'checkbox', checked: !!it.value, click: (m) => it.set(m.checked) });
      else if (it.type === 'choice')
        template.push({
          label: it.label,
          submenu: it.options.map((o) => ({ label: o.label, type: 'radio', checked: String(o.value) === String(it.value), click: () => it.set(o.value) })),
        });
    }
  }
  template.push({ type: 'separator' }, { label: 'Salir', click: salir });
  return template;
}

function modelo(sections) {
  return sections.map((sec) => ({
    id: sec.id,
    title: sec.title,
    short: sec.short,
    items: sec.items
      .filter((it) => !it.trayOnly)
      .map(({ run, set, trayOnly, ...it }) => it),
  }));
}

// value: en un 'toggle', el nuevo estado (sin él, cambia al contrario); en un 'choice', la opción elegida.
// Si la opción no existe no hace nada. Los errores los maneja quien llama (main.js avisa con un toast).
async function ejecutar(sections, id, value) {
  const it = sections.flatMap((s) => s.items).find((x) => x.id === id);
  if (!it) return false;
  if (it.type === 'action') await it.run();
  else if (it.type === 'toggle') it.set(value === undefined ? !it.value : !!value);
  else if (it.type === 'choice') {
    const opt = it.options.find((o) => String(o.value) === String(value));
    if (opt) it.set(opt.value);
  }
  return true;
}

module.exports = { plantillaBandeja, modelo, ejecutar };
