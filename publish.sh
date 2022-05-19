#!/bin/zsh

glib-compile-schemas schemas/
zip -q vpn-toggler@rheddes.nl.zip schemas/vpn-toggler.gschema.xml schemas/gschemas.compiled metadata.json prefs.js prefs.ui extension.js LICENSE images/icon.png images/security-high-symbolic.svg images/security-medium-symbolic.svg images/security-low-symbolic.svg "$(ls locale/**/*.mo)"
unzip -l vpn-toggler@rheddes.nl.zip
rm -rf vpn-toggler@rheddes.nl
