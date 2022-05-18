#!/bin/bash
glib-compile-schemas schemas/
zip -q custom-vpn-toggler.zip schemas/custom-vpn-toggler.gschema.xml schemas/gschemas.compiled metadata.json prefs.js convenience.js extension.js preferenceswidget.js LICENSE images/icon.png images/security-high-symbolic.svg images/security-medium-symbolic.svg images/security-low-symbolic.svg
unzip -l custom-vpn-toggler.zip
