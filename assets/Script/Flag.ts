const { ccclass, property } = cc._decorator;

@ccclass
export default class Flag extends cc.Component {

    private triggered: boolean = false;

    onBeginContact(contact, selfCollider, otherCollider) {
        cc.log("碰到東西了:", otherCollider.node.name);

        if (this.triggered) return;

        if (otherCollider.node.name === "Player") {
            this.triggered = true;
            cc.log("碰到旗子，準備進 LevelSelect");

            cc.director.loadScene("LevelSelect");
        }
    }
}