const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module listens to incoming TSL UMD data at the TCP or UDP port specified and updates Feedbacks and Variables accordingly.'
			},
			{
				type: 'number',
				id: 'port',
				width: 6,
				label: 'Listening Port',
				default: '9800',
				regex: this.REGEX_PORT
			},
			{
				type: 'dropdown',
				id: 'porttype',
				width: 8,
				default: 'udp',
				label: 'Port Type',
				choices: [
					{ id: 'tcp', label: 'TCP' },
					{ id: 'udp', label: 'UDP' },
				]
			},
			{
				type: 'dropdown',
				id: 'protocol',
				width: 8,
				default: 'tsl3.1',
				label: 'TSL Protcol Version',
				choices: [
					{ id: 'tsl3.1', label: 'TSL 3.1' },
					//{ id: 'tsl4.0', label: 'TSL 4.0' },
					{ id: 'tsl5.0', label: 'TSL 5.0' }
				]
			},
			{
				type: 'static-text',
				id: 'dummy2',
				width: 12,
				label: ' ',
				value: ' ',
			},
			{
				type: 'textinput',
				id: 'filter',
				width: 6,
				label: 'Label Filter',
				tooltip: 'If the UMD label contains this text, remove it',
				default: ' (FSFC)',
			},
			{
				type: 'static-text',
				id: 'dummy3',
				width: 12,
				label: ' ',
				value: ' ',
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false
			}
		]
	},
}
