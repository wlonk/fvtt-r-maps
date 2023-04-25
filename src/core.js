/*
 * canvas is global from Foundry
 */

import { log } from './debug-log-utils.js';
import { getEdgeGivenTwoNodes } from './canvas-utils.js';

/*
 * We use graph theory terminology here (nodes, edges), so as to not collide
 * with all the other possible terms that already mean things in Foundry.
 */

export class RMaps {
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

  // XXX: This should maybe be in our "operations" class?
  static onGetSceneControlButtons(buttons) {
    const tokenTools = buttons.find((b) => b.name === 'token')?.tools
    tokenTools?.push({
      name: 'drawEdge',
      title: 'Draw a connection',
      icon: 'fas fa-chart-network',
    });
  }
}


// TODO: combine this into the class above. It's just a namespace.
export class RMapEdgeData {
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
    log('beginning updateEdge');
    const relevantEdge = this.allEdges[edgeId];
    const update = {
      [edgeId]: updateData
    };
    log('updateEdge with', update);
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

  // This pertains to Drawings:
  static async updateEdgeDrawingsForToken(tokenId) {
    log('beginning updateEdgeDrawingsForToken');
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
    log('updateEdgeDrawingsForToken with', inbound, outbound);
    const updates = await canvas.scene.updateEmbeddedDocuments('Drawing', [...inbound, ...outbound])
    return updates;
  }

  // This pertains to Drawings:
  static async drawEdge(edgeId) {
    log('beginning drawEdge')
    const relevantEdge = this.allEdges[edgeId];
    const fromNode = canvas?.scene.tokens.get(relevantEdge.fromId)._object.center;
    const toNode = canvas?.scene.tokens.get(relevantEdge.to)._object.center;

    const edge = getEdgeGivenTwoNodes(fromNode, toNode);
    edge.shape.type = foundry.data.ShapeData.TYPES.POLYGON;

    log('drawEdge with', edge);
    const [ drawing ] = await canvas.scene.createEmbeddedDocuments('Drawing', [edge]);
    this.updateEdge(edgeId, { drawingId: drawing._id });
    return drawing;
  }
}
