const { ccclass, property } = cc._decorator;

@ccclass
export default class Mushroom extends cc.Component {

    onBeginContact(contact, selfCollider, otherCollider) {

        cc.log("hit");

        if (otherCollider.node.name === "Player") {

            // Player 變大
            otherCollider.node.scaleX = 1.5;
            otherCollider.node.scaleY = 1.5;

            // 蘑菇消失
            this.node.active = false;
        }
    }
}