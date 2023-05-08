/*
 * Hooks is global from Foundry
 * game
 * canvas
 * foundry
 * libWrapper is global from libWrapper
 */

import { RMaps, RMapEdgeData } from './core.js';
import { Line, xyFromEvent, xyInsideTargets } from './canvas-utils.js';

// Inject tool into Tokens controls
Hooks.on('getSceneControlButtons', (buttons) => {
	RMaps.onGetSceneControlButtons(buttons);
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(RMaps.ID);
});

Hooks.on('libWrapper.Ready', () => {
  // Reset all the wrappers for this module:
  libWrapper.unregister_all(RMaps.ID);


  /* * /
  libWrapper.register(RMaps.ID, 'Token.prototype._onDragLeftStart', function (wrapped, ...args) {
    // This does two things:
    // 1. It sets the canvas.mouseInteractionManager.state to 'drag'
    // 2. It drags the token around.
    // I want 1 without 2.
    wrapped(...args);
    if (game.activeTool === RMaps.FLAGS.EDGE_TOOL) {
      RMaps.state.originToken = this;
      const pixiLine = RMaps.state.pixiLine = new Line(originToken.center);
      const spot = this.center;
      pixiLine.update(spot);
    }
  }, 'WRAPPER');
  /* */

  // TODO: this currently won't fire if you start inside a token?
  // This implies a strange but usable UI: select a token, then click and drag
  // somewhere on the background, then drag to your token of destination, then
  // release.
  libWrapper.register(RMaps.ID, 'TokenLayer.prototype._onDragLeftStart', (wrapped, event) => {
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
    } else {
      wrapped(event);
    }
  }, 'MIXED');

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
  // right-click while dragging, apparently.
  libWrapper.register(RMaps.ID, 'TokenLayer.prototype._onDragLeftCancel', async (wrapped, event) => {
    wrapped(event);
    RMaps.state.pixiLine.clear();
    RMaps.state.pixiLine = null;
  }, 'WRAPPER');

  libWrapper.register(RMaps.ID, 'TokenLayer.prototype._onDragLeftDrop', async (wrapped, event) => {
    wrapped(event);
    if (
      game.activeTool === RMaps.FLAGS.EDGE_TOOL
      && canvas.tokens.controlledObjects.size === 1
    ) {
      try {
        // Find if we picked a token:
        const spot = xyFromEvent(event);
        const targets = xyInsideTargets(spot);
        if (targets.length === 1) {
          // We have a winner.
          const target = targets[0];
          const edgeId = await RMapEdgeData.createEdge(RMaps.state.originToken.id, { to: target.id });
          RMapEdgeData.drawEdge(edgeId);
        }
      } catch (_) {
        // Clean up:
        RMaps.state.pixiLine.clear();
        RMaps.state.pixiLine = null;
      }
    }
  }, 'WRAPPER');

  libWrapper.register(RMaps.ID, 'Token.prototype._onUpdate', (wrapped, event, ...args) => {
    wrapped(event, ...args);
    const keys = Object.keys(foundry.utils.flattenObject(event));
    const changed = new Set(keys);
    const positionChange = ["x", "y"].some(c => changed.has(c));
    const shapeChange = ["width", "height"].some(k => changed.has(k));
    // Basically, only the GM has update perms on all the required Drawing
    // objects, so we send the update event to the server, where the GM gets
    // it, and then the GM updates all the edges. It's a beg-based system, but
    // we get by.
    const isGM = game.user.isGM;
    if ((positionChange || shapeChange) && isGM) {
      const { _id } = event;
      RMapEdgeData.updateEdgeDrawingsForToken(_id);
    }
  }, 'WRAPPER');

  libWrapper.register(RMaps.ID, 'Drawing.prototype._onDelete', function (wrapped, event, ...args) {
    Object.keys(RMapEdgeData.allEdges).forEach((edgeKey) => {
      const edge = RMapEdgeData.allEdges[edgeKey];
      if (edge.drawingId === this.id) {
        RMapEdgeData.deleteEdge(edgeKey);
      }
    });
    wrapped(event, ...args);
  }, 'WRAPPER');
});
