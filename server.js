const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Set storage engine for overwrite files
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    const originalname = file.originalname;
    cb(null, originalname);
  },
});

// Set storage engine for duplicate files
const storagedupli = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    const originalname = file.originalname;
    let newFilename = originalname;

    if (fs.existsSync(path.join('./uploads/', originalname))) {
      const { name, ext } = path.parse(originalname);
      let i = 1;
      while (fs.existsSync(path.join('./uploads/', `${name}_duplicate_${i}${ext}`))) {
        i++;
      }
      newFilename = `${name}_duplicate_${i}${ext}`;
    }
    cb(null, newFilename);
  },
});



const upload = multer({ storage });
const uploaddupli = multer({ storage: storagedupli });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/');
});

app.post('/uploadduplicate', uploaddupli.single('file'), (req, res) => {
  res.redirect('/');
});


app.get('/files', (req, res) => {
  fs.readdir('./uploads/', (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    res.json(files);
  });
});

app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('./uploads/', filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    res.sendStatus(200);
  });
});

// Route for dnwloading file
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('./uploads/', filename);

  res.download(filePath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
