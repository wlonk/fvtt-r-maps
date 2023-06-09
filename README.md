# FVTT R-Maps

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fwlonk%2Ffvtt-r-maps%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange)
![Repository License](https://img.shields.io/github/license/wlonk/fvtt-r-maps)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffvtt-r-maps&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=fvtt-r-maps)

This is a tool to help you make r-maps, a.k.a. relationship maps, Anacapa
charts, conspiracy maps, in your Foundry VTT game.

Place tokens, draw lines between them, and have those lines automatically
update as you move the tokens around.

![A small r-map of five superheroes on a corkboard](docs/r-maps.png)

## How-to

 1. Install and enable `fvtt-r-maps`
    - Optionally, `advanced-drawing-tools` and `tokenmagic`.
 2. Make a scene for your r-map.
    - I like to use a cork-board background.
 3. Add tokens for your actors that you want to connect on the map.
    - I like to put these tokens in little polaroid-picture frames and rotate
      them randomly a few degrees left or right. It adds to the _aesthetic_.
 4. Give the players ownership permissions on any actors that they will need to
    move, or draw lines out from.
    - For some tables, this may be only their characters. For others, maybe
      this is everyone having ownership over everyone. Make the right call for
      your group and play needs!
    - However, I will caution that you are likely to get the most ease-of-use
      out of making every token owned by every player. Perhaps you then lock
      things down later if you need, perhaps not, but at the time of drawing
      lines and moving things around, communism is the watchword!
 5. To draw a line, drag from one token you control to any other.
    - Optionally, once your lines are all set, the GM or any players with
      drawing permissions can add labels to them, or restyle them, or use
      `advanced-drawing-tools` to add some intermediate points in them and
      curve them.

## About R-Maps

 - [Paul's R-Map Method](https://www.indiegamereadingclub.com/indie-game-reading-club/pauls-r-map-method/)

## TODO

 - [X] permissions stuff is weird? Users are having perms errors in the
   console, but it all seems to be working anyway. Not a comforting situation.

   _ETA_: What was happening: the user updated their token, triggering
   `Token._onUpdate` both locally, and on the GM's side. The local call failed
   with permissions problems, the GM call succeeded and then propagated the
   change to the player's view.
 - [ ] write unit tests. [Quench](https://github.com/Ethaks/FVTT-Quench)?
 - [ ] add CI.
 - [X] add git-tag based CD release process.
 - [ ] make a demonstration animated gif.
 - [ ] make a tutorial video.

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
 - [ ] make this all happen on a dedicated RMapLayer, with edge selection and
   drawing tools on the same submenu.
 - [ ] package polaroid token frame and corkboard background with the module,
   pending finding some with proper licensing.

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

 - https://foundryvtt.com/packages/vtta-tokenizer
     - This is great for making tokens with a frame, such as the polaroid
       picture frame I used the demos.

 - https://foundryvtt.com/packages/move-that-for-you
    - Careful about this one; it is more likely to lead to trouble than just
      giving players ownership over tokens will.
    - Enable MT4U on tokens.
    - Then the GM can mark all tokens on the r-map sheet as moveable.
    - But the players should be careful not to draw lines from tokens they
      don't own, because that'll still fail, and leave the board in an ugly
      state.
