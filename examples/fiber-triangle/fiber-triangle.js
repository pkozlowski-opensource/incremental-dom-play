function DotCmpt(renderer, viewNode) {
  this.renderer = renderer;
  this.viewNode = viewNode;
  this.hover = false;
}

DotCmpt.prototype.hoverChange = function(isHovering, seconds) {
  this.hover = isHovering;
  refreshView(this.renderer, this.viewNode, this, {seconds: seconds});
};

DotCmpt.prototype.render = function render(c, inputs) {
  var sz = 1.3 * 25;
  var self = this;
  var create = c.creationMode;

  var initalStyle = create ? `
                width: ${sz}px;
                height: ${sz}px;
                left: ${inputs.x}px;
                top: ${inputs.y}px;
                border-radius: ${sz / 2}px;
                line-height: ${sz}px;
            ` : '';

  c = elementStart(c, 0, 'div',
    create ? {'class': 'dot', style: initalStyle} : undefined,
    {styles: {'background': this.hover ? "#ff0" : "#61dafb"}}, create ? {
      mouseenter: function() {
        self.hoverChange(true, inputs.seconds);
      },
      mouseleave: function() {
        self.hoverChange(false, inputs.seconds);
      }
    } : undefined);

  c = text(c, 0, this.hover ? `**${inputs.seconds}**` : inputs.seconds);
  c = elementEnd(c);

  return c;
};

function TraingleCmpt() {
}

TraingleCmpt.prototype.render = function render(c, inputs) {

  if (inputs.size <= 25) {

    c = component(c, 0, DotCmpt, {seconds: inputs.seconds, x: inputs.x - 12.5, y: inputs.y - 12.5});

  } else {
    var childSz = inputs.size / 2, half = childSz / 2;

    c = component(c, 1, TraingleCmpt, {
      size: childSz,
      seconds: inputs.seconds,
      secondsChanged: inputs.secondsChanged,
      x: inputs.x,
      y: inputs.y - half
    });
    c = component(c, 2, TraingleCmpt, {
      size: childSz,
      seconds: inputs.seconds,
      secondsChanged: inputs.secondsChanged,
      x: inputs.x - childSz,
      y: inputs.y + half
    });
    c = component(c, 3, TraingleCmpt, {
      size: childSz,
      seconds: inputs.seconds,
      secondsChanged: inputs.secondsChanged,
      x: inputs.x + childSz,
      y: inputs.y + half
    });
  }

  return c;
};

TraingleCmpt.prototype.shouldUpdate = function shouldUpdate(inputs) {
  return inputs.secondsChanged;
};

function fiberTriangleApp(c, inputs) {
  var t = inputs.elapsed / 1e3 % 10;
  var transformStyle = `scaleX(${(1 + (t > 5 ? 10 - t : t) / 10) / 2.1}) scaleY(0.7) translateZ(0.1px)`;

  c = elementStart(c, 0, 'div', {'class': 'main'}, {styles: {transform: transformStyle, '-webkit-transform': transformStyle}});
        c = component(c, 0, TraingleCmpt, {size: 1e3, seconds: inputs.seconds, secondsChanged: inputs.secondsChanged, x: 0, y: 0});
  c = elementEnd(c);

  return c;
}