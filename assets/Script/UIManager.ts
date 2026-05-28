const { ccclass, property } = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    @property(cc.Label)
    coinLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    timeLabel: cc.Label = null;

    @property(cc.Label)
    lifeLabel: cc.Label = null;

    @property(cc.Node)
    score200Popup: cc.Node = null;

    @property(cc.Node)
    score1000Popup: cc.Node = null;

    @property(cc.AudioClip)
    coinSfx: cc.AudioClip = null;

    @property
    sfxVolume: number = 1;

    private coin: number = 0;
    private score: number = 0;
    private time: number = 300;
    private life: number = 1;
    private timerCallback: Function = null;

    start() {
        this.updateUI();

        this.timerCallback = () => {
            this.time--;

            if (this.time <= 0) {
                this.time = 0;
                this.updateUI();
                cc.director.loadScene("GameOver");
                return;
            }

            this.updateUI();
        };

        this.schedule(this.timerCallback, 1);
    }

    onDestroy() {
        this.stopTimer();
    }

    public stopTimer() {
        if (this.timerCallback) {
            this.unschedule(this.timerCallback);
            this.timerCallback = null;
        }
    }

    updateUI() {
        this.coinLabel.string = "COIN : " + this.coin;
        this.scoreLabel.string = this.score.toString().padStart(5, "0");
        this.timeLabel.string = this.time.toString().padStart(3, "0");
        this.lifeLabel.string = this.life.toString();
    }

    public addCoin() {
        this.coin++;
        this.score += 100;
        this.playSfx(this.coinSfx);
        this.updateUI();
    }

    public addScore(value: number, worldPos?: cc.Vec2) {
        this.score += value;
        this.updateUI();
        if (worldPos) {
            this.showScorePopup(value, worldPos);
        }
    }

    public setLife(value: number) {
        this.life = value;
        this.updateUI();
    }

    public getScore() {
        return this.score;
    }

    public getTime() {
        return this.time;
    }

    public getFinalScore() {
        return this.score + this.time;
    }

    public showScorePopup(value: number, worldPos: cc.Vec2) {

        let popup: cc.Node = null;

        if (value === 200) {
            popup = this.score200Popup;
        }
        else if (value === 1000) {
            popup = this.score1000Popup;
        }

        if (!popup) return;

        // 世界座標轉 UI 座標
        let localPos = this.node.convertToNodeSpaceAR(worldPos);

        popup.setPosition(localPos);

        popup.active = true;
        popup.opacity = 255;

        popup.stopAllActions();

        cc.tween(popup)
            .by(0.6, { y: 40 })
            .to(0.3, { opacity: 0 })
            .call(() => {
                popup.active = false;
                popup.opacity = 255;
            })
            .start();
    }

    private playSfx(clip: cc.AudioClip) {
        if (!clip) return;

        let audioId = cc.audioEngine.playEffect(clip, false);
        cc.audioEngine.setVolume(audioId, this.sfxVolume);
    }
}
