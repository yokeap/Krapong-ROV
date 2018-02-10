'use strict';

var express = require('express')
  , path = require('path')
  , app = express()
  , spawn = require('child_process').spawn
  , imuSensor = require(__dirname + '/plugins/navigation-data')
  , dataBuffer  = null
  , initBuffer  = null
  , initFrame   = null
  , ffmpeg_options  = '-threads 1 -f v4l2 -video_size 1920x1080 -i /dev/video1 \
                      -c:v copy -f mp4 -g 1 -movflags empty_moov+default_base_moof+frag_keyframe -frag_duration 1000 \
                      -tune zerolatency -';

const http = require('http').Server(app)
    , io = require('socket.io')(http)
    , exec = require('child_process').exec;
    

//ELP camera config initializaton
var camera_settings = exec('H264_UVC_TestAP /dev/video1 --dbg 0x1f --xuset-br 2000000 --xuset-qp 1', 
    (error, stdout, stderr) =>{
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    if (error !== null) {
        console.log(`exec error: ${error}`);
    }
});

http.listen(9010, () => {
    console.log('listening on localhost:9010');
});

console.log(__dirname);
var imuData = new imuSensor();

app.configure(function () {
    //app.set('views', __dirname + '/views');
    //app.set('view engine', 'ejs');
    //app.use(express.favicon());
    app.use(express.logger('dev'));
    //app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    
    app.use(express.static(path.join(__dirname, "./")));
    app.use(express.static(path.join(__dirname, "./public/")));
    app.use(express.static(path.join(__dirname, "./public/bower_components")));
    app.use(express.static(path.join(__dirname, "./public/webcomponents")));
});

                      
app.get('/', (req, res) => {
    res.sendfile(__dirname + '/public/index.html');
});

/*********************************
**ffmpeg mp4 fragmentation capturing stdout process.
* 
* *******************************/
var child = spawn( 'ffmpeg', ffmpeg_options.match( /\S+/g ) );

  child.stdout.on('data', function(data){
    //init frame process, the init frame must be containing ftype(24bytes) on top of header stream.
    if( initFrame === null ){
      initBuffer = initBuffer == null ? data : Buffer.concat( [initBuffer,data] );
      //checking fytp header
      if( initBuffer.length < 25 ){
        // return if that is fytp header (24bytes)
        return;
      }
      initFrame = initBuffer;
      return;                       //return the buffer concatenation of fytp+moov+moof+mdat(not sure)  
    }
    /*********************************************************************************
     * 
     * note: not sure what is section meaning, now this is not used.
     *          assumming this involved the I-frame (GOP).
     * *******************************************************************************/
    if( data.length == 8192 ){
      dataBuffer = dataBuffer == null ? data : Buffer.concat([dataBuffer,data]);;
      return;
      }
      
    //continues streaming  
    dataBuffer = dataBuffer == null ? data : Buffer.concat([dataBuffer,data]);
    child.emit('stream.start', dataBuffer);
    dataBuffer = null;
  });
  
  child.stderr.on('data', function(error)
  {
  	  console.log("FFMPEG: " + error.toString());
  	  //var timeStampInMs = window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();
     
  });

io.on('connection', function(socket) {
    console.log('A user connected');
    
    imuData.registerEmitterHandlers(io);
    
    function start() {
        if (initFrame) {
            socket.emit('video.init.segment', initFrame);
            child.on('stream.start', emitSegment);
            //mp4segmenter.on('segment', emitSegment);
        } else {
            socket.emit('message', 'init segment not ready yet, reload page');
        }
    }
    //Occured from child.on
    function emitSegment(data) {
        socket.emit('video.segment', data);
    }
    
    socket.on('message', (msg) => {
        console.log(msg);
        switch (msg) {
            case 'start' :
                start();
                break;
        }
    });
    
    socket.on('disconnect', () => {
        //stop();
        console.log('A user disconnected');
    });
});


