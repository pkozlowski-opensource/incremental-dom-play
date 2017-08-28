function VDomCursor(renderer, vdom, parentCursor, creationMode) {
    this.renderer = renderer;
    this.vdom = vdom || [];
    this.currentIdx = 0;
    this.parentCursor = parentCursor;
    this.creationMode = creationMode || false;
    this.parentNativeEl = findParentNativeEl(this);
}

function VDomNode(id, nativeEl, type, value, bindings, cmpt) {
    this.id = id;
    this.type = type;
    this.value = value;
    this.bindings = bindings;
    this.cmpt = cmpt;
    this.children = [];
    this.nativeEl = nativeEl;
}

function ViewFnCmpt() {}

function createCmptInstance(viewFnOrCmptCtror) {
    var inst;
    if (viewFnOrCmptCtror.prototype && viewFnOrCmptCtror.prototype.render) {
        inst = new viewFnOrCmptCtror();
    } else {
        inst = new ViewFnCmpt();
        inst.constructor = viewFnOrCmptCtror;
        inst.render = viewFnOrCmptCtror;
    }
    return inst;
}

function advanceTo(vdom, startIdx, id) {
    for (var i = startIdx; i < vdom.length; i++) {
        if (vdom[i].id === id) {
            return i;
        }
    }
    return -1;
}

function deleteNodes(renderer, parentNativeEl, vdom, currentIdx, count) {
    var deletedEls = vdom.splice(currentIdx, count); // potential GC on subsequent executions
    var len = deletedEls.length;
    var elToDelete;

    while (len--) {
        elToDelete = deletedEls[len];

        if (elToDelete.type === "#view") {
            deleteNodes(renderer, parentNativeEl, elToDelete.children, 0, elToDelete.children.length);
        } else {
            renderer.removeNode(parentNativeEl, elToDelete.nativeEl);
        }
    }
}

function setNativeAttrs(renderer, nativeEl, attrs) {
    var attrNames = Object.keys(attrs);
    var len = attrNames.length;
    var attrName;

    for (var i = 0; i < len; i++) {
        attrName = attrNames[i];
        renderer.setAttribute(nativeEl, attrName, attrs[attrName]);
    }
}

function registerEventHandlers(renderer, nativeEl, eventHandlers) {
    var events = Object.keys(eventHandlers);
    var len = events.length;

    for (var i = 0; i < len; i++) {
        renderer.addEventListener(nativeEl, events[i], eventHandlers[events[i]]);
    }
}

function findParentNativeEl(cursor) {
    var parentCursor;

    while ((parentCursor = cursor.parentCursor)) {
        var parentEl = parentCursor.vdom[parentCursor.currentIdx - 1];
        if (parentEl.type === "#view") {
            cursor = parentCursor;
        } else {
            return parentEl.nativeEl;
        }
    }

    return cursor.renderer.getRoot();
}

function findSibilingNativeEl(cursor) {
    for (var i = cursor.currentIdx; i < cursor.vdom.length; i++) {
        if (cursor.vdom[i].type !== "#view") {
            return cursor.vdom[i].nativeEl;
        }
    }

    return null;
}

function appendNativeEl(cursor, nativeEl) {
    if (cursor.creationMode || !cursor.parentCursor) {
        cursor.renderer.appendChild(cursor.parentNativeEl, nativeEl);
    } else {
        var parentEl = cursor.parentCursor.vdom[cursor.parentCursor.currentIdx - 1];
        if (parentEl.type === "#view") {
            var sibilingEl = findSibilingNativeEl(cursor);
            if (sibilingEl) {
                cursor.renderer.insertBefore(cursor.parentNativeEl, sibilingEl, nativeEl);
            } else {
                cursor.renderer.appendChild(cursor.parentNativeEl, nativeEl);
            }
        } else {
            cursor.renderer.appendChild(cursor.parentNativeEl, nativeEl);
        }
    }

    return nativeEl;
}

function createTextVNode(cursor, elId, value) {
    var nativeEl = appendNativeEl(cursor, cursor.renderer.createText(value));
    return new VDomNode(elId, nativeEl, "#text", value, undefined, undefined);
}

function text(cursor, elId, value) {
    if (cursor.creationMode) {
        cursor.vdom[cursor.vdom.length] = createTextVNode(cursor, elId, value);
    } else {
        var elementIdx = advanceTo(cursor.vdom, cursor.currentIdx, elId);

        if (elementIdx === -1) {
            //not found at the expected position => create
            cursor.vdom.splice(cursor.currentIdx, 0, createTextVNode(cursor, elId, value));
        } else {
            // found: update
            var vDomNode = cursor.vdom[elementIdx];
            if (vDomNode.value !== value) {
                vDomNode.value = value;
                cursor.renderer.updateText(vDomNode.nativeEl, value);
            }
        }

        if (elementIdx > cursor.currentIdx) {
            deleteNodes(cursor.renderer, cursor.parentNativeEl, cursor.vdom, cursor.currentIdx, elementIdx - cursor.currentIdx);
        }
    }

    cursor.currentIdx++;

    return cursor;
}

function createElementVNode(cursor, elId, tagName, attrs, bindings, eventHandlers) {
    var nativeEl = cursor.renderer.createElement(tagName);

    if (attrs != null) {
        setNativeAttrs(cursor.renderer, nativeEl, attrs);
    }
    if (bindings) {
        if (bindings.classes) {
            var classNames = Object.keys(bindings.classes);
            var len = classNames.length;
            var className, classValue;

            for (var i = 0; i < len; i++) {
                className = classNames[i];
                classValue = bindings.classes[className];
                if (classValue) {
                    cursor.renderer.addClass(nativeEl, className);
                }
            }
        }

        if (bindings.styles) {
            var names = Object.keys(bindings.styles);
            var len = names.length;
            var name;

            for (var i = 0; i < len; i++) {
                name = names[i];
                cursor.renderer.setStyle(nativeEl, name, bindings.styles[name]);
            }
        }

        if (bindings.props) {
            var names = Object.keys(bindings.props);
            var len = names.length;
            var name;

            for (var i = 0; i < len; i++) {
                name = names[i];
                cursor.renderer.setProperty(nativeEl, name, bindings.props[name]);
            }
        }

        if (bindings.attrs) {
            var names = Object.keys(bindings.attrs);
            var len = names.length;
            var name, value;

            for (var i = 0; i < len; i++) {
                name = names[i];
                value = bindings.attrs[name];
                if (value != null) {
                    cursor.renderer.setAttribute(nativeEl, name, value);
                }
            }
        }
    }
    if (eventHandlers != null) {
        registerEventHandlers(cursor.renderer, nativeEl, eventHandlers);
    }
    appendNativeEl(cursor, nativeEl);

    return new VDomNode(elId, nativeEl, tagName, undefined, bindings, undefined);
}

function element(cursor, elId, tagName, attrs, bindings, eventHandlers) {
    if (cursor.creationMode) {
        cursor.vdom[cursor.vdom.length] = createElementVNode(cursor, elId, tagName, attrs, bindings, eventHandlers);
    } else {
        var elementIdx = advanceTo(cursor.vdom, cursor.currentIdx, elId);

        if (elementIdx === -1) {
            cursor.vdom.splice(cursor.currentIdx, 0, createElementVNode(cursor, elId, tagName, attrs, bindings, eventHandlers));
        } else {
            // found: update
            var vDomNode = cursor.vdom[elementIdx];
            if (bindings) {
                if (bindings.classes) {
                    var classNames = Object.keys(bindings.classes);
                    var len = classNames.length;
                    var className, classValue;

                    for (var i = 0; i < len; i++) {
                        className = classNames[i];

                        classValue = bindings.classes[className];
                        if (vDomNode.bindings.classes[className] !== classValue) {
                            vDomNode.bindings.classes[className] = classValue;
                            if (classValue) {
                                cursor.renderer.addClass(vDomNode.nativeEl, className);
                            } else {
                                cursor.renderer.removeClass(vDomNode.nativeEl, className);
                            }
                        }
                    }
                }

                if (bindings.styles) {
                    var names = Object.keys(bindings.styles);
                    var len = names.length;
                    var name, value;

                    for (var i = 0; i < len; i++) {
                        name = names[i];

                        value = bindings.styles[name];
                        if (vDomNode.bindings.styles[name] !== value) {
                            vDomNode.bindings.styles[name] = value;
                            cursor.renderer.setStyle(vDomNode.nativeEl, name, value);
                        }
                    }
                }

                if (bindings.props) {
                    var names = Object.keys(bindings.props);
                    var len = names.length;
                    var name, value;

                    for (var i = 0; i < len; i++) {
                        name = names[i];

                        value = bindings.props[name];
                        if (vDomNode.bindings.props[name] !== value) {
                            vDomNode.bindings.props[name] = value;
                            cursor.renderer.setProperty(vDomNode.nativeEl, name, value);
                        }
                    }
                }

                if (bindings.attrs) {
                    var names = Object.keys(bindings.attrs);
                    var len = names.length;
                    var name, value;

                    for (var i = 0; i < len; i++) {
                        name = names[i];
                        value = bindings.attrs[name];
                        if (vDomNode.bindings.attrs[name] != value) {
                            vDomNode.bindings.attrs[name] != value;
                            if (value != null) {
                                cursor.renderer.setAttribute(vDomNode.nativeEl, name, value);
                            } else {
                                cursor.renderer.removeAttribute(vDomNode.nativeEl, name);
                            }
                        }
                    }
                }
            }
        }

        if (elementIdx > cursor.currentIdx) {
            deleteNodes(cursor.renderer, cursor.parentNativeEl, cursor.vdom, cursor.currentIdx, elementIdx - cursor.currentIdx);
        }
    }

    cursor.currentIdx++;
    return cursor;
}

function createViewVDomNode(cursor, elId, cmpt) {
    return new VDomNode(elId, undefined, "#view", undefined, undefined, cmpt);
}

function view(cursor, elId, viewFn, data) {
    return component(cursor, elId, viewFn, data);
}

function component(cursor, elId, componentClass, inputs) {
    var mustUpdate = false;
    var cmptInstance;

    if (cursor.creationMode) {
        cursor.vdom[cursor.vdom.length] = createViewVDomNode(cursor, elId, (cmptInstance = createCmptInstance(componentClass)));
        mustUpdate = true;
    } else {
        var elementIdx = advanceTo(cursor.vdom, cursor.currentIdx, elId);

        if (elementIdx === -1) {
            //not found at the expected position => create
            cursor.vdom.splice(cursor.currentIdx, 0, createViewVDomNode(cursor, elId, (cmptInstance = createCmptInstance(componentClass))));
            mustUpdate = true;
        } else {
            var vdomNode = cursor.vdom[elementIdx];
            cmptInstance = cursor.vdom[elementIdx].cmpt;

            if (vdomNode.cmpt.constructor !== componentClass) {
                deleteNodes(cursor.renderer, cursor.parentNativeEl, vdomNode.children, 0, vdomNode.children.length);
                cmptInstance = createCmptInstance(componentClass);
                cursor.vdom[elementIdx].cmpt = cmptInstance;
                mustUpdate = true;
            }
        }

        if (elementIdx > cursor.currentIdx) {
            deleteNodes(cursor.renderer, cursor.parentNativeEl, cursor.vdom, cursor.currentIdx, elementIdx - cursor.currentIdx);
        }
    }

    cursor.currentIdx++;

    var willCallRenderFn = mustUpdate || (cmptInstance.shouldUpdate ? cmptInstance.shouldUpdate(inputs) : true);
    if (willCallRenderFn) {
        cursor = childrenStart(cursor);
        return childrenEnd(cmptInstance.render(cursor, inputs));
    } else {
        return cursor;
    }
}

function elementStart(cursor, elId, tagName, staticProps, props, eventHandlers) {
    return childrenStart(element(cursor, elId, tagName, staticProps, props, eventHandlers));
}

function childrenStart(cursor) {
    var children = cursor.vdom[cursor.currentIdx - 1].children;
    return new VDomCursor(cursor.renderer, children, cursor, children.length === 0);
}

function childrenEnd(cursor) {
    var parentCursor = cursor.parentCursor;

    if (cursor.vdom.length > cursor.currentIdx) {
        deleteNodes(cursor.renderer, cursor.parentNativeEl, cursor.vdom, cursor.currentIdx, cursor.vdom.length - cursor.currentIdx);
    }

    cursor.parentCursor = undefined;

    return parentCursor || cursor;
}

// alias
var elementEnd = childrenEnd;

function patch(cursor, cmptFn, data) {
    cursor.currentIdx = 0;
    cursor.parentNativeEl = cursor.renderer.getRoot();

    cursor = cmptFn(cursor, data);

    if (cursor.vdom.length > cursor.currentIdx) {
        deleteNodes(cursor.renderer, cursor.parentNativeEl, cursor.vdom, cursor.currentIdx, cursor.vdom.length - cursor.currentIdx);
    }

    return cursor;
}
