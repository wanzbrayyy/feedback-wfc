
const fs = require('fs');
const path = require('path');

class Connection {
    constructor(filePath = 'wfc.db.json') {
        this.filePath = path.resolve(filePath);
        this.data = {};
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf-8');
                if (fileContent.trim() === '') {
                    this.data = {};
                } else {
                    this.data = JSON.parse(fileContent);
                }
            } else {
                this.data = {};
                this._save();
            }
        } catch (error) {
            console.error(`[WFC-SQL Critical] Could not load database from ${this.filePath}:`, error);
            this.data = {};
        }
    }

    _save() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (error) {
            console.error(`[WFC-SQL Critical] Could not save database to ${this.filePath}:`, error);
        }
    }

    getCollection(name) {
        if (!this.data[name]) {
            this.data[name] = [];
        }
        return this.data[name];
    }

    setCollection(name, collectionData) {
        this.data[name] = collectionData;
        this._save();
    }

    dropCollection(name) {
        if (this.data.hasOwnProperty(name)) {
            delete this.data[name];
            this._save();
            return true;
        }
        return false;
    }
}

module.exports = Connection;