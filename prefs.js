'use strict';

/*
 * Copyright (c) 2021 Xavier Berger
 *
 * This code has been inspired from wireguard-indicator@atareao.es from
 *   Lorenzo Carbonell Cerezo <a.k.a. atareao>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */


const { Gio, Gtk } = imports.gi;
const version = Gtk.get_major_version();

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;


function init() {
}

function _onBtnClicked() {
  log('I have been clicked');
  // const vpnScriptSelector = page.get_object('file_chooser');
  // vpnScriptSelector.show();
}

function fillPreferencesWindow(window) {
  // Use the same GSettings schema as in `extension.js`
  const settings = Convenience.getSettings();

  const builder = Gtk.Builder.new();
  builder.add_from_file(Me.path + '/prefs.ui');
  const page = builder.get_object('vpn-toggler-pref-page');
  window.add(page);

  builder.get_object('explain-label').set_label(`
    <small>
      <b>VPN command have to implement the following parameters</b>
       - <b>start</b>: to start VPN - If required, this command could display GUI
       - <b>stop</b>: to stop VPN.
       - <b>ip</b>: to get IP address - If not IP is available, this function should return nothing
      <i>Note: parameter <b>ip</b> is used to determine if VPN is started or not.</i>
    </small>
  `);

  const vpnScriptSelectorButton = builder.get_object('file-chooser-button');
  const vpnScriptSelector = builder.get_object('file-chooser');

  vpnScriptSelectorButton.set_label(settings.get_string('vpn'))
  vpnScriptSelectorButton.connect('clicked', () => {
    vpnScriptSelector.show();
  });

  vpnScriptSelector.connect('response', (native, response) => {
    if (response !== Gtk.ResponseType.ACCEPT) {
      return;
    }
    const fileURI = native.get_file().get_path();
    vpnScriptSelectorButton.set_label(fileURI);
    settings.set_string('vpn', fileURI);
  });

  const checkTimeSelector = builder.get_object('check-time');
  checkTimeSelector.adjustment = new Gtk.Adjustment({
    lower: 0,
    upper: 10000,
    step_increment: 1
  });
  settings.bind('checktime', checkTimeSelector.adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
}
