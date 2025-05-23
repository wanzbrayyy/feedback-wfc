const Connection = require('./lib/connection');
const WFCSchema = require('./lib/schema');
const WFCModelBase = require('./lib/model');

class WFCQL {
    constructor() {
        this.connection = null;
        this.models = {};
        this.Schema = WFCSchema;
        this.Types = WFCSchema.Types; // Shortcut
    }

    connect(filePath) {
        if (this.connection) {
            console.warn(`[WFC-SQL] Already connected to ${this.connection.filePath}. New connection to ${filePath} will replace it.`);
        }
        this.connection = new Connection(filePath);
        console.log(`[WFC-SQL] Connected to database: ${this.connection.filePath}`);
        return this.connection;
    }

    model(name, schema) {
        if (!this.connection) {
            throw new Error('[WFC-SQL Error] Database not connected. Call connect(filePath) first.');
        }

        if (!schema) {
            if (this.models[name]) {
                return this.models[name];
            }
            throw new Error(`[WFC-SQL Error] Model '${name}' has not been defined. Pass a schema to define it.`);
        }

        if (!(schema instanceof WFCSchema)) {
            throw new Error('[WFC-SQL Error] Schema must be an instance of wfcql.WFCSchema.');
        }

        if (this.models[name]) {
            // console.warn(`[WFC-SQL Warning] Redefining model "${name}".`);
        }

        class DynamicModel extends WFCModelBase {}

        DynamicModel.dbConnection = this.connection;
        DynamicModel.collectionName = name;
        DynamicModel.schema = schema;

        for (const staticName in schema.statics) {
            DynamicModel[staticName] = schema.statics[staticName].bind(DynamicModel);
        }
        for (const methodName in schema.methods) {
            DynamicModel.prototype[methodName] = schema.methods[methodName];
        }
        
        this.models[name] = DynamicModel;
        return DynamicModel;
    }
}

module.exports = new WFCQL();