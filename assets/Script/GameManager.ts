const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    @property
    bgmVolume: number = 0.8;

    private inputNode: cc.Node = null;
    private bgmRetryCount: number = 0;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getPhysicsManager().gravity = cc.v2(0, -1000);

        this.playBgm();
        this.bindBgmUnlockRetry();
    }

    start() {
        this.playBgm();
    }

    onDestroy() {
        this.unbindBgmUnlockRetry();
        this.stopBgm();
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

        this.bgmRetryCount++;
        this.playBgm(true);
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
