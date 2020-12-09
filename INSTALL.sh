#!/bin/sh
cd Resources
source=$PWD
cd $HOME
mkdir ./cliInference
cd cliInference
destination=$PWD
cp -avr $source $destination
exit 0