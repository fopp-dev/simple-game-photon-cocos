cc.Class({
    extends: cc.Component,

    gameServer: null,
    EVENTCODE: null,
    isCreate: false,
    readyOtherPlayers: 0,
    otherPlayers: null,
    spidersArray: null,
    myDropNr: 0,
    mybulletNr: 0,
    playableRect:null,
    spawnRect:null,
    myPlayer:null,
    flagNodes:null,
    collectedFlags:null,
    isLoadTilemap: false,
    isMissionStart: false,
    //////////////////////////////// added by me.
    mapType: 0,
    holeType: 0,
    freezeType: 0,
    charType: 0,
    mapCount: 0,
    charCount: 0,
    freezeCount: 0,
    holeCount: 0,
    ////////////////////////////////////
    properties: {
        camera: {
            default: null,
            type: cc.Camera
        },
        graphics: {
            default: null,
            type: cc.Graphics
        },
        terrain: {
            default: null,
            type: cc.Node,
        },
        playerPrefab: {
            default: null,
            type: cc.Prefab
        },
        playerRedPrefab: {
            default: null,
            type: cc.Prefab
        },
        bulletPrefab: {
            default: null,
            type: cc.Prefab
        },
        bulletRedPrefab: {
            default: null,
            type: cc.Prefab
        },
        mineralPrefab: {
            default: null,
            type: cc.Prefab,
        },
        mineralTextures: {
            default: [],
            type: [cc.SpriteFrame]
        },
        mineralBar: {
            default: null,
            type:cc.ProgressBar,
        },
        mineralValue: {
            default: null,
            type:cc.Label,
        },
        flagsValueLabel: {
            default: null,
            type: cc.Label
        },
        capturedValueLabel : {
            default: null,
            type: cc.Label
        },
        flagPrefab: {
            default: null,
            type: cc.Prefab
        },
        flagTextures: {
            default: [],
            type: [cc.SpriteFrame]
        },
        waitingLabel: {
            default: null,
            type: cc.Label
        },
        dronePrefab: {
            default: null,
            type: cc.Prefab
        },
        spiderPrefab: {
            default: null,
            type: cc.Prefab
        },
        towerPrefab: {
            default: null,
            type: cc.Prefab
        },
        inventoryUI: {
            default: null,
            type: cc.Node
        },
        notifyManager: {
            default: null,
            type: cc.Node
        }
    },

    // use this for initialization
    onLoad: function () {
        this.EVENTCODE = {GameStart:1, Ready:2, MissionStart:3,
                        MineralsDispatch:4, FlagsDispatch: 5, PlayerSpawn:6,
                        PlayerMove:7, PlayerShoot:8, PlayerCollet:9, PlayerFreeze:10, BulletRemove:11, MineralDrop:12,
                        GrabFlag:13, DropFlag:14, CollectFlag:15, RecollectMyFlag:16, PlayerDead: 17,
                        SpawnDrone:18, SpawnSpider:19, SpawnTower:20, UnderSurveillacne: 21, MapInfo: 22};

        var networkComponent = cc.find("NetworkController").getComponent("NetworkController");
        networkComponent.signalConnected = null;
        networkComponent.signalRoomChange = null;
        networkComponent.signalError = this.onNetworkError.bind(this);
        networkComponent.signalEvent = this.onNetworkEvent.bind(this);
        networkComponent.signalActorLeave = this.onActorLeave.bind(this);

        // initialize member variables
        this.gameServer = networkComponent.getGameServer();
        this.isCreate = networkComponent.isCreate;
        this.readyOtherPlayers = this.gameServer.myRoomActorCount()-1;
        this.otherPlayers = [];
        this.spidersArray = [];
        this.mybulletNr = 0;
        this.playableRect = [];
        this.myDropNr = 0;
        this.flagNodes = [];
        this.myPlayer = null;
        this.collectedFlags = [0,0,0,0];
      
        this.waitingLabel.node.active = true;


        if(this.isCreate) {
            this.mapType = 1;            // select map type.
            this.onLoadTileMap("map/tilemap_"+ this.mapType +"/TerrainMap");
        }
        ////////////////////////////////////////////////////////////////////////


        // enable collision detection
        var manager = cc.director.getCollisionManager();
        manager.enabled = true;
        // manager.enabledDebugDraw = true;
        // manager.enabledDrawBoundingBox = true;

        this.mineralBar.node.x = -cc.winSize.width/2+this.mineralBar.node.width;
        this.mineralBar.node.y = cc.winSize.height/2-20;

        this.terrain.on(cc.Node.EventType.MOUSE_DOWN, this.mouseClicked, this);
        // this.terrain.on(cc.Node.EventType.MOUSE_MOVE, function (event) {
            // if(this.myPlayer==null)
            //     return;
            // var p = this.camera.getScreenToWorldPoint(cc.v2(event.getLocationX(), event.getLocationY()));
            // this.graphics.clear();
            // this.graphics.moveTo(this.myPlayer.x, this.myPlayer.y);
            // this.graphics.lineTo(p.x, p.y);
            // this.graphics.stroke();
            // this.graphics.fill();
        // }, this);
    },
    ////////////////////////////////////////////////// i add it
    
    getRandomNum: function(n) {
        return Math.floor(Math.random()*n) + 1;
    },
    onLoadTileMap (url) {
        cc.loader.loadRes(url, cc.TiledMapAsset, (err, tmxAsset) => {
            if (err) {
                cc.error(err);
                return;
            }
            this.terrain.destroyAllChildren();
            var tileMap = this.terrain.addComponent(cc.TiledMap);
            tileMap.tmxAsset = tmxAsset;

            var comp = cc.find("/Inventory").getComponent("InventoryController");
            comp.cloneMap(tmxAsset);

            if(this.isCreate) {
                this.getRandomMapInfo();
                setTimeout(() => {
                    this.raiseMapinfoEvent();
                }, 5000);
            }              
            this.isLoadTilemap = true;
            this.start();

        });
    },

    getRandomMapInfo: function(){
        this.holeType = 1; // select hole type.
        this.freezeType = 2; // select freeze type.
        this.charType = 2;  // select character type.
    },
    raiseMapinfoEvent: function() {
        this.gameServer.raiseEvent(this.EVENTCODE.MapInfo, {mapType: this.mapType, charType: this.charType, holeType: this.holeType, freezeType: this.freezeType});
    },

    setMapInfo: function(charType, freezeType, holeType) {
        this.charType = charType;
        this.freezeType = freezeType;
        this.holeType = holeType;
    },
    ////////////////////////////////////////////////////////
    mouseClicked: function(event) {
        if(this.myPlayer==null) // when the player was dead.
            return;
        var p = this.camera.getScreenToWorldPoint(cc.v2(event.getLocationX(), event.getLocationY()));
        this.myPlayer.getComponent("PlayerController").shoot(p);
    },

    start: function() {
        if(this.isLoadTilemap && !this.isMissionStart) {
            this.loadTerrainObtacles();

            this.waitingLabel.node.active = true;
            this.waitingLabel.node.setPosition(0,0);
            if(this.isCreate) {
                this.gameServer.raiseEvent(this.EVENTCODE.GameStart, null);
                if(this.readyOtherPlayers==0) {
                    this.startMatch();
                    this.gameServer.raiseEvent(this.EVENTCODE.MissionStart, null);
                }
            } else {
                this.gameServer.raiseEvent(this.EVENTCODE.Ready, null);
            }
        }
    },

    startMatch: function() {
        this.isMissionStart = true;
        this.waitingLabel.node.active = false;
        
        if(this.isCreate===true) {
            this.gameServer.raiseEvent(this.EVENTCODE.MineralsDispatch, this.scatterItems());
        }

        this.gameServer.raiseEvent(this.EVENTCODE.FlagsDispatch, this.scatterFlags());
        var p = this.randPosInRect(this.spawnRect);

        // spawnPlayer must be called at last
        this.spawnPlayer(true, p).actorNr = this.gameServer.myActor().actorNr;
        this.gameServer.raiseEvent(this.EVENTCODE.PlayerSpawn, p);
        this.moveCamera(p);
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
    },

    clear: function() {
        var networkComponent = cc.find("NetworkController").getComponent("NetworkController");
        networkComponent.signalConnected = null;
        networkComponent.signalRoomChange = null;
        networkComponent.signalError = null;
        networkComponent.signalEvent = null;
        networkComponent.signalActorLeave = null;

        this.gameServer = null;
        this.isCreate = false;
        this.readyOtherPlayers = 0;
        this.otherPlayers = [];
        this.spidersArray = [];
        this.mybulletNr = 0;
        this.playableRect = [];
        this.myDropNr = 0;
        this.flagNodes = [];
        this.myPlayer = null;
        this.collectedFlags = [0,0,0,0];
    },

    loadTerrainObtacles: function() {
        // Read Play Area Boundary from the terrain map. This is not used currently.
        // this.terrain.getComponent(cc.TiledMap).getObjectGroup("RectObstacles").getObjects().forEach((rect, index, array)=>{
        //     var component = this.terrain.addComponent(cc.BoxCollider);
        //     component.offset = cc.v2(rect.x, rect.y);
        //     component.size = cc.v2(rect.width, rect.height);
        // });

        // Read Craters from the terrain map and add to scene
        this.terrain.getComponent(cc.TiledMap).getObjectGroup("Craters").getObjects().forEach((rect, index, array)=>{
            var node = new cc.Node("Crater-"+rect.name);
            node.parent = cc.director.getScene();
            node.group = "crater";
            node.actorNr = rect.name;
            var self = this;
            ///////////////////////////////////// place hole according to hole type.
            cc.loader.loadRes("image/crater_" + this.holeType, cc.SpriteFrame, function (err, spriteFrame) {
                var overlayNode = self.terrain.getChildByName("RegionOverlay");
                var tmp = new cc.Node();
                tmp.parent = overlayNode;
                tmp.addComponent(cc.Sprite).spriteFrame = spriteFrame;
                var p1 = self.terrain.convertToWorldSpace(cc.v2(rect.x, rect.y));
                tmp.x = p1.x+rect.width/2; tmp.y = p1.y-rect.height/2;
            });
            /////////////////////////////////////////////////////////////////////////////

            var p = this.terrain.convertToWorldSpace(cc.v2(rect.x, rect.y));
            node.x = p.x+rect.width/2; node.y = p.y-rect.height/2;
            var component = node.addComponent(cc.BoxCollider);
            component.offset = cc.v2(0, 0);
            component.size = cc.size(rect.width, rect.height);
        });

        // Read Playable Area from the terrain map. This is used to restrict spawning items and to restrict player move.
        this.terrain.getComponent(cc.TiledMap).getObjectGroup("PlayableArea").getObjects().forEach((rect, index, array)=>{
            var tmp = this.terrain.convertToWorldSpace(cc.v2(rect.x, rect.y));
            this.playableRect.push({x:tmp.x, y:tmp.y, width: rect.width, height: rect.height});
        });
    },

    randPosInRect: function(rect) {
        var x = rect.x+rect.width*Math.random();
        var y = rect.y-rect.height*Math.random();
        return cc.v2(x,y);
    },

    isInRect:function(rect, p) {
        if(rect.x<p.x && p.x<rect.x+rect.width && rect.y>p.y && p.y>rect.y-rect.height)
            return true;
        return false;
    },

    isInRectArray:function(rectArray, p) {
        var isInRect = false;
        for(var i = 0; i < rectArray.length; i++)
        if(rectArray[i].x<p.x && p.x<rectArray[i].x+rectArray[i].width && rectArray[i].y>p.y && p.y>rectArray[i].y-rectArray[i].height) {
            isInRect = true; break;
        }
        return isInRect;
    },

    getIndexOfPlayableRect: function(p) {
        var index = -1;
        for(var i = 0; i < this.playableRect.length; i++)
        if(this.playableRect[i].x<p.x && p.x<this.playableRect[i].x+this.playableRect[i].width && this.playableRect[i].y>p.y && p.y>this.playableRect[i].y-this.playableRect[i].height) {
            index = i; break;
        }
        return index;
    },


    scatterItems: function() {
        var items = [];
        var count = Math.floor(100 / this.playableRect.length);
        for(var i=0; i<count; i++)
        for(var j=0; j<this.playableRect.length; j++)
        {
            var p = this.terrain.convertToNodeSpaceAR(cc.v2(this.playableRect[j].x, this.playableRect[j].y));
            var inTerrainPos = this.randPosInRect({x:p.x, y:p.y, width:this.playableRect[j].width, height:this.playableRect[j].height});
            //var worldPos = this.terrain.convertToWorldSpaceARAR(inTerrainPos);
            var typeNr = Math.floor(Math.random()*3);
            var name = "mineral-"+i;
            this.spawnMineral(inTerrainPos,typeNr, name,false,false);
            items.push({x:inTerrainPos.x, y:inTerrainPos.y, type:typeNr, name:name});
        }

        return items;
    },

    scatterFlags: function() {
        // Read SpawnArea from the terrain map and spawn flags
        var flagsInfo = [];
        this.terrain.getComponent(cc.TiledMap).getObjectGroup("SpawnArea").getObjects().forEach((rect, index, array) => {
            if(rect.name==this.gameServer.myActor().actorNr){
                var p = this.terrain.convertToWorldSpace(cc.v2(rect.x, rect.y));
                var tempRect = {};
                tempRect.x = p.x;
                tempRect.y = p.y;
                tempRect.width = rect.width;
                tempRect.height = rect.height;

                if(rect.name==this.gameServer.myActor().actorNr)
                    this.spawnRect = tempRect

                // Spwan flags
                for(var i=0; i<3; i++) {
                    var worldPos = this.randPosInRect(tempRect);
                    var nodeName = "flag-"+rect.name+"-"+i;
                    var flagNode = this.spawnFlag(worldPos, rect.name, nodeName);
                    flagsInfo.push(flagNode);
                }

                // my base region
                var node = new cc.Node("Base-"+rect.name);
                node.parent = cc.director.getScene();
                node.group = "base";
                node.actorNr = rect.name;
                node.x = p.x+rect.width/2; node.y = p.y-rect.height/2;
                var component = node.addComponent(cc.BoxCollider);
                component.offset = cc.v2(0, 0);
                component.size = cc.size(rect.width, rect.height);
            }
        });

        return flagsInfo;
    },

    spawnPlayer: function(isPlayer, worldPos) {
        var node = null;
        // select character with type.
        if(this.charType == 1)
            node = cc.instantiate(this.playerPrefab);
        else if(this.charType == 2)
            node = cc.instantiate(this.playerRedPrefab);

        node.getComponent("PlayerController").isPlayer=isPlayer;
        node.parent = cc.director.getScene();
        node.setPosition(worldPos);

        if(isPlayer==true)
            this.myPlayer = node;
        return node;
    },

    spawnFlag: function(worldPos, type, nodeName) {
        var node = cc.instantiate(this.flagPrefab);
        node.actorNr=type;
        node.getComponent(cc.Sprite).spriteFrame = this.flagTextures[parseInt(type)-1];
        node.parent = cc.director.getScene();
        node.setPosition(worldPos);
        node.name = nodeName;
        node.orgPos = worldPos;
        this.flagNodes[nodeName] = node;
        return {x:worldPos.x, y:worldPos.y, type:type, name:nodeName}
    },

    spawnMineral: function(terrainPos, typeNr, name, isDrop, toNet) {
        var node = cc.instantiate(this.mineralPrefab);
        node.children[0].getComponent(cc.Sprite).spriteFrame = this.mineralTextures[typeNr];
        node.name = name;

        node.parent = this.terrain;
        node.setPosition(terrainPos);

        if(isDrop) {
            if(toNet===true)
                node.name = "mineral-"+this.gameServer.myActor().actorNr+"-"+(this.myDropNr++);
            node.children[0].getComponent(cc.Animation).play("drop");
            node.children[0].getComponent(cc.CircleCollider).enabled = false;
        }

        if(toNet) {
            this.gameServer.raiseEvent(this.EVENTCODE.MineralDrop, {x:terrainPos.x, y:terrainPos.y, type:typeNr, name:node.name, drop:isDrop});
        }

        return node;
    },

    setMineralMax: function(max) {
        this.mineralBar.totalLength = max;
    },
    setMineral: function(value) {
      if(value==0)
          this._playerDead(this.gameServer.myActor().actorNr);
        this.mineralBar.progress = value/this.mineralBar.totalLength;
        this.mineralBar.node.getChildByName("value").getComponent(cc.Label).string = value;
    },

    moveCamera: function(pos) {
        var refinedPos = cc.v2(pos.x, pos.y);
        refinedPos.x = Math.max(this.terrain.x-this.terrain.width/2+cc.winSize.width/2,refinedPos.x);
        refinedPos.x = Math.min(this.terrain.x+this.terrain.width/2-cc.winSize.width/2,refinedPos.x);
        refinedPos.y = Math.max(this.terrain.y-this.terrain.height/2+cc.winSize.height/2,refinedPos.y);
        refinedPos.y = Math.min(this.terrain.y+this.terrain.height/2-cc.winSize.height/2,refinedPos.y);
        this.camera.node.setPosition(refinedPos);
        this.mineralBar.node.setPosition(-cc.winSize.width/2+refinedPos.x+250, cc.winSize.height/2+refinedPos.y-30);
        this.waitingLabel.node.setPosition(refinedPos.x, refinedPos.y);
        this.inventoryUI.setPosition(refinedPos.x, refinedPos.y);
        this.notifyManager.setPosition(-cc.winSize.width/2+refinedPos.x+20, refinedPos.y-cc.winSize.height/2+30);
    },

    spawnBullet: function(pos, angle) {
        var name = "actor-"+this.gameServer.myActor().actorNr+"-"+(this.mybulletNr++);
        this._spawnBullet(pos, angle, name);
        this.gameServer.raiseEvent(this.EVENTCODE.PlayerShoot, {pos:pos, angle:angle, name:name});
    },

    _spawnBullet: function(pos, angle, name) {
        var node = null;
        // select bullet with freeze type.
        if(this.freezeType == 1)
            node = cc.instantiate(this.bulletPrefab);
        else if(this.freezeType == 2)
            node = cc.instantiate(this.bulletRedPrefab);
        var scene = cc.director.getScene();
        node.parent = scene;
        node.setPosition(pos);
        node.angle = angle;
        node.name = name;

        var component = node.getComponent("LaserController");
        component.go();
    },

    collectMineral: function(mineral, tosend) {
        if(tosend===true) {
            this.gameServer.raiseEvent(this.EVENTCODE.PlayerCollet, mineral.name);
            mineral.destroy();
        } else {
            cc.find("TerrainMap/"+mineral).destroy();
        }
    },

    freezePlayer: function(player_or_tosend) {
        if(player_or_tosend===true)
            this.gameServer.raiseEvent(this.EVENTCODE.PlayerFreeze, null);
        else
            this.otherPlayers[player_or_tosend].getComponent("PlayerController").onFreeze();
    },

    bulletDestroy: function(bullet, tosend) {
        try {
            if(tosend===true){
                this.gameServer.raiseEvent(this.EVENTCODE.BulletRemove, bullet.name);
                bullet.destroy();
            } else {
                cc.find(bullet).destroy();
            }
        } catch (error) {
            console.log(error)
        }
    },

    checkPlayersContact: function(pvx, pvy) {
        for(var i in this.otherPlayers){
            if(this.otherPlayers[i]==null)
                continue;
            var d = cc.v2(this.otherPlayers[i].x-pvx, this.otherPlayers[i].y-pvy);
            if(d.len()<50)
                return d;
        }
        return null;
    },

    checkSpidersContact: function(pvx, pvy) {
        for(var i in this.spidersArray){
            if(this.spidersArray[i]==null)
                continue;
            var d = cc.v2(this.spidersArray[i].x-pvx, this.spidersArray[i].y-pvy);
            if(d.len()<50)
                return d;
        }
        return null;
    },

    grabFlag: function(flagNode) {
        this._grabFlag(flagNode.name,this.myPlayer);
        this.gameServer.raiseEvent(this.EVENTCODE.GrabFlag, flagNode.name);
    },

    _grabFlag: function(flagName, playerNode) {
        var flagNode = this.flagNodes[flagName];
        flagNode.parent = playerNode;
        flagNode.setPosition(0,0);
        flagNode.getComponent(cc.BoxCollider).enabled = false;
    },

    dropFlag: function(flagNode) {
        this._dropFlag(flagNode.name, this.myPlayer);
        this.gameServer.raiseEvent(this.EVENTCODE.DropFlag, flagNode.name);
    },

    _dropFlag: function(flagName, playerNode) {
        var node = this.flagNodes[flagName];
        node.parent = cc.director.getScene();
        node.setPosition(playerNode.x, playerNode.y);
        cc.tween(node).parallel(cc.tween().by(0.3,{x:30}), cc.tween().by(0.3,{y:20},{easing:'quartOut'}))
                      .parallel(cc.tween().by(0.3,{x:30}), cc.tween().by(0.3,{y:-40},{easing:'quartIn'}))
                      .call(()=>{node.getComponent(cc.BoxCollider).enabled = true;}).start();
    },

    recollectMyFlag: function(flagNode) {
        this._recollectMyFlag(flagNode.name, this.myPlayer);
        this.gameServer.raiseEvent(this.EVENTCODE.RecollectMyFlag, flagNode.name);
    },

    _recollectMyFlag: function(flagName, playerNode) {
        var node = this.flagNodes[flagName];
        node.parent = cc.director.getScene();
        node.setPosition(playerNode.x, playerNode.y);
        cc.tween(node).to(0.3,{position:node.orgPos}).call(()=>{node.getComponent(cc.BoxCollider).enabled = true;}).start();
    },

    collectFlag: function(flagNode) {
        this._collectFlag(flagNode.name);
        this.capturedValueLabel.string = parseInt(this.capturedValueLabel.string)+1
        this.gameServer.raiseEvent(this.EVENTCODE.CollectFlag, flagNode.name);
    },

    _collectFlag: function(flagName) {
        var flagNode = this.flagNodes[flagName];
        flagNode.parent = cc.director.getScene();
        flagNode.active = false;

        this.collectedFlags[flagNode.actorNr]++;
        this.flagsValueLabel.string = 3-this.collectedFlags[this.gameServer.myActor().actorNr];

        if(flagNode.actorNr==this.gameServer.myActor().actorNr && this.collectedFlags[flagNode.actorNr]==3)
            //this.playerDead(flagNode.actorNr);
            this._playerDead(flagNode.actorNr);
    },

    /*
    playerDead: function(actorNr) {
        this.gameServer.raiseEvent(this.EVENTCODE.PlayerDead, actorNr);
        this._playerDead(actorNr);
    },
    */

    _playerDead: function(actorNr) {
        //if(this.gameServer.myActor().actorNr==actorNr) {
            this.gameServer.leaveRoom();
            this.waitingLabel.string = "You have lost all flags.";
            this.waitingLabel.node.active = true;
        //}
    },

    spawnDrone: function (pos) {
        this._spawnDrone(pos, this.gameServer.myActor().actorNr);
        this.gameServer.raiseEvent(this.EVENTCODE.SpawnDrone, {pos:pos, actorNr:this.gameServer.myActor().actorNr});
    },

    _spawnDrone: function(pos, actorNr) {
        var droneLife = 5*60;   // 5 mins
        var name = "drone"+actorNr;
        var node = cc.instantiate(this.dronePrefab);
        node.name = name;
        node.parent = this.terrain;
        node.setPosition(pos);
        node.actorNr = actorNr;
        cc.tween(node).delay(droneLife).call(()=>{node.destroy();}).start();
        return node;
    },

    spawnSpider: function (pos) {
        var tmp = this.getPosInPlayableRect(pos);
        this.spidersArray[this.gameServer.myActor().actorNr] = this._spawnSpider(tmp, this.gameServer.myActor().actorNr);
        this.gameServer.raiseEvent(this.EVENTCODE.SpawnSpider, {pos:tmp, actorNr:this.gameServer.myActor().actorNr});
    },
    getPosInPlayableRect: function(pos){
        var dx = 3;
        var tmpX = pos.x;
        while(!this.isInRectArray(this.playableRect, cc.v2(tmpX, pos.y))) {
            tmpX += dx;
            
        }
        return cc.v2(tmpX, pos.y);
    },
    _spawnSpider: function(pos, actorNr) {
        var name = "spider"+actorNr;
        var node = cc.instantiate(this.spiderPrefab);
        node.name = name;
        node.parent = this.terrain;
        node.setPosition(pos);
        node.actorNr = actorNr;
        return node;
    },

    spawnTower: function (pos) {
        this._spawnTower(pos, this.gameServer.myActor().actorNr);
        this.gameServer.raiseEvent(this.EVENTCODE.SpawnTower, {pos:pos, actorNr:this.gameServer.myActor().actorNr});
    },

    _spawnTower: function(pos, actorNr) {
        var name = "tower"+actorNr;
        var node = cc.instantiate(this.towerPrefab);
        node.name = name;
        node.parent = this.terrain;
        node.setPosition(pos);
        node.actorNr = actorNr;
        return node;
    },

    underSurveillance: function(observerActorNr, pos) {
        this.gameServer.raiseEvent(this.EVENTCODE.UnderSurveillacne, pos, {targetActors:[observerActorNr]});
    },

    _underSurveillance: function(pos, observableActorNr) {
        var str = this.gameServer.myRoomActors()[observableActorNr].customProperties["ActorName"];
        var angle = cc.misc.radiansToDegrees(cc.v2(pos.x-this.myPlayer.x, pos.y-this.myPlayer.y).normalize().signAngle(cc.v2(0,1))).toFixed(0);
        var oc = Math.round(angle/30);
        if(oc==0) oc=12;
        if(oc<0) oc += 12;
        str += " is at "+oc+" o'clock";
        this.notifyManager.getComponent("NotifyManager").addNotify(str);
    },

    onNetworkEvent: function(code, content, actorNr) {
        switch(code) {
        case this.EVENTCODE.Ready:
            this.readyOtherPlayers--;
            if(this.readyOtherPlayers==0) {
                this.startMatch();
                this.gameServer.raiseEvent(this.EVENTCODE.MissionStart, null);
            }
            break;
        case this.EVENTCODE.MissionStart:
            this.startMatch();
            break;
        case this.EVENTCODE.MineralsDispatch:
            for(var i=0; i<content.length; i++)
                this.spawnMineral(cc.v2(content[i].x,content[i].y), content[i].type, content[i].name, false, false);
            break;
        case this.EVENTCODE.FlagsDispatch:
            for(var i=0; i<content.length; i++)
                this.spawnFlag(cc.v2(content[i].x,content[i].y), content[i].type, content[i].name);
            break;
        case this.EVENTCODE.MineralDrop:
            this.spawnMineral(cc.v2(content.x,content.y), content.type, content.name, true, false);
            break;
        case this.EVENTCODE.PlayerSpawn:
            this.otherPlayers[actorNr] = this.spawnPlayer(false,cc.v2(content.x,content.y));
            this.otherPlayers[actorNr].actorNr = actorNr;
            this.otherPlayers[actorNr].getComponent("PlayerController").playerType = this.charType;
            this.otherPlayers[actorNr].getComponent("PlayerController").freezeType = this.freezeType;
            break;
        case this.EVENTCODE.PlayerMove:
            this.otherPlayers[actorNr].setPosition(content.x, content.y);
            var anim = this.otherPlayers[actorNr].getComponent(cc.Animation);
            if(anim.node.getComponent("PlayerController").otherPlayerInit || !anim.currentClip || anim.currentClip._name!=content.clip) {
                anim.play(content.clip);
                anim.setCurrentTime(content.time);
            }
            anim.node.getComponent("PlayerController").otherPlayerInit=true;
            if(content.clip=="" || content.playing==false)
                anim.stop();
            break;
        case this.EVENTCODE.PlayerShoot:
            this._spawnBullet(content.pos, content.angle, content.name);
            break;
        case this.EVENTCODE.PlayerCollet:
            this.collectMineral(content, false);
            break;
        case this.EVENTCODE.PlayerFreeze:
            this.freezePlayer(actorNr);
            break;
        case this.EVENTCODE.BulletRemove:
            this.bulletDestroy(content,false);
            break;
        case this.EVENTCODE.GrabFlag:
            this._grabFlag(content, this.otherPlayers[actorNr]);
            break;
        case this.EVENTCODE.DropFlag:
            this._dropFlag(content, this.otherPlayers[actorNr]);
            break;
        case this.EVENTCODE.CollectFlag:
            this._collectFlag(content);
            break;
        case this.EVENTCODE.RecollectMyFlag:
            this._recollectMyFlag(content, this.otherPlayers[actorNr]);
            break;
        /*
        case this.EVENTCODE.PlayerDead:
            this._playerDead(actorNr);
            break;
        */
        case this.EVENTCODE.SpawnDrone:
            this._spawnDrone(content.pos, actorNr);
            break;
        case this.EVENTCODE.SpawnSpider:
            this.spidersArray[actorNr] = this._spawnSpider(content.pos, actorNr);
            break;
        case this.EVENTCODE.SpawnTower:
            this._spawnTower(content.pos, actorNr);
            break;
        case this.EVENTCODE.UnderSurveillacne:
            this._underSurveillance(content, actorNr);
            break;
        case this.EVENTCODE.MapInfo:
            this.onLoadTileMap("map/tilemap_"+ content.mapType +"/TerrainMap");
            this.setMapInfo(content.charType, content.freezeType, content.holeType);
        }
    },

    onNetworkError: function(errorCode, errorMsg) {
        //
    },

    onActorLeave: function(actor, cleanup) {
        if(actor.actorNr==this.myPlayer.actorNr) {
            this.myPlayer.destroy();
            this.myPlayer = null;
            this.clear();
        } else {
            this.otherPlayers[actor.actorNr].destroy();
            this.otherPlayers[actor.actorNr] = null;
        }
        //this.otherPlayers.splice(actor.actorNr,1);
    },

    toggleInventory: function() {
        var comp = cc.find("/Inventory").getComponent("InventoryController");
        
        if(comp.dialogOpened==true) {
            comp.closeDialog();
            this.terrain.on(cc.Node.EventType.MOUSE_DOWN, this.mouseClicked, this);
        } else {
            this.terrain.off(cc.Node.EventType.MOUSE_DOWN, this.mouseClicked, this);
            comp.openDialog();
        }
    },

    placeItems: function(items, inventory) {
        for(var x in items) {
            switch(parseInt(x)) {
                case inventory.itemType.DRONE:
                    this.spawnDrone(items[x].pos);
                    break;
                case inventory.itemType.SPIDER:
                    this.spawnSpider(items[x].pos);
                    break;
                case inventory.itemType.TOWER:
                    this.spawnTower(items[x].pos);
                    break;
            }
        }
        this.terrain.on(cc.Node.EventType.MOUSE_DOWN, this.mouseClicked, this);
    }
});
