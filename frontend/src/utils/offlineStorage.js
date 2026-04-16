// Offline Storage Utility for AgriSense

class OfflineStorage {
  constructor() {
    this.dbName = 'AgriSenseDB';
    this.version = 1;
    this.db = null;
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Create object stores for different types of data
        if (!db.objectStoreNames.contains('cropPredictions')) {
          const cropStore = db.createObjectStore('cropPredictions', { keyPath: 'id', autoIncrement: true });
          cropStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('fertilizerRecommendations')) {
          const fertilizerStore = db.createObjectStore('fertilizerRecommendations', { keyPath: 'id', autoIncrement: true });
          fertilizerStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('irrigationRecommendations')) {
          const irrigationStore = db.createObjectStore('irrigationRecommendations', { keyPath: 'id', autoIncrement: true });
          irrigationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('diseasePredictions')) {
          const diseaseStore = db.createObjectStore('diseasePredictions', { keyPath: 'id', autoIncrement: true });
          diseaseStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('soilData')) {
          const soilStore = db.createObjectStore('soilData', { keyPath: 'id', autoIncrement: true });
          soilStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('weatherData')) {
          const weatherStore = db.createObjectStore('weatherData', { keyPath: 'id', autoIncrement: true });
          weatherStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('userInputs')) {
          const userInputsStore = db.createObjectStore('userInputs', { keyPath: 'id', autoIncrement: true });
          userInputsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async addData(storeName, data) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }

    return new Promise((resolve, reject) => {
      const request = store.add(data);

      request.onsuccess = () => {
        console.log(`${storeName} data added successfully`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Error adding ${storeName} data`);
        reject(request.error);
      };
    });
  }

  async getData(storeName, id) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Error getting ${storeName} data`);
        reject(request.error);
      };
    });
  }

  async getAllData(storeName) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Error getting all ${storeName} data`);
        reject(request.error);
      };
    });
  }

  async updateData(storeName, id, data) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }

    return new Promise((resolve, reject) => {
      const request = store.put(data, id);

      request.onsuccess = () => {
        console.log(`${storeName} data updated successfully`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Error updating ${storeName} data`);
        reject(request.error);
      };
    });
  }

  async deleteData(storeName, id) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`${storeName} data deleted successfully`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Error deleting ${storeName} data`);
        reject(request.error);
      };
    });
  }

  async clearStore(storeName) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`${storeName} store cleared successfully`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Error clearing ${storeName} store`);
        reject(request.error);
      };
    });
  }

  // Method to check if we're online or offline
  isOnline() {
    return navigator.onLine;
  }

  // Method to sync offline data when back online
  async syncOfflineData() {
    if (!this.isOnline()) {
      console.log('Device is offline, cannot sync data');
      return;
    }

    // Get all offline data and attempt to sync with the server
    const storesToSync = [
      'cropPredictions',
      'fertilizerRecommendations',
      'irrigationRecommendations',
      'diseasePredictions',
      'soilData',
      'weatherData',
      'userInputs'
    ];

    for (const storeName of storesToSync) {
      try {
        const offlineData = await this.getAllData(storeName);
        for (const item of offlineData) {
          // Attempt to send data to server
          // This would need to be implemented based on your API structure
          console.log(`Attempting to sync ${storeName} data:`, item);
        }
      } catch (error) {
        console.error(`Error syncing ${storeName} data:`, error);
      }
    }
  }
}

// Create a singleton instance
const offlineStorage = new OfflineStorage();
export default offlineStorage;