cc.Class({
    extends: cc.Component,
	
	direction: "",
	nkeys: null,
	gameController: null,
	freezeTime:0,
	freezeSprite: null,
	timeElapsed: null,
	netSyncInterval: null,
	otherPlayerInit: null,
	gunHeat:0.0,
	playerType: 0,
	freezeType: 0,

    properties: {
		mineral: 100,
		mineralMax: 300,
		freezePrefab: {
			default: null,
			type: cc.Prefab
		},
		freezeRedPrefab: {
			default: null,
			type: cc.Prefab
		},
		isPlayer: true,
    },

    // use this for initialization
    onLoad: function () {
		if(this.isPlayer==true) {
			cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
			cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
		}

		this.direction = "down";
		this.nkeys = {up:0, down:0, left:0, right:0};
		this.freezeTime = 0;
		this.freezeSprite = null;
		this.timeElapsed = 0.0;
		this.netSyncInterval = 0.02;
		this.otherPlayerInit = true;
		this.gunHeat = 0.0;
		
	},

	start: function() {
		if(!this.isPlayer)
			return;
		this.gameController = cc.find("GameController").getComponent("GameController");
		this.gameController.setMineralMax(this.mineralMax);
		this.gameController.setMineral(this.mineral);
		this.playerType = this.gameController.charType;
		this.freezeType = this.gameController.freezeType;
	},

/*    destroy: function () {
		super.destroy();
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },
*/	
    update: function (dt) {
		var dx=3, dy=3;
		this.timeElapsed += dt;

		if(this.isPlayer==true) {
			// move player according to key input
			if((this.nkeys.up>0 || this.nkeys.down>0 || this.nkeys.left>0 || this.nkeys.right>0) && this.freezeTime==0) {
				var pvx = this.node.x, pvy = this.node.y;
				if(this.direction=="up")
					pvy += dy;
				if(this.direction=="down")
					pvy -= dy;
				if(this.direction=="left")
					pvx -= dx;
				if(this.direction=="right")
					pvx += dx;
				// player move
				if(this.gameController.isInRectArray(this.gameController.playableRect,cc.v2(pvx, pvy)) &&
					this.gameController.checkPlayersContact(pvx, pvy)==null && this.gameController.checkSpidersContact(pvx, pvy)==null) {
					this.node.position = cc.v2(pvx,pvy);
					this.gameController.moveCamera(this.node.position);
				}
				
				// resolve when players contacted. this occures due to descret movement of the other player based on network latency

				var contact_d = this.gameController.checkPlayersContact(this.node.x, this.node.y);
				var index = this.gameController.getIndexOfPlayableRect(cc.v2(this.node.x, this.node.y));
				if(contact_d!=null&&index!=-1) {
					contact_d = contact_d.normalize();
					var x = this.clamp(this.node.x-contact_d.x*10, this.gameController.playableRect[index].x, this.gameController.playableRect[index].x+this.gameController.playableRect[index].width);
					var y = this.clamp(this.node.y-contact_d.y*10, this.gameController.playableRect[index].y-this.gameController.playableRect[index].height, this.gameController.playableRect[index].y);
					this.node.position = cc.v2(x,y);
					this.gameController.moveCamera(this.node.position);
				}
			} else {
				this.setMoveAnim("");
			}
		
			this.mineral = Math.max(this.mineral-dt,0);
			this.gameController.setMineral(this.mineral.toFixed(1));

			if(this.timeElapsed>this.netSyncInterval){
				this.timeElapsed = 0.0;
				var x = this.getAnimState();
				this.gameController.gameServer.raiseEvent(this.gameController.EVENTCODE.PlayerMove,
														{x:this.node.x, y:this.node.y, clip:x.name, time:x.time, playing:x.playing});
			}

			this.gunHeat = Math.max(0,this.gunHeat-dt);
		}

		this.freezeTime = Math.max(this.freezeTime-dt,0);
		if(this.freezeTime==0 && this.freezeSprite!=null) {
			this.freezeSprite.destroy();
			this.freezeSprite = null;
		}
	},
	
	onKeyDown: function (event) {
		if(!this.isPlayer)
			return;
		var charName = "";
		if(this.playerType == 1)
			charName = "robot";
		else if(this.playerType == 2)
			charName = "robot1";

        switch(event.keyCode) {
			case cc.macro.KEY.up:
			case cc.macro.KEY.w:
				this.direction = "up";
				this.nkeys.up = 1;
				this.setMoveAnim(charName + "-back");
                break;
			case cc.macro.KEY.down:
			case cc.macro.KEY.s:
				this.direction = "down";
				this.nkeys.down = 1;
				this.setMoveAnim(charName + "-front");
                break;
			case cc.macro.KEY.left:
			case cc.macro.KEY.a:
				this.direction = "left";
				this.nkeys.left = 1;
				this.setMoveAnim(charName + "-left");
                break;
			case cc.macro.KEY.right:
			case cc.macro.KEY.d:
				this.direction = "right";
				this.nkeys.right = 1;
				this.setMoveAnim(charName + "-right");
				break;
        }
    },

    onKeyUp: function (event) {
		if(!this.isPlayer)
			return;
        switch(event.keyCode) {
			case cc.macro.KEY.up:
			case cc.macro.KEY.w:
				this.nkeys.up = 0;
                break;
			case cc.macro.KEY.down:
			case cc.macro.KEY.s:
				this.nkeys.down = 0;
                break;
			case cc.macro.KEY.left:
			case cc.macro.KEY.a:
				this.nkeys.left = 0;
                break;
			case cc.macro.KEY.right:
			case cc.macro.KEY.d:
				this.nkeys.right = 0;
				break;
			case cc.macro.KEY.v:
				this.gameController.toggleInventory();
				break;
        }
	},

	getAnimState: function() {
		var anim = this.node.getComponent(cc.Animation);

		if(!anim.currentClip)
			return {name:"", time:0, playing:false};
			
		var animState = anim.getAnimationState(anim.currentClip._name);
		return {name:animState.name, time:animState.time, playing:animState.isPlaying};
	},
	
	setMoveAnim: function(clipName) {
		var anim = this.getComponent(cc.Animation);
		if(clipName=="") {
			anim.stop();
			return;
		}
		var animState = anim.getAnimationState(clipName);
		if(animState.isPlaying==true)
			return;
		anim.stop();
		anim.play(clipName);
	},

	onFreeze: function() {
		if(this.freezeSprite==null) {
			var node = null;
			// select freeze prefab with freeze type.
            if(this.freezeType == 1)
                node = cc.instantiate(this.freezePrefab);
            else if(this.freezeType == 2)
				node = cc.instantiate(this.freezeRedPrefab);
				
			node.parent = cc.director.getScene();	// [NOTE]. parent modified from the player node.
			node.setPosition(this.node.x, this.node.y);

			// play anim clip with freeze type.
			if(this.freezeType == 1)
				node.getComponent(cc.Animation).play('freeze');
			else if(this.freezeType == 2)
				node.getComponent(cc.Animation).play('freeze_red');
				
			this.freezeSprite = node;
		}
		if(this.freezeTime<=0)
			this.freezeTime = 3.0;
	},

	shootable: function(angle) {
		if(this.freezeTime>0)
			return false;
		if(this.gunHeat>4.0)
			return false;
		if(this.direction=="up"){
			return 0<=angle && angle<=180;
		} else if(this.direction=="down") {
			return -180<=angle && angle<=0;
		} else if(this.direction=="left") {
			return (180>=angle&&angle>=90) || (-180<=angle&&angle<=-90);
		} else if(this.direction=="right") {
			return (0<=angle&&angle<=90) || (-90<=angle&&angle<=0);
		}
	},

	shoot: function(target) {
		var d = cc.v2(target.x-this.node.x, target.y-this.node.y);
        var angle = cc.misc.radiansToDegrees(-d.signAngle(cc.v2(1,0)));
		if(!this.shootable(angle))
			return;

		this.gunHeat += 1.0;
		this.gameController.spawnBullet(this.node.position, angle);
	},
	
	onCollisionEnter: function (other, self) {
		if(!this.isPlayer)
			return;
		if(other.node.group=="terrain") {
			console.log("terrain boundary");
			return;
		}

		if(other.node.group=="mineral") {
			this.mineral += 10;
			this.gameController.setMineral(this.mineral.toFixed(1));
			this.gameController.collectMineral(other.node.parent, true);
			return;
		}

		if(other.node.group=="bullet") {
			this.gameController.bulletDestroy(other.node.parent, true);

			if(this.mineral>=20 && this.freezeSprite==null) {
				this.mineral -= 20;
				this.mineral = Math.max(0, this.mineral);
				this.gameController.setMineral(this.mineral.toFixed(1));
				var pos = this.gameController.terrain.convertToNodeSpaceAR(cc.v2(this.node.x, this.node.y));
				var typeNr = Math.floor(Math.random()*3);
				this.gameController.spawnMineral(pos, typeNr, "", true, true);
			}

			this.onFreeze();
			this.gameController.freezePlayer(true);

			if(this.node.childrenCount>0) {
				this.gameController.dropFlag(this.node.children[0]);
			}

			return;
		}

		if(other.node.group=="flag" && this.node.childrenCount==0 &&
			(!this.gameController.isInRect(this.gameController.spawnRect, other.node.position) || other.node.actorNr!=this.node.actorNr)) {
			this.gameController.grabFlag(other.node);
		}

		if(other.node.group=="crater" && other.node.actorNr==this.node.actorNr && this.node.childrenCount>0) {
			var flagNode = this.node.children[0];
			this.gameController.collectFlag(flagNode);
		}

		if(other.node.group=="base" && other.node.actorNr==this.node.actorNr && this.node.childrenCount>0 && this.node.children[0].actorNr==this.node.actorNr) {
			var flagNode = this.node.children[0];
			this.gameController.recollectMyFlag(flagNode);
		}

		if(other.node.group=="surveillance" && other.node.actorNr!=this.node.actorNr) {
			this.gameController.underSurveillance(other.node.actorNr, this.node.position);
			if(other.node.name.substr(0,6)=="spider" && other.node.freezeTime==0) {		// when spider unfreezed
				var d = cc.v2(this.node.x-other.node.x, this.node.y-other.node.y);
				var angle = cc.misc.radiansToDegrees(-d.signAngle(cc.v2(1,0)));
				this.gameController.spawnBullet(other.node.position, angle);
			}
		}
	},

	clamp: function(value, min, max) {
		if(value<min)
			return min;
		if(value>max)
			return max;
		return value;
	}
});
