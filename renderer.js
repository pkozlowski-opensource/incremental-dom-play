function NoopRenderer() {}

NoopRenderer.prototype.createComment = function createComment(value) {
};

NoopRenderer.prototype.createElement = function createElement(value) {
};

NoopRenderer.prototype.createText = function createText(value) {
};

NoopRenderer.prototype.updateText = function createText(value) {
};

NoopRenderer.prototype.appendChild = function appendChild(parentNode, childNode) {
};

NoopRenderer.prototype.insertBefore = function insertBefore(refNode, newNode) {
};

NoopRenderer.prototype.removeNode = function removeNode(node) {
};

NoopRenderer.prototype.setProperty = function setProperty(node, propName, propValue) {
};


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
    if (propName.indexOf('style.') === 0) {
        node.style[propName.slice(6)] = propValue;
    } else {
        node[propName] = propValue;
    }
};