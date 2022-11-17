//includes for TSL protocol libraries
const TSLUMD 					= require('tsl-umd'); // TSL 3.1 UDP package
const TSLUMDv5                  = require('tsl-umd-v5');
const net 						= require('net');
const packet 					= require('packet');

module.exports = {

	openPort() {
		let self = this; // required to have reference to outer `this`
		
		const port = self.config.port
		const portType = self.config.porttype
		const protocol = self.config.protocol

		switch(protocol) {
			case 'tsl3.1':
				setupTSL31(self, port, portType);
				break;
			case 'tsl4.0':
				break;
			case 'tsl5.0':
				break;
			default:
				break;
		}

		self.oldPortType = portType;
	},

	closePort() {
		let self = this; // required to have reference to outer `this`
		
		let port = self.config.port;
		let portType = self.oldPortType == '' ? self.config.porttype : self.oldPortType;

		if (self.SERVER) {
			try {
				switch(portType) {
					case 'udp':
						self.log('info', `Closing TSL UMD UDP Port.`);
						self.SERVER.server.close();
						break;
					case 'tcp':
						self.log('info', `Closing TSL UMD TCP Port.`);
						self.SERVER.close(function() {});
						break;
					default:
						break;
				}
			}
			catch(error) {
				self.log('error', 'Error occurred closing Tally listener port: ' + error.toString());
				self.setVariable('module_state', 'Error - See Log.');
			}
		}
	}
}

function setupTSL31(self, port, portType) {
	try {
		if (portType == 'udp') {
			self.SERVER = new TSLUMD(port);
			self.log('info', `TSL 3.1 Server started. Listening for data on UDP Port: ${port}`);
			self.SERVER.on('message', function(tally) {
				processTSL31Tally.bind(self)(tally);
			});
		}
		else if (portType == 'tcp') {
			let parser = packet.createParser();
			parser.packet('tsl', 'b8{x1, b7 => address},b8{x2, b2 => brightness, b1 => tally4, b1 => tally3, b1 => tally2, b1 => tally1 }, b8[16] => label');

			self.SERVER = net.createServer(function (socket) {
				socket.on('data', function (data) {
					parser.extract('tsl', function (result) {
						result.label = new Buffer.from(result.label).toString().trim();
						processTSL31Tally.bind(self)(result);
					});
					parser.parse(data);
				});

				socket.on('close', function () {
					self.log('debug', `TSL 3.1 TCP Server connection closed.`);
				});
			})
			.on('error', (err) => {
				let error = err.toString();

				Object.keys(err).forEach(function(key) {
					if (key === 'code') {
						if (err[key] === 'EADDRINUSE') {
							error = 'This port (' + port + ') is already in use. Choose another port.';
						}
					}
				});

				self.log('error', error);
			})
			.listen(port, function() {
				self.log('info', `TSL 3.1 Server started. Listening for data on TCP Port: ${port}`);
			});
		}
	}
	catch(error) {
		self.log('error', 'Error occurred setting up Tally Listener: ' + error.toString());
		self.setVariable('module_state', 'Error - See Log.');
	}
}

function processTSL31Tally(tally) {
	let self = this;

	let found = false;

	if (self.CHOICES_TALLYADDRESSES.length > 0 && self.CHOICES_TALLYADDRESSES[0].id == -1) { //if the choices list is still set to default, go ahead and reset it
		self.CHOICES_TALLYADDRESSES = [];
	}

	for (let i = 0; i < self.TALLIES.length; i++) {
		if (self.TALLIES[i].address == tally.address) {
			self.TALLIES[i].tally1 = tally.tally1;
			self.TALLIES[i].tally2 = tally.tally2;
			self.TALLIES[i].label = tally.label.trim();

			found = true;
			break;
		}
	}

	if (!found) {
		let tallyObj = {};
		tallyObj.address = tally.address;
		tallyObj.tally1 = tally.tally1;
		tallyObj.tally2 = tally.tally2;
		tallyObj.label = tally.label.trim();

		self.TALLIES.push(tallyObj);
		self.TALLIES.sort((a, b) => a.address - b.address);
		
		self.CHOICES_TALLYADDRESSES.push(
			{
				id: tally.address,
				label: tally.address + ' (' + tally.label.trim() + ')'
			}
		);

		self.CHOICES_TALLYADDRESSES.sort((a, b) => a.id - b.id);

		self.updateVariableDefinitions();
		self.feedbacks();
	}

	self.status(self.STATUS_OK);
	self.setVariable('module_state', 'Tally Data Received.');

	self.checkVariables();
	self.checkFeedbacks();
}