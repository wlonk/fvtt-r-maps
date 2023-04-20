/* * /
 * Recalculate lines on:
 * Tile:
 * _onDragLeftDrop
 * _onHandleDragDrop
 * Create lines on:
*/

/*
 * We use graph theory terminology here (nodes, edges), so as to not collide
 * with all the other possible terms that already mean things in Foundry.
 */

class RMaps {
  static ID = 'fvtt-r-maps';

  static FLAGS = {
    EDGES: 'r-maps-edges',
  }

  static TEMPLATES = {
    EDGE: `modules/${this.ID}/templates/r-map-edge.hbs`,
  }

  static state = {
    controlActive: false,
  }

  static onGetSceneControlButtons(buttons) {
    const rMapsToolController = {
      name: this.ID,
      title: "R-Maps",
      activeTool: "",
      visible: true,
      tools: [
        {
          name: "Draw edge",
          title: "Draw a connection between two entities on the r-map",
          icon: "fas fa-diagram-project",
          toggle: true,
          active: RMaps.state.controlActive,
          onClick: (toggle) => {
            console.log("I am click't");
            RMaps.state.controlActive = toggle;
          },
        },
      ],
      icon: "fas fa-chart-network",
      layer: this.ID,
    };
    buttons.push(rMapsToolController);
  }
}

class RMapToolsLayer extends InteractionLayer {
	constructor() {
		super();
		console.log("R-Maps | Loaded into canvas");
	}

	activate() {
		super.activate();
		console.log("R-Maps | Activated");
		return this;
	}

	deactivate() {
		super.deactivate();
		console.log("R-Maps | Deactivated");
		return this;
	}

	async draw() {
		await super.draw();
		console.log("R-Maps | Drawing");
		return this;
	}

	async tearDown() {
		await super.tearDown();
		console.log("R-Maps | Tearing down!");
		return this;
	}
}

class RMapEdgeData {
  static get allEdges() {
    const allEdges = (canvas?.scene.tiles || []).reduce((accumulator, tile) => {
      const tileEdges = this.getEdgesForTile(tile.id);

      return {
        ...accumulator,
        ...tileEdges,
      }
    }, {});

    return allEdges;
  }

  static getEdgesForTile(tileId) {
    return canvas?.scene.tiles.get(tileId)?.getFlag(RMaps.ID, RMaps.FLAGS.EDGES);
  }

  static createEdge(tileId, edgeData) {
    /*
     * edgeData: {
     *   "to": TileID,
     *   "label": Text,
     *   "style": {
     *     // "color": Color,
     *     // "fromEnd": "flat",
     *     // "toEnd": "flat",
     *     // eventually more here
     *   }
     * }
     */
    const newEdge = {
      ...edgeData,
      fromId: tileId,
      id: foundry.utils.randomID(16),
    };
    const newEdges = {
      [newEdge.id]: newEdge
    };
    return canvas?.scene.tiles.get(tileId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, newEdges);
  }

  static updateEdge(edgeId, updateData) {
    const relevantEdge = this.allEdges[edgeId];
    const update = {
      [edgeId]: updateData
    };
    return canvas?.scene.tiles.get(relevantEdge.fromId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, update);
  }

  static deleteEdge(edgeId) {
    const relevantEdge = this.allEdges[edgeId];
    // Foundry specific syntax required to delete a key from a persisted object
    // in the database
    const keyDeletion = {
      [`-=${edgeId}`]: null
    };
    return canvas?.scene.tiles.get(relevantEdge.fromId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, keyDeletion);
  }

  static async drawEdge(edgeId) {
    const relevantEdge = this.allEdges[edgeId];
    const fromNode = canvas?.scene.tiles.get(relevantEdge.fromId);
    const toNode = canvas?.scene.tiles.get(relevantEdge.to);

    // TODO: always make this lesser-to-greater:
    const fromCentroid = {
      x: fromNode.x + (fromNode.width / 2),
      y: fromNode.y + (fromNode.height / 2),
    };
    const toCentroid = {
      x: toNode.x + (toNode.width / 2),
      y: toNode.y + (toNode.height / 2),
    };

    const edge = {
      x: fromCentroid.x,
      y: fromCentroid.y,
      bezierFactor: 0.4,
      shape: {
        type: foundry.data.ShapeData.TYPES.POLYGON,
        points: [
          0, 0,
          toCentroid.x - fromCentroid.x, toCentroid.y - fromCentroid.y,
        ],
        height: toCentroid.y - fromCentroid.y,
        width: toCentroid.x - fromCentroid.x,
      },
      // TODO: colour and style
    };

    const [ drawing ] = await canvas.scene.createEmbeddedDocuments('Drawing', [edge]);
    this.updateEdge(edgeId, { drawing: drawing._id });
    return drawing;
  }
}

/* */
Hooks.once("setup", () => {
  canvas.layers[RMaps.ID] = {
    group: "interface",
    layerClass: RMapToolsLayer,
  };
});

Hooks.on("getSceneControlButtons", (buttons) => {
  // TODO: maybe we just splice into the Tile menu?
	RMaps.onGetSceneControlButtons(buttons);
});
/* */

// TODO: add drag-to-draw functionality
// TODO: hook redraw triggers up to update events.
//
// TODO: put edges behind tiles, for visual cleanliness.
// TODO: add labels on edges
// TODO: support adding intermediate control points and getting bezier-y?
// TODO: add endcap arrows
