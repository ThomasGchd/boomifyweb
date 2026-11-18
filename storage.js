/* Boomify project-local persistence. IndexedDB stores one small project snapshot,
   plus separately stored audio Blobs (never rewritten on every note edit). */
(() => {
  'use strict';
  const NAME = 'boomify-project-storage';
  const VERSION = 1;
  let connection = null;

  function open() {
    if (connection) return connection;
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponible'));
    connection = new Promise((resolve, reject) => {
      let request;
      try { request = indexedDB.open(NAME, VERSION); }
      catch (error) { reject(error); return; }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects');
        if (!db.objectStoreNames.contains('samples')) db.createObjectStore('samples');
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); connection = null; };
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error('Ouverture du stockage impossible'));
      request.onblocked = () => reject(new Error('Stockage bloqué dans un autre onglet'));
    }).catch(error => { connection = null; throw error; });
    return connection;
  }

  async function requestOn(store, mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      let tx, request, value;
      try {
        tx = db.transaction(store, mode);
        request = operation(tx.objectStore(store));
      } catch (error) { reject(error); return; }
      request.onsuccess = () => { value = request.result; };
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error || request.error || new Error('Écriture locale impossible'));
      tx.onabort = () => reject(tx.error || new Error('Transaction annulée'));
    });
  }

  window.BoomifyStorage = Object.freeze({
    open,
    saveProject: snapshot => requestOn('projects', 'readwrite', store => store.put(snapshot, 'current')),
    loadProject: () => requestOn('projects', 'readonly', store => store.get('current')),
    saveSample: (id, file) => {
      if (!id || !(file instanceof Blob)) return Promise.reject(new Error('Sample incorrect'));
      return requestOn('samples', 'readwrite', store => store.put(file, id));
    },
    loadSample: id => requestOn('samples', 'readonly', store => store.get(id))
  });
})();
