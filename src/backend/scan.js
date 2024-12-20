const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
//allows to read and write files
const fs = require('fs');
const { parseTextFromFile } = require('./parse'); // Import the parsing function from parse.js

const app = express();
const port = 5001;

app.use(cors());

// Configure Multer to save uploaded files to 'uploads/' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '/uploads')); // Save to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  },
});
const upload = multer({ storage });

const textJsonPath = path.join(__dirname, '/text.json');

function appendToJsonFile(newEntry) {
  try {
    // Read the current content of the file
    let jsonData = [];
    if (fs.existsSync(textJsonPath)) {
      const fileContent = fs.readFileSync(textJsonPath, 'utf8');
      jsonData = JSON.parse(fileContent); // Parse existing JSON data
    }

    // Append the new entry to the array
    jsonData.push(newEntry);

    // Write the updated array back to the file
    fs.writeFileSync(textJsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('New entry appended to text.json');
  } catch (error) {
    console.error('Error appending to JSON file:', error);
  }
}

app.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.file.filename);

  try {
    // Call the parsing function from parse.js
    const parsedText = await parseTextFromFile(filePath);

    const newEntry = {
      filename: req.file.filename,
      text: parsedText,
    };

    // Append to the JSON file immediately
    appendToJsonFile(newEntry)

    res.json({
      message: 'File uploaded and parsed successfully!',
      filename: req.file.filename,
      text: parsedText,
    });

  } catch (error) {
    console.error('Error parsing file:', error);
    res.status(500).json({ error: 'Failed to parse file.' });
  }
});


app.listen(port, () => {
    console.log(`scan server on http://localhost:${port}`);
  });