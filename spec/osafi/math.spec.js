describe('math', () => {
  const pluginPath = '../../src/osafi/math';

  describe('point distance', () => {
    const testCases = [
      { p1: { x: 1, y: 2 }, p2: { x: 3, y: 4 }, r: 2.8284 },
      { p1: { x: 1, y: 3 }, p2: { x: -2, y: 9 }, r: 6.7082 },
      { p1: { x: 5, y: -8 }, p2: { x: 1, y: -3 }, r: 6.4031 },
      { p1: { x: -3, y: 7 }, p2: { x: 8, y: 6 }, r: 11.0453 },
    ];

    testCases.forEach(({ p1, p2, r }) => {
      pluginTest(pluginPath, `distance between (${p1.x}, ${p1.y}) - (${p2.x}, ${p2.y}) ≈ ${r}`, ({ room }) => {
        expect(room.pointDistance(p1, p2)).toBeCloseTo(r);
      });
    });
  });

  describe('point within triangle', () => {
    const testTriangle = {
      v0: { x: 176, y: 434 },
      v1: { x: 179, y: 274 },
      v2: { x: 394, y: 267 },
    };
    const testCases = [
      { p: { x: 176, y: 434 }, ...testTriangle, r: true },
      { p: { x: 175, y: 434 }, ...testTriangle, r: false },

      { p: { x: 179, y: 274 }, ...testTriangle, r: true },
      { p: { x: 179, y: 273 }, ...testTriangle, r: false },

      { p: { x: 394, y: 267 }, ...testTriangle, r: true },
      { p: { x: 395, y: 267 }, ...testTriangle, r: false },

      { p: { x: 207, y: 313 }, ...testTriangle, r: true },
      { p: { x: 362, y: 278 }, ...testTriangle, r: true },
      { p: { x: 276, y: 348 }, ...testTriangle, r: true },
      { p: { x: 276, y: 348 }, ...testTriangle, r: true },

      { p: { x: 290, y: 352 }, ...testTriangle, r: false },
      { p: { x: 175, y: 345 }, ...testTriangle, r: false },
      { p: { x: 289, y: 265 }, ...testTriangle, r: false },
    ];

    testCases.forEach(({ p, v0, v1, v2, r }) => {
      const testName = `point (${p.x}, ${p.y}) ${!r ? 'not ' : ''}within triangle (${v0.x}, ${v0.y}), (${v1.x}, ${v1.y}), (${v2.x}, ${v2.y})`;
      pluginTest(pluginPath, testName, ({ room }) => {
        expect(room.pointInTriangle(p, v0, v1, v2)).toEqual(r);
      });
    });
  });
});
