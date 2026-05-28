const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

    @property
    speed: number = 120;

    @property
    jumpForce: number = 650;

    @property(cc.SpriteFrame)
    idleSprite: cc.SpriteFrame = null;

    @property(cc.Node)
    uiManagerNode: cc.Node = null;

    @property(cc.Node)
    score200Node: cc.Node = null;

    @property(cc.Node)
    score1000Node: cc.Node = null;

    @property(cc.AudioClip)
    jumpSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    stompSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    powerDownSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    loseOneLifeSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    levelClearSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    powerUpSfx: cc.AudioClip = null;

    @property
    sfxVolume: number = 1;

    private uiManager: any = null;

    public isBig: boolean = false;
    public life: number = 1;

    private isDead: boolean = false;
    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    private sprite: cc.Sprite = null;

    private moveDir: number = 0;
    private canJump: boolean = false;
    private isInvincible: boolean = false;
    private isLevelCleared: boolean = false;
    private levelClearTransitionStarted: boolean = false;
    private groundColliders: cc.PhysicsCollider[] = [];
    private facingDir: number = 1;
    public score: number = 0;

    onLoad() {
        this.uiManager = this.uiManagerNode.getComponent("UIManager");
        this.uiManager.setLife(this.life);
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.sprite = this.getComponent(cc.Sprite);

        this.life = 1;
        this.isBig = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(dt) {
        if (this.isDead || this.isLevelCleared) return;

        if (this.node.y < -500) {
            cc.log("[fall] 玩家掉出地圖，直接死亡");
            this.die();
            return;
        }

        let velocity = this.rb.linearVelocity;
        velocity.x = this.moveDir * this.speed;
        this.rb.linearVelocity = velocity;

        if (this.moveDir < 0) {
            this.facingDir = -1;
        }
        else if (this.moveDir > 0) {
            this.facingDir = 1;
        }

        this.updateScale();
        this.canJump = this.checkGrounded();
        this.updateAnimation();
    }

    updateAnimation() {
        if (!this.anim) return;

        let walkState = this.anim.getAnimationState("PlayerWalk");
        let jumpState = this.anim.getAnimationState("PlayerJump");
        let isGrounded = this.isGrounded();

        if (!isGrounded) {
            if (walkState && walkState.isPlaying) {
                this.anim.stop("PlayerWalk");
            }

            if (jumpState && !jumpState.isPlaying) {
                this.anim.play("PlayerJump");
            }

            return;
        }

        if (jumpState && jumpState.isPlaying) {
            this.anim.stop("PlayerJump");
        }

        if (this.moveDir !== 0) {
            if (walkState && !walkState.isPlaying) {
                this.anim.play("PlayerWalk");
            }
        }
        else {
            if (walkState && walkState.isPlaying) {
                this.anim.stop("PlayerWalk");
            }

            if (this.sprite && this.idleSprite) {
                this.sprite.spriteFrame = this.idleSprite;
            }
        }
    }

    updateScale() {
        let size = this.isBig ? 1.5 : 1;

        this.node.scaleX = size * this.facingDir;
        this.node.scaleY = size;
    }

    becomeBig() {
        this.isBig = true;
        this.life = 2;
        this.uiManager.setLife(this.life);
        this.updateScale();

        cc.log("變大，生命:", this.life);
    }

    becomeSmall() {
        this.isBig = false;
        this.life = 1;
        this.uiManager.setLife(this.life);
        this.updateScale();

        cc.log("變小，生命:", this.life);
    }

    public die() {
        cc.log("[die] die() 被呼叫");

        if (this.isDead) {
            cc.log("[die] 已經死過了，return");
            return;
        }

        this.isDead = true;
        this.playSfx(this.loseOneLifeSfx);
        this.stopBgm();

        cc.log("[die] 準備切到 GameOver");
        cc.director.loadScene("GameOver", () => {
            cc.log("[die] 成功進入 GameOver");
        });
    }

    takeDamage() {
        cc.log("[takeDamage] 被攻擊");

        if (this.isInvincible) {
            cc.log("[takeDamage] 無敵中，return");
            return;
        }

        if (this.isDead) {
            cc.log("[takeDamage] 已死亡，return");
            return;
        }

        this.isInvincible = true;
        this.life--;

        cc.log("[takeDamage] 剩餘生命:", this.life);

        if (this.life <= 0) {
            cc.log("[takeDamage] 生命歸零，呼叫 die()");
            this.die();
            return;
        }

        cc.log("[takeDamage] 還沒死，變小");
        this.playSfx(this.powerDownSfx);
        this.becomeSmall();

        let velocity = this.rb.linearVelocity;
        velocity.x = 0;
        velocity.y = 700;
        this.rb.linearVelocity = velocity;

        this.scheduleOnce(() => {
            cc.log("[takeDamage] 無敵結束");
            this.isInvincible = false;
        }, 1);
    }

    onKeyDown(event) {
        if (this.isDead || this.isLevelCleared) return;

        switch (event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.moveDir = -1;
                break;

            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.moveDir = 1;
                break;

            case cc.macro.KEY.space:
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
                this.canJump = this.checkGrounded();

                if (this.canJump) {
                    let velocity = this.rb.linearVelocity;
                    velocity.y = this.jumpForce;
                    this.rb.linearVelocity = velocity;
                    this.canJump = false;
                    this.groundColliders = [];
                    this.playSfx(this.jumpSfx);
                }
                break;
        }
    }

    onKeyUp(event) {
        if (this.isDead || this.isLevelCleared) return;

        switch (event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                if (this.moveDir === -1) this.moveDir = 0;
                break;

            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                if (this.moveDir === 1) this.moveDir = 0;
                break;
        }
    }

    onBeginContact(contact, selfCollider, otherCollider) {

        cc.log("[contact] 碰到:", otherCollider.node.name);

        if (this.isDead || this.isLevelCleared) return;
        this.updateGroundContact(contact, selfCollider, otherCollider);

        if (otherCollider.node.name === "Enemy") {

            cc.log("[contact] 碰到 Enemy");

            if (this.node.y > otherCollider.node.y + 15) {

                let enemy = otherCollider.node.getComponent("Enemy");

                if (enemy) {
                    let killed = enemy.die();

                    if (killed) {
                        this.uiManager.addScore(200);
                        this.playSfx(this.stompSfx);

                        this.showScoreImage(
                            200,
                            otherCollider.node.convertToWorldSpaceAR(cc.v2(0, 0))
                        );
                    }
                }

                let velocity = this.rb.linearVelocity;
                velocity.y = this.jumpForce * 0.7;
                this.rb.linearVelocity = velocity;

                this.canJump = false;
                this.groundColliders = [];
            }
            else {
                cc.log("[contact] 從側邊碰到敵人，準備扣血");
                this.takeDamage();
            }

            return;
        }

        if (otherCollider.node.name === "Flag") {
            this.startLevelClear();
            return;
        }
    }

    public startLevelClear() {
        if (this.isLevelCleared || this.isDead) return;

        this.isLevelCleared = true;
        this.moveDir = 0;
        this.saveLeaderboardScore();
        if (this.uiManager && typeof this.uiManager.stopTimer === "function") {
            this.uiManager.stopTimer();
        }
        this.stopBgm();
        let levelClearAudioId = this.playSfx(this.levelClearSfx);

        if (this.rb) {
            let velocity = this.rb.linearVelocity;
            velocity.x = 0;
            this.rb.linearVelocity = velocity;
        }

        this.goToLevelClearedAfterJingle(levelClearAudioId, this.powerUpSfx, this.sfxVolume);
    }

    onPreSolve(contact, selfCollider, otherCollider) {
        if (this.isDead || this.isLevelCleared) return;

        this.updateGroundContact(contact, selfCollider, otherCollider);
    }

    onEndContact(contact, selfCollider, otherCollider) {
        this.removeGroundCollider(otherCollider);
    }

    showScoreImage(value: number, worldPos: cc.Vec2) {

        let template: cc.Node = null;

        if (value === 200) {
            template = this.score200Node;
        }
        else if (value === 1000) {
            template = this.score1000Node;
        }

        if (!template) return;

        // 複製節點
        let popup = cc.instantiate(template);

        // 放到場景
        this.node.parent.addChild(popup);

        // 世界座標轉本地座標
        let localPos = this.node.parent.convertToNodeSpaceAR(worldPos);

        popup.setPosition(localPos.x, localPos.y + 40);

        popup.active = true;
        popup.opacity = 255;

        cc.tween(popup)
            .by(0.5, { y: 40 })
            .to(0.3, { opacity: 0 })
            .call(() => {
                popup.destroy();
            })
            .start();
    }

    private playSfx(clip: cc.AudioClip): number {
        if (!clip) return -1;

        let audioId = cc.audioEngine.playEffect(clip, false);
        cc.audioEngine.setVolume(audioId, this.sfxVolume);

        return audioId;
    }

    private goToLevelClearedAfterJingle(levelClearAudioId: number, powerUpClip: cc.AudioClip, sfxVolume: number) {
        let goNext = () => {
            if (this.levelClearTransitionStarted) return;

            this.levelClearTransitionStarted = true;
            this.loadLevelClearedThenLeaderboard(powerUpClip, sfxVolume);
        };

        if (levelClearAudioId === -1) {
            goNext();
            return;
        }

        cc.audioEngine.setFinishCallback(levelClearAudioId, goNext);

        let duration = cc.audioEngine.getDuration(levelClearAudioId);
        this.scheduleOnce(goNext, duration && duration > 0 ? duration + 0.1 : 6.6);
    }

    private loadLevelClearedThenLeaderboard(powerUpClip: cc.AudioClip, sfxVolume: number) {
        cc.director.loadScene("LevelCleared", () => {
            Player.playClip(powerUpClip, sfxVolume);

            window.setTimeout(() => {
                cc.director.loadScene("Leaderboard");
            }, 1000);
        });
    }

    private saveLeaderboardScore() {
        if (!this.uiManager) return;

        let baseScore = typeof this.uiManager.getScore === "function" ? this.uiManager.getScore() : 0;
        let time = typeof this.uiManager.getTime === "function" ? this.uiManager.getTime() : 0;
        let finalScore = baseScore + time;
        let entry = {
            name: Player.getCurrentPlayerName(),
            score: finalScore,
            baseScore: baseScore,
            time: time,
            date: Date.now()
        };
        let storageKey = "webMarioLeaderboard";
        let entries = [];

        try {
            entries = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
        } catch (e) {
            entries = [];
        }

        if (!Array.isArray(entries)) {
            entries = [];
        }

        entries.push(entry);
        entries.sort((a, b) => (b.score || 0) - (a.score || 0));
        entries = this.keepBestScorePerPlayer(entries).slice(0, 10);

        try {
            window.localStorage.setItem(storageKey, JSON.stringify(entries));
        } catch (e) {
            cc.log("[leaderboard] save failed", e);
        }
    }

    private static getCurrentPlayerName(): string {
        let firebaseApp = (window as any).firebase;
        let user = firebaseApp && typeof firebaseApp.auth === "function"
            ? firebaseApp.auth().currentUser
            : null;
        let name = user && user.displayName ? user.displayName : "";

        if (!name) {
            try {
                name = window.localStorage.getItem("webMarioCurrentUsername") || "";
            } catch (e) {
                name = "";
            }
        }

        name = (name || "").trim();
        return name === "" ? "PLAYER" : name;
    }

    private keepBestScorePerPlayer(entries: any[]): any[] {
        let usedNames = {};
        let bestEntries = [];

        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            let rawName: string = entry && entry.name ? entry.name : "PLAYER";
            let key = rawName.trim().toLowerCase();

            if (usedNames[key]) {
                continue;
            }

            usedNames[key] = true;
            bestEntries.push(entry);
        }

        return bestEntries;
    }

    private static playClip(clip: cc.AudioClip, volume: number): number {
        if (!clip) return -1;

        let audioId = cc.audioEngine.playEffect(clip, false);
        cc.audioEngine.setVolume(audioId, volume);

        return audioId;
    }

    private isGrounded(): boolean {
        return this.canJump;
    }

    private checkGrounded(): boolean {
        if (!this.rb) return false;
        if (this.rb.linearVelocity.y > 50) return false;

        return this.groundColliders.length > 0;
    }

    private updateGroundContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.isGroundContact(contact, selfCollider, otherCollider)) {
            this.addGroundCollider(otherCollider);
        }
        else {
            this.removeGroundCollider(otherCollider);
        }
    }

    private isGroundContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider): boolean {
        if (!this.isJumpSurface(otherCollider)) return false;

        let worldManifold = contact.getWorldManifold();
        let normal = worldManifold ? worldManifold.normal : null;
        if (!normal) return false;

        let playerNormalY = (contact as any).colliderA === selfCollider ? -normal.y : normal.y;

        return playerNormalY > 0.5;
    }

    private isJumpSurface(collider: cc.PhysicsCollider): boolean {
        if (!collider || !collider.node) return false;
        if (collider.node === this.node) return false;
        if ((collider as any).sensor || (collider as any)._sensor) return false;

        let nodeName = collider.node.name;
        if (nodeName === "Enemy" || nodeName === "Flag" || nodeName === "Mushroom") {
            return false;
        }

        return true;
    }

    private addGroundCollider(collider: cc.PhysicsCollider) {
        if (this.groundColliders.indexOf(collider) !== -1) return;

        this.groundColliders.push(collider);
    }

    private removeGroundCollider(collider: cc.PhysicsCollider) {
        let index = this.groundColliders.indexOf(collider);
        if (index === -1) return;

        this.groundColliders.splice(index, 1);
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
