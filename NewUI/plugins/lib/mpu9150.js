/**
 *
 * NodeJs Module : MPU9150
 * @author Siwakorn Sukprasertchai
 * @description MPU9150 simple reading data for node js (used in Krapong-ROV Project)
 * @version 0.0.1
 * @dependent i2c, extend, sleep
 * @This 
 */

/*********************/
/** Module required **/
/*********************/
var MOD_I2C = require('i2c');
var extend = require('extend');
var sleep = require('sleep');

/*****************/
/** MPU9150 MAP **/
/*****************/
// documentation:
//   https://www.invensense.com/products/motion-tracking/9-axis/mpu-9150/
//   https://www.invensense.com/wp-content/uploads/2015/02/MPU-9150-Datasheet.pdf
//   https://www.invensense.com/wp-content/uploads/2015/02/MPU-9150-Register-Map.pdf

var MPU9150 = {
	I2C_ADDRESS_AD0_LOW: 0x68,
	I2C_ADDRESS_AD0_HIGH: 0x69,
	WHO_AM_I: 0x75,

	RA_SMPLRT_DIV: 0x19,
	RA_CONFIG: 0x1A,
	RA_GYRO_CONFIG: 0x1B,
	RA_ACCEL_CONFIG_1: 0x1C,
	RA_ACCEL_CONFIG_2: 0x1D,
	
	RA_INT_PIN_CFG: 0x37,
	RA_INT_ENABLE: 0x38,

	INTCFG_ACTL_BIT: 7,
	INTCFG_OPEN_BIT: 6,
	INTCFG_LATCH_INT_EN_BIT: 5,
	INTCFG_INT_ANYRD_2CLEAR_BIT: 4,
	INTCFG_ACTL_FSYNC_BIT: 3,
	INTCFG_FSYNC_INT_MODE_EN_BIT: 2,
	INTCFG_BYPASS_EN_BIT: 1,
	INTCFG_NONE_BIT: 0,
	CFG_DLPF_CFG_BIT:   2,
	CFG_DLPF_CFG_LENGTH: 3,
	
	INTERRUPT_FF_BIT:            7,
	INTERRUPT_MOT_BIT:           6,
	INTERRUPT_ZMOT_BIT:          5,
	INTERRUPT_FIFO_OFLOW_BIT:    4,
	INTERRUPT_I2C_MST_INT_BIT:   3,
	INTERRUPT_PLL_RDY_INT_BIT:   2,
	INTERRUPT_DMP_INT_BIT:       1,
	INTERRUPT_DATA_RDY_BIT:      0,
	

	// BY_PASS_MODE: 0x02,

	ACCEL_XOUT_H: 0x3B,
	ACCEL_XOUT_L: 0x3C,
	ACCEL_YOUT_H: 0x3D,
	ACCEL_YOUT_L: 0x3E,
	ACCEL_ZOUT_H: 0x3F,
	ACCEL_ZOUT_L: 0x40,
	TEMP_OUT_H: 0x41,
	TEMP_OUT_L: 0x42,
	GYRO_XOUT_H: 0x43,
	GYRO_XOUT_L: 0x44,
	GYRO_YOUT_H: 0x45,
	GYRO_YOUT_L: 0x46,
	GYRO_ZOUT_H: 0x47,
	GYRO_ZOUT_L: 0x48,

	RA_USER_CTRL: 0x6A,
	RA_PWR_MGMT_1: 0x6B,
	RA_PWR_MGMT_2: 0x6C,
	PWR1_DEVICE_RESET_BIT: 7,
	PWR1_SLEEP_BIT: 6,
	PWR1_CYCLE_BIT: 5,
	PWR1_TEMP_DIS_BIT: 3, // (PD_PTAT)
	PWR1_CLKSEL_BIT: 0,
	PWR1_CLKSEL_LENGTH: 3,

	GCONFIG_FS_SEL_BIT: 3,
	GCONFIG_FS_SEL_LENGTH: 2,
	GYRO_FS_250: 0x00,
	GYRO_FS_500: 0x01,
	GYRO_FS_1000: 0x02,
	GYRO_FS_2000: 0x03,
	GYRO_SCALE_FACTOR: [131, 65.5, 32.8, 16.4],

	ACONFIG_FS_SEL_BIT: 3,
	ACONFIG_FS_SEL_LENGTH: 2,
	ACCEL_FS_2: 0x00,
	ACCEL_FS_4: 0x01,
	ACCEL_FS_8: 0x02,
	ACCEL_FS_16: 0x03,
	ACCEL_SCALE_FACTOR: [16384, 8192, 4096, 2048],

	CLOCK_INTERNAL: 0x00,
	CLOCK_PLL_XGYRO: 0x01,
	CLOCK_PLL_YGYRO: 0x02,
	CLOCK_PLL_ZGYRO: 0x03,
	CLOCK_KEEP_RESET: 0x07,
	CLOCK_PLL_EXT32K: 0x04,
	CLOCK_PLL_EXT19M: 0x05,
	
	YG_OFFS_TC: 0x01,
	I2C_MST_CTRL: 0x24,
	I2C_SLV0_ADDR: 0x25,
	I2C_SLV0_REG: 0x26,
	I2C_SLV0_CTRL: 0x27,
	I2C_SLV1_ADDR: 0x28,
	I2C_SLV1_REG : 0x29,
	I2C_SLV1_CTRL: 0x2a,
	I2C_SLV4_CTRL: 0x34,
	INT_PIN_CFG: 0x37,
	INT_ENABLE: 0x38,
	INT_STATUS: 0x3a,
	
	I2C_MST_DELAY_CTRL: 0x67,

	I2C_SLV0_DO: 0x63,
	I2C_SLV1_DO: 0x64,
	I2C_SLV2_DO: 0x65,

	USERCTRL_DMP_EN_BIT: 7,
	USERCTRL_FIFO_EN_BIT: 6,
	USERCTRL_I2C_MST_EN_BIT: 5,
	USERCTRL_I2C_IF_DIS_BIT: 4,
	USERCTRL_DMP_RESET_BIT: 3,
	USERCTRL_FIFO_RESET_BIT: 2,
	USERCTRL_I2C_MST_RESET_BIT: 1,
	USERCTRL_SIG_COND_RESET_BIT: 0,

	DEFAULT_GYRO_OFFSET: { x: 0, y: 0, z: 0 },
	DEFAULT_ACCEL_CALIBRATION: {
		offset: {x: 0, y: 0, z: 0},
		scale: {
			x: [-1, 1],
			y: [-1, 1],
			z: [-1, 1]
		}
	}
};

/****************/
/** AK8975 MAP **/
/****************/
// Technical documentation available here: https://www.akm.com/akm/en/file/datasheet/AK8975.pdf
var AK8975 = {
	ADDRESS: 0x0C,
	WHO_AM_I: 0x00, // should return 0x48,
	WHO_AM_I_RESPONSE: 0x48,
	INFO: 0x01,
	ST1: 0x02,  // data ready status bit 0
	XOUT_L: 0x03,  // data
	XOUT_H: 0x04,
	YOUT_L: 0x05,
	YOUT_H: 0x06,
	ZOUT_L: 0x07,
	ZOUT_H: 0x08,
	ST2: 0x09,  // Data overflow bit 3 and data read error status bit 2
	CNTL: 0x0A,  // Power down (0000), single-measurement (0001), self-test (1000) and Fuse ROM (1111) modes on bits 3:0
	ASTC: 0x0C,  // Self test control
	I2CDIS: 0x0F,  // I2C disable
	ASAX: 0x10,  // Fuse ROM x-axis sensitivity adjustment value
	ASAY: 0x11,  // Fuse ROM y-axis sensitivity adjustment value
	ASAZ: 0x12,

	ST1_DRDY_BIT: 0,
	ST1_DOR_BIT: 1,

	CNTL_MODE_OFF: 0x00, // Power-down mode
	CNTL_MODE_SINGLE_MEASURE: 0x01, // Single measurement mode
	CNTL_MODE_SELF_TEST_MODE: 0x08, // Self-test mode
	CNTL_MODE_FUSE_ROM_ACCESS: 0x0F,  // Fuse ROM access mode

    DEFAULT_CALIBRATION: {
        offset: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
	}
};

////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 						MPU Configuration						   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////

/**
 * @name mpu9150
 * @params Object {device: '', address: '', UpMagneto: false, DEBUG: false, ak_address: ''}
 */
var mpu9150 = function(cfg) {
	cfg = cfg || {};
	if (typeof cfg !== 'object') {
		cfg = {};
	}

	var _default = {
		device: '/dev/i2c-1',
		address: MPU9150.I2C_ADDRESS_AD0_LOW,
		UpMagneto: false,
		DEBUG: false,
		scaleValues: false,
		ak_address: AK8975.ADDRESS,
		GYRO_FS: 0,
		ACCEL_FS: 2,
		gyroBiasOffset: MPU9150.DEFAULT_GYRO_OFFSET,
		accelCalibration: MPU9150.DEFAULT_ACCEL_CALIBRATION
	};

	var config = extend({}, _default, cfg);
	this._config = config;
};

/**
 * @name initialize
 * @return boolean
 */
mpu9150.prototype.initialize = function() {
	this._config.magCalibration = this._config.magCalibration || AK8975.DEFAULT_CALIBRATION;
	this.i2c = new LOCAL_I2C(this._config.address, {device: this._config.device});
	this.i2c.mag = new LOCAL_I2C(AK8975.ADDRESS, {device: this._config.device});
	this.debug = new debugConsole(this._config.DEBUG);
	this.debug.Log('INFO', 'Initialization MPU9150 ....');

	// clear configuration
	this.i2c.writeBit(MPU9150.PWR_MGMT_1, MPU9150.PWR1_DEVICE_RESET_BIT, 1);
	this.debug.Log('INFO', 'Reset configuration MPU9150.');
	sleep.usleep(10000);
	
	if(!this.testDevice()){
		this.debug.Log('INFO', 'IMU Test failed.');
	}
	

	// define clock source
	this.setClockSource(MPU9150.CLOCK_PLL_XGYRO);
	sleep.usleep(10000);

	// define gyro range
	var gyro_fs = [MPU9150.GYRO_FS_250, MPU9150.GYRO_FS_500, MPU9150.GYRO_FS_1000, MPU9150.GYRO_FS_2000];
	var gyro_value = MPU9150.GYRO_FS_250;
	if (this._config.GYRO_FS > -1 && this._config.GYRO_FS < 4) gyro_value = gyro_fs[this._config.GYRO_FS];
	this.setFullScaleGyroRange(gyro_value);
	sleep.usleep(10000);

	// define accel range
	var accel_fs = [MPU9150.ACCEL_FS_2, MPU9150.ACCEL_FS_4, MPU9150.ACCEL_FS_8, MPU9150.ACCEL_FS_16];
	var accel_value = MPU9150.ACCEL_FS_4;
	if (this._config.ACCEL_FS > -1 && this._config.ACCEL_FS < 4) accel_value = accel_fs[this._config.ACCEL_FS];
	this.setFullScaleAccelRange(accel_value);
	sleep.usleep(10000);

	// disable sleepEnabled
	this.setSleepEnabled(false);
	sleep.usleep(10000);
	
	// Print out the configuration
	if (this._config.DEBUG) {
		this.printSettings();
		this.printAccelSettings();
		this.printGyroSettings();
		this.printMagnetoSettings();
	}

	this.debug.Log('INFO', 'END of MPU9150 initialization.');
	return this.testDevice();
};

/**------------------|[ FUNCTION ]|------------------**/
/**
 * @name testDevice
 * @return boolean
 */
mpu9150.prototype.testDevice = function() {
	var test = this.getIDDevice();
	return (test === 0x68);
};


/**---------------------|[ GET ]|--------------------**/
/**
 * @name getIDDevice
 * @return number | false
 */
mpu9150.prototype.getIDDevice = function() {
	if (this.i2c) {
		return this.i2c.readByte(MPU9150.WHO_AM_I);
	}
	return false;
};

/**
 * @name getIDMagDevice
 * @return number | false
 */
mpu9150.prototype.getIDMagDevice = function() {
	if (this.i2c) {
		return this.i2c.readByte(AK8975.WHO_AM_I);
	}
	return false;
};

/**
 * @name getTemperature
 * @return int | false
 */
mpu9150.prototype.getTemperature = function() {
	if (this.i2c) {
		var buffer = this.i2c.readBytes(MPU9150.TEMP_OUT_H, 2, function() {});
		return buffer.readInt16BE(0);
	}
	return false;
};

/**
 * @name getTemperatureCelsius
 * @return string
 */
mpu9150.prototype.getTemperatureCelsius = function() {
/*
((TEMP_OUT – RoomTemp_Offset)/Temp_Sensitivity) + 21degC
*/
    var TEMP_OUT = this.getTemperatureCelsiusDigital();
	if (TEMP_OUT) {
		return TEMP_OUT + '°C';
	}
	return 'no data';
};

mpu9150.prototype.getTemperatureCelsiusDigital = function() {
    var TEMP_OUT = this.getTemperature();
	if (TEMP_OUT) {
		return (TEMP_OUT / 340. + 36.53);
	}
	return 0;
};

/**
 * @name getMotion6
 * @return array | false
 */
mpu9150.prototype.getMotion6 = function() {
	if (this.i2c) {
		var buffer = this.i2c.readBytes(MPU9150.ACCEL_XOUT_H, 14, function() {});
		var gCal = this._config.gyroBiasOffset;
		var aCal = this._config.accelCalibration;

		var xAccel = buffer.readInt16BE(0) * this.accelScalarInv;
		var yAccel = buffer.readInt16BE(2) * this.accelScalarInv;
		var zAccel = buffer.readInt16BE(4) * this.accelScalarInv;

		return [
			scaleAccel(xAccel, aCal.offset.x, aCal.scale.x),
			scaleAccel(yAccel, aCal.offset.y, aCal.scale.y),
			scaleAccel(zAccel, aCal.offset.z, aCal.scale.z),
			// Skip Temperature - bytes 6:7
			buffer.readInt16BE(8) * this.gyroScalarInv + gCal.x,
			buffer.readInt16BE(10) * this.gyroScalarInv + gCal.y,
			buffer.readInt16BE(12) * this.gyroScalarInv + gCal.z
		];
	}
	return false;
};

/**
 * This wee function just simplifies the code.  It scales the Accelerometer values appropriately.
 * The values are scaled to 1g and the offset it taken into account.
 */
function scaleAccel(val, offset, scalerArr) {
	if (val < 0) {
		return -(val - offset) / (scalerArr[0] - offset);
	} else {
		return (val - offset) / (scalerArr[1] - offset);
	}
}

/**
 * @name getMotion9
 * @return array | false
 */
mpu9150.prototype.getMotion9 = function() {
	if (this.i2c) {
		var mpudata = this.getMotion6();
        var magdata = this.getMagAttitude();
        //var magdata = [0, 0, 0];
	/*	if (this.ak8975) {
		//	magdata = this.ak8975.getMagAttitude();
		} else {
			magdata = [0, 0, 0];
		}*/
		return mpudata.concat(magdata);
	}
	return false;
};


/**
 * @name getAccel
 * @return array | false
 */
mpu9150.prototype.getAccel = function() {
	if (this.i2c) {
		var buffer = this.i2c.readBytes(MPU9150.ACCEL_XOUT_H, 6, function() {});
		var aCal = this._config.accelCalibration;

		var xAccel = buffer.readInt16BE(0) * this.accelScalarInv;
		var yAccel = buffer.readInt16BE(2) * this.accelScalarInv;
		var zAccel = buffer.readInt16BE(4) * this.accelScalarInv;

		return [
			scaleAccel(xAccel, aCal.offset.x, aCal.scale.x),
			scaleAccel(yAccel, aCal.offset.y, aCal.scale.y),
			scaleAccel(zAccel, aCal.offset.z, aCal.scale.z)
		];
	}
	return false;
};

/**
 * @name getAccel
 * @return array | false
 */
mpu9150.prototype.getGyro = function() {
	if (this.i2c) {
		var buffer = this.i2c.readBytes(MPU9150.GYRO_XOUT_H, 6, function() {});
		var gCal = this._config.gyroBiasOffset;
		return [
			buffer.readInt16BE(0) * this.gyroScalarInv + gCal.x,
			buffer.readInt16BE(2) * this.gyroScalarInv + gCal.y,
			buffer.readInt16BE(4) * this.gyroScalarInv + gCal.z
		];
	}
	return false;
};

/**
 * Get the raw magnetometer values
 * @name getMagAttitude
 * @return array
 */
mpu9150.prototype.getMagAttitude = function() {
	
	this.setByPASSEnabled(true);
	sleep.usleep(10000);
	
	this.i2c.mag.writeBytes(AK8975.CNTL, [0x01], function(){});
	
	sleep.usleep(10000);
	
	// Get the actual data
	var buffer = this.i2c.mag.readBytes(AK8975.XOUT_L, 6, function(e, r) {});

	var cal = this._config.magCalibration;

	return [
		//((buffer.readInt16LE(0) * this.asax) - cal.offset.x) * cal.scale.x,
		//((buffer.readInt16LE(2) * this.asay) - cal.offset.y) * cal.scale.y,
		//((buffer.readInt16LE(4) * this.asaz) - cal.offset.z) * cal.scale.z
		
		buffer.readInt16LE(0),
		buffer.readInt16LE(2),
		buffer.readInt16LE(4)
	];
};

/**
 * @name getSleepEnabled
 * @return number | false
 */
mpu9150.prototype.getSleepEnabled = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9150.RA_PWR_MGMT_1, MPU9150.PWR1_SLEEP_BIT);
	}
	return false;
};

/**
 * @name getClockSource
 * @return number | false
 */
mpu9150.prototype.getClockSource = function() {
	if (this.i2c) {
		return this.i2c.readByte(MPU9150.RA_PWR_MGMT_1) & 0x07;
	}
	return false;
};

/**
 * @name getFullScaleGyroRange
 * @return number | false
 */
mpu9150.prototype.getFullScaleGyroRange = function() {
	if (this.i2c) {
		var byte = this.i2c.readByte(MPU9150.RA_GYRO_CONFIG);
		byte = byte & 0x18;
		byte = byte >> 3;
		return byte;
	}
	return false;
};

/**
 * @name getGyroPowerSettings
 * @return array
 */
mpu9150.prototype.getGyroPowerSettings = function() {
	if (this.i2c) {
		var byte = this.i2c.readByte(MPU9150.RA_PWR_MGMT_2);
		byte = byte & 0x07;
		return [
			(byte >> 2) & 1,    // X
			(byte >> 1) & 1,    // Y
			(byte >> 0) & 1	    // Z
		];
	}
	return false;
};

/**
 * @name getAccelPowerSettings
 * @return array
 */
mpu9150.prototype.getAccelPowerSettings = function() {
	if (this.i2c) {
		var byte = this.i2c.readByte(MPU9150.RA_PWR_MGMT_2);
		byte = byte & 0x38;
		return [
			(byte >> 5) & 1,    // X
			(byte >> 4) & 1,    // Y
			(byte >> 3) & 1	    // Z
		];
	}
	return false;
};

/**
 * @name getFullScaleAccelRange
 * @return number | false
 */
mpu9150.prototype.getFullScaleAccelRange = function() {
	if (this.i2c) {
		var byte = this.i2c.readByte(MPU9150.RA_ACCEL_CONFIG_1);
		byte = byte & 0x18;
		byte = byte >> 3;
		return byte;
	}
	return false;
};

/**
 * @name getByPASSEnabled
 * @return number | false
 */
mpu9150.prototype.getByPASSEnabled = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9150.RA_INT_PIN_CFG, MPU9150.INTCFG_BYPASS_EN_BIT);
	}
	return false;
};

/**
 * @name getI2CMasterMode
 * @return undefined | false
 */
mpu9150.prototype.getI2CMasterMode = function() {
	if (this.i2c) {
		return this.i2c.readBit(MPU9150.RA_USER_CTRL, MPU9150.USERCTRL_I2C_MST_EN_BIT);
	}
	return false;
};

mpu9150.prototype.getPitch = function(value) {
	//return ((Math.atan2(value[0], value[2]) + Math.PI) * (180 / Math.PI)) - 180;
	return ((Math.atan2(value[1], value[2]) + Math.PI) * (180 / Math.PI)) - 180;
};

mpu9150.prototype.getRoll = function(value) {
	//return ((Math.atan2(value[1], value[2]) + Math.PI) * (180 / Math.PI)) - 180;
	return ((Math.atan2(value[1], value[0]) + Math.PI) * (180 / Math.PI)) - 180;
};

mpu9150.prototype.getYaw = function(value) {
	 var heading = Math.atan2(value[8] * -1, value[7] * -1) * 180 / Math.PI;
	 return heading;
};

/**---------------------|[ SET ]|--------------------**/

/**
 * @name setClockSource
 * @return undefined | false
 */
mpu9150.prototype.setClockSource = function(adrs) {
	if (this.i2c) {
		return this.i2c.writeBits(MPU9150.RA_PWR_MGMT_1, MPU9150.PWR1_CLKSEL_BIT, MPU9150.PWR1_CLKSEL_LENGTH, adrs);
	}
	return false;
};

/**
 * @name setFullScaleGyroRange
 * @return undefined | false
 */
mpu9150.prototype.setFullScaleGyroRange = function(adrs) {
	if (this.i2c) {
		if (this._config.scaleValues) {
			this.gyroScalarInv = 1 / MPU9150.GYRO_SCALE_FACTOR[adrs];
		} else {
			this.gyroScalarInv = 1;
		}
		return this.i2c.writeBits(MPU9150.RA_GYRO_CONFIG, MPU9150.GCONFIG_FS_SEL_BIT, MPU9150.GCONFIG_FS_SEL_LENGTH, adrs);
	}
	return false;
};

/**
 * @name setFullScaleAccelRange
 * @return undefined | false
 */
mpu9150.prototype.setFullScaleAccelRange = function(adrs) {
	if (this.i2c) {
		if (this._config.scaleValues) {
			this.accelScalarInv = 1 / MPU9150.ACCEL_SCALE_FACTOR[adrs];
		} else {
			this.accelScalarInv = 1;
		}
		return this.i2c.writeBits(MPU9150.RA_ACCEL_CONFIG_1, MPU9150.ACONFIG_FS_SEL_BIT, MPU9150.ACONFIG_FS_SEL_LENGTH, adrs);
	}
	return false;
};

/**
 * @name setSleepEnabled
 * @return undefined | false
 */
mpu9150.prototype.setSleepEnabled = function(bool) {
	var val = bool ? 1 : 0;
	if (this.i2c) {
		return this.i2c.writeBit(MPU9150.RA_PWR_MGMT_1, MPU9150.PWR1_SLEEP_BIT, val);
	}
	return false;
};

/**
 * @name setI2CMasterModeEnabled
 * @return undefined | false
 */
mpu9150.prototype.setI2CMasterModeEnabled = function(bool) {
	var val = bool ? 1 : 0;
	if (this.i2c) {
		return this.i2c.writeBit(MPU9150.RA_USER_CTRL, MPU9150.USERCTRL_I2C_MST_EN_BIT, val);
	}
	return false;
};

/**
 * @name setByPASSEnabled
 * @return undefined | false
 */
mpu9150.prototype.setByPASSEnabled = function(bool) {
	var adrs = bool ? 1 : 0;
	if (this.i2c) {
		this.i2c.writeBit(MPU9150.RA_INT_PIN_CFG, MPU9150.INTCFG_BYPASS_EN_BIT, 1);
	}
	return false;
};


/**---------------------|[ Print ]|--------------------**/

/**
 * @name printAccelSettings
 */
mpu9150.prototype.printSettings = function() {
    var CLK_RNG = [
        '0 (Internal 20MHz oscillator)',
        '1 (Auto selects the best available clock source)',
        '2 (Auto selects the best available clock source)',
        '3 (Auto selects the best available clock source)',
        '4 (Auto selects the best available clock source)',
        '5 (Auto selects the best available clock source)',
        '6 (Internal 20MHz oscillator)',
        '7 (Stops the clock and keeps timing generator in reset)'
    ];
    this.debug.Log('INFO', 'MPU9150:');
	this.debug.Log('INFO', '--> Device address: 0x' + this._config.address.toString(16));
	this.debug.Log('INFO', '--> i2c bus: ' + this._config.device);
    this.debug.Log('INFO', '--> Device ID: 0x' + this.getIDDevice().toString(16));
    this.debug.Log('INFO', '--> BYPASS enabled: ' + (this.getByPASSEnabled() ? 'Yes' : 'No'));
	this.debug.Log('INFO', '--> SleepEnabled Mode: ' + (this.getSleepEnabled() === 1 ? 'On' : 'Off'));
	this.debug.Log('INFO', '--> i2c Master Mode: ' + (this.getI2CMasterMode() === 1 ? 'Enabled' : 'Disabled'));
    this.debug.Log('INFO', '--> Power Management (0x6B, 0x6C):');
    this.debug.Log('INFO', '  --> Clock Source: ' + CLK_RNG[this.getClockSource()]);
    this.debug.Log('INFO', '  --> Accel enabled (x, y, z): ' + vectorToYesNo(this.getAccelPowerSettings()));
    this.debug.Log('INFO', '  --> Gyro enabled (x, y, z): ' + vectorToYesNo(this.getGyroPowerSettings()));
};

function vectorToYesNo(v) {
    var str = '(';
    str += v[0] ? 'No, ' : 'Yes, ';
    str += v[1] ? 'No, ' : 'Yes, ';
    str += v[2] ? 'No' : 'Yes';
    str += ')';
    return str;
}

mpu9150.prototype.printAccelSettings = function() {
    var FS_RANGE = [ '±2g (0)', '±4g (1)', '±8g (2)', '±16g (3)' ];
	this.debug.Log('INFO', 'Accelerometer:');
	this.debug.Log('INFO', '--> Full Scale Range (0x1C): ' + FS_RANGE[this.getFullScaleAccelRange()]);
	this.debug.Log('INFO', '--> Scalar: 1/' + (1 / this.accelScalarInv));
	this.debug.Log('INFO', '--> Calibration:');
	this.debug.Log('INFO', '  --> Offset: ');
	this.debug.Log('INFO', '    --> x: ' + this._config.accelCalibration.offset.x);
	this.debug.Log('INFO', '    --> y: ' + this._config.accelCalibration.offset.y);
	this.debug.Log('INFO', '    --> z: ' + this._config.accelCalibration.offset.z);
	this.debug.Log('INFO', '  --> Scale: ');
	this.debug.Log('INFO', '    --> x: ' + this._config.accelCalibration.scale.x);
	this.debug.Log('INFO', '    --> y: ' + this._config.accelCalibration.scale.y);
	this.debug.Log('INFO', '    --> z: ' + this._config.accelCalibration.scale.z);
};

mpu9150.prototype.printGyroSettings = function() {
    var FS_RANGE = ['+250dps (0)', '+500 dps (1)', '+1000 dps (2)', '+2000 dps (3)'];
	this.debug.Log('INFO', 'Gyroscope:');
    this.debug.Log('INFO', '--> Full Scale Range (0x1B): ' + FS_RANGE[this.getFullScaleGyroRange()]);
	this.debug.Log('INFO', '--> Scalar: 1/' + (1 / this.gyroScalarInv));
	this.debug.Log('INFO', '--> Bias Offset:');
	this.debug.Log('INFO', '  --> x: ' + this._config.gyroBiasOffset.x);
	this.debug.Log('INFO', '  --> y: ' + this._config.gyroBiasOffset.y);
	this.debug.Log('INFO', '  --> z: ' + this._config.gyroBiasOffset.z);
};

mpu9150.prototype.printMagnetoSettings = function() {
	this.debug.Log('INFO', 'Magnetometer (Compass):');
	this.debug.Log('INFO', '--> i2c address: 0x' + this._config.ak_address.toString(16));
	this.debug.Log('INFO', '--> Device ID: 0x' + this.getIDMagDevice().toString(16));
	this.debug.Log('INFO', '--> Scalars:');
	var magdata = this.getMagAttitude();
	this.debug.Log('INFO', '  --> x: ' + magdata[0]);
	this.debug.Log('INFO', '  --> y: ' + magdata[1]);
	this.debug.Log('INFO', '  --> z: ' + magdata[2]);
};

////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 				Kalman filter									   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////
mpu9150.prototype.Kalman_filter = function() {
	this.Q_angle = 0.001;
	this.Q_bias = 0.003;
	this.R_measure = 0.03;

	this.angle = 0;
	this.bias = 0;
	this.rate = 0;

	this.P = [[0, 0], [0, 0]];

	this.S = 0;
	this.K = [];
	this.Y = 0;

	this.getAngle = function(newAngle, newRate, dt) {

		this.rate = newRate - this.bias;
		this.angle += dt * this.rate;

		this.P[0][0] += dt * (dt * this.P[1][1] - this.P[0][1] - this.P[1][0] + this.Q_angle);
		this.P[0][1] -= dt * this.P[1][1];
		this.P[1][0] -= dt * this.P[1][1];
		this.P[1][1] += this.Q_bias * dt;

		this.S = this.P[0][0] + this.R_measure;

		this.K[0] = this.P[0][0] / this.S;
		this.K[1] = this.P[1][0] / this.S;

		this.Y = newAngle - this.angle;

		this.angle += this.K[0] * this.Y;
		this.bias += this.K[1] * this.Y;

		this.P[0][0] -= this.K[0] * this.P[0][0];
		this.P[0][1] -= this.K[0] * this.P[0][1];
		this.P[1][0] -= this.K[1] * this.P[0][0];
		this.P[1][1] -= this.K[1] * this.P[0][1];

		return this.angle;
	};

	this.getRate     = function() { return this.rate; };
	this.getQangle   = function() { return this.Q_angle; };
	this.getQbias    = function() { return this.Q_bias; };
	this.getRmeasure = function() { return this.R_measure; };

	this.setAngle    = function(value) { this.angle = value; };
	this.setQangle   = function(value) { this.Q_angle = value; };
	this.setQbias    = function(value) { this.Q_bias = value; };
	this.setRmeasure = function(value) { this.R_measure = value; };
};


////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 					Debug Console Configuration					   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////

var debugConsole = function(debug) {
	this.enabled = debug || false;
};
debugConsole.prototype.Log = function(type, str) {
	if (this.enabled) {
		var date = new Date();
		var strdate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
		var strhour = date.getHours() + ':' + date.getMinutes();
		console.log('[' + type.toUpperCase() + '][' + strhour + ' ' + strdate + ']:' + str);
	}
};
debugConsole.prototype.constructor = debugConsole;

////////////////////////////////////////////////////////////////////////////////////
// /** ---------------------------------------------------------------------- **/ //
//  *		 					I2C SURCHARGE Configuration					   *  //
// /** ---------------------------------------------------------------------- **/ //
////////////////////////////////////////////////////////////////////////////////////

var LOCAL_I2C = function(adrs, params) {
	MOD_I2C.call(this, adrs, params);
};

LOCAL_I2C.prototype = Object.create(MOD_I2C.prototype);
LOCAL_I2C.prototype.constructor = LOCAL_I2C;

LOCAL_I2C.prototype.bitMask = function(bit, length) {
  return ((1 << length) - 1) << bit;
};

LOCAL_I2C.prototype.readByte = function(adrs, callback) {
	callback = callback || function() {};
	var buf = this.readBytes(adrs, 1, callback);
	return buf[0];
};

/**
 * Return the bit value, 1 or 0.
 * @param  {number}   adrs     The address of the byte to read.
 * @param  {number}   bit      The nth bit.
 * @param  {Function} callback (Optional) callback
 * @return {number}            1 or 0.
 */
LOCAL_I2C.prototype.readBit = function(adrs, bit, callback) {
	var buf = this.readByte(adrs, callback);
	return (buf >> bit) & 1;
};

/**
 * Write a sequence of bits.  Note, this will do a read to get the existing value, then a write.
 * @param  {number}   adrs     The address of the byte to write.
 * @param  {number}   bit      The nth bit to start at.
 * @param  {number}   length   The number of bits to change.
 * @param  {number}   value    The values to change.
 * @param  {Function} callback (Optional) callback
 */
LOCAL_I2C.prototype.writeBits = function(adrs, bit, length, value, callback) {
	callback = callback || function() {};
	var oldValue = this.readByte(adrs);
	var mask = this.bitMask(bit, length);
	var newValue = oldValue ^ ((oldValue ^ (value << bit)) & mask);
	return this.writeBytes(adrs, [newValue], callback);
};

/**
 * Write one bit.  Note, this will do a read to get the existing value, then a write.
 * @param  {number}   adrs     The address of the byte to write.
 * @param  {number}   bit      The nth bit.
 * @param  {number}   value    The new value, 1 or 0.
 * @param  {Function} callback (Optional) callback
 */
LOCAL_I2C.prototype.writeBit = function(adrs, bit, value, callback) {
	return this.writeBits(adrs, bit, 1, value, callback);
};

/*******************************/
/** export the module to node **/
/*******************************/

module.exports = mpu9150;