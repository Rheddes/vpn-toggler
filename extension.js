/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { GObject, St, Gio, Clutter, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ByteArray = imports.byteArray;

const STATUS = { error: -1, unknown: 0, connected: 1, disconnected: 2 };

const Indicator = GObject.registerClass(class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0);
        this._settings = Convenience.getSettings();
        this._ip = '';

        /* Icon indicator */
        this.vpnErrorIcon = Gio.icon_new_for_string(Me.path + '/images/security-low-symbolic.svg');
        this.vpnOffIcon = Gio.icon_new_for_string(Me.path + '/images/security-medium-symbolic.svg');
        this.vpnOnIcon = Gio.icon_new_for_string(Me.path + '/images/security-high-symbolic.svg');

        const box = new St.BoxLayout();
        this.label = new St.Label({
            text: '',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });

        this.icon = new St.Icon({
            gicon: this.vpnErrorIcon,
            style_class: 'system-status-icon',
        });
        box.add(this.icon);
        box.add(this.label);

        this.add_child(box);

        /* Start Menu */

        this.vpnSwitch = new PopupMenu.PopupSwitchMenuItem('...', {
            active: true,
            toggleState: false,
        });
        this.vpnSwitch.connect('toggled', this._toggleSwitch.bind(this));
        this.menu.addMenuItem(this.vpnSwitch);

        this.vpnIp = new PopupMenu.PopupMenuItem('Initialization...');
        this.menu.addMenuItem(this.vpnIp);


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.settingsMenuItem = new PopupMenu.PopupMenuItem('Settings');
        this.settingsMenuItem.connect('activate', () => {
            ExtensionUtils.openPrefs();
            this._prevStatus = STATUS.unknown;
            this._update();
        });
        this.menu.addMenuItem(this.settingsMenuItem);

        /* Initialization */
        this._status = STATUS.unknown;
        this._sourceId = 0;
        this._settings.connect('changed', this._settingsChanged.bind(this));
        this._settingsChanged();
        this._update();
    }

    _getValue(keyName) {
        return this._settings.get_value(keyName).deep_unpack();
    }

    _toggleSwitch(widget, value) {
        const command = [this._getValue('vpn'), ((value) ? 'start' : 'stop')];
        try {
            const proc = Gio.Subprocess.new(
              command,
              Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    log(stdout);
                    log(stderr);
                    return [true, stdout, stderr];
                } catch (e) {
                    logError(e);
                }
            });
        } catch (e) {
            logError(e);
        }
        this._update();
    }

    _getVPNStatus() {
        if (!this._getValue('vpn')) {
            return STATUS.error;
        }
        const [, out] = GLib.spawn_command_line_sync('/bin/bash -c "' + this._getValue('vpn') + ' ip"');
        return {status: (out.length > 0 ? STATUS.connected : STATUS.disconnected), out};
    }

    _update() {
        const { status, out } = this._getVPNStatus();
        if (this._status !== status) {
            if (status === STATUS.connected) {
                this._ip = ByteArray.toString(out);
                this.icon.set_gicon(this.vpnOnIcon);
                this.vpnSwitch.setSensitive(true);
                this.vpnSwitch.label.set_text('Disable VPN');
                this.vpnSwitch.setToggleState(true);
                this.vpnIp.label.set_text(`Connected!\nIP: ${this._ip}`);
            } else if (status === STATUS.disconnected) {
                this._ip = '';
                this.icon.set_gicon(this.vpnOffIcon);
                this.vpnSwitch.setSensitive(true);
                this.vpnSwitch.label.set_text('Enable VPN');
                this.vpnSwitch.setToggleState(false);
                this.vpnIp.label.set_text('VPN Disconnected');
            } else {
                this._ip = '';
                this.icon.set_gicon(this.vpnErrorIcon);
                this.vpnSwitch.setSensitive(false);
                this.vpnSwitch.label.set_text('Script error');
                this.vpnSwitch.setToggleState(false);
                this.vpnIp.label.set_text('Please update your settings\nand see help if needed.');
            }
            this._status = status;
        }
        return true;
    }

    _settingsChanged() {
        if (this._sourceId > 0) {
            GLib.source_remove(this._sourceId);
        }
        const checktime = this._getValue('checktime');
        this._sourceId = GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT, checktime > 0 ? checktime : 1,
          this._update.bind(this),
        );
        log(this._sourceId);
        this._update();
    }

    disableUpdate() {
        if (this._sourceId > 0) {
            GLib.source_remove(this._sourceId);
        }
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        log(`enabling ${Me.metadata.name}`);

        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.disableUpdate();
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
