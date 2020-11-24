cc.Class({
	extends: cc.Component,
	
    properties: {
		bullet: {
			default: null,
			type: cc.Node
		}
    },

    // use this for initialization
    onLoad: function () {
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
    },
	
	go: function() {
		var distance = 2000;
		
		cc.tween(this.bullet).by(4,{position:cc.v2(distance,0)}).call(()=>{this.node.destroy();}).start();
	}
});
