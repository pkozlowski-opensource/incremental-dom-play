function VDomCursor(renderer, vdom, currentIdx, parentCursor, creationMode) {
    this.renderer = renderer;
    this.vdom = vdom ? vdom : [];
    this.currentIdx = currentIdx != null ? currentIdx : 0;
    this.parentCursor = parentCursor;
    this.creationMode = creationMode || false;
}

function VDomNode(id, nativeEl, type, value, props) {
    this.id = id;
    this.nativeEl = nativeEl;
    this.type = type;
    this.value = value;
    this.props = props;
    this.children = null;
}

function advanceTo(vdom, startIdx, id) {
    for (var i = startIdx; i <  vdom.length; i++) {
        if (vdom[i].id === id) {
            return i;
        }
    }
    return -1;
}

function deleteNodes(renderer, vdom, currentIdx, count) {
    var deletedEls = vdom.splice(currentIdx, count); // potential GC on subsequent executions
    var elToDelete;
    for (var i=0; i< deletedEls.length; i++) {
        elToDelete = deletedEls[i];
        if (elToDelete.type === '#view') {
            deleteNodes(renderer, elToDelete.children, 0, elToDelete.children.length);
        }
        renderer.removeNode(deletedEls[i].nativeEl);
    }
}

function setNativeProps(renderer, nativeEl, props) {
    var propNames = Object.keys(props);
    for (var i=0; i<propNames.length; i++) {
        renderer.setProperty(nativeEl, propNames[i], props[propNames[i]]);
    }
}

function registerEventHandlers(renderer, nativeEl, eventHandlers) {
    var events = Object.keys(eventHandlers);
    for (var i=0; i<events.length; i++) {
        renderer.addEventListener(nativeEl, events[i], eventHandlers[events[i]]);
    }
}

function createNativeEl(renderer, type, value, staticProps, props, eventHandlers) {
    var nativeEl;

    if (type === '#text') {
        nativeEl = renderer.createText(value);
    } else if (type === '#view') {
        nativeEl = renderer.createComment('view');
    } else {
        nativeEl = renderer.createElement(type);
        if (staticProps) {
            setNativeProps(renderer, nativeEl, staticProps);
        }
        if (props) {
            setNativeProps(renderer, nativeEl, props);
        }
        if (eventHandlers) {
            registerEventHandlers(renderer, nativeEl, eventHandlers);
        }
    }

    return nativeEl;
}

function appendNativeEl(renderer, cursor, nativeEl) {
    if (cursor.parentCursor) {
        var parentEl = cursor.parentCursor.vdom[cursor.parentCursor.currentIdx -1];
        if (parentEl.type === '#view') {
            renderer.insertBefore(parentEl.nativeEl, nativeEl);
        } else {
            renderer.appendChild(parentEl.nativeEl, nativeEl);
        }
    } else {
        renderer.appendChildToRoot(nativeEl);
    }
}

function createNode(cursor, elId, type, value, staticProps, props, eventHandlers) {
    var nativeEl = createNativeEl(cursor.renderer, type, value, staticProps, props, eventHandlers);
    appendNativeEl(cursor.renderer, cursor, nativeEl);

    cursor.vdom.splice(cursor.currentIdx, 0, new VDomNode(elId, nativeEl, type, value, props));
}

function updateNode(renderer, node, value, props) {
    // update value
    if (node.value !== value) {
        node.value = value;
        renderer.updateText(node.nativeEl, value);
    }

    // update props
    if (props) {
        // TODO: refactor to avoid forEach usage
        Object.keys(props).forEach(function(propKey) {
            if (node.props[propKey] !== props[propKey]) {
                node.props[propKey] = props[propKey];
                renderer.setProperty(node.nativeEl, propKey, props[propKey])
            }
        });
    }
}

function createOrUpdateNode(cursor, elId, type, value, staticProps, props, eventHandlers) {
    if (cursor.creationMode) {

       var nativeEl = createNativeEl(cursor.renderer, type, value, staticProps, props, eventHandlers);
       appendNativeEl(cursor.renderer, cursor, nativeEl);

       cursor.vdom.push(new VDomNode(elId, nativeEl, type, value, props));

    } else {

        var elementIdx = advanceTo(cursor.vdom, cursor.currentIdx, elId);

        if (elementIdx === -1) {
            //not found at the expected position => create
            createNode(cursor, elId, type, value, staticProps, props, eventHandlers);
        } else {
            // found: update
            updateNode(cursor.renderer, cursor.vdom[elementIdx], value, props);
        }

        if (elementIdx > cursor.currentIdx) {
            deleteNodes(cursor.renderer, cursor.vdom, cursor.currentIdx, elementIdx - cursor.currentIdx);
        }

    }

    cursor.currentIdx++;

    return cursor;
}


function text(cursor, elId, value) {
    return createOrUpdateNode(cursor, elId, '#text', value, null);
}


function element(cursor, elId, tagName, staticProps, props, eventHandlers) {
    return createOrUpdateNode(cursor, elId, tagName, null, staticProps, props, eventHandlers);
}

function view(cursor, elId, viewFn, data) {
    cursor = createOrUpdateNode(cursor, elId, '#view', null, null, null);
    cursor = childrenStart(cursor);
    return childrenEnd(viewFn(cursor, data));
}

function elementStart(cursor, elId, tagName, staticProps, props, eventHandlers) {
    return childrenStart(element(cursor, elId, tagName, staticProps, props, eventHandlers));
}

function childrenStart(cursor) {
    if (cursor.currentIdx) {
        var childrenIdx = cursor.currentIdx - 1;
        if (!cursor.vdom[childrenIdx].children) {
            cursor.vdom[childrenIdx].children = [];
        }
        return new VDomCursor(cursor.renderer, cursor.vdom[childrenIdx].children, 0, cursor, cursor.vdom[childrenIdx].children.length === 0);
    } else {
        // children attached to the root
        return cursor;
    }
}

function childrenEnd(cursor) {
    var parentCursor = cursor.parentCursor;

    if (cursor.vdom.length > cursor.currentIdx) {
        deleteNodes(cursor.renderer, cursor.vdom, cursor.currentIdx, cursor.vdom.length - cursor.currentIdx);
    }

    cursor.parentCursor = null;

    return parentCursor || cursor;
}

// alias
var elementEnd = childrenEnd;

function patch(cursor, cmptFn, data) {
    cursor.currentIdx = 0;

    cursor = cmptFn(cursor, data);

    if (cursor.vdom.length > cursor.currentIdx) {
        deleteNodes(cursor.renderer, cursor.vdom, cursor.currentIdx, cursor.vdom.length - cursor.currentIdx);
    }

    return cursor;
}

//TODO(IMPL):
// - tests for renderer interactions (remaining: event handlers, views)
// - need better asserts on VDOM so writing tests is easier
// - loops with a group of sibiling elements => loops need a view... => ng-content?
// - loops with stable sorting (keyed sorting)
// - map props (class, style, ...)
// - attrs - should be as simple as prefixing props with attr. => BTW, why Angular is making it so complex? Speed?
