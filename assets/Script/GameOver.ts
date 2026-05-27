const { ccclass } = cc._decorator;

@ccclass
export default class GameOver extends cc.Component {
    onLoad() {
        this.scheduleOnce(() => {
            cc.director.loadScene("LevelSelect");
        }, 1);
    }
}