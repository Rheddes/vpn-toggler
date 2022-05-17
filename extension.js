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

const { GObject, St, Gio, Clutter } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;

const STATUS = { error: -1, unknown: 0, connected: 1, disconnected: 2 };

const Indicator = GObject.registerClass(class Indicator extends PanelMenu.Button {
    _init() {
        super._init();
        this._settings = Convenience.getSettings();

        this._ip = "";

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

        this.vpnSwitch = new PopupMenu.PopupSwitchMenuItem('...', { active: true });
        this.vpnSwitch.setToggleState(false);
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
        this._status = this._prevStatus = STATUS.unknown;
        this._sourceId = 0;
        this._settings.connect('changed', this._settingsChanged.bind(this));
        this._settingsChanged();
        this._update();

        // let item = new PopupMenu.PopupMenuItem(_('Show Notification'));
        // item.connect('activate', () => {
        //     Main.notify(_('Whatʼs up, folks?'));
        // });
        // this.menu.addMenuItem(item);
    }

    _toggleSwitch(widget, value) {
    }

    _update() {
    }

    _settingsChanged() {
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
        Convenience.initTranslations();
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
