#!/bin/bash

mkdir locale
mkdir -p locale/en/LC_MESSAGE

xgettext --from-code=UTF-8 --output=locale/vpn-toggler.pot *.js *.ui
msginit --locale en --input locale/vpn-toggler.pot --output locale/en/LC_MESSAGE/vpn-toggler.po
msgfmt locale/en/LC_MESSAGE/vpn-toggler.po --output-file=locale/en/LC_MESSAGE/vpn-toggler.mo
