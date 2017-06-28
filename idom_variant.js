function VDomCursor(renderer, vdom, parentCursor, creationMode) {
    this.renderer = renderer;
    this.vdom = vdom || [];
    this.currentIdx = 0;
    this.parentCursor = parentCursor;
    this.creationMode = creationMode || false;
}

function VDomNode(id, nativeEl, type, value, props) {
    this.id = id;
    this.type = type;
    this.value = value;
    this.props = props;
    this.children = [];
    this.nativeEl = nativeEl;
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
    var len = propNames.length;
    var propName;

    for (var i = 0; i < len; i++) {
        propName = propNames[i];
        renderer.setProperty(nativeEl, propName, props[propName]);
    }
}

function registerEventHandlers(renderer, nativeEl, eventHandlers) {
    var events = Object.keys(eventHandlers);
    var len = events.length;

    for (var i = 0; i < len; i++) {
      renderer.addEventListener(nativeEl, events[i], eventHandlers[events[i]]);
    }
}

function appendNativeEl(cursor, nativeEl) {
    if (cursor.parentCursor) {
        var parentEl = cursor.parentCursor.vdom[cursor.parentCursor.currentIdx -1];
        if (parentEl.type === '#view') {
            cursor.renderer.insertBefore(parentEl.nativeEl, nativeEl);
        } else {
            cursor.renderer.appendChild(parentEl.nativeEl, nativeEl);
        }
    } else {
        cursor.renderer.appendChildToRoot(nativeEl);
    }

    return nativeEl;
}

function createTextVNode(cursor, elId, value) {
  var nativeEl = appendNativeEl(cursor, cursor.renderer.createText(value));
  return new VDomNode(elId, nativeEl, "#text", value, undefined);
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
          deleteNodes(cursor.renderer, cursor.vdom, cursor.currentIdx, elementIdx - cursor.currentIdx);
      }
    }

    cursor.currentIdx++;

    return cursor;
}

function createElementVNode(cursor, elId, tagName, staticProps, props, eventHandlers) {
  var nativeEl = cursor.renderer.createElement(tagName);

  if (staticProps != null) {
     setNativeProps(cursor.renderer, nativeEl, staticProps);
  }
  if (props != null) {
      setNativeProps(cursor.renderer, nativeEl, props);
  }
  if (eventHandlers != null) {
      registerEventHandlers(cursor.renderer, nativeEl, eventHandlers);
  }
  appendNativeEl(cursor, nativeEl);

  return new VDomNode(elId, nativeEl, tagName, undefined, props);
}

function element(cursor, elId, tagName, staticProps, props, eventHandlers) {
    if (cursor.creationMode) {

      cursor.vdom[cursor.vdom.length] = createElementVNode(cursor, elId, tagName, staticProps, props, eventHandlers);

    } else {

      var elementIdx = advanceTo(cursor.vdom, cursor.currentIdx, elId);

      if (elementIdx === -1) {
          cursor.vdom.splice(cursor.currentIdx, 0, createElementVNode(cursor, elId, tagName, staticProps, props, eventHandlers));

      } else {
        // found: update
        var vDomNode = cursor.vdom[elementIdx];
        if (props) {
            var propNames = Object.keys(props);
            var len = propNames.length;
            var propKey, propValue;

            for (var i=0; i<len; i++) {
                propKey = propNames[i];
                propValue = props[propKey];
                if (vDomNode.props[propKey] !== propValue) {
                    vDomNode.props[propKey] = propValue;
                    cursor.renderer.setProperty(vDomNode.nativeEl, propKey, propValue)
                }
            }
        }
      }

      if (elementIdx > cursor.currentIdx) {
          deleteNodes(cursor.renderer, cursor.vdom, cursor.currentIdx, elementIdx - cursor.currentIdx);
      }

    }

    cursor.currentIdx++;
    return cursor;
}

function createViewVDomNode(cursor, elId, viewFn, data) {
  var nativeEl = appendNativeEl(cursor, cursor.renderer.createComment('view'));
  return new VDomNode(elId, nativeEl, "#view", undefined, undefined);
}

function view(cursor, elId, viewFn, data) {
    if (cursor.creationMode) {

      cursor.vdom[cursor.vdom.length] = createViewVDomNode(cursor, elId, viewFn, data);

    } else {

      var elementIdx = advanceTo(cursor.vdom, cursor.currentIdx, elId);

      if (elementIdx === -1) {
        //not found at the expected position => create
        cursor.vdom.splice(cursor.currentIdx, 0, createViewVDomNode(cursor, elId, viewFn, data));
      }

      //no update for views - for now!
      //ideas:
      //- "OnPush"
      //- allow swapping viewFn

      if (elementIdx > cursor.currentIdx) {
          deleteNodes(cursor.renderer, cursor.vdom, cursor.currentIdx, elementIdx - cursor.currentIdx);
      }
    }

    cursor.currentIdx++;

    cursor = childrenStart(cursor);
    return childrenEnd(viewFn(cursor, data));
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
        deleteNodes(cursor.renderer, cursor.vdom, cursor.currentIdx, cursor.vdom.length - cursor.currentIdx);
    }

    cursor.parentCursor = undefined;

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
// - refactor code around root node
// - tests for renderer interactions (remaining: event handlers, views)
// - need better asserts on VDOM so writing tests is easier
// - loops with a group of sibiling elements => loops need a view... => ng-content?
// - loops with stable sorting (keyed sorting)
// - map props (class, style, ...)
// - attrs - should be as simple as prefixing props with attr. => BTW, why Angular is making it so complex? Speed?
