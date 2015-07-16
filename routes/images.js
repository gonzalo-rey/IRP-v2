var express = require('express');
var router = express.Router();
var rest = require('restler');
var formidable = require('formidable');
var fs = require('fs');

/* GET image based on its CloudSight's token */
router.get('/:token', function(req, res, next) {
  getImageByToken(req.params.token, res);
});

/* POST an image to be identified by CloudSight */
router.post('/', function(req, res, next) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    console.log('path:' + files['fileUpload'].path, 'size: ' + files['fileUpload'].size, 'type:' + files['fileUpload'].type);
    sendImage(files['fileUpload'], res);
  });
})

function sendImage(file, res) {

  var filepath = file.path
  if(file.type == 'image/jpeg') {
    fs.renameSync(filepath, filepath + '.jpg');
    filepath = filepath + '.jpg';
  }
  else
    console.log('File type ' + file.type + ' not supported');

  rest.post('http://api.cloudsightapi.com/image_requests', {
    headers: {'Authorization': 'CloudSight Y0KnZccC0BCLmyDLSFH8XA'},
    multipart: true,
    data: {
      'image_request[locale]': 'es',
      'image_request[image]': rest.file(filepath, null, file.size, null, file.type)
    }
  }).on('complete', function(data) {
    console.log('sendImage :: complete');
    console.log(data);
    getImageByToken(data.token, res);
  }).on('error', function(err, response) {
    console.log('sendImage :: error:', err);
    res.send({'status': 'unexpected_error', 'details': err});
  });
}

function getImageByToken(token, res) {
  rest.get('http://api.cloudsightapi.com/image_responses/' + token, {
    headers: {'Authorization': 'CloudSight Y0KnZccC0BCLmyDLSFH8XA'}
  }).on('complete', function(data) {
    console.log('getImageByToken :: complete');
    if(data.status == 'completed') {
      data['token'] = token;
      res.send(data);
    } else
      setTimeout(function(){
        getImageByToken(token, res);
      }, 1000);
  }).on('error', function(err, response) {
    console.log('getImageByToken :: error:', err);
    res.send({'status': 'unexpected_error', 'details': err});
  });
}

module.exports = router;
