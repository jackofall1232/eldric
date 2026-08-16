export function circleHitbox(x, y, radius) { return { type: 'circle', x, y, radius }; }
export function overlaps(a, b) { if (a.type === 'circle' && b.type === 'circle') return Math.hypot(a.x - b.x, a.y - b.y) <= a.radius + b.radius; return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
