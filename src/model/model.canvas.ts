/*
global
G_view_drawSprite
*/

type ImageCollection = { [key: string]: HTMLImageElement };
type Sprite = [
  HTMLCanvasElement | HTMLImageElement,
  number,
  number,
  number,
  number
];
type SpriteCollection = { [key: string]: Sprite };

let model_canvas: HTMLCanvasElement | null = null;
let model_images: ImageCollection | null = null;
let model_sprites: SpriteCollection | null = null;

const createRotatedImg = (
  inputCanvas: HTMLCanvasElement
): HTMLCanvasElement => {
  const [canvas, ctx, width, height] = G_model_createCanvas(
    inputCanvas.width,
    inputCanvas.height
  );
  const x = width / 2;
  const y = height / 2;
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(inputCanvas, -x, -y);
  return canvas;
};

const createFlippedImg = (
  inputCanvas: HTMLCanvasElement
): HTMLCanvasElement => {
  const [canvas, ctx, width] = G_model_createCanvas(
    inputCanvas.width,
    inputCanvas.height
  );
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(inputCanvas, 0, 0);
  return canvas;
};

const spriteToCanvas = (sprite: Sprite): HTMLCanvasElement => {
  const [, , , spriteWidth, spriteHeight] = sprite;
  const [canvas, ctx] = G_model_createCanvas(spriteWidth, spriteHeight);
  G_view_drawSprite(sprite, 0, 0, 1, ctx);
  return canvas;
};

const model_loadSpritesheets = (
  spriteMap: SpriteCollection,
  image: HTMLImageElement,
  spritePrefixes: string[],
  spriteWidth: number,
  spriteHeight: number,
  subWidth: number,
  subHeight: number
) => {
  const createSprite = (
    name: string,
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    return (spriteMap[name] = [image, x, y, w, h]);
  };

  const addRotated = (
    sprite: HTMLCanvasElement,
    baseSpriteName: string,
    n: number
  ) => {
    let rotated: HTMLCanvasElement = sprite;
    for (let i = 0; i < n; i++) {
      rotated = createRotatedImg(rotated);
    }
    createSprite(
      `${baseSpriteName}_r${n}`,
      rotated,
      0,
      0,
      spriteWidth,
      spriteHeight
    );
  };

  const numColumns = image.width / spriteWidth;
  const numRows = image.height / spriteHeight;
  const numColumnsPerSubsection = numColumns / subWidth;
  const numRowsPerSubsection = numRows / subHeight;

  for (let subY = 0; subY < subHeight; subY++) {
    for (let subX = 0; subX < subWidth; subX++) {
      const spritePrefix = spritePrefixes[subY * subWidth + subX];
      let ctr = 0;
      for (let i = 0; i < numRowsPerSubsection; i++) {
        for (let j = 0; j < numColumnsPerSubsection; j++) {
          const baseSpriteName = `${spritePrefix}_${ctr}`;
          const sprite = createSprite(
            `${spritePrefix}_${ctr}`,
            image,
            subX * spriteWidth * numColumnsPerSubsection + j * spriteWidth,
            subY * spriteHeight * numRowsPerSubsection + i * spriteHeight,
            spriteWidth,
            spriteHeight
          );

          addRotated(spriteToCanvas(sprite), baseSpriteName, 1);
          addRotated(spriteToCanvas(sprite), baseSpriteName, 2);
          addRotated(spriteToCanvas(sprite), baseSpriteName, 3);
          const flipped = createFlippedImg(spriteToCanvas(sprite));
          createSprite(
            `${baseSpriteName}_f`,
            flipped,
            0,
            0,
            spriteWidth,
            spriteHeight
          );
          ctr++;
        }
      }
    }
  }
};

const G_model_loadImagesAndSprites = async (images: any[]) => {
  const imageMap = {};
  const spriteMap = {};
  await Promise.all(
    images.map(
      ([
        imageName,
        imagePath,
        spriteWidth,
        spriteHeight,
        subWidth,
        subHeight,
        spritePrefixes,
      ]) => {
        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            imageMap[imageName] = img;
            model_loadSpritesheets(
              spriteMap,
              img,
              spritePrefixes,
              spriteWidth,
              spriteHeight,
              subWidth,
              subHeight
            );
            resolve();
          };
          img.src = imagePath;
        });
      }
    )
  );

  model_images = imageMap;
  model_sprites = spriteMap;
};

const G_model_createCanvas = (
  width: number,
  height: number
): [HTMLCanvasElement, CanvasRenderingContext2D, number, number] => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx, width, height];
};

const G_model_getCanvas = (): HTMLCanvasElement => {
  if (model_canvas) {
    return model_canvas as HTMLCanvasElement;
  } else {
    const [canvas, ctx] = G_model_createCanvas(512 + 32 * 2, 512 + 32 * 2);
    canvas.id = 'canv';
    ctx.lineWidth = 2;
    (window as any).canvasDiv.appendChild(canvas);
    // const setCanvasSize = () => {
    //   const [canvas2, ctx2] = G_model_createCanvas(canvas.width, canvas.height);
    //   ctx2.drawImage(canvas, 0, 0);
    //   canvas.width = window.innerWidth;
    //   canvas.height = window.innerHeight;
    //   ctx.drawImage(canvas2, 0, 0);
    // };
    // window.addEventListener('resize', setCanvasSize);
    // setCanvasSize();
    model_canvas = canvas;
    return canvas;
  }
};

const G_model_getCtx = (): CanvasRenderingContext2D => {
  return G_model_getCanvas().getContext('2d') as CanvasRenderingContext2D;
};

const G_model_getImage = (imageName: string): HTMLImageElement =>
  (model_images as ImageCollection)[imageName];
const G_model_getSprite = (spriteName: string): Sprite =>
  (model_sprites as SpriteCollection)[spriteName];
