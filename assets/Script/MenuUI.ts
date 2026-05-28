const { ccclass, property } = cc._decorator;

@ccclass
export default class MenuUI extends cc.Component {

    @property(cc.Node)
    panel: cc.Node = null;

    @property([cc.Node])
    hideWhenPanelOpen: cc.Node[] = [];

    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    @property(cc.AudioClip)
    buttonSfx: cc.AudioClip = null;

    @property
    bgmVolume: number = 0.6;

    @property
    sfxVolume: number = 1;

    private inputNode: cc.Node = null;
    private bgmRetryCount: number = 0;

    start() {
        cc.log("[MenuUI] start");
        if (this.panel) this.panel.active = false;
        this.playBgm();
        this.bindBgmUnlockRetry();
    }

    onDestroy() {
        this.unbindBgmUnlockRetry();
    }

    public openPanel(event?: any, customEventData?: string) {
        this.playSfx(this.buttonSfx);

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
        this.playSfx(this.buttonSfx);

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

    private playBgm(forceRestart: boolean = false) {
        if (!this.bgm) return;

        let audioState: any = window as any;
        let bgmKey = (this.bgm as any)._uuid || this.bgm.name;
        let currentAudioId = audioState.__webMarioBgmAudioId;

        if (!forceRestart && currentAudioId !== undefined && currentAudioId !== -1 && audioState.__webMarioBgmKey === bgmKey) {
            cc.audioEngine.setVolume(currentAudioId, this.bgmVolume);
            return;
        }

        this.stopBgm();

        let audioId = cc.audioEngine.playEffect(this.bgm, true);
        cc.audioEngine.setVolume(audioId, this.bgmVolume);

        audioState.__webMarioBgmAudioId = audioId;
        audioState.__webMarioBgmKey = bgmKey;
    }

    private bindBgmUnlockRetry() {
        this.inputNode = cc.find("Canvas") || this.node;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.retryBgmAfterUserInput, this);
        this.inputNode.on(cc.Node.EventType.TOUCH_START, this.retryBgmAfterUserInput, this);
        this.inputNode.on(cc.Node.EventType.MOUSE_DOWN, this.retryBgmAfterUserInput, this);
    }

    private unbindBgmUnlockRetry() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.retryBgmAfterUserInput, this);

        if (this.inputNode) {
            this.inputNode.off(cc.Node.EventType.TOUCH_START, this.retryBgmAfterUserInput, this);
            this.inputNode.off(cc.Node.EventType.MOUSE_DOWN, this.retryBgmAfterUserInput, this);
        }
    }

    private retryBgmAfterUserInput() {
        if (this.bgmRetryCount >= 2) return;
        if (this.panel && this.panel.active) return;

        this.bgmRetryCount++;
        this.playBgm(true);
    }

    private playSfx(clip: cc.AudioClip) {
        if (!clip) return;

        let audioId = cc.audioEngine.playEffect(clip, false);
        cc.audioEngine.setVolume(audioId, this.sfxVolume);
    }

    private stopBgm() {
        let audioState: any = window as any;
        let audioId = audioState.__webMarioBgmAudioId;

        if (audioId !== undefined && audioId !== -1) {
            cc.audioEngine.stopEffect(audioId);
            audioState.__webMarioBgmAudioId = -1;
            audioState.__webMarioBgmKey = "";
        }

        cc.audioEngine.stopMusic();
    }
}
