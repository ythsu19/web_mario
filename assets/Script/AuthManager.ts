const { ccclass, property } = cc._decorator;

@ccclass
export default class AuthManager extends cc.Component {

    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    usernameInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    @property(cc.Label)
    message: cc.Label = null;

    @property(cc.Label)
    messageLabel: cc.Label = null;

    private mode: string = "login";

    public setMode(mode: string) {
        this.mode = mode === "signup" ? "signup" : "login";
        this.showMessage(this.mode === "signup" ? "Create account" : "Log in");
    }

    public onClickEnter() {
        cc.log("[Auth] Enter clicked");

        let email = this.emailInput.string.trim();
        let username = this.usernameInput.string.trim();
        let password = this.passwordInput.string;

        cc.log("[Auth] email:", email);
        cc.log("[Auth] username:", username);
        cc.log("[Auth] password length:", password.length);
        cc.log("[Auth] mode:", this.mode);

        if (email === "" || password === "") {
            this.showMessage("Please enter email and password");
            return;
        }

        let auth = this.getFirebaseAuth();
        if (!auth) {
            return;
        }

        if (username === "") {
            this.showMessage("Please enter username");
            return;
        }

        cc.log("[Auth] Trying Firebase", this.mode);

        let authRequest = this.mode === "signup"
            ? auth.createUserWithEmailAndPassword(email, password)
            : auth.signInWithEmailAndPassword(email, password);

        authRequest
            .then((credential) => {
                cc.log("[Auth] Auth success");

                if (this.mode === "login" && credential.user) {
                    let savedUsername = credential.user.displayName || "";

                    if (!this.isSameUsername(username, savedUsername)) {
                        cc.log("[Auth] username mismatch:", username, savedUsername);
                        return auth.signOut().then(() => {
                            throw { code: "auth/invalid-username" };
                        });
                    }
                }

                if (this.mode === "signup" && credential.user) {
                    return credential.user.updateProfile({ displayName: username });
                }
            })
            .then(() => {
                this.showMessage(this.mode === "signup" ? "Account created" : "Login success");
                cc.director.loadScene("LevelSelect");
            })
            .catch((error) => {
                console.log(error);
                this.showMessage(this.getAuthErrorMessage(error));
            });
    }

    private getFirebaseAuth() {
        let firebaseApp = (window as any).firebase;

        if (!firebaseApp || typeof firebaseApp.auth !== "function") {
            cc.error("[Auth] Firebase SDK is not loaded");
            this.showMessage("Authentication unavailable");
            return null;
        }

        return firebaseApp.auth();
    }

    private getAuthErrorMessage(error: any): string {
        let code = error && error.code ? error.code : "";
        let rawMessage = error && error.message ? error.message : "";

        if (code === "auth/invalid-username") {
            return "Invalid username";
        }

        if (rawMessage.indexOf("INVALID_LOGIN_CREDENTIALS") !== -1 ||
            code === "auth/invalid-login-credentials" ||
            code === "auth/user-not-found" ||
            code === "auth/wrong-password") {
            return this.mode === "login" ? "Sign up first or check password" : "Invalid email or password";
        }

        if (code === "auth/invalid-email") {
            return "Invalid email";
        }

        if (code === "auth/missing-password") {
            return "Enter password";
        }

        if (code === "auth/email-already-in-use") {
            return "Email already in use";
        }

        if (code === "auth/weak-password") {
            return "Password is too weak";
        }

        if (code === "auth/too-many-requests") {
            return "Too many attempts";
        }

        if (code === "auth/operation-not-allowed") {
            return "Enable Email/Password sign-in";
        }

        return this.mode === "signup" ? "Sign up failed" : "Login failed";
    }

    private isSameUsername(inputUsername: string, savedUsername: string): boolean {
        return this.normalizeUsername(inputUsername) === this.normalizeUsername(savedUsername);
    }

    private normalizeUsername(username: string): string {
        return (username || "").trim().toLowerCase();
    }

    private showMessage(msg: string) {
        let displayMsg = msg
            .toUpperCase()
            .replace(/[^A-Z0-9! ]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (displayMsg === "") {
            displayMsg = "AUTH ERROR";
        }

        cc.log("[Auth Message]", displayMsg);

        let label = this.message || this.messageLabel;
        if (!label) {
            let messageNode = this.node.getChildByName("Message");
            label = messageNode ? messageNode.getComponent(cc.Label) : null;
        }

        if (label) {
            label.string = displayMsg;
        }
    }
}
