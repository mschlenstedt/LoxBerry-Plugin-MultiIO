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

echo "<INFO> Start installing PyYAML with workaround from here: https://github.com/flyte/mqtt-io/issues/334"
echo 'Cython < 3.0' > /tmp/constraint.txt
yes | PIP_CONSTRAINT=/tmp/constraint.txt python3 -m pip install 'PyYAML==5.4.1'
rm  /tmp/constraint.txt
INSTALLED=$(pip3 list --format=columns | grep "PyYAML" | grep -v grep | wc -l)
if [ ${INSTALLED} -ne "0" ]; then
	echo "<OK> Python PyYAML installed successfully."
else
	echo "<WARNING> Python PyYAML installation failed! The plugin will not work without."
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
yes | python3 -m pip install --upgrade RPi.GPIO pcf8575 pcf8574 adafruit_circuitpython_mcp230xx adafruit-circuitpython-ads1x15 adafruit-circuitpython-ahtx0 smbus2 RPi.bme280 bme680 w1thermsensor pi-ina219 adafruit-mcp3008

# Following packages are for some special boards only
if [ -e /boot/dietpi/.hw_model ]; then
	. /boot/dietpi/.hw_model
fi
if [ $G_HW_MODEL -lt 10 ]; then # Raspberrys
	yes | python3 -m pip install --upgrade Adafruit_DHT
fi

if [ -e "/usr/local/lib/python3.11/dist-packages/mqtt_io/modules/sensor/ads1x15.py" ]; then
	echo "<INFO> Install ads1x15 Bugfix as long as it is not in the main mqtt-io branch..."
	mv /usr/local/lib/python3.11/dist-packages/mqtt_io/modules/sensor/ads1x15.py /usr/local/lib/python3.11/dist-packages/mqtt_io/modules/sensor/ads1x15.py.orig
	mv $PDATA/ads1x15.py /usr/local/lib/python3.11/dist-packages/mqtt_io/modules/sensor/ads1x15.py
fi

echo "<INFO> Add user 'loxberry' to different additional groups..."
usermod -a -G gpio loxberry
usermod -a -G i2c loxberry

exit 0
