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

    private coin: number = 0;
    private score: number = 0;
    private time: number = 300;
    private life: number = 1;

    start() {
        this.updateUI();

        this.schedule(() => {
            this.time--;

            if (this.time <= 0) {
                this.time = 0;
                cc.director.loadScene("GameOver");
            }

            this.updateUI();
        }, 1);
    }

    updateUI() {
        this.coinLabel.string = "COIN : " + this.coin;
        this.scoreLabel.string = this.score.toString().padStart(5, "0");
        this.timeLabel.string = this.time.toString();
        this.lifeLabel.string = this.life.toString();
    }

    public addCoin() {
        this.coin++;
        this.score += 100;
        this.updateUI();
    }

    public addScore(value: number) {
        this.score += value;
        this.updateUI();
    }

    public setLife(value: number) {
        this.life = value;
        this.updateUI();
    }

    public getScore() {
        return this.score;
    }
}