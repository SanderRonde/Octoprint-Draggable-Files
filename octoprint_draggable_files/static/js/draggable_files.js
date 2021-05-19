// @ts-check

/*
 * View model for OctoPrint-Draggable_files
 *
 * Author: Sander Ronde
 * License: MIT
 */
$(function () {
    class Draggable_filesViewModel {
        constructor([filesModel, settingsModel]) {
            this._filesModel = filesModel;
            this._settingsModel = settingsModel;
        }

        _getEntries() {
            return Array.from($(".gcode_files .scroll-wrapper .entry"));
        }

        _splitPath(path) {
            return path.split("/");
        }

        _joinPaths(...paths) {
            if (paths.length > 2) {
                return this._joinPaths(
                    this._joinPaths(paths[0], paths[1]),
                    ...this._joinPaths(...paths.slice(2))
                );
            }
            if (paths.length === 1) {
                return paths[1];
            }

            const [firstPart, secondPart] = paths;
            const splitFirstPart = ["", ...this._splitPath(firstPart)];
            const splitSecondPart = this._splitPath(secondPart);

            if (splitSecondPart.length > 1) {
                return this._joinPaths(
                    this._joinPaths(firstPart, splitSecondPart[0]),
                    ...splitSecondPart.slice(1).join("/")
                );
            }

            const firstSecondPart = splitSecondPart[0];
            if (firstSecondPart === "..") {
                return splitFirstPart.slice(0, -1).join("/");
            }
            return [...splitFirstPart, firstSecondPart].join("/");
        }

        _getMoveDestination(e) {
            const {originalEvent} = e;
            for (let i = 0; i < originalEvent.path.length; i++) {
                const element = originalEvent.path[i];
                if (element && element.classList && element.classList.contains("entry")) {
                    const siblings = this._getEntries();
                    const isBack = element.classList.contains("back");
                    const filesAndFolders = this._filesModel.filesAndFolders();
                    return {
                        destination: isBack
                            ? {
                                  type: "folder",
                                  path: this._joinPaths(
                                      this._filesModel.currentPath(),
                                      ".."
                                  ).slice(1)
                              }
                            : filesAndFolders[siblings.indexOf(element)],
                        source: filesAndFolders[siblings.indexOf(e.item)]
                    };
                }
            }
            throw new Error("Failed to find destination");
        }

        _onMove(e) {
            const {destination, source} = this._getMoveDestination(e);

            if (destination.type !== "folder") return;

            // Move the file/folder to that file/folder
            this._filesModel.moveFileOrFolder(source.path, `/${destination.path}`);
        }

        _addListeners() {
            new Sortable($(".gcode_files .scroll-wrapper")[0], {
                forceFallback: true,
                draggable: ".entry",
                sort: false,
                direction: "vertical",
                filter: ".btn",
                onEnd: (e) => {
                    this._onMove(e);
                }
            });
        }

        _storeUpdatedHeight(height) {
            this._settingsModel.settings.plugins.draggable_files.scrolled_expanded_height(
                height
            );
            this._settingsModel.saveData();
        }

        _applyStoredHeight(scroller) {
            scroller.style.height = `${this._settingsModel.settings.plugins.draggable_files.scrolled_expanded_height()}px`;
        }

        _setScrollerColor(scroller) {
            const scrollbarColor =
                window
                    .getComputedStyle(scroller, "::-webkit-scrollbar")
                    .getPropertyValue("background-color") || "rgb(241, 241, 241)";
            // Figure out whether this color is "dark"
            const [r, g, b] = scrollbarColor
                .split("(")[1]
                .split(")")[0]
                .split(",")
                .slice(0, 3)
                .map((color) => parseInt(color.trim(), 10));
            const isDark = Math.min(r, g, b) < 100;

            const gcodeFiles = $(".gcode_files")[0];
            if (isDark) {
                gcodeFiles.classList.add("dark");
            }
            const stylesheet = document.createElement("style");
            document.head.appendChild(stylesheet);
            stylesheet.sheet.addRule(
                ".gcode_files ::-webkit-resizer",
                `background-color: ${scrollbarColor}`
            );
        }

        _makeScrollerResizable() {
            const scroller = $(".gcode_files .scroll-wrapper")[0];
            this._setScrollerColor(scroller);
            scroller.style.resize = "vertical";
            this._applyStoredHeight(scroller);
            const observer = new MutationObserver((mutationList) => {
                for (const mutation of mutationList) {
                    if (mutation.type === "attributes") {
                        this._storeUpdatedHeight(scroller.style.height.split("px")[0]);
                    }
                }
            });
            observer.observe(scroller, {
                attributes: true,
                attributeFilter: ["style"]
            });
        }

        onUserLoggedIn(user) {
            this._user = user;
        }

        onAllBound() {
            this._addListeners();
            this._makeScrollerResizable();
        }
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: Draggable_filesViewModel,
        dependencies: ["filesViewModel", "settingsViewModel", "userSettingsViewModel"],
        elements: []
    });
});
