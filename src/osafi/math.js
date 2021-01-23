let room = HBInit();

room.pluginSpec = {
  name: 'osafi/math',
  author: 'osafi',
  version: '1.0.0',
};

room.pointDistance = (p1, p2) => {
  const d1 = p1.x - p2.x;
  const d2 = p1.y - p2.y;
  return Math.sqrt(d1 * d1 + d2 * d2);
};

room.pointInTriangle = (p, v0, v1, v2) => {
  const dX = p.x - v2.x;
  const dY = p.y - v2.y;
  const dX21 = v2.x - v1.x;
  const dY12 = v1.y - v2.y;
  const D = dY12 * (v0.x - v2.x) + dX21 * (v0.y - v2.y);
  const s = dY12 * dX + dX21 * dY;
  const t = (v2.y - v0.y) * dX + (v0.x - v2.x) * dY;
  if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
  return s >= 0 && t >= 0 && s + t <= D;
};
