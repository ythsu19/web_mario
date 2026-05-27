const { ccclass } = cc._decorator;

@ccclass
export default class LevelSelect extends cc.Component {

    public onClickSTAGE1() {
        cc.director.loadScene("Start");
    }
}