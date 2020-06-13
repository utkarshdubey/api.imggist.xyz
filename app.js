// Load dependencies
const aws = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const mongoose = require('mongoose');
const randomstring = require('randomstring');

require('dotenv').config()

const app = express();

// Credentials 
aws.config.update({
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY
});

// Spaces Configuration
const spacesEndpoint = new aws.Endpoint("sgp1.digitaloceanspaces.com");
const s3 = new aws.S3({
    endpoint: spacesEndpoint
})

// Functions


// Mongoose Connection String

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;
// Connect to mongoose
mongoose.connect(process.env.DB_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Loading Mongoose Model
require('./models/File');
const File = mongoose.model('files');

// Routes
app.post('/upload', function (req, res) {

    // Random String Generation
    const fileID = randomstring.generate(7);
    const storage = multerS3({
        s3: s3,
        bucket: "imggist",
        acl: "public-read",
        key: function (req, file, callback) {
            fileName = fileID + "." + file.mimetype.split('/')[1];
            console.log(file);
            callback(null, fileName);
        }
    })
    const upload = multer({
        storage
    }).array('upload', 1);

    upload(req, res, function (error) {
        if (error) {
            return res.json({
                status: error
            });
        }
        new File({
                title: fileID,
                file: fileName
            })
            .save()
            .then(file => {
                return res.json({
                    status: "success",
                    file: file
                });
            })
            .catch(err => { return res.json({err}) })
    });
});

app.get('/:file', function(req, res){
    File.findOne({ title: req.params.file })
    .then(file => { 
        res.set("location", `https://imggist.sgp1.digitaloceanspaces.com/${file.file}`)
        return res.status(301).send()
    }).catch(function(err){
        return res.json({err})
    })
})

// app.get('/delete/:file', function (req, res) {
//     const params = {
//         Bucket: 'imggist',
//         Key: req.params.file
//     };
//     s3.deleteObject(params, function (err, data) {
//         if (err) return res.json({
//             err
//         });
//         res.json({
//             data
//         });
//     })
// })

app.get('/', (req, res) => {
    res.send("Ok");
})

app.listen(process.env.PORT || 8000, function () {
    console.log("Server running on port 8000.")
})