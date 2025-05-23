Berikut adalah terjemahan dalam bahasa Indonesia:

*@wfc/sql*
Sebuah Object Document Mapper (ODM) sederhana berbasis mongodb untuk database JSON berbasis file. Pustaka ini ditujukan untuk tujuan pendidikan atau proyek skala kecil.

*Instalasi (Pengembangan Lokal)*
Karena pustaka ini belum dipublikasikan ke NPM, Anda perlu menghubungkannya secara lokal untuk menggunakannya di proyek lain.

1. Navigasikan ke direktori ini (`wfc-suite/@wfc/sql/`).
2. Jalankan perintah: `bash npm link`
3. Navigasikan ke direktori proyek Anda (misalnya, `wfc-suite/example-app/`).
4. Jalankan perintah: `bash npm link @wfc/sql`

Sekarang Anda dapat menggunakan `require('@wfc/sql')` atau `import wfcql from '@wfc/sql'` di aplikasi Anda.

*Penggunaan Dasar*
```
const wfcql = require('@wfc/sql');
const { WFCSchema } = wfcql; // atau wfcql.WFCSchema

// 1. Hubungkan ke file database
wfcql.connect('path/to/your/database.wfc.db.json');

// 2. Definisikan Skema
const MySchema = new WFCSchema({
  fieldName: { type: String, required: true },
  count: { type: Number, default: 0 },
  isActive: Boolean,
  created: { type: Date, default: Date.now }
});

// 3. Buat Model
const MyModel = wfcql.model('MyCollectionName', MySchema);

// 4. Gunakan Model
async function contoh() {
  try {
    const newItem = await MyModel.create({ fieldName: 'Test' });
    console.log(newItem);
    const items = await MyModel.find({ isActive: true });
    console.log(items);
  } catch (err) {
    console.error(err);
  }
}

contoh();
```

Terjemahan ini mempertahankan struktur dan format asli dokumen, dengan penyesuaian pada bahasa dan terminologi yang digunakan.