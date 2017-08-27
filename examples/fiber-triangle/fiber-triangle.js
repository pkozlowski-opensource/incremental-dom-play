function DotCmpt() {
  this.hover = false;
}

DotCmpt.prototype.hoverChange = function(isHovering) {
  cancelAnimationFrame(reqAnimationFrameId);
  this.hover = isHovering;
  hooverChanged = true;
  refresh();
  hooverChanged = false;
};

DotCmpt.prototype.render = function render(c, inputs) {
  var sz = 1.3 * 25;
  var self = this;

  var initalStyle = `
                width: ${sz}px;
                height: ${sz}px;
                left: ${inputs.x}px;
                top: ${inputs.y}px;
                border-radius: ${sz / 2}px;
                line-height: ${sz}px;
            `;

  c = elementStart(c, 0, 'div',
    {'class': 'dot', style: initalStyle},
    {styles: {'background': this.hover ? "#ff0" : "#61dafb"}}, {
      mouseenter: function() {
        self.hoverChange(true);
      },
      mouseleave: function() {
        self.hoverChange(false);
      }
    });

  c = text(c, 0, this.hover ? `**${inputs.seconds}**` : inputs.seconds);
  c = elementEnd(c);

  return c;
};

function triangle(c, inputs) {

  if (inputs.size <= 25) {

    c = component(c, 0, DotCmpt, {seconds: inputs.seconds, x: inputs.x - 12.5, y: inputs.y - 12.5});

  } else {
    var childSz = inputs.size / 2, half = childSz / 2;

    c = view(c, 1, triangle, {size: childSz, seconds: inputs.seconds, x: inputs.x, y: inputs.y - half});
    c = view(c, 2, triangle, {
      size: childSz,
      seconds: inputs.seconds,
      x: inputs.x - childSz,
      y: inputs.y + half
    });
    c = view(c, 3, triangle, {
      size: childSz,
      seconds: inputs.seconds,
      x: inputs.x + childSz,
      y: inputs.y + half
    });
  }

  return c;
}

function fiberTriangleApp(c, elapsed) {
  var seconds = Math.floor(elapsed / 1000) % 10 + 1;
  var t = elapsed / 1e3 % 10;

  var changeDots = previousSeconds !== seconds || hooverChanged;
  c = elementStart(c, 0, 'div', {'class': 'main'}, {styles: {transform: `scaleX(${(1 + (t > 5 ? 10 - t : t) / 10) / 2.1}) scaleY(0.7) translateZ(0.1px)`}});
  if (changeDots) {
    c = view(c, 0, triangle, {size: 1e3, seconds: seconds, x: 0, y: 0});
    previousSeconds = seconds;
  }
  c = elementEnd(c, !changeDots);

  return c;
}