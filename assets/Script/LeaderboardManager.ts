const { ccclass, property } = cc._decorator;

interface LeaderboardEntry {
    name: string;
    score: number;
    baseScore?: number;
    time?: number;
    date?: number;
}

@ccclass
export default class LeaderboardManager extends cc.Component {

    @property(cc.AudioClip)
    bgm: cc.AudioClip = null;

    @property(cc.Font)
    customFont: cc.Font = null;

    @property(cc.Node)
    labelTemplate: cc.Node = null;

    @property
    bgmVolume: number = 0.6;

    private inputReady: boolean = false;
    private readonly storageKey: string = "webMarioLeaderboard";

    onLoad() {
        this.playBgm();
        this.createView();
        this.bindInput();

        this.scheduleOnce(() => {
            this.inputReady = true;
        }, 0.4);
    }

    onDestroy() {
        this.unbindInput();
    }

    private createView() {
        this.node.removeAllChildren();
        this.createLabel("LEADERBOARD", 0, 230, 46, cc.Color.YELLOW);
        this.createLabel("RANK   PLAYER              SCORE", 0, 160, 24, cc.Color.WHITE);

        let entries = this.getEntries();

        if (entries.length === 0) {
            this.createLabel("NO SCORES YET", 0, 70, 28, cc.Color.WHITE);
        }
        else {
            for (let i = 0; i < Math.min(entries.length, 10); i++) {
                let entry = entries[i];
                let rank = (i + 1).toString().padStart(2, "0");
                let name = this.fitName(entry.name || "PLAYER", 14);
                let score = Math.floor(entry.score || 0).toString().padStart(6, "0");
                let text = rank + "     " + name.padEnd(14, " ") + "     " + score;
                let color = i === 0 ? cc.Color.YELLOW : cc.Color.WHITE;

                this.createLabel(text, 0, 115 - i * 34, 24, color);
            }
        }
        this.createLabel("PRESS ENTER TO CONTINUE", 0, -285, 20, cc.Color.WHITE);
    }

    private createLabel(text: string, x: number, y: number, fontSize: number, color: cc.Color) {
        let node = cc.instantiate(this.labelTemplate);

        node.parent = this.node;
        node.active = true;
        node.setPosition(x, y);
        node.color = color;

        let label = node.getComponent(cc.Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        return label;
    }

    private getEntries(): LeaderboardEntry[] {
        let raw = "";

        try {
            raw = window.localStorage.getItem(this.storageKey) || "[]";
        } catch (e) {
            raw = "[]";
        }

        let entries: LeaderboardEntry[] = [];

        try {
            entries = JSON.parse(raw);
        } catch (e) {
            entries = [];
        }

        if (!Array.isArray(entries)) {
            entries = [];
        }

        return this.keepBestScorePerPlayer(entries
            .filter(entry => entry && typeof entry.score === "number")
            .sort((a, b) => b.score - a.score))
            .slice(0, 10);
    }

    private keepBestScorePerPlayer(entries: LeaderboardEntry[]): LeaderboardEntry[] {
        let usedNames = {};
        let bestEntries: LeaderboardEntry[] = [];

        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            let key = (entry.name || "PLAYER").trim().toLowerCase();

            if (usedNames[key]) {
                continue;
            }

            usedNames[key] = true;
            bestEntries.push(entry);
        }

        return bestEntries;
    }

    private fitName(name: string, maxLength: number): string {
        let cleanName = (name || "PLAYER")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();

        if (cleanName === "") {
            cleanName = "PLAYER";
        }

        return cleanName.length > maxLength ? cleanName.slice(0, maxLength) : cleanName;
    }

    private bindInput() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.goToLevelSelect, this);
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.goToLevelSelect, this);
    }

    private unbindInput() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.node.off(cc.Node.EventType.TOUCH_START, this.goToLevelSelect, this);
        this.node.off(cc.Node.EventType.MOUSE_DOWN, this.goToLevelSelect, this);
    }

    private onKeyDown(event) {
        if (event.keyCode === cc.macro.KEY.enter ||
            event.keyCode === cc.macro.KEY.space) {
            this.goToLevelSelect();
        }
    }

    private goToLevelSelect() {
        if (!this.inputReady) return;

        cc.director.loadScene("LevelSelect");
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
