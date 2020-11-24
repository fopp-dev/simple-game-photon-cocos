// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        removeInterval: 2.0,
        notifyLabel: {
            default: null,
            type: cc.Label
        }
    },

    onLoad () {
    },

    start () {
        this.timeLeftToRemove = this.removeInterval;
    },

    update (dt) {
        this.timeLeftToRemove -= dt;
        if(this.timeLeftToRemove<=0.0) {
            // reset time to full
            this.timeLeftToRemove = this.removeInterval;
            // remove last line
            this.notifyLabel.string = this.notifyLabel.string.substring(0,this.notifyLabel.string.lastIndexOf("\n"));
        }
    },

    addNotify: function(str) {
        if(this.notifyLabel.string.length==0)
            this.timeLeftToRemove = this.removeInterval;
        this.notifyLabel.string = str+"\n"+this.notifyLabel.string
    }
});
