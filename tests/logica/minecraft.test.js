// src/minecraft.js y src/minecraft-icons.js: modpacks de Modrinth (nombres, carpetas, progresos de cada uno y su .jar)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const minecraft = require('../../src/minecraft');
const { MinecraftIcons } = require('../../src/minecraft-icons');
const { carpetaTemporal, escribir } = require('../ayuda/temporal');

test('nombre de cada modpack: sin la versión y con espacios', () => {
  assert.equal(minecraft.modpackName('Xars-Create-Survival-1.2.0'), 'Xars Create Survival');
  assert.equal(minecraft.modpackName('Vanilla Perfected'), 'Vanilla Perfected');
  assert.equal(minecraft.modpackName('Pack_v2.0.1'), 'Pack');
});

test('modpacks de Modrinth: una carpeta por modpack en profiles', (t) => {
  const dir = carpetaTemporal(t);
  escribir(dir, { 'profiles/Xars-Create-Survival-1.2.0/options.txt': '', 'profiles/Vanilla Perfected/options.txt': '', 'app.db': '' });
  const packs = minecraft.modrinthProfiles(dir).sort((a, b) => a.name.localeCompare(b.name));
  assert.deepEqual(packs.map((p) => p.name), ['Vanilla Perfected', 'Xars Create Survival']);
  assert.equal(packs[1].dir, path.join(dir, 'profiles', 'Xars-Create-Survival-1.2.0'));
  assert.deepEqual(minecraft.modrinthProfiles(path.join(dir, 'no-existe')), []);
});

test('cada modpack avisa sus progresos desde su propio registro (lo que ya estaba no se avisa)', async (t) => {
  const dir = carpetaTemporal(t);
  const log = path.join(dir, 'logs', 'latest.log');
  escribir(dir, { 'logs/latest.log': '[21nov2026 05:00:00.000] [main/INFO] Setting user: Xarlord\n[x] [CHAT] Xarlord has made the advancement [Vieja]\n' });
  const avisos = [];
  const w = new minecraft.MinecraftWatcher({ gameDir: dir, onUnlock: (a) => avisos.push(a) });
  w.start();
  t.after(() => w.stop());
  fs.appendFileSync(log, '[--fml.mcVersion, 1.21.1]\n[Render thread/INFO]: [System] [CHAT] Xarlord has made the advancement [Take Aim]\n[x] [CHAT] Otro has made the advancement [De otro]\n');
  for (let i = 0; i < 40 && !avisos.length; i++) await new Promise((r) => setTimeout(r, 100));
  assert.deepEqual(avisos.map((a) => a.name), ['Take Aim']);
  assert.equal(avisos[0].tier, 'bronze');
});

test('íconos: Modrinth guarda el .jar como "<versión>-<cargador>"; se usa el de esa versión', (t) => {
  const dir = carpetaTemporal(t);
  escribir(dir, { 'versions/1.21.1-21.1.267/1.21.1-21.1.267.jar': 'a', 'versions/1.21.11-0.18.4/1.21.11-0.18.4.jar': 'b' });
  const viejo = new Date(Date.now() - 86400000);
  fs.utimesSync(path.join(dir, 'versions/1.21.1-21.1.267/1.21.1-21.1.267.jar'), viejo, viejo); // el otro es más nuevo
  const icons = new MinecraftIcons({ gameDir: dir, cacheDir: carpetaTemporal(t) });
  assert.equal(icons.jarFor('1.21.1').version, '1.21.1-21.1.267');
  assert.equal(icons.jarFor(null).version, '1.21.11-0.18.4', 'sin versión: el más nuevo');
});
