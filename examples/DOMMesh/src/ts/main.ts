import * as ORE from '@ore-three-ts';

import { DOMMeshScene } from './DOMMeshScene';

export class APP {

	private controller: ORE.Controller;
	private scene: DOMMeshScene;

	constructor() {

		this.controller = new ORE.Controller( {
			canvas: document.querySelector( '#canvas' ) as HTMLCanvasElement,
			retina: true,
		} );

		this.scene = new DOMMeshScene();

		this.controller.bindScene( this.scene );

	}

}

window.addEventListener( 'load', () => {

	let app = new APP();

} );
