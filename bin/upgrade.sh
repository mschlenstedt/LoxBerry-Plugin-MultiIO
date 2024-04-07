#!/bin/bash

packageurl="https://pypi.org/pypi/mqtt-io/json"
pluginname=$(perl -e 'use LoxBerry::System; print $lbpplugindir; exit;')
oldversion=$(pip3 show mqtt-io | grep Version: | cut -d: -f 2 | sed 's/[[:blank:]]//g')

# print out versions
if [[ $1 == "current" ]]; then
	echo -n $oldversion
	exit 0
fi
if [[ $1 == "available" ]]; then
	newversion=$(curl -s $packageurl | jq -r '.info.version')
	echo -n $newversion
	exit 0
fi

if [ "$UID" -ne 0 ]; then
	echo "This script has to be run as root."
	exit
fi

# Logging
. $LBHOMEDIR/libs/bashlib/loxberry_log.sh
PACKAGE=$pluginname
NAME=upgrade
LOGDIR=${LBPLOG}/${PACKAGE}
STDERR=1
LOGSTART "MQTT-IO upgrade started."

# Install
LOGINF "Installing MQTT-IO via pip3..."

yes | python3 -m pip install --upgrade pip | tee -a $FILENAME
yes | python3 -m pip install --upgrade mqtt-io | tee -a $FILENAME
yes | python3 -m pip install --upgrade RPi.GPIO pcf8575 pcf8574 adafruit_circuitpython_mcp230xx adafruit-circuitpython-ads1x15 adafruit-circuitpython-ahtx0 smbus2 RPi.bme280 bme680 w1thermsensor pi-ina219 adafruit-mcp3008 | tee -a $FILENAME

# SPecial handling because Module is too old...
yes | python3 -m pip install "setuptools<58.0.0" wheel | tee -a $FILENAME
yes | python3 -m pip install adxl345 | tee -a $FILENAME
yes | python3 -m pip install setuptools | tee -a $FILENAME

# Following packages are for some special boards only
if [ -e /boot/dietpi/.hw_model ]; then
	. /boot/dietpi/.hw_model
else # Old installations are from Raspbian, so we are definetely on a Rapsberry
	G_HW_MODEL=9
fi
if [ $G_HW_MODEL -lt 10 ]; then # Raspberrys
	yes | python3 -m pip install --upgrade Adafruit_DHT | tee -a $FILENAME
fi

# End
newversion=$(pip3 show mqtt-io | grep Version: | cut -d: -f 2 | sed 's/[[:blank:]]//g')
LOGOK "Upgrading MQTT-IO from $oldversion to $newversion"
LOGEND "Upgrading MQTT-IO from $oldversion to $newversion"

chown loxberry:loxberry $FILENAME

exit 0
