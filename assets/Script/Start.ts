const { ccclass } = cc._decorator;

@ccclass
export default class Start extends cc.Component {

    onLoad() {
        this.scheduleOnce(() => {
            cc.director.loadScene("Stage1");
        }, 1);
    }
}