#!/bin/bash

if [ -z $1 ]
then
	exit 1
fi

if [ $1 == "start" ]
then
        systemctl start openvpn-client@office
fi

if [ $1 == "stop" ]
then
        systemctl stop openvpn-client@office
fi

if [ $1 == "ip" ]
then
	ip addr show tun0 2> /dev/null | perl -ne '/(172.\d+.\d+.\d+)/ and print $1'
fi
