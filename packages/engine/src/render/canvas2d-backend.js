export class Canvas2DBackend {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    if (!this.context) throw new Error('Canvas2D is unavailable.');
    this.context.imageSmoothingEnabled = false;
  }

  begin(clear) {
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = clear;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  execute({ type, props }) {
    const draw = DRAW_COMMANDS[type];
    if (draw) draw(this.context, props);
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }
}

const DRAW_COMMANDS = {
  rect(context, props) {
    applyStyle(context, props);
    if (props.radius) roundedRect(context, props.x, props.y, props.width, props.height, props.radius);
    else context.beginPath(), context.rect(props.x, props.y, props.width, props.height);
    if (props.fill) context.fill();
    if (props.stroke) context.stroke();
  },
  circle(context, props) {
    applyStyle(context, props);
    context.beginPath();
    context.arc(props.x, props.y, props.radius, 0, Math.PI * 2);
    if (props.fill) context.fill();
    if (props.stroke) context.stroke();
  },
  polygon(context, props) {
    if (!props.points?.length) return;
    applyStyle(context, props);
    context.beginPath();
    context.moveTo(props.points[0].x, props.points[0].y);
    for (const point of props.points.slice(1)) context.lineTo(point.x, point.y);
    context.closePath();
    if (props.fill) context.fill();
    if (props.stroke) context.stroke();
  },
  ellipse(context, props) {
    applyStyle(context, props);
    context.beginPath();
    context.ellipse(props.x, props.y, Math.max(0, props.radiusX), Math.max(0, props.radiusY),
      props.rotation ?? 0, props.start ?? 0, props.end ?? Math.PI * 2);
    if (props.close) context.closePath();
    if (props.fill) context.fill();
    if (props.stroke) context.stroke();
  },
  path(context, props) {
    const points = props.points;
    if (!points?.length) return;
    applyStyle(context, props);
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      if (point.cx === undefined) context.lineTo(point.x, point.y);
      else context.quadraticCurveTo(point.cx, point.cy, point.x, point.y);
    }
    if (props.close !== false) context.closePath();
    if (props.fill) context.fill();
    if (props.stroke) context.stroke();
  },
  line(context, props) {
    applyStyle(context, props);
    context.beginPath();
    context.moveTo(props.x1, props.y1);
    context.lineTo(props.x2, props.y2);
    context.stroke();
  },
  text(context, props) {
    applyStyle(context, props);
    context.font = props.font ?? '10px Georgia, serif';
    context.textAlign = props.align ?? 'left';
    context.textBaseline = props.baseline ?? 'alphabetic';
    const lines = props.wrapWidth
      ? wrapTextLines(context, String(props.text), props.wrapWidth, props.maxLines)
      : [String(props.text)];
    lines.forEach((line, index) => {
      const y = props.y + index * (props.lineHeight ?? 10);
      if (props.stroke) context.strokeText(line, props.x, y, props.maxWidth);
      if (props.fill !== false) context.fillText(line, props.x, y, props.maxWidth);
    });
  },
  sprite(context, props) {
    if (!props.image) return;
    const source = props.source ?? { x: 0, y: 0, width: props.image.width, height: props.image.height };
    context.save();
    context.globalAlpha = props.alpha ?? 1;
    context.translate(props.x, props.y);
    context.scale(props.flipX ? -1 : 1, props.flipY ? -1 : 1);
    context.drawImage(props.image, source.x, source.y, source.width, source.height,
      -(props.anchorX ?? 0), -(props.anchorY ?? 0), props.width ?? source.width, props.height ?? source.height);
    context.restore();
  },
};

export function wrapTextLines(context, value, width, maximum = Number.POSITIVE_INFINITY) {
  const paragraphs = String(value).split('\n');
  const lines = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(''); continue; }
    let line = words.shift();
    for (const word of words) {
      const candidate = `${line} ${word}`;
      if (context.measureText(candidate).width <= width) line = candidate;
      else { lines.push(line); line = word; }
      if (lines.length >= maximum) break;
    }
    if (lines.length < maximum) lines.push(line);
    if (lines.length >= maximum) break;
  }
  if (lines.length === maximum && context.measureText(lines.at(-1)).width > width) {
    let last = lines.at(-1);
    while (last.length > 1 && context.measureText(`${last}…`).width > width) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines.slice(0, maximum);
}

// A paint is either a CSS colour string or a gradient descriptor:
//   { type: 'linear', x0, y0, x1, y1, stops: [[offset, colour], …] }
//   { type: 'radial', x0, y0, r0, x1, y1, r1, stops: [[offset, colour], …] }
export function resolvePaint(context, paint) {
  if (!paint || typeof paint === 'string') return paint;
  const gradient = paint.type === 'radial'
    ? context.createRadialGradient(paint.x0, paint.y0, paint.r0 ?? 0,
      paint.x1 ?? paint.x0, paint.y1 ?? paint.y0, Math.max(0.01, paint.r1))
    : context.createLinearGradient(paint.x0, paint.y0, paint.x1, paint.y1);
  for (const [offset, colour] of paint.stops) gradient.addColorStop(offset, colour);
  return gradient;
}

function applyStyle(context, props) {
  context.globalAlpha = props.alpha ?? 1;
  if (props.fill) context.fillStyle = resolvePaint(context, props.fill);
  if (props.stroke) context.strokeStyle = resolvePaint(context, props.stroke);
  context.lineWidth = props.lineWidth ?? 1;
  context.lineCap = props.lineCap ?? 'round';
  context.lineJoin = props.lineJoin ?? 'round';
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect?.(x, y, width, height, r);
  if (!context.roundRect) context.rect(x, y, width, height);
}
