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
        let email = this.emailInput.string;
        let username = this.usernameInput.string;
        let password = this.passwordInput.string;

        cc.log("email:", email);
        cc.log("username:", username);
        cc.log("password:", password);

        if (email === "" || username === "" || password === "") {
            cc.log("請填完整資料");
            return;
        }

        cc.log("準備註冊 / 登入 Firebase");
    }
}