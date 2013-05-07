var
	net = require('net'),
	db = {
		sPath: {
			port: 4028,
			host: '127.0.0.1'
		},
		inQuest: false,
		queue: [],
		disconnect: true
	}

var
	setAsk = function(quest, params, callback){
		var q = {
			command: quest
		};

		if(typeof params == 'function'){
			q.callback = params;
		}else{
			q.parameter = params;
			q.callback = callback;
		}

		db.queue.push(q);
		ask();
	},
	ask = function(){
		if(!db.queue.length || db.inQuest)
			return;
		db.inQuest = true;

		var
			question = db.queue.shift(),
			client = net.connect(db.sPath);

		client.setTimeout(2000, function(){
			disconnect(question);
			client.destroy();
		});

		client.on('error', function(){
			disconnect(question);
		});

		client.on('connect', function(){
			client.write(JSON.stringify(question, ['','command','parameter']));
		});

		client.on('data', function(data) {
			if(question.callback)
				question.callback(JSON.parse(data.toString()));
			else
				console.log(JSON.parse(data.toString()));

			db.disconnect = false;
			client.end();
		});

		client.on('close', function(){
			db.inQuest = false;
			//check for queue
			ask();
		});
	},
	disconnect = function(question){
		db.queue.unshift(question);
		db.disconnect = true;
		setTimeout(function(){
			if(db.disconnect)
				warn('disconnect');
		}, 15000);
	},
	warn = function(msg){
		console.log('Warning: '+msg);
	}

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk){
	var parts = chunk.replace('\n', '').split(' ');
	setAsk(parts[0], parts[1]);
});