const {Bodies, Body, Engine, World} = Matter;
let engine;

let app = new PIXI.Application({
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 2,      // default: 1
  }
);
document.body.appendChild(app.view);

app.renderer.backgroundColor = 0x061639;
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);

c = new Charm(PIXI);

let SLOW_STEP = 0.95;
let ROT_STEP = 0.1;
let ACCELERATION = 0.01;

let keys;

let state;

let plane;
let char;
let ellipse;
let triangle;

let ellipseBody;
const physicsObjects = [];

let center;
let focus;
let controlledChar;
let toAngle;

const addRect = ({x=0, y=0, width=10, height=10}) => {
  const {body, sprite} = rectangle({x, y, width, height});
  plane.addChild(sprite);
  World.addBody(engine.world, body);
  physicsObjects.push({body, sprite});
};

const play = (delta) => {
  const dir = {x: focus.x - controlledChar.x, y: focus.y - controlledChar.y}
  if (len2d(dir.x, dir.y) > 50) {
    toAngle = shortAngleDist(Math.atan2(dir.y, dir.x), controlledChar.rot);
  } else {
    toAngle -= toAngle * ROT_STEP;
  }
  controlledChar.rot -= toAngle * ROT_STEP;
  controlledChar.rotation = controlledChar.rot - Math.PI / 2;

  const acc = {x: 0, y: 0, abs: 0};
  keys.w.isDown && (acc.y -= 1);
  keys.s.isDown && (acc.y += 1);
  keys.a.isDown && (acc.x -= 1);
  keys.d.isDown && (acc.x += 1);

  acc.abs = len2d(acc.x, acc.y);
  const div = Math.max(acc.abs, 1) / ACCELERATION;
  acc.abs /= div;
  acc.x /= div;
  acc.y /= div;
  Body.applyForce(ellipseBody, ellipseBody.position, acc);

  // controlledChar.x += controlledChar.vx * delta;
  // controlledChar.y += controlledChar.vy * delta;
  //
  // controlledChar.vx *= Math.min(Math.pow(SLOW_STEP, delta), 1);
  // controlledChar.vy *= Math.min(Math.pow(SLOW_STEP, delta), 1);

  controlledChar.position = ellipseBody.position;
};

const setup = () => {
  engine = Engine.create();
  const {innerWidth: w, innerHeight: h} = window;
  center = {x: window.innerWidth / 2, y: window.innerHeight / 2}

  const wallTop = Bodies.rectangle(w / 2, 0, w, 10, {isStatic: true});
  const wallBottom = Bodies.rectangle(w / 2, h, w, 10,{isStatic: true});
  const wallRight = Bodies.rectangle(w, h / 2, 10, h, {isStatic: true});
  const wallLeft = Bodies.rectangle(0, h / 2, 10, h, {isStatic: true});
  World.add(engine.world, [wallBottom, wallTop, wallLeft, wallRight]);

  char = new PIXI.Container();
  plane = new PIXI.Container();

  triangle = new PIXI.Graphics();
  triangle.beginFill(0xFFFFFF, 1);
  triangle.drawPolygon([
      0, 0,
      -1000, 3000,
      1000, 3000,
  ]);
  triangle.endFill();

  ellipse = new PIXI.Graphics();
  ellipse.lineStyle(0);
  ellipse.beginFill(0xDE3249, 1);
  ellipse.drawCircle(0, 0, 50);
  ellipse.endFill();

  char.addChild(triangle);
  char.addChild(ellipse);

  const bounds = new PIXI.Rectangle(0, 0, 1000, 1500);
  const texture = app.renderer.generateTexture(triangle, PIXI.SCALE_MODES.NEAREST, 1, bounds);
  const mask = new PIXI.Sprite(texture);
  mask.position.x = ellipse.x - 1000;
  mask.position.y = ellipse.y;
  char.addChild(mask);
  app.stage.mask = mask;

  app.stage.addChild(char);
  app.stage.addChild(plane);

  ellipseBody = Bodies.circle(center.x, center.y, 50, {restitution: 0.8});
  World.addBody(engine.world, ellipseBody);

  addRect({x: center.x, y: center.y, width: 50, height: 80});

  keys = {
    up: keyboard("ArrowUp"),
    down: keyboard("ArrowDown"),
    left: keyboard("ArrowLeft"),
    right: keyboard("ArrowRight"),
    w: keyboard("w"),
    a: keyboard("a"),
    s: keyboard("s"),
    d: keyboard("d"),
  }

  app.stage.interactive = true;
  app.stage.on("mousemove", ({data: {global: {x, y}}}) => {focus = {x, y}});

  state = play;
  controlledChar = char;


  // controlledChar.x = center.x - window.innerWidth / 4;
  // controlledChar.y = center.y;
  // controlledChar.vx = 0;
  // controlledChar.vy = 0;
  controlledChar.rot = 0;

  focus = { ...center };

  // plane.x = center.x;
  // plane.y = center.y;

  app.ticker.add(delta => gameLoop(delta));
  Engine.run(engine);
}

const gameLoop = (delta) => {
  c.update();

  state(delta);

  const [x1, y1, x2, y2, x3, y3] = triangle.graphicsData[0].shape.points;
  const trianglePoints = [[x1, y1], [x2, y2], [x3, y3]]
    .map(([x, y]) => triangle.worldTransform.apply({x, y}))
    .map(({x, y}) => [x, y])
    .flat();

  physicsObjects.forEach(({ sprite, body }) => {
    const rectPoints = body.vertices
      .map(({x, y}) => [x, y])
      .flat();
    const intersected = Intersects.polygonPolygon(trianglePoints, rectPoints);
    if (body.isStatic && intersected) {
      Body.setStatic(body, false);
      if (body._savedVelocity !== undefined) {
        Body.setVelocity(body, body._savedVelocity.velocity);
        Body.setAngularVelocity(body, body._savedVelocity.angularVelocity);
      }
    } else if (!body.isStatic && !intersected) {
      body._savedVelocity = {
        velocity: {x: body.velocity.x, y: body.velocity.y},
        angularVelocity: body.angularVelocity,
      }
      Body.setStatic(body, true);
    }

    sprite.position = body.position;
    sprite.rotation = body.angle;
  });
}

setup()