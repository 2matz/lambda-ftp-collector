'use strict';

console.log('Loading function');

exports.handler = (event, context, callback) => {

    var Client = require('ftp');
    var fs = require('fs');
    var async = require("async");



    var path = event.path;
    var mask = event.mask;
    var config = event.source;
    var s3Bucket = event.dest.bucketName;
    console.log('Path =', path);
    console.log('Mask =', mask);

    var re = new RegExp(mask);

    const AWS = require('aws-sdk');
    var c = new Client();
    var sns = new AWS.SNS();

    var downloadFile = function(file, callback) {
      var fileName = file.fileName;
      if (fileName == 'test_02.txt')
      {
        fileName = 'test_02.txt.top';
      }
      var fullPath = path+"/"+fileName;


      var file = {path : path, fileName : fileName}
      delete event.path;
      delete event.mask;
      event.file = file;

      var params = {
          Message: JSON.stringify(event),
          TopicArn: "arn:aws:sns:us-east-1:546190104433:FILES_TO_FTP_COLLECT"
      };
      sns.publish(params, callback);

    }

    c.on('ready', function() {
      c.list(path, function(err, list) {
        if (err) terminate(err, null);

        var filesToDownload = [];
        for(var i in list){
          if (re.test(list[i].name))
          {
            filesToDownload.push({fileName: list[i].name, size: list[i].size, status: "remote"});
          }
          else {
            console.log("Ignorninging "+list[i].name);
          }
        }

          async.map(filesToDownload, downloadFile, terminate);

        c.end();
      });
    });

    c.on('error', (err) => {
      terminate(err, null);
    });

    c.connect(config);

    var terminate = function(err, data) {
      if (err)
      {
        console.error(err);
        console.error(err.stack);
      }

      callback(err, data);
    }

};
