// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        speed: 20.0,
        xRange: 100,
        freezePrefab: {
			default: null,
			type: cc.Prefab
		},
        freezeRedPrefab: {
            default: null,
            type: cc.Prefab
        },
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.DIRECTION = {RIGHT:1, LEFT:2}
        this.gameController = cc.find("/GameController").getComponent("GameController");
        this.direction = this.DIRECTION.RIGHT;
        this.maxX = Math.min(this.node.x+this.xRange, this.gameController.playableRect.x+this.gameController.playableRect.width);
        this.minX = Math.max(this.node.x-this.xRange, this.gameController.playableRect.x);
        this.freezeSprite = null;
        this.node.freezeTime = 0.0;
    },

    update (dt) {
        this.node.freezeTime = Math.max(this.node.freezeTime-dt,0);
        if(this.node.freezeTime>0)
            return;
        
        // only when not freezed
        var anim = this.getComponent(cc.Animation);
        if(!this.gameController.isInRectArray(this.gameController.playableRect,cc.v2(this.node.x, this.node.y)) && 
            this.direction == this.DIRECTION.RIGHT) {
            this.direction = this.DIRECTION.LEFT;
            anim.play("spider-left");
        }
        else if(!this.gameController.isInRectArray(this.gameController.playableRect,cc.v2(this.node.x, this.node.y)) && 
            this.direction == this.DIRECTION.LEFT) {
            this.direction = this.DIRECTION.RIGHT;
            anim.play("spider-right");
        }
        if(this.direction==this.DIRECTION.LEFT)
            this.node.x -= dt*this.speed;
        else if(this.direction==this.DIRECTION.RIGHT)
            this.node.x += dt*this.speed;

		if(this.freezeSprite!=null) {
			this.freezeSprite.destroy();
			this.freezeSprite = null;
		}
    },
    
	onCollisionEnter: function (other, self) {
        if(self.tag==1 && other.node.group=="bullet") {
            this.gameController.bulletDestroy(other.node.parent, true);
            this.freeze();
        }    
    },
    
    freeze: function() {
		if(this.freezeSprite==null) {
            var node = null;
            // select freeze prefab with freeze type.
            if(this.gameController.freezeType == 1)
			    node = cc.instantiate(this.freezePrefab);
            else if(this.gameController.freezeType == 2)
                node = cc.instantiate(this.freezeRedPrefab);
			node.parent = cc.director.getScene();
            node.setPosition(this.node.x, this.node.y);
            // player anim clip with freeze type.
            if(this.gameController.freezeType == 1)
                node.getComponent(cc.Animation).play('freeze');
            else if(this.gameController.freezeType == 2)
                node.getComponent(cc.Animation).play('freeze_red');

			this.freezeSprite = node;
		}
		if(this.node.freezeTime<=0)
			this.node.freezeTime = 3.0;
	}
});
