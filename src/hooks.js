/*
 * Hooks is global from Foundry
 * game
 * canvas
 * foundry
 * libWrapper is global from libWrapper
 */

import { log } from './debug-log-utils.js';
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
  
  // Handle drags from Token:
  libWrapper.register(RMaps.ID, 'Token.prototype._canDrag', function (wrapped, ...args) {
    return wrapped(...args) || game.activeTool === 'drawEdge';
  }, 'WRAPPER');
  libWrapper.register(RMaps.ID, 'Token.prototype._onDragLeftStart', function (wrapped, ...args) {
    if (game.activeTool === RMaps.FLAGS.EDGE_TOOL) {
      RMaps.state.originToken = this;
      const pixiLine = RMaps.state.pixiLine = new Line(this.center);
      const spot = this.center;
      pixiLine.update(spot);
    } else {
      wrapped(...args);
    }
  }, 'MIXED');
  libWrapper.register(RMaps.ID, 'Token.prototype._onDragLeftMove', (wrapped, event) => {
    if (
      game.activeTool === RMaps.FLAGS.EDGE_TOOL
      && canvas.tokens.controlledObjects.size === 1
    ) {
      const spot = xyFromEvent(event);
      const pixiLine = RMaps.state.pixiLine;
      pixiLine.update(spot);
    } else {
      wrapped(event);
    }
  }, 'MIXED');
  libWrapper.register(RMaps.ID, 'Token.prototype._onDragLeftCancel', async (wrapped, event) => {
    wrapped(event);
    RMaps.state.pixiLine?.clear();
    RMaps.state.pixiLine = null;
  }, 'WRAPPER');
  libWrapper.register(RMaps.ID, 'Token.prototype._onDragLeftDrop', async (wrapped, event) => {
    if (
      game.activeTool === RMaps.FLAGS.EDGE_TOOL
      && canvas.tokens.controlledObjects.size === 1
    ) {
      log('Drop event');
      try {
        // Find if we picked a token:
        const spot = xyFromEvent(event);
        const targets = xyInsideTargets(spot);
        if (targets.length === 1) {
          // We have a winner.
          const target = targets[0];
          log(target);
          const edgeId = await RMapEdgeData.createEdge(RMaps.state.originToken.id, { to: target.id });
          RMapEdgeData.drawEdge(edgeId);
        }
      } catch (_) {
        // Clean up:
        RMaps.state.pixiLine?.clear();
        RMaps.state.pixiLine = null;
      }
    } else {
      wrapped(event);
    }
  }, 'MIXED');

  // Handle drags from the TokenLayer:
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
        log('Drop event');
        // Find if we picked a token:
        const spot = xyFromEvent(event);
        const targets = xyInsideTargets(spot);
        if (targets.length === 1) {
          // We have a winner.
          const target = targets[0];
          log(target);
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
});

// Trigger redrawing edges when a token moves:
Hooks.on('updateToken', (token, change) => {
  const keys = Object.keys(change);
  const changed = new Set(keys);
  const positionChange = ["x", "y"].some(c => changed.has(c));
  const shapeChange = ["width", "height"].some(k => changed.has(k));
  // Basically, only the GM has update perms on all the required Drawing
  // objects, so we send the update event to the server, where the GM gets
  // it, and then the GM updates all the edges. It's a beg-based system, but
  // we get by.
  const isGM = game.user.isGM;
  if ((positionChange || shapeChange) && isGM) {
    const { id } = token;
    RMapEdgeData.updateEdgeDrawingsForToken(id);
  }
});

Hooks.on('preDeleteToken', async (token) => {
  await RMapEdgeData.deleteAllEdgesToAndFrom(token.id);
});

// Handle destroying edge data when the linked drawing is deleted:
Hooks.on('preDeleteDrawing', async (drawing) => {
  await Promise.all(Object.keys(RMapEdgeData.allEdges).map((edgeKey) => {
    const edge = RMapEdgeData.allEdges[edgeKey];
    if (edge.drawingId === drawing.id) {
      return RMapEdgeData.deleteEdge(edgeKey);
    }
  }));
});
