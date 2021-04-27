import * as THREE from 'three';
import * as ORE from '@ore-three-ts';

import positionFrag from './shaders/position.fs';
import velocityFrag from './shaders/velocity.fs';

import pointVert from './shaders/point.vs';
import pointFrag from './shaders/point.fs';

import viewerVert from './shaders/viewer.vs';
import viewerFrag from './shaders/viewer.fs';

declare interface Kernels{
    velocity: ORE.GPUComputationKernel,
    position: ORE.GPUComputationKernel
}

declare interface Datas{
    velocity: ORE.GPUcomputationData,
    position: ORE.GPUcomputationData
}

export class GPUComputationControllerScene extends ORE.BaseLayer {

	private pointUni?: ORE.Uniforms;

	private gCon?: ORE.GPUComputationController;
	private kernels?: Kernels;
	private datas?: Datas;
	private points?: THREE.Points;

	constructor() {

		super();

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			time: {
				value: 0
			},
			seed: {
				value: Math.random() * 1000.0
			}
		} );

	}

	public onBind( gProps: ORE.LayerInfo ) {

		super.onBind( gProps );

		this.camera.position.set( 0, 0, 10 );
		this.camera.lookAt( 0, 0, 0 );

		let size = new THREE.Vector2( 256, 256 );

		this.initGPUComputationController( size );
		this.createPoints( size );

	}

	private initGPUComputationController( size: THREE.Vector2 ) {

		if ( this.renderer == null ) return;

		this.gCon = new ORE.GPUComputationController( this.renderer, size );

		//create computing position kernel
		let posUni = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			dataPos: { value: null },
			dataVel: { value: null },
		} );

		let posKernel = this.gCon.createKernel( {
			fragmentShader: positionFrag,
			uniforms: posUni
		} );

		//create computing velocity kernel
		let velUni = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			dataPos: { value: null },
			dataVel: { value: null },
		} );

		let velKernel = this.gCon.createKernel( {
			fragmentShader: velocityFrag,
			uniforms: velUni
		} );

		this.kernels = {
			position: posKernel,
			velocity: velKernel,
		};

		this.datas = {
			position: this.gCon.createData(),
			velocity: this.gCon.createData(),
		};

	}

	private createPoints( size: THREE.Vector2 ) {

		let geo = new THREE.BufferGeometry();

		let uvArray = [];
		let posArray = [];

		for ( let i = 0; i < size.y; i ++ ) {

			for ( let j = 0; j < size.x; j ++ ) {

				posArray.push( 0, 0, 0 );

				uvArray.push(
					j / ( size.x - 1.0 ), i / ( size.y - 1.0 )
				);

			}

		}

		geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( posArray ), 3 ) );
		geo.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvArray ), 2 ) );

		this.pointUni = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			posTex: {
				value: null
			},
			velTex: {
				value: null
			},
		} );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: pointVert,
			fragmentShader: pointFrag,
			uniforms: this.pointUni
		} );

		this.points = new THREE.Points( geo, mat );
		this.scene.add( this.points );

		let vSize = 2.0;

		let velViewer = new THREE.Mesh( new THREE.PlaneGeometry( vSize, vSize ), new THREE.ShaderMaterial( {
			fragmentShader: viewerFrag,
			vertexShader: viewerVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.pointUni, { selector: { value: 0 } } )
		} ) );

		velViewer.position.x = 1.5;

		// this.scene.add( velViewer );

		let posViewer = new THREE.Mesh( new THREE.PlaneGeometry( vSize, vSize ), new THREE.ShaderMaterial( {
			fragmentShader: viewerFrag,
			vertexShader: viewerVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.pointUni, { selector: { value: 1 } } )
		} ) );

		posViewer.position.x = - 1.5;

		// this.scene.add( posViewer );

	}

	public animate( deltaTime: number ) {

		this.commonUniforms.time.value = this.time;

		//update velocity
		if ( this.kernels && this.datas && this.pointUni && this.gCon ) {

			this.kernels.velocity.uniforms.dataPos.value = this.datas.position.buffer.texture;
			this.kernels.velocity.uniforms.dataVel.value = this.datas.velocity.buffer.texture;

			this.gCon.compute( this.kernels.velocity, this.datas.velocity );

			//update position
			this.kernels.position.uniforms.dataPos.value = this.datas.position.buffer.texture;
			this.kernels.position.uniforms.dataVel.value = this.datas.velocity.buffer.texture;

			this.gCon.compute( this.kernels.position, this.datas.position );

			this.pointUni.posTex.value = this.datas.position.buffer.texture;
			this.pointUni.velTex.value = this.datas.velocity.buffer.texture;

		}

		if ( this.renderer ) {

			this.renderer.render( this.scene, this.camera );

		}

	}

}
