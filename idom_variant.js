function VDomCursor(renderer, vdom, currentIdx, parentCursor) {
    this.renderer = renderer;
    this.vdom = vdom ? vdom : [];
    this.currentIdx = currentIdx != null ? currentIdx : 0;
    this.parentCursor = parentCursor;
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
    if (startIdx < vdom.length) { //short-circuit => probably could skip this thing altogether in the creation mode
        for (var i = startIdx; i < vdom.length; i++) {
            if (vdom[i].id === id) {
                return i;
            }
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
            var events = Object.keys(eventHandlers);
            for (var i=0; i<events.length; i++) {
                nativeEl.addEventListener(events[i], eventHandlers[events[i]]);
            }
        }
    }

    return nativeEl;
}

function appendNativeEl(renderer, cursor, nativeEl) {
    // TODO: this will attatch things immediatelly to the DOM :-(
    if (cursor.parentCursor) {
        var parentEl = cursor.parentCursor.vdom[cursor.parentCursor.currentIdx -1];
        if (parentEl.type === '#view') {
            renderer.insertBefore(parentEl.nativeEl, nativeEl);
        } else {
            renderer.appendChild(parentEl.nativeEl, nativeEl);
        }
    } else {
        renderer.appendChild(renderer.rootEl, nativeEl);
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
    var elementIdx = advanceTo(cursor.vdom, cursor.currentIdx, elId);
    var node;

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
    return childrenEnd(viewFn(cursor, data)); // TODO: data and context for the view
}

function elementStart(cursor, elId, tagName, staticProps, props, eventHandlers) {
    cursor = element(cursor, elId, tagName, staticProps, props, eventHandlers);
    return childrenStart(cursor);
}

function childrenStart(cursor) {
    if (cursor.currentIdx) {
        var childrenIdx = cursor.currentIdx - 1;
        if (!cursor.vdom[childrenIdx].children) {
            cursor.vdom[childrenIdx].children = [];
        }
        return new VDomCursor(cursor.renderer, cursor.vdom[childrenIdx].children, 0, cursor);
    } else {
        // children attatched to the root
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

//TODO:
// - passing data around to view + tests
// - event handlers
// - need better asserts on VDOM so writing tests is easier
// - loops with a group of sibiling elements => loops need a view... => ng-content?
// - loops with stable sorting (keyed sorting)
// - map props (class, style, ...)
// - attrs - should be as simple as prefixing props with attr. => BTW, why Angular is making it so complex? Speed?
// - components (inputs, outputs, should the element stay in the DOM)

//IDEAS:
// - move "deleteNodes" to the cursor
// - I could have an array of function calls outside of JS blocks, I think
// - I could probably be skipping many comparison when I know that there are no bindings
// - I KNOW many things in the creation mode...
// - "static" blocks where I could totally skip comparisons (or even prun / not create the VDOM!)