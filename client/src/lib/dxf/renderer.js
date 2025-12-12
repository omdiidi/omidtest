/**
 * Render DXF entities to a canvas with pan/zoom support
 */
export class DxfRenderer {
    constructor(canvas, entities = []) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = entities;
        this.bounds = null;

        // Transform state
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Style
        this.lineColor = '#6366f1';
        this.lineWidth = 1.5;
        this.backgroundColor = '#0f172a';

        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.setupEventListeners();
    }

    setEntities(entities, bounds) {
        this.entities = entities;
        this.bounds = bounds;
        this.fitToView();
        this.render();
    }

    fitToView() {
        if (!this.bounds || !this.entities.length) return;

        const { minX, minY, maxX, maxY } = this.bounds;
        const width = maxX - minX;
        const height = maxY - minY;

        if (width === 0 && height === 0) return;

        const padding = 40;
        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;
        this.scale = Math.min(scaleX, scaleY);

        // Center the drawing
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        this.offsetX = this.canvas.width / 2 - centerX * this.scale;
        this.offsetY = this.canvas.height / 2 + centerY * this.scale; // Flip Y
    }

    setupEventListeners() {
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = this.scale * zoomFactor;

        // Limit zoom
        if (newScale < 0.01 || newScale > 1000) return;

        // Zoom toward mouse position
        this.offsetX = mouseX - (mouseX - this.offsetX) * zoomFactor;
        this.offsetY = mouseY - (mouseY - this.offsetY) * zoomFactor;
        this.scale = newScale;

        this.render();
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        this.offsetX += dx;
        this.offsetY += dy;

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.render();
    }

    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    worldToScreen(x, y) {
        return {
            x: x * this.scale + this.offsetX,
            y: -y * this.scale + this.offsetY, // Flip Y axis
        };
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid();

        // Draw entities
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const entity of this.entities) {
            this.drawEntity(entity);
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
        ctx.lineWidth = 0.5;

        // Calculate grid spacing based on scale
        let gridSize = 10;
        while (gridSize * this.scale < 20) gridSize *= 10;
        while (gridSize * this.scale > 200) gridSize /= 10;

        const startX = Math.floor(-this.offsetX / this.scale / gridSize) * gridSize;
        const endX = Math.ceil((this.canvas.width - this.offsetX) / this.scale / gridSize) * gridSize;
        const startY = Math.floor(-(this.canvas.height - this.offsetY) / this.scale / gridSize) * gridSize;
        const endY = Math.ceil(this.offsetY / this.scale / gridSize) * gridSize;

        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            const screen = this.worldToScreen(x, 0);
            ctx.moveTo(screen.x, 0);
            ctx.lineTo(screen.x, this.canvas.height);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            const screen = this.worldToScreen(0, y);
            ctx.moveTo(0, screen.y);
            ctx.lineTo(this.canvas.width, screen.y);
        }
        ctx.stroke();
    }

    drawEntity(entity) {
        const ctx = this.ctx;
        const points = entity.points || [];

        if (points.length < 2) return;

        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineWidth;

        ctx.beginPath();
        const start = this.worldToScreen(points[0].x, points[0].y);
        ctx.moveTo(start.x, start.y);

        for (let i = 1; i < points.length; i++) {
            const p = this.worldToScreen(points[i].x, points[i].y);
            ctx.lineTo(p.x, p.y);
        }

        ctx.stroke();
    }

    destroy() {
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    }
}
