# FVTT R-Maps

This is a tool to help you make r-maps, a.k.a. relationship maps, Anacapa
charts, conspiracy maps, in your Foundry VTT game.

Place tokens, draw lines between them, and have those lines automatically
update as you move the tokens around.

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

 - [ ] add labels on edges that follow the arc.
 - [ ] colour and style. (wouldn't it be great if the style were red yarn?)
 - [X] support adding intermediate control points and getting bezier-y?

   Advanced Drawing Tools _can_ do this one as-is, with caveats mentioned
   below.
 - [ ] add endcap arrows.

   (This will require edges not ending at the token center, but actually
   calculating edge collision.)

Nice-to-have:

 - [ ] Add additional data to edges that let you set up programmatic filters

   ("show all edges from this node", "show all edges labeled 'family'", etc.)

## Mods to synergize with

 - https://foundryvtt.com/packages/move-that-for-you
    - Enable MT4U on tokens
    - Then the GM can mark all tokens on the r-map sheet as moveable
    - But the players should be careful not to draw lines from tokens they
      don't own, because that'll still fail, and leave the board in an ugly
      state.
 - https://github.com/dev7355608/advanced-drawing-tools
    - You can add nodes and add Smoothing Factor to get nice arcs, but as soon
      as you move any connected token, the line will snap back to being
      straight.
    - Since the lines are just _lines_, you can't apply fill to them. So no
      yarn styling yet.
    - No text-that-follows-line-arc yet.
 - https://github.com/Feu-Secret/Tokenmagic
