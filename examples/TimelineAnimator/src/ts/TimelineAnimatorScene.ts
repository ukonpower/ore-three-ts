import * as THREE from 'three';
import * as ORE from '@ore-three-ts';

export class TimelineAnimatorScene extends ORE.BaseLayer {

	private box?: THREE.Mesh;
	private timelineAnimator?: ORE.TimelineAnimator;

	constructor() {

		super();

	}

	public onBind( info: ORE.LayerInfo ) {

		super.onBind( info );

		this.camera.position.set( 0, 1.5, 6 );
		this.camera.lookAt( 0, 0, 0 );

		this.box = new THREE.Mesh( new THREE.BoxGeometry(), new THREE.MeshNormalMaterial() );
		this.scene.add( this.box );

		this.initTimeline();

	}

	private initTimeline() {

		this.timelineAnimator = new ORE.TimelineAnimator();

		this.timelineAnimator.add<THREE.Vector3>( {
			name: 'pos',
			keyframes: [
				{
					time: 0.0,
					value: new THREE.Vector3( 0, 0, 0 )
				},
				{
					time: 0.3,
					value: new THREE.Vector3( 1, 0, 0 )
				},
				{
					time: 0.5,
					value: new THREE.Vector3( 0, 1, 0 )
				},
				{
					time: 0.6,
					value: new THREE.Vector3( - 1, 0, 0 )
				},
				{
					time: 1.0,
					value: new THREE.Vector3( 0, 0, 0 )
				}
			],
			easing: {
				func: ORE.Easings.sigmoid,
				args: 6
			}
		} );

		this.timelineAnimator.add<THREE.Quaternion>( {
			name: 'rot',
			keyframes: [
				{
					time: 0.0,
					value: new THREE.Quaternion().setFromEuler( new THREE.Euler( 0, Math.PI / 4, 0 ) )
				},
				{
					time: 0.3,
					value: new THREE.Quaternion().setFromEuler( new THREE.Euler( 0, Math.PI, 0 ) )
				},
				{
					time: 0.5,
					value: new THREE.Quaternion().setFromEuler( new THREE.Euler( Math.PI, Math.PI, 0 ) )
				},
				{
					time: 0.6,
					value: new THREE.Quaternion().setFromEuler( new THREE.Euler( 0, - Math.PI, 0 ) )
				},
				{
					time: 1.0,
					value: new THREE.Quaternion().setFromEuler( new THREE.Euler( 0, 0, 0 ) )
				}
			],
			easing: {
				func: ORE.Easings.sigmoid,
				args: 3
			}
		} );

		this.timelineAnimator.add<number>( {
			name: 'size',
			keyframes: [
				{
					time: 0.0,
					value: 1.0
				},
				{
					time: 0.3,
					value: 0.3
				},
				{
					time: 0.5,
					value: 1.0
				},
				{
					time: 0.6,
					value: 0.3
				},
				{
					time: 1.0,
					value: 1.0
				}
			],
			easing: {
				func: ORE.Easings.sigmoid,
				args: 3
			}
		} );

		let sliderElm = document.querySelector( '#slider' );
		if ( sliderElm ) {

			sliderElm.addEventListener( 'input', ( e ) => {

				let value = Number( ( e.target as HTMLInputElement ).value ) / Number( ( e.target as HTMLInputElement ).max );

				if ( this.timelineAnimator ) {

					this.timelineAnimator.update( value );

				}

			} );

		}

	}

	public animate( deltaTime: number ) {

		if ( this.box && this.timelineAnimator ) {

			let pos = this.timelineAnimator.get<THREE.Vector3>( 'pos' );

			if ( pos ) {

				this.box.position.copy( pos );

			}

			let rot = this.timelineAnimator.get<THREE.Quaternion>( 'rot' );

			if ( rot ) {

				this.box.quaternion.copy( rot );

			}

			let size = this.timelineAnimator.get<number>( 'size' );

			if ( size ) {

				this.box.scale.setScalar( size );

			}

		}

		if ( this.renderer ) {

			this.renderer.render( this.scene, this.camera );

		}

	}

}
