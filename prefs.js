'use strict';

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
