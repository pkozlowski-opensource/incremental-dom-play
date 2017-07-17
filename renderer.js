function DOMRenderer(document, rootEl) {
    this.document = document;
    this.rootEl = rootEl;
}

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

DOMRenderer.prototype.getRoot = function getRoot() {
    return this.rootEl;
};

DOMRenderer.prototype.insertBefore = function insertBefore(parentNode, refNode, newNode) {
    parentNode.insertBefore(newNode, refNode);
};

DOMRenderer.prototype.removeNode = function removeNode(parentNode, node) {
    parentNode.removeChild(node);
};

DOMRenderer.prototype.setAttribute = function setAttribute(node, attrName, attrValue) {
    node.setAttribute(attrName, attrValue);
};

DOMRenderer.prototype.setProperty = function setProperty(node, propName, propValue) {
    node[propName] = propValue;
};

DOMRenderer.prototype.setStyle = function setStyle(node, styleName, styleValue) {
    node.style[styleName] = styleValue;
};

DOMRenderer.prototype.addClass = function addClass(node, className) {
    node.classList.add(className);
};

DOMRenderer.prototype.removeClass = function addClass(node, className) {
    node.classList.remove(className);
};

DOMRenderer.prototype.addEventListener = function addEventListener(node, eventName, listenerFn) {
    node.addEventListener(eventName, listenerFn);
};