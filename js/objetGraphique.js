export default class ObjetGraphique {height;

    constructor(x, y, width, height, illustration = null) {
        this.x = x;
        this.y = y;
        this.illustration = illustration;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        ctx.save();

        if (this.illustration) {
            try {
                ctx.drawImage(
                    this.illustration,
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
            } catch (e) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.min(this.width, this.height) / 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.min(this.width, this.height) / 2, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.restore();
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    moveAbsolute(x, y) {
        this.x = x;
        this.y = y;
    }
}