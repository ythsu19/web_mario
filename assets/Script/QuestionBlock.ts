import Player from "./Player";

const { ccclass, property } = cc._decorator;

@ccclass
export default class QuestionBlock extends cc.Component {

    @property(cc.Node)
    mushroom: cc.Node = null;

    @property
    mushroomSpeed: number = -100;

    @property(cc.Node)
    player: cc.Node = null;

    @property(cc.TiledMap)
    tileMap: cc.TiledMap = null;

    @property
    layerName: string = "圖塊層 1";

    @property
    usedGID: number = 252; // 這裡填你想變成的方塊 GID

    @property(cc.AudioClip)
    powerUpAppearSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    powerUpSfx: cc.AudioClip = null;

    @property
    sfxVolume: number = 1;

    private used: boolean = false;
    private mushroomMoving: boolean = false;
    private mushroomRb: cc.RigidBody = null;
    private questionLeftGID: number = 166;
    private questionRightGID: number = 167;
    private usedRightGID: number = 253;

    onBeginContact(contact, selfCollider, otherCollider) {
        cc.log("=== QuestionBlock onBeginContact 開始 ===");
        cc.log("self =", selfCollider.node.name);
        cc.log("other =", otherCollider.node.name);
        cc.log("used =", this.used);

        if (this.used) return;

        if (otherCollider.node.name !== "Player") {
            cc.log("不是 Player，return");
            return;
        }

        if (!this.isHitFromBottom(contact, selfCollider, otherCollider)) {
            cc.log("不是從問號下緣撞，return");
            return;
        }

        cc.log("成功從問號下緣撞");

        this.used = true;

        try {
            this.changeQuestionBlockToUsedBlock(selfCollider);
        } catch (e) {
            cc.log("換方塊失敗：", e);
        }

        this.releaseMushroom();
    }

    changeQuestionBlockToUsedBlock(selfCollider?: cc.Collider) {
        cc.log("進入 changeQuestionBlockToUsedBlock");

        if (!this.tileMap) {
            cc.log("tileMap 沒有接");
            return;
        }

        let layer = this.tileMap.getLayer(this.layerName);

        if (!layer) {
            cc.log("找不到圖層：", this.layerName);
            return;
        }

        let worldPos = this.getBlockWorldPosition(selfCollider);
        let mapPos = this.tileMap.node.convertToNodeSpaceAR(worldPos);

        let tileSize = this.tileMap.getTileSize();
        let mapSize = this.tileMap.getMapSize();

        let x = Math.floor((mapPos.x + this.tileMap.node.width * this.tileMap.node.anchorX) / tileSize.width);
        let y = mapSize.height - 1 - Math.floor((mapPos.y + this.tileMap.node.height * this.tileMap.node.anchorY) / tileSize.height);

        cc.log("mapPos =", mapPos.x, mapPos.y);
        cc.log("rough tile x y =", x, y);
        cc.log("mapSize =", mapSize.width, mapSize.height);

        let tile = this.findNearestQuestionTile(layer, x, y, mapSize);

        if (!tile) {
            cc.log("找不到 166/167 問號磚，停止換圖");
            return;
        }

        let leftX = tile.gid === this.questionRightGID ? tile.x - 1 : tile.x;
        let rightX = leftX + 1;
        let tileY = tile.y;

        let oldLeftGID = this.isInsideMap(leftX, tileY, mapSize) ? layer.getTileGIDAt(leftX, tileY) : 0;
        let oldRightGID = this.isInsideMap(rightX, tileY, mapSize) ? layer.getTileGIDAt(rightX, tileY) : 0;

        cc.log("tile x y =", leftX, tileY);
        cc.log("old GID =", oldLeftGID, oldRightGID);
        cc.log("new GID =", this.usedGID, this.usedRightGID);
        let topY = tileY - 1;

        // 四格一起換
        layer.setTileGIDAt(209, leftX, topY);             // 左上
        layer.setTileGIDAt(210, leftX + 1, topY);         // 右上
        layer.setTileGIDAt(252, leftX, topY + 1);         // 左下
        layer.setTileGIDAt(253, leftX + 1, topY + 1);     // 右下
        let afterLeftGID = this.isInsideMap(leftX, tileY, mapSize) ? layer.getTileGIDAt(leftX, tileY) : 0;
        let afterRightGID = this.isInsideMap(rightX, tileY, mapSize) ? layer.getTileGIDAt(rightX, tileY) : 0;

        cc.log("after GID =", afterLeftGID, afterRightGID);
    }

    private getBlockWorldPosition(selfCollider?: cc.Collider): cc.Vec2 {
        let collider: any = selfCollider || this.getComponent(cc.PhysicsBoxCollider);
        let offset = collider && collider.offset ? collider.offset : cc.v2(0, 0);

        return this.node.convertToWorldSpaceAR(offset);
    }

    private isHitFromBottom(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider): boolean {
        let bounds = this.getBoxWorldBounds(selfCollider);
        if (!bounds) return false;

        let playerCenter = otherCollider.node.convertToWorldSpaceAR(cc.v2(0, 0));
        let playerTop = otherCollider.node.convertToWorldSpaceAR(
            cc.v2(0, otherCollider.node.height * Math.abs(otherCollider.node.scaleY) / 2)
        );

        let centerUnderBlock = playerCenter.y < bounds.bottom;
        let centerInsideBlockWidth = playerCenter.x >= bounds.left + 2 && playerCenter.x <= bounds.right - 2;
        let headTouchesBottom = playerTop.y >= bounds.bottom - 10 && playerTop.y <= bounds.bottom + 14;

        if (centerUnderBlock && centerInsideBlockWidth && headTouchesBottom) {
            return true;
        }

        let worldManifold = contact.getWorldManifold();
        if (!worldManifold) return false;

        let points = worldManifold.points || [];
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let hitBottomY = point.y >= bounds.bottom - 10 && point.y <= bounds.bottom + 10;
            let hitInsideX = point.x >= bounds.left - 2 && point.x <= bounds.right + 2;

            if (centerUnderBlock && hitBottomY && hitInsideX) {
                return true;
            }
        }

        return false;
    }

    private getBoxWorldBounds(collider: cc.PhysicsCollider): any {
        let box: any = collider;
        let offset = box.offset || box._offset || cc.v2(0, 0);
        let size = box.size || box._size || cc.size(this.node.width, this.node.height);
        if (!size) return null;

        let center = collider.node.convertToWorldSpaceAR(offset);
        let halfWidth = size.width * Math.abs(collider.node.scaleX) / 2;
        let halfHeight = size.height * Math.abs(collider.node.scaleY) / 2;

        return {
            left: center.x - halfWidth,
            right: center.x + halfWidth,
            bottom: center.y - halfHeight,
            top: center.y + halfHeight
        };
    }

    private findNearestQuestionTile(layer: cc.TiledLayer, startX: number, startY: number, mapSize: cc.Size): any {
        let best = null;
        let bestDistance = Number.MAX_VALUE;

        for (let y = 0; y < mapSize.height; y++) {
            for (let x = 0; x < mapSize.width; x++) {
                let gid = layer.getTileGIDAt(x, y);

                if (gid !== this.questionLeftGID && gid !== this.questionRightGID) {
                    continue;
                }

                let distance = Math.abs(x - startX) + Math.abs(y - startY);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = { x: x, y: y, gid: gid };
                }
            }
        }

        return best;
    }

    private isInsideMap(x: number, y: number, mapSize: cc.Size): boolean {
        return x >= 0 && x < mapSize.width && y >= 0 && y < mapSize.height;
    }

    releaseMushroom() {
        if (!this.mushroom) {
            cc.log("mushroom 沒有接");
            return;
        }

        this.mushroom.active = true;

        this.mushroomRb = this.mushroom.getComponent(cc.RigidBody);

        if (!this.mushroomRb) {
            cc.log("mushroom 沒有 RigidBody");
            return;
        }

        this.mushroomMoving = false;

        this.mushroomRb.type = cc.RigidBodyType.Static;
        this.mushroomRb.gravityScale = 0;
        this.mushroomRb.linearVelocity = cc.v2(0, 0);

        let startY = this.mushroom.y;
        this.playSfx(this.powerUpAppearSfx);

        cc.tween(this.mushroom)
            .to(0.4, { y: startY + 32 })
            .call(() => {
                this.mushroomRb.type = cc.RigidBodyType.Dynamic;
                this.mushroomRb.gravityScale = 1;
                this.mushroomMoving = true;
                cc.log("蘑菇開始移動");
            })
            .start();
    }

    update(dt) {
        if (!this.mushroomMoving) return;
        if (!this.mushroomRb) return;

        let v = this.mushroomRb.linearVelocity;
        v.x = this.mushroomSpeed;
        this.mushroomRb.linearVelocity = v;

        if (this.player && this.mushroom && this.mushroom.active) {

            let mushroomWorldPos = this.mushroom.convertToWorldSpaceAR(cc.v2(0, 0));
            let playerWorldPos = this.player.convertToWorldSpaceAR(cc.v2(0, 0));

            let distance = mushroomWorldPos.sub(playerWorldPos).mag();

            if (distance < 40) {

                let playerScript = this.player.getComponent(Player);

                if (playerScript) {

                    playerScript.becomeBig();

                    // 播放吃蘑菇音效
                    playerScript["playSfx"](playerScript.powerUpSfx);

                    playerScript["uiManager"].addScore(1000);

                    playerScript.showScoreImage(
                        1000,
                        this.mushroom.convertToWorldSpaceAR(cc.v2(0, 0))
                    );
                }

                this.mushroom.active = false;
                this.mushroomMoving = false;
            }
        }
    }

    private playSfx(clip: cc.AudioClip) {
        if (!clip) return;

        let audioId = cc.audioEngine.playEffect(clip, false);
        cc.audioEngine.setVolume(audioId, this.sfxVolume);
    }
}
