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

    public openPanel(event?: any, customEventData?: string) {
        let sourceName = customEventData || (event && event.target ? event.target.name : "");
        let authMode = sourceName === "signup" || sourceName === "SignUpButton" ? "signup" : "login";

        cc.log("[MenuUI] openPanel", authMode);

        if (!this.panel) {
            cc.log("[MenuUI] panel is missing");
            return;
        }

        this.panel.active = true;

        let authManager = this.getAuthManager();
        if (authManager && typeof authManager.setMode === "function") {
            authManager.setMode(authMode);
        }

        this.hideWhenPanelOpen.forEach(node => {
            if (node) node.active = false;
        });
    }

    public closePanel() {
        cc.log("[MenuUI] closePanel");

        if (this.panel) this.panel.active = false;

        this.hideWhenPanelOpen.forEach(node => {
            if (node) node.active = true;
        });
    }

    private getAuthManager(): any {
        if (this.panel) {
            let panelAuthManager = this.panel.getComponent("AuthManager") as any;
            if (panelAuthManager) {
                return panelAuthManager;
            }
        }

        let ownAuthManager = this.node.getComponent("AuthManager") as any;
        if (ownAuthManager) {
            return ownAuthManager;
        }

        let parentAuthManager = this.node.parent
            ? this.node.parent.getComponent("AuthManager") as any
            : null;
        if (parentAuthManager) {
            return parentAuthManager;
        }

        let canvas = cc.find("Canvas");
        return canvas ? canvas.getComponent("AuthManager") as any : null;
    }
}
