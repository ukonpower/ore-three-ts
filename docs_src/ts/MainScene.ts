import * as THREE from 'three';
import * as ORE from '@ore-three-ts';

import backgroundFrag from './shaders/background.fs';
import MainObj from './MainObj';
import { ScrollManager } from './ScrollManager';
import { AssetManager } from './AssetManager';

export class MainScene extends ORE.BaseScene {

	private mainObj: MainObj;

	private background: ORE.Background;
	private commonUniforms: ORE.Uniforms;

	private scrollManager: ScrollManager;
	private isExamplePage: boolean = false;

	private assetManager: AssetManager;
	private spWeight: number = 0.0;

	constructor() {

		super();

		this.commonUniforms = {
			time: {
				value: 0
			},
			objTransform: {
				value: 0
			},
			objSelector: {
				value: 0
			},
			spWeight: {
				value: 0
			}
		};

		this.isExamplePage = window.location.href.indexOf( 'examples' ) != - 1;

		if ( ! this.isExamplePage ) {

			this.initScroller();

			this.assetManager = new AssetManager( {
				onMustAssetLoaded: () => {

					this.initScene();

				}
			} );

			window.assetManager = this.assetManager;

		} else {

			document.body.setAttribute( 'data-useScroller', 'false' );

			this.initScene();

		}

		document.querySelector( '.ui-menu-button' ).addEventListener( 'click', ( e ) => {

			document.body.setAttribute( 'data-menu-open', document.body.getAttribute( 'data-menu-open' ) == 'true' ? 'false' : 'true' );

		} );

		// this.scrollManager.scroller.autoMove( {
		// 	target: 'usage',
		// 	duration: 0.01
		// } );

	}

	public onBind( gProps: ORE.GlobalProperties ) {

		super.onBind( gProps );

		let aLight = new THREE.AmbientLight();
		aLight.intensity = 0.4;
		this.scene.add( aLight );

		let dLight = new THREE.DirectionalLight();
		dLight.intensity = 0.7;
		dLight.position.set( 0.1, 10, 2 );
		this.scene.add( dLight );

	}

	private initScene() {

		if ( ! this.isExamplePage ) {

			this.mainObj = new MainObj( this.commonUniforms );
			this.scene.add( this.mainObj.obj );

		}

		this.background = new ORE.Background( {
			fragmentShader: backgroundFrag,
			uniforms: this.commonUniforms
		} );
		this.background.renderOrder = - 100;

		this.scene.add( this.background );

	}

	private initScroller() {

		this.scrollManager = new ScrollManager( this );

	}

	public animate( deltaTime: number ) {

		this.commonUniforms.time.value = this.time;

		if ( ! this.isExamplePage && this.assetManager.isLoaded ) {

			this.scrollManager.scroller.update( deltaTime );
			this.scrollManager.timeline.update( this.scrollManager.scroller.scrollTimelinePercentage );

			this.commonUniforms.objTransform.value = this.scrollManager.timeline.get<number>( 'objTransform' );
			this.commonUniforms.objSelector.value = this.scrollManager.timeline.get<number>( 'objSelector' );

			this.camera.position.copy( this.scrollManager.timeline.get<THREE.Vector3>( 'camPos' ) );
			this.camera.quaternion.copy( this.scrollManager.timeline.get<THREE.Quaternion>( 'camRot' ) );

			this.camera.position.x *= this.spWeight;

			this.mainObj.update( this.time );

		}

		this.renderer.render( this.scene, this.camera );

	}

	public onResize( args: ORE.ResizeArgs ) {

		super.onResize( args );

		this.spWeight = Math.min( 1.0, Math.max( 0.0, ( this.gProps.resizeArgs.windowSize.x - 500 ) / 1000 ) );

		this.commonUniforms.spWeight.value = this.spWeight;

		this.background && this.background.resize( args );

	}

	public onWheel( e: WheelEvent, trackPadDelta: number ) {

		this.scrollManager && this.scrollManager.scroller.scroll( trackPadDelta );

	}

	public onTouchStart( cursor: ORE.Cursor, e: MouseEvent ) {

		this.scrollManager && this.scrollManager.scroller.catch();

	}

	public onTouchMove( cursor: ORE.Cursor, e: MouseEvent ) {

		this.scrollManager && this.scrollManager.scroller.drag( - cursor.delta.y );

	}

	public onTouchEnd( cursor: ORE.Cursor ) {

		this.scrollManager && this.scrollManager.scroller.release();

	}

}
