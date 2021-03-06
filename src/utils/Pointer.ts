import * as THREE from "three";

const { Lethargy } = require( 'lethargy' );
const toPx = require( 'to-px' );

export class Pointer extends THREE.EventDispatcher {

	protected isSP: boolean;
	protected isTouching: boolean;

	public position: THREE.Vector2;
	public delta: THREE.Vector2;

	constructor() {

		super();

		this.position = new THREE.Vector2( NaN, NaN );
		this.delta = new THREE.Vector2( NaN, NaN );

		const userAgent = navigator.userAgent;
		this.isSP = userAgent.indexOf( 'iPhone' ) >= 0 || userAgent.indexOf( 'iPad' ) >= 0 || userAgent.indexOf( 'Android' ) >= 0 || navigator.platform == "iPad" || ( navigator.platform == "MacIntel" && navigator.userAgent.indexOf( "Safari" ) != - 1 && navigator.userAgent.indexOf( "Chrome" ) == - 1 && ( navigator as any ).standalone !== undefined );

		window.addEventListener( 'touchstart', this.onTouch.bind( this, "start" ), { passive: false } );
		window.addEventListener( 'touchmove', this.onTouch.bind( this, "move" ), { passive: false } );
		window.addEventListener( 'touchend', this.onTouch.bind( this, "end" ), { passive: false } );

		window.addEventListener( 'pointerdown', this.onPointer.bind( this, "start" ) );
		window.addEventListener( 'pointermove', this.onPointer.bind( this, "move" ) );
		window.addEventListener( 'pointerup', this.onPointer.bind( this, "end" ) );
		window.addEventListener( "dragend", this.onPointer.bind( this, "end" ) );
		window.addEventListener( "wheel", this.wheel.bind( this ), { passive: false } );

		this.position.set( NaN, NaN );
		this.isTouching = false;

	}

	public getNormalizePosition( windowSize: THREE.Vector2 ) {

		if ( this.position.x != this.position.x ) return new THREE.Vector2( NaN, NaN );

		const p = this.position.clone()
			.divide( windowSize )
			.multiplyScalar( 2.0 )
			.subScalar( 1.0 );
		p.y *= - 1;

		return p;

	}

	public getRelativePosition( elm: HTMLElement, normalize?: boolean ) {

		const rect: DOMRect = elm.getClientRects()[ 0 ] as DOMRect;

		let x = this.position.x - rect.left;
		let y = this.position.y - rect.top;

		if ( normalize ) {

			x /= rect.width;
			y /= rect.height;

		}

		const p = new THREE.Vector2( x, y );

		return p;

	}

	protected setPos( x: number, y: number ) {

		if (
			this.position.x !== this.position.x ||
			this.position.y !== this.position.y
		) {

			this.delta.set( 0, 0 );

		} else {

			this.delta.set( x - this.position.x, y - this.position.y );

		}

		this.position.set( x, y );

	}

	protected onTouch( type: string, e: TouchEvent ) {

		const touch = e.touches[ 0 ];

		if ( touch ) {

			this.touchEventHandler( touch.pageX, touch.pageY, type, e );

		} else {

			if ( type == 'end' ) {

				this.touchEventHandler( NaN, NaN, type, e );

			}

		}

	}

	protected onPointer( type: string, e: PointerEvent | DragEvent ) {

		const pointerType = ( e as PointerEvent ).pointerType;

		if ( pointerType != null ) {

			if ( pointerType == 'mouse' && ( e.button == - 1 || e.button == 0 ) ) {

				this.touchEventHandler( e.pageX, e.pageY, type, e as PointerEvent );

			}

		} else {

			this.touchEventHandler( e.pageX, e.pageY, type, e );

		}



	}

	protected touchEventHandler( posX: number, posY: number, type: string, e: Event ) {

		let dispatch = false;

		const x = posX - window.pageXOffset;
		const y = posY - window.pageYOffset;

		if ( type == "start" ) {

			this.isTouching = true;

			this.setPos( x, y );

			this.delta.set( 0, 0 );

			dispatch = true;

		} else if ( type == "move" ) {

			this.setPos( x, y );

			if ( this.isTouching ) {

				dispatch = true;

			}

		} else if ( type == "end" ) {

			this.isTouching = false;

			dispatch = true;

		}

		if ( dispatch ) {

			this.dispatchEvent( {
				type: 'update',
				pointerEvent: e,
				pointerEventType: type,
				position: this.position.clone(),
				delta: this.delta.clone()
			} );

		}

	}

	public update() {

		if ( ! this.isSP ) {

			this.dispatchEvent( {
				type: 'update',
				pointerEvent: null,
				pointerEventType: 'hover',
				position: this.position.clone(),
				delta: this.delta.clone()
			} );

		}

	}

	protected trackpadMemDelta = 0;
	protected trackpadMax = false;

	protected lethargy = new Lethargy( 7, 0, 0.05 );

	protected wheel( e: WheelEvent ) {

		let delta = e.deltaY;
		let trackpadDelta = 0;

		switch ( e.deltaMode ) {

			case e.DOM_DELTA_LINE:
				delta *= toPx( 'ex', window ) * 2.5;
				break;

			case e.DOM_DELTA_PAGE:
				delta *= window.innerHeight;
				break;

		}

		if ( this.lethargy.check( e ) ) {

			trackpadDelta = delta;

		}

		this.dispatchEvent( {
			type: 'wheel',
			wheelEvent: e,
			trackpadDelta: trackpadDelta
		} );

	}

}
