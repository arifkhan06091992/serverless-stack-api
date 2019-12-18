import AWS from "aws-sdk";
import moment from "moment";
import fileType from "file-type";
let s3 = new AWS.S3();

export function main(event, context, callback) {
    // Request body is passed in as a JSON encoded string in 'event.body'

    let request = JSON.parse(event.body);
    let base64String = request.base64String;
    let basePathOfFile = request.basePathOfFile;
    let buffer = new Buffer(base64String,'base64');
    let fileMime = fileType(buffer);

    if(fileMime === null)
    {
        callback({success : "the string supplied is not a file type"});
    }

    let file = getFile(fileMime,buffer,basePathOfFile);

    let params = file.params;

    s3.putObject(params,function(err,data){

        if(err) {
            callback({
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": true
                },
                body: JSON.stringify({success : false})
            });
        }
    });

    callback(null,{
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify({uploadedFile : file.uploadFile})
    });
}

let getFile = function(fileMime,buffer,basePathOfFile){

    let fileExt = fileMime.ext;
    let now = moment().format('YYYY-MM-DD HH:mm:ss');
    let filePath = basePathOfFile;
    let fileName = 'custom' + now + '.' +fileExt;
    let fileFullName = filePath + fileName;
    let fileFullPath = 'frontend-gbeem-dev/' +fileFullName;

    let params = {
        Bucket : 'frontend-gbeem-dev',
        Key : fileFullName,
        Body : buffer
    };

    let uploadFile = {
        size : buffer.toString('ascii').length,
        type : fileMime.mime,
        name : fileName,
        fileFullPath : fileFullPath
    };

    return {
        params : params,
        uploadFile : uploadFile
    };

};