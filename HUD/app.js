'use strict';
var express = require('express')
  , routes = require('./routes')
  , app = express()
  , path = require('path')
  , server = require("http").createServer(app)
  , WebSocketServer = require('ws').Server
  , navWss = new WebSocketServer({server: server, path: '/navdata'})
  //, gpData = new WebSocketServer({server: server, path: '/gamepaddata'})
  , navdataSockets = []
  , mpu9250 = require(__dirname + '/lib/mpu9250')
  //, arDrone = require('ar-drone')
  , math = require('mathjs')
  ;



app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade', { pretty: true });
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
    app.locals.pretty = true;
});

app.get('/', routes.index);

mpu9250 = require(__dirname + '/lib/mpu9250')

var mpu = new mpu9250({
    device: '/dev/i2c-2',
    // mpu9250 address (default is 0x68) 
    address: 0x68,

    ak_address: 0x0C,
    // Set the Gyroscope sensitivity (default 0), where:
    //      0 => 250 degrees / second
    //      1 => 500 degrees / second
    //      2 => 1000 degrees / second
    //      3 => 2000 degrees / second
    GYRO_FS: 0,

    // Set the Accelerometer sensitivity (default 2), where:
    //      0 => +/- 2 g
    //      1 => +/- 4 g
    //      2 => +/- 8 g
    //      3 => +/- 16 g
    ACCEL_FS: 2,
    
    scaleValues: true,

    UpMagneto: true,

});


var kalmanX = new mpu.Kalman_filter();
var kalmanY = new mpu.Kalman_filter();


if (mpu.initialize()) {
  console.log('MPU VALUE : ', mpu.getMotion9());
    //console.log('listen to 0.0.0.0:' + port);
    console.log('Temperature : ' + mpu.getTemperatureCelsius());
    var values = mpu.getMotion9();
    var pitch = mpu.getPitch(values);
    var roll = mpu.getRoll(values);
    var yaw = mpu.getYaw(values);
    console.log('pitch value : ', pitch);
    console.log('roll value : ', roll);
    console.log('yaw value : ', yaw);
    kalmanX.setAngle(roll);
	kalmanY.setAngle(pitch);
}

	var interval;

	var kalAngleX = 0,
		kalAngleY = 0,
		kalAngleZ = 0,
		gyroXangle = roll,
		gyroYangle = pitch,
		gyroZangle = yaw,
		gyroXrate = 0,
		gyroYrate = 0,
		gyroZrate = 0,
		compAngleX = roll,
		compAngleY = pitch,
		compAngleZ = yaw;


var timer = 0;
var count = 0;
var light = 0;

interval = setInterval(function() {
        
    var micros = function() {
    return new Date().getTime();
    };
    timer = micros();
    var values = mpu.getMotion9();
    //console.log(values);
    
    var dt = (micros() - timer) / 1000000;
    timer = micros();
    
    pitch = mpu.getPitch(values) + 9;
    roll = mpu.getRoll(values) + 3.85;
    yaw = mpu.getYaw(values);
    
    var gyroXrate = values[3] / 131.0;
    var gyroYrate = values[4] / 131.0;
    var gyroZrate = values[5] / 131.0;
    
    if ((roll < -90 && kalAngleX > 90) || (roll > 90 && kalAngleX < -90)) {
    	kalmanX.setAngle(roll);
    	compAngleX = roll;
    	kalAngleX = roll;
    	gyroXangle = roll;
    } else {
    	kalAngleX = kalmanX.getAngle(roll, gyroXrate, dt);
    }
    
    if (Math.abs(kalAngleX) > 90) {
    	gyroYrate = -gyroYrate;
    }
    kalAngleY = kalmanY.getAngle(pitch, gyroYrate, dt);
    
    gyroXangle += gyroXrate * dt;
    gyroYangle += gyroYrate * dt;
    compAngleX = 0.93 * (compAngleX + gyroXrate * dt) + 0.07 * roll;
    compAngleY = 0.93 * (compAngleY + gyroYrate * dt) + 0.07 * pitch;
    
    if (gyroXangle < -180 || gyroXangle > 180) gyroXangle = kalAngleX;
    if (gyroYangle < -180 || gyroYangle > 180) gyroYangle = kalAngleY;
    
    var accel = {
    	pitch: compAngleY,
    	roll: compAngleX
    };
    
    //console.log(accel);
	
	navdataSockets.forEach(function (socket) {
	    if(socket.isAlive == true){
	        socket.send(JSON.stringify(accel), function ack(error){
	            //console.log(error);
	        });
	    }
        
    });
	
	//socket.emit('accel_data', {accel: accel});

   /*	//var magneto = mpu.getCompass(values[6], values[7], values[8]);
	var magneto = mpu.getMagAttitude();
	console.log(values[6] + ' ' + values[7] + ' ' + values[8]);
	console.log(magneto);
	socket.emit('accel_data', {accel: accel, magneto: magneto});*/
}, 20);

var count_send = 0;

navWss.on('connection', function (socket) {
    socket.isAlive = true;
    navdataSockets.push(socket);
    console.log('Opening Navdata socket');
    //navWss.
    socket.on("close", function () {
        console.log("Closing Navdata socket");
        socket.isAlive = false;
        navdataSockets = navdataSockets.filter(function (el) {
            return el !== socket;
        });
    });
    
    socket.on('message', function incoming(message) {
      var data = JSON.parse(message);
      //count++;
      //if(!data) data = [];
      //if(count > 10){
        //count = 0;
        if(data)
        {
          data.heave = parseFloat(data.heave);
          data.surge = parseFloat(data.surge);
          data.yaw = parseFloat(data.yaw);
          data.sway = parseFloat(data.sway);
          data.light = parseInt(data.light) * 10;
          data.boost = parseInt(data.boost);
          
          
          /*if((light >= 0) && (light <= 90)) light = light + data.light;
          if(light > 90) light = 90;
          if(light < 0) light = 0;
          */
          
          //console.log("Surge = " + data.surge + ", Sway = " + data.sway + ", Yaw = " + data.yaw + ", Heave = " + data.heave + ", Light = " + light);
            
        
            var x = math.matrix([[data.surge], [data.sway], [data.yaw], [data.heave * 30]]);
            
            //if(data.boost) x = math.matrix([[data.surge * 30], [data.sway *30], [data.yaw * 30], [data.heave * 80]]);
            
            var f = math.multiply(math.matrix([[-0.3535533906, 0.3535533906,0.8928571429, 0], 
                                           [-0.3535533906  , -0.3535533906 ,  -0.8928571429, 0], 
                                           [ 0.3535533906 , -0.3535533906 ,0.8928571429 , 0], 
                                           [0.3535533906 , 0.3535533906,  -0.8928571429, 0], 
                                           [0, 0, 0, 1]]), x);
        
          for (var i = 0 ; i < 4; i++) {
              if(f._data[i] < 0) f._data[i] = 0; 
              f._data[i] = Math.round(f._data[i] * 50);
          }
          
          var str = String(f._data[0] + "," + f._data[1] + "," + f._data[2] + "," + f._data[3] + "," + Math.round(f._data[4]) + "," + light + "," + "0" + "," + "0" + "," + "\n");
          //console.log(str);
        
        
          writeAndDrain(str, null);
          
          /*port.write(str, function(err) {
              if (err) {
                console.log('Error on write: ', err.message);
              }
              //console.log('message written');
          });*/
        }
      //}
      
    });
});

function writeAndDrain (data, callback) {
  console.log(data);
  port.flush();
  port.write(data, function (error) {
		if(error){console.log(error);}
		else{
			// waits until all output data has been transmitted to the serial port.
		  port.drain(callback);
		}
  });
}

function sp_write(data) {
    if (Open) {
        console.log(data);
        port.write(data, function(err, results) {
          if (err)  console.log('Error on write: ', err.message);
          if(results)  console.log('results ' + results.message);
        });
    }
    else {
        if (Buffer.isBuffer(data)) {
            data.copy(SaveBuffer, SaveLen);
            SaveLen += data.length;
        }
        else {
            new Buffer(data).copy(SaveBuffer, SaveLen);
            SaveLen += data.length;
        }
        //console.log('SaveLen ' + SaveLen);
    }
}


var SerialPort = require('serialport');
var Open = false;
var SaveBuffer = new Buffer(1024);
var SaveLen = 0;
var port = new SerialPort('/dev/ttyS1', {
  baudRate: 115200,
  parser: SerialPort.parsers.readline('\n'),
});

port.on('open', function() {
   Open = true;
  /*port.write("main screen turn on\n", function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written');
  }); */
});

server.listen(9000);

