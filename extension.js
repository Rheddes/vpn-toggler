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


/* exported init */

const { GObject, St, Gio, Clutter, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ByteArray = imports.byteArray;
const Gettext = imports.gettext;

const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;

const STATUS = { error: -1, unknown: 0, connected: 1, disconnected: 2 };

const Indicator = GObject.registerClass(class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.5);
        this._settings = ExtensionUtils.getSettings();
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

        this.vpnIp = new PopupMenu.PopupMenuItem(_('Initialization...'));
        this.menu.addMenuItem(this.vpnIp);


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.settingsMenuItem = new PopupMenu.PopupMenuItem(_('Settings'));
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
                this.vpnSwitch.label.set_text(_('Disable VPN'));
                this.vpnSwitch.setToggleState(true);
                this.vpnIp.label.set_text(`${_('Connected!')}\nIP: ${this._ip}`);
            } else if (status === STATUS.disconnected) {
                this._ip = '';
                this.icon.set_gicon(this.vpnOffIcon);
                this.vpnSwitch.setSensitive(true);
                this.vpnSwitch.label.set_text(_('Enable VPN'));
                this.vpnSwitch.setToggleState(false);
                this.vpnIp.label.set_text(_('VPN Disconnected'));
            } else {
                this._ip = '';
                this.icon.set_gicon(this.vpnErrorIcon);
                this.vpnSwitch.setSensitive(false);
                this.vpnSwitch.label.set_text(_('Script error'));
                this.vpnSwitch.setToggleState(false);
                this.vpnIp.label.set_text(_('Please update your settings\nand see help if needed.'));
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
        ExtensionUtils.initTranslations(uuid);
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
