import DxfParser from 'dxf-parser';

/**
 * Parse a DXF file and extract entities with metrics
 * @param {string} dxfContent - Raw DXF file content as string
 * @returns {Object} Parsed data with entities and metrics
 */
export function parseDxf(dxfContent) {
    const parser = new DxfParser();
    let dxf;

    try {
        dxf = parser.parseSync(dxfContent);
    } catch (error) {
        throw new Error(`Failed to parse DXF: ${error.message}`);
    }

    if (!dxf || !dxf.entities) {
        throw new Error('No entities found in DXF file');
    }

    const entities = dxf.entities;
    const processedEntities = [];
    let totalLength = 0;
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const entity of entities) {
        const processed = processEntity(entity);
        if (processed) {
            processedEntities.push(processed);
            totalLength += processed.length || 0;

            // Update bounds
            for (const point of processed.points || []) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }
        }
    }

    // Handle case of no valid entities
    if (minX === Infinity) {
        minX = minY = maxX = maxY = 0;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return {
        entities: processedEntities,
        metrics: {
            width,
            height,
            totalLength,
            area: width * height,
            bounds: { minX, minY, maxX, maxY },
            entityCount: processedEntities.length,
        },
        raw: dxf,
    };
}

/**
 * Process individual DXF entity
 */
function processEntity(entity) {
    switch (entity.type) {
        case 'LINE':
            return processLine(entity);
        case 'CIRCLE':
            return processCircle(entity);
        case 'ARC':
            return processArc(entity);
        case 'POLYLINE':
        case 'LWPOLYLINE':
            return processPolyline(entity);
        case 'SPLINE':
            return processSpline(entity);
        default:
            return null;
    }
}

function processLine(entity) {
    const start = entity.vertices?.[0] || entity.startPoint || { x: 0, y: 0 };
    const end = entity.vertices?.[1] || entity.endPoint || { x: 0, y: 0 };
    const length = distance(start, end);

    return {
        type: 'LINE',
        points: [start, end],
        length,
    };
}

function processCircle(entity) {
    const center = entity.center || { x: 0, y: 0 };
    const radius = entity.radius || 0;
    const circumference = 2 * Math.PI * radius;

    // Generate points for visualization
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
        });
    }

    return {
        type: 'CIRCLE',
        center,
        radius,
        points,
        length: circumference,
    };
}

function processArc(entity) {
    const center = entity.center || { x: 0, y: 0 };
    const radius = entity.radius || 0;
    const startAngle = (entity.startAngle || 0) * (Math.PI / 180);
    const endAngle = (entity.endAngle || 360) * (Math.PI / 180);

    let angleDiff = endAngle - startAngle;
    if (angleDiff < 0) angleDiff += 2 * Math.PI;

    const arcLength = radius * angleDiff;

    // Generate points for visualization
    const points = [];
    const segments = Math.max(16, Math.ceil(angleDiff / (Math.PI / 32)));
    for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (i / segments) * angleDiff;
        points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
        });
    }

    return {
        type: 'ARC',
        center,
        radius,
        startAngle: entity.startAngle,
        endAngle: entity.endAngle,
        points,
        length: arcLength,
    };
}

function processPolyline(entity) {
    const vertices = entity.vertices || [];
    if (vertices.length < 2) return null;

    const points = vertices.map(v => ({ x: v.x || 0, y: v.y || 0 }));

    // Calculate total length
    let length = 0;
    for (let i = 1; i < points.length; i++) {
        length += distance(points[i - 1], points[i]);
    }

    // If closed, add closing segment
    if (entity.shape) {
        length += distance(points[points.length - 1], points[0]);
        points.push({ ...points[0] }); // Close the path visually
    }

    return {
        type: 'POLYLINE',
        points,
        length,
        closed: entity.shape,
    };
}

function processSpline(entity) {
    const controlPoints = entity.controlPoints || [];
    if (controlPoints.length < 2) return null;

    // Approximate spline as polyline through control points
    const points = controlPoints.map(p => ({ x: p.x || 0, y: p.y || 0 }));

    let length = 0;
    for (let i = 1; i < points.length; i++) {
        length += distance(points[i - 1], points[i]);
    }

    return {
        type: 'SPLINE',
        points,
        length,
    };
}

function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Read a File object and return DXF content
 */
export async function readDxfFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
