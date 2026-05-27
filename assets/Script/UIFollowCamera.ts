const { ccclass, property } = cc._decorator;

@ccclass
export default class UIFollowCamera extends cc.Component {

    @property(cc.Node)
    cameraNode: cc.Node = null;

    @property
    offsetX: number = 0;

    @property
    offsetY: number = 0;

    update(dt) {
        if (!this.cameraNode) return;

        this.node.x = this.cameraNode.x + this.offsetX;
        this.node.y = this.cameraNode.y + this.offsetY;
    }
}