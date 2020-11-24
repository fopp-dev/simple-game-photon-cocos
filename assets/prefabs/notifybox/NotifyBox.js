// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        notifyString:"",
        notifyLabel:{
            default: null,
            type: cc.RichText
        },
        signalAcceptButton:{
            default: null,
            visible: false,
        },
        signalDeclineButton:{
            default: null,
            visible: false,
        },
        customData: {
            default:null,
            visible: false
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.notifyLabel.string = this.notifyString;
    },

    // update (dt) {},

    onAcceptButton: function() {
        if(this.signalAcceptButton!=null)
            this.signalAcceptButton(this.customData);
    },

    onDeclineButton: function() {
        if(this.signalDeclineButton!=null)
            this.signalDeclineButton(this.customData);
    }
});
