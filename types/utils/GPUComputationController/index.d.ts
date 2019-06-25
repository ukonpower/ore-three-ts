import * as THREE from 'three';
import { Uniforms } from '../../shaders/shader';
export interface GPUComputationKernel {
    material: THREE.RawShaderMaterial;
    uniforms: Uniforms;
}
export interface GPUcomputationData {
    buffer: THREE.WebGLRenderTarget;
}
export declare class GPUComputationController {
    private renderer;
    private resolution;
    private scene;
    private camera;
    private mesh;
    private tempData;
    readonly isSupported: boolean;
    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector2);
    createData(): GPUcomputationData;
    createKernel(shader: string): GPUComputationKernel;
    compute(kernel: GPUComputationKernel, variable: GPUcomputationData): void;
    private swapBuffers;
}