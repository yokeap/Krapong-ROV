#include <Servo.h>

/* Copyright by S.Sukprasertchai
 *
 *
*/

class thruster{

  private:
  unsigned int _dirPin, _pwmPin;

  public:
  //constructor
  thruster(unsigned int dirPin, unsigned int pwmPin){
    _dirPin = dirPin;
    _pwmPin = pwmPin;
    pinMode(_dirPin, OUTPUT);  
    pinMode(_pwmPin, OUTPUT); 
  }

  void setDirection(bool dir){
    digitalWrite(_dirPin, dir);    
  }

  void setPWM(unsigned int pwm){
    if ((_dirPin < 5) || (_dirPin > 9)) {
      analogWriteResolution(8);
      analogWrite(_pwmPin, map(pwm, 0, 100, 0, 255));
    }
    else {
      analogWriteResolution(12);
      analogWrite(_pwmPin, map(pwm, 0, 100, 0, 4095));
    }

  }
};

thruster T[6] = {
  thruster(22,6),
  thruster(23,7),
  thruster(24,8),
  thruster(25,9),
  thruster(26,10),
  thruster(27,11)
  };

String inString = "";    // string to hold input
int n = 0;
bool blFlag = 0;
int value[8];

Servo camServo, armServo;

void setup() {
  // Open serial communications and wait for port to open:
  camServo.attach(2);
  armServo.attach(3);
  Serial.begin(115200);
   Serial1.begin(115200);
   delay(100);
  // send an intro:
  // send an intro:
  Serial.println("\n\nTest:");
}

void loop() {
  if (Serial1.available() > 0) {
    //Serial.print((char)Serial1.read());
    String inStringRAW = Serial1.readStringUntil('\n');
    inStringRAW += '\n'; 
    Serial.println(inStringRAW);
    Serial.println();
    int index = 0;
    n = 0;
    int count = 0;
     while(inStringRAW.charAt(index) != '\n'){
      if ((isDigit(inStringRAW.charAt(index))) || (inStringRAW.charAt(index)  == '-')) {
        inString += inStringRAW.charAt(index);
        count = 0;
      }
      if (inStringRAW.charAt(index)  == ',') {
        Serial.print("\nValue:");
        Serial.println(inString.toInt());
        Serial.print("String: ");
        Serial.println(inString);
        Serial.print("POS: ");
        Serial.println(n);
        value[n] = inString.toInt();
        
        // clear the string for new input:
        inString = "";

        //increase Thruster Position
        n++;
        count = 0;
      }
      index++;
      blFlag = true;
      if(++count > 1000) break;
    }
  }
  if(blFlag){
    blFlag = false;
    H_Control();
    camServo.write(value[6]);
    armServo.write(value[7]);
  }
}

void H_Control()
{
  int i = 0;
  for(i = 0; i < 6 ; i++){
    if((value[i] <= -100) || (value[i]) >= 100) break;
    if(value[i] > 0) 
      T[i].setDirection(1);
    if(value[i] < 0) 
      T[i].setDirection(0);

        //T[2].setDirection(0);
        T[i].setPWM(abs(value[i]));
    }
}
