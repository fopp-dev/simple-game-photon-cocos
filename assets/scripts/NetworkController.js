cc.Class({
    extends: cc.Component,

    gameServer: null,
    isCreate:false,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        photonAppId: "",
        photonVersion: "",
        photonServer: "asia",
        photonRoomName: "test",
        photonPlayerName: "testplayer",
        signalConnected: null,
        signalRoomChange: null,
        signalError: null,
        signalEvent: null,
        signalActorJoin: null,
        signalActorLeave: null,
        signalGameNotExist: null
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.gameServer = new Photon.LoadBalancing.LoadBalancingClient(Photon.ConnectionProtocol.Ws, this.photonAppId, this.photonVersion);
        this.isCreate = false;
        Photon.LoadBalancing.LoadBalancingClient.prototype.onError = this.onPhotonError.bind(this);
        Photon.LoadBalancing.LoadBalancingClient.prototype.onEvent = this.onPhotonEvent.bind(this);
        Photon.LoadBalancing.LoadBalancingClient.prototype.onOperationResponse = this.onOperationResponse.bind(this);
        Photon.LoadBalancing.LoadBalancingClient.prototype.onStateChange = this.onPhotonStateChange.bind(this);
        Photon.LoadBalancing.LoadBalancingClient.prototype.onMyRoomPropertiesChange = this.onPhotonRoomChange.bind(this);
        Photon.LoadBalancing.LoadBalancingClient.prototype.onRoomList = this.onPhotonRoomList.bind(this);
        //Photon.LoadBalancing.LoadBalancingClient.prototype.onJoinRoom = this.onPhotonJoinRoom.bind(this);
        Photon.LoadBalancing.LoadBalancingClient.prototype.onActorJoin = this.onPhotonActorJoin.bind(this);
        Photon.LoadBalancing.LoadBalancingClient.prototype.onActorLeave = this.onPhotonActorLeave.bind(this);

        cc.game.addPersistRootNode(this.node);
    },

    //start () {    },

    //update (dt) {},

    createOrJoinGame: function(isCreate, roomName, playername) {
        this.isCreate = isCreate;
        this.photonRoomName = roomName;
        this.photonPlayerName = playername;
        this.gameServer.myActor().setCustomProperty("ActorName", this.photonPlayerName);
        this.gameServer.connectToRegionMaster(this.photonServer);
    },

    onPhotonError: function(errorCode, errorMsg) {
        console.log("Error " + errorCode + ": " + errorMsg);
        if(this.signalError!=null)
            this.signalError(errorCode, errorMsg);
    },

    onPhotonEvent: function(code, content, actorNr) {
        if(this.signalEvent!=null)
            this.signalEvent(code,content,actorNr);
    },

    onPhotonStateChange: function(state) {
        switch(state)
        {
        case Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby:
            console.log(this.isCreate,this.photonRoomName);
            if(this.isCreate===true) {
                this.gameServer.createRoom(this.photonRoomName);
            } else {
                this.gameServer.joinRoom(this.photonRoomName);
            }
            break;
        case Photon.LoadBalancing.LoadBalancingClient.State.Joined:
            this.gameServer.myActor().setCustomProperty("ActorName", this.photonPlayerName);
            if(this.signalConnected!=null)
                this.signalConnected();
            break;
        }
    },

    onPhotonRoomList: function(rooms) {
    },

    onPhotonActorJoin: function(actor) {
        if(this.signalActorJoin)
            this.signalActorJoin(actor);
    },

    onPhotonRoomChange: function() {
        if(this.signalRoomChange!=null)
            this.signalRoomChange(this.gameServer.myRoomActors());
    },

    onPhotonActorLeave: function(actor, cleanup) {
        if(this.signalActorLeave!=null)
            this.signalActorLeave(actor, cleanup);
    },

    onOperationResponse: function(errorCode, errorMsg, code, content){
        if(errorCode==32758 && this.signalGameNotExist!=null)
            this.signalGameNotExist(errorCode, errorMsg);
    },

    getGameServer: function() {
        return this.gameServer;
    }

});
