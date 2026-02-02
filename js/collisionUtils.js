// Ici fonctions de detection de collisions de base
// cercle / cercle, rectangle / rectangle, cercle / rectangle
// on pourra rajouter des fonctions plus avancées si besoin
// par exemple entre polygones convexes, etc.

// Détection de collision entre deux cercles
function circleCollide(x1, y1, r1, x2, y2, r2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return ((dx * dx + dy * dy) < (r1 + r2) * (r1 + r2));
}

// Détection de collision entre deux rectangles
// Collisions between aligned rectangles
// suppose que les rectangles sont alignés avec les axes
// et que leur position est donnée par le coin supérieur gauche
function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    if ((x1 > (x2 + w2)) || ((x1 + w1) < x2))
        return false; // No horizontal axis projection overlap
    if ((y1 > (y2 + h2)) || ((y1 + h1) < y2))
        return false; // No vertical axis projection overlap
    return true;      // If previous tests failed, then both axis projections
    // overlap and the rectangles intersect
}

// collision rectangle rectangle mais avec x, y au centre
function rectsOverlapFromCenter(x1, y1, w1, h1, x2, y2, w2, h2) {
    // on convertit en coordonnées de coin supérieur gauche
    let rx1 = x1 - w1 / 2;
    let ry1 = y1 - h1 / 2;
    let rx2 = x2 - w2 / 2;
    let ry2 = y2 - h2 / 2;
    return rectsOverlap(rx1, ry1, w1, h1, rx2, ry2, w2, h2);
}

// Collisions between rectangle and circle
function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
   var testX=cx;
   var testY=cy;
   if (testX < x0) testX=x0;
   if (testX > (x0+w0)) testX=(x0+w0);
   if (testY < y0) testY=y0;
   if (testY > (y0+h0)) testY=(y0+h0);
   return (((cx-testX)*(cx-testX)+(cy-testY)*(cy-testY))< r*r);
}

// rectangle with cx, y at center and circle cx, cy at center
function circRectsOverlapFromCenter(rx, ry, rw, rh, cx, cy, r) {
    // on convertit en coordonnées de coin supérieur gauche
    let rrx = rx - rw / 2;
    let rry = ry - rh / 2;
    return circRectsOverlap(rrx, rry, rw, rh, cx, cy, r);
}

export { circleCollide, rectsOverlap, rectsOverlapFromCenter,
         circRectsOverlap, circRectsOverlapFromCenter };