import * as THREE from 'three';
import { Pointer } from '../utils/Pointer';
import { BaseLayer, LayerBindParam } from './BaseLayer';

export declare interface PointerEventArgs {
	pointerEvent: PointerEvent;
	pointerEventType: string;
	position: THREE.Vector2;
	delta: THREE.Vector2;
}

export declare interface ControllerParam {
	silent?: boolean;
}

export class Controller extends THREE.EventDispatcher {

    public pointer: Pointer;
	public clock: THREE.Clock;
	protected layers: BaseLayer[] = [];

	constructor( parameter?: ControllerParam ) {

    	super();

    	if ( ! ( parameter && parameter.silent ) ) {

    		console.log( "%c- ore-three " + require( "../../package.json" ).version + " -", 'padding: 5px 10px ;background-color: black; color: white;font-size:11px' );

    	}

    	this.clock = new THREE.Clock();

		let pointerUpdate = this.pointerEvent.bind( this );
		let pointerWheel = this.onWheel.bind( this );
		let orientationchange = this.onOrientationDevice.bind( this );
		let windowResize = this.onWindowResize.bind( this );

    	this.pointer = new Pointer();
    	this.pointer.addEventListener( 'update', pointerUpdate );
    	this.pointer.addEventListener( 'wheel', pointerWheel );

    	window.addEventListener( 'orientationchange', orientationchange );
    	window.addEventListener( 'resize', windowResize );

		this.addEventListener( 'dispose', () => {

			this.pointer.removeEventListener( 'update', pointerUpdate );
			this.pointer.removeEventListener( 'wheel', pointerWheel );
			window.removeEventListener( 'orientationchange', orientationchange );
			window.removeEventListener( 'resize', windowResize );

		} );

    	this.tick();

	}

	protected tick() {

    	const deltaTime = this.clock.getDelta();

    	this.pointer.update();

    	for ( let i = 0; i < this.layers.length; i ++ ) {

    		this.layers[ i ].tick( deltaTime );

    	}

    	requestAnimationFrame( this.tick.bind( this ) );

	}

	public getLayer( layerName: string ) {

    	for ( let i = 0; i < this.layers.length; i ++ ) {

    		if ( this.layers[ i ].info.name == layerName ) return this.layers[ i ];

    	}

    	return null;

	}

	public addLayer( layer: BaseLayer, layerInfo: LayerBindParam ) {

    	while ( this.getLayer( layerInfo.name ) ) {

    		layerInfo.name += '_';

    	}

    	layer.onBind( layerInfo );
    	this.layers.push( layer );

	}

	public removeLayer( layerNmae: string ) {

    	for ( let i = this.layers.length - 1; i >= 0; i -- ) {

    		const layer = this.layers[ i ];

    		if ( layer.info.name == layerNmae ) {

    			this.layers.splice( i, 1 );

    		}

    	}

	}

	protected onWindowResize() {

    	for ( let i = 0; i < this.layers.length; i ++ ) {

    		this.layers[ i ].onResize();

    	}

	}

	protected onOrientationDevice() {

    	this.onWindowResize();

	}

	protected pointerEvent( e: THREE.Event ) {

    	for ( let i = 0; i < this.layers.length; i ++ ) {

    		this.layers[ i ].pointerEvent( e as unknown as PointerEventArgs );

    	}

	}

	protected onWheel( e: THREE.Event ) {

    	for ( let i = 0; i < this.layers.length; i ++ ) {

    		this.layers[ i ].onWheel( e.wheelEvent, e.trackpadDelta );

    	}

	}

	public dispose() {

		this.dispatchEvent( { type: 'dispose' } );

		this.tick = () => {

			return;

		};

	}

}
