# VPN Toggler

An updated version of <https://gitlab.com/XavierBerger/custom-vpn-toggler> for GNOME 42

## Gnome Shell extension overview

**VPN Toggler** is a Gnome Shell extension which allow to 
* See the status of a VPN and permit to start and stop VPN.
* See IP address associated.

## Prerequisite and configuration

Install a VPN and create a command able to start it, stop it and get its IP address (see example bellow).

VPN command have to implement the following parameters:

* **start**: to start VPN - If required, this command could display GUI.
* **stop**: to stop VPN.
* **ip**: to get IP address - If not IP is available, this function should return nothing.

*Note: Parameter **ip** is used to determine if VPN is started or not.*

Configure the command in **VPN Toggler** setting.

### VPN script
See `scripts` folder.

## License and thanks

This extension is public under [MIT License](LICENSE)

This extension is a derivate work form [custom-vpn-toggler](https://extensions.gnome.org/extension/4061/custom-vpn-toggler/) created by [XavierBerger](https://extensions.gnome.org/accounts/profile/XavierBerger).
