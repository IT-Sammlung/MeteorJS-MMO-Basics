export default class BootScene extends Phaser.Scene
{
    constructor ()
    {
        super({ key: 'menu' });
    }

    preload ()
    {
        // load all files necessary for the loading screen
        this.load.image('buttonPlay', 'assets/button_play.png');
    }

    create ()
    {
      this.add.image(200, 200, 'buttonPlay');
    }
}
