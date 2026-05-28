const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelSelect extends cc.Component {

    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    @property(cc.AudioClip)
    buttonSfx: cc.AudioClip = null;

    @property
    bgmVolume: number = 0.6;

    @property
    sfxVolume: number = 1;

    onLoad() {
        this.playBgm();
    }

    public onClickSTAGE1() {
        this.playSfx(this.buttonSfx);
        cc.director.loadScene("Start");
    }

    private playBgm() {
        if (!this.bgm) return;

        let audioState: any = window as any;
        let bgmKey = (this.bgm as any)._uuid || this.bgm.name;
        let currentAudioId = audioState.__webMarioBgmAudioId;

        if (currentAudioId !== undefined && currentAudioId !== -1 && audioState.__webMarioBgmKey === bgmKey) {
            cc.audioEngine.setVolume(currentAudioId, this.bgmVolume);
            return;
        }

        this.stopBgm();

        let audioId = cc.audioEngine.playEffect(this.bgm, true);
        cc.audioEngine.setVolume(audioId, this.bgmVolume);

        audioState.__webMarioBgmAudioId = audioId;
        audioState.__webMarioBgmKey = bgmKey;
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
