'use strict'
var mpu9150 = require(__dirname + '/lib/mpu9150')
  , math = require('mathjs');

var mpu = new mpu9150({
    device: '/dev/i2c-2',
    // mpu9250 address (default is 0x68) 
    address: 0x68,

    ak_address: 0x0C,
    // Set the Gyroscope sensitivity (default 0), where:
    //      0 => 250 degrees / second
    //      1 => 500 degrees / second
    //      2 => 1000 degrees / second
    //      3 => 2000 degrees / second
    GYRO_FS: 2,

    // Set the Accelerometer sensitivity (default 2), where:
    //      0 => +/- 2 g
    //      1 => +/- 4 g
    //      2 => +/- 8 g
    //      3 => +/- 16 g
    ACCEL_FS: 2,
    
    scaleValues: true,

    UpMagneto: true,
    
    DEBUG: true,
});

var kalmanX = new mpu.Kalman_filter();
var kalmanY = new mpu.Kalman_filter();
var initialize = false;

var imuSensor = function(){
    
    if(mpu.initialize()){
        //this.imuSensor.initialize = true;
        return true;
    }
    //this.emitter = emitter;
    return false;
};

    var timer = 0
      , pitch = 0
      , roll = 0
      , yaw = 0
      , kalAngleX = 0
      , kalAngleY = 0
      , gyroXangle = 0
      ,	gyroYangle = 0
      ,	gyroZangle = 0
      , compAngleX = 0
      , compAngleY = 0;

imuSensor.prototype.registerEmitterHandlers = function(emitter){
  this.emitter = emitter;

      var interval = setInterval(function(){
        var micros = function() {
          return new Date().getTime();
        };
        
        var m9 = mpu.getMotion9();
        
        //var dt = (micros() - timer) / 1000000;
        var dt = (micros() - timer) / 100000;
        timer = micros();
        
        pitch = mpu.getPitch(m9) + 90;
        roll = (mpu.getRoll(m9) + 85) * -1;
        yaw = (Math.round(mpu.getYaw(m9)) + 85.0);
        if(yaw > -180.0){
          yaw = yaw - 360.0;
          console.log(yaw)
        }
        else if (yaw < 180){
          yaw = yaw + 360;
        }
        
        var gyroXrate = m9[3] / 131.0;
        var gyroYrate = m9[4] / 131.0;
        var gyroZrate = m9[5] / 131.0;
        
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
        
        var imuData = {
        	pitch: compAngleY,
        	roll: compAngleX,
        	clockwise: yaw
        };
        emitter.emit('imu.data', JSON.stringify(imuData));
    }, 20);
};


module.exports = imuSensor;