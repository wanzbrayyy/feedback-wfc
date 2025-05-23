const wfcql = require('wanzofc-sql');
const { WFCSchema } = wfcql;
const bcrypt = require('bcryptjs'); // <--- Ubah require ini

const userSchema = new WFCSchema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

userSchema.static('hashPassword', async function(password) {
    const saltRounds = 10; // bcryptjs juga menggunakan saltRounds
    return await bcrypt.hash(password, saltRounds); // Panggilan tetap sama
});

userSchema.method('comparePassword', async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password); // Panggilan tetap sama
});

const User = wfcql.model('User', userSchema);

module.exports = User;