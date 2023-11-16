const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(__dirname + '/public'));

// Set up Azure Storage Blob Service
const connectionString = 'DefaultEndpointsProtocol=https;AccountName=filelab;AccountKey=xszf6EZ+eSpY8e2y0qF1Vmk/7ovg4OfjUTojwv1kml3EfiEv0kWhRsD0BShvxbDPEsPKBD07M/Hx+AStI09eKQ==;EndpointSuffix=core.windows.net'; // Replace with your actual connection string
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerName = 'files'; // Replace with your actual container name
const containerClient = blobServiceClient.getContainerClient(containerName);

// Set storage engine for multer (file upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const fileName = file.originalname;

    // Upload file to Azure Storage
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(file.buffer, file.size);

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle file upload with duplicate logic
app.post('/uploadduplicate', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const originalName = file.originalname;
    let newFilename = originalName;

    if (await containerClient.getBlockBlobClient(originalName).exists()) {
      const { name, ext } = path.parse(originalName);
      let i = 1;
      while (await containerClient.getBlockBlobClient(`${name}_duplicate_${i}${ext}`).exists()) {
        i++;
      }
      newFilename = `${name}_duplicate_${i}${ext}`;
    }

    // Upload file to Azure Storage
    const blockBlobClient = containerClient.getBlockBlobClient(newFilename);
    await blockBlobClient.upload(file.buffer, file.size);

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to get a list of files
app.get('/files', async (req, res) => {
  try {
    const files = [];
    for await (const blobItem of containerClient.listBlobsFlat()) {
      files.push(blobItem.name);
    }

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle file deletion
app.delete('/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    // Delete file from Azure Storage
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.delete();

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for downloading file
app.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    // Download file from Azure Storage
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    const downloadBlockBlobResponse = await blockBlobClient.download();

    // Set response headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', downloadBlockBlobResponse.contentType);

    // Pipe the file stream to the response
    downloadBlockBlobResponse.readableStreamBody.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
