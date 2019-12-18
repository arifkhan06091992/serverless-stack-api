import AWS from 'aws-sdk';

let s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});

let elastic_transcoder = new AWS.ElasticTranscoder({
    apiVersion: '2012-09-25',
    region: 'ap-northeast-1'
});

let pipelineId = '1575628741015-stf9mb';

export function main(event, context, callback) {
    let bucket = event.Records[0].s3.bucket.name;
    let key = event.Records[0].s3.object.key;
    s3.getObject({
            Bucket: bucket,
            Key: key
        },
        function (err, data) {
            console.log('err::: ' + err);
            console.log('data::: ' + data);
            if (err) {
                console.log('error getting object' + key + 'from bucket' + bucket +'.Make sure they exist and your bucket is in the same region as this function.');
                context.done('ERROR', 'error getting file' + err);
            } else {
                console.log('Reached B');
                /* Below section can be used if you want to put any check based on metadata

                if (data.Metadata.Content-Type == 'video/x-msvideo') {
                console.log('Reached C' );
                console.log('Found new video: ' + key + ', sending to ET');
                sendVideoToET(key);
                } else {
                console.log('Reached D' );
                console.log('Upload ' + key + 'was not video');
                console.log(JSON.stringify(data.Metadata));
                }
                */
                sendVideoToET(key);
            }
        }
    );
};

function sendVideoToET(key) {
    let filename = key.split('/').slice(0, -1).join('.');
    console.log('Sending' + key + 'to ET');
    let params = {
        PipelineId: pipelineId,
        Input: {
            Key: key,
            FrameRate: 'auto',
            Resolution: 'auto',
            AspectRatio: 'auto',
            Interlaced: 'auto',
            Container: 'auto'
        },
        Outputs: [
            {
                // Full length video and thumbnails.
                Key: filename + '_720.mp4',
                ThumbnailPattern: filename + '/thumbs-{count}', // Must include {count}
                PresetId: '1351620000001-000010'
            },
            {
                // Full length video and thumbnails.
                Key: filename + '_1080.mp4',
                PresetId: '1351620000001-000001'
            }
        ]
    };

    elastic_transcoder.createJob(params, function (err, data) {

        if (err) {
            console.log('Failed to send new video' + key + 'to ET');
            console.log(err);
            console.log(err.stack);
        } else {
            console.log('Error');
            console.log(data);
        }
        //context.done(null,”);
    });
}