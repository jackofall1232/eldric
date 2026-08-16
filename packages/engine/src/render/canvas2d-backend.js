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
    if (props.stroke) context.strokeText(String(props.text), props.x, props.y, props.maxWidth);
    if (props.fill !== false) context.fillText(String(props.text), props.x, props.y, props.maxWidth);
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

function applyStyle(context, props) {
  context.globalAlpha = props.alpha ?? 1;
  if (props.fill) context.fillStyle = props.fill;
  if (props.stroke) context.strokeStyle = props.stroke;
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
