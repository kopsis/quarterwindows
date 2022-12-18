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

const { Meta, Shell } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const PutWindowUtils = Me.imports.putWindow.utils;

class Extension {
  constructor() {
    this.corners = ["w", "c", "e"];
    this.directions = ["w", "e"];
  }

  moveWindow(corner) {
    global.get_window_actors().every((w) => {
      if (w.meta_window.has_focus()) {
        var monitorGeometry = global.display.get_monitor_geometry(
          w.meta_window.get_monitor(),
        );
        var monitorUpperLeftX = monitorGeometry.x;
        var monitorUpperLeftY = monitorGeometry.y + 32;
        var monitorThirdWidth = Math.floor(monitorGeometry.width / 3);
        var monitorHeight = monitorGeometry.height - 32;
        var windowGap = 10;

        if (w.meta_window.get_maximized()) {
          w.meta_window.unmaximize(3); // META_MAXIMIZE_BOTH
        }
        switch (corner) {
          case "w":
            w.meta_window.move_resize_frame(
              0,
              monitorUpperLeftX + windowGap,
              monitorUpperLeftY + windowGap,
              monitorThirdWidth - (2 * windowGap),
              monitorHeight - (2 * windowGap),
            );
            break;
          case "c":
            w.meta_window.move_resize_frame(
              0,
              monitorUpperLeftX + monitorThirdWidth + windowGap,
              monitorUpperLeftY + windowGap,
              monitorThirdWidth - (2 * windowGap),
              monitorHeight - (2 * windowGap),
            );
            break;
          case "e":
            w.meta_window.move_resize_frame(
              0,
              monitorUpperLeftX + (2 * monitorThirdWidth) + windowGap,
              monitorUpperLeftY + windowGap,
              monitorThirdWidth - (2 * windowGap),
              monitorHeight - (2 * windowGap),
            );
            break;
        }
        return false;
      }
      return true;
    });
  }

  moveFocus(direction) {
    let otherWindows = [];
    let focusedWindow;
    let candidates = [];

    for (let i = 0; i < global.get_window_actors().length; i++) {
      if (global.get_window_actors()[i].meta_window.has_focus()) {
        focusedWindow = global.get_window_actors()[i];
      } else {
        otherWindows.push(global.get_window_actors()[i]);
      }
    }
    if (focusedWindow == null || otherWindows.length == 0) {
      return false;
    } else {
      for (let i = 0; i < otherWindows.length; i++) {
        if (
          PutWindowUtils.isFocusCandidate(
            focusedWindow,
            otherWindows[i],
            direction,
          )
        ) {
          if (!otherWindows[i].meta_window.is_hidden()) {
            candidates.push({
              window: otherWindows[i],
              dist: PutWindowUtils.getDistance(focusedWindow, otherWindows[i]),
            });
          }
        }
      }
      PutWindowUtils.findAndActivateNearestCandidate(candidates);
    }
  }

  enable() {
    let settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.net-kopsis-thirdwindows",
    );
    let mode = Shell.ActionMode.NORMAL;
    let flag = Meta.KeyBindingFlags.NONE;

    for (let i = 0; i < this.corners.length; i++) {
      Main.wm.addKeybinding(
        "put-to-corner-" + this.corners[i],
        settings,
        flag,
        mode,
        () => {
          this.moveWindow(this.corners[i]);
        },
      );
    }

    for (let i = 0; i < this.directions.length; i++) {
      Main.wm.addKeybinding(
        "move-focus-" + this.directions[i],
        settings,
        flag,
        mode,
        () => {
          this.moveFocus(this.directions[i]);
        },
      );
    }
  }

  disable() {
    for (let i = 0; i < this.corners.length; i++) {
      Main.wm.removeKeybinding("put-to-corner-" + this.corners[i]);
    }

    for (let i = 0; i < this.directions.length; i++) {
      Main.wm.removeKeybinding("move-focus-" + this.directions[i]);
    }
  }
}

function init() {
  return new Extension();
}
