// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        camera: {
            default: null,
            type: cc.Camera
        },
        mapNode: {
            default: null,
            type: cc.Node
        },
        itemSprites: {
            default:[],
            type: [cc.SpriteFrame]
        },
        uiButtonNodes: {
            default: [],
            type: [cc.Button]
        }
    },

    onLoad () {
        this.itemRemains = [];
        for(var i=1; i<this.itemSprites.length; i++)
            this.itemRemains[i] = 1;
        
        this.node.zIndex = -1;
    },

    start () {
    },

    mapClicked: function(event) {
        var p = this.camera.getScreenToWorldPoint(cc.v2(event.getLocationX(), event.getLocationY()));
        this.placeItem(this.tiled.convertToNodeSpaceAR(p));
    },
    cloneMap: function(tmxAsset) {
        this.mapNode.addComponent(cc.TiledMap).tmxAsset = tmxAsset;
    },
    openDialog: function() {
        this.itemType = {NONE:0, DRONE:1, SPIDER:2, TOWER:3};
        this.currentItem = this.itemType.NONE;
        this.todo = [];
        this.node.zIndex = 1;
        this.dialogOpened = true;

        // scaling Map and register mouse click listener
        this.tiled = this.mapNode.getChildByName("Tiles");
        this.mapNode.scaleX = (cc.winSize.height-100)/this.tiled.width;
        this.mapNode.scaleY = this.mapNode.scaleX;
        this.gameController = cc.find("/GameController").getComponent("GameController");
        this.tiled.on(cc.Node.EventType.MOUSE_UP, this.mapClicked, this);

        // enabling ui buttons
        for(var b in this.uiButtonNodes)
            this.uiButtonNodes[b].enabled = true

        // diabling item buttons
        if(this.itemRemains!=undefined && this.itemRemains[this.itemType.DRONE]==0)
            cc.find("/Inventory/Drone Button").getComponent(cc.Button).interactable = false
        if(this.itemRemains!=undefined && this.itemRemains[this.itemType.SPIDER]==0)
            cc.find("/Inventory/Spider Button").getComponent(cc.Button).interactable = false
        if(this.itemRemains!=undefined && this.itemRemains[this.itemType.TOWER]==0)
            cc.find("/Inventory/Tower Button").getComponent(cc.Button).interactable = false
    },

    closeDialog: function() {
        // remove click listener
        this.tiled.off(cc.Node.EventType.MOUSE_UP, this.mapClicked, this);
        // disable ui buttons
        for(var b in this.uiButtonNodes)
            this.uiButtonNodes[b].enabled = false

        this.onCancelButton();
        this.dialogOpened = false;
        this.node.zIndex = -1;
    },

    onDroneButton: function() {
        this.currentItem = this.itemType.DRONE;
    },

    onSpiderButton: function() {
        this.currentItem = this.itemType.SPIDER;
    },

    onTowerButton: function() {
        this.currentItem = this.itemType.TOWER;
    },

    onCancelButton: function() {
        for(var x in this.todo) {
            this.todo[x].node.destroy();
        }
        this.todo = [];
    },

    onApplyButton: function() {
        this.gameController.placeItems(this.todo, this);
        for(var x in this.todo)
            this.itemRemains[x] = 0;
        if(this.todo[this.itemType.DRONE]!=undefined) {
            var droneLife = 5*60;   // 5 mins
            var droneNode = this.todo[this.itemType.DRONE].node;
            cc.tween(droneNode).delay(droneLife).call(()=>{droneNode.destroy();}).start();
        }
        this.todo = [];
        this.closeDialog();
    },

    placeItem: function(pos) {
        if(this.currentItem==this.itemType.NONE)
            return;
        if(this.todo[this.currentItem]==undefined) {
            var node = new cc.Node("Item"+this.currentItem);
            var sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = this.itemSprites[this.currentItem];
            node.parent = this.mapNode;
            node.setPosition(pos);
            node.width = 96;
            node.height = 96;
            this.todo[this.currentItem] = {pos:pos, node:node};
        } else {
            var node = this.todo[this.currentItem].node;
            node.setPosition(pos);
            node.pos = pos;
        }
    }

    //update (dt) {}
});
