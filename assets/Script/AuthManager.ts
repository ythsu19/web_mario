const { ccclass, property } = cc._decorator;

@ccclass
export default class AuthManager extends cc.Component {

    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    usernameInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    public onClickEnter() {
        cc.log("[Auth] ENTER 被按到");

        let email = this.emailInput.string;
        let username = this.usernameInput.string;
        let password = this.passwordInput.string;

        cc.log("[Auth] email:", email);
        cc.log("[Auth] username:", username);
        cc.log("[Auth] password length:", password.length);

        if (email === "" || password === "") {
            cc.log("[Auth] email 或 password 是空的");
            return;
        }

        cc.log("[Auth] 準備進入 LevelSelect");
        cc.director.loadScene("LevelSelect");
    }
}