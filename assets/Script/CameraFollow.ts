const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraFollow extends cc.Component {

    @property({ type: cc.Node, tooltip: "請把你的【主角節點】拖到這裡" })
    target: cc.Node = null;

    @property({ tooltip: "是否開啟地圖邊界限制" })
    useLimits: boolean = false; // 先關掉限制，讓攝影機完全自由跟隨

    @property({ tooltip: "最左邊界", visible() { return this.useLimits; } })
    minX: number = -500;

    @property({ tooltip: "最右邊界", visible() { return this.useLimits; } })
    maxX: number = 3000;

    start() {
        if (this.target) {
            this.node.x = this.target.x;
            this.node.y = this.target.y; // 加這行
        }
    }

    lateUpdate(dt) {
        if (!this.target) return;

        let targetX = this.target.x;

        if (this.useLimits) {
            if (targetX < this.minX) targetX = this.minX;
            if (targetX > this.maxX) targetX = this.maxX;
        }

        // 只讓 X 軸跟隨主角
        this.node.x = targetX;

        this.node.y = -190;
    }
}