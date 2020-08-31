const fs = require('fs');
const { PNG } = require('pngjs');

const colors = {
  0: [50, 115, 69], // grass
  1: [63, 40, 50], // dirt
  2: [255, 255, 255], // snow
  3: [255, 231, 98], // sand
  4: [25, 61, 63], // tree
  5: [35, 71, 93], // tree snow
  6: [0, 0, 0], // wall
  7: [79, 103, 129], // floor
  8: [60, 60, 60], // open gate
  9: [80, 30, 30], // closed gate
  10: [184, 111, 80], // chest
  11: [4, 132, 209], // water
  12: [229, 59, 68], // lava
  13: [44, 232, 244], // ice
  14: [251, 146, 43], // sandstorm
  15: [175, 191, 210], // something
};

const mapArray = fs
  .readFileSync(__dirname + '/../scratch/map.csv')
  .toString()
  .replace(/\r*\n/g, ',')
  .split(',');

console.log('MAP ARRAY', mapArray);

fs.createReadStream(__dirname + '/../scratch/map.png')
  .pipe(
    new PNG({
      filterType: 4,
      colorType: 2,
      bgColor: {
        red: 255,
        green: 255,
        blue: 255,
      },
    })
  )
  .on('parsed', function () {
    const png = this;
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        let i = [y * png.width + x];
        let mapIndex = mapArray[i];
        let idx = (png.width * y + x) << 2;

        const [r, g, b] = colors[mapIndex];
        console.log(mapIndex, r, g, b);
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
      }
    }
    png.pack().pipe(fs.createWriteStream(__dirname + '/../scratch/out.png'));
    console.log('wrote out.png');
  });
