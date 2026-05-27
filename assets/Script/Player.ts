const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

    @property
    speed: number = 120;

    @property
    jumpForce: number = 650;

    @property(cc.SpriteFrame)
    idleSprite: cc.SpriteFrame = null;

    @property(cc.Node)
    uiManagerNode: cc.Node = null;

    private uiManager: any = null;

    public isBig: boolean = false;
    public life: number = 1;

    private isDead: boolean = false;
    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    private sprite: cc.Sprite = null;

    private moveDir: number = 0;
    private canJump: boolean = false;
    private isInvincible: boolean = false;
    private facingDir: number = 1;
    public score: number = 0;

    onLoad() {
        this.uiManager = this.uiManagerNode.getComponent("UIManager");
        this.uiManager.setLife(this.life);
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.sprite = this.getComponent(cc.Sprite);

        this.life = 1;
        this.isBig = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(dt) {
        if (this.isDead) return;

        if (this.node.y < -500) {
            cc.log("[fall] 玩家掉出地圖，直接死亡");
            this.die();
            return;
        }

        let velocity = this.rb.linearVelocity;
        velocity.x = this.moveDir * this.speed;
        this.rb.linearVelocity = velocity;

        if (this.moveDir < 0) {
            this.facingDir = -1;
        }
        else if (this.moveDir > 0) {
            this.facingDir = 1;
        }

        this.updateScale();
        this.updateAnimation();
    }

    updateAnimation() {
        if (!this.anim) return;

        let state = this.anim.getAnimationState("PlayerWalk");

        if (!state) {
            cc.log("找不到 PlayerWalk 動畫");
            return;
        }

        if (this.moveDir !== 0) {
            if (!state.isPlaying) {
                this.anim.play("PlayerWalk");
            }
        } 
        else {
            if (state.isPlaying) {
                this.anim.stop("PlayerWalk");
            }

            if (this.sprite && this.idleSprite) {
                this.sprite.spriteFrame = this.idleSprite;
            }
        }
    }

    updateScale() {
        let size = this.isBig ? 1.5 : 1;

        this.node.scaleX = size * this.facingDir;
        this.node.scaleY = size;
    }

    becomeBig() {
        this.isBig = true;
        this.life = 2;
        this.uiManager.setLife(this.life);
        this.updateScale();

        cc.log("變大，生命:", this.life);
    }

    becomeSmall() {
        this.isBig = false;
        this.life = 1;
        this.uiManager.setLife(this.life);
        this.updateScale();

        cc.log("變小，生命:", this.life);
    }

    public die() {
        cc.log("[die] die() 被呼叫");

        if (this.isDead) {
            cc.log("[die] 已經死過了，return");
            return;
        }

        this.isDead = true;

        cc.log("[die] 準備切到 GameOver");
        cc.director.loadScene("GameOver", () => {
            cc.log("[die] 成功進入 GameOver");
        });
    }

    takeDamage() {
        cc.log("[takeDamage] 被攻擊");

        if (this.isInvincible) {
            cc.log("[takeDamage] 無敵中，return");
            return;
        }

        if (this.isDead) {
            cc.log("[takeDamage] 已死亡，return");
            return;
        }

        this.isInvincible = true;
        this.life--;

        cc.log("[takeDamage] 剩餘生命:", this.life);

        if (this.life <= 0) {
            cc.log("[takeDamage] 生命歸零，呼叫 die()");
            this.die();
            return;
        }

        cc.log("[takeDamage] 還沒死，變小");
        this.becomeSmall();

        let velocity = this.rb.linearVelocity;
        velocity.x = 0;
        velocity.y = 700;
        this.rb.linearVelocity = velocity;

        this.scheduleOnce(() => {
            cc.log("[takeDamage] 無敵結束");
            this.isInvincible = false;
        }, 1);
    }

    onKeyDown(event) {
        if (this.isDead) return;

        switch (event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.moveDir = -1;
                break;

            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.moveDir = 1;
                break;

            case cc.macro.KEY.space:
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
                if (this.canJump) {
                    let velocity = this.rb.linearVelocity;
                    velocity.y = this.jumpForce;
                    this.rb.linearVelocity = velocity;
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        if (this.isDead) return;

        switch (event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                if (this.moveDir === -1) this.moveDir = 0;
                break;

            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                if (this.moveDir === 1) this.moveDir = 0;
                break;
        }
    }

    onBeginContact(contact, selfCollider, otherCollider) {

        cc.log("[contact] 碰到:", otherCollider.node.name);

        this.canJump = true;

        if (otherCollider.node.name === "Enemy") {

        cc.log("[contact] 碰到 Enemy");

        if (this.node.y > otherCollider.node.y + 15) {

            this.uiManager.addScore(100);

            let enemy = otherCollider.node.getComponent("Enemy");

            if (enemy) {
                enemy.die();
            }

            let velocity = this.rb.linearVelocity;
            velocity.y = this.jumpForce * 0.7;
            this.rb.linearVelocity = velocity;

            this.canJump = false;
        }
        else {
            cc.log("[contact] 從側邊碰到敵人，準備扣血");
            this.takeDamage();
        }
    }

        if (otherCollider.node.name === "QuestionBlock2") {

            if (!otherCollider.node["scored"]) {
                otherCollider.node["scored"] = true;

                this.uiManager.addScore(500);

                cc.log("撞到問號磚，加 500 分");
            }
        }
        if (otherCollider.node.name === "Flag") {
            cc.director.loadScene("LevelSelect");
        }
    }
}