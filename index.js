const DEBUG = true;
let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io') (server,{});
let mongojs = require("mongojs");
if(DEBUG){
var db = mongojs('localhost:27017/KillBubble', ['account', 'progress']);
}
else{
var db = mongojs(process.env.MONGODB_URI, ['account', 'progress']);
}

app.get('/', function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});
app.use(express.static('client'));

server.listen(process.env.PORT || 2000);


let Entity = function(){
	let self ={
		x:250, 
		y:250,
		id:"",
		spdX:0,
		spdY:0,
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	self.getDistance = function(point){
		return Math.sqrt(Math.pow(self.x-point.x, 2) + Math.pow(self.y -point.y, 2));
	}
	return self;
}

let Player = function(id, username){
	let self = Entity();
	self.id = id;
	self.username = username;
	self.number = "" + Math.floor(10* Math.random());
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingDown = false;
	self.pressingUp = false;
	self.pressingAttack = false;
	self.mouseAngle = 0;
	self.maxSpd = 10;
	self.hp = 100;
	self.hpMax = 100;
	self.score = 0;

	let defaultUpdate = self.update;
	self.update = function(){
		self.updateSpd();
		defaultUpdate();
	if(self.pressingAttack){
       let b = Bullet(self.mouseAngle, self.id);
       b.x = self.x;
       b.y = self.y;
   }
   self.shootBullet = function(angle){
   	let b = Bullet(angle);
   	b.x = self.x;
   	b.y = self.y;
   }
   self.getInitPack= function(){
   	return {
   		id:self.id,
		x:self.x,
		y:self.y,
		number:self.number,
		hp:self.hp,
		score:self.score,
		hpMax:self.hpMax
   	}
   }
   self.getUpdatePack= function(){
   		return {
   		id:self.id,
		x:self.x,
		y:self.y,
		hp:self.hp,
		score:self.score,
   	}
   }
   initPack.player.push(self.getInitPack());
   return self;
}


	self.updateSpd = function (){
		if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;
       
        if(self.pressingUp)
            self.spdY = -self.maxSpd;
        else if(self.pressingDown)
            self.spdY = self.maxSpd;
        else
            self.spdY = 0;     
	}

	Player.list[id] = self;
	return self;
}

Player.disconnect = function(socket){
	delete SOCKET_LIST[socket.id];
	delete Player.list[socket.id];
}
Player.getAllInitPack = function(){
    var players = [];
    for(var i in Player.list){
    	try{
        players.push(Player.list[i].getInitPack());
    }
    catch(err){
    	console.log(Player.list[i]);
    }
    }
    return players;
}

Player.onConnect = function (socket, username){
	let player = Player(socket.id, username);
	socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
         else if(data.inputId === 'attack')
            player.pressingAttack = data.state;
         else if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;

        socket.emit('init',{
        	selfId:socket.id,
        	player:Player.getAllInitPack(),
        	bullet:Bullet.getAllInitPack(),
        })

    });

}
Player.list = {};

Player.update = function(){
	let pack = [];
	for(let i in Player.list){
		let player = Player.list[i];
		player.update();
		pack.push({
			x:player.x,
			y:player.y,
			id:player.id
		});
	}
	return pack;
}

let Bullet = function(angle, parent){
	let self = Entity();
	self.id = Math.random();
	self.spdX = Math.cos(angle/180*Math.PI)*10;
	self.parent = parent;
	self.spdY = Math.sin(angle/180*Math.PI)*10;
	self.timer = 0;
	self.toRemove = false;
	let default_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
		self.toRemove = true;
		default_update();

		for (let i in Player.list){
			let p = Player.list[i];
			let isColliding = self.getDistance(p) < 25*(1+(p.score/4)) && self.parent !== p.id;
			if(isColliding){
				p.hp -= 10;
				let shooter = Player.list[self.parent];
				if(p.hp <= 0){
					p.hp = p.hpMax;
					p.x = Math.random() *500;
					p.y = Math.random() *500;
					p.score = 0;

					if(shooter){
					shooter.score += 1;
				}
			}
				self.toRemove = true;
			}
		}
	}
	self.getInitPack = function(){return{
		id:self.id,
		x:self.x,
		y:self.y
	}
	}
	Bullet.list[self.id] = self;
	initPack.bullet.push(self.getInitPack());
	return self;
}

Bullet.list = {};

Bullet.update = function(){
	
	let pack = [];
	for (let i in Bullet.list){
		let bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove == true){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
			continue;
		}
		pack.push({
			id:bullet.id,
			x:bullet.x,
			y:bullet.y
		});
	}
	return pack;
}

Bullet.getAllInitPack = function(){
    var bullets = [];
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
}
let signInResult= function (data, cb){
	db.account.find({username: data.userName, password:data.password}, function(err, res){
		if(err){
			cb(false, "An internal Error Occured");
		}
		else{
			if( res.length > 0){
				cb(true, "Sign in Successful");
			}
			else{
				cb(false, "Incorrect Username or Password");
			}
		}
	})
}
let signUpResult = function (data, cb){
	db.account.insert({username: data.userName, password:data.password}, function(err){
		if(err){
			cb(false, "An internal Error Occured");
		}
		else{
			cb(true, "Sign up Successful");
		}
	})
}
const REFRESH_TIME = 40;
let SOCKET_LIST = {};
io.on('connection', function(socket){
	socket.id = Math.random()
	SOCKET_LIST[socket.id] = socket;
	socket.on('signIn', function(data){
		signInResult(data, function(res, code){
			if(res){
				socket.emit('signInResponse', {success:true, response: code});
				Player.onConnect(socket, data.userName);
			}
			else{
				socket.emit('signInResponse', {success:false, response: code});
		}})	
	});
	socket.on('signUp', function(data){
		signUpResult(data, function(res, code){
			if(res){
				socket.emit('signInResponse', {success:true, response: code});
				Player.onConnect(socket, data.userName);
			}
			else{
				socket.emit('signInResponse', {success:false, response:code});
		}})	
	});
	socket.on('disconnect', function(){
		Player.disconnect(socket);
		removePack.player.push(socket.id);

	})

	socket.on('sendMsgToServer', function(data){
		if(data === null){
			return;
		}
		if(data.charAt(0) === '/'){
			if(DEBUG){
				data = data.substring(1);
				let response = eval(data);
				socket.emit('evalAnswer', response);
				return;
			}
		}
		let playerName = (Player.list[socket.id].username);
		for(let i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
		}

	})

	
});



let initPack = {player:[], bullet: []};
let removePack = {player:[], bullet:[]};
setInterval(function(){
	let pack ={
		player: Player.update(),
		bullet: Bullet.update()
	}

	for (let i in SOCKET_LIST){
		let socket = SOCKET_LIST[i];
		socket.emit('update', pack);
		socket.emit('init', initPack);
		socket.emit('remove', removePack);
	}
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
}, REFRESH_TIME)

