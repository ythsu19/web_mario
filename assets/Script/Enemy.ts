const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

    @property
    leftX: number = -210;

    @property
    rightX: number = -30;

    @property
    speed: number = 80;

    @property(cc.SpriteFrame)
    deadFrame: cc.SpriteFrame = null;

    @property
    deadDuration: number = 0.8;

    @property(cc.Node)
    uiManagerNode: cc.Node = null;

    private uiManager: any = null;

    private rb: cc.RigidBody = null;
    private dir: number = -1;
    private dead: boolean = false;
    private anim: cc.Animation = null;

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);

        if (this.uiManagerNode) {
            this.uiManager = this.uiManagerNode.getComponent("UIManager");
        }
    }

    start() {
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale = 0;
        this.rb.fixedRotation = true;

        if (this.anim) {
            this.anim.play("Enemy");
        }
    }

    update(dt) {
        if (this.dead) return;

        if (this.node.x <= this.leftX) {
            this.dir = 1;
        }

        if (this.node.x >= this.rightX) {
            this.dir = -1;
        }

        let v = this.rb.linearVelocity;
        v.x = this.speed * this.dir;
        v.y = 0;
        this.rb.linearVelocity = v;

        this.node.scaleX = this.dir;
    }

    public die(): boolean {
        if (this.dead) return false;
        this.dead = true;

        cc.log("[Enemy] die");

        if (this.anim) {
            this.anim.stop();
        }

        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 0);
            this.rb.gravityScale = 0;
        }

        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.enabled = false;
        }

        let sprite = this.getComponent(cc.Sprite);
        if (sprite && this.deadFrame) {
            sprite.spriteFrame = this.deadFrame;
        }

        cc.tween(this.node)
            .by(1, { y: -200 })
            .delay(0.3)
            .call(() => {
                this.node.destroy();
            })
            .start();

        return true;
    }
}