#!/bin/bash

# Exit code must be 0 if executed successfull. 
# Exit code 1 gives a warning but continues installation.
# Exit code 2 cancels installation.
#
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# Will be executed as user "root".
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
#
# You can use all vars from /etc/environment in this script.
#
# We add 5 additional arguments when executing this script:
# command <TEMPFOLDER> <NAME> <FOLDER> <VERSION> <BASEFOLDER>
#
# For logging, print to STDOUT. You can use the following tags for showing
# different colorized information during plugin installation:
#
# <OK> This was ok!"
# <INFO> This is just for your information."
# <WARNING> This is a warning!"
# <ERROR> This is an error!"
# <FAIL> This is a fail!"

# To use important variables from command line use the following code:
COMMAND=$0    # Zero argument is shell command
PTEMPDIR=$1   # First argument is temp folder during install
PSHNAME=$2    # Second argument is Plugin-Name for scipts etc.
PDIR=$3       # Third argument is Plugin installation folder
PVERSION=$4   # Forth argument is Plugin version
#LBHOMEDIR=$5 # Comes from /etc/environment now. Fifth argument is
              # Base folder of LoxBerry
PTEMPPATH=$6  # Sixth argument is full temp path during install (see also $1)

# Combine them with /etc/environment
PCGI=$LBPCGI/$PDIR
PHTML=$LBPHTML/$PDIR
PTEMPL=$LBPTEMPL/$PDIR
PDATA=$LBPDATA/$PDIR
PLOG=$LBPLOG/$PDIR # Note! This is stored on a Ramdisk now!
PCONFIG=$LBPCONFIG/$PDIR
PSBIN=$LBPSBIN/$PDIR
PBIN=$LBPBIN/$PDIR

echo "<INFO> Installation as root user started."

echo "<INFO> Start installing pip3..."
yes | python3 -m pip install --upgrade pip
INSTALLED=$(pip3 list --format=columns | grep "pip" | grep -v grep | wc -l)
if [ ${INSTALLED} -ne "0" ]; then
	echo "<OK> Python Pip installed successfully."
else
	echo "<WARNING> Python Pip installation failed! The plugin will not work without."
	echo "<WARNING> Giving up."
	exit 2;
fi 

echo "<INFO> Start installing Python MQTT-IO..."
yes | python3 -m pip install --upgrade mqtt-io
INSTALLED=$(pip3 list --format=columns | grep "mqtt-io" | grep -v grep | wc -l)
if [ ${INSTALLED} -ne "0" ]; then
	echo "<OK> Python MQTT-IO installed successfully."
else
	echo "<WARNING> Python MQTT-IO installation failed! The plugin will not work without."
	echo "<WARNING> Giving up."
	exit 2;
fi 

echo "<INFO> Start installing Python Modules..."
yes | python3 -m pip install setuptools
yes | python3 -m pip install --upgrade RPi.GPIO 
yes | python3 -m pip install --upgrade smbus2 
yes | python3 -m pip install --upgrade gpiozero 
yes | python3 -m pip install --upgrade pcf8575 
yes | python3 -m pip install --upgrade pcf8574 
yes | python3 -m pip install --upgrade adafruit_circuitpython_mcp230xx 
yes | python3 -m pip install --upgrade adafruit-circuitpython-ads1x15 
yes | python3 -m pip install --upgrade adafruit-circuitpython-ahtx0 
yes | python3 -m pip install --upgrade adafruit-circuitpython-ens160 
yes | python3 -m pip install --upgrade adafruit-circuitpython-sht4x 
yes | python3 -m pip install --upgrade adafruit-circuitpython-veml7700 
yes | python3 -m pip install --upgrade adafruit-circuitpython-tsl2561 
yes | python3 -m pip install --upgrade sparkfun-circuitpython-qwiicas3935
yes | python3 -m pip install --upgrade adafruit-mcp3008 
yes | python3 -m pip install --upgrade Adafruit-BMP 
yes | python3 -m pip install --upgrade Adafruit_DHT
yes | python3 -m pip install --upgrade RPi.bme280 
yes | python3 -m pip install --upgrade bme680 
yes | python3 -m pip install --upgrade w1thermsensor 
yes | python3 -m pip install --upgrade pi-ina219 
yes | python3 -m pip install --upgrade plantower 

# SPecial handling because Module is too old...
yes | python3 -m pip install "setuptools<58.0.0" wheel
yes | python3 -m pip install adxl345
yes | python3 -m pip install setuptools

# Following packages are for some special boards only
#if [ -e /boot/dietpi/.hw_model ]; then
#	. /boot/dietpi/.hw_model
#else # Old installations are from Raspbian, so we are definetely on a Rapsberry
#	G_HW_MODEL=9
#fi
#if [ $G_HW_MODEL -lt 10 ]; then # Raspberrys
#	yes | python3 -m pip install --upgrade Adafruit_DHT
#fi

echo "<INFO> Adjusting permissions..."
chown root:root $PBIN/upgrade.sh
chmod 0755 $PBIN/upgrade.sh

#echo "<INFO> Installing new Sensor Modules until they are available in the official repo..."
#if [ -e /usr/local/lib/python3.11/dist-packages/mqtt_io/modules/sensor ]; then
#	wget https://raw.githubusercontent.com/mschlenstedt/mqtt-io/refs/heads/veml7700/mqtt_io/modules/sensor/veml7700.py -O /usr/local/lib/python3.11/dist-packages/mqtt_io/modules/sensor/veml7700.py
#	wget https://raw.githubusercontent.com/mschlenstedt/mqtt-io/refs/heads/as3935/mqtt_io/modules/sensor/as3935.py -O /usr/local/lib/python3.11/dist-packages/mqtt_io/modules/sensor/as3935.py
#else
#	echo "<WARNING> No DietPi with Bookworm installation. Will not install additional modules."
#fi

exit 0
