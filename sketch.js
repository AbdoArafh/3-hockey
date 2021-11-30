let game;

function setup() {
    createCanvas(windowWidth, windowHeight);
    game = new Game();
}

function draw() {
    game.update();
    game.render();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
    game.handleKey(key);
}

class Ball {
    constructor(pos, r, c) {
        this.pos = pos;
        this.r = r;
        this.c = c;
        this.show = this.show.bind(this);
    }
    show() {
        fill(this.c);
        circle(this.pos.x, this.pos.y, this.r);
    }
}

class Hockey extends Ball {
    constructor(pos, r) {
        super(pos, r, 0);
        // this.vel = createVector();
        this.maxVel = 10;
        this.bounderies = this.bounderies.bind(this);
        this.vel = this.randomDirection().setMag(this.maxVel / 2);
        this.acc = createVector(0, 0);
        this.hit = this.hit.bind(this);
    }
    randomDirection() {
        return createVector(random() < 0.5 ? 1 : -1, random() < 0.5 ? 1 : -1);
    }
    bounderies () {
        if (this.pos.x - this.r < 0) {
                this.pos.x = this.r;
                this.vel.x *= -1;
            }
        if (this.pos.x + this.r > width) {
                this.pos.x = width - this.r;
                this.vel.x *= -1;
            }
        if (this.pos.y - this.r < 0) {
                this.pos.y = this.r;
                this.vel.y *= -1;
            }
        if (this.pos.y + this.r > height) {
                this.pos.y = height - this.r;
                this.vel.y *= -1;
            }
    }
    hit (other) {
        const d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < this.r + other.r) {
            this.vel = p5.Vector.sub(this.pos, other.pos).setMag(this.maxVel);
            // this.acc.add(p5.Vector.sub(this.pos, other.pos).setMag(this.maxVel));
        }
    }
    update() {
        this.bounderies();
        this.vel.add(this.acc);
        this.vel.limit(this.maxVel);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
}

class Player extends Ball {
    constructor(pos, r) {
        super(pos, r, "blue");
        this.vel = createVector(0, 0);
        this.side = pos.x < width/2 ? 1 : -1;
        this.leftBoundry = this.getLeftBoundry();
        this.rightBoundry = this.getRightBoundry();
        this.bounderies = this.bounderies.bind(this);
        this.update = this.update.bind(this);
        this.addVel = this.addVel.bind(this);
        this.getRightBoundry = this.getRightBoundry.bind(this);
        this.getLeftBoundry = this.getLeftBoundry.bind(this);
    }
    getRightBoundry () {
        return this.side === 1 ? width/2 : width;
    }
    getLeftBoundry () {
        return this.side === 1 ? 0 : width / 2;
    }
    bounderies () {
        if (this.pos.x - this.r < this.leftBoundry)
            this.pos.x = this.r + this.leftBoundry;
        if (this.pos.x + this.r > this.rightBoundry)
            this.pos.x = this.rightBoundry - this.r;
        if (this.pos.y - this.r < 0)
            this.pos.y = this.r;
        if (this.pos.y + this.r > height)
            this.pos.y = height - this.r;
    }
    update() {
        this.bounderies();
        this.pos.add(this.vel);
    }
    addVel(vel) {
        this.vel = vel.setMag(3);
    }
}

class Target {
    constructor(side) {
        this.side = side;
        this.pos = this.getPos();
        this.height = height / 5;
        this.width = 10;
        this.getPos = this.getPos.bind(this);
    }
    show() {
        fill(200);
        rect(this.pos.x, this.pos.y, this.width, this.height);
        noFill();
        rect(this.pos.x, this.pos.y, this.width * 7, this.height * 2);
    }
    getPos() {
        return createVector(this.side === 1 ? width : 0, height/2);
    }
}

class Game {
    constructor() {
        ellipseMode(RADIUS);
        rectMode(CENTER);
        const r = 20;
        this.players = [
            new Player(createVector(width - r * 2, height/2), r),
            new Player(createVector(r * 2, height/2), r)
        ]
        this.hockey = new Hockey(createVector(width/2, height/2), r);

        this.targets = [
            new Target(1),
            new Target(-1)
        ]

        this.KEYFORCES = {
            up: createVector(0, -1),
            down: createVector(0, 1),
            left: createVector(-1, 0),
            right: createVector(1, 0)
        }
        
        this.keys = {
            ArrowLeft : {
                force: this.KEYFORCES.left,
                target: 0
            },
            ArrowRight : {
                force: this.KEYFORCES.right,
                target: 0
            },
            ArrowDown: {
                force: this.KEYFORCES.down,
                target: 0
            },
            ArrowUp: {
                force: this.KEYFORCES.up,
                target: 0
            },
            a : {
                force: this.KEYFORCES.left,
                target: 1
            },
            d : {
                force: this.KEYFORCES.right,
                target: 1
            },
            s: {
                force: this.KEYFORCES.down,
                target: 1
            },
            w: {
                force: this.KEYFORCES.up,
                target: 1
            },
        };

        this.controls = {
            m (hockey) {
                hockey.vel.mult(1.5);
            },
            n (hockey) {
                if (hockey.vel.magSq() > 0.1) {
                    hockey.vel.mult(0.9);
                }
            }
        }

        this.handleKey = this.handleKey.bind(this);
    }
    render() {
        background(255);
        this.renderBoard();
        noStroke();
        this.players[0].show();
        this.players[1].show();
        this.hockey.show();
    }
    renderBoard() {
        stroke(200);
        line(width/2, 0, width/2, height);
        this.targets.forEach(function(target) {target.show()});
    }
    update() {
        this.players.forEach(function (player) {
            player.update();
            this.hockey.hit(player);
        }, this);
        this.hockey.update();
    }
    handleKey(k) {
        if (this.keys[k])
            this.players[this.keys[k].target].addVel(this.keys[k].force);
        else if (this.controls[k])
            this.controls[k](this.hockey);
    }
}