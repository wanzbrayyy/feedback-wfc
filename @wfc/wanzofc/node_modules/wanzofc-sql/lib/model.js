const { v4: uuidv4 } = require('uuid');

function applyVirtuals(docInstance, schema) {
    if (schema.virtuals) {
        for (const virtualName in schema.virtuals) {
            if (schema.virtuals[virtualName].get) {
                Object.defineProperty(docInstance, virtualName, {
                    get: schema.virtuals[virtualName].get.bind(docInstance),
                    configurable: true,
                    enumerable: true
                });
            }
            if (schema.virtuals[virtualName].set) {
                 Object.defineProperty(docInstance, virtualName, {
                    set: schema.virtuals[virtualName].set.bind(docInstance),
                    configurable: true
                });
            }
        }
    }
}

class WFCModel {
    constructor(doc, isNew = true) {
        this._isNew = isNew;
        this._doc = {};

        const schemaDef = this.constructor.schema.definition;
        for (const key in schemaDef) {
            if (doc && doc.hasOwnProperty(key)) {
                this._doc[key] = doc[key];
            } else if (isNew && schemaDef[key].default !== undefined) {
                 let defaultValue = schemaDef[key].default;
                 this._doc[key] = typeof defaultValue === 'function' ? defaultValue.call(this._doc) : defaultValue;
            }
        }
        if (doc && doc._id) {
            this._doc._id = doc._id;
        } else if (isNew) {
            this._doc._id = uuidv4();
        }
        
        // Define properties on the instance
        for (const key in this._doc) {
            Object.defineProperty(this, key, {
                get: () => this._doc[key],
                set: (value) => { this._doc[key] = value; },
                enumerable: true,
                configurable: true
            });
        }
        if (!this.hasOwnProperty('_id') && this._doc._id) {
             Object.defineProperty(this, '_id', {
                get: () => this._doc._id,
                enumerable: true,
                configurable: true
            });
        }
        
        applyVirtuals(this, this.constructor.schema);
    }

    get isNew() {
        return this._isNew;
    }

    toObject(options = {}) {
        const obj = { ...this._doc };
        if (this.constructor.schema.virtuals && options.virtuals) {
            for (const virtualName in this.constructor.schema.virtuals) {
                if (this.constructor.schema.virtuals[virtualName].get) {
                    obj[virtualName] = this[virtualName];
                }
            }
        }
        return obj;
    }

    toJSON(options = {}) {
        return this.toObject({...options, virtuals: true });
    }

    async save() {
        const { schema, dbConnection, collectionName } = this.constructor;
        
        if (schema.options.timestamps) {
            this._doc.updatedAt = new Date();
            if (this.isNew) {
                this._doc.createdAt = this._doc.createdAt || new Date();
            }
        }

        const { validatedDoc, errors } = schema._validate(this.toObject(), this.isNew);
        if (Object.keys(errors).length > 0) {
            const validationError = new Error("Validation failed");
            validationError.errors = errors;
            throw validationError;
        }
        this._doc = { ...this._doc, ...validatedDoc }; // Update internal doc with validated & processed values


        const collection = dbConnection.getCollection(collectionName);
        
        if (this.isNew) {
            if (!this._doc._id) this._doc._id = uuidv4(); // Ensure _id if somehow missed
            collection.push(this._doc);
            this._isNew = false;
        } else {
            const index = collection.findIndex(item => item._id === this._doc._id);
            if (index > -1) {
                collection[index] = this._doc;
            } else {
                throw new Error(`Document with _id ${this._doc._id} not found for update.`);
            }
        }
        dbConnection.setCollection(collectionName, collection);

        // Re-apply properties to instance in case default/validation changed them
        for (const key in this._doc) {
            if (!this.hasOwnProperty(key)) {
                Object.defineProperty(this, key, {
                    get: () => this._doc[key],
                    set: (value) => { this._doc[key] = value; },
                    enumerable: true,
                    configurable: true
                });
            } else {
                 this[key] = this._doc[key]; // Trigger setter if exists
            }
        }
        if (!this.hasOwnProperty('_id') && this._doc._id) {
             Object.defineProperty(this, '_id', {
                get: () => this._doc._id,
                enumerable: true,
                configurable: true
            });
        }

        return this;
    }

    async remove() {
        if (this.isNew || !this._doc._id) {
            throw new Error("Cannot remove a new or unsaved document, or document without _id.");
        }
        return await this.constructor.deleteOne({ _id: this._doc._id });
    }

    static _createModelInstance(docData, isNew = false) {
        const instance = new this(docData, isNew);
        return instance;
    }
    
    static async create(doc) {
        const instance = this._createModelInstance(doc, true);
        return await instance.save();
    }

    static _checkQueryMatch(item, query) {
        for (const key in query) {
            // Simple comparison. For $operators, this needs to be much more complex.
            if (item[key] !== query[key]) {
                return false;
            }
        }
        return true;
    }

    static async find(query = {}) {
        const collection = this.dbConnection.getCollection(this.collectionName);
        const results = collection.filter(item => this._checkQueryMatch(item, query));
        return results.map(doc => this._createModelInstance(doc, false));
    }

    static async findById(id) {
        const collection = this.dbConnection.getCollection(this.collectionName);
        const doc = collection.find(item => item._id === id);
        return doc ? this._createModelInstance(doc, false) : null;
    }

    static async findOne(query = {}) {
        const collection = this.dbConnection.getCollection(this.collectionName);
        const doc = collection.find(item => this._checkQueryMatch(item, query));
        return doc ? this._createModelInstance(doc, false) : null;
    }

    static async updateOne(query, updateData, options = {}) {
        const collection = this.dbConnection.getCollection(this.collectionName);
        let matchedCount = 0;
        let modifiedCount = 0;
        let updatedDoc = null;

        const itemIndex = collection.findIndex(item => this._checkQueryMatch(item, query));

        if (itemIndex > -1) {
            matchedCount = 1;
            const originalDoc = collection[itemIndex];
            const docToUpdate = { ...originalDoc, ...updateData }; // Simple merge
            
            if (this.schema.options.timestamps) {
                docToUpdate.updatedAt = new Date();
            }
            
            const { validatedDoc, errors } = this.schema._validate(docToUpdate, false);
             if (Object.keys(errors).length > 0) {
                const validationError = new Error("Validation failed during updateOne");
                validationError.errors = errors;
                throw validationError;
            }
            
            collection[itemIndex] = validatedDoc;
            this.dbConnection.setCollection(this.collectionName, collection);
            modifiedCount = 1;
            updatedDoc = validatedDoc;
        }
        return { acknowledged: true, matchedCount, modifiedCount, upsertedId: null, document: updatedDoc ? this._createModelInstance(updatedDoc, false) : null };
    }

    static async findByIdAndUpdate(id, updateData, options = { new: false, runValidators: false }) {
        const collection = this.dbConnection.getCollection(this.collectionName);
        const itemIndex = collection.findIndex(item => item._id === id);

        if (itemIndex === -1) return null;

        const originalDoc = { ...collection[itemIndex] };
        let docToUpdate = { ...originalDoc, ...updateData };

        if (this.schema.options.timestamps) {
            docToUpdate.updatedAt = new Date();
        }

        if (options.runValidators) {
             const { validatedDoc, errors } = this.schema._validate(docToUpdate, false);
             if (Object.keys(errors).length > 0) {
                const validationError = new Error("Validation failed during findByIdAndUpdate");
                validationError.errors = errors;
                throw validationError;
            }
            docToUpdate = validatedDoc;
        }
        
        collection[itemIndex] = docToUpdate;
        this.dbConnection.setCollection(this.collectionName, collection);
        
        return options.new ? this._createModelInstance(docToUpdate, false) : this._createModelInstance(originalDoc, false);
    }
    
    static async deleteOne(query) {
        const collection = this.dbConnection.getCollection(this.collectionName);
        let deletedCount = 0;
        const itemIndex = collection.findIndex(item => this._checkQueryMatch(item, query));

        if (itemIndex > -1) {
            collection.splice(itemIndex, 1);
            this.dbConnection.setCollection(this.collectionName, collection);
            deletedCount = 1;
        }
        return { acknowledged: true, deletedCount };
    }

    static async findByIdAndDelete(id) {
        const collection = this.dbConnection.getCollection(this.collectionName);
        const itemIndex = collection.findIndex(item => item._id === id);

        if (itemIndex === -1) return null;
        
        const deletedDocData = { ...collection[itemIndex] };
        collection.splice(itemIndex, 1);
        this.dbConnection.setCollection(this.collectionName, collection);
        return this._createModelInstance(deletedDocData, false);
    }

    static async countDocuments(query = {}) {
        const items = await this.find(query);
        return items.length;
    }
    
    static dropCollection() {
        const result = this.dbConnection.dropCollection(this.collectionName);
        return { acknowledged: result, collectionName: this.collectionName };
    }
}

module.exports = WFCModel;