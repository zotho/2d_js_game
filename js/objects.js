const rectangle = ({x, y, width, height, radius=10}) => {
  const physicsBody = Bodies.rectangle(x, y, width, height, {restitution: 0.8});

  const rectGraphics = new PIXI.Graphics()
    .lineStyle(0)
    .beginFill(0xDE3249, 1)
    .drawRoundedRect(x, y, width, height, radius)
    .endFill();

  const texture = app.renderer.generateTexture(rectGraphics);
  const rectSprite = new PIXI.Sprite(texture);
  rectSprite.anchor.set(0.5, 0.5);

  return {
    body: physicsBody,
    sprite: rectSprite,
  }
}