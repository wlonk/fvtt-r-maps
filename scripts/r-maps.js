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

class RMapToolsLayer extends InteractionLayer {
	constructor() {
		super();
		console.log('R-Maps | Loaded into canvas');
	}

	activate() {
		super.activate();
		console.log('R-Maps | Activated');
		return this;
	}

	deactivate() {
		super.deactivate();
		console.log('R-Maps | Deactivated');
		return this;
	}

	async draw() {
		await super.draw();
		console.log('R-Maps | Drawing');
		return this;
	}

	async tearDown() {
		await super.tearDown();
		console.log('R-Maps | Tearing down!');
		return this;
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

  static getInboundEdgesForToken(tokenId) {
    const inboundEdges = Object.keys(this.allEdges).filter(
      (key) => this.allEdges[key].to === tokenId
    );
    return inboundEdges.reduce((accumulator, edgeId) => {
      const tokenEdge = this.allEdges[edgeId];

      return {
        ...accumulator,
        [edgeId]: tokenEdge,
      };
    }, {});
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
    const relevantEdge = this.allEdges[edgeId];
    const update = {
      [edgeId]: updateData
    };
    return canvas?.scene.tokens.get(relevantEdge.fromId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, update);
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

  // TODO: this doesn't need to clear and redraw; we can redraw in-situ and
  // save any styling.
  static clearEdgeDrawingsForToken(tokenId) {
    const inboundEdges = Object.keys(this.allEdges).filter(
      (key) => this.allEdges[key].to === tokenId
    );
    const outboundEdges = Object.keys(this.getEdgesForToken(tokenId));
    [...outboundEdges, ...inboundEdges].forEach(async (edgeId) => {
      const edge = this.allEdges[edgeId];
      if (edge.drawing) {
        canvas?.drawings.get(edge.drawing).document.delete();
        await this.updateEdge(edgeId, { drawing: null });
      }
    });
  }

  static drawEdgesForToken(tokenId) {
    const inboundEdges = Object.keys(this.allEdges).filter(
      (key) => this.allEdges[key].to === tokenId
    );
    const outboundEdges = Object.keys(this.getEdgesForToken(tokenId));
    [...outboundEdges, ...inboundEdges].forEach((edgeId) => {
      this.drawEdge(edgeId);
    });
  }

  static async drawEdge(edgeId) {
    const relevantEdge = this.allEdges[edgeId];
    const fromNode = canvas?.scene.tokens.get(relevantEdge.fromId)._object.center;
    const toNode = canvas?.scene.tokens.get(relevantEdge.to)._object.center;

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
    const edge = {
      x: Math.min(fromNode.x, toNode.x),
      y: Math.min(fromNode.y, toNode.y),
      shape: {
        width: Math.abs(toNode.x - fromNode.x),
        height: Math.abs(toNode.y - fromNode.y),
        type: foundry.data.ShapeData.TYPES.POLYGON,
        points: [
          origin.x, origin.y,
          destination.x, destination.y,
        ],
      },
      // TODO: colour and style
    };

    const [ drawing ] = await canvas.scene.createEmbeddedDocuments('Drawing', [edge]);
    this.updateEdge(edgeId, { drawing: drawing._id });
    return drawing;
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


// ============== hooks.js
// Inject tool into Tokens controls
Hooks.on('getSceneControlButtons', (buttons) => {
	RMaps.onGetSceneControlButtons(buttons);
});

// TODO: add drag-to-draw functionality
Hooks.on('libWrapper.Ready', () => {
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
    const spot = xyFromEvent(event);
    const pixiLine = RMaps.state.pixiLine;
    pixiLine.update(spot);
  }, 'WRAPPER');

  // ...Cancel ? How do you even cancel a Drag-and-Drop?

  libWrapper.register(RMaps.ID, 'TokenLayer.prototype._onDragLeftDrop', async (wrapped, event) => {
    wrapped(event);
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
  }, 'WRAPPER');

  libWrapper.register(RMaps.ID, 'Token.prototype._onUpdate', function (wrapped, event, ...args) {
    wrapped(event, ...args);

    const keys = Object.keys(foundry.utils.flattenObject(event));
    const changed = new Set(keys);
    const positionChange = ["x", "y"].some(c => changed.has(c));
    const shapeChange = ["width", "height"].some(k => changed.has(k));
    if (positionChange || shapeChange) {
      const { _id } = event;
      RMapEdgeData.clearEdgeDrawingsForToken(_id);
      RMapEdgeData.drawEdgesForToken(_id);
    }
  }, 'WRAPPER');
});

// ============== todo.md
// TODO: add labels on edges
// TODO: support adding intermediate control points and getting bezier-y?
//          Maybe this is done with the Advanced Drawing Tools mod?
// TODO: add endcap arrows
//          Maybe this is done with the Advanced Drawing Tools mod?
//
// TODO: break this into modular JS
// TODO: write unit tests. Quench?
//
// Since this produces drawings, and players don't always have permissions on
// drawings, will that be a problem?
