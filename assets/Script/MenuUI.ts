const { ccclass, property } = cc._decorator;

@ccclass
export default class MenuUI extends cc.Component {

    @property(cc.Node)
    panel: cc.Node = null;

    @property([cc.Node])
    hideWhenPanelOpen: cc.Node[] = [];

    start() {
        cc.log("[MenuUI] start");
        if (this.panel) this.panel.active = false;
    }

    public openPanel() {
        cc.log("[MenuUI] openPanel 被按到");

        if (!this.panel) {
            cc.log("[MenuUI] panel 沒有拖進來");
            return;
        }

        this.panel.active = true;

        this.hideWhenPanelOpen.forEach(node => {
            if (node) node.active = false;
        });
    }

    public closePanel() {
        cc.log("[MenuUI] closePanel 被按到");

        if (this.panel) this.panel.active = false;

        this.hideWhenPanelOpen.forEach(node => {
            if (node) node.active = true;
        });
    }
}