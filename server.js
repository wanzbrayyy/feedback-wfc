const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = "mongodb+srv://zanssxploit:pISqUYgJJDfnLW9b@cluster0.fgram.mongodb.net/diskusi_db?retryWrites=true&w=majority";
if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI environment variable is not set.");
    process.exit(1);
}
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    });
const feedbackSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, required: true, trim: true },
    feedback: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now }
});

feedbackSchema.pre('save', function(next) {
    if (this.isNew && !this.id) {
        this.id = this._id.toString();
    }
    next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.render('form', { title: 'Feedback Form | wanzofc' });
});

app.post('/submit-feedback', async (req, res) => {
    const { name, email, whatsapp, feedback } = req.body;
    
    try {
        const newFeedbackEntry = new Feedback({
            name,
            email,
            whatsapp,
            feedback,
        });

        await newFeedbackEntry.save();

        res.render('submitted', {
            title: 'Feedback Received | wanzofc',
            name: newFeedbackEntry.name,
            email: newFeedbackEntry.email,
            whatsapp: newFeedbackEntry.whatsapp,
            feedback: newFeedbackEntry.feedback,
            timestamp: newFeedbackEntry.timestamp
        });

    } catch (error) {
        console.error("Error saving feedback:", error.message);
        res.status(500).send("Terjadi kesalahan saat menyimpan feedback: " + error.message);
    }
});

// ... (kode server.js lainnya) ...

app.get('/admin/dashboard', async (req, res) => {
    try {
        const allFeedbacks = await Feedback.find().sort({ timestamp: -1 });

        res.render('admin-dash', {
            title: 'Admin Dashboard - Feedback | wanzofc',
            reports: allFeedbacks, // Ini tetap objek Mongoose untuk EJS looping
            reportsJSON: JSON.stringify(allFeedbacks.map(doc => {
                const reportObject = doc.toObject({ virtuals: true });
                // PASTIKAN 'id' adalah string dari '_id'
                reportObject.id = reportObject._id.toString(); 
                // Hapus _id jika tidak ingin duplikasi, atau biarkan jika tidak masalah
                // delete reportObject._id; 
                return reportObject;
            }))
        });
    } catch (error) {
        console.error("Error fetching feedbacks for admin:", error.message);
        res.status(500).send("Terjadi kesalahan saat mengambil data laporan: " + error.message);
    }
});

// ... (sisa kode server.js) ...

app.use((req, res, next) => {
    if (!res.headersSent) {
      res.status(404).render('404', { title: 'Halaman Tidak Ditemukan | wanzofc', url: req.originalUrl });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    if (!res.headersSent) {
      res.status(500).send('Terjadi kesalahan internal pada server!');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;