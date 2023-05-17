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
  // TODO: insert this into Drawing tools, not Token tools.
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
     * }
     */
    log('beginning createEdge');
    const newEdge = {
      ...edgeData,
      fromId: tokenId,
      id: foundry.utils.randomID(16),
    };
    const newEdges = {
      [newEdge.id]: newEdge
    };
    await canvas?.scene.tokens.get(tokenId)?.setFlag(RMaps.ID, RMaps.FLAGS.EDGES, newEdges);
    log('created new edge:', newEdge.id);
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
    // TODO: this is failing for some tokens. I think the pattern is "non-PC
    // actors" and that may be because they're not getting their data stored
    // right?
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

    log('drawEdge with', edge);
    const [ drawing ] = await canvas.scene.createEmbeddedDocuments('Drawing', [edge]);

    // If we have Tokenmagic set up, apply some default filters:
    if (game.modules.get('tokenmagic')) {
      let params = [
        {
          filterType: "liquid",
          filterId: "yarnMantle",
          time: 0,
          blend: 5,
          spectral: false,
          scale: 7,
          animated: {
            time: {
              active: true,
              speed: 0.0000000015,
              animType: "move",
            },
            scale: {
              active: true,
              animType: "cosOscillation",
              loopDuration: 300,
              loops: 1,
              val1: 10,
              val2: 0.5,
            },
          },
        },
        {
          filterType: "shadow",
          filterId: "yarnShadow",
          rotation: 35,
          blur: 2,
          quality: 5,
          distance: 10,
          alpha: 0.7,
          padding: 10,
          shadowOnly: false,
          color: 0x000000,
          zOrder: 6000,
        },
      ];
      await TokenMagic.addFilters(drawing.object, params);
    }
    this.updateEdge(edgeId, { drawingId: drawing._id });
    return drawing;
  }
}
