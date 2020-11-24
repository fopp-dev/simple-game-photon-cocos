// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    isCreate: false,
    timeRemaining: 0,
    notifyBoxs: null,

    properties: {
        networkController: {
            default: null,
            type: cc.Node
        },
        playerName: {
            default: null,
            type: cc.EditBox
        },
        roomPassword: {
            default: null,
            type: cc.EditBox,
        },
        msg1: {
            default: null,
            type: cc.Label
        },
        msg2: {
            default: null,
            type: cc.RichText
        },
        createButton: {
            default: null,
            type: cc.Button
        },
        joinButton: {
            default: null,
            type: cc.Button
        },
        startButton: {
            default: null,
            type: cc.Button
        },
        notifyPrefab: {
            default: null,
            type: cc.Prefab
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        var c = this.networkController.getComponent("NetworkController");
        c.signalRoomChange = this.onRoomChanged.bind(this);
        c.signalConnected = this.onConnected.bind(this);
        c.signalEvent = this.onNetworkEvent.bind(this);
        c.signalError = this.onNetworkError.bind(this);
        c.signalActorJoin = this.onActorJoin.bind(this);
        c.signalActorLeave = this.onActorLeave.bind(this);
        c.signalGameNotExist = this.onNetworkError.bind(this);

        this.isCreate = false;

        if(window.CREATE==true) {
            this.joinButton.node.active = false;
        } else {
            this.createButton.node.active = false;
            this.startButton.node.active = false;
        }
    },


    onCreateButton: function() {
        if(this.playerName.string=="") {
            this.msg2.string = "Enter your player name";
            this.msg2.node.getComponent(cc.Animation).play("horizontal_shake1");
            this.playerName.focus();
            return;
        }

        this.roomPassword.string = this.randomRoomName();
        this.msg1.string = "Room Password: "+this.roomPassword.string;
        this.msg1.node.active = true;
        this.msg2.string = "Please wait...";
        this.createButton.interactable = false;
        this.joinButton.interactable = false;
        this.startButton.interactable = false;
        this.networkController.getComponent("NetworkController").createOrJoinGame(true, this.roomPassword.string, this.playerName.string);
        this.isCreate = true;
        this.notifyBoxs = [];
    },

    onJoinButton: function() {
        if(this.playerName.string=="") {
            this.msg2.string = "Enter your player name";
            this.msg2.node.getComponent(cc.Animation).play("horizontal_shake1");
            this.playerName.focus();
            return;
        }

        this.msg2.string = "Please wait..."
        this.createButton.interactable = false;
        this.joinButton.interactable = false;
        this.startButton.interactable = false;
        this.networkController.getComponent("NetworkController").createOrJoinGame(false, this.roomPassword.string, this.playerName.string);
        this.isCreate = false;
    },

    onStartButton: function() {
        this.networkController.getComponent("NetworkController").getGameServer().myRoom().setIsOpen(false);
        cc.director.loadScene("main");
    },

    onLeaveButton: function() {
        //gameServer.leaveRoom();
    },

    onConnected: function(root) {
        if(this.isCreate===true) {
            this.startButton.interactable = true;
            this.scheduleOnce(function(){
                this.onStartButton();
            }.bind(this), 60);
            this.timeRemaining = 60;
            this.schedule(function(){
                this.msg1.node.active = true;
                this.msg1.string = ""+(this.timeRemaining--)+"s remain.";
            }.bind(this), 1, 59, 0);
        }
        var c = this.networkController.getComponent("NetworkController").gameServer;
        this.msg1.node.active = false;
        this.msg2.string = "Your Room Password:"+this.roomPassword.string;
    },
    
    onRoomChanged: function(actors) {
        var s = "<size=24><color=gray>Players:</color></size>";
        console.log(actors);
        for(var i in actors) {
            console.log(actors[i], actors[i].customProperties["ActorName"]);
            s += "\n<size=18>"+actors[i].customProperties["ActorName"]+"</size>";
        }
        this.msg2.string = s;
    },

    onActorJoin: function(actor) {
        var s = this.networkController.getComponent("NetworkController").gameServer;
        this.onRoomChanged(s.myRoomActors());

        if(actor.isLocal==true || !this.isCreate)
            return;

        var node = cc.instantiate(this.notifyPrefab);
        node.getComponent("NotifyBox").notifyString = actor.customProperties["ActorName"]+" is being to join.";
        node.parent = cc.find("Canvas");
        node.getComponent(cc.Widget).left = 10;
        node.getComponent("NotifyBox").customData = {actorNr:actor.actorNr, notifybox:node, gameServer:s};
        node.getComponent("NotifyBox").signalAcceptButton = function(data){
            data.notifybox.destroy();
            this.removeNotify(data.notifybox);
            this.updateNotify();
        }.bind(this);
        node.getComponent("NotifyBox").signalDeclineButton = function(data){
            console.log("Kill ", data.actorNr);
            s.raiseEvent(16,null,{targetActors:[data.actorNr]});
            this.removeNotify(data.notifybox);
            data.notifybox.destroy();
            this.updateNotify();
        }.bind(this);
        this.notifyBoxs.push(node);
        this.updateNotify();
    },

    onActorLeave: function(actor, cleanup) {
        var s = this.networkController.getComponent("NetworkController").gameServer;
        this.onRoomChanged(s.myRoomActors());
    },

    onNetworkEvent: function(code, content, actorNr) {
        switch(code) {
        case 1:
            cc.director.loadScene("main");
            break;
        case 16:
            this.onNetworkError(-1, "You are not allowed to join the room.");
            break;
        }
    },

    onNetworkError: function(errorCode, errorMsg) {
        this.networkController.getComponent("NetworkController").gameServer.disconnect();

        this.msg2.string = errorMsg;
        this.msg2.node.getComponent(cc.Animation).play("horizontal_shake1");
        this.startButton.interactable = false;
        this.joinButton.interactable = true;
        this.createButton.interactable = true;
        this.msg1.node.active = false;
        this.roomPassword.string = "";
        this.playerName.string = "";
    },


    // update (dt) {},

    randomRoomName: function() {
        var len = 4;
        var name = "";
        for(var i=0; i<len; i++){
            var c = Math.floor(Math.random()*(26+26+10));
            if(c<10)
                name += c;
            if(c>=10 && c<10+26)
                name += String.fromCharCode('a'.charCodeAt(0)+(c-10));
            if(c>10+26)
                name += String.fromCharCode('A'.charCodeAt(0)+(c-10-26));
        }

        return name;
    },

    updateNotify: function() {
        if(this.notifyBoxs==null)
            this.notifyBoxs = [];
        for(var i=0; i<this.notifyBoxs.length; i++) {
            this.notifyBoxs[i].getComponent(cc.Widget).bottom = 10+100*i;
        }
    },

    removeNotify: function(node) {
        var idx =-1;
        for(var i=0; i<this.notifyBoxs.length; i++) {
            if(this.notifyBoxs[i]==node) {
                idx = i;
                break;
            }
        }
        if(idx!=-1) {
            for(var i=idx; i<this.notifyBoxs.length-1; i++)
                this.notifyBoxs[i] = this.notifyBoxs[i+1]
            this.notifyBoxs.length -= 1;
        }
    }
});
