const WFC_TYPES = {
    String: (val) => typeof val === 'string',
    Number: (val) => typeof val === 'number' && !isNaN(val),
    Boolean: (val) => typeof val === 'boolean',
    Date: (val) => val instanceof Date && !isNaN(val.valueOf()),
    Array: (val) => Array.isArray(val),
    Object: (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
    Mixed: () => true,
    UUID: (val) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val)
};

class WFCSchema {
    constructor(definition, options = {}) {
        this.definition = definition;
        this.options = options; // e.g., { timestamps: true }
        this.methods = {};
        this.statics = {};
        this.virtuals = {};

        if (this.options.timestamps) {
            this.definition.createdAt = { type: WFC_TYPES.Date, default: Date.now };
            this.definition.updatedAt = { type: WFC_TYPES.Date, default: Date.now };
        }
    }

    static get Types() {
        return WFC_TYPES;
    }

    method(name, fn) {
        this.methods[name] = fn;
        return this;
    }

    static(name, fn) {
        this.statics[name] = fn;
        return this;
    }

    virtual(name) {
        this.virtuals[name] = this.virtuals[name] || {};
        return {
            get: (fn) => {
                this.virtuals[name].get = fn;
                return this;
            },
            set: (fn) => {
                this.virtuals[name].set = fn;
                return this;
            }
        };
    }

    _getSanitizedValue(key, value, fieldDef) {
        if (value === undefined || value === null) return value;

        let targetType = fieldDef.type || fieldDef;
        if (targetType === WFC_TYPES.Date && !(value instanceof Date) && (typeof value === 'string' || typeof value === 'number')) {
            const parsedDate = new Date(value);
            return !isNaN(parsedDate.valueOf()) ? parsedDate : value;
        }
        if (targetType === WFC_TYPES.Number && typeof value === 'string') {
            const num = parseFloat(value);
            return !isNaN(num) ? num : value;
        }
        if (targetType === WFC_TYPES.Boolean && typeof value === 'string') {
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
        }
        return value;
    }

     _validateAndProcessField(key, value, doc, isNew) {
        const fieldDef = this.definition[key];
        const errors = {};
        let processedValue = value;

        if (!fieldDef) return { value: processedValue, errors };

        const typeValidator = fieldDef.type || fieldDef;
        const isRequired = fieldDef.required === true || (typeof fieldDef.required === 'function' && fieldDef.required.call(doc));
        let defaultValue = fieldDef.default;

        if (isNew && defaultValue !== undefined && (processedValue === undefined || processedValue === null)) {
            processedValue = typeof defaultValue === 'function' ? defaultValue.call(doc) : defaultValue;
        }
        
        processedValue = this._getSanitizedValue(key, processedValue, fieldDef);

        if (isRequired && (processedValue === undefined || processedValue === null || processedValue === '')) {
            errors[key] = `Path \`${key}\` is required.`;
        }

        if (processedValue !== undefined && processedValue !== null) {
            let isValidType = false;
            if (typeof typeValidator === 'function') {
                isValidType = typeValidator(processedValue);
            }
            if (!isValidType) {
                errors[key] = `Path \`${key}\` (value: "${processedValue}") is not of expected type.`;
            }
        }
        return { value: processedValue, errors };
    }


    _validate(doc, isNew = false) {
        const errors = {};
        const processedDoc = { ...doc };

        for (const key in this.definition) {
            const { value, errors: fieldErrors } = this._validateAndProcessField(key, doc[key], doc, isNew);
            processedDoc[key] = value;
            if (Object.keys(fieldErrors).length > 0) {
                errors[key] = fieldErrors[key];
            }
        }
        
        // Process fields in doc not in schema (remove them or handle based on strict option)
        // For simplicity, we'll only keep schema fields + _id
        const finalDoc = {};
        if (processedDoc._id) finalDoc._id = processedDoc._id;

        for (const key in this.definition) {
            if (processedDoc.hasOwnProperty(key) || this.definition[key].default !== undefined) {
                 finalDoc[key] = processedDoc[key];
                 // Re-apply default if after processing it's still undefined and it's a new doc
                 if (isNew && finalDoc[key] === undefined && this.definition[key].default !== undefined) {
                    let defaultValue = this.definition[key].default;
                    finalDoc[key] = typeof defaultValue === 'function' ? defaultValue.call(finalDoc) : defaultValue;
                 }
            }
        }

        return { validatedDoc: finalDoc, errors };
    }
}

module.exports = WFCSchema;