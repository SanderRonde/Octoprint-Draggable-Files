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
            this._overrideFunction(this._filesModel, "_handleDragEnter", (...args) =>
                this._dragEnterHandler(...args)
            );
        }

        _overrideFunction(parent, fnName, target) {
            const original = parent[fnName].bind(parent);
            parent[fnName] = (...args) => target(original, ...args);
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

        _createPathFromTarget(target) {
            const fullPath = [];
            let current = target;
            while (current) {
                fullPath.push(current);
                current = current.parentNode;
            }
            return fullPath;
        }

        _getMoveDestination(e) {
            const {originalEvent} = e;
            const eventPath =
                originalEvent.path ||
                (originalEvent.composedPath && originalEvent.composedPath()) ||
                this._createPathFromTarget(originalEvent.target);
            for (let i = 0; i < eventPath.length; i++) {
                const element = eventPath[i];
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

            if (destination.type !== "folder" || destination.name === source.name) return;

            // Move the file/folder to that file/folder
            const move = this._filesModel.moveFileOrFolder(source.path, `/${destination.path}`);
            move.catch((xhr) => {
                new PNotify({
                    title: 'Failed to move',
                    text: `Failed to move file or folder. Error: ${xhr.responseJSON.error}`,
                    type: 'error',
                })
                // Refresh listeners
                this._addDragListener();
            });
        }

        _isMobile() {
            return (function (a) {
                return (
                    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                        a
                    ) ||
                    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                        a.substr(0, 4)
                    )
                );
            })(navigator.userAgent || navigator.vendor || window.opera);
        }

        _getHoverColor() {
            // Get a sample entry
            const entry = $(".gcode_files .scroll-wrapper .entry")[0];
            if (!entry) return null;

            // Loop through sheets
            let lastMatch = null;
            for (const sheet of document.styleSheets) {
                // Loop through rules
                for (const rule of sheet.cssRules) {
                    // Filter out non-css-page-rules
                    if (rule.type !== 1) continue;
                    /**
                     * @type {CSSPageRule}
                     */
                    const cssRule = rule;
                    if (cssRule.selectorText.includes(".entry:hover")) {
                        // We've got a potentially matching rule, check if it
                        // would match if hover was enabled
                        const nonHoverRule = cssRule.selectorText.replace(
                            ".entry:hover",
                            ".entry"
                        );
                        if (entry.matches(nonHoverRule)) {
                            // Yep it would match, this is the one
                            lastMatch = cssRule.style.backgroundColor;
                        }
                    }
                }
            }

            return lastMatch;
        }

        _scrollWrapper = $(".gcode_files .scroll-wrapper")[0];

        _listenedChildren = new WeakSet();
        /**
         * Makes sure the hover effect still shows up regardless
         * of the fact that we're using a different dragging
         * technique
         */
        _forceHoverEffect() {
            let hoverColor = this._getHoverColor();
            const observer = new MutationObserver(() => {
                if (!hoverColor) {
                    hoverColor = this._getHoverColor();
                }

                [...this._scrollWrapper.children].forEach((child) => {
                    if (this._listenedChildren.has(child)) return;
                    this._listenedChildren.add(child);

                    let dragEnterCount = 0;
                    child.addEventListener("dragenter", () => {
                        child.style.backgroundColor = hoverColor;
                        dragEnterCount++;
                    });
                    child.addEventListener("dragleave", () => {
                        dragEnterCount--;

                        if (dragEnterCount === 0) {
                            child.style.backgroundColor = "transparent";
                        }
                    });
                    child.addEventListener("dragend", () => {
                        dragEnterCount = 0;
                        child.style.backgroundColor = "transparent";
                    });
                });
            });
            observer.observe(this._scrollWrapper, {
                childList: true
            });
        }

        _dragEnterHandler(original, ...args) {
            original(...args);
        }

        _overrideDragEnter() {
            let dragDisabled = false;
            this._dragEnterHandler = (original, ...args) => {
                if (dragDisabled) return;
                original(...args);
            };

            this._scrollWrapper.addEventListener("mouseenter", () => {
                dragDisabled = true;
            });
            this._scrollWrapper.addEventListener("mouseleave", () => {
                dragDisabled = false;
            });
        }

        _addDragListener() {
            new Sortable1_13_0(this._scrollWrapper, {
                draggable: ".entry",
                sort: false,
                direction: "vertical",
                filter: ".btn",
                onEnd: (e) => {
                    this._onMove(e);
                }
            });
        }

        _addListeners() {
            if (!this._isMobile()) {
                this._forceHoverEffect();
                this._overrideDragEnter();
                this._addDragListener();
            }
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
            this._setScrollerColor(this._scrollWrapper);
            this._scrollWrapper.style.resize = "vertical";
            this._applyStoredHeight(this._scrollWrapper);
            const observer = new MutationObserver((mutationList) => {
                for (const mutation of mutationList) {
                    if (mutation.type === "attributes") {
                        this._storeUpdatedHeight(
                            this._scrollWrapper.style.height.split("px")[0]
                        );
                    }
                }
            });
            observer.observe(this._scrollWrapper, {
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
