#!/bin/zsh

zip -q vpn-toggler@rheddes.nl.zip schemas/org.gnome.shell.extensions.vpn-toggler.gschema.xml metadata.json prefs.js prefs.ui extension.js LICENSE images/icon.png images/security-high-symbolic.svg images/security-medium-symbolic.svg images/security-low-symbolic.svg "$(ls locale/**/*.mo)"
unzip -l vpn-toggler@rheddes.nl.zip
rm -rf vpn-toggler@rheddes.nl
