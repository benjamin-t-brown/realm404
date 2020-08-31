/*
global
G_model_setCutsceneVisible
G_model_getCurrentWorld
G_model_setCutsceneLine
G_model_setCutsceneSprite
G_model_getCutsceneSprite
G_view_renderUi
G_view_clearScreen
G_view_playSound
G_controller_waitForInput
G_controller_render
*/

const G_controllerPlayCutscene = async () => {
  const lines = `Heh, yer trapped here, friend.
  Welcome to Realm 404.
  Why's it called that?
  Yer might say, the only way to escape...
  ...is to tribute 404 coins to the fountain.
  Put 'em in the fountain...
  ...and ye might fight the Lord to leave.
  But be wary.
  This place be dangerous.
  Death can come at any time.
  But... I can aid you.
  I'll buy any items you find.
  For a fair price...
  Heh heh heh...`.split('\n');
  // const lines = ``.split('\n');

  const def = 'a_12';
  const defF = `${def}_f`;
  const fountain = 't_13';
  const fountainF = `${fountain}_f`;

  const sprites = {
    d: def,
    2: defF,
    3: defF,
    4: fountain,
    5: fountain,
    6: fountainF,
    10: defF,
    11: defF,
  };

  G_model_setCutsceneVisible(true);

  const world = G_model_getCurrentWorld();

  for (let i in lines) {
    const line = lines[i];
    G_model_setCutsceneLine(line);
    G_model_setCutsceneSprite(sprites[i] || sprites.d);
    G_view_renderUi();
    G_view_clearScreen();
    G_view_playSound('talk');
    await G_controller_waitForInput();
  }
  G_model_setCutsceneLine('');
  G_model_setCutsceneSprite('');
  G_model_setCutsceneVisible(false);
  G_view_renderUi();
  G_controller_render(world);
  G_view_playSound('start');
};
