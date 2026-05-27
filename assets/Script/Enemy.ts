const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

    @property
    leftX: number = -210;

    @property
    rightX: number = -30;

    @property
    speed: number = 80;

    private rb: cc.RigidBody = null;
    private dir: number = -1;

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
    }

    start() {
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale = 1;
        this.rb.fixedRotation = true;
    }

    update(dt) {
        if (this.node.x <= this.leftX) {
            this.dir = 1;
        }
        if (this.node.x >= this.rightX) {
            this.dir = -1;
        }

        let v = this.rb.linearVelocity;
        v.x = this.speed * this.dir;
        this.rb.linearVelocity = v;
    }
    
    // onBeginContact 拿掉了，完全交給 Player 處理！
}