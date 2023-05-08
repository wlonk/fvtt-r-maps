/*
 * canvas is global from Foundry
 * PIXI
 */

export function xyFromEvent(event) {
  return {
    x: event.data.destination.x,
    y: event.data.destination.y,
  };
}

export function xyInsideTargets({ x, y }) {
  return canvas.tokens.placeables.filter((obj) => {
    if ( !obj.visible ) { return false; }
    let c = obj.center;
    let ul = {
      x: obj.x,
      y: obj.y,
    };
    let lr = {
      x: obj.x + obj.width,
      y: obj.y + obj.height,
    };
    return Number.between(x, ul.x, lr.x) && Number.between(y, ul.y, lr.y);
  });
}

export class Line extends PIXI.Graphics {
  constructor({ x, y }) {
    super();
    this.style = {
      width: 5,
      color: '0xFFFFFF',
    };

    this.origin = { x, y };
    canvas.app.stage.addChild(this);
  }

  update({ x, y }) {
    this.clear();
    this.lineStyle(this.style.width, this.style.color);
    this.moveTo(this.origin.x, this.origin.y);
    this.lineTo(x, y);
  }
}

export function getEdgeGivenTwoNodes(fromNode, toNode) {
  // This is the most BRUTE FORCE way I could see to guarantee that the
  // bounding box and corners and lines all match up correctly. It works. It
  // could be improved.
  //
  // Calculate corners:
  const UL = { x: 0, y: 0 };
  const UR = { x: Math.abs(fromNode.x - toNode.x), y: 0 }
  const LL = { x: 0, y: Math.abs(fromNode.y - toNode.y) }
  const LR = { x: Math.abs(fromNode.x - toNode.x), y: Math.abs(fromNode.y - toNode.y) }

  // Find the corner we're starting in. We are therefore moving to the
  // opposite corner.
  let origin, destination;
  if (
    // UL:
    fromNode.x == Math.min(fromNode.x, toNode.x)
    && fromNode.y == Math.min(fromNode.y, toNode.y)
  ) {
    origin = UL;
    destination = LR;
  } else if (
    // UR:
    fromNode.x == Math.max(fromNode.x, toNode.x)
    && fromNode.y == Math.min(fromNode.y, toNode.y)
  ) {
    origin = UR
    destination = LL;
  } else if (
    // LL:
    fromNode.x == Math.min(fromNode.x, toNode.x)
    && fromNode.y == Math.max(fromNode.y, toNode.y)
  ) {
    origin = LL;
    destination = UR;
  } else if (
    // LR:
    fromNode.x == Math.max(fromNode.x, toNode.x)
    && fromNode.y == Math.max(fromNode.y, toNode.y)
  ) {
    origin = LR;
    destination = UL;
  }

  // Now just prep the Drawing object:
  return {
    x: Math.min(fromNode.x, toNode.x),
    y: Math.min(fromNode.y, toNode.y),
    shape: {
      type: foundry.data.ShapeData.TYPES.POLYGON,
      width: Math.abs(toNode.x - fromNode.x),
      height: Math.abs(toNode.y - fromNode.y),
      points: [
        origin.x, origin.y,
        destination.x, destination.y,
      ],
    },
    // All three must be set, or all three get reset:
    strokeWidth: 5,
    strokeAlpha: 1,
    strokeColor: "#ff0000",
  };
}
