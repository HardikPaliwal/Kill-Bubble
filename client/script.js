
  let canvas = document.getElementById("canvas")
	let ctx = canvas.getContext('2d');
	let chatText = document.getElementById("chat-text");
	let chatForm = document.getElementById("chat-form");
	let chatInput = document.getElementById("chat-input");
  let usernameSign = document.getElementById('userNameSign');
  let passwordSign = document.getElementById('passwordSign');
  let passwordCreate = document.getElementById('passwordCreate');
  let usernameCreate = document.getElementById('userNameCreate');
  let signInButton = document.getElementById('signIn');
  let createButton = document.getElementById('create');
  let statusOfSignIn = document.getElementById('statusOfSignIn');
  let signDiv = document.getElementById('login-page');
  let gameDiv = document.getElementById('gameScreen')
	let socket = io();
	let WIDTH = 500;
	let HEIGHT = 500;

$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});


signInButton.onclick = function (){
  socket.emit('signIn', {userName:usernameSign.value});
}
// createButton.onclick = function (){
//   socket.emit('signUp', {userName:usernameCreate.value, password:passwordCreate.value});
// }
socket.on('signInResponse', function(data){
  if(data.success){
   signDiv.style.display = 'none';
    gameDiv.style.display = 'inline-block';
  }
  else{
    statusOfSignIn.innerHTML = data.response;
    }
});

  let resizeCanvas = function(){
  	WIDTH = window.innerWidth-4;
  	HEIGHT = window.innerHeight-4;
  	canvas.width = WIDTH;
  	canvas.height = HEIGHT-35;
  	chatInput.setAttribute("style", "width:" + WIDTH+"px");
  	chatForm.setAttribute("style", "width:" + WIDTH+"px");
  	ctx.mozImageSmoothEnabled = false;
  	ctx.msImageSmoothEnabled = false;
  	ctx.imageSmoothingEnabled = false;
  	ctx.font = '30px Arial';
  }
window.addEventListener('resize', function(){
  resizeCanvas();
});
  resizeCanvas();
  let Player = function(initPack){
  	let self = {};
  	self.id = initPack.id;
  	self.number = initPack.number;
  	self.x = initPack.x;
  	self.y = initPack.y;
  	self.hp = initPack.hp;
  	self.hpMax = initPack.hpMax;
  	self.score = initPack.score;
  	Player.list[self.id] = self;
  	self.draw = function(){
  		let hpWidth = 60 * self.hp / self.hpMax;
      if(selfId === null)
        return;
  		let x = self.x - Player.list[selfId].x + WIDTH/2;
  		let y = self.y - Player.list[selfId].y + HEIGHT/2;
  		//ctx.fillText(self.number, x, y);
  		ctx.beginPath();
  		ctx.arc(x, y, 30 *(1 + self.score/4.2), 0, 2 * Math.PI, false);
  		ctx.fillStyle = 'green';
  		ctx.fill();
  		ctx.lineWidth = 5;
  		ctx.strokeStyle = '#003300';
  		ctx.stroke();
  		  		ctx.fillStyle = 'red';
  		ctx.fillRect(x - hpWidth/2, y -40, hpWidth, 4);
  	}
  	return self;
  }
  Player.list = {};

   let Bullet = function(initPack){
  	let self = {};
  	self.id = initPack.id;
  	self.number = initPack.number;
  	self.x = initPack.x;
  	self.y = initPack.y;
  	Bullet.list[self.id] = self;
  	self.draw = function(){
  		ctx.fillStyle = 'black';
  		let x = self.x - Player.list[selfId].x + WIDTH/2;
  		let y = self.y - Player.list[selfId].y + HEIGHT/2;
    	ctx.fillRect(x-5, y-5, 10, 10);
  	}
  	return self;
  }
  Bullet.list = {};
  let selfId = null;

let img = {};
  img.map = new Image();
  img.map.src = 'http://static.wixstatic.com/media/6bc25d_13c539b9748c4401ab706f84f7c9584e.jpg';
  
  let drawMap = function(){
  	if(selfId){
  		let x = WIDTH/2 - Player.list[selfId].x;
  		let y = HEIGHT/2 - Player.list[selfId].y;
  		ctx.drawImage(img.map, x, y);
  	}
  }
  let drawScore = function(){
  	ctx.fillStyle = 'black';
  	if(selfId){
  		 ctx.fillText(Player.list[selfId].score+"",10, 60);
  	}
  }

   socket.on('update',function(data){
        //{ player : [{id:123,x:0,y:0},{id:1,x:0,y:0}], bullet: []}
        for(var i = 0 ; i < data.player.length; i++){
            var pack = data.player[i];
            var p = Player.list[pack.id];
            if(p){
                if(pack.x !== undefined)
                    p.x = pack.x;
                if(pack.y !== undefined)
                    p.y = pack.y;
                if(pack.hp !== undefined)
                	p.hp = pack.hp;
                if(pack.scor !== undefined)
                	p.score = pack.score;
            }
        }
        for(var i = 0 ; i < data.bullet.length; i++){
            var pack = data.bullet[i];
            var b = Bullet.list[data.bullet[i].id];
            if(b){
                if(pack.x !== undefined)
                    b.x = pack.x;
                if(pack.y !== undefined)
                    b.y = pack.y;
            }
        }
    });
 socket.on('remove',function(data){
        //{player:[12323],bullet:[12323,123123]}
        for(var i = 0 ; i < data.player.length; i++){
            delete Player.list[data.player[i]];
        }
        for(var i = 0 ; i < data.bullet.length; i++){
            delete Bullet.list[data.bullet[i]];
        }
    });

socket.on('init', function (data) {
	if(data.selfId){
		selfId = data.selfId;
	}
    for(let i = 0; i< data.player.length; i++)
    	Player(data.player[i]);
  
    for(let i = 0; i< data.bullet.length; i++)
    	Bullet(data.bullet[i]);
   });
 

  socket.on('addToChat', function(data){
  	console.log("Message Happened");
  	chatText.innerHTML += '<div>' + data + '</div>';
  	      	chatText.scrollTop = chatText.scrollHeight;
  })
  chatForm.onsubmit = function(e){
  	e.preventDefault();
  	socket.emit('sendMsgToServer', chatInput.value);
  	chatInput.value = '';
  }

  setInterval(function (data) {
    ctx.clearRect(0,0,WIDTH, HEIGHT);
    drawMap();
    drawScore();
    for(let i in Player.list)
    	Player.list[i].draw();
    
    for(let i in Bullet.list)
    	Bullet.list[i].draw();
  }, 40);


   document.onkeydown = function(event){
        if(event.keyCode === 68)    //d
            socket.emit('keyPress',{inputId:'right',state:true});
        else if(event.keyCode === 83)   //s
            socket.emit('keyPress',{inputId:'down',state:true});
        else if(event.keyCode === 65) //a
            socket.emit('keyPress',{inputId:'left',state:true});
        else if(event.keyCode === 87) // w
            socket.emit('keyPress',{inputId:'up',state:true});
    }
    document.onkeyup = function(event){
        if(event.keyCode === 68)    //d
            socket.emit('keyPress',{inputId:'right',state:false});
        else if(event.keyCode === 83)   //s
            socket.emit('keyPress',{inputId:'down',state:false});
        else if(event.keyCode === 65) //a
            socket.emit('keyPress',{inputId:'left',state:false});
        else if(event.keyCode === 87) // w
            socket.emit('keyPress',{inputId:'up',state:false});
    }

    document.onmousedown = function (event){
    	socket.emit('keyPress', {inputId:'attack', state:true});
    }
    document.onmouseup= function (event){
    	socket.emit('keyPress', {inputId:'attack', state:false});
    }
    document.onmousemove = function(event){
    	let x = -(WIDTH/2) + event.clientX -8;
    	let y = -(HEIGHT/2) + event.clientY -8;
    	let angle = Math.atan2(y, x) /Math.PI *180;
    	socket.emit('keyPress', {inputId:'mouseAngle', state:angle});
    }
    socket.on('evalAnswer', function(data){
    	console.log(data);
    })
