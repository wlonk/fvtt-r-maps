# FVTT R-Maps

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fwlonk%2Ffvtt-r-maps%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange)
![Repository License](https://img.shields.io/github/license/wlonk/fvtt-r-maps)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffvtt-r-maps&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=fvtt-r-maps)

This is a tool to help you make r-maps, a.k.a. relationship maps, Anacapa
charts, conspiracy maps, in your Foundry VTT game.

Place tokens, draw lines between them, and have those lines automatically
update as you move the tokens around.

## How-to

 1. Install `fvtt-r-maps`
    - Optionally, `advanced-drawing-tools` and `tokenmagic`.
 2. Make a scene for your r-map. I like to use a cork-board background.
 3. Add tokens for your actors that you want to connect on the map.
    - I like to put these tokens in little polaroid-picture frames. It adds to
      the a e s t h e t i c.
 4. Give the players ownership permissions on any actors that they will need to
    move, or draw lines out from.
    - For some tables, this may be only their characters. For others, maybe
      this is everyone having ownership over everyone. Make the right call for
      your group and play needs!
 5. To draw a line, select a token, then click-and-drag from somewhere on the
    *background* to your target. This is a flaw, but I'm still working out how
    to fix it.
 6. Optionally, once your lines are all set, the GM or any players with drawing
    permissions can add labels to them, or restyle them, or use
    `advanced-drawing-tools` to add some intermediate points in them and curve
    them.

## TODO

 - [X] permissions stuff is weird? Users are having perms errors in the
   console, but it all seems to be working anyway. Not a comforting situation.

   _ETA_: What was happening: the user updated their token, triggering
   `Token._onUpdate` both locally, and on the GM's side. The local call failed
   with permissions problems, the GM call succeeded and then propagated the
   change to the player's view.
 - [ ] write unit tests. [Quench](https://github.com/Ethaks/FVTT-Quench)?
 - [ ] add CI.
 - [ ] add git-tag based CD release process.

These might be handled by Advanced Drawing Tools:

 - [X] colour and style. (wouldn't it be great if the style were red yarn?)
 - [X] support adding intermediate control points and getting bezier-y?

   Advanced Drawing Tools _can_ do this one as-is, with caveats mentioned
   below.

Nice-to-have:

 - [ ] add labels on edges that follow the arc.
 - [ ] add endcap arrows.

   (This will require edges not ending at the token center, but actually
   calculating edge collision.)
 - [ ] Add additional data to edges that let you set up programmatic filters

   ("show all edges from this node", "show all edges labeled 'family'", etc.)

## Mods to synergize with

 - https://github.com/dev7355608/advanced-drawing-tools
    - You can add nodes and add Smoothing Factor to get nice arcs, but as soon
      as you move any connected token, the line will snap back to being
      straight.
    - Since the lines are just _lines_, you can't apply fill to them. So no
      yarn styling yet.
    - No text-that-follows-line-arc yet.
 - https://github.com/Feu-Secret/Tokenmagic
    - Just having this enabled on your game will get some reasonable defaults
      on your edges.

 - https://foundryvtt.com/packages/move-that-for-you
    - Careful about this one; it is more likely to lead to trouble than just
      giving players ownership over tokens will.
    - Enable MT4U on tokens.
    - Then the GM can mark all tokens on the r-map sheet as moveable.
    - But the players should be careful not to draw lines from tokens they
      don't own, because that'll still fail, and leave the board in an ugly
      state.
