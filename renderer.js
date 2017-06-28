function DOMRenderer(document, rootEl) {
    this.document = document;
    this.rootEl = rootEl;
}

DOMRenderer.prototype.createComment = function createComment(data) {
    return this.document.createComment(data);
};

DOMRenderer.prototype.createElement = function createElement(tagName) {
    return this.document.createElement(tagName);
};

DOMRenderer.prototype.createText = function createText(value) {
    return this.document.createTextNode(value);
};

DOMRenderer.prototype.updateText = function updateText(node, value) {
    node.nodeValue = value;
};

DOMRenderer.prototype.appendChild = function appendChild(parentNode, childNode) {
    parentNode.appendChild(childNode);
};

DOMRenderer.prototype.appendChildToRoot = function appendChild(childNode) {
    this.appendChild(this.rootEl, childNode);
};

DOMRenderer.prototype.insertBefore = function insertBefore(refNode, newNode) {
    // I could look it up in the VDOM if needed
    refNode.parentNode.insertBefore(newNode, refNode);
};

DOMRenderer.prototype.removeNode = function removeNode(node) {
    var parentNode = node.parentNode;
    if (parentNode) {
        parentNode.removeChild(node);
    }
};

DOMRenderer.prototype.setProperty = function setProperty(node, propName, propValue) {
    if (propName.charCodeAt(5) === 46) {
        node.style[propName.slice(6)] = propValue;
    } else {
        node[propName] = propValue;
    }
};

DOMRenderer.prototype.addEventListener = function addEventListener(node, eventName, listenerFn) {
    node.addEventListener(eventName, listenerFn);
};