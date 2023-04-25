/* * /
 * Recalculate lines on:
 * Token:
 * _onDragLeftDrop
 * _onHandleDragDrop
 * Create lines on:
*/

/*
 * We use graph theory terminology here (nodes, edges), so as to not collide
 * with all the other possible terms that already mean things in Foundry.
 */

// ============== core.js
class RMaps {
  static ID = 'fvtt-r-maps';

  static FLAGS = {
    EDGES: 'r-maps-edges',
    EDGE_TOOL: 'drawEdge',
  }

  static TEMPLATES = {
    EDGE: `modules/${this.ID}/templates/r-map-edge.hbs`,
  }

  static state = {
    originToken: null,
    pixiLine: null,
  }

  static onGetSceneControlButtons(buttons) {
    const tokenTools = buttons.find((b) => b.name === 'token')?.tools
    tokenTools?.push({
      name: 'drawEdge',
      title: 'Draw a connection',
      icon: 'fas fa-chart-network',
    });
  }
}

class RMapEdgeData {
  static get allEdges() {
    const allEdges = (canvas?.scene.tokens || []).reduce((accumulator, token) => {
      const tokenEdges = this.getEdgesForToken(token.id);

      return {
        ...accumulator,
        ...tokenEdges,
      };
    }, {});

    return allEdges;
  }

  static getEdgesForToken(tokenId) {
    return canvas?.scene.tokens.get(tokenId)?.getFlag(RMaps.ID, RMaps.FLAGS.EDGES) || {};
  }

  static async createEdge(tokenId, edgeData) {
    /*
     * edgeData: {
     *   'to': TokenID,
     *   'label': Text,
     *   'style': {
     *     // 'color': Color,
     *     // 'fromEnd': 'flat',
     *     // 'toEnd': 'flat',
     *     // eventually more here
     *   }
     * }
     */
    const newEdge = {
      ...edgeData,
      fromId: tokenId,
      id: foundry.utils.randomID(16),
    };
    const newEdges = {
      [newEdge.id]: newEdge
    };
    await canvas?.scene.tokens.get(tokenId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, newEdges);
    return newEdge.id;
  }

  static updateEdge(edgeId, updateData) {
    /* * /
    const relevantEdge = this.allEdges[edgeId];
    const update = {
      [edgeId]: updateData
    };
    return canvas?.scene.tokens.get(relevantEdge.fromId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, update);
    /* */
  }

  static deleteEdge(edgeId) {
    const relevantEdge = this.allEdges[edgeId];
    // Foundry specific syntax required to delete a key from a persisted object
    // in the database
    const keyDeletion = {
      [`-=${edgeId}`]: null
    };
    return canvas?.scene.tokens
      .get(relevantEdge.fromId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, keyDeletion);
  }

  // This pertains to Drawings:
  static async updateEdgeDrawingsForToken(tokenId) {
    /* Temporarily commented out. * /
    // Inbound edges:
    const inbound = Object.values(this.allEdges).filter(
      (edge) => edge.to === tokenId
    ).map((edge) => {
      const { drawingId } = edge;
      const drawing = canvas.scene.drawings.get(drawingId);

      const fromNode = canvas.scene.tokens.get(edge.fromId).object.center;
      const toNode = canvas.scene.tokens.get(edge.to).object.center;

      const newEdge = getEdgeGivenTwoNodes(fromNode, toNode);
      return {
        _id: drawingId,
        ...newEdge,
      };
    });
    // Outbound edges:
    const outbound = Object.values(
      this.getEdgesForToken(tokenId)
    ).map((edge) => {
      const { drawingId } = edge;
      const drawing = canvas.scene.drawings.get(drawingId);

      const fromNode = canvas.scene.tokens.get(tokenId).object.center;
      const toNode = canvas.scene.tokens.get(edge.to).object.center;

      const newEdge = getEdgeGivenTwoNodes(fromNode, toNode);
      return {
        _id: drawingId,
        ...newEdge,
      };
    });
    const updates = await canvas.scene.updateEmbeddedDocuments('Drawing', [...inbound, ...outbound])
    return updates;
    /* */
  }

  // This pertains to Drawings:
  static async drawEdge(edgeId) {
    /* Temporarily commented out. * /
    const relevantEdge = this.allEdges[edgeId];
    const fromNode = canvas?.scene.tokens.get(relevantEdge.fromId)._object.center;
    const toNode = canvas?.scene.tokens.get(relevantEdge.to)._object.center;

    const edge = getEdgeGivenTwoNodes(fromNode, toNode);
    edge.shape.type = foundry.data.ShapeData.TYPES.POLYGON;

    const [ drawing ] = await canvas.scene.createEmbeddedDocuments('Drawing', [edge]);
    this.updateEdge(edgeId, { drawingId: drawing._id });
    return drawing;
    /* */
  }
}

// ============== canvas-utils.js
function xyFromEvent(event) {
  return {
    x: event.data.destination.x,
    y: event.data.destination.y,
  };
}

function xyInsideTargets({ x, y }) {
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

class Line extends PIXI.Graphics {
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

function getEdgeGivenTwoNodes(fromNode, toNode) {
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
      width: Math.abs(toNode.x - fromNode.x),
      height: Math.abs(toNode.y - fromNode.y),
      points: [
        origin.x, origin.y,
        destination.x, destination.y,
      ],
    },
  };
}


// ============== hooks.js
// Inject tool into Tokens controls
Hooks.on('getSceneControlButtons', (buttons) => {
	RMaps.onGetSceneControlButtons(buttons);
});

Hooks.on('libWrapper.Ready', () => {
  // Reset all the wrappers for this module:
  libWrapper.unregister_all(RMaps.ID);

  // TODO: this currently won't fire if you start inside a token?
  libWrapper.register(RMaps.ID, 'TokenLayer.prototype._onDragLeftStart', (wrapped, event) => {
    wrapped(event);
    if (
      game.activeTool === RMaps.FLAGS.EDGE_TOOL
      && canvas.tokens.controlledObjects.size === 1
    ) {
      // Ugly hack to get one-and-only-one thing from a Map:
      const [ _, originToken ] = canvas.tokens.controlledObjects.entries().next().value;
      RMaps.state.originToken = originToken;
      const pixiLine = RMaps.state.pixiLine = new Line(originToken.center);
      const spot = xyFromEvent(event);
      pixiLine.update(spot);
    }
  }, 'WRAPPER');

  libWrapper.register(RMaps.ID, 'TokenLayer.prototype._onDragLeftMove', (wrapped, event) => {
    wrapped(event);
    if (
      game.activeTool === RMaps.FLAGS.EDGE_TOOL
      && canvas.tokens.controlledObjects.size === 1
    ) {
      const spot = xyFromEvent(event);
      const pixiLine = RMaps.state.pixiLine;
      pixiLine.update(spot);
    }
  }, 'WRAPPER');

  // ...Cancel ? How do you even cancel a Drag-and-Drop?

  libWrapper.register(RMaps.ID, 'TokenLayer.prototype._onDragLeftDrop', async (wrapped, event) => {
    wrapped(event);
    if (
      game.activeTool === RMaps.FLAGS.EDGE_TOOL
      && canvas.tokens.controlledObjects.size === 1
    ) {
      // Find if we picked a token:
      const spot = xyFromEvent(event);
      const targets = xyInsideTargets(spot);
      if (targets.length === 1) {
        // We have a winner.
        const target = targets[0];
        const edgeId = await RMapEdgeData.createEdge(RMaps.state.originToken.id, { to: target.id });
        RMapEdgeData.drawEdge(edgeId);
      }
      // Clean up:
      RMaps.state.pixiLine.clear();
      RMaps.state.pixiLine = null;
    }
  }, 'WRAPPER');

  // TODO: somehow this is triggering something else that's drawing the edges?
  libWrapper.register(RMaps.ID, 'Token.prototype._onUpdate', (wrapped, event, ...args) => {
    wrapped(event, ...args);
    const keys = Object.keys(foundry.utils.flattenObject(event));
    const changed = new Set(keys);
    const positionChange = ["x", "y"].some(c => changed.has(c));
    const shapeChange = ["width", "height"].some(k => changed.has(k));
    if (positionChange || shapeChange) {
      const { _id } = event;
      RMapEdgeData.updateEdgeDrawingsForToken(_id);
    }
  }, 'WRAPPER');

  // TODO: if drawing edge is deleted, remove edge from edge DB flags
});

// ============== todo.md
// These might be handled by Advanced Drawing Tools:
//     TODO: add labels on edges
//     TODO: colour and style
// TODO: support adding intermediate control points and getting bezier-y?
//          Maybe this is done with the Advanced Drawing Tools mod?
// TODO: add endcap arrows
//          Maybe this is done with the Advanced Drawing Tools mod?
//
// TODO: permissions stuff is weird?
// TODO: break this into modular JS
// TODO: write unit tests. Quench?
