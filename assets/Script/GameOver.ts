const { ccclass, property } = cc._decorator;

@ccclass
export default class GameOver extends cc.Component {

    @property(cc.AudioClip)
    gameOverSfx: cc.AudioClip = null;

    @property
    sfxVolume: number = 1;

    @property
    returnDelay: number = 2;

    onLoad() {
        this.returnDelay = 2;

        this.stopBgm();
        this.playSfx(this.gameOverSfx);

        this.scheduleOnce(() => {
            cc.director.loadScene("LevelSelect");
        }, this.returnDelay);
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
