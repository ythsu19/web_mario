import Player from "./Player";

const { ccclass, property } = cc._decorator;

@ccclass
export default class QuestionBlock extends cc.Component {

    @property(cc.Node)
    mushroom: cc.Node = null;

    @property
    mushroomSpeed: number = -120;

    @property(cc.Node)
    player: cc.Node = null;

    private used: boolean = false;
    private mushroomMoving: boolean = false;
    private mushroomRb: cc.RigidBody = null;

    onBeginContact(contact, selfCollider, otherCollider) {
        if (this.used) return;
        if (otherCollider.node.name !== "Player") return;
        if (otherCollider.node.y >= this.node.y) return;

        this.used = true;

        this.mushroom.active = true;

        this.mushroomRb = this.mushroom.getComponent(cc.RigidBody);

        this.mushroomRb.type = cc.RigidBodyType.Static;
        this.mushroomRb.gravityScale = 0;
        this.mushroomRb.linearVelocity = cc.v2(0, 0);

        let startY = this.mushroom.y;

        cc.tween(this.mushroom)
            .to(0.4, { y: startY + 32 })
            .call(() => {
                this.mushroomRb.type = cc.RigidBodyType.Dynamic;
                this.mushroomRb.gravityScale = 1;
                this.mushroomMoving = true;
            })
            .start();
    }

    update(dt) {
        if (!this.mushroomMoving) return;
        if (!this.mushroomRb) return;

        let v = this.mushroomRb.linearVelocity;
        v.x = this.mushroomSpeed;
        this.mushroomRb.linearVelocity = v;

        if (this.player && this.mushroom.active) {

            let mushroomWorldPos = this.mushroom.convertToWorldSpaceAR(cc.v2(0, 0));
            let playerWorldPos = this.player.convertToWorldSpaceAR(cc.v2(0, 0));

            let distance = mushroomWorldPos.sub(playerWorldPos).mag();

            if (distance < 40) {

                let playerScript = this.player.getComponent(Player);

                if (playerScript) {
                    playerScript.becomeBig();
                    cc.log("Player becomeBig, isBig =", playerScript.isBig);
                }

                this.mushroom.active = false;
                this.mushroomMoving = false;
            }
        }
    }
}