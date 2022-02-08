module.exports = class Rooms
{
    constructor(network)
    {
        this.network = network;
        this.rooms = [];
    }
    Get = (index) =>
    {
        return this.rooms[index];
    }
    JoinRandom = (client) =>
    {
        for(var index in this.rooms)
        {
            var room = this.rooms[index];
            if(room.players == null) break; 
            for(var p in room.players)
            {
                var player = room.players[p];
                if(player.id == client.id) return;
            }
            if(Object.keys(room.players).length < room.roomMaxLength)
            {
                this.rooms[index].players.push(client);
                client.join(index.toString());
                client.roomNumber = index;
                client.send("gameFinded");
                if(Object.keys(room.players).length >= room.roomStartLength)
                {
                    client.send("startRoom", null, 1);
                    this.network.onRoomStarted(room);
                }
                return;
            }
        }
        var roomToJoin = this.CreateRoom();
        this.JoinRandom(client);
    }
    CreateRoom = (obj) =>
    {
        var defaultRoomProperties = {
            name: "NewRoom",
            roomMaxLength: 100,
            roomStartLength: 0,
            players: []
        };
        var index = this.rooms.push(obj || defaultRoomProperties) - 1;
        return index;
    }
}