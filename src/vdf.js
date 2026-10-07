// Parser mínimo del formato de texto VDF/KeyValues de Valve
// (libraryfolders.vdf, appmanifest_*.acf).
// Devuelve objetos JS anidados; las claves se guardan tal cual vienen.

function parseVdf(text) {
  let i = 0;
  const n = text.length;

  function skipWhitespaceAndComments() {
    while (i < n) {
      const c = text[i];
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '﻿') {
        i++;
      } else if (c === '/' && text[i + 1] === '/') {
        while (i < n && text[i] !== '\n') i++;
      } else {
        break;
      }
    }
  }

  function readString() {
    if (text[i] === '"') {
      i++;
      let out = '';
      while (i < n && text[i] !== '"') {
        if (text[i] === '\\' && i + 1 < n) {
          const next = text[i + 1];
          if (next === 'n') out += '\n';
          else if (next === 't') out += '\t';
          else out += next; // \\  \"
          i += 2;
        } else {
          out += text[i++];
        }
      }
      i++; // comilla de cierre
      return out;
    }
    // token sin comillas
    let start = i;
    while (i < n && !/[\s{}"]/.test(text[i])) i++;
    return text.slice(start, i);
  }

  function readObject() {
    const obj = {};
    while (true) {
      skipWhitespaceAndComments();
      if (i >= n) return obj;
      if (text[i] === '}') {
        i++;
        return obj;
      }
      const key = readString();
      skipWhitespaceAndComments();
      if (text[i] === '{') {
        i++;
        obj[key] = readObject();
      } else {
        obj[key] = readString();
      }
      // ignora condicionales tipo [$WIN32]
      skipWhitespaceAndComments();
      if (text[i] === '[') {
        while (i < n && text[i] !== ']') i++;
        i++;
      }
    }
  }

  return readObject();
}

module.exports = { parseVdf };
