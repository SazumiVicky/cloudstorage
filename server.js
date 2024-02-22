const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 7861;

const serviceAccount = require('./src/firebase-data.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'xxxxxxx',
});

let fileCounts = {
  img: 0,
  vid: 0,
  aud: 0
};

let usedRandomStrings = [];
let savedLinks = {
  img: [],
  vid: [],
  aud: []
};
mongoose.connect('mongodb+srv://xxxxxxxxxxxxx', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dataSchema = new mongoose.Schema({
  fileCounts: Object,
  usedRandomStrings: Array,
  savedLinks: Object,
});

const DataModel = mongoose.model('Data', dataSchema);
DataModel.findOne({})
  .then((data) => {
    if (!data) {
      const initialData = new DataModel({
        fileCounts: fileCounts,
        usedRandomStrings: usedRandomStrings,
        savedLinks: savedLinks,
      });

      return initialData.save();
    } else {
      fileCounts = data.fileCounts || fileCounts;
      usedRandomStrings = data.usedRandomStrings || usedRandomStrings;
      savedLinks = data.savedLinks || savedLinks;
      return Promise.resolve();
    }
  })
  .catch((err) => {
    console.error('Error reading data from MongoDB:', err);
  });

const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateRandomString = (length) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/')
    ) {
      cb(null, 'file');
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let prefix = '';

    if (file.mimetype.startsWith('image/')) {
      prefix = 'img';
    } else if (file.mimetype.startsWith('video/')) {
      prefix = 'vid';
    } else if (file.mimetype.startsWith('audio/')) {
      prefix = 'aud';
    } else {
      return cb(new Error('Unsupported file type'));
    }

    fileCounts[prefix]++;
    let randomString = generateRandomString(6);
    let fileName = `${prefix}-${fileCounts[prefix]}_${randomString}${ext}`;

    while (usedRandomStrings.includes(randomString)) {
      randomString = generateRandomString(6);
      fileName = `${prefix}-${fileCounts[prefix]}_${randomString}${ext}`;
    }

    usedRandomStrings.push(randomString);
    updateMongoDB({ fileCounts, usedRandomStrings, savedLinks });

    cb(null, fileName);
  },
});

const upload = multer({ storage });

const handleFileUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const filePath = req.file.path;
  const fileMimetype = req.file.mimetype.split('/')[0];

  try {
    let expirationDate = null;

    if (req.body.expirationDate === '7days') {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
    }

    if (!savedLinks[fileMimetype]) {
      savedLinks[fileMimetype] = [];
    }

    const fileUrl = `http://cdn.sazumi.moe/file/${path.basename(filePath)}`;

    savedLinks[fileMimetype].push({
      url: fileUrl,
      expirationDate: expirationDate,
    });

    const bucket = admin.storage().bucket();
    await bucket.upload(filePath, {
      destination: `file/${path.basename(filePath)}`,
    });
    updateMongoDB({ fileCounts, usedRandomStrings, savedLinks });

    res.send(fileUrl);
  } catch (err) {
    console.error('Error while processing file:', err);
    return res.status(500).send('Failed to process the file');
  }
};

app.post('/upload', upload.single('file'), handleFileUpload);

app.get('/saved-links', (req, res) => {
  res.json(savedLinks);
});

const htmlPages = ['/', '/docs', '/about', '/contact', '/info', '/pages', '/404', '/donation', '/status'];
app.use('/file', express.static(path.join(__dirname, 'file')));
app.use('/src', express.static(path.join(__dirname, 'src')));

htmlPages.forEach((page) => {
  app.get(page, (req, res) => {
    const fileName = page === '/' ? 'index.html' : `${page.slice(1)}.html`;
    res.sendFile(path.join(__dirname, fileName));
  });
});

app.use('/file', async (req, res, next) => {
  const filePath = path.join(__dirname, 'file', req.url);
  const fileExistsLocally = fs.existsSync(filePath);

  if (!fileExistsLocally) {
    const remoteFile = admin.storage().bucket().file(`file${req.url}`);
    const remoteStream = remoteFile.createReadStream();

    remoteStream.on('error', () => {
      res.status(404).send('File not found');
    });

    remoteStream.pipe(fs.createWriteStream(filePath))
      .on('finish', () => {
        res.sendFile(filePath);
      });
  } else {
    res.sendFile(filePath);
  }
});

setInterval(() => {
  for (const fileType in savedLinks) {
    savedLinks[fileType] = savedLinks[fileType].filter((item) => !item.expirationDate || new Date(item.expirationDate) > new Date());
  }

  updateMongoDB({ fileCounts, usedRandomStrings, savedLinks });
}, 24 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
});

const updateMongoDB = (data) => {
  DataModel.findOneAndUpdate({}, data)
    .then(() => {
      console.log('Data updated in MongoDB');
    })
    .catch((err) => {
      console.error('Error updating data in MongoDB:', err);
    });
};
