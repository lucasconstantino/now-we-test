const { Command, flags } = require('@oclif/command')

class ServeCommand extends Command {
  async run () {
    const { flags } = this.parse(ServeCommand)
    // const name = flags.name || 'world'
    this.log('Not implemented yet')
  }
}

// ServeCommand.description = `Serves the lambdas locally
// ...
// Extra documentation goes here
// `

ServeCommand.description = 'Serves the lambdas locally'

ServeCommand.flags = {
  port: flags.string({ char: 'p', description: 'port to use' }),
}

module.exports = ServeCommand
